export type GatewayChallengePayload = {
  nonce: string
  ts: number
}

export type GatewayChallengeEvent = {
  type: 'event'
  event: 'connect.challenge'
  payload: GatewayChallengePayload
}

export type GatewayDeviceTokenGrant = {
  deviceToken: string
  role: string
  scopes: string[]
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
    details?: {
      code?: string
      reason?: string
      canRetryWithDeviceToken?: boolean
      recommendedNextStep?: string
      [key: string]: unknown
    }
  }
}

export type GatewayEventEnvelope<T = unknown> = {
  type: 'event'
  event: string
  payload: T
  seq?: number
  stateVersion?: number
}

export type GatewayPresenceEntry = {
  text?: string
  ts: number
  deviceId?: string
  roles?: string[]
  scopes?: string[]
  platform?: string
  deviceFamily?: string
  version?: string
  mode?: string
  reason?: string
  host?: string
  instanceId?: string
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
  snapshot?: {
    presence?: GatewayPresenceEntry[]
    sessionDefaults?: {
      defaultAgentId?: string
      mainKey?: string
      mainSessionKey?: string
      scope?: string
    }
  }
  auth?: {
    deviceToken?: string
    deviceTokens?: GatewayDeviceTokenGrant[]
    role?: string
    scopes?: string[]
  }
}

export type GatewayConnectOptions = {
  clientId?: string
  clientVersion?: string
  clientMode?: 'ui' | 'webchat' | 'cli' | 'backend' | 'test' | 'probe' | 'node'
  platform?: string
  deviceFamily?: string
  locale?: string
  userAgent?: string
  scopes?: string[]
  gatewayToken?: string
  gatewayPassword?: string
  deviceToken?: string
}

export type GatewayEnvelope<T = unknown> =
  | GatewayChallengeEvent
  | GatewayRequest
  | GatewaySuccessResponse<T>
  | GatewayErrorResponse
  | GatewayEventEnvelope<T>
