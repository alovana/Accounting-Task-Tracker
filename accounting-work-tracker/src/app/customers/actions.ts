"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { ServiceStatus } from "@/types/domain";

export type CustomerActionState = {
  success?: string;
  error?: string;
};

export type UpdateCustomerAssignmentsActionState = CustomerActionState;
export type CreateCustomerActionState = CustomerActionState;

const ACTIVE_WORK_ITEM_STATUSES = ["not_started", "in_progress", "waiting_customer", "blocked"];
const SERVICE_STATUS_OPTIONS: ServiceStatus[] = ["active", "onboarding", "paused"];
const initialState: CustomerActionState = {};

function shouldUseMockData() {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY;
}

function normalizeText(value: FormDataEntryValue | null) {
  return String(value || "").trim();
}

function normalizeOptionalUuid(value: FormDataEntryValue | null) {
  const normalized = normalizeText(value);
  return normalized || null;
}

function normalizeBoolean(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

function isValidServiceStatus(status: string): status is ServiceStatus {
  return SERVICE_STATUS_OPTIONS.includes(status as ServiceStatus);
}

function revalidateCustomerPaths() {
  revalidatePath("/customers");
  revalidatePath("/work-cycles");
  revalidatePath("/dashboard");
}

function mockModeError(message: string): CustomerActionState {
  return { error: message };
}

async function validateAssignmentProfiles(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  assignedUserId: string | null,
  managerUserId: string | null,
): Promise<CustomerActionState | null> {
  const [staffProfilesResult, managerProfilesResult] = await Promise.all([
    assignedUserId
      ? supabase.from("user_profiles").select("id, active").eq("id", assignedUserId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    managerUserId
      ? supabase.from("user_profiles").select("id, role, active").eq("id", managerUserId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

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

  return null;
}

export async function createCustomerAction(
  _prevState: CreateCustomerActionState = initialState,
  formData: FormData,
): Promise<CreateCustomerActionState> {
  await requirePermission("manage_customers");

  if (shouldUseMockData()) {
    return mockModeError("โหมดตัวอย่างยังไม่รองรับการเพิ่มลูกค้า กรุณาเชื่อมต่อ Supabase ก่อน");
  }

  const code = normalizeText(formData.get("code"));
  const name = normalizeText(formData.get("name"));
  const taxId = normalizeText(formData.get("taxId"));
  const businessTypeId = normalizeText(formData.get("businessTypeId"));
  const serviceStatus = normalizeText(formData.get("serviceStatus"));
  const notes = normalizeText(formData.get("notes"));
  const active = normalizeBoolean(formData.get("active"));
  const assignedUserId = normalizeOptionalUuid(formData.get("assignedUserId"));
  const managerUserId = normalizeOptionalUuid(formData.get("managerUserId"));

  if (!code || !name || !taxId || !businessTypeId || !serviceStatus) {
    return { error: "กรุณากรอกข้อมูลลูกค้าให้ครบถ้วน" };
  }

  if (!isValidServiceStatus(serviceStatus)) {
    return { error: "สถานะบริการไม่ถูกต้อง" };
  }

  const supabase = getSupabaseServerClient();

  const [{ data: businessType, error: businessTypeError }, validationError] = await Promise.all([
    supabase.from("business_types").select("id, name").eq("id", businessTypeId).maybeSingle(),
    validateAssignmentProfiles(supabase, assignedUserId, managerUserId),
  ]);

  if (businessTypeError || !businessType) {
    return { error: businessTypeError?.message || "ไม่พบประเภทธุรกิจที่เลือก" };
  }

  if (validationError) {
    return validationError;
  }

  const { error } = await supabase.from("customers").insert({
    code,
    name,
    tax_id: taxId,
    business_type_id: businessTypeId,
    assigned_user_id: assignedUserId,
    manager_user_id: managerUserId,
    service_status: serviceStatus,
    notes,
    active,
  });

  if (error) {
    return { error: error.message || "ไม่สามารถสร้างลูกค้าได้" };
  }

  revalidateCustomerPaths();
  return { success: `เพิ่มลูกค้า ${name} เรียบร้อยแล้ว` };
}

export async function updateCustomerAssignmentsAction(
  _prevState: UpdateCustomerAssignmentsActionState,
  formData: FormData,
): Promise<UpdateCustomerAssignmentsActionState> {
  await requirePermission("manage_customers");

  if (shouldUseMockData()) {
    return mockModeError("โหมดตัวอย่างยังไม่รองรับการอัปเดตลูกค้า กรุณาเชื่อมต่อ Supabase ก่อน");
  }

  const customerId = normalizeText(formData.get("customerId"));
  const assignedUserId = normalizeOptionalUuid(formData.get("assignedUserId"));
  const managerUserId = normalizeOptionalUuid(formData.get("managerUserId"));

  if (!customerId) {
    return { error: "ไม่พบลูกค้าที่ต้องการอัปเดต" };
  }

  const supabase = getSupabaseServerClient();

  const [customerResult, validationError] = await Promise.all([
    supabase
      .from("customers")
      .select("id, name")
      .eq("id", customerId)
      .maybeSingle(),
    validateAssignmentProfiles(supabase, assignedUserId, managerUserId),
  ]);

  if (customerResult.error || !customerResult.data) {
    return { error: customerResult.error?.message || "ไม่พบข้อมูลลูกค้า" };
  }

  if (validationError) {
    return validationError;
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

  revalidateCustomerPaths();

  return {
    success: `อัปเดต assignment ของ ${customerResult.data.name} เรียบร้อยแล้ว`,
  };
}
