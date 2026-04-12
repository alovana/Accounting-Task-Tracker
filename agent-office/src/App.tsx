import { useMemo, useState } from 'react'
import './App.css'

type WorkerStatus = 'working' | 'sleeping' | 'idle' | 'waiting' | 'blocked' | 'done'
type EnergyState = 'Focused' | 'Sleeping' | 'Ready' | 'Waiting' | 'Blocked' | 'Cooldown'

type Worker = {
  id: string
  name: string
  role: string
  model: string
  status: WorkerStatus
  task: string
  lastCompleted: string
  location: string
  energy: EnergyState
  queue: number
  duration: string
}

type TimelineEvent = {
  id: number
  actorId: Worker['id']
  title: string
  detail: string
  time: string
  targetId?: Worker['id']
}

const scenarioPresets: Record<string, { label: string; delegation: string; workers: Worker[]; timeline: TimelineEvent[] }> = {
  planning: {
    label: 'Planning Sprint',
    delegation: 'Main → Logic',
    workers: [
      {
        id: 'main',
        name: 'Main',
        role: 'Manager / Orchestrator',
        model: 'openai-codex/gpt-5.4',
        status: 'working',
        task: 'Designing MVP flow and delegating UI implementation',
        lastCompleted: 'Created Agent Office scaffold',
        location: 'Command Desk',
        energy: 'Focused',
        queue: 2,
        duration: '07m',
      },
      {
        id: 'vision',
        name: 'Vision',
        role: 'OCR / Image Analyst',
        model: 'google/gemini-2.5-flash',
        status: 'sleeping',
        task: 'Waiting for screenshots, assets, or document review',
        lastCompleted: 'Prepared OCR-focused specialist profile',
        location: 'Document Station',
        energy: 'Sleeping',
        queue: 0,
        duration: 'Idle',
      },
      {
        id: 'logic',
        name: 'Logic',
        role: 'Code Drafter',
        model: 'anthropic/claude-sonnet-4-6',
        status: 'idle',
        task: 'Standing by for component and state-model subtasks',
        lastCompleted: 'Returned successful spawn test output',
        location: 'Dev Desk',
        energy: 'Ready',
        queue: 1,
        duration: 'Standby',
      },
    ],
    timeline: [
      {
        id: 1,
        actorId: 'main',
        title: 'Main is leading MVP planning',
        detail: 'Preparing architecture and mapping next coding tasks for Logic.',
        time: 'Now',
        targetId: 'logic',
      },
      {
        id: 2,
        actorId: 'logic',
        title: 'Logic finished a spawn verification task',
        detail: 'Returned draft code correctly and is waiting for the next assignment.',
        time: '2m',
      },
      {
        id: 3,
        actorId: 'vision',
        title: 'Vision is sleeping at the document desk',
        detail: 'No OCR workload yet, so the station is resting.',
        time: '5m',
      },
    ],
  },
  handoff: {
    label: 'Delegation Handoff',
    delegation: 'Main → Vision',
    workers: [
      {
        id: 'main',
        name: 'Main',
        role: 'Manager / Orchestrator',
        model: 'openai-codex/gpt-5.4',
        status: 'waiting',
        task: 'Waiting for specialist output before final review',
        lastCompleted: 'Assigned UI and data review tasks',
        location: 'Command Desk',
        energy: 'Waiting',
        queue: 1,
        duration: '03m',
      },
      {
        id: 'vision',
        name: 'Vision',
        role: 'OCR / Image Analyst',
        model: 'google/gemini-2.5-flash',
        status: 'working',
        task: 'Reviewing dashboard mockups and extracting visual notes',
        lastCompleted: 'Prepared document extraction response template',
        location: 'Document Station',
        energy: 'Focused',
        queue: 2,
        duration: '11m',
      },
      {
        id: 'logic',
        name: 'Logic',
        role: 'Code Drafter',
        model: 'anthropic/claude-sonnet-4-6',
        status: 'done',
        task: 'Completed component draft, awaiting review',
        lastCompleted: 'Suggested worker and timeline types',
        location: 'Dev Desk',
        energy: 'Cooldown',
        queue: 0,
        duration: 'Done',
      },
    ],
    timeline: [
      {
        id: 1,
        actorId: 'main',
        title: 'Main delegated visual review to Vision',
        detail: 'The command desk is waiting for UI observations from the image analyst.',
        time: 'Now',
        targetId: 'vision',
      },
      {
        id: 2,
        actorId: 'vision',
        title: 'Vision is processing visual references',
        detail: 'Gathering structure, readability, and scene-layout notes.',
        time: '1m',
      },
      {
        id: 3,
        actorId: 'logic',
        title: 'Logic finished and entered cooldown',
        detail: 'Code draft complete and ready for main review.',
        time: '4m',
      },
    ],
  },
  blocked: {
    label: 'Blocked Flow',
    delegation: 'Main → Logic',
    workers: [
      {
        id: 'main',
        name: 'Main',
        role: 'Manager / Orchestrator',
        model: 'openai-codex/gpt-5.4',
        status: 'working',
        task: 'Resolving blocker and reshaping next tasks',
        lastCompleted: 'Reviewed current dashboard draft',
        location: 'Command Desk',
        energy: 'Focused',
        queue: 3,
        duration: '09m',
      },
      {
        id: 'vision',
        name: 'Vision',
        role: 'OCR / Image Analyst',
        model: 'google/gemini-2.5-flash',
        status: 'idle',
        task: 'Monitoring for updated assets or screen captures',
        lastCompleted: 'Finished layout observation summary',
        location: 'Document Station',
        energy: 'Ready',
        queue: 0,
        duration: 'Standby',
      },
      {
        id: 'logic',
        name: 'Logic',
        role: 'Code Drafter',
        model: 'anthropic/claude-sonnet-4-6',
        status: 'blocked',
        task: 'Waiting for confirmed runtime contract before integration',
        lastCompleted: 'Prepared draft component interactions',
        location: 'Dev Desk',
        energy: 'Blocked',
        queue: 1,
        duration: 'Blocked',
      },
    ],
    timeline: [
      {
        id: 1,
        actorId: 'logic',
        title: 'Logic hit a contract blocker',
        detail: 'Needs final runtime field mapping before continuing integration work.',
        time: 'Now',
      },
      {
        id: 2,
        actorId: 'main',
        title: 'Main is re-planning around the blocker',
        detail: 'The manager is preparing a safer fallback implementation path.',
        time: '1m',
        targetId: 'logic',
      },
      {
        id: 3,
        actorId: 'vision',
        title: 'Vision is idle and available',
        detail: 'The image analyst can pick up design review work if needed.',
        time: '3m',
      },
    ],
  },
}

