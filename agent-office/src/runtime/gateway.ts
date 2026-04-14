import { resolveGatewayConnectOptions } from './gatewayConfig'
import { GatewayWsClient } from './wsClient'
import {
  allWorkerIds,
  buildRuntimeTimeline,
  durationFromStatus,
  energyFromStatus,
  formatRelativeTime,
  getPrimaryPresence,
  getPrimarySession,
  getSessionsForWorker,
  inferDelegation,
  inferMonitoringFreshness,
  inferStatusFromPresence,
  inferStatusFromSession,
  mergeWorkerStatus,
  type RuntimeStatus,
} from './liveState'
import type { MonitoringFreshness } from '../types'
import type { GatewayPresenceEntry } from './protocol'

export type GatewayWorkerSnapshot = {
  id: 'main' | 'vision' | 'logic'
  model?: string
  status?: 'working' | 'sleeping' | 'idle' | 'waiting' | 'blocked' | 'done'
  task?: string
  queue?: number
  lastActiveLabel?: string
  monitoring?: {
    source: 'gateway'
    sessionCount?: number
    presenceLabel?: string
    sessionLabel?: string
    sessionStatus?: string
    freshness?: MonitoringFreshness
  }
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
  monitoring?: {
    source: 'gateway'
    sessionCount?: number
    presenceCount?: number
    lastUpdatedLabel?: string
    freshness?: MonitoringFreshness
  }
}

export type GatewaySessionListItem = {
  key: string
  label?: string
  model?: string
  modelProvider?: string
  spawnedBy?: string
  status?: string
  summary?: string
  task?: string
}

type GatewaySessionListResult = {
  sessions?: GatewaySessionListItem[]
}

type GatewaySessionChangePayload =
  | GatewaySessionListItem
  | GatewaySessionListItem[]
  | {
      action?: string
      key?: string
      session?: GatewaySessionListItem | null
      sessions?: GatewaySessionListItem[]
      removed?: string[]
      deleted?: string[]
    }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isSessionListItem(value: unknown): value is GatewaySessionListItem {
  if (!isRecord(value)) {
    return false
  }

  return typeof value.key === 'string' && value.key.trim().length > 0
}

function toSessionListItemArray(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(isSessionListItem)
}

function normalizeSessionChangePayload(payload: GatewaySessionChangePayload) {
  if (Array.isArray(payload)) {
    return {
      upserts: payload.filter(isSessionListItem),
      removals: [] as string[],
      shouldReplace: true,
    }
  }

  if (isSessionListItem(payload)) {
    return {
      upserts: [payload],
      removals: [] as string[],
      shouldReplace: false,
    }
  }

  if (!isRecord(payload)) {
    return {
      upserts: [] as GatewaySessionListItem[],
      removals: [] as string[],
      shouldReplace: false,
    }
  }

  const upsertsFromSessions = toSessionListItemArray(payload.sessions)
  const upsertsFromSession = isSessionListItem(payload.session) ? [payload.session] : []
  const rawRemovals = [...(Array.isArray(payload.removed) ? payload.removed : []), ...(Array.isArray(payload.deleted) ? payload.deleted : [])]
  const removals = rawRemovals.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
  const action = typeof payload.action === 'string' ? payload.action.toLowerCase() : ''
  const keyedRemoval = (action === 'remove' || action === 'delete') && typeof payload.key === 'string' ? [payload.key] : []

  return {
    upserts: [...upsertsFromSessions, ...upsertsFromSession],
    removals: [...removals, ...keyedRemoval],
    shouldReplace: Array.isArray(payload.sessions) && upsertsFromSession.length === 0 && removals.length === 0 && keyedRemoval.length === 0,
  }
}

function mergeSessionList(current: GatewaySessionListResult, payload: GatewaySessionChangePayload) {
  const { upserts, removals, shouldReplace } = normalizeSessionChangePayload(payload)

  if (shouldReplace) {
    return { sessions: upserts }
  }

  const nextByKey = new Map((current.sessions ?? []).map((session) => [session.key, session]))

  for (const key of removals) {
    nextByKey.delete(key)
  }

  for (const session of upserts) {
    nextByKey.set(session.key, session)
  }

  return { sessions: Array.from(nextByKey.values()) }
}

export type GatewayLiveUpdate = {
  snapshot: GatewayOfficeSnapshot | null
  runtimeStatus: RuntimeStatus
}

export type GatewayTransport = {
  connect: () => Promise<void>
  fetchOfficeSnapshot: () => Promise<GatewayOfficeSnapshot | null>
  subscribeToUpdates: (listener: (update: GatewayLiveUpdate) => void) => () => void
  disconnect: () => void
}

function formatRuntimeUpdate(timestampMs?: number) {
  return timestampMs ? formatRelativeTime(timestampMs) : 'pending'
}

