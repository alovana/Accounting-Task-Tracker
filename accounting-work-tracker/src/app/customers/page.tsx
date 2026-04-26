import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/phase2/empty-state";
import { PageHeader } from "@/components/phase2/page-header";
import { SectionCard } from "@/components/phase2/section-card";
import { CustomerCreateForm } from "@/components/phase2/customer-create-form";
import { CustomerListPanel } from "@/components/phase2/customer-list-panel";
import { BusinessTypeManagement } from "@/components/phase2/business-type-management";
import { requirePermission } from "@/lib/auth/session";
import { getAssignableUserProfiles, getBusinessTypes, getCustomers } from "@/lib/supabase/queries";

export default async function CustomersPage() {
  await requirePermission("manage_customers");
  const [businessTypes, customers, profiles] = await Promise.all([
    getBusinessTypes(),
    getCustomers(),
    getAssignableUserProfiles(),
  ]);

  const isConnectedMode = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
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
          badge={isConnectedMode ? "Supabase connected mode" : "Mock data mode"}
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
                businessTypes={businessTypes.filter((item) => item.active)}
                staffOptions={staffOptions}
                managerOptions={managerOptions}
              />
            </SectionCard>

            <SectionCard
              title="Business Type Management"
              description="เพิ่ม แก้ไข เปิดปิดใช้งาน หรือลบประเภทธุรกิจจากหน้าเว็บได้เลย โดยระบบจะกันการลบรายการที่ยังถูกใช้งานอยู่"
            >
              <BusinessTypeManagement
                businessTypes={businessTypes}
                isConnectedMode={isConnectedMode}
              />
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
              <>
                {profiles.length === 0 ? (
                  <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    ยังไม่มี user profiles ที่พร้อม assign, แต่ยังแก้ไขข้อมูลลูกค้า ปิด active หรือลบลูกค้าที่ไม่มีประวัติงานได้
                  </div>
                ) : null}
                <CustomerListPanel
                  customers={customers}
                  businessTypes={businessTypes}
                  staffOptions={staffOptions}
                  managerOptions={managerOptions}
                  profilesCount={profiles.length}
                />
              </>
            )}
          </SectionCard>
        </div>
      </main>
    </AppShell>
  );
}
