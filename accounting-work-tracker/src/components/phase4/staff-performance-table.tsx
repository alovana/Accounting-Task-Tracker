type StaffSummary = {
  owner: string;
  total: number;
  blocked: number;
  inProgress: number;
  waitingCustomer: number;
  completed: number;
  completionRate: number;
};

function getCompletionTone(rate: number) {
  if (rate >= 80) {
    return "bg-emerald-500";
  }

  if (rate >= 50) {
    return "bg-blue-500";
  }

  return "bg-amber-500";
}

export function StaffPerformanceTable({ rows }: { rows: StaffSummary[] }) {
  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <div
          key={row.owner}
          className="rounded-[24px] border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.3)]"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-lg font-semibold text-slate-950">{row.owner}</p>
              <p className="mt-1 text-sm text-slate-500">งานทั้งหมด {row.total} รายการ</p>
            </div>
            <div className="min-w-[180px]">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Completion</span>
                <span>{row.completionRate}%</span>
              </div>
              <div className="mt-2 h-2.5 rounded-full bg-slate-200">
                <div
                  className={`h-2.5 rounded-full ${getCompletionTone(row.completionRate)}`}
                  style={{ width: `${row.completionRate}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl bg-slate-900 px-4 py-3 text-white">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-300">กำลังทำ</p>
              <p className="mt-2 text-2xl font-semibold">{row.inProgress}</p>
            </div>
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
              <p className="text-[11px] uppercase tracking-[0.18em] text-rose-400">ติดปัญหา</p>
              <p className="mt-2 text-2xl font-semibold">{row.blocked}</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-700">
              <p className="text-[11px] uppercase tracking-[0.18em] text-amber-400">รอลูกค้า</p>
              <p className="mt-2 text-2xl font-semibold">{row.waitingCustomer}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">
              <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-400">เสร็จแล้ว</p>
              <p className="mt-2 text-2xl font-semibold">{row.completed}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">ทั้งหมด</p>
              <p className="mt-2 text-2xl font-semibold">{row.total}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
