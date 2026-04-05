import { businessTypes, checklistTemplateItems, checklistTemplates, customers } from "@/lib/mock/phase2-data";
import { getSupabaseServerClient } from "@/lib/supabase/server";
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
