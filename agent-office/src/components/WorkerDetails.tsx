import { statusMeta } from '../statusMeta'
import type { Worker } from '../types'

type WorkerDetailsProps = {
  worker: Worker
}

export function WorkerDetails({ worker }: WorkerDetailsProps) {
  return (
    <section className="panel-card selected-card">
      <p className="section-kicker">Selected worker</p>
      <div className="selected-header">
        <div>
          <h2>{worker.name}</h2>
          <p className="selected-role">{worker.role}</p>
          <div className="selected-persona-row">
            <span className="persona-pill large">{worker.persona.icon} {worker.persona.tone}</span>
            <span className="specialty-pill">{worker.persona.specialty}</span>
          </div>
        </div>
        <span className={`selected-status ${statusMeta[worker.status].tone}`}>
          {statusMeta[worker.status].emoji} {statusMeta[worker.status].label}
        </span>
      </div>

      <dl className="detail-list">
        <div>
          <dt>Current model</dt>
          <dd>{worker.model}</dd>
        </div>
        <div>
          <dt>Status meaning</dt>
          <dd>{statusMeta[worker.status].description}</dd>
        </div>
        <div>
          <dt>Energy</dt>
          <dd>{worker.energy}</dd>
        </div>
        <div>
          <dt>Current task</dt>
          <dd>{worker.task}</dd>
        </div>
        <div>
          <dt>Queue</dt>
          <dd>{worker.queue} queued item(s)</dd>
        </div>
        <div>
          <dt>Active duration</dt>
          <dd>{worker.duration}</dd>
        </div>
        <div>
          <dt>Last active</dt>
          <dd>{worker.lastActiveLabel}</dd>
        </div>
        <div>
          <dt>Last completed</dt>
          <dd>{worker.lastCompleted}</dd>
        </div>
      </dl>
    </section>
  )
}
