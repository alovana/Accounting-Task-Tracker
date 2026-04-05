# PRD: ระบบตรวจสอบและติดตามสถานะงานบัญชี

## เป้าหมาย
สร้างระบบกลางสำหรับติดตามสถานะงานบัญชีของลูกค้าแต่ละราย แยกตามเดือน แยกตามพนักงาน และตรวจสอบได้แบบ real-time

## ปัญหาที่ต้องแก้
- หัวหน้าต้องคอยถามงานซ้ำ
- พนักงานไม่เห็นภาพรวมงานรายเดือนชัด
- เช็กลิสต์แต่ละประเภทธุรกิจไม่เหมือนกัน
- ติดตาม blocker และความคืบหน้ายาก
- การรายงานผลทีมไม่ real-time

## ผู้ใช้งาน
- พนักงานบัญชี
- หัวหน้าทีม / ผู้จัดการ
- แอดมินระบบ

## Use Cases หลัก
1. แอดมินสร้าง template checklist ตามประเภทธุรกิจ
2. ผูก checklist ให้ลูกค้าแต่ละราย
3. ระบบสร้างงานรายเดือนอัตโนมัติ
4. พนักงานอัปเดตสถานะงานและ blocker
5. หัวหน้าดู dashboard ภาพรวมทีมและรายบุคคล
6. ระบบแจ้งเตือนผ่าน Line OA เมื่อมีเหตุการณ์สำคัญ

## สถานะงานที่แนะนำ
- not_started
- in_progress
- waiting_customer
- blocked
- completed
- skipped

## โมดูลหลัก
### 1. Authentication & Roles
- login
- role: admin, manager, staff

### 2. Customer Management
- ข้อมูลลูกค้า
- ประเภทธุรกิจ
- ผู้รับผิดชอบหลัก
- สถานะการให้บริการ

### 3. Checklist Templates
- template ตามประเภทธุรกิจ
- item ยืดหยุ่นได้
- กำหนดลำดับ / บังคับ / due offset ได้

### 4. Monthly Work Tracking
- สร้างงานประจำเดือนจาก template
- อัปเดตสถานะได้ทีละ checklist item
- บันทึกหมายเหตุ / blocker / วันที่เสร็จ

### 5. Dashboards
- Staff dashboard
- Manager dashboard
- KPI รายบุคคล / รายทีม

### 6. Notifications
- Line OA notify เมื่อ completed / blocked / overdue

## KPI เบื้องต้น
- % งานเสร็จตรงเวลา
- จำนวนงานค้าง
- จำนวนงาน blocked
- จำนวนลูกค้าที่ยังไม่ครบ checklist
- performance รายพนักงาน

## Non-functional Requirements
- รองรับมือถือ แท็บเล็ต คอม
- responsive UI
- โหลดเร็ว
- audit log สำหรับการอัปเดตสถานะสำคัญ
- role-based access

## MVP Phase 1
- login / role
- ลูกค้า
- checklist templates
- monthly task generation
- update status / blocker
- manager dashboard
- Line OA notifications

## Phase 2
- analytics ลึกขึ้น
- export report
- เอกสารแนบ
- SLA / escalation
- calendar / recurring automation เพิ่มเติม
