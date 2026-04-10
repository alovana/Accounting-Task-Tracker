import type { AppRole } from "@/lib/constants";
import type { ChecklistTemplate, ChecklistTemplateItem, Customer } from "@/types/domain";

type GenerationInput = {
  customers: Customer[];
  checklistTemplates: ChecklistTemplate[];
  checklistTemplateItems: ChecklistTemplateItem[];
  periodYear: number;
  periodMonth: number;
};

export type MonthlyGenerationPreview = {
  summary: {
    totalCustomers: number;
    matchedCustomers: number;
    unmatchedCustomers: number;
    totalTemplateItems: number;
  };
  customerPlans: Array<{
    customerId: string;
    customerName: string;
    templateId: string;
    templateName: string;
    workItemCount: number;
  }>;
  unmatchedCustomers: Array<{
    customerId: string;
    customerName: string;
    reason: string;
  }>;
};

export type MonthlyGenerationResult = {
  createdCycleCount: number;
  existingCycleCount: number;
  createdItemCount: number;
  existingItemCount: number;
  unmatchedCustomers: Array<{
    customerId: string;
    customerName: string;
    reason: string;
  }>;
};

export function canManageWorkGeneration(role: AppRole) {
  return role === "admin" || role === "manager";
}

export function buildMonthlyGenerationPreview({
  customers,
  checklistTemplates,
  checklistTemplateItems,
}: GenerationInput): MonthlyGenerationPreview {
  const activeCustomers = customers.filter((customer) => customer.active);
  const activeTemplates = checklistTemplates.filter((template) => template.active);
  const activeTemplateItems = checklistTemplateItems.filter((item) => item.active);

  const customerPlans = activeCustomers.flatMap((customer) => {
    const template = activeTemplates.find(
      (item) => item.businessTypeId === customer.businessTypeId,
    );

    if (!template) {
      return [];
    }

    const items = activeTemplateItems.filter((item) => item.templateId === template.id);

    return [
      {
        customerId: customer.id,
        customerName: customer.name,
        templateId: template.id,
        templateName: template.name,
        workItemCount: items.length,
      },
    ];
  });

  const unmatchedCustomers = activeCustomers.flatMap((customer) => {
    const template = activeTemplates.find(
      (item) => item.businessTypeId === customer.businessTypeId,
    );

    if (!template) {
      return [
        {
          customerId: customer.id,
          customerName: customer.name,
          reason: "ไม่พบ checklist template สำหรับประเภทธุรกิจนี้",
        },
      ];
    }

    const items = activeTemplateItems.filter((item) => item.templateId === template.id);

    if (items.length === 0) {
      return [
        {
          customerId: customer.id,
          customerName: customer.name,
          reason: "template นี้ยังไม่มี checklist items",
        },
      ];
    }

    return [];
  });

  return {
    summary: {
      totalCustomers: activeCustomers.length,
      matchedCustomers: customerPlans.length,
      unmatchedCustomers: unmatchedCustomers.length,
      totalTemplateItems: customerPlans.reduce((sum, item) => sum + item.workItemCount, 0),
    },
    customerPlans,
    unmatchedCustomers,
  };
}

function getDueDate(periodYear: number, periodMonth: number, dueDayOffset: number) {
  const date = new Date(Date.UTC(periodYear, periodMonth - 1, 1));
  date.setUTCDate(date.getUTCDate() + dueDayOffset);
  return date.toISOString().slice(0, 10);
}

function getAssignedToName(customer: Customer, role: ChecklistTemplateItem["defaultAssigneeRole"]) {
  return role === "manager" ? customer.managerUserName : customer.assignedUserName;
}

export async function generateMonthlyWorkForPeriod({
  supabase,
  generatedBy,
  customers,
  checklistTemplates,
  checklistTemplateItems,
  periodYear,
  periodMonth,
}: GenerationInput & {
  supabase: any;
  generatedBy: string;
}): Promise<MonthlyGenerationResult> {
  const preview = buildMonthlyGenerationPreview({
    customers,
    checklistTemplates,
    checklistTemplateItems,
    periodYear,
    periodMonth,
  });

  let createdCycleCount = 0;
  let existingCycleCount = 0;
  let createdItemCount = 0;
  let existingItemCount = 0;

  for (const plan of preview.customerPlans) {
    const existingCycleResponse = await supabase
      .from("work_cycles")
      .select("id")
      .eq("customer_id", plan.customerId)
      .eq("period_year", periodYear)
      .eq("period_month", periodMonth);

    if (existingCycleResponse.error) {
      throw new Error(existingCycleResponse.error.message || "Failed to check existing work cycle");
    }

    let workCycleId = existingCycleResponse.data?.[0]?.id as string | undefined;

    if (workCycleId) {
      existingCycleCount += 1;
    } else {
      const createdCycleResponse = await supabase
        .from("work_cycles")
        .insert({
          customer_id: plan.customerId,
          period_year: periodYear,
          period_month: periodMonth,
          status: "planned",
          generated_by: generatedBy,
        })
        .select("id")
        .single();

      if (createdCycleResponse.error) {
        throw new Error(createdCycleResponse.error.message || "Failed to create work cycle");
      }

      workCycleId = createdCycleResponse.data.id as string;
      createdCycleCount += 1;
    }

    const templateItems = checklistTemplateItems
      .filter((item) => item.active && item.templateId === plan.templateId)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const customer = customers.find((item) => item.id === plan.customerId);

    if (!customer) {
      continue;
    }

    for (const templateItem of templateItems) {
      const existingItemResponse = await supabase
        .from("work_items")
        .select("id")
        .eq("work_cycle_id", workCycleId)
        .eq("template_item_id", templateItem.id);

      if (existingItemResponse.error) {
        throw new Error(existingItemResponse.error.message || "Failed to check existing work item");
      }

      if ((existingItemResponse.data?.length || 0) > 0) {
        existingItemCount += 1;
        continue;
      }

      const insertItemResponse = await supabase.from("work_items").insert({
        work_cycle_id: workCycleId,
        template_item_id: templateItem.id,
        title: templateItem.title,
        assigned_to_name: getAssignedToName(customer, templateItem.defaultAssigneeRole),
        status: "not_started",
        due_date: getDueDate(periodYear, periodMonth, templateItem.dueDayOffset),
        note: templateItem.description,
        updated_by: generatedBy,
      });

      if (insertItemResponse.error) {
        throw new Error(insertItemResponse.error.message || "Failed to create work item");
      }

      createdItemCount += 1;
    }
  }

  return {
    createdCycleCount,
    existingCycleCount,
    createdItemCount,
    existingItemCount,
    unmatchedCustomers: preview.unmatchedCustomers,
  };
}
