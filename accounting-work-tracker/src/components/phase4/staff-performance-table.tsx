"use client";

import { useMemo, useState } from "react";

type StaffSummary = {
  owner: string;
  total: number;
  blocked: number;
  inProgress: number;
  waitingCustomer: number;
  completed: number;
  completionRate: number;
};

type MetricItem = {
  key: string;
  label: string;
  value: number;
  tone: string;
  softTone: string;
  color: string;
};

function getCompletionTone(rate: number) {
  if (rate >= 80) {
    return "bg-emerald-500";
  }

  if (rate >= 50) {
    return "bg-amber-400";
  }

  return "bg-rose-500";
}

function getCompletionColor(rate: number) {
  if (rate >= 80) {
    return "#10b981";
  }

  if (rate >= 50) {
    return "#f59e0b";
  }

  return "#ef4444";
}

function getRiskLabel(row: StaffSummary) {
  if (row.blocked >= 2) {
    return { label: "Risk", className: "border border-rose-200 bg-rose-50/90 text-rose-700" };
  }

  if (row.waitingCustomer >= 2) {
    return { label: "Waiting", className: "border border-amber-200 bg-amber-50/90 text-amber-700" };
  }

  if (row.completionRate >= 80) {
    return { label: "Healthy", className: "border border-emerald-200 bg-emerald-50/90 text-emerald-700" };
  }

  return { label: "Active", className: "border border-blue-200 bg-blue-50/90 text-blue-700" };
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "NA";
}

function getMetrics(row: StaffSummary): MetricItem[] {
  return [
    {
      key: "in-progress",
      label: "กำลังทำ",
      value: row.inProgress,
      tone: "bg-slate-900",
      softTone: "bg-slate-100 text-slate-700",
      color: "#334155",
    },
    {
      key: "blocked",
      label: "ติดปัญหา",
      value: row.blocked,
      tone: "bg-rose-500",
      softTone: "bg-rose-50 text-rose-700",
      color: "#ef4444",
    },
    {
      key: "waiting",
      label: "รอลูกค้า",
      value: row.waitingCustomer,
      tone: "bg-amber-400",
      softTone: "bg-amber-50 text-amber-700",
      color: "#f59e0b",
    },
    {
      key: "completed",
      label: "เสร็จแล้ว",
      value: row.completed,
      tone: "bg-emerald-500",
      softTone: "bg-emerald-50 text-emerald-700",
      color: "#10b981",
    },
  ];
}

function DonutChart({ completionRate, total }: { completionRate: number; total: number }) {
  const progressAngle = Math.max(0, Math.min(completionRate, 100)) * 3.6;
  const progressColor = getCompletionColor(completionRate);

  return (
    <div className="relative mx-auto h-56 w-56">
      <div
        className="h-full w-full rounded-full shadow-[inset_0_2px_24px_rgba(255,255,255,0.18)]"
        style={{
          background: `conic-gradient(${progressColor} 0deg ${progressAngle}deg, rgba(255,255,255,0.16) ${progressAngle}deg 360deg)`,
        }}
      />
      <div className="absolute inset-4 rounded-full bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.28),transparent_55%)]" />
      <div className="absolute inset-[22%] flex flex-col items-center justify-center rounded-full border border-white/20 bg-slate-950 text-center shadow-[0_18px_30px_-22px_rgba(15,23,42,0.9)] backdrop-blur">
        <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Completion</p>
        <p className="mt-2 text-4xl font-semibold text-white">{completionRate}%</p>
        <p className="mt-1 text-sm text-slate-400">จากทั้งหมด {total} งาน</p>
      </div>
    </div>
  );
}

