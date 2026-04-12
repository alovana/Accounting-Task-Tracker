export type GatewayChallengePayload = {
  nonce: string
  ts: number
}

export type GatewayChallengeEvent = {
  type: 'event'
  event: 'connect.challenge'
  payload: GatewayChallengePayload
}

export type GatewayRequest = {
  type: 'req'
  id: string
  method: string
  params: Record<string, unknown>
}

export type GatewaySuccessResponse<T = unknown> = {
  type: 'res'
  id: string
  ok: true
  payload: T
}

export type GatewayErrorResponse = {
  type: 'res'
  id: string
  ok: false
  error: {
    message?: string
    code?: string
    details?: Record<string, unknown>
  }
}

export type GatewayEventEnvelope<T = unknown> = {
  type: 'event'
  event: string
  payload: T
  seq?: number
  stateVersion?: number
}

export type GatewayHelloOk = {
  type: 'hello-ok'
  protocol: number
  policy?: {
    tickIntervalMs?: number
  }
  features?: {
    methods?: string[]
    events?: string[]
  }
  auth?: {
    deviceToken?: string
    role?: string
    scopes?: string[]
  }
}

export type GatewayConnectOptions = {
  clientId?: string
  clientVersion?: string
  locale?: string
  userAgent?: string
  scopes?: string[]
  deviceToken?: string
}

export type GatewayEnvelope<T = unknown> =
  | GatewayChallengeEvent
  | GatewayRequest
  | GatewaySuccessResponse<T>
  | GatewayErrorResponse
  | GatewayEventEnvelope<T>
