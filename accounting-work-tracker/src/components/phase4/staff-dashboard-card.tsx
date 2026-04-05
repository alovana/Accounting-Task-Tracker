type StaffDashboardCardProps = {
  myOpenItems: number;
  myBlockedItems: number;
  myWaitingCustomerItems: number;
  myCustomers: number;
};

export function StaffDashboardCard({
  myOpenItems,
  myBlockedItems,
  myWaitingCustomerItems,
  myCustomers,
}: StaffDashboardCardProps) {
  const items = [
    { label: "งานของฉัน", value: myOpenItems },
    { label: "งาน blocked", value: myBlockedItems },
    { label: "รอลูกค้า", value: myWaitingCustomerItems },
    { label: "ลูกค้าที่รับผิดชอบ", value: myCustomers },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">{item.label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
