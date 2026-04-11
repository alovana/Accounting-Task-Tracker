import { EmptyState } from "@/components/phase2/empty-state";
import { PageHeader } from "@/components/phase2/page-header";
import { SectionCard } from "@/components/phase2/section-card";
import { StatusBadge } from "@/components/phase2/status-badge";
import { requirePermission } from "@/lib/auth/session";
import { getBusinessTypeName } from "@/lib/mappers";
import { getBusinessTypes, getChecklistTemplateItems, getChecklistTemplates } from "@/lib/supabase/queries";

export default async function ChecklistsPage() {
  await requirePermission("manage_checklists");
  const [businessTypes, checklistTemplates, checklistTemplateItems] = await Promise.all([
    getBusinessTypes(),
    getChecklistTemplates(),
    getChecklistTemplateItems(),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-6">
      <PageHeader
        title="Checklist Templates"
        description="แม่แบบงานหลักของแต่ละประเภทธุรกิจสำหรับใช้ต่อยอดเป็นงานรายเดือน"
        badge={process.env.NEXT_PUBLIC_SUPABASE_URL ? "Supabase connected mode" : "Mock data mode"}
      />

      <SectionCard
        title="รายการ Template"
        description="โครงพร้อมต่อยอดไปสู่ create/edit/reorder ในรอบถัดไป"
      >
        {checklistTemplates.length === 0 ? (
          <EmptyState
            title="ยังไม่มี checklist template"
            description="เพิ่มข้อมูลใน Supabase แล้ว refresh หน้าเพื่อโหลดข้อมูลจริง"
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {checklistTemplates.map((template) => {
              const items = checklistTemplateItems
                .filter((item) => item.templateId === template.id)
                .sort((a, b) => a.sortOrder - b.sortOrder);

              return (
                <article key={template.id} className="rounded-2xl bg-slate-50 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">{template.name}</h3>
                      <p className="mt-1 text-sm text-slate-600">{template.description}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        ประเภทธุรกิจ: {getBusinessTypeName(template.businessTypeId, businessTypes)}
                      </p>
                    </div>
                    <StatusBadge label={template.active ? "active" : "inactive"} tone="green" />
                  </div>

                  <div className="mt-4 space-y-3">
                    {items.length === 0 ? (
                      <EmptyState
                        title="ยังไม่มีรายการย่อย"
                        description="เพิ่ม template items เพื่อให้ระบบสร้างงานรายเดือนได้"
                      />
                    ) : (
                      items.map((item) => (
                        <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-medium text-slate-900">
                              {item.sortOrder}. {item.title}
                            </p>
                            <StatusBadge
                              label={item.isRequired ? "required" : "optional"}
                              tone={item.isRequired ? "green" : "slate"}
                            />
                          </div>
                          <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                            <span className="rounded-full bg-slate-100 px-3 py-1">
                              due +{item.dueDayOffset} วัน
                            </span>
                            <span className="rounded-full bg-slate-100 px-3 py-1">
                              assignee role: {item.defaultAssigneeRole}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </SectionCard>
    </main>
  );
}
