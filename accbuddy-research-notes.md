# AccBuddy Research Notes

## Scope
Researching product structure, workflow, and UX patterns from the demo system for building an adapted internal accounting-office web app.

## Findings so far

### Platform / stack clues
- Public site appears to be built with Next.js + React.
- Uses `/_next/static/...` assets.
- Google Sign-In client is loaded.
- Thai-first interface.

### Login / access
- Login screen with username + password.
- Has quick-fill demo users: `admin`, `staff`, `viewer`.
- Indicates role-based access / multi-role demo.

### Main navigation discovered
- แดชบอร์ด
- ศูนย์รายงาน
- ความเรียบร้อยของงาน
- จัดการลูกค้า
- จัดการงาน
- ใบแจ้งหนี้
- บัญชี/รายรับ-จ่าย
- เอกสาร
- นำเข้าข้อมูล
- จุดเตรียมยื่นภาษี
- จัดการบริการ
- ผู้ใช้งาน
- ตั้งค่า
- ศูนย์เรียนรู้

### Dashboard observations
- Role/profile shown in header.
- Search bar in top section.
- Cloud sync status shown.
- Empty state for onboarding/demo data.
- CTA to enable demo mode.
- KPI cards like customers, tasks, documents.
- Revenue vs expenses chart for recent 6 months.

### Reports center observations
- Page looks like management reporting center.
- Has company filter combobox.
- Export actions: Excel, Print.
- Shows performance metric like on-time delivery rate.
- Likely intended for summary reporting across accounting/tax operations.

## Product direction inferred
This is not just a bookkeeping app. It looks like an accounting-office operations system combining:
- CRM/customer portfolio
- work tracking
- invoicing
- accounting entries / income-expense
- document management
- tax preparation workflow
- reporting / analytics
- role-based administration
