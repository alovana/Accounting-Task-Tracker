"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type QueueTestNotificationState = {
  success?: boolean;
  message?: string;
  error?: string;
};

export async function queueLineTestNotificationAction(
  _prevState: QueueTestNotificationState,
  formData: FormData,
): Promise<QueueTestNotificationState> {
  const message = String(formData.get("message") || "").trim();

  if (!message) {
    return { error: "กรุณากรอกข้อความทดสอบ" };
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("line_notifications").insert({
    event_type: "completed",
    target_type: "work_item",
    message,
    status: "queued",
  });

  if (error) {
    return { error: error.message || "บันทึก test notification ไม่สำเร็จ" };
  }

  revalidatePath("/settings");

  return {
    success: true,
    message: "เพิ่ม test LINE notification เข้าคิวแล้ว",
  };
}