const statusMeta: Record<
  WorkerStatus,
  { label: string; emoji: string; tone: string; description: string }
> = {
  working: { label: 'Working', emoji: '⚙️', tone: 'working', description: 'Actively processing a task' },
  sleeping: { label: 'Sleeping', emoji: '💤', tone: 'sleeping', description: 'Resting with no queued work' },
  idle: { label: 'Idle', emoji: '🪑', tone: 'idle', description: 'Available and ready for assignment' },
  waiting: { label: 'Waiting', emoji: '⏳', tone: 'waiting', description: 'Waiting for another worker or input' },
  blocked: { label: 'Blocked', emoji: '🚧', tone: 'blocked', description: 'Cannot continue until a blocker is cleared' },
  done: { label: 'Done', emoji: '✅', tone: 'done', description: 'Task completed and ready for review' },
}

function App() {
  const [scenarioId, setScenarioId] = useState<keyof typeof scenarioPresets>('planning')
  const [selectedWorkerId, setSelectedWorkerId] = useState<Worker['id']>('main')

  const scenario = scenarioPresets[scenarioId]
  const selectedWorker = scenario.workers.find((worker) => worker.id === selectedWorkerId) ?? scenario.workers[0]

  const statusSummary = useMemo(() => {
    const counts = scenario.workers.reduce<Record<string, number>>((acc, worker) => {
      acc[worker.status] = (acc[worker.status] ?? 0) + 1
      return acc
    }, {})

    return Object.entries(counts)
      .map(([status, count]) => `${count} ${statusMeta[status as WorkerStatus].label.toLowerCase()}`)
      .join(', ')
  }, [scenario.workers])

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">Agent Office</p>
          <h1>AI team floor</h1>
          <p className="subtitle">
            A 2D office-style dashboard for watching your AI workers think, delegate, work, wait, and rest.
          </p>
        </div>
        <div className="office-summary">
          <div className="summary-card accent">
            <span className="summary-label">Current scenario</span>
            <strong>{scenario.label}</strong>
            <span className="summary-value">{scenario.delegation}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Workers online</span>
            <strong>{scenario.workers.length}</strong>
            <span className="summary-value">{statusSummary}</span>
          </div>
        </div>
      </section>

      <section className="control-strip panel-card">
        <div>
          <p className="section-kicker">Scenario controls</p>
          <h2>Mock runtime states</h2>
        </div>
        <div className="scenario-tabs" role="tablist" aria-label="Runtime scenarios">
          {Object.entries(scenarioPresets).map(([key, preset]) => (
            <button
              key={key}
              type="button"
              className={`scenario-tab ${scenarioId === key ? 'active' : ''}`}
              onClick={() => {
                setScenarioId(key as keyof typeof scenarioPresets)
                setSelectedWorkerId('main')
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </section>

      <section className="dashboard-grid">
        <section className="office-scene">
          <div className="scene-header">
            <div>
              <p className="section-kicker">Live office scene</p>
              <h2>Command room</h2>
            </div>
            <div className="delegation-pill">{scenario.delegation}</div>
          </div>

          <div className="scene-floor">
            <div className="scene-lane"></div>
            {scenario.workers.map((worker) => {
              const meta = statusMeta[worker.status]
              const isSelected = selectedWorker.id === worker.id
              return (
                <button
                  key={worker.id}
                  type="button"
                  className={`worker-card ${meta.tone} ${worker.id} ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedWorkerId(worker.id)}
                >
                  <div className="worker-status-badge">
                    <span>{meta.emoji}</span>
                    <span>{meta.label}</span>
                  </div>

                  <div className="worker-avatar" aria-hidden="true">
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
                    <span className="worker-location">{worker.location}</span>
                  </div>
                </button>
              )
            })}

            <div className={`delegation-line ${scenarioId}`} aria-hidden="true">
              <span className="beam"></span>
            </div>
          </div>

          <section className="worker-strip panel-card">
            <p className="section-kicker">Worker roster</p>
            <div className="worker-strip-grid">
              {scenario.workers.map((worker) => (
                <button
                  key={worker.id}
                  type="button"
                  className={`mini-worker ${selectedWorker.id === worker.id ? 'active' : ''}`}
                  onClick={() => setSelectedWorkerId(worker.id)}
                >
                  <strong>{worker.name}</strong>
                  <span>{worker.model}</span>
                  <em>{statusMeta[worker.status].label}</em>
                </button>
              ))}
            </div>
          </section>
        </section>

        <aside className="side-panel">
          <section className="panel-card selected-card">
            <p className="section-kicker">Selected worker</p>
            <div className="selected-header">
              <div>
                <h2>{selectedWorker.name}</h2>
                <p className="selected-role">{selectedWorker.role}</p>
              </div>
              <span className={`selected-status ${statusMeta[selectedWorker.status].tone}`}>
                {statusMeta[selectedWorker.status].emoji} {statusMeta[selectedWorker.status].label}
              </span>
            </div>

            <dl className="detail-list">
              <div>
                <dt>Current model</dt>
                <dd>{selectedWorker.model}</dd>
              </div>
              <div>
                <dt>Status meaning</dt>
                <dd>{statusMeta[selectedWorker.status].description}</dd>
              </div>
              <div>
                <dt>Energy</dt>
                <dd>{selectedWorker.energy}</dd>
              </div>
              <div>
                <dt>Current task</dt>
                <dd>{selectedWorker.task}</dd>
              </div>
              <div>
                <dt>Queue</dt>
                <dd>{selectedWorker.queue} queued item(s)</dd>
              </div>
              <div>
                <dt>Active duration</dt>
                <dd>{selectedWorker.duration}</dd>
              </div>
              <div>
                <dt>Last completed</dt>
                <dd>{selectedWorker.lastCompleted}</dd>
              </div>
            </dl>
          </section>

          <section className="panel-card">
            <p className="section-kicker">Activity log</p>
            <ul className="activity-list">
              {scenario.timeline.map((event) => (
                <li key={event.id}>
                  <span className="activity-time">{event.time}</span>
                  <div>
                    <strong>{scenario.workers.find((worker) => worker.id === event.actorId)?.name}</strong>
                    <p>{event.title}</p>
                    <small>{event.detail}</small>
                    {event.targetId ? (
                      <span className="activity-link">
                        Routed to {scenario.workers.find((worker) => worker.id === event.targetId)?.name}
                      </span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </section>
    </main>
  )
}

export default App
