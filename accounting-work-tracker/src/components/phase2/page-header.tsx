type PageHeaderProps = {
  title: string;
  description: string;
  badge?: string;
  compact?: boolean;
};

export function PageHeader({ title, description, badge, compact = false }: PageHeaderProps) {
  if (compact) {
    return null;
  }

  return (
    <div className="rounded-[30px] border border-slate-200 bg-white px-6 py-6 shadow-[0_20px_60px_-36px_rgba(15,23,42,0.25)] md:px-8 md:py-7">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Workspace</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
        </div>
        {badge ? (
          <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
            {badge}
          </div>
        ) : null}
      </div>
    </div>
  );
}
