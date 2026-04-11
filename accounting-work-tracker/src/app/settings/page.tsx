import { EmptyState } from "@/components/phase2/empty-state";
import { PageHeader } from "@/components/phase2/page-header";
import { SectionCard } from "@/components/phase2/section-card";
import { NotificationIssueList } from "@/components/phase5/notification-issue-list";
import { NotificationLogList } from "@/components/phase5/notification-log-list";
import { NotificationPreviewList } from "@/components/phase5/notification-preview-list";
import { NotificationRuleList } from "@/components/phase5/notification-rule-list";
import { LineTestForm } from "@/components/phase5/line-test-form";
import { DeploymentReadinessCard } from "@/components/phase6/deployment-readiness-card";
import { ReadinessChecklist } from "@/components/phase6/readiness-checklist";
import { requirePermission } from "@/lib/auth/session";
import { getLatestNotificationIssues, previewNotificationDispatch } from "@/lib/phase5/notification-engine";
import { getEnabledRuleCount, getNotificationStats } from "@/lib/phase5/selectors";
import { getNotificationLogs, getNotificationRules } from "@/lib/supabase/queries";

const readinessItems = [
  "role-based access scaffold พร้อมสำหรับต่อยอด auth จริง",
  "query layer รองรับ mock-to-Supabase fallback ครบทุก phase หลัก",
  "มี schema แยกตาม Phase 2-5 สำหรับนำไปรันใน Supabase",
  "dashboard, reports, notifications และ settings พร้อมสำหรับ MVP demo",
  "project status และ phase status docs ถูกอัปเดตแล้ว",
];

const schemaFiles = ["phase2-schema.sql", "phase3-schema.sql", "phase5-schema.sql"];

export default async function SettingsPage() {
  await requirePermission("manage_settings");
  const [notificationRules, notificationLogs] = await Promise.all([
    getNotificationRules(),
    getNotificationLogs(),
  ]);

  const stats = getNotificationStats(notificationLogs);
  const enabledRules = getEnabledRuleCount(notificationRules);
  const failedLogs = getLatestNotificationIssues(notificationLogs);
  const previews = previewNotificationDispatch();
  const envConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-6">
      <PageHeader
        title="Settings & Readiness"
        description="รวม notification settings, readiness checklist, และ deployment prep ในหน้าเดียว"
        badge={envConfigured ? "Deployment env ready" : "Env setup pending"}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <SectionCard
          title="Phase 6 Readiness Checklist"
          description="สรุปความพร้อมด้าน role access, hardening เชิงแอป, responsive และ deployment prep"
        >
          <ReadinessChecklist items={readinessItems} />
        </SectionCard>

        <DeploymentReadinessCard envConfigured={envConfigured} schemaFiles={schemaFiles} />
      </div>

      <section className="grid gap-4 md:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">rules ทั้งหมด</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{notificationRules.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">enabled rules</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{enabledRules}</p>
        </div>
        {stats.map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{item.value}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <SectionCard
          title="Notification Rules"
          description="กฎการแจ้งเตือนสำหรับ completed, blocked, และ overdue alerts"
        >
          {notificationRules.length === 0 ? (
            <EmptyState
              title="ยังไม่มี notification rules"
              description="เพิ่มกฎการแจ้งเตือนเพื่อให้ระบบส่ง LINE OA ได้ในอนาคต"
            />
          ) : (
            <NotificationRuleList rules={notificationRules} />
          )}
        </SectionCard>

        <SectionCard
          title="Notification Logs"
          description="ดูสถานะการส่งแจ้งเตือนล่าสุดว่าคิวสำเร็จหรือมีปัญหาตรงไหน"
        >
          {notificationLogs.length === 0 ? (
            <EmptyState
              title="ยังไม่มี notification logs"
              description="เมื่อระบบเริ่ม trigger notifications จะมีประวัติในส่วนนี้"
            />
          ) : (
            <NotificationLogList logs={notificationLogs} />
          )}
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <SectionCard
          title="Preview Messages"
          description="พรีวิวข้อความแจ้งเตือนก่อนต่อยอดไปยัง LINE OA integration จริง"
        >
          {previews.length === 0 ? (
            <EmptyState
              title="ยังไม่มีข้อความตัวอย่าง"
              description="เมื่อมี rules ที่เปิดใช้งาน ระบบจะสร้าง preview ได้ในส่วนนี้"
            />
          ) : (
            <NotificationPreviewList items={previews} />
          )}
        </SectionCard>

        <SectionCard
          title="LINE OA Test Queue"
          description="เพิ่มข้อความทดสอบเข้า line_notifications เพื่อเช็ก flow การคิวและ log"
        >
          <LineTestForm />
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <SectionCard
          title="Failed Deliveries"
          description="ดูรายการแจ้งเตือนที่ล้มเหลวเพื่อใช้ debug การเชื่อม LINE OA"
        >
          {failedLogs.length === 0 ? (
            <EmptyState
              title="ยังไม่มี failed deliveries"
              description="ตอนนี้ยังไม่มีปัญหาการส่งแจ้งเตือน"
            />
          ) : (
            <NotificationIssueList logs={failedLogs} />
          )}
        </SectionCard>
      </div>
    </main>
  );
}