function buildOfficeSnapshot(
  presenceEntries: GatewayPresenceEntry[],
  sessionList: GatewaySessionListResult,
  runtimeStatus: RuntimeStatus,
) {
  const sessions = sessionList.sessions ?? []

  const workers: GatewayWorkerSnapshot[] = allWorkerIds().map((workerId) => {
    const workerSessions = getSessionsForWorker(sessions, workerId)
    const session = getPrimarySession(sessions, workerId)
    const presence = getPrimaryPresence(presenceEntries, workerId)
    const presenceStatus = inferStatusFromPresence(presence, Boolean(session))
    const sessionStatus = inferStatusFromSession(session)
    const status = mergeWorkerStatus(presenceStatus, sessionStatus, Boolean(presence), workerSessions.length > 0)
    const model = session?.modelProvider && session?.model ? `${session.modelProvider}/${session.model}` : session?.model
    const lastActiveLabel = formatRelativeTime(presence?.ts)
    const task =
      session?.label ??
      session?.summary ??
      session?.task ??
      (workerSessions.length > 1 ? `${workerSessions.length} queued Gateway sessions` : undefined) ??
      presence?.text ??
      runtimeStatus.detail

    return {
      id: workerId,
      model,
      status,
      task,
      queue: workerSessions.length,
      lastActiveLabel,
      monitoring: {
        source: 'gateway',
        sessionCount: workerSessions.length,
        presenceLabel: presence?.text ?? presence?.reason,
        sessionLabel: session?.label ?? session?.summary ?? session?.task,
        sessionStatus: session?.status,
        freshness: inferMonitoringFreshness(presence?.ts ?? runtimeStatus.lastUpdatedAt),
      },
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
    monitoring: {
      source: 'gateway',
      sessionCount: sessions.length,
      presenceCount: presenceEntries.length,
      lastUpdatedLabel: formatRuntimeUpdate(runtimeStatus.lastUpdatedAt),
      freshness: inferMonitoringFreshness(runtimeStatus.lastUpdatedAt),
    },
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

  subscribeToUpdates() {
    return () => undefined
  }

  disconnect() {
    return
  }
}

class WebSocketGatewayTransport implements GatewayTransport {
  private client: GatewayWsClient
  private helloConnected = false
  private subscriptionReady = false
  private presenceEntries: GatewayPresenceEntry[] = []
  private sessionList: GatewaySessionListResult = { sessions: [] }
  private listeners = new Set<(update: GatewayLiveUpdate) => void>()
  private unsubscribeCallbacks: Array<() => void> = []
  private refreshPromise: Promise<GatewayOfficeSnapshot | null> | null = null

  constructor(url: string) {
    this.client = new GatewayWsClient(url)
  }

  async connect() {
    await this.client.connect()
  }

  subscribeToUpdates(listener: (update: GatewayLiveUpdate) => void) {
    this.listeners.add(listener)

    if (this.unsubscribeCallbacks.length === 0) {
      this.unsubscribeCallbacks = [
        this.client.onEvent<GatewayPresenceEntry[] | GatewayPresenceEntry>('presence', (payload) => {
          this.handlePresenceEvent(payload)
        }),
        this.client.onEvent<GatewaySessionChangePayload>('sessions.changed', (payload) => {
          if (this.applySessionDelta(payload, 'Gateway session delta applied to the office view.')) {
            return
          }

          void this.refreshSnapshot('Gateway session change event received, refreshing snapshot...')
        }),
        this.client.onEvent<GatewaySessionChangePayload>('session.message', (payload) => {
          if (this.applySessionDelta(payload, 'Gateway session message delta applied to the office view.')) {
            return
          }

          void this.refreshSnapshot('Gateway message event received, refreshing snapshot...')
        }),
        this.client.onEvent('chat', () => {
          void this.refreshSnapshot('Gateway chat event received, refreshing snapshot...')
        }),
      ]
    }

    return () => {
      this.listeners.delete(listener)
    }
  }

  disconnect() {
    for (const unsubscribe of this.unsubscribeCallbacks) {
      unsubscribe()
    }

    this.unsubscribeCallbacks = []
    this.listeners.clear()
    this.subscriptionReady = false
    this.helloConnected = false
    this.client.disconnect()
  }

  async fetchOfficeSnapshot() {
    return this.refreshSnapshot('Live Gateway data mapped into office workers.')
  }

  private emitUpdate(runtimeStatus: RuntimeStatus) {
    const snapshot = buildOfficeSnapshot(this.presenceEntries, this.sessionList, runtimeStatus)

    for (const listener of this.listeners) {
      listener({ snapshot, runtimeStatus })
    }

    return snapshot
  }

  private handlePresenceEvent(payload: GatewayPresenceEntry[] | GatewayPresenceEntry) {
    const nextEntries = Array.isArray(payload) ? payload : [payload]

    if (!nextEntries.length) {
      return
    }

    const byIdentity = new Map<string, GatewayPresenceEntry>()

    for (const entry of this.presenceEntries) {
      byIdentity.set(this.getPresenceIdentity(entry), entry)
    }

    for (const entry of nextEntries) {
      byIdentity.set(this.getPresenceIdentity(entry), entry)
    }

    this.presenceEntries = Array.from(byIdentity.values()).sort((left, right) => (right.ts ?? 0) - (left.ts ?? 0))
    this.emitUpdate({
      connection: 'live',
      detail: 'Gateway presence event received and applied to the office view.',
      lastUpdatedAt: Date.now(),
    })
  }

  private getPresenceIdentity(entry: GatewayPresenceEntry) {
    return [entry.deviceId, entry.instanceId, entry.host, entry.text, entry.reason].filter(Boolean).join(':') || `ts:${entry.ts}`
  }

  private async ensureOperatorHello() {
    if (this.helloConnected) {
      return
    }

    const hello = await this.client.connectAsOperator(
      resolveGatewayConnectOptions({
        clientId: 'gateway-client',
        clientMode: 'ui',
        clientVersion: '0.0.0',
        platform: 'web',
        deviceFamily: 'browser',
        scopes: ['operator.read'],
        locale: navigator.language,
        userAgent: navigator.userAgent,
      }),
    )

    this.helloConnected = true
    this.presenceEntries = hello.snapshot?.presence ?? this.presenceEntries

    console.info('[Agent Office] Gateway operator connection established', {
      discoveredMethods: hello.features?.methods?.filter((method) =>
        ['sessions.list', 'sessions.preview', 'sessions.get', 'system-presence', 'sessions.subscribe'].includes(method),
      ),
      discoveredEvents: hello.features?.events?.filter((event) =>
        ['sessions.changed', 'session.message', 'presence', 'chat'].includes(event),
      ),
    })

    await this.ensureSubscriptions(hello.features?.methods ?? [])
  }

  private async ensureSubscriptions(methods: string[]) {
    if (this.subscriptionReady) {
      return
    }

    const subscribeMethods = methods.filter((method) =>
      ['sessions.subscribe', 'sessions.messages.subscribe'].includes(method),
    )

    if (!subscribeMethods.length) {
      this.subscriptionReady = true
      return
    }

    const subscriptionCalls = subscribeMethods.map((method) => this.client.sendRequest(method, {}))
    const results = await Promise.allSettled(subscriptionCalls)

    const rejected = results.filter((result) => result.status === 'rejected')

    if (rejected.length > 0) {
      console.warn('[Agent Office] Gateway subscriptions were only partially enabled', {
        requestedMethods: subscribeMethods,
        failures: rejected.length,
      })
    }

    this.subscriptionReady = true
  }

  private applySessionDelta(payload: GatewaySessionChangePayload, detail: string) {
    const nextSessionList = mergeSessionList(this.sessionList, payload)
    const unchanged = JSON.stringify(nextSessionList.sessions ?? []) === JSON.stringify(this.sessionList.sessions ?? [])

    if (unchanged) {
      return false
    }

    this.sessionList = nextSessionList
    this.emitUpdate({
      connection: 'live',
      detail,
      lastUpdatedAt: Date.now(),
    })
    return true
  }

  private async refreshSnapshot(detail: string) {
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    this.refreshPromise = (async () => {
      try {
        await this.ensureOperatorHello()

        const [presenceResult, sessionListResult] = await Promise.all([
          this.client.sendRequest<GatewayPresenceEntry[]>('system-presence', {}),
          this.client.sendRequest<GatewaySessionListResult>('sessions.list', {
            includeGlobal: true,
            includeUnknown: true,
            limit: 50,
          }),
        ])

        this.presenceEntries = presenceResult
        this.sessionList = sessionListResult

        return this.emitUpdate({
          connection: 'live',
          detail,
          lastUpdatedAt: Date.now(),
        })
      } catch (error) {
        console.warn('[Agent Office] Gateway snapshot fetch failed, falling back to mock snapshot', error)

        const runtimeStatus: RuntimeStatus = {
          connection: 'fallback',
          detail: 'Gateway returned no usable office snapshot, showing local fallback scene.',
          lastUpdatedAt: Date.now(),
        }

        for (const listener of this.listeners) {
          listener({ snapshot: null, runtimeStatus })
        }

        return null
      } finally {
        this.refreshPromise = null
      }
    })()

    return this.refreshPromise
  }
}

export function createGatewayTransport() {
  const gatewayUrl = import.meta.env.VITE_OPENCLAW_GATEWAY_URL

  if (!gatewayUrl) {
    return new NoopGatewayTransport()
  }

  return new WebSocketGatewayTransport(gatewayUrl)
}
