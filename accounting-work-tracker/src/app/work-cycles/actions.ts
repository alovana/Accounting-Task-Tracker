"use server";

import { revalidatePath } from "next/cache";
import { getRecommendedCycleStatus } from "@/lib/phase3/selectors";
import { getNextAllowedStatuses } from "@/lib/phase3/status-mappers";
import { getWorkCycles, getNotificationRules, getWorkItems } from "@/lib/supabase/queries";
import { buildLineNotificationMessage } from "@/lib/phase5/line-message";
import { dispatchQueuedLineNotifications } from "@/lib/line/dispatcher";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { WorkItemStatus } from "@/lib/mock/phase3-data";
import type { NotificationEventType } from "@/types/notifications";

type UpdateStatusActionState = {
  success?: boolean;
  message?: string;
  error?: string;
};

async function attemptAutomaticLineDispatch(context: {
  workItemId: string;
  workCycleId: string;
  eventType: NotificationEventType;
  nextStatus: WorkItemStatus;
}) {
  try {
    const result = await dispatchQueuedLineNotifications();

    if (result.failed > 0 || result.configError) {
      console.error("Automatic LINE dispatch completed with delivery issues", {
        ...context,
        ...result,
      });
    }
  } catch (error) {
    console.error("Automatic LINE dispatch failed", {
      ...context,
      error: error instanceof Error ? error.message : error,
    });
  }
}

export async function updateWorkItemStatusAction(
  _prevState: UpdateStatusActionState,
  formData: FormData,
): Promise<UpdateStatusActionState> {
  const workItemId = String(formData.get("workItemId") || "");
  const workCycleId = String(formData.get("workCycleId") || "");
  const currentStatus = String(formData.get("currentStatus") || "") as WorkItemStatus;
  const nextStatus = String(formData.get("nextStatus") || "") as WorkItemStatus;
  const comment = String(formData.get("comment") || "").trim();
  const updatedBy = String(formData.get("updatedBy") || "manager").trim() || "manager";

  if (!workItemId || !workCycleId || !currentStatus || !nextStatus) {
    return { error: "ข้อมูลไม่ครบ" };
  }

  if (!getNextAllowedStatuses(currentStatus).includes(nextStatus)) {
    return { error: "สถานะถัดไปไม่ถูกต้อง" };
  }

  if ((nextStatus === "blocked" || nextStatus === "waiting_customer") && comment === "") {
    return { error: "กรุณาระบุหมายเหตุสำหรับสถานะนี้" };
  }

  const supabase = getSupabaseServerClient();

  const { error: workItemError } = await supabase
    .from("work_items")
    .update({
      status: nextStatus,
      blocked_reason: nextStatus === "blocked" ? comment : null,
      note: comment || null,
      updated_by: updatedBy,
      updated_at: new Date().toISOString(),
      completed_at: nextStatus === "completed" ? new Date().toISOString() : null,
      started_at: currentStatus === "not_started" && nextStatus === "in_progress" ? new Date().toISOString() : null,
    })
    .eq("id", workItemId);

  if (workItemError) {
    return { error: workItemError.message || "อัปเดต work item ไม่สำเร็จ" };
  }

  const { error: updateLogError } = await supabase.from("work_item_updates").insert({
    work_item_id: workItemId,
    old_status: currentStatus,
    new_status: nextStatus,
    comment,
    updated_by: updatedBy,
  });

  if (updateLogError) {
    return { error: updateLogError.message || "บันทึกประวัติไม่สำเร็จ" };
  }

  const [workItems, workCycles, notificationRules] = await Promise.all([
    getWorkItems(),
    getWorkCycles(),
    getNotificationRules(),
  ]);
  const cycleItems = workItems
    .filter((item) => item.workCycleId === workCycleId)
    .map((item) =>
      item.id === workItemId
        ? {
            ...item,
            status: nextStatus,
            blockedReason: nextStatus === "blocked" ? comment : undefined,
            note: comment || undefined,
          }
        : item,
    );
  const updatedWorkItem = cycleItems.find((item) => item.id === workItemId);
  const workCycle = workCycles.find((item) => item.id === workCycleId);
  const recommendedStatus = getRecommendedCycleStatus(cycleItems);

  const { error: cycleError } = await supabase
    .from("work_cycles")
    .update({
      status: recommendedStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", workCycleId);

  if (cycleError) {
    return { error: cycleError.message || "อัปเดต work cycle ไม่สำเร็จ" };
  }

  const eventTypeMap: Partial<Record<WorkItemStatus, NotificationEventType>> = {
    completed: "completed",
    blocked: "blocked",
  };
  const eventType = eventTypeMap[nextStatus];
  const shouldQueueLineNotification = notificationRules.some(
    (rule) => rule.enabled && rule.channel === "line_oa" && rule.eventType === eventType,
  );

  if (eventType && updatedWorkItem && shouldQueueLineNotification) {
    const message = buildLineNotificationMessage({
      eventType,
      customerName: workCycle?.customerName ?? "-",
      workItemTitle: updatedWorkItem.title,
      blockedReason: nextStatus === "blocked" ? comment : undefined,
      dueDate: updatedWorkItem.dueDate,
    });

    const { error: notificationError } = await supabase.from("line_notifications").insert({
      event_type: eventType,
      target_type: "work_item",
      target_id: workItemId,
      message,
      status: "queued",
    });

    if (notificationError) {
      return { error: notificationError.message || "เพิ่มคิว LINE notification ไม่สำเร็จ" };
    }

    await attemptAutomaticLineDispatch({
      workItemId,
      workCycleId,
      eventType,
      nextStatus,
    });
  }

  revalidatePath("/work-cycles");
  revalidatePath("/dashboard");
  revalidatePath("/settings");

  return {
    success: true,
    message: `อัปเดตสถานะเป็น ${nextStatus} เรียบร้อยแล้ว`,
  };
}