function BarChart({ metrics, maxValue }: { metrics: MetricItem[]; maxValue: number }) {
  const safeMax = maxValue || 1;

  return (
    <div className="space-y-4">
      {metrics.map((metric) => (
        <div key={metric.key} className="space-y-2">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>{metric.label}</span>
            <span className="font-semibold text-slate-900">{metric.value}</span>
          </div>
          <div className="h-3 rounded-full bg-slate-100">
            <div
              className={`h-3 rounded-full ${metric.tone}`}
              style={{ width: `${(metric.value / safeMax) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function StaffPerformanceTable({ rows }: { rows: StaffSummary[] }) {
  const [selectedOwner, setSelectedOwner] = useState(rows[0]?.owner ?? "");

  const selectedRow = useMemo(() => {
    return rows.find((row) => row.owner === selectedOwner) ?? rows[0];
  }, [rows, selectedOwner]);

  if (!selectedRow) {
    return null;
  }

  const metrics = getMetrics(selectedRow);
  const maxMetricValue = Math.max(...metrics.map((item) => item.value), 1);
  const risk = getRiskLabel(selectedRow);

  return (
    <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-4">
        <div className="mb-4">
          <p className="text-sm font-semibold text-slate-900">Team Members</p>
          <p className="mt-1 text-xs text-slate-500">เลือกชื่อเพื่อดู performance detail ด้านขวา</p>
        </div>

        <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
          {rows.map((row) => {
            const isActive = row.owner === selectedRow.owner;

            return (
              <button
                key={row.owner}
                type="button"
                onClick={() => setSelectedOwner(row.owner)}
                className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                  isActive
                    ? "border-slate-900 bg-slate-900 text-white shadow-lg"
                    : "border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold ${
                    isActive ? "bg-white/15 text-white" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {getInitials(row.owner)}
                </div>
                <p className={`truncate font-medium ${isActive ? "text-white" : "text-slate-950"}`}>{row.owner}</p>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="relative overflow-hidden rounded-[30px] border border-slate-200/80 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_30%),radial-gradient(circle_at_top_left,rgba(245,158,11,0.14),transparent_32%),linear-gradient(135deg,#0f172a_0%,#111827_42%,#1e293b_100%)] p-6 text-white shadow-[0_28px_70px_-42px_rgba(15,23,42,0.8)]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent_34%,transparent_66%,rgba(255,255,255,0.03))]" />
        <div className="relative flex flex-col gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-2xl font-semibold text-white">{selectedRow.owner}</h3>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${risk.className}`}>{risk.label}</span>
            </div>
            <p className="mt-2 text-sm text-slate-300">ภาพรวมภาระงานและความคืบหน้าของพนักงานที่เลือก</p>
          </div>

          <div className="min-w-[220px] rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs font-medium text-slate-300">
              <span>Completion rate</span>
              <span className="text-white">{selectedRow.completionRate}%</span>
            </div>
            <div className="mt-2 h-2.5 rounded-full bg-white/10">
              <div
                className={`h-2.5 rounded-full ${getCompletionTone(selectedRow.completionRate)}`}
                style={{ width: `${selectedRow.completionRate}%` }}
              />
            </div>
          </div>
        </div>

        <div className="relative mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-4 backdrop-blur-sm">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-300">งานทั้งหมด</p>
            <p className="mt-2 text-3xl font-semibold text-white">{selectedRow.total}</p>
          </div>
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-4 text-emerald-200 backdrop-blur-sm">
            <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-100/70">เสร็จแล้ว</p>
            <p className="mt-2 text-3xl font-semibold text-white">{selectedRow.completed}</p>
          </div>
          <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-4 text-rose-200 backdrop-blur-sm">
            <p className="text-[11px] uppercase tracking-[0.18em] text-rose-100/70">ติดปัญหา</p>
            <p className="mt-2 text-3xl font-semibold text-white">{selectedRow.blocked}</p>
          </div>
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-4 text-amber-100 backdrop-blur-sm">
            <p className="text-[11px] uppercase tracking-[0.18em] text-amber-100/70">Completion</p>
            <p className="mt-2 text-3xl font-semibold text-white">{selectedRow.completionRate}%</p>
          </div>
        </div>

        <div className="relative mt-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-white/6 p-5 backdrop-blur-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-base font-semibold text-white">Work Status Breakdown</p>
                <p className="mt-1 text-sm text-slate-300">กราฟแท่งเปรียบเทียบจำนวนงานแต่ละสถานะ</p>
              </div>
            </div>
            <BarChart metrics={metrics} maxValue={maxMetricValue} />
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/6 p-5 backdrop-blur-sm">
            <div className="mb-5">
              <p className="text-base font-semibold text-white">Work Distribution</p>
              <p className="mt-1 text-sm text-slate-300">โดนัทชาร์ตตามเปอร์เซ็นต์ความคืบหน้าแดง-เหลือง-เขียว</p>
            </div>
            <DonutChart completionRate={selectedRow.completionRate} total={selectedRow.total} />
          </div>
        </div>
      </section>
    </div>
  );
}
