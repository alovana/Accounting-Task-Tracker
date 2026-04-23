import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/phase2/page-header";
import { SectionCard } from "@/components/phase2/section-card";
import { UserManagementForm } from "@/components/phase6/user-management-form";
import { PasswordChangeForm } from "@/components/settings/password-change-form";
import { canAccess } from "@/lib/auth/permissions";
import { requireSessionUser } from "@/lib/auth/session";
import { getEnabledRuleCount, getNotificationStats } from "@/lib/phase5/selectors";
import { getAllUserProfiles, getNotificationLogs, getNotificationRules } from "@/lib/supabase/queries";

export default async function SettingsPage() {
  const currentUser = await requireSessionUser();
  const isAdmin = canAccess(currentUser.role, "manage_settings");
  const canManageNotifications = canAccess(currentUser.role, "manage_notifications");

  const [notificationRules, notificationLogs, adminUsers] = await Promise.all([
    canManageNotifications ? getNotificationRules() : Promise.resolve([]),
    canManageNotifications ? getNotificationLogs() : Promise.resolve([]),
    isAdmin ? getAllUserProfiles() : Promise.resolve([]),
  ]);

  const stats = getNotificationStats(notificationLogs);
  const enabledRules = getEnabledRuleCount(notificationRules);

  return (
    <AppShell>
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-6">
        <PageHeader
          title={isAdmin ? "Settings & Administration" : "My Profile & Security"}
          description={
            isAdmin
              ? "จัดการบัญชีผู้ใช้ ระบบความปลอดภัย และดูภาพรวม notification จากจุดเดียว"
              : "จัดการข้อมูลบัญชีของคุณและเปลี่ยนรหัสผ่านด้วยตัวเอง"
          }
          badge={canManageNotifications ? "Notifications workspace available" : "Profile settings"}
        />

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <SectionCard
            title="My Account"
            description="ข้อมูลผู้ใช้ปัจจุบันและพื้นที่สำหรับดูแลความปลอดภัยของบัญชี"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">ชื่อแสดงผล</p>
                <p className="mt-2 text-base font-semibold text-slate-900">{currentUser.fullName}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">อีเมล</p>
                <p className="mt-2 text-base font-semibold text-slate-900">{currentUser.email}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 md:col-span-2">
                <p className="text-sm text-slate-500">บทบาทปัจจุบัน</p>
                <p className="mt-2 text-base font-semibold capitalize text-slate-900">{currentUser.role}</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Change Password"
            description="ทุกบทบาทสามารถเปลี่ยนรหัสผ่านของตนเองได้ทันทีผ่าน Supabase Auth"
          >
            <PasswordChangeForm />
          </SectionCard>
        </div>

        {canManageNotifications ? (
          <SectionCard
            title="Notification Summary"
            description="ดูภาพรวมแบบย่อ แล้วไปจัดการ workflow การแจ้งเตือนต่อในหน้ารวมโดยตรง"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="grid flex-1 gap-4 sm:grid-cols-4">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">rules ทั้งหมด</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{notificationRules.length}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">enabled rules</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{enabledRules}</p>
                </div>
                {stats.slice(0, 2).map((item) => (
                  <div key={item.label} className="rounded-xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">{item.label}</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="lg:w-72">
                <p className="text-sm text-slate-600">
                  เปิดหน้าจัดการ notification เพื่อดู logs, preview, queue, failed deliveries และ LINE env checklist แบบเต็ม
                </p>
                <Link
                  href="/notifications"
                  className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Open notifications workspace
                </Link>
              </div>
            </div>
          </SectionCard>
        ) : null}

        {isAdmin ? (
          <SectionCard
            title="Admin User Management"
            description="สำหรับ admin เท่านั้น ใช้สร้างผู้ใช้งานใหม่พร้อม email, password, display name และ role ในจุดเดียว"
          >
            <UserManagementForm users={adminUsers} currentUserId={currentUser.id} />
          </SectionCard>
        ) : null}
      </main>
    </AppShell>
  );
}
