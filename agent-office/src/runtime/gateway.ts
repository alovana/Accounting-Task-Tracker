import { GatewayWsClient } from './wsClient'
import {
  allWorkerIds,
  buildRuntimeTimeline,
  durationFromStatus,
  energyFromStatus,
  getPrimaryPresence,
  getPrimarySession,
  inferDelegation,
  inferStatusFromPresence,
  type RuntimeStatus,
} from './liveState'
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

export type GatewaySessionListItem = {
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

function buildOfficeSnapshot(
  presenceEntries: GatewayPresenceEntry[],
  sessionList: GatewaySessionListResult,
  runtimeStatus: RuntimeStatus,
) {
  const sessions = sessionList.sessions ?? []

  const workers: GatewayWorkerSnapshot[] = allWorkerIds().map((workerId) => {
    const session = getPrimarySession(sessions, workerId)
    const presence = getPrimaryPresence(presenceEntries, workerId)
    const status = inferStatusFromPresence(presence, Boolean(session))
    const model = session?.modelProvider && session?.model ? `${session.modelProvider}/${session.model}` : session?.model
    const lastActiveLabel = formatRelativeTime(presence?.ts)

    return {
      id: workerId,
      model,
      status,
      task: session?.label ?? presence?.text ?? runtimeStatus.detail,
      queue: session ? 1 : 0,
      lastActiveLabel,
    }
  })

  const timelineWorkers = workers.map((worker) => ({
    id: worker.id,
    name: worker.id === 'main' ? 'Main' : worker.id === 'vision' ? 'Vision' : 'Logic',
    role: '',
    model: worker.model ?? 'unknown',
    status: worker.status ?? 'idle',
    task: worker.task ?? 'No active task',
    lastCompleted: 'Gateway-driven status',
    location: '',
    energy: energyFromStatus(worker.status ?? 'idle'),
    queue: worker.queue ?? 0,
    duration: durationFromStatus(worker.status ?? 'idle', worker.lastActiveLabel),
    lastActiveLabel: worker.lastActiveLabel ?? 'unknown',
    persona: { icon: '', tone: '', specialty: '' },
  }))

  return {
    scenarioLabel: 'Gateway Live Snapshot',
    delegation: inferDelegation(timelineWorkers),
    workers,
    timeline: buildRuntimeTimeline({
      workers: timelineWorkers,
      sessionCount: sessions.length,
      presenceCount: presenceEntries.length,
      runtimeStatus,
    }),
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

      return buildOfficeSnapshot(presenceResult, sessionListResult, {
        connection: 'live',
        detail: 'Live Gateway data mapped into office workers.',
        lastUpdatedAt: Date.now(),
      })
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
