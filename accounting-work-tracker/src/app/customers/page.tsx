import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/phase2/empty-state";
import { PageHeader } from "@/components/phase2/page-header";
import { SectionCard } from "@/components/phase2/section-card";
import { requirePermission } from "@/lib/auth/session";
import { getBusinessTypes, getCustomers } from "@/lib/supabase/queries";

export default async function CustomersPage() {
  await requirePermission("manage_customers");
  const [businessTypes, customers] = await Promise.all([getBusinessTypes(), getCustomers()]);
  const businessTypeMap = new Map(businessTypes.map((item) => [item.id, item.name]));

  return (
    <AppShell>
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-5 sm:px-6 lg:py-8">
        <PageHeader
          title="Customers"
          description="รายชื่อลูกค้าที่ใช้สร้างรอบงานบัญชีรายเดือน"
          badge="Local data"
          hideDescription={false}
        />

        <SectionCard title="รายชื่อลูกค้า">
          {customers.length === 0 ? (
            <EmptyState title="ยังไม่มีลูกค้า" description="เพิ่มข้อมูลลูกค้าเมื่อพร้อมเชื่อมฐานข้อมูลจริง" />
          ) : (
            <div className="space-y-3">
              {customers.map((customer) => (
                <div key={customer.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-bold text-slate-950">{customer.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{customer.code} · {customer.taxId}</p>
                    </div>
                    <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                      {customer.serviceStatus}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
                    <p>ประเภท: {businessTypeMap.get(customer.businessTypeId) ?? "-"}</p>
                    <p>ผู้รับผิดชอบ: {customer.assignedUserName}</p>
                    <p>ผู้จัดการ: {customer.managerUserName}</p>
                  </div>
                  {customer.notes ? <p className="mt-3 rounded-xl bg-white px-3 py-2 text-sm text-slate-600">{customer.notes}</p> : null}
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </main>
    </AppShell>
  );
}
