import { GatewayWsClient } from './wsClient'
import type { GatewayPresenceEntry } from './protocol'

export type GatewayWorkerSnapshot = {
  id: 'main' | 'vision' | 'logic'
  model?: string
  status?: 'working' | 'sleeping' | 'idle' | 'waiting' | 'blocked' | 'done'
  task?: string
  queue?: number
  lastActiveLabel?: string
}

export type GatewayTimelineSnapshot = {
  id: number
  actorId: 'main' | 'vision' | 'logic'
  kind: 'task_start' | 'task_done' | 'task_failed' | 'status_change' | 'handoff' | 'message'
  title: string
  detail: string
  time: string
  targetId?: 'main' | 'vision' | 'logic'
  durationLabel?: string
  tags?: string[]
}

export type GatewayOfficeSnapshot = {
  scenarioLabel?: string
  delegation?: string
  workers?: GatewayWorkerSnapshot[]
  timeline?: GatewayTimelineSnapshot[]
}

type GatewaySessionListItem = {
  key: string
  label?: string
  model?: string
  modelProvider?: string
  spawnedBy?: string
}

type GatewaySessionListResult = {
  sessions?: GatewaySessionListItem[]
}

export type GatewayTransport = {
  connect: () => Promise<void>
  fetchOfficeSnapshot: () => Promise<GatewayOfficeSnapshot | null>
}

function formatRelativeTime(timestampMs?: number) {
  if (!timestampMs || !Number.isFinite(timestampMs)) {
    return 'unknown'
  }

  const deltaMs = Math.max(0, Date.now() - timestampMs)
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

function inferWorkerId(session: GatewaySessionListItem): GatewayWorkerSnapshot['id'] | null {
  const haystack = `${session.key} ${session.label ?? ''}`.toLowerCase()

  if (/(:|\b)vision(\b|:)/.test(haystack)) {
    return 'vision'
  }

  if (/(:|\b)logic(\b|:)/.test(haystack)) {
    return 'logic'
  }

  if (/(:|\b)main(\b|:)/.test(haystack)) {
    return 'main'
  }

  return null
}

function inferStatusFromPresence(entry?: GatewayPresenceEntry): GatewayWorkerSnapshot['status'] {
  const text = (entry?.text ?? '').toLowerCase()
  const reason = (entry?.reason ?? '').toLowerCase()

  if (text.includes('sleep') || reason.includes('sleep')) {
    return 'sleeping'
  }

  if (text.includes('wait') || reason.includes('wait')) {
    return 'waiting'
  }

  if (text.includes('block') || reason.includes('block')) {
    return 'blocked'
  }

  if (text.includes('done') || reason.includes('done')) {
    return 'done'
  }

  if (text) {
    return 'working'
  }

  return 'idle'
}

function inferDelegation(workers: GatewayWorkerSnapshot[]) {
  const activeSpecialist = workers.find((worker) => worker.id !== 'main' && worker.status === 'working')

  if (activeSpecialist) {
    return `Main → ${activeSpecialist.id[0].toUpperCase()}${activeSpecialist.id.slice(1)}`
  }

  return 'Main → Logic'
}

function buildOfficeSnapshot(presenceEntries: GatewayPresenceEntry[], sessionList: GatewaySessionListResult) {
  const sessionsByWorker = new Map<GatewayWorkerSnapshot['id'], GatewaySessionListItem>()

  for (const session of sessionList.sessions ?? []) {
    const workerId = inferWorkerId(session)

    if (workerId && !sessionsByWorker.has(workerId)) {
      sessionsByWorker.set(workerId, session)
    }
  }

  const presenceByWorker = new Map<GatewayWorkerSnapshot['id'], GatewayPresenceEntry>()

  for (const entry of presenceEntries) {
    const mode = (entry.mode ?? '').toLowerCase()

    if (mode && mode !== 'cli' && mode !== 'ui' && mode !== 'webchat') {
      continue
    }

    const text = (entry.text ?? '').toLowerCase()
    const workerId = text.includes('vision') ? 'vision' : text.includes('logic') ? 'logic' : text.includes('main') ? 'main' : null

    if (workerId && !presenceByWorker.has(workerId)) {
      presenceByWorker.set(workerId, entry)
    }
  }

  const workers: GatewayWorkerSnapshot[] = (['main', 'vision', 'logic'] as const).map((workerId) => {
    const session = sessionsByWorker.get(workerId)
    const presence = presenceByWorker.get(workerId)
    const model = session?.modelProvider && session?.model ? `${session.modelProvider}/${session.model}` : session?.model

    return {
      id: workerId,
      model,
      status: inferStatusFromPresence(presence),
      task: session?.label ?? presence?.text ?? undefined,
      queue: session ? 1 : 0,
      lastActiveLabel: formatRelativeTime(presence?.ts),
    }
  })

  return {
    scenarioLabel: 'Gateway Live Snapshot',
    delegation: inferDelegation(workers),
    workers,
    timeline: [
      {
        id: 1,
        actorId: 'main',
        kind: 'status_change',
        title: 'Gateway snapshot loaded',
        detail: `Read ${sessionList.sessions?.length ?? 0} sessions and ${presenceEntries.length} presence entries from the Gateway.`,
        time: 'Now',
        tags: ['gateway', 'read-only'],
      },
    ],
  } satisfies GatewayOfficeSnapshot
}

class NoopGatewayTransport implements GatewayTransport {
  async connect() {
    return
  }

  async fetchOfficeSnapshot() {
    return null
  }
}

class WebSocketGatewayTransport implements GatewayTransport {
  private client: GatewayWsClient

  constructor(url: string) {
    this.client = new GatewayWsClient(url)
  }

  async connect() {
    await this.client.connect()
  }

  async fetchOfficeSnapshot() {
    try {
      const hello = await this.client.connectAsOperator({
        clientId: 'gateway-client',
        clientMode: 'ui',
        clientVersion: '0.0.0',
        platform: 'web',
        deviceFamily: 'browser',
        scopes: ['operator.read'],
        locale: navigator.language,
        userAgent: navigator.userAgent,
      })

      const [presenceResult, sessionListResult] = await Promise.all([
        this.client.sendRequest<GatewayPresenceEntry[]>('system-presence', {}),
        this.client.sendRequest<GatewaySessionListResult>('sessions.list', {
          includeGlobal: true,
          includeUnknown: true,
          limit: 50,
        }),
      ])

      console.info('[Agent Office] Gateway live snapshot loaded', {
        discoveredMethods: hello.features?.methods?.filter((method) =>
          ['sessions.list', 'sessions.preview', 'sessions.get', 'system-presence', 'sessions.subscribe'].includes(method),
        ),
        discoveredEvents: hello.features?.events?.filter((event) =>
          ['sessions.changed', 'session.message', 'presence', 'chat'].includes(event),
        ),
        presenceCount: presenceResult.length,
        sessionCount: sessionListResult.sessions?.length ?? 0,
      })

      return buildOfficeSnapshot(presenceResult, sessionListResult)
    } catch (error) {
      console.warn('[Agent Office] Gateway snapshot fetch failed, falling back to mock snapshot', error)
      return null
    }
  }
}

export function createGatewayTransport() {
  const gatewayUrl = import.meta.env.VITE_OPENCLAW_GATEWAY_URL

  if (!gatewayUrl) {
    return new NoopGatewayTransport()
  }

  return new WebSocketGatewayTransport(gatewayUrl)
}
