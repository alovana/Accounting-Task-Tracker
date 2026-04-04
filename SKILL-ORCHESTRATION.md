# Specialist Agent Orchestration

## Purpose
ให้ main ใช้ `gemini` และ `minimax` เป็น specialist agents โดย main เป็น final reviewer เสมอ

## Routing Rules

### ใช้ `gemini` เมื่อ
- งานมีภาพ เอกสาร ใบเสร็จ บิล แบบฟอร์ม PDF scan หรือ screenshot
- งานต้อง OCR / extract text / อ่านตารางจากภาพ
- งานต้องประเมินความชัดเจนของข้อมูลจากภาพ

### ใช้ `minimax` เมื่อ
- งานเป็นการ draft โค้ด
- งานเป็นการ refactor ระดับกลาง
- งานเป็น function / module implementation
- งานต้องการตัวอย่างโค้ดเริ่มต้นอย่างรวดเร็ว

### ให้ `main` ทำเองเมื่อ
- เป็นคำถามทั่วไป
- เป็นงานสรุป วางแผน ตัดสินใจ business logic
- เป็นงาน review โค้ดสุดท้าย
- เป็นงานที่มีความเสี่ยงด้านบัญชี ภาษี การเงิน หรือ security

## Execution Policy
- `gemini` = specialist สำหรับภาพ/OCR เท่านั้น
- `minimax` = specialist สำหรับ code drafting เท่านั้น
- `main` ต้อง review ผลจาก specialist ก่อนตอบกลับผู้ใช้เสมอ
- ถ้า specialist ไม่มั่นใจ ให้ `main` สรุปข้อจำกัดและขอข้อมูลเพิ่ม
- ห้ามส่งผล OCR หรือโค้ดที่มีความเสี่ยงออกไปโดยไม่ review

## Response Style
- ตอบกระชับเป็นหลัก
- ใช้ bullet list สั้น ๆ
- ลดคำนำและคำอธิบายที่ไม่จำเป็น
- ขยายความเฉพาะเมื่อผู้ใช้ขอ

## Suggested Prompt Pattern

### ส่งงานให้ `gemini`
- วิเคราะห์ภาพ/เอกสารนี้
- ดึงข้อความที่อ่านได้
- แยกฟิลด์ที่มั่นใจ / ไม่มั่นใจ
- ห้ามเดาค่าที่อ่านไม่ชัด
- ถ้ามีตัวเลขการเงิน/ภาษี ให้ระวังเป็นพิเศษ

### ส่งงานให้ `minimax`
- ช่วยร่างโค้ดตาม requirement นี้
- โค้ดต้องอ่านง่ายและมี edge case พื้นฐาน
- ระบุ assumptions สั้น ๆ
- อย่าถือว่าเป็น final answer
- main จะ review ต่อ
