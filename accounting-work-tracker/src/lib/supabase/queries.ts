import { businessTypes, checklistTemplateItems, checklistTemplates, customers } from "@/lib/mock/phase2-data";
import { workCycles, workItems, workItemUpdates } from "@/lib/mock/phase3-data";
import { notificationLogs, notificationRules } from "@/lib/mock/phase5-data";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { WorkCycle, WorkItem, WorkItemUpdate } from "@/lib/mock/phase3-data";
import type { AppRole } from "@/lib/constants";
import type {
  BusinessType,
  ChecklistTemplate,
  ChecklistTemplateItem,
  Customer,
} from "@/types/domain";
import type { NotificationLog, NotificationRule } from "@/types/notifications";
import type { WorkItemFile } from "@/types/attachments";

export type UserAssignmentOption = {
  id: string;
  fullName: string;
  email: string;
  role: AppRole;
};

export type AdminUserRecord = {
  id: string;
  fullName: string;
  email: string;
  role: AppRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

function shouldUseMockData() {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export async function getBusinessTypes(): Promise<BusinessType[]> {
  if (shouldUseMockData()) {
    return businessTypes;
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("business_types")
    .select("id, name, description, active")
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to load business types", error);
    return businessTypes;
  }

  return data;
}

export async function getCustomers(): Promise<Customer[]> {
  if (shouldUseMockData()) {
    return customers;
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("customers")
    .select(
      "id, code, name, tax_id, business_type_id, assigned_user_id, manager_user_id, service_status, notes, active"
    )
    .order("code", { ascending: true });

  if (error) {
    console.error("Failed to load customers", error);
    return customers;
  }

  const profileIds = Array.from(
    new Set(
      data
        .flatMap((item) => [item.assigned_user_id, item.manager_user_id])
        .filter((value): value is string => Boolean(value)),
    ),
  );

  const profileNameMap = new Map<string, string>();

  if (profileIds.length > 0) {
    const { data: profiles, error: profileError } = await supabase
      .from("user_profiles")
      .select("id, full_name, email")
      .in("id", profileIds);

    if (profileError) {
      console.error("Failed to load customer assignee profiles", profileError);
    } else {
      for (const profile of profiles) {
        profileNameMap.set(profile.id, profile.full_name?.trim() || profile.email || "-");
      }
    }
  }

  return data.map((item) => ({
    id: item.id,
    code: item.code,
    name: item.name,
    taxId: item.tax_id,
    businessTypeId: item.business_type_id,
    assignedUserId: item.assigned_user_id ?? undefined,
    managerUserId: item.manager_user_id ?? undefined,
    assignedUserName: (item.assigned_user_id && profileNameMap.get(item.assigned_user_id)) || "-",
    managerUserName: (item.manager_user_id && profileNameMap.get(item.manager_user_id)) || "-",
    serviceStatus: item.service_status,
    notes: item.notes,
    active: item.active,
  }));
}

export async function getAssignableUserProfiles(): Promise<UserAssignmentOption[]> {
  if (shouldUseMockData()) {
    return [];
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("id, full_name, email, role")
    .eq("active", true)
    .order("full_name", { ascending: true })
    .order("email", { ascending: true });

  if (error) {
    console.error("Failed to load assignable user profiles", error);
    return [];
  }

  return (data || []).map((item) => ({
    id: item.id,
    fullName: item.full_name?.trim() || item.email || "-",
    email: item.email || "",
    role: item.role,
  }));
}

export async function getAllUserProfiles(): Promise<AdminUserRecord[]> {
  if (shouldUseMockData()) {
    return [];
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("id, full_name, email, role, active, created_at, updated_at")
    .order("full_name", { ascending: true })
    .order("email", { ascending: true });

  if (error) {
    console.error("Failed to load all user profiles", error);
    return [];
  }

  return (data || []).map((item) => ({
    id: item.id,
    fullName: item.full_name?.trim() || item.email || "-",
    email: item.email || "",
    role: item.role,
    active: item.active,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }));
}

export async function getChecklistTemplates(): Promise<ChecklistTemplate[]> {
  if (shouldUseMockData()) {
    return checklistTemplates;
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("checklist_templates")
    .select("id, name, business_type_id, description, active")
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to load checklist templates", error);
    return checklistTemplates;
  }

  return data.map((item) => ({
    id: item.id,
    name: item.name,
    businessTypeId: item.business_type_id,
    description: item.description,
    active: item.active,
  }));
}

export async function getChecklistTemplateItems(): Promise<ChecklistTemplateItem[]> {
  if (shouldUseMockData()) {
    return checklistTemplateItems;
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("checklist_template_items")
    .select(
      "id, template_id, title, description, sort_order, is_required, due_day_offset, due_day_detail, default_assignee_role, active"
    )
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Failed to load checklist template items", error);
    return checklistTemplateItems;
  }

  return data.map((item) => ({
    id: item.id,
    templateId: item.template_id,
    title: item.title,
    description: item.description,
    sortOrder: item.sort_order,
    isRequired: item.is_required,
    dueDayOffset: item.due_day_offset,
    dueDayDetail: item.due_day_detail ?? undefined,
    defaultAssigneeRole: item.default_assignee_role,
    active: item.active,
  }));
}

export async function getWorkCycles(): Promise<WorkCycle[]> {
  if (shouldUseMockData()) {
    return workCycles;
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("work_cycles")
    .select("id, customer_id, period_year, period_month, status, generated_at, generated_by")
    .order("period_year", { ascending: false })
    .order("period_month", { ascending: false });

  if (error) {
    console.error("Failed to load work cycles", error);
    return workCycles;
  }

  const customersData = await getCustomers();

  return data.map((item) => ({
    id: item.id,
    customerId: item.customer_id,
    customerName:
      customersData.find((customer) => customer.id === item.customer_id)?.name ?? "-",
    periodYear: item.period_year,
    periodMonth: item.period_month,
    status: item.status,
    generatedAt: item.generated_at,
    generatedBy: item.generated_by ?? "system",
  }));
}

export async function getWorkItems(): Promise<WorkItem[]> {
  if (shouldUseMockData()) {
    return workItems;
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("work_items")
    .select(
      "id, work_cycle_id, title, assigned_user_id, assigned_to_name, status, due_date, blocked_reason, note"
    )
    .order("due_date", { ascending: true });

  if (error) {
    console.error("Failed to load work items", error);
    return workItems;
  }

  const profileIds = Array.from(
    new Set(
      (data || [])
        .map((item) => item.assigned_user_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  const profileNameMap = new Map<string, string>();

  if (profileIds.length > 0) {
    const { data: profiles, error: profileError } = await supabase
      .from("user_profiles")
      .select("id, full_name, email")
      .in("id", profileIds);

    if (profileError) {
      console.error("Failed to load work item assignee profiles", profileError);
    } else {
      for (const profile of profiles) {
        profileNameMap.set(profile.id, profile.full_name?.trim() || profile.email || "-");
      }
    }
  }

  return data.map((item) => ({
    id: item.id,
    workCycleId: item.work_cycle_id,
    title: item.title,
    assignedUserId: item.assigned_user_id ?? undefined,
    assignedTo:
      (item.assigned_user_id && profileNameMap.get(item.assigned_user_id)) ||
      item.assigned_to_name ||
      "-",
    status: item.status,
    dueDate: item.due_date ?? "-",
    blockedReason: item.blocked_reason ?? undefined,
    note: item.note ?? undefined,
  }));
}

export async function getWorkItemUpdates(): Promise<WorkItemUpdate[]> {
  if (shouldUseMockData()) {
    return workItemUpdates;
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("work_item_updates")
    .select("id, work_item_id, old_status, new_status, comment, updated_by, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load work item updates", error);
    return workItemUpdates;
  }

  return data.map((item) => ({
    id: item.id,
    workItemId: item.work_item_id,
    oldStatus: item.old_status,
    newStatus: item.new_status,
    comment: item.comment,
    updatedBy: item.updated_by ?? "system",
    createdAt: item.created_at,
  }));
}

export async function getWorkItemFiles(): Promise<WorkItemFile[]> {
  if (shouldUseMockData()) {
    return [];
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("work_item_files")
    .select(
      "id, work_item_id, file_name, file_size_bytes, content_type, storage_provider, storage_bucket, storage_object_key, uploaded_by_user_id, uploaded_by_name, created_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load work item files", error);
    return [];
  }

  return (data || []).map((item) => ({
    id: item.id,
    workItemId: item.work_item_id,
    fileName: item.file_name,
    fileSizeBytes: item.file_size_bytes ?? 0,
    contentType: item.content_type ?? "application/octet-stream",
    storageProvider: item.storage_provider,
    storageBucket: item.storage_bucket,
    storageObjectKey: item.storage_object_key,
    uploadedByUserId: item.uploaded_by_user_id ?? undefined,
    uploadedByName: item.uploaded_by_name ?? "system",
    createdAt: item.created_at,
  }));
}

export async function getNotificationRules(): Promise<NotificationRule[]> {
  if (shouldUseMockData()) {
    return notificationRules;
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("notification_rules")
    .select("id, event_type, channel, enabled, recipients_json, template")
    .order("event_type", { ascending: true });

  if (error) {
    console.error("Failed to load notification rules", error);
    return notificationRules;
  }

  if (!data || data.length === 0) {
    return notificationRules;
  }

  return data.map((item) => ({
    id: item.id,
    eventType: item.event_type,
    channel: item.channel,
    enabled: item.enabled,
    recipients: Array.isArray(item.recipients_json) ? item.recipients_json : [],
    template: item.template,
  }));
}

export async function getNotificationLogs(): Promise<NotificationLog[]> {
  if (shouldUseMockData()) {
    return notificationLogs;
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("line_notifications")
    .select("id, event_type, target_type, message, status, sent_at, error_message")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load notification logs", error);
    return notificationLogs;
  }

  return data.map((item) => ({
    id: item.id,
    eventType: item.event_type,
    targetType: item.target_type,
    targetName: item.message,
    status: item.status,
    sentAt: item.sent_at ?? undefined,
    errorMessage: item.error_message ?? undefined,
  }));
}
