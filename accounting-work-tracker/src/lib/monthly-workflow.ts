export const monthlyAccountingWorkflow = [
  {
    title: "รับและรวบรวมเอกสาร",
    shortTitle: "รับเอกสาร",
    description: "รับเอกสารทางการเงินจากลูกค้า เช่น ใบกำกับภาษี ใบเสร็จ ใบแจ้งหนี้ และหลักฐานโอนเงิน",
  },
  {
    title: "คัดแยกประเภทเอกสาร",
    shortTitle: "คัดแยก",
    description: "แยกเอกสารเป็นเอกสารซื้อ เอกสารขาย และเอกสารค่าใช้จ่าย",
  },
  {
    title: "บันทึกบัญชีลงในระบบ",
    shortTitle: "บันทึกบัญชี",
    description: "บันทึกข้อมูลเอกสารลงในโปรแกรม Express ให้ถูกต้องตามผังบัญชี",
  },
  {
    title: "ตรวจสอบภาษีมูลค่าเพิ่ม",
    shortTitle: "ตรวจ VAT",
    description: "ตรวจรายงานภาษีซื้อและภาษีขาย เฉพาะลูกค้าที่จด VAT",
  },
  {
    title: "ตรวจสอบภาษีหัก ณ ที่จ่าย",
    shortTitle: "ตรวจ WHT",
    description: "ตรวจและรวบรวมรายการภาษีหัก ณ ที่จ่าย เช่น ภ.ง.ด.1 ภ.ง.ด.3 และ ภ.ง.ด.53",
  },
  {
    title: "ยื่นแบบแสดงรายการภาษี",
    shortTitle: "ยื่นแบบ",
    description: "ยื่นแบบภาษีออนไลน์ผ่านระบบ e-Filing",
  },
  {
    title: "นำส่งใบแจ้งยอดชำระให้กับลูกค้า",
    shortTitle: "ส่งยอดชำระ",
    description: "ส่ง Pay-in Slip หรือ QR Code ให้ลูกค้าชำระภาษีภายในกำหนด",
  },
] as const;

export const monthlyWorkflowTitles = monthlyAccountingWorkflow.map((item) => item.title);

export function getWorkflowStepNumber(title: string) {
  const index = monthlyWorkflowTitles.findIndex((item) => item === title);
  return index === -1 ? null : index + 1;
}

export function getWorkflowDescription(title: string) {
  return monthlyAccountingWorkflow.find((item) => item.title === title)?.description ?? "";
}
