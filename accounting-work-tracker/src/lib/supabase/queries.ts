import { businessTypes, checklistTemplateItems, checklistTemplates, customers } from "@/lib/mock/phase2-data";
import { workCycles, workItems, workItemUpdates } from "@/lib/mock/phase3-data";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { WorkCycle, WorkItem, WorkItemUpdate } from "@/lib/mock/phase3-data";
import type {
  BusinessType,
  ChecklistTemplate,
  ChecklistTemplateItem,
  Customer,
} from "@/types/domain";

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
      "id, code, name, tax_id, business_type_id, service_status, notes, active"
    )
    .order("code", { ascending: true });

  if (error) {
    console.error("Failed to load customers", error);
    return customers;
  }

  return data.map((item) => ({
    id: item.id,
    code: item.code,
    name: item.name,
    taxId: item.tax_id,
    businessTypeId: item.business_type_id,
    assignedUserName: "-",
    managerUserName: "-",
    serviceStatus: item.service_status,
    notes: item.notes,
    active: item.active,
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

  return data;
}

export async function getChecklistTemplateItems(): Promise<ChecklistTemplateItem[]> {
  if (shouldUseMockData()) {
    return checklistTemplateItems;
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("checklist_template_items")
    .select(
      "id, template_id, title, description, sort_order, is_required, due_day_offset, default_assignee_role, active"
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
      "id, work_cycle_id, title, assigned_to_name, status, due_date, blocked_reason, note"
    )
    .order("due_date", { ascending: true });

  if (error) {
    console.error("Failed to load work items", error);
    return workItems;
  }

  return data.map((item) => ({
    id: item.id,
    workCycleId: item.work_cycle_id,
    title: item.title,
    assignedTo: item.assigned_to_name || "-",
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
