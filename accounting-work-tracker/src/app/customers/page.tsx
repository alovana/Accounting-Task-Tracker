import { SectionCard } from "@/components/phase2/section-card";
import { StatusBadge } from "@/components/phase2/status-badge";
import { businessTypes, customers } from "@/lib/mock/phase2-data";
import { getBusinessTypeName, getServiceStatusLabel } from "@/lib/mappers";

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

export default function CustomersPage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-6">
      <section className="grid gap-4 md:grid-cols-3">
        {summary.map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{item.value}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <SectionCard
          title="ประเภทธุรกิจ"
          description="รายการ business types ที่จะใช้ผูกกับลูกค้าและ checklist templates"
        >
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
        </SectionCard>

        <SectionCard
          title="Customer Management"
          description="โครงหน้าสำหรับบริหารข้อมูลลูกค้าใน Phase 2"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-3">
              <thead>
                <tr className="text-left text-sm text-slate-500">
                  <th className="px-3">รหัส</th>
                  <th className="px-3">ชื่อลูกค้า</th>
                  <th className="px-3">ประเภทธุรกิจ</th>
                  <th className="px-3">ผู้รับผิดชอบ</th>
                  <th className="px-3">สถานะบริการ</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((item) => (
                  <tr key={item.id} className="rounded-2xl bg-slate-50 text-sm text-slate-700">
                    <td className="rounded-l-2xl px-3 py-4 font-medium text-slate-900">{item.code}</td>
                    <td className="px-3 py-4">
                      <p className="font-medium text-slate-900">{item.name}</p>
                      <p className="mt-1 text-xs text-slate-500">Tax ID: {item.taxId}</p>
                    </td>
                    <td className="px-3 py-4">{getBusinessTypeName(item.businessTypeId)}</td>
                    <td className="px-3 py-4">
                      <p>{item.assignedUserName}</p>
                      <p className="mt-1 text-xs text-slate-500">ผู้จัดการ: {item.managerUserName}</p>
                    </td>
                    <td className="rounded-r-2xl px-3 py-4">
                      <StatusBadge
                        label={getServiceStatusLabel(item.serviceStatus)}
                        tone={item.serviceStatus === "onboarding" ? "amber" : "green"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </main>
  );
}
