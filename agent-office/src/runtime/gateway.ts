import { GatewayWsClient } from './wsClient'

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

export type GatewayTransport = {
  connect: () => Promise<void>
  fetchOfficeSnapshot: () => Promise<GatewayOfficeSnapshot | null>
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
        clientId: 'agent-office',
        clientVersion: '0.0.0',
        scopes: ['operator.read'],
        locale: navigator.language,
        userAgent: navigator.userAgent,
      })

      console.info('[Agent Office] Gateway auth scaffold connected, but live snapshot RPC mapping is still pending', {
        discoveredMethods: hello.features?.methods?.filter((method) =>
          ['sessions.list', 'sessions.preview', 'sessions.get', 'system-presence', 'sessions.subscribe'].includes(method),
        ),
        discoveredEvents: hello.features?.events?.filter((event) =>
          ['sessions.changed', 'session.message', 'presence', 'chat'].includes(event),
        ),
      })
      return null
    } catch (error) {
      console.warn('[Agent Office] Gateway auth scaffold failed, falling back to mock snapshot', error)
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
