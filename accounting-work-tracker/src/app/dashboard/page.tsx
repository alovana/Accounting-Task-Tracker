import { AppShell } from "@/components/app-shell";

const kpis = [
  { label: "ลูกค้าที่ดูแล", value: "48" },
  { label: "งานที่ต้องทำวันนี้", value: "16" },
  { label: "งานติดปัญหา", value: "4" },
  { label: "งานเสร็จแล้วเดือนนี้", value: "128" },
];

const blockers = [
  {
    customer: "บริษัท เอ บิสซิเนส จำกัด",
    issue: "รอเอกสารใบกำกับภาษีจากลูกค้า",
    owner: "พนักงาน A",
  },
  {
    customer: "บริษัท บี เทรดดิ้ง จำกัด",
    issue: "รออนุมัติรายการปรับปรุงบัญชี",
    owner: "พนักงาน B",
  },
];

export default function DashboardPage() {
  return (
    <AppShell>
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {kpis.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{item.value}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">ภาพรวมงานรายเดือน</h3>
              <p className="text-sm text-slate-500">
                มุมมองเริ่มต้นสำหรับติดตามงานของทีมบัญชีแบบ real-time
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">สถานะเด่น</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  <li>- งานกำลังดำเนินการ 24 รายการ</li>
                  <li>- รอเอกสารจากลูกค้า 7 รายการ</li>
                  <li>- งานใกล้ครบกำหนด 5 รายการ</li>
                </ul>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">สิ่งที่จะทำต่อใน MVP</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  <li>- เชื่อมฐานข้อมูล Supabase</li>
                  <li>- ทำ customer management</li>
                  <li>- ทำ checklist template</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold">งานติดปัญหา</h3>
            <div className="mt-4 space-y-3">
              {blockers.map((item) => (
                <div key={item.customer} className="rounded-xl bg-amber-50 p-4">
                  <p className="font-medium text-slate-900">{item.customer}</p>
                  <p className="mt-1 text-sm text-slate-700">{item.issue}</p>
                  <p className="mt-2 text-xs text-slate-500">ผู้รับผิดชอบ: {item.owner}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
