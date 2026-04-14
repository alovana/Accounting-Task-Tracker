import type { RuntimeStatus } from '../runtime/liveState'

type RuntimeStatusCardProps = {
  runtimeMode: 'mock' | 'gateway'
  runtimeStatus: RuntimeStatus
}

export function RuntimeStatusCard({ runtimeMode, runtimeStatus }: RuntimeStatusCardProps) {
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

  return (
    <div className={`summary-card runtime ${runtimeStatus.connection}`}>
      <span className="summary-label">Runtime status</span>
      <strong>{label}</strong>
      <span className="summary-value">{runtimeMode === 'mock' ? 'Using scenario presets locally' : runtimeStatus.detail}</span>
    </div>
  )
}
