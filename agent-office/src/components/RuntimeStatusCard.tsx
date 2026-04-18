import { formatRelativeTime, inferMonitoringFreshness, type RuntimeStatus } from '../runtime/liveState'

type RuntimeStatusCardProps = {
  runtimeMode: 'mock' | 'gateway'
  runtimeStatus: RuntimeStatus
  now?: number
}

export function RuntimeStatusCard({ runtimeMode, runtimeStatus, now }: RuntimeStatusCardProps) {
  const label =
    runtimeMode === 'mock'
      ? 'Mock data'
      : runtimeStatus.connection === 'live'
        ? 'Gateway live'
        : runtimeStatus.connection === 'connecting'
          ? 'Connecting'
          : runtimeStatus.connection === 'fallback'
            ? 'Fallback'
            : runtimeStatus.connection === 'error'
              ? 'Error'
              : 'Idle'

  const currentTime = now ?? runtimeStatus.lastUpdatedAt
  const snapshotAgeLabel = runtimeStatus.lastUpdatedAt ? formatRelativeTime(runtimeStatus.lastUpdatedAt, currentTime) : 'pending'
  const freshness = inferMonitoringFreshness(runtimeStatus.lastUpdatedAt, currentTime)

  const diagnostics = runtimeStatus.diagnostics
  const diagnosticsSummary =
    runtimeMode === 'gateway' && diagnostics
      ? [
          diagnostics.authMode ? `auth ${diagnostics.authMode}` : null,
          diagnostics.presenceShapeVerified ? 'presence ok' : 'presence unverified',
          diagnostics.sessionShapeVerified ? 'sessions ok' : 'sessions unverified',
        ]
          .filter(Boolean)
          .join(' • ')
      : null

  return (
    <div className={`summary-card runtime ${runtimeStatus.connection} ${freshness}`}>
      <span className="summary-label">Runtime status</span>
      <strong>{label}</strong>
      <span className="summary-value">{runtimeMode === 'mock' ? 'Using scenario presets locally' : runtimeStatus.detail}</span>
      {diagnosticsSummary ? <span className="runtime-updated">{diagnosticsSummary}</span> : null}
      {runtimeStatus.lastUpdatedAt && runtimeMode === 'gateway' ? (
        <span className="runtime-updated">Last Gateway snapshot {snapshotAgeLabel}</span>
      ) : null}
    </div>
  )
}
