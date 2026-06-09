import { monthlyAccountingWorkflow } from "@/lib/monthly-workflow";
import type {
  BusinessType,
  ChecklistTemplate,
  ChecklistTemplateItem,
  Customer,
} from "@/types/domain";

export const businessTypes: BusinessType[] = [
  {
    id: "bt-1",
    name: "บริษัทบริการ",
    description: "งานบัญชีรายเดือนสำหรับธุรกิจบริการ",
    active: true,
  },
  {
    id: "bt-2",
    name: "บริษัทซื้อขาย",
    description: "งานบัญชีรายเดือนสำหรับธุรกิจซื้อขายสินค้า",
    active: true,
  },
  {
    id: "bt-3",
    name: "ร้านอาหาร",
    description: "งานบัญชีรายเดือนสำหรับร้านอาหารและธุรกิจที่มีเอกสารประจำวัน",
    active: true,
  },
];

export const customers: Customer[] = [
  {
    id: "cus-1",
    code: "CUST-001",
    name: "บริษัท เอ บิสซิเนส จำกัด",
    taxId: "0105557012345",
    businessTypeId: "bt-1",
    assignedUserId: "user-staff-a",
    managerUserId: "user-manager-1",
    assignedUserName: "พนักงาน A",
    managerUserName: "หัวหน้าทีม 1",
    serviceStatus: "active",
    notes: "ลูกค้าส่งเอกสารช่วงต้นเดือน",
    active: true,
  },
  {
    id: "cus-2",
    code: "CUST-002",
    name: "บริษัท บี เทรดดิ้ง จำกัด",
    taxId: "0105557098765",
    businessTypeId: "bt-2",
    assignedUserId: "user-staff-b",
    managerUserId: "user-manager-1",
    assignedUserName: "พนักงาน B",
    managerUserName: "หัวหน้าทีม 1",
    serviceStatus: "active",
    notes: "เอกสารซื้อขายเยอะ ต้องติดตามเอกสารให้ครบ",
    active: true,
  },
  {
    id: "cus-3",
    code: "CUST-003",
    name: "ร้านครัวสุขใจ",
    taxId: "3101200456789",
    businessTypeId: "bt-3",
    assignedUserId: "user-staff-c",
    managerUserId: "user-manager-2",
    assignedUserName: "พนักงาน C",
    managerUserName: "หัวหน้าทีม 2",
    serviceStatus: "onboarding",
    notes: "ลูกค้าใหม่ กำลังจัด workflow เอกสาร",
    active: true,
  },
];

export const checklistTemplates: ChecklistTemplate[] = businessTypes.map((businessType) => ({
  id: `tpl-${businessType.id}`,
  name: `งานบัญชีประจำเดือน - ${businessType.name}`,
  businessTypeId: businessType.id,
  description: "ใช้ 7 ขั้นตอนหลักของงานบัญชีประจำเดือน",
  active: true,
}));

export const checklistTemplateItems: ChecklistTemplateItem[] = checklistTemplates.flatMap((template) =>
  monthlyAccountingWorkflow.map((step, index) => ({
    id: `${template.id}-item-${index + 1}`,
    templateId: template.id,
    title: step.title,
    description: step.description,
    sortOrder: index + 1,
    isRequired: true,
    dueDayOffset: index * 2 + 4,
    dueDayDetail: `ประมาณวันที่ ${index * 2 + 4} ของรอบงาน`,
    defaultAssigneeRole: "staff",
    active: true,
  })),
);
