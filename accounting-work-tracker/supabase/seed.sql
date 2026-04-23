insert into business_types (name, description)
values
  ('บริษัทบริการ', 'ธุรกิจบริการทั่วไป'),
  ('บริษัทซื้อขาย', 'ธุรกิจซื้อขายสินค้า'),
  ('ร้านอาหาร', 'ธุรกิจร้านอาหารและเครื่องดื่ม')
on conflict do nothing;

insert into checklist_templates (name, business_type_id, description)
select 'เช็กลิสต์ปิดงานประจำเดือน - ' || bt.name, bt.id, 'แม่แบบงานประจำเดือนสำหรับ ' || bt.name
from business_types bt
where not exists (
  select 1 from checklist_templates ct where ct.business_type_id = bt.id
);

insert into checklist_template_items (template_id, title, description, sort_order, is_required, due_day_offset, due_day_detail, default_assignee_role)
select ct.id, item.title, item.description, item.sort_order, item.is_required, item.due_day_offset, item.due_day_detail, item.default_assignee_role::app_role
from checklist_templates ct
cross join (
  values
    ('รับเอกสารจากลูกค้า', 'ติดตามและรับเอกสารให้ครบ', 1, true, 0, 'วันเปิดรอบงาน', 'staff'),
    ('ตรวจสอบความครบถ้วน', 'ตรวจสอบความครบถ้วนของเอกสาร', 2, true, 2, 'ภายในวันที่ 2 หลังรับเอกสารครบ', 'staff'),
    ('บันทึกบัญชี', 'บันทึกรายการและจัดหมวดหมู่', 3, true, 5, 'ภายในวันที่ 5 ของรอบงาน', 'staff'),
    ('กระทบยอดและสรุปปัญหา', 'ตรวจสอบยอดและบันทึก blocker', 4, true, 7, 'หัวหน้าทบทวนสรุปภายในวันที่ 7', 'manager')
) as item(title, description, sort_order, is_required, due_day_offset, due_day_detail, default_assignee_role)
where not exists (
  select 1 from checklist_template_items cti where cti.template_id = ct.id and cti.title = item.title
);

insert into customers (code, name, tax_id, business_type_id, service_status, notes)
select seed.code, seed.name, seed.tax_id, bt.id, 'active'::service_status, seed.notes
from (
  values
    ('CUS-001', 'บริษัท เอ บิสซิเนส จำกัด', '0105559000001', 'บริษัทบริการ', 'ลูกค้าทดสอบระบบรายแรก'),
    ('CUS-002', 'บริษัท บี เทรดดิ้ง จำกัด', '0105559000002', 'บริษัทซื้อขาย', 'ลูกค้าทดสอบงานซื้อขาย'),
    ('CUS-003', 'ร้าน ครัวสุขใจ', '3101200000033', 'ร้านอาหาร', 'ลูกค้าทดสอบร้านอาหาร')
) as seed(code, name, tax_id, business_type_name, notes)
join business_types bt on bt.name = seed.business_type_name
where not exists (
  select 1 from customers c where c.code = seed.code
);
