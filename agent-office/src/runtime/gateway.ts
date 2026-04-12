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
    console.info('[Agent Office] Gateway snapshot fetch is not wired to live RPC methods yet')
    return null
  }
}

export function createGatewayTransport() {
  const gatewayUrl = import.meta.env.VITE_OPENCLAW_GATEWAY_URL

  if (!gatewayUrl) {
    return new NoopGatewayTransport()
  }

  return new WebSocketGatewayTransport(gatewayUrl)
}
