type DeploymentReadinessCardProps = {
  envConfigured: boolean;
  schemaFiles: string[];
};

export function DeploymentReadinessCard({
  envConfigured,
  schemaFiles,
}: DeploymentReadinessCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Deployment Readiness</h3>
      <div className="mt-4 space-y-3 text-sm text-slate-700">
        <p>
          Environment status: <strong>{envConfigured ? "configured" : "pending env setup"}</strong>
        </p>
        <div>
          <p className="font-medium text-slate-900">Schema files</p>
          <ul className="mt-2 space-y-1 text-slate-600">
            {schemaFiles.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
