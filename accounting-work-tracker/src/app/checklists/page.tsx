import { AppShell } from "@/components/app-shell";
import { ChecklistManagement } from "@/components/checklists/checklist-management";
import { EmptyState } from "@/components/phase2/empty-state";
import { PageHeader } from "@/components/phase2/page-header";
import { SectionCard } from "@/components/phase2/section-card";
import { requirePermission } from "@/lib/auth/session";
import { getBusinessTypes, getChecklistTemplateItems, getChecklistTemplates } from "@/lib/supabase/queries";

export default async function ChecklistsPage() {
  await requirePermission("manage_checklists");
  const [businessTypes, checklistTemplates, checklistTemplateItems] = await Promise.all([
    getBusinessTypes(),
    getChecklistTemplates(),
    getChecklistTemplateItems(),
  ]);

  const isConnectedMode = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  return (
    <AppShell>
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-6">
        <PageHeader
          title="Checklist Templates"
          description="แม่แบบงานหลักของแต่ละประเภทธุรกิจสำหรับใช้ต่อยอดเป็นงานรายเดือน"
          badge={isConnectedMode ? "Supabase connected mode" : "Mock data mode"}
        />

        <SectionCard
          title="จัดการ Template และ Checklist Items"
          description="ผู้จัดการและแอดมินสามารถเพิ่ม แก้ไข ปิดใช้งาน และลบ template พร้อมรายการย่อยได้จากหน้านี้"
        >
          {checklistTemplates.length === 0 ? (
            <div className="space-y-4">
              <EmptyState
                title="ยังไม่มี checklist template"
                description="สร้าง template แรกได้จากฟอร์มด้านล่าง"
              />
              <ChecklistManagement
                businessTypes={businessTypes}
                checklistTemplates={checklistTemplates}
                checklistTemplateItems={checklistTemplateItems}
                isConnectedMode={isConnectedMode}
              />
            </div>
          ) : (
            <ChecklistManagement
              businessTypes={businessTypes}
              checklistTemplates={checklistTemplates}
              checklistTemplateItems={checklistTemplateItems}
              isConnectedMode={isConnectedMode}
            />
          )}
        </SectionCard>
      </main>
    </AppShell>
  );
}
