import { LoginForm } from "@/components/auth/login-form";
import { APP_NAME_TH } from "@/lib/constants";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="flex flex-col justify-center rounded-3xl bg-slate-900 p-8 text-white shadow-xl lg:p-10">
          <p className="text-sm font-medium text-blue-300">MVP Foundation</p>
          <h1 className="mt-4 text-3xl font-semibold leading-tight lg:text-4xl">
            {APP_NAME_TH}
          </h1>
          <p className="mt-4 max-w-xl text-sm text-slate-300 lg:text-base">
            ระบบกลางสำหรับติดตามสถานะงานบัญชีของลูกค้าแบบรายเดือน ช่วยให้ทีมงาน,
            หัวหน้าทีม และผู้จัดการเห็นภาพรวมงานได้ชัดเจนขึ้น
          </p>

          <ul className="mt-8 space-y-3 text-sm text-slate-200">
            <li>- ติดตามงานรายเดือนแบบรวมศูนย์</li>
            <li>- เตรียมพร้อมเชื่อม role-based access</li>
            <li>- รองรับการต่อยอดไปยัง dashboard และ checklist modules</li>
          </ul>
        </section>

        <section className="flex items-center">
          <LoginForm />
        </section>
      </div>
    </main>
  );
}
