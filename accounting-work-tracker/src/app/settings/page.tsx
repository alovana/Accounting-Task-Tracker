import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/phase2/page-header";
import { SectionCard } from "@/components/phase2/section-card";
import { requireSessionUser } from "@/lib/auth/session";

export default async function SettingsPage() {
  const currentUser = await requireSessionUser();

  return (
    <AppShell>
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-5 sm:px-6 lg:py-8">
        <PageHeader
          title="Settings"
          description="ข้อมูลบัญชีและสถานะการรันระบบในเครื่อง"
          badge="Local mode"
          hideDescription={false}
        />

        <SectionCard title="บัญชีที่ใช้งาน">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">ชื่อ</p>
              <p className="mt-1 font-bold text-slate-950">{currentUser.fullName}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">อีเมล</p>
              <p className="mt-1 font-bold text-slate-950">{currentUser.email}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">ระดับสิทธิ์</p>
              <p className="mt-1 font-bold text-slate-950">{currentUser.role}</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="สถานะระบบ">
          <div className="space-y-3 text-sm text-slate-700">
            <p>ตอนนี้ระบบเน้นรันในเครื่องก่อน และใช้ demo login ใน dev mode</p>
            <p>สถานะงานในหน้า My Tasks บันทึกลง Supabase และใช้ร่วมกันได้ทุกเครื่อง</p>
            <p>Demo login ใช้เฉพาะตอนพัฒนาในเครื่อง ส่วนระบบออนไลน์ใช้บัญชี Supabase</p>
          </div>
        </SectionCard>
      </main>
    </AppShell>
  );
}
