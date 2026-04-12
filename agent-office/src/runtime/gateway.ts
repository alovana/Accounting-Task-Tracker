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

export async function fetchGatewayOfficeSnapshot(): Promise<GatewayOfficeSnapshot | null> {
  return null
}
