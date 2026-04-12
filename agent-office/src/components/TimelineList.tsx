import type { TimelineEvent, Worker } from '../types'

type TimelineListProps = {
  events: TimelineEvent[]
  workers: Worker[]
}

export function TimelineList({ events, workers }: TimelineListProps) {
  const workerById = new Map(workers.map((worker) => [worker.id, worker]))

  return (
    <ul className="activity-list">
      {events.map((event) => {
        const actor = workerById.get(event.actorId)
        const target = event.targetId ? workerById.get(event.targetId) : undefined

        return (
          <li key={event.id} className={`timeline-card kind-${event.kind}`}>
            <span className="activity-time">{event.time}</span>
            <div>
              <div className="timeline-heading">
                <strong>
                  {actor?.persona.icon} {actor?.name}
                </strong>
                {event.durationLabel ? <span className="duration-pill">{event.durationLabel}</span> : null}
              </div>
              <p>{event.title}</p>
              <small>{event.detail}</small>
              <div className="timeline-footer">
                {target ? <span className="activity-link">Routed to {target.name}</span> : null}
                {event.tags?.length ? (
                  <div className="tag-list">
                    {event.tags.map((tag) => (
                      <span key={tag} className="tag-pill">
                        #{tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
