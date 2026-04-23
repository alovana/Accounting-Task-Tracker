"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type UpdateCustomerAssignmentsActionState = {
  success?: string;
  error?: string;
};

const ACTIVE_WORK_ITEM_STATUSES = ["not_started", "in_progress", "waiting_customer", "blocked"];

function normalizeOptionalUuid(value: FormDataEntryValue | null) {
  const normalized = String(value || "").trim();
  return normalized || null;
}

export async function updateCustomerAssignmentsAction(
  _prevState: UpdateCustomerAssignmentsActionState,
  formData: FormData,
): Promise<UpdateCustomerAssignmentsActionState> {
  await requirePermission("manage_customers");

  const customerId = String(formData.get("customerId") || "").trim();
  const assignedUserId = normalizeOptionalUuid(formData.get("assignedUserId"));
  const managerUserId = normalizeOptionalUuid(formData.get("managerUserId"));

  if (!customerId) {
    return { error: "ไม่พบลูกค้าที่ต้องการอัปเดต" };
  }

  const supabase = getSupabaseServerClient();

  const [customerResult, staffProfilesResult, managerProfilesResult] = await Promise.all([
    supabase
      .from("customers")
      .select("id, name")
      .eq("id", customerId)
      .maybeSingle(),
    assignedUserId
      ? supabase.from("user_profiles").select("id, active").eq("id", assignedUserId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    managerUserId
      ? supabase.from("user_profiles").select("id, role, active").eq("id", managerUserId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (customerResult.error || !customerResult.data) {
    return { error: customerResult.error?.message || "ไม่พบข้อมูลลูกค้า" };
  }

  if (staffProfilesResult.error) {
    return { error: staffProfilesResult.error.message || "ตรวจสอบผู้รับผิดชอบไม่สำเร็จ" };
  }

  if (managerProfilesResult.error) {
    return { error: managerProfilesResult.error.message || "ตรวจสอบผู้จัดการไม่สำเร็จ" };
  }

  if (assignedUserId && !staffProfilesResult.data?.active) {
    return { error: "ผู้รับผิดชอบหลักต้องเป็นผู้ใช้งานที่ active" };
  }

  if (managerUserId) {
    const role = managerProfilesResult.data?.role;
    if (!managerProfilesResult.data?.active || (role !== "admin" && role !== "manager")) {
      return { error: "ผู้จัดการต้องเป็นผู้ใช้งาน role admin หรือ manager และ active เท่านั้น" };
    }
  }

  const { error: customerUpdateError } = await supabase
    .from("customers")
    .update({
      assigned_user_id: assignedUserId,
      manager_user_id: managerUserId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", customerId);

  if (customerUpdateError) {
    return { error: customerUpdateError.message || "อัปเดตลูกค้าไม่สำเร็จ" };
  }

  const profileIds = [assignedUserId, managerUserId].filter((value): value is string => Boolean(value));
  const profileNameMap = new Map<string, string>();

  if (profileIds.length > 0) {
    const { data: profiles, error: profileLookupError } = await supabase
      .from("user_profiles")
      .select("id, full_name, email")
      .in("id", profileIds);

    if (profileLookupError) {
      return { error: profileLookupError.message || "โหลดข้อมูลชื่อผู้รับผิดชอบไม่สำเร็จ" };
    }

    for (const profile of profiles || []) {
      profileNameMap.set(profile.id, profile.full_name?.trim() || profile.email || "-");
    }
  }

  const { data: customerCycles, error: cycleError } = await supabase
    .from("work_cycles")
    .select("id")
    .eq("customer_id", customerId);

  if (cycleError) {
    return { error: cycleError.message || "โหลดรอบงานของลูกค้าไม่สำเร็จ" };
  }

  const cycleIds = (customerCycles || []).map((item) => item.id).filter(Boolean);

  if (cycleIds.length > 0) {
    const { data: workItems, error: workItemsError } = await supabase
      .from("work_items")
      .select("id, template_item_id, status")
      .in("work_cycle_id", cycleIds)
      .in("status", ACTIVE_WORK_ITEM_STATUSES);

    if (workItemsError) {
      return { error: workItemsError.message || "โหลด work items ไม่สำเร็จ" };
    }

    const templateItemIds = Array.from(
      new Set((workItems || []).map((item) => item.template_item_id).filter((value): value is string => Boolean(value))),
    );

    const templateRoleMap = new Map<string, "staff" | "manager">();

    if (templateItemIds.length > 0) {
      const { data: templateItems, error: templateItemsError } = await supabase
        .from("checklist_template_items")
        .select("id, default_assignee_role")
        .in("id", templateItemIds);

      if (templateItemsError) {
        return { error: templateItemsError.message || "โหลดประเภทผู้รับผิดชอบของงานไม่สำเร็จ" };
      }

      for (const item of templateItems || []) {
        templateRoleMap.set(
          item.id,
          item.default_assignee_role === "manager" || item.default_assignee_role === "admin"
            ? "manager"
            : "staff",
        );
      }
    }

    const workItemUpdates = (workItems || []).map((item) => {
      const role = templateRoleMap.get(item.template_item_id) || "staff";
      const nextProfileId = role === "manager" ? managerUserId : assignedUserId;
      const nextName = nextProfileId ? profileNameMap.get(nextProfileId) || "-" : "-";

      return supabase
        .from("work_items")
        .update({
          assigned_user_id: nextProfileId,
          assigned_to_name: nextName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);
    });

    const results = await Promise.all(workItemUpdates);
    const failedResult = results.find((result) => result.error);

    if (failedResult?.error) {
      return { error: failedResult.error.message || "ซิงก์ผู้รับผิดชอบใน work items ไม่สำเร็จ" };
    }
  }

  revalidatePath("/customers");
  revalidatePath("/work-cycles");
  revalidatePath("/dashboard");

  return {
    success: `อัปเดต assignment ของ ${customerResult.data.name} เรียบร้อยแล้ว`,
  };
}
