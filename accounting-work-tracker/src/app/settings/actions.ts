"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/session";
import { ROLE_OPTIONS, type AppRole } from "@/lib/constants";
import { dispatchQueuedLineNotifications } from "@/lib/line/dispatcher";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type CreateUserActionState = {
  success?: string;
  error?: string;
};

type QueueTestNotificationState = {
  success?: boolean;
  message?: string;
  error?: string;
};

type DispatchLineQueueState = {
  success?: boolean;
  message?: string;
  error?: string;
};

const initialState: CreateUserActionState = {};

function isValidRole(role: string): role is AppRole {
  return ROLE_OPTIONS.includes(role as AppRole);
}

export async function createUserAction(
  _prevState: CreateUserActionState = initialState,
  formData: FormData,
): Promise<CreateUserActionState> {
  await requirePermission("manage_settings");

  const fullName = String(formData.get("fullName") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "").trim();
  const role = String(formData.get("role") || "").trim();

  if (!fullName || !email || !password || !role) {
    return { error: "กรุณากรอกชื่อ, อีเมล, รหัสผ่าน และบทบาทให้ครบ" };
  }

  if (!isValidRole(role)) {
    return { error: "บทบาทที่เลือกไม่ถูกต้อง" };
  }

  if (password.length < 8) {
    return { error: "รหัสผ่านควรมีอย่างน้อย 8 ตัวอักษร" };
  }

  const supabase = getSupabaseServerClient();

  const { data: existingProfile } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingProfile) {
    return { error: "อีเมลนี้มีอยู่ในระบบแล้ว" };
  }

  const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
    },
  });

  if (createError || !createdUser.user) {
    console.error("Failed to create auth user", createError);
    return { error: createError?.message || "ไม่สามารถสร้างผู้ใช้งานได้" };
  }

  const { error: profileError } = await supabase.from("user_profiles").insert({
    id: createdUser.user.id,
    email,
    full_name: fullName,
    role,
    active: true,
  });

  if (profileError) {
    console.error("Failed to create user profile", profileError);
    await supabase.auth.admin.deleteUser(createdUser.user.id);
    return { error: "สร้างบัญชีสำเร็จ แต่บันทึก role profile ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" };
  }

  revalidatePath("/settings");

  return {
    success: `สร้างผู้ใช้งาน ${email} เรียบร้อยแล้ว`,
  };
}

export async function queueLineTestNotificationAction(
  _prevState: QueueTestNotificationState,
  formData: FormData,
): Promise<QueueTestNotificationState> {
  await requirePermission("manage_settings");

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

export async function dispatchLineQueueAction(
  _prevState: DispatchLineQueueState,
): Promise<DispatchLineQueueState> {
  await requirePermission("manage_settings");

  try {
    const result = await dispatchQueuedLineNotifications();

    revalidatePath("/settings");

    if (result.attempted === 0) {
      return {
        success: true,
        message: "ไม่มีรายการ queued ใน line_notifications",
      };
    }

    const parts = [
      `ตรวจสอบ ${result.attempted} รายการ`,
      `ส่งสำเร็จ ${result.sent}`,
      `ล้มเหลว ${result.failed}`,
    ];

    if (result.skipped > 0) {
      parts.push(`ข้าม ${result.skipped}`);
    }

    if (result.configError) {
      parts.push(`config error: ${result.configError}`);
    }

    return {
      success: result.failed === 0,
      message: parts.join(" | "),
      error: result.failed > 0 ? "มีบางรายการส่งไม่สำเร็จ กรุณาตรวจสอบ Failed Deliveries" : undefined,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "ไม่สามารถ dispatch LINE queue ได้",
    };
  }
}
