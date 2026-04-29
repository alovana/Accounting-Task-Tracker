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
};

const chartColors = [
  "#0f172a",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#10b981",
];

function getCompletionTone(rate: number) {
  if (rate >= 80) {
    return "bg-emerald-500";
  }

  if (rate >= 50) {
    return "bg-blue-500";
  }

  return "bg-amber-500";
}

function getRiskLabel(row: StaffSummary) {
  if (row.blocked >= 2) {
    return { label: "Risk", className: "border border-rose-200 bg-rose-50 text-rose-700" };
  }

  if (row.waitingCustomer >= 2) {
    return { label: "Waiting", className: "border border-amber-200 bg-amber-50 text-amber-700" };
  }

  if (row.completionRate >= 80) {
    return { label: "Healthy", className: "border border-emerald-200 bg-emerald-50 text-emerald-700" };
  }

  return { label: "Active", className: "border border-blue-200 bg-blue-50 text-blue-700" };
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
    },
    {
      key: "blocked",
      label: "ติดปัญหา",
      value: row.blocked,
      tone: "bg-rose-500",
      softTone: "bg-rose-50 text-rose-700",
    },
    {
      key: "waiting",
      label: "รอลูกค้า",
      value: row.waitingCustomer,
      tone: "bg-amber-500",
      softTone: "bg-amber-50 text-amber-700",
    },
    {
      key: "completed",
      label: "เสร็จแล้ว",
      value: row.completed,
      tone: "bg-emerald-500",
      softTone: "bg-emerald-50 text-emerald-700",
    },
  ];
}

function DonutChart({ metrics, total }: { metrics: MetricItem[]; total: number }) {
  const safeTotal = total || 1;
  let currentAngle = 0;
  const segments = metrics.map((metric, index) => {
    const angle = (metric.value / safeTotal) * 360;
    const start = currentAngle;
    currentAngle += angle;
    return `${chartColors[index]} ${start}deg ${currentAngle}deg`;
  });

  return (
    <div className="relative mx-auto h-52 w-52">
      <div
        className="h-full w-full rounded-full"
        style={{ background: `conic-gradient(${segments.join(", ")})` }}
      />
      <div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-white text-center shadow-inner">
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Completion</p>
        <p className="mt-2 text-3xl font-semibold text-slate-950">{total ? Math.round((metrics.find((item) => item.key === "completed")?.value ?? 0) / total * 100) : 0}%</p>
        <p className="mt-1 text-sm text-slate-500">จากทั้งหมด {total} งาน</p>
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

        <div className="space-y-3">
          {rows.map((row) => {
            const isActive = row.owner === selectedRow.owner;
            const rowRisk = getRiskLabel(row);

            return (
              <button
                key={row.owner}
                type="button"
                onClick={() => setSelectedOwner(row.owner)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  isActive
                    ? "border-slate-900 bg-slate-900 text-white shadow-lg"
                    : "border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-semibold ${
                      isActive ? "bg-white/15 text-white" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {getInitials(row.owner)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`truncate font-semibold ${isActive ? "text-white" : "text-slate-950"}`}>{row.owner}</p>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                          isActive ? "bg-white/15 text-white" : rowRisk.className
                        }`}
                      >
                        {rowRisk.label}
                      </span>
                    </div>
                    <p className={`mt-1 text-xs ${isActive ? "text-slate-300" : "text-slate-500"}`}>
                      งานทั้งหมด {row.total} · เสร็จ {row.completed}
                    </p>
                    <div className={`mt-3 h-2 rounded-full ${isActive ? "bg-white/15" : "bg-slate-200"}`}>
                      <div
                        className={`h-2 rounded-full ${isActive ? "bg-white" : getCompletionTone(row.completionRate)}`}
                        style={{ width: `${row.completionRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 p-6 shadow-[0_20px_50px_-36px_rgba(15,23,42,0.35)]">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-2xl font-semibold text-slate-950">{selectedRow.owner}</h3>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${risk.className}`}>{risk.label}</span>
            </div>
            <p className="mt-2 text-sm text-slate-500">ภาพรวมภาระงานและความคืบหน้าของพนักงานที่เลือก</p>
          </div>

          <div className="min-w-[220px]">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Completion rate</span>
              <span>{selectedRow.completionRate}%</span>
            </div>
            <div className="mt-2 h-2.5 rounded-full bg-slate-200">
              <div
                className={`h-2.5 rounded-full ${getCompletionTone(selectedRow.completionRate)}`}
                style={{ width: `${selectedRow.completionRate}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-slate-900 px-4 py-4 text-white">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-300">งานทั้งหมด</p>
            <p className="mt-2 text-3xl font-semibold">{selectedRow.total}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-700">
            <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-400">เสร็จแล้ว</p>
            <p className="mt-2 text-3xl font-semibold">{selectedRow.completed}</p>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-rose-700">
            <p className="text-[11px] uppercase tracking-[0.18em] text-rose-400">ติดปัญหา</p>
            <p className="mt-2 text-3xl font-semibold">{selectedRow.blocked}</p>
          </div>
          <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4 text-blue-700">
            <p className="text-[11px] uppercase tracking-[0.18em] text-blue-400">Completion</p>
            <p className="mt-2 text-3xl font-semibold">{selectedRow.completionRate}%</p>
          </div>
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-base font-semibold text-slate-950">Work Status Breakdown</p>
                <p className="mt-1 text-sm text-slate-500">กราฟแท่งเปรียบเทียบจำนวนงานแต่ละสถานะ</p>
              </div>
            </div>
            <BarChart metrics={metrics} maxValue={maxMetricValue} />
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="mb-5">
              <p className="text-base font-semibold text-slate-950">Work Distribution</p>
              <p className="mt-1 text-sm text-slate-500">โดนัทชาร์ตสัดส่วนงานของพนักงานคนนี้</p>
            </div>
            <DonutChart metrics={metrics} total={selectedRow.total} />

            <div className="mt-6 grid gap-2">
              {metrics.map((metric, index) => (
                <div key={metric.key} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2.5 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: chartColors[index] }} />
                    <span>{metric.label}</span>
                  </div>
                  <span className="font-semibold text-slate-900">{metric.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
