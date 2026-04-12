import type { Worker } from '../types'
import { statusMeta } from '../statusMeta'

type WorkerCardProps = {
  worker: Worker
  selected: boolean
  onSelect: (workerId: Worker['id']) => void
}

export function WorkerCard({ worker, selected, onSelect }: WorkerCardProps) {
  const meta = statusMeta[worker.status]

  return (
    <button
      type="button"
      className={`worker-card ${meta.tone} ${worker.id} ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(worker.id)}
    >
      <div className="worker-status-badge">
        <span>{meta.emoji}</span>
        <span>{meta.label}</span>
      </div>

      <div className={`worker-avatar ${meta.tone}`} aria-hidden="true">
        <div className="status-ring"></div>
        <div className="worker-head"></div>
        <div className="worker-body"></div>
        {worker.status === 'sleeping' ? <div className="sleep-bubble">Zzz</div> : null}
        {worker.status === 'working' ? <div className="task-glow"></div> : null}
        {worker.status === 'blocked' ? <div className="alert-bubble">!</div> : null}
        {worker.status === 'done' ? <div className="done-bubble">✓</div> : null}
        {worker.status === 'waiting' ? <div className="wait-bubble">...</div> : null}
      </div>

      <div className="desk">
        <span className="monitor-glow"></span>
      </div>

      <div className="worker-meta">
        <div className="worker-heading-row">
          <h3>{worker.name}</h3>
          <span className="queue-pill">Q {worker.queue}</span>
        </div>
        <p>{worker.role}</p>
        <div className="persona-badges">
          <span className="persona-pill">{worker.persona.icon} {worker.persona.tone}</span>
          <span className="worker-location">{worker.location}</span>
        </div>
      </div>
    </button>
  )
}
