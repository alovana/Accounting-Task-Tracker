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
    description: "งานบัญชีสำหรับธุรกิจบริการทั่วไป",
    active: true,
  },
  {
    id: "bt-2",
    name: "บริษัทซื้อขาย",
    description: "งานบัญชีสำหรับกิจการซื้อขายสินค้า",
    active: true,
  },
  {
    id: "bt-3",
    name: "ร้านอาหาร",
    description: "งานบัญชีที่เน้นยอดขายรายวันและสต็อกวัตถุดิบ",
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
    assignedUserName: "พนักงาน B",
    managerUserName: "หัวหน้าทีม 1",
    serviceStatus: "active",
    notes: "มีรายการซื้อขายจำนวนมากทุกเดือน",
    active: true,
  },
  {
    id: "cus-3",
    code: "CUST-003",
    name: "ร้าน ครัวสุขใจ",
    taxId: "3101200456789",
    businessTypeId: "bt-3",
    assignedUserName: "พนักงาน C",
    managerUserName: "หัวหน้าทีม 2",
    serviceStatus: "onboarding",
    notes: "กำลังเก็บ requirement เพิ่มเรื่อง POS",
    active: true,
  },
];

export const checklistTemplates: ChecklistTemplate[] = [
  {
    id: "tpl-1",
    name: "ปิดงานบัญชีรายเดือน - ธุรกิจบริการ",
    businessTypeId: "bt-1",
    description: "แม่แบบงานประจำเดือนสำหรับลูกค้าธุรกิจบริการ",
    active: true,
  },
  {
    id: "tpl-2",
    name: "ปิดงานบัญชีรายเดือน - ธุรกิจซื้อขาย",
    businessTypeId: "bt-2",
    description: "แม่แบบสำหรับธุรกิจที่มีสต็อกและรายการซื้อขาย",
    active: true,
  },
];

export const checklistTemplateItems: ChecklistTemplateItem[] = [
  {
    id: "item-1",
    templateId: "tpl-1",
    title: "ตรวจสอบรายรับและค่าใช้จ่าย",
    description: "เช็กรายการเบื้องต้นและเอกสารประกอบ",
    sortOrder: 1,
    isRequired: true,
    dueDayOffset: 3,
    dueDayDetail: "ภายในวันที่ 3 หลังเปิดรอบงาน",
    defaultAssigneeRole: "staff",
    active: true,
  },
  {
    id: "item-2",
    templateId: "tpl-1",
    title: "กระทบยอดธนาคาร",
    description: "ตรวจสอบความครบถ้วนของ statement และรายการเคลื่อนไหว",
    sortOrder: 2,
    isRequired: true,
    dueDayOffset: 5,
    dueDayDetail: "รอ statement ครบก่อนปิดภายในวันที่ 5",
    defaultAssigneeRole: "staff",
    active: true,
  },
  {
    id: "item-3",
    templateId: "tpl-2",
    title: "ตรวจสอบสต็อกคงเหลือ",
    description: "ยืนยันยอดสินค้าคงเหลือปลายเดือน",
    sortOrder: 1,
    isRequired: true,
    dueDayOffset: 4,
    dueDayDetail: "ตรวจนับสต็อกและยืนยันภายในวันที่ 4",
    defaultAssigneeRole: "staff",
    active: true,
  },
  {
    id: "item-4",
    templateId: "tpl-2",
    title: "ตรวจสอบเจ้าหนี้และลูกหนี้",
    description: "ทบทวนยอดคงค้างและรายการผิดปกติ",
    sortOrder: 2,
    isRequired: true,
    dueDayOffset: 6,
    dueDayDetail: "หัวหน้าตรวจสอบสรุปยอดภายในวันที่ 6",
    defaultAssigneeRole: "manager",
    active: true,
  },
];
