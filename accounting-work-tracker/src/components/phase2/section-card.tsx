type SectionCardProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  hideDescription?: boolean;
};

export function SectionCard({ title, description, children, hideDescription = true }: SectionCardProps) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.22)] md:p-7">
      <div className="mb-5 border-b border-slate-100 pb-4">
        <h2 className="text-lg font-semibold tracking-tight text-slate-950">{title}</h2>
        {!hideDescription && description ? <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
