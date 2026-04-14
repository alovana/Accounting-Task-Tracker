export type WorkerId = 'main' | 'vision' | 'logic'

export type WorkerStatus = 'working' | 'sleeping' | 'idle' | 'waiting' | 'blocked' | 'done'
export type EnergyState = 'Focused' | 'Sleeping' | 'Ready' | 'Waiting' | 'Blocked' | 'Cooldown'
export type EventKind = 'task_start' | 'task_done' | 'task_failed' | 'status_change' | 'handoff' | 'message'

export type WorkerPersona = {
  icon: string
  tone: string
  specialty: string
}

export type MonitoringFreshness = 'fresh' | 'aging' | 'stale' | 'unknown'

export type WorkerMonitoring = {
  source: 'mock' | 'gateway'
  sessionCount?: number
  presenceLabel?: string
  sessionLabel?: string
  sessionStatus?: string
  freshness?: MonitoringFreshness
}

export type ScenarioMonitoring = {
  source: 'mock' | 'gateway'
  sessionCount?: number
  presenceCount?: number
  lastUpdatedLabel?: string
  freshness?: MonitoringFreshness
}

export type Worker = {
  id: WorkerId
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
  lastActiveLabel: string
  persona: WorkerPersona
  monitoring?: WorkerMonitoring
}

export type TimelineEvent = {
  id: number
  actorId: WorkerId
  kind: EventKind
  title: string
  detail: string
  time: string
  targetId?: WorkerId
  durationLabel?: string
  tags?: string[]
}

export type ScenarioPreset = {
  label: string
  delegation: string
  workers: Worker[]
  timeline: TimelineEvent[]
  monitoring?: ScenarioMonitoring
}
