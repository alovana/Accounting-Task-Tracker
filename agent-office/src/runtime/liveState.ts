import type { EnergyState, EventKind, TimelineEvent, Worker, WorkerId, WorkerStatus } from '../types'
import type { GatewayPresenceEntry } from './protocol'
import type { GatewaySessionListItem } from './gateway'

export type RuntimeConnectionState = 'idle' | 'connecting' | 'live' | 'fallback' | 'error'

export type RuntimeStatus = {
  connection: RuntimeConnectionState
  detail: string
  lastUpdatedAt?: number
}

export function formatRelativeTime(timestampMs?: number, now = Date.now()) {
  if (!timestampMs || !Number.isFinite(timestampMs)) {
    return 'unknown'
  }

  const deltaMs = Math.max(0, now - timestampMs)
  const deltaMinutes = Math.floor(deltaMs / 60000)

  if (deltaMinutes <= 0) {
    return 'just now'
  }

  if (deltaMinutes < 60) {
    return `${deltaMinutes}m ago`
  }

  const deltaHours = Math.floor(deltaMinutes / 60)

  if (deltaHours < 24) {
    return `${deltaHours}h ago`
  }

  const deltaDays = Math.floor(deltaHours / 24)
  return `${deltaDays}d ago`
}

export function inferMonitoringFreshness(timestampMs?: number, now = Date.now()) {
  if (!timestampMs || !Number.isFinite(timestampMs)) {
    return 'unknown' as const
  }

  const deltaMs = Math.max(0, now - timestampMs)

  if (deltaMs <= 2 * 60 * 1000) {
    return 'fresh' as const
  }

  if (deltaMs <= 10 * 60 * 1000) {
    return 'aging' as const
  }

  return 'stale' as const
}

const WORKER_IDS: WorkerId[] = ['main', 'vision', 'logic']

function normalizeText(value?: string | null) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeLower(value?: string | null) {
  return normalizeText(value).toLowerCase()
}

function getSearchFields(input: Array<string | undefined | null>) {
  return input.map((value) => normalizeLower(value)).filter(Boolean)
}

function getSessionSearchFields(session: GatewaySessionListItem) {
  return getSearchFields([
    session.key,
    session.label,
    session.spawnedBy,
    session.status,
    session.summary,
    session.task,
  ])
}

export function inferWorkerIdFromSession(session: GatewaySessionListItem): WorkerId | null {
  const fields = getSessionSearchFields(session)

  for (const field of fields) {
    if (/(^|[^a-z])vision([^a-z]|$)/.test(field)) {
      return 'vision'
    }

    if (/(^|[^a-z])logic([^a-z]|$)/.test(field)) {
      return 'logic'
    }

    if (/(^|[^a-z])main([^a-z]|$)/.test(field)) {
      return 'main'
    }
  }

  return null
}

export function inferWorkerIdFromPresence(entry: GatewayPresenceEntry): WorkerId | null {
  const fields = getSearchFields([
    entry.text,
    entry.reason,
    entry.host,
    entry.instanceId,
    entry.deviceId,
    ...(entry.roles ?? []),
  ])

  for (const field of fields) {
    if (field.includes('vision')) {
      return 'vision'
    }

    if (field.includes('logic')) {
      return 'logic'
    }

    if (field.includes('main')) {
      return 'main'
    }
  }

  return null
}

export function inferStatusFromPresence(entry?: GatewayPresenceEntry, hasSession = false): WorkerStatus {
  const text = normalizeLower(entry?.text)
  const reason = normalizeLower(entry?.reason)
  const haystack = `${text} ${reason}`

  if (haystack.includes('block') || haystack.includes('error') || haystack.includes('fail')) {
    return 'blocked'
  }

  if (haystack.includes('sleep') || haystack.includes('away')) {
    return 'sleeping'
  }

  if (haystack.includes('wait') || haystack.includes('pending')) {
    return 'waiting'
  }

  if (haystack.includes('done') || haystack.includes('complete') || haystack.includes('finished')) {
    return 'done'
  }

  if (text || reason || hasSession) {
    return 'working'
  }

  return 'idle'
}

export function inferStatusFromSession(session?: GatewaySessionListItem): WorkerStatus | null {
  if (!session) {
    return null
  }

  const haystack = getSessionSearchFields(session).join(' ')

  if (haystack.includes('block') || haystack.includes('error') || haystack.includes('fail')) {
    return 'blocked'
  }

  if (haystack.includes('sleep') || haystack.includes('away')) {
    return 'sleeping'
  }

  if (haystack.includes('wait') || haystack.includes('pending') || haystack.includes('queued')) {
    return 'waiting'
  }

  if (haystack.includes('done') || haystack.includes('complete') || haystack.includes('finished')) {
    return 'done'
  }

  if (haystack) {
    return 'working'
  }

  return null
}

