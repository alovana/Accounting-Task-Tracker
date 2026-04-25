import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/phase2/empty-state";
import { PageHeader } from "@/components/phase2/page-header";
import { SectionCard } from "@/components/phase2/section-card";
import { StatusBadge } from "@/components/phase2/status-badge";
import { CustomerCreateForm } from "@/components/phase2/customer-create-form";
import { CustomerManagementForm } from "@/components/phase2/customer-management-form";
import { requirePermission } from "@/lib/auth/session";
import { getBusinessTypeName, getServiceStatusLabel } from "@/lib/mappers";
import { getAssignableUserProfiles, getBusinessTypes, getCustomers } from "@/lib/supabase/queries";

export default async function CustomersPage() {
  await requirePermission("manage_customers");
  const [businessTypes, customers, profiles] = await Promise.all([
    getBusinessTypes(),
    getCustomers(),
    getAssignableUserProfiles(),
  ]);

  const staffOptions = profiles;
  const managerOptions = profiles.filter((item) => item.role === "admin" || item.role === "manager");

  const summary = [
    { label: "ลูกค้าทั้งหมด", value: customers.length.toString() },
    {
      label: "ประเภทธุรกิจ",
      value: businessTypes.length.toString(),
    },
    {
      label: "กำลังเริ่มต้นบริการ",
      value: customers.filter((item) => item.serviceStatus === "onboarding").length.toString(),
    },
  ];

  return (
    <AppShell>
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-6">
      <PageHeader
        title="Customer Management"
        description="จัดการข้อมูลลูกค้าและประเภทธุรกิจสำหรับใช้ต่อยอดงานรายเดือน"
        badge={process.env.NEXT_PUBLIC_SUPABASE_URL ? "Supabase connected mode" : "Mock data mode"}
      />

      <section className="grid gap-4 md:grid-cols-3">
        {summary.map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{item.value}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-6">
          <SectionCard
            title="เพิ่มลูกค้าใหม่"
            description="สำหรับ manager และ admin ที่มีสิทธิ์ manage_customers สามารถสร้างลูกค้าและตั้ง owner เริ่มต้นได้จากหน้านี้"
          >
            <CustomerCreateForm
              businessTypes={businessTypes}
              staffOptions={staffOptions}
              managerOptions={managerOptions}
            />
          </SectionCard>

        <SectionCard
          title="ประเภทธุรกิจ"
          description="รายการ business types ที่จะใช้ผูกกับลูกค้าและ checklist templates"
        >
          {businessTypes.length === 0 ? (
            <EmptyState
              title="ยังไม่มีประเภทธุรกิจ"
              description="เพิ่มข้อมูล business types ใน Supabase หรือใช้ mock data ระหว่างพัฒนา"
            />
          ) : (
            <div className="space-y-3">
              {businessTypes.map((item) => (
                <div key={item.id} className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{item.name}</p>
                      <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                    </div>
                    <StatusBadge label={item.active ? "active" : "inactive"} tone="green" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
        </div>

        <SectionCard
          title="รายการลูกค้า"
          description="แก้ไขรายละเอียดลูกค้า กำหนด owner ปิดใช้งาน หรือลบอย่างปลอดภัยจากหน้าเดียว โดยข้อมูลที่เกี่ยวข้องจะถูก revalidate อัตโนมัติ"
        >
          {customers.length === 0 ? (
            <EmptyState
              title="ยังไม่มีข้อมูลลูกค้า"
              description="เมื่อเชื่อม Supabase แล้ว ข้อมูลลูกค้าจะแสดงในส่วนนี้ทันที"
            />
          ) : (
            <div className="space-y-4">
              {profiles.length === 0 ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  ยังไม่มี user profiles ที่พร้อม assign, แต่ยังแก้ไขข้อมูลลูกค้า ปิด active หรือลบลูกค้าที่ไม่มีประวัติงานได้
                </div>
              ) : null}
              {customers.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-slate-500">{item.code}</p>
                        <h3 className="text-base font-semibold text-slate-900">{item.name}</h3>
                        <p className="mt-1 text-xs text-slate-500">Tax ID: {item.taxId}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                        <span>{getBusinessTypeName(item.businessTypeId, businessTypes)}</span>
                        <span className="text-slate-300">•</span>
                        <span>Staff: {item.assignedUserName}</span>
                        <span className="text-slate-300">•</span>
                        <span>Manager: {item.managerUserName}</span>
                        <span className="text-slate-300">•</span>
                        <span>{item.active ? "active" : "inactive"}</span>
                      </div>
                      {item.notes ? <p className="text-sm text-slate-500">{item.notes}</p> : null}
                    </div>
                    <StatusBadge
                      label={getServiceStatusLabel(item.serviceStatus)}
                      tone={item.serviceStatus === "onboarding" ? "amber" : "green"}
                    />
                  </div>

                  <div className="mt-4">
                    <CustomerManagementForm
                      customer={item}
                      businessTypes={businessTypes}
                      staffOptions={staffOptions}
                      managerOptions={managerOptions}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
      </main>
    </AppShell>
  );
}
