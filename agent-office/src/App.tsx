import './App.css'

type WorkerStatus = 'working' | 'sleeping' | 'idle'

type Worker = {
  id: string
  name: string
  role: string
  model: string
  status: WorkerStatus
  task: string
  lastCompleted: string
  location: string
  energy: string
}

const workers: Worker[] = [
  {
    id: 'main',
    name: 'Main',
    role: 'Manager / Orchestrator',
    model: 'openai-codex/gpt-5.4',
    status: 'working',
    task: 'Delegating dashboard architecture to the team',
    lastCompleted: 'Started Agent Office scaffold',
    location: 'Command Desk',
    energy: 'Focused',
  },
  {
    id: 'vision',
    name: 'Vision',
    role: 'OCR / Image Analyst',
    model: 'google/gemini-2.5-flash',
    status: 'sleeping',
    task: 'Waiting for image or document tasks',
    lastCompleted: 'Vision profile and prompt template ready',
    location: 'Document Station',
    energy: 'Sleeping',
  },
  {
    id: 'logic',
    name: 'Logic',
    role: 'Code Drafter',
    model: 'anthropic/claude-sonnet-4-6',
    status: 'idle',
    task: 'Standing by for implementation subtasks',
    lastCompleted: 'Subagent spawn test completed',
    location: 'Dev Desk',
    energy: 'Ready',
  },
]

const statusMeta: Record<WorkerStatus, { label: string; emoji: string; tone: string }> = {
  working: { label: 'Working', emoji: '⚙️', tone: 'working' },
  sleeping: { label: 'Sleeping', emoji: '💤', tone: 'sleeping' },
  idle: { label: 'Idle', emoji: '🪑', tone: 'idle' },
}

function App() {
  const selectedWorker = workers[0]

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">Agent Office</p>
          <h1>AI team floor</h1>
          <p className="subtitle">
            A 2D office-style dashboard for watching your AI workers think, delegate, work, and rest.
          </p>
        </div>
        <div className="office-summary">
          <div className="summary-card accent">
            <span className="summary-label">Active manager</span>
            <strong>Main</strong>
            <span className="summary-value">Delegating now</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Workers online</span>
            <strong>3</strong>
            <span className="summary-value">1 working, 1 idle, 1 sleeping</span>
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <section className="office-scene">
          <div className="scene-header">
            <div>
              <p className="section-kicker">Live office scene</p>
              <h2>Command room</h2>
            </div>
            <div className="delegation-pill">Main → Logic</div>
          </div>

          <div className="scene-floor">
            <div className="scene-lane"></div>
            {workers.map((worker) => {
              const meta = statusMeta[worker.status]
              return (
                <article key={worker.id} className={`worker-card ${meta.tone} ${worker.id}`}>
                  <div className="worker-status-badge">
                    <span>{meta.emoji}</span>
                    <span>{meta.label}</span>
                  </div>

                  <div className="worker-avatar" aria-hidden="true">
                    <div className="worker-head"></div>
                    <div className="worker-body"></div>
                    {worker.status === 'sleeping' ? <div className="sleep-bubble">Zzz</div> : null}
                    {worker.status === 'working' ? <div className="task-glow"></div> : null}
                  </div>

                  <div className="desk">
                    <span className="monitor-glow"></span>
                  </div>

                  <div className="worker-meta">
                    <h3>{worker.name}</h3>
                    <p>{worker.role}</p>
                    <span className="worker-location">{worker.location}</span>
                  </div>
                </article>
              )
            })}

            <div className="delegation-line" aria-hidden="true">
              <span className="beam"></span>
            </div>
          </div>
        </section>

        <aside className="side-panel">
          <section className="panel-card selected-card">
            <p className="section-kicker">Selected worker</p>
            <h2>{selectedWorker.name}</h2>
            <p className="selected-role">{selectedWorker.role}</p>

            <dl className="detail-list">
              <div>
                <dt>Current model</dt>
                <dd>{selectedWorker.model}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{statusMeta[selectedWorker.status].label}</dd>
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
                <dt>Last completed</dt>
                <dd>{selectedWorker.lastCompleted}</dd>
              </div>
            </dl>
          </section>

          <section className="panel-card">
            <p className="section-kicker">Activity log</p>
            <ul className="activity-list">
              <li>
                <span className="activity-time">Now</span>
                <div>
                  <strong>Main</strong>
                  <p>Planning dashboard structure and assigning logic implementation support.</p>
                </div>
              </li>
              <li>
                <span className="activity-time">2m</span>
                <div>
                  <strong>Logic</strong>
                  <p>Finished test spawn and returned draft code successfully.</p>
                </div>
              </li>
              <li>
                <span className="activity-time">5m</span>
                <div>
                  <strong>Vision</strong>
                  <p>Idle at document station, waiting for OCR or image review tasks.</p>
                </div>
              </li>
            </ul>
          </section>
        </aside>
      </section>
    </main>
  )
}

export default App
