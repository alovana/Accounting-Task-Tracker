import { SectionCard } from "@/components/phase2/section-card";
import { StatusBadge } from "@/components/phase2/status-badge";
import { checklistTemplateItems, checklistTemplates } from "@/lib/mock/phase2-data";
import { getBusinessTypeName } from "@/lib/mappers";

export default function ChecklistsPage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-6">
      <SectionCard
        title="Checklist Templates"
        description="แม่แบบงานหลักของแต่ละประเภทธุรกิจสำหรับใช้ต่อยอดเป็นงานรายเดือน"
      >
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
                      ประเภทธุรกิจ: {getBusinessTypeName(template.businessTypeId)}
                    </p>
                  </div>
                  <StatusBadge label={template.active ? "active" : "inactive"} tone="green" />
                </div>

                <div className="mt-4 space-y-3">
                  {items.map((item) => (
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
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </SectionCard>
    </main>
  );
}