export function mergeWorkerStatus(
  presenceStatus: WorkerStatus,
  sessionStatus: WorkerStatus | null,
  hasPresence: boolean,
  hasSession: boolean,
): WorkerStatus {
  const priority: Record<WorkerStatus, number> = {
    blocked: 5,
    working: 4,
    waiting: 3,
    done: 2,
    sleeping: 1,
    idle: 0,
  }

  if (hasPresence && hasSession && sessionStatus) {
    return priority[sessionStatus] > priority[presenceStatus] ? sessionStatus : presenceStatus
  }

  if (hasSession && sessionStatus) {
    return sessionStatus
  }

  if (hasPresence) {
    return presenceStatus
  }

  return 'idle'
}

export function energyFromStatus(status: WorkerStatus): EnergyState {
  switch (status) {
    case 'working':
      return 'Focused'
    case 'sleeping':
      return 'Sleeping'
    case 'idle':
      return 'Ready'
    case 'waiting':
      return 'Waiting'
    case 'blocked':
      return 'Blocked'
    case 'done':
      return 'Cooldown'
  }
}

export function durationFromStatus(status: WorkerStatus, lastActiveLabel?: string) {
  if (status === 'idle') {
    return 'Standby'
  }

  if (status === 'sleeping') {
    return 'Idle'
  }

  if (status === 'blocked') {
    return 'Blocked'
  }

  if (status === 'done') {
    return 'Done'
  }

  return lastActiveLabel === 'just now' ? 'Live' : lastActiveLabel ?? 'Live'
}

export function buildRuntimeTimeline(input: {
  workers: Worker[]
  sessionCount: number
  presenceCount: number
  runtimeStatus: RuntimeStatus
}): TimelineEvent[] {
  const workerEvents = input.workers
    .filter((worker) => worker.status !== 'idle' || worker.queue > 0)
    .map((worker, index) => {
      const kind: EventKind =
        worker.status === 'blocked' ? 'task_failed' : worker.status === 'done' ? 'task_done' : 'status_change'

      return {
      id: index + 1,
      actorId: worker.id,
      kind,
      title:
        worker.status === 'working'
          ? `${worker.name} is active`
          : worker.status === 'waiting'
            ? `${worker.name} is waiting`
            : worker.status === 'blocked'
              ? `${worker.name} is blocked`
              : worker.status === 'done'
                ? `${worker.name} completed recent work`
                : `${worker.name} is ${worker.status}`,
      detail: worker.task,
      time: worker.lastActiveLabel,
      durationLabel: worker.duration,
      tags: ['gateway', worker.status],
      }
    })

  const summaryEvent: TimelineEvent = {
    id: workerEvents.length + 1,
    actorId: 'main',
    kind: input.runtimeStatus.connection === 'error' ? 'task_failed' : 'status_change',
    title:
      input.runtimeStatus.connection === 'live'
        ? 'Gateway snapshot refreshed'
        : input.runtimeStatus.connection === 'fallback'
          ? 'Gateway unavailable, using fallback view'
          : input.runtimeStatus.connection === 'connecting'
            ? 'Gateway connection in progress'
            : input.runtimeStatus.connection === 'error'
              ? 'Gateway connection failed'
              : 'Gateway runtime idle',
    detail: `${input.runtimeStatus.detail} Read ${input.sessionCount} sessions and ${input.presenceCount} presence entries.`,
    time: input.runtimeStatus.lastUpdatedAt ? 'Now' : 'Pending',
    tags: ['gateway', input.runtimeStatus.connection],
  }

  return [summaryEvent, ...workerEvents].slice(0, 8)
}

export function inferDelegation(workers: Worker[]) {
  const activeSpecialist = workers.find((worker) => worker.id !== 'main' && worker.status === 'working')

  if (activeSpecialist) {
    return `Main → ${activeSpecialist.name}`
  }

  const waitingSpecialist = workers.find((worker) => worker.id !== 'main' && worker.status === 'waiting')

  if (waitingSpecialist) {
    return `Main ↔ ${waitingSpecialist.name}`
  }

  return 'Main → Logic'
}

export function getPrimaryPresence(entries: GatewayPresenceEntry[], workerId: WorkerId) {
  return entries
    .filter((entry) => inferWorkerIdFromPresence(entry) === workerId)
    .sort((left, right) => (right.ts ?? 0) - (left.ts ?? 0))[0]
}

export function getPrimarySession(sessions: GatewaySessionListItem[], workerId: WorkerId) {
  return sessions
    .filter((session) => inferWorkerIdFromSession(session) === workerId)
    .sort((left, right) => {
      const leftPriority = inferStatusFromSession(left) === 'working' ? 1 : 0
      const rightPriority = inferStatusFromSession(right) === 'working' ? 1 : 0
      return rightPriority - leftPriority
    })[0]
}

export function getSessionsForWorker(sessions: GatewaySessionListItem[], workerId: WorkerId) {
  return sessions.filter((session) => inferWorkerIdFromSession(session) === workerId)
}

export function allWorkerIds() {
  return WORKER_IDS
}
