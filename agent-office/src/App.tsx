import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { TimelineList } from './components/TimelineList'
import { RuntimeStatusCard } from './components/RuntimeStatusCard'
import { WorkerCard } from './components/WorkerCard'
import { WorkerDetails } from './components/WorkerDetails'
import { scenarioPresets } from './mockData'
import { statusMeta } from './statusMeta'
import { useOfficeRuntime } from './hooks/useOfficeRuntime'
import { formatRelativeTime, inferMonitoringFreshness } from './runtime/liveState'
import type { WorkerId, WorkerStatus } from './types'

function App() {
  const [scenarioId, setScenarioId] = useState<keyof typeof scenarioPresets>('planning')
  const [selectedWorkerId, setSelectedWorkerId] = useState<WorkerId>('main')
  const [statusFilter, setStatusFilter] = useState<'all' | WorkerStatus>('all')

  const { runtimeMode, setRuntimeMode, scenario, runtimeStatus } = useOfficeRuntime(scenarioId)
  const [now, setNow] = useState(() => Date.now())
  const selectedWorker = scenario.workers.find((worker) => worker.id === selectedWorkerId) ?? scenario.workers[0]

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now())
    }, 30000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  const statusSummary = useMemo(() => {
    const counts = scenario.workers.reduce<Record<string, number>>((acc, worker) => {
      acc[worker.status] = (acc[worker.status] ?? 0) + 1
      return acc
    }, {})

    return Object.entries(counts)
      .map(([status, count]) => `${count} ${statusMeta[status as WorkerStatus].label.toLowerCase()}`)
      .join(', ')
  }, [scenario.workers])

  const filteredTimeline = useMemo(() => {
    if (statusFilter === 'all') {
      return scenario.timeline
    }

    const allowedIds = new Set(
      scenario.workers.filter((worker) => worker.status === statusFilter).map((worker) => worker.id),
    )

    return scenario.timeline.filter((event) => allowedIds.has(event.actorId))
  }, [scenario.timeline, scenario.workers, statusFilter])

  const statusFilterOptions: Array<'all' | WorkerStatus> = ['all', 'working', 'idle', 'sleeping', 'waiting', 'blocked', 'done']
  const monitoringFreshness =
    scenario.monitoring?.source === 'gateway' ? inferMonitoringFreshness(runtimeStatus.lastUpdatedAt, now) : 'unknown'
  const monitoringSummary =
    scenario.monitoring?.source === 'gateway'
      ? `${scenario.monitoring.sessionCount ?? 0} sessions, ${scenario.monitoring.presenceCount ?? 0} presence signals`
      : 'Preset scene, no live Gateway signals'
  const monitoringAgeLabel =
    scenario.monitoring?.source === 'gateway' && runtimeStatus.lastUpdatedAt
      ? formatRelativeTime(runtimeStatus.lastUpdatedAt, now)
      : scenario.monitoring?.lastUpdatedLabel ?? 'local preset'

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
          <div className={`summary-card telemetry-card ${monitoringFreshness}`}>
            <span className="summary-label">Monitoring pulse</span>
            <strong>{scenario.monitoring?.source === 'gateway' ? 'Gateway evidence' : 'Local preset'}</strong>
            <span className="summary-value">{monitoringSummary}</span>
            <span className="runtime-updated">
              {scenario.monitoring?.source === 'gateway' ? `Evidence age ${monitoringAgeLabel}` : monitoringAgeLabel}
            </span>
          </div>
          <RuntimeStatusCard runtimeMode={runtimeMode} runtimeStatus={runtimeStatus} now={now} />
        </div>
      </section>

      <section className="control-strip panel-card">
        <div>
          <p className="section-kicker">Scenario controls</p>
          <h2>Runtime source and states</h2>
        </div>

        <div className="control-actions">
          <div className="runtime-toggle" role="tablist" aria-label="Select runtime source">
            <button
              type="button"
              className={`scenario-tab ${runtimeMode === 'mock' ? 'active' : ''}`}
              onClick={() => setRuntimeMode('mock')}
            >
              Mock mode
            </button>
            <button
              type="button"
              className={`scenario-tab ${runtimeMode === 'gateway' ? 'active' : ''}`}
              onClick={() => setRuntimeMode('gateway')}
            >
              Gateway mode
            </button>
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
                  setStatusFilter('all')
                }}
                disabled={runtimeMode === 'gateway'}
              >
                {preset.label}
              </button>
            ))}
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
            <div className="delegation-pill">{scenario.delegation}</div>
          </div>

          <div className="scene-floor">
            <div className="scene-lane"></div>
            {scenario.workers.map((worker) => (
              <WorkerCard
                key={worker.id}
                worker={worker}
                selected={selectedWorker.id === worker.id}
                onSelect={setSelectedWorkerId}
              />
            ))}

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
                  <strong>
                    {worker.persona.icon} {worker.name}
                  </strong>
                  <span>{worker.model}</span>
                  <em>{statusMeta[worker.status].label}</em>
                </button>
              ))}
            </div>
          </section>
        </section>

        <aside className="side-panel">
          <WorkerDetails worker={selectedWorker} />

          <section className="panel-card">
            <div className="timeline-toolbar">
              <div>
                <p className="section-kicker">Activity log</p>
                <h2>Team timeline</h2>
              </div>
              <div className="filter-chips" role="tablist" aria-label="Filter timeline by worker status">
                {statusFilterOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`filter-chip ${statusFilter === option ? 'active' : ''}`}
                    onClick={() => setStatusFilter(option)}
                  >
                    {option === 'all' ? 'All' : statusMeta[option].label}
                  </button>
                ))}
              </div>
            </div>
            <TimelineList events={filteredTimeline} workers={scenario.workers} />
          </section>
        </aside>
      </section>
    </main>
  )
}

export default App
