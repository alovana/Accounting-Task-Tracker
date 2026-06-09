update checklist_templates
set active = false
where name not like 'งานบัญชีประจำเดือน - %';

insert into checklist_templates (name, business_type_id, description)
select 'งานบัญชีประจำเดือน - ' || bt.name, bt.id, 'ใช้ 7 ขั้นตอนหลักของงานบัญชีประจำเดือน'
from business_types bt
where not exists (
  select 1 from checklist_templates ct
  where ct.business_type_id = bt.id
    and ct.name = 'งานบัญชีประจำเดือน - ' || bt.name
);

insert into checklist_template_items (
  template_id,
  title,
  description,
  sort_order,
  is_required,
  due_day_offset,
  due_day_detail,
  default_assignee_role
)
select ct.id, item.title, item.description, item.sort_order, true, item.due_day_offset, item.due_day_detail, 'staff'::app_role
from checklist_templates ct
cross join (
  values
    ('รับและรวบรวมเอกสาร', 'รับเอกสารทางการเงินจากลูกค้า เช่น ใบกำกับภาษี ใบเสร็จ ใบแจ้งหนี้ และหลักฐานโอนเงิน', 1, 4, 'ประมาณวันที่ 4 ของรอบงาน'),
    ('คัดแยกประเภทเอกสาร', 'แยกเอกสารเป็นเอกสารซื้อ เอกสารขาย และเอกสารค่าใช้จ่าย', 2, 6, 'ประมาณวันที่ 6 ของรอบงาน'),
    ('บันทึกบัญชีลงในระบบ', 'บันทึกข้อมูลเอกสารลงในโปรแกรม Express ให้ถูกต้องตามผังบัญชี', 3, 8, 'ประมาณวันที่ 8 ของรอบงาน'),
    ('ตรวจสอบภาษีมูลค่าเพิ่ม', 'ตรวจรายงานภาษีซื้อและภาษีขาย เฉพาะลูกค้าที่จด VAT', 4, 10, 'ประมาณวันที่ 10 ของรอบงาน'),
    ('ตรวจสอบภาษีหัก ณ ที่จ่าย', 'ตรวจและรวบรวมรายการภาษีหัก ณ ที่จ่าย เช่น ภ.ง.ด.1 ภ.ง.ด.3 และ ภ.ง.ด.53', 5, 12, 'ประมาณวันที่ 12 ของรอบงาน'),
    ('ยื่นแบบแสดงรายการภาษี', 'ยื่นแบบภาษีออนไลน์ผ่านระบบ e-Filing', 6, 14, 'ประมาณวันที่ 14 ของรอบงาน'),
    ('นำส่งใบแจ้งยอดชำระให้กับลูกค้า', 'ส่ง Pay-in Slip หรือ QR Code ให้ลูกค้าชำระภาษีภายในกำหนด', 7, 16, 'ประมาณวันที่ 16 ของรอบงาน')
) as item(title, description, sort_order, due_day_offset, due_day_detail)
where ct.name like 'งานบัญชีประจำเดือน - %'
  and not exists (
    select 1 from checklist_template_items cti
    where cti.template_id = ct.id
      and cti.title = item.title
  );
