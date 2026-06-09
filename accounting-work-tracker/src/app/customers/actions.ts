/* eslint-disable @typescript-eslint/no-unused-vars */
"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/session";
import { getChecklistTemplateItems, getChecklistTemplates, getCustomers } from "@/lib/supabase/queries";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { generateMonthlyWorkForPeriod } from "@/lib/work-generation";
import type { ServiceStatus } from "@/types/domain";

export type CustomerActionState = {
  success?: string;
  error?: string;
};

export type UpdateCustomerAssignmentsActionState = CustomerActionState;
export type CreateCustomerActionState = CustomerActionState;
export type UpdateCustomerActionState = CustomerActionState;
export type DeleteCustomerActionState = CustomerActionState;
export type CreateBusinessTypeActionState = CustomerActionState;
export type UpdateBusinessTypeActionState = CustomerActionState;
export type DeleteBusinessTypeActionState = CustomerActionState;

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
  revalidatePath("/checklists");
  revalidatePath("/reports");
}

function getCurrentBangkokPeriod() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
  });
  const parts = formatter.formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === "year")?.value || 0);
  const month = Number(parts.find((part) => part.type === "month")?.value || 0);

  return { year, month };
}

async function ensureCurrentPeriodWorkGenerated(
  supabase: ReturnType<typeof getSupabaseServerClient>,
): Promise<CustomerActionState | null> {
  const [customers, checklistTemplates, checklistTemplateItems] = await Promise.all([
    getCustomers(),
    getChecklistTemplates(),
    getChecklistTemplateItems(),
  ]);

  const { year, month } = getCurrentBangkokPeriod();

  try {
    await generateMonthlyWorkForPeriod({
      supabase,
      generatedBy: "customer-auto-sync",
      customers,
      checklistTemplates,
      checklistTemplateItems,
      periodYear: year,
      periodMonth: month,
    });
  } catch (generationError) {
    return {
      error:
        generationError instanceof Error
          ? `generate งานรายเดือนอัตโนมัติไม่สำเร็จ: ${generationError.message}`
          : "generate งานรายเดือนอัตโนมัติไม่สำเร็จ",
    };
  }

  return null;
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

async function syncCustomerAssignments(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  customerId: string,
  assignedUserId: string | null,
  managerUserId: string | null,
): Promise<CustomerActionState | null> {
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

  if (cycleIds.length === 0) {
    return null;
  }

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

  return null;
}

async function validateBusinessTypeInput(name: string) {
  if (!name) {
    return { error: "กรุณากรอกชื่อประเภทธุรกิจ" };
  }

  if (name.length > 120) {
    return { error: "ชื่อประเภทธุรกิจยาวเกินไป" };
  }

  return null;
}

export async function createBusinessTypeAction(
  _prevState: CreateBusinessTypeActionState = initialState,
  formData: FormData,
): Promise<CreateBusinessTypeActionState> {
  await requirePermission("manage_customers");

  if (shouldUseMockData()) {
    return mockModeError("โหมดตัวอย่างยังไม่รองรับการเพิ่ม business type กรุณาเชื่อมต่อ Supabase ก่อน");
  }

  const name = normalizeText(formData.get("name"));
  const description = normalizeText(formData.get("description"));
  const active = normalizeBoolean(formData.get("active"));

  const validationError = await validateBusinessTypeInput(name);
  if (validationError) {
    return validationError;
  }

  const supabase = getSupabaseServerClient();
  const { data: existing, error: existingError } = await supabase
    .from("business_types")
    .select("id")
    .ilike("name", name)
    .maybeSingle();

  if (existingError) {
    return { error: existingError.message || "ตรวจสอบ business type ซ้ำไม่สำเร็จ" };
  }

  if (existing) {
    return { error: "มี business type ชื่อนี้อยู่แล้ว" };
  }

  const { error } = await supabase.from("business_types").insert({
    name,
    description,
    active,
  });

  if (error) {
    return { error: error.message || "ไม่สามารถเพิ่ม business type ได้" };
  }

  revalidateCustomerPaths();
  return { success: `เพิ่ม business type ${name} เรียบร้อยแล้ว` };
}

export async function updateBusinessTypeAction(
  _prevState: UpdateBusinessTypeActionState = initialState,
  formData: FormData,
): Promise<UpdateBusinessTypeActionState> {
  await requirePermission("manage_customers");

  if (shouldUseMockData()) {
    return mockModeError("โหมดตัวอย่างยังไม่รองรับการแก้ไข business type กรุณาเชื่อมต่อ Supabase ก่อน");
  }

  const businessTypeId = normalizeText(formData.get("businessTypeId"));
  const name = normalizeText(formData.get("name"));
  const description = normalizeText(formData.get("description"));
  const active = normalizeBoolean(formData.get("active"));

  if (!businessTypeId) {
    return { error: "ไม่พบ business type ที่ต้องการแก้ไข" };
  }

  const validationError = await validateBusinessTypeInput(name);
  if (validationError) {
    return validationError;
  }

  const supabase = getSupabaseServerClient();
  const [{ data: current, error: currentError }, { data: duplicate, error: duplicateError }] = await Promise.all([
    supabase.from("business_types").select("id, name").eq("id", businessTypeId).maybeSingle(),
    supabase.from("business_types").select("id").ilike("name", name).neq("id", businessTypeId).maybeSingle(),
  ]);

  if (currentError || !current) {
    return { error: currentError?.message || "ไม่พบ business type" };
  }

  if (duplicateError) {
    return { error: duplicateError.message || "ตรวจสอบ business type ซ้ำไม่สำเร็จ" };
  }

  if (duplicate) {
    return { error: "มี business type ชื่อนี้อยู่แล้ว" };
  }

  const { error } = await supabase
    .from("business_types")
    .update({
      name,
      description,
      active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", businessTypeId);

  if (error) {
    return { error: error.message || "อัปเดต business type ไม่สำเร็จ" };
  }

  revalidateCustomerPaths();
  return { success: `อัปเดต business type ${name} เรียบร้อยแล้ว` };
}

export async function deleteBusinessTypeAction(
  _prevState: DeleteBusinessTypeActionState = initialState,
  formData: FormData,
): Promise<DeleteBusinessTypeActionState> {
  await requirePermission("manage_customers");

  if (shouldUseMockData()) {
    return mockModeError("โหมดตัวอย่างยังไม่รองรับการลบ business type กรุณาเชื่อมต่อ Supabase ก่อน");
  }

  const businessTypeId = normalizeText(formData.get("businessTypeId"));
  const businessTypeName = normalizeText(formData.get("businessTypeName"));

  if (!businessTypeId) {
    return { error: "ไม่พบ business type ที่ต้องการลบ" };
  }

  const supabase = getSupabaseServerClient();
  const [businessTypeResult, customerCountResult, checklistCountResult] = await Promise.all([
    supabase.from("business_types").select("id, name").eq("id", businessTypeId).maybeSingle(),
    supabase.from("customers").select("id", { count: "exact", head: true }).eq("business_type_id", businessTypeId),
    supabase.from("checklist_templates").select("id", { count: "exact", head: true }).eq("business_type_id", businessTypeId),
  ]);

  if (businessTypeResult.error || !businessTypeResult.data) {
    return { error: businessTypeResult.error?.message || "ไม่พบ business type" };
  }

  if (customerCountResult.error) {
    return { error: customerCountResult.error.message || "ตรวจสอบการใช้งาน business type ในลูกค้าไม่สำเร็จ" };
  }

  if (checklistCountResult.error) {
    return { error: checklistCountResult.error.message || "ตรวจสอบการใช้งาน business type ใน checklist ไม่สำเร็จ" };
  }

  if ((customerCountResult.count || 0) > 0 || (checklistCountResult.count || 0) > 0) {
    return {
      error: `ไม่สามารถลบ ${businessTypeResult.data.name} ได้ เพราะยังมีลูกค้าหรือ checklist template อ้างอิงอยู่ กรุณาปิด active แทน`,
    };
  }

  const { error } = await supabase.from("business_types").delete().eq("id", businessTypeId);

  if (error) {
    return { error: error.message || "ลบ business type ไม่สำเร็จ" };
  }

  revalidateCustomerPaths();
  return { success: `ลบ business type ${businessTypeResult.data.name || businessTypeName} เรียบร้อยแล้ว` };
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

  const { data: createdCustomer, error } = await supabase
    .from("customers")
    .insert({
      code,
      name,
      tax_id: taxId,
      business_type_id: businessTypeId,
      assigned_user_id: assignedUserId,
      manager_user_id: managerUserId,
      service_status: serviceStatus,
      notes,
      active,
    })
    .select("id")
    .single();

  if (error || !createdCustomer) {
    return { error: error?.message || "ไม่สามารถสร้างลูกค้าได้" };
  }

  const generationError = await ensureCurrentPeriodWorkGenerated(supabase);
  if (generationError) {
    console.error("Failed to auto-generate monthly work for new customer", generationError.error);
    return {
      error: `สร้างลูกค้าแล้ว แต่ ${generationError.error}`,
    };
  }

  revalidateCustomerPaths();
  return { success: `เพิ่มลูกค้า ${name} และสร้างงานรายเดือนปัจจุบันเรียบร้อยแล้ว` };
}

export async function updateCustomerAction(
  _prevState: UpdateCustomerActionState = initialState,
  formData: FormData,
): Promise<UpdateCustomerActionState> {
  await requirePermission("manage_customers");

  if (shouldUseMockData()) {
    return mockModeError("โหมดตัวอย่างยังไม่รองรับการอัปเดตลูกค้า กรุณาเชื่อมต่อ Supabase ก่อน");
  }

  const customerId = normalizeText(formData.get("customerId"));
  const code = normalizeText(formData.get("code"));
  const name = normalizeText(formData.get("name"));
  const taxId = normalizeText(formData.get("taxId"));
  const businessTypeId = normalizeText(formData.get("businessTypeId"));
  const serviceStatus = normalizeText(formData.get("serviceStatus"));
  const notes = normalizeText(formData.get("notes"));
  const active = normalizeBoolean(formData.get("active"));
  const assignedUserId = normalizeOptionalUuid(formData.get("assignedUserId"));
  const managerUserId = normalizeOptionalUuid(formData.get("managerUserId"));

  if (!customerId || !code || !name || !taxId || !businessTypeId || !serviceStatus) {
    return { error: "กรุณากรอกข้อมูลลูกค้าให้ครบถ้วน" };
  }

  if (!isValidServiceStatus(serviceStatus)) {
    return { error: "สถานะบริการไม่ถูกต้อง" };
  }

  const supabase = getSupabaseServerClient();
  const [customerResult, businessTypeResult, validationError] = await Promise.all([
    supabase.from("customers").select("id, name").eq("id", customerId).maybeSingle(),
    supabase.from("business_types").select("id").eq("id", businessTypeId).maybeSingle(),
    validateAssignmentProfiles(supabase, assignedUserId, managerUserId),
  ]);

  if (customerResult.error || !customerResult.data) {
    return { error: customerResult.error?.message || "ไม่พบข้อมูลลูกค้า" };
  }

  if (businessTypeResult.error || !businessTypeResult.data) {
    return { error: businessTypeResult.error?.message || "ไม่พบประเภทธุรกิจที่เลือก" };
  }

  if (validationError) {
    return validationError;
  }

  const { error: customerUpdateError } = await supabase
    .from("customers")
    .update({
      code,
      name,
      tax_id: taxId,
      business_type_id: businessTypeId,
      assigned_user_id: assignedUserId,
      manager_user_id: managerUserId,
      service_status: serviceStatus,
      notes,
      active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", customerId);

  if (customerUpdateError) {
    return { error: customerUpdateError.message || "อัปเดตลูกค้าไม่สำเร็จ" };
  }

  const syncError = await syncCustomerAssignments(supabase, customerId, assignedUserId, managerUserId);
  if (syncError) {
    return syncError;
  }

  const generationError = await ensureCurrentPeriodWorkGenerated(supabase);
  if (generationError) {
    return {
      error: `อัปเดตข้อมูลลูกค้าแล้ว แต่ ${generationError.error}`,
    };
  }

  revalidateCustomerPaths();
  return { success: `อัปเดตข้อมูลลูกค้า ${name} และตรวจสอบงานรายเดือนปัจจุบันเรียบร้อยแล้ว` };
}

export async function updateCustomerAssignmentsAction(
  _prevState: UpdateCustomerAssignmentsActionState,
  formData: FormData,
): Promise<UpdateCustomerAssignmentsActionState> {
  return updateCustomerAction(_prevState, formData);
}

export async function deleteCustomerAction(
  _prevState: DeleteCustomerActionState = initialState,
  formData: FormData,
): Promise<DeleteCustomerActionState> {
  await requirePermission("manage_customers");

  if (shouldUseMockData()) {
    return mockModeError("โหมดตัวอย่างยังไม่รองรับการลบลูกค้า กรุณาเชื่อมต่อ Supabase ก่อน");
  }

  const customerId = normalizeText(formData.get("customerId"));
  const customerName = normalizeText(formData.get("customerName"));

  if (!customerId) {
    return { error: "ไม่พบลูกค้าที่ต้องการลบ" };
  }

  const supabase = getSupabaseServerClient();
  const [{ data: customer, error: customerError }, { count: workCycleCount, error: workCycleError }] = await Promise.all([
    supabase.from("customers").select("id, name").eq("id", customerId).maybeSingle(),
    supabase.from("work_cycles").select("id", { count: "exact", head: true }).eq("customer_id", customerId),
  ]);

  if (customerError || !customer) {
    return { error: customerError?.message || "ไม่พบข้อมูลลูกค้า" };
  }

  if (workCycleError) {
    return { error: workCycleError.message || "ตรวจสอบข้อมูลอ้างอิงของลูกค้าไม่สำเร็จ" };
  }

  if ((workCycleCount || 0) > 0) {
    return {
      error: `ไม่สามารถลบ ${customer.name} ได้ เพราะมี work cycles หรือประวัติงานแล้ว กรุณาปิด active แทนหากต้องการหยุดใช้งาน`,
    };
  }

  const { error: deleteError } = await supabase.from("customers").delete().eq("id", customerId);

  if (deleteError) {
    return { error: deleteError.message || "ลบลูกค้าไม่สำเร็จ" };
  }

  revalidateCustomerPaths();
  return { success: `ลบลูกค้า ${customer.name || customerName} เรียบร้อยแล้ว` };
}
