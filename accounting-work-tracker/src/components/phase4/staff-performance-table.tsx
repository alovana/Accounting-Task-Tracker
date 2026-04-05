type StaffSummary = {
  owner: string;
  total: number;
  blocked: number;
  inProgress: number;
  completed: number;
};

export function StaffPerformanceTable({ rows }: { rows: StaffSummary[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-y-3">
        <thead>
          <tr className="text-left text-sm text-slate-500">
            <th className="px-3">ผู้รับผิดชอบ</th>
            <th className="px-3">งานทั้งหมด</th>
            <th className="px-3">กำลังทำ</th>
            <th className="px-3">ติดปัญหา</th>
            <th className="px-3">เสร็จแล้ว</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.owner} className="rounded-2xl bg-slate-50 text-sm text-slate-700">
              <td className="rounded-l-2xl px-3 py-4 font-medium text-slate-900">{row.owner}</td>
              <td className="px-3 py-4">{row.total}</td>
              <td className="px-3 py-4">{row.inProgress}</td>
              <td className="px-3 py-4">{row.blocked}</td>
              <td className="rounded-r-2xl px-3 py-4">{row.completed}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
