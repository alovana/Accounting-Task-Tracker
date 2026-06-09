import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/phase2/page-header";
import { SectionCard } from "@/components/phase2/section-card";
import { requirePermission } from "@/lib/auth/session";
import { monthlyAccountingWorkflow } from "@/lib/monthly-workflow";

export default async function ChecklistsPage() {
  await requirePermission("manage_checklists");

  return (
    <AppShell>
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-5 sm:px-6 lg:py-8">
        <PageHeader
          title="Checklist"
          description="7 ขั้นตอนหลักของงานบัญชีประจำเดือน"
          badge="Standard workflow"
          hideDescription={false}
        />

        <SectionCard title="Monthly Accounting Workflow">
          <div className="space-y-3">
            {monthlyAccountingWorkflow.map((item, index) => (
              <div key={item.title} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-sm font-bold text-slate-950">
                  {index + 1}
                </div>
                <div>
                  <p className="font-bold text-slate-950">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </main>
    </AppShell>
  );
}
