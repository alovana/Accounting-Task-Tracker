"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/session";
import { ROLE_OPTIONS, type AppRole } from "@/lib/constants";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type ChecklistActionState = {
  success?: string;
  error?: string;
};

const initialState: ChecklistActionState = {};

function shouldUseMockData() {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY;
}

function normalizeText(value: FormDataEntryValue | null) {
  return String(value || "").trim();
}

function normalizeBoolean(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

function normalizeInteger(value: FormDataEntryValue | null, fallback = 0) {
  const parsed = Number.parseInt(String(value || "").trim(), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function isValidRole(role: string): role is AppRole {
  return ROLE_OPTIONS.includes(role as AppRole);
}

function revalidateChecklistPaths() {
  revalidatePath("/checklists");
  revalidatePath("/work-cycles");
  revalidatePath("/dashboard");
}

function mockModeError() {
  return { error: "โหมดตัวอย่างยังไม่รองรับการแก้ไขข้อมูล checklist กรุณาเชื่อมต่อ Supabase ก่อน" };
}

export async function createChecklistTemplateAction(
  _prevState: ChecklistActionState = initialState,
  formData: FormData,
): Promise<ChecklistActionState> {
  await requirePermission("manage_checklists");

  if (shouldUseMockData()) {
    return mockModeError();
  }

  const businessTypeId = normalizeText(formData.get("businessTypeId"));
  const name = normalizeText(formData.get("name"));
  const description = normalizeText(formData.get("description"));
  const active = normalizeBoolean(formData.get("active"));

  if (!businessTypeId || !name) {
    return { error: "กรุณาเลือกประเภทธุรกิจและกรอกชื่อ template" };
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("checklist_templates").insert({
    business_type_id: businessTypeId,
    name,
    description,
    active,
  });

  if (error) {
    return { error: error.message || "ไม่สามารถสร้าง checklist template ได้" };
  }

  revalidateChecklistPaths();
  return { success: `สร้าง template ${name} เรียบร้อยแล้ว` };
}

export async function updateChecklistTemplateAction(
  _prevState: ChecklistActionState = initialState,
  formData: FormData,
): Promise<ChecklistActionState> {
  await requirePermission("manage_checklists");

  if (shouldUseMockData()) {
    return mockModeError();
  }

  const id = normalizeText(formData.get("id"));
  const businessTypeId = normalizeText(formData.get("businessTypeId"));
  const name = normalizeText(formData.get("name"));
  const description = normalizeText(formData.get("description"));
  const active = normalizeBoolean(formData.get("active"));

  if (!id || !businessTypeId || !name) {
    return { error: "ข้อมูล template ไม่ครบถ้วน" };
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("checklist_templates")
    .update({
      business_type_id: businessTypeId,
      name,
      description,
      active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { error: error.message || "ไม่สามารถอัปเดต checklist template ได้" };
  }

  revalidateChecklistPaths();
  return { success: `อัปเดต template ${name} เรียบร้อยแล้ว` };
}

export async function deleteChecklistTemplateAction(
  _prevState: ChecklistActionState = initialState,
  formData: FormData,
): Promise<ChecklistActionState> {
  await requirePermission("manage_checklists");

  if (shouldUseMockData()) {
    return mockModeError();
  }

  const id = normalizeText(formData.get("id"));
  const name = normalizeText(formData.get("name"));

  if (!id) {
    return { error: "ไม่พบ checklist template ที่ต้องการลบ" };
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("checklist_templates").delete().eq("id", id);

  if (error) {
    return { error: error.message || "ไม่สามารถลบ checklist template ได้" };
  }

  revalidateChecklistPaths();
  return { success: `ลบ template ${name || "ที่เลือก"} เรียบร้อยแล้ว` };
}

export async function createChecklistTemplateItemAction(
  _prevState: ChecklistActionState = initialState,
  formData: FormData,
): Promise<ChecklistActionState> {
  await requirePermission("manage_checklists");

  if (shouldUseMockData()) {
    return mockModeError();
  }

  const templateId = normalizeText(formData.get("templateId"));
  const title = normalizeText(formData.get("title"));
  const description = normalizeText(formData.get("description"));
  const dueDayDetail = normalizeText(formData.get("dueDayDetail"));
  const sortOrder = normalizeInteger(formData.get("sortOrder"), 1);
  const dueDayOffset = normalizeInteger(formData.get("dueDayOffset"), 0);
  const isRequired = normalizeBoolean(formData.get("isRequired"));
  const active = normalizeBoolean(formData.get("active"));
  const defaultAssigneeRole = normalizeText(formData.get("defaultAssigneeRole"));

  if (!templateId || !title) {
    return { error: "กรุณาเลือก template และกรอกชื่องานย่อย" };
  }

  if (!isValidRole(defaultAssigneeRole)) {
    return { error: "บทบาทผู้รับผิดชอบไม่ถูกต้อง" };
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("checklist_template_items").insert({
    template_id: templateId,
    title,
    description,
    due_day_detail: dueDayDetail,
    sort_order: sortOrder,
    due_day_offset: dueDayOffset,
    is_required: isRequired,
    default_assignee_role: defaultAssigneeRole,
    active,
  });

  if (error) {
    return { error: error.message || "ไม่สามารถสร้าง checklist item ได้" };
  }

  revalidateChecklistPaths();
  return { success: `เพิ่ม checklist item ${title} เรียบร้อยแล้ว` };
}

export async function updateChecklistTemplateItemAction(
  _prevState: ChecklistActionState = initialState,
  formData: FormData,
): Promise<ChecklistActionState> {
  await requirePermission("manage_checklists");

  if (shouldUseMockData()) {
    return mockModeError();
  }

  const id = normalizeText(formData.get("id"));
  const title = normalizeText(formData.get("title"));
  const description = normalizeText(formData.get("description"));
  const dueDayDetail = normalizeText(formData.get("dueDayDetail"));
  const sortOrder = normalizeInteger(formData.get("sortOrder"), 1);
  const dueDayOffset = normalizeInteger(formData.get("dueDayOffset"), 0);
  const isRequired = normalizeBoolean(formData.get("isRequired"));
  const active = normalizeBoolean(formData.get("active"));
  const defaultAssigneeRole = normalizeText(formData.get("defaultAssigneeRole"));

  if (!id || !title) {
    return { error: "ข้อมูล checklist item ไม่ครบถ้วน" };
  }

  if (!isValidRole(defaultAssigneeRole)) {
    return { error: "บทบาทผู้รับผิดชอบไม่ถูกต้อง" };
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("checklist_template_items")
    .update({
      title,
      description,
      due_day_detail: dueDayDetail,
      sort_order: sortOrder,
      due_day_offset: dueDayOffset,
      is_required: isRequired,
      default_assignee_role: defaultAssigneeRole,
      active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { error: error.message || "ไม่สามารถอัปเดต checklist item ได้" };
  }

  revalidateChecklistPaths();
  return { success: `อัปเดต checklist item ${title} เรียบร้อยแล้ว` };
}

export async function deleteChecklistTemplateItemAction(
  _prevState: ChecklistActionState = initialState,
  formData: FormData,
): Promise<ChecklistActionState> {
  await requirePermission("manage_checklists");

  if (shouldUseMockData()) {
    return mockModeError();
  }

  const id = normalizeText(formData.get("id"));
  const title = normalizeText(formData.get("title"));

  if (!id) {
    return { error: "ไม่พบ checklist item ที่ต้องการลบ" };
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("checklist_template_items").delete().eq("id", id);

  if (error) {
    return { error: error.message || "ไม่สามารถลบ checklist item ได้" };
  }

  revalidateChecklistPaths();
  return { success: `ลบ checklist item ${title || "ที่เลือก"} เรียบร้อยแล้ว` };
}
