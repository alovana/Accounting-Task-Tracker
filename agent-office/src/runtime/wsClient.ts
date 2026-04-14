import { buildChallengePayload, getOrCreateGatewayDeviceIdentity } from './deviceAuth'
import type {
  GatewayChallengePayload,
  GatewayConnectOptions,
  GatewayEnvelope,
  GatewayErrorResponse,
  GatewayHelloOk,
  GatewayRequest,
  GatewaySuccessResponse,
} from './protocol'

function createRequestId() {
  return `req_${Math.random().toString(36).slice(2, 10)}`
}

function normalizeCredential(value: string | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function resolveConnectAuth(options: GatewayConnectOptions, storedDeviceToken?: string) {
  const token = normalizeCredential(options.gatewayToken)
  const password = normalizeCredential(options.gatewayPassword)
  const deviceToken = normalizeCredential(options.deviceToken) ?? normalizeCredential(storedDeviceToken)

  if (token) {
    return {
      auth: {
        token,
      },
      signatureToken: token,
      reusedStoredDeviceToken: false,
    }
  }

  if (password) {
    return {
      auth: {
        password,
      },
      signatureToken: password,
      reusedStoredDeviceToken: false,
    }
  }

  if (deviceToken) {
    return {
      auth: {
        deviceToken,
      },
      signatureToken: deviceToken,
      reusedStoredDeviceToken: deviceToken === normalizeCredential(storedDeviceToken),
    }
  }

  return {
    auth: {},
    signatureToken: undefined,
    reusedStoredDeviceToken: false,
  }
}

export class GatewayWsClient {
  private socket: WebSocket | null = null
  private url: string

  constructor(url: string) {
    this.url = url
  }

  async connect() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return
    }

    await new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(this.url)
      this.socket = socket

      socket.addEventListener('open', () => resolve(), { once: true })
      socket.addEventListener('error', () => reject(new Error('Failed to open Gateway WebSocket')), {
        once: true,
      })
    })
  }

  async waitForChallenge() {
    return this.waitForEvent<GatewayChallengePayload>('connect.challenge')
  }

  async sendRequest<T = unknown>(method: string, params: Record<string, unknown>) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('Gateway WebSocket is not connected')
    }

    const id = createRequestId()
    const request: GatewayRequest = {
      type: 'req',
      id,
      method,
      params,
    }

    this.socket.send(JSON.stringify(request))

    return this.waitForResponse<T>(id)
  }

  async connectAsOperator(options: GatewayConnectOptions = {}) {
    const challenge = await this.waitForChallenge()
    const device = await getOrCreateGatewayDeviceIdentity()
    const signedAt = Date.now()
    const clientId = options.clientId ?? 'gateway-client'
    const clientMode = options.clientMode ?? 'ui'
    const platform = options.platform ?? 'web'
    const deviceFamily = options.deviceFamily ?? 'browser'
    const requestedScopes = options.scopes ?? ['operator.read']

    const { auth, signatureToken, reusedStoredDeviceToken } = resolveConnectAuth(options, device.token)
    const challengePayload = buildChallengePayload({
      deviceId: device.id,
      clientId,
      clientMode,
      role: 'operator',
      scopes: requestedScopes,
      signedAtMs: signedAt,
      token: signatureToken,
      nonce: challenge.nonce,
      platform,
      deviceFamily,
    })
    const signature = await device.signChallenge(challengePayload)

    console.info('[Agent Office] Received Gateway challenge and prepared signed v3 device handshake', {
      deviceId: device.id,
      clientId,
      clientMode,
      platform,
      deviceFamily,
      signedAt,
      signedPayloadVersion: 'v3',
      authMode: auth.token ? 'token' : auth.password ? 'password' : auth.deviceToken ? 'device-token' : 'none',
      reusedStoredDeviceToken,
    })

    const response = await this.sendRequest<GatewayHelloOk>('connect', {
      minProtocol: 3,
      maxProtocol: 3,
      client: {
        id: clientId,
        version: options.clientVersion ?? '0.0.0',
        platform,
        deviceFamily,
        mode: clientMode,
      },
      role: 'operator',
      scopes: requestedScopes,
      caps: [],
      commands: [],
      permissions: {},
      auth,
      locale: options.locale ?? 'en-US',
      userAgent: options.userAgent ?? 'agent-office/0.0.0',
      device: {
        id: device.id,
        publicKey: device.publicKey,
        signature,
        signedAt,
        nonce: challenge.nonce,
      },
    })

    await device.saveIssuedToken(response.auth?.deviceToken, {
      scopes: response.auth?.scopes,
      role: response.auth?.role,
    })

    return response
  }

  private waitForResponse<T>(requestId: string) {
    return new Promise<T>((resolve, reject) => {
      const handleMessage = (event: MessageEvent<string>) => {
        const envelope = JSON.parse(event.data) as GatewayEnvelope<T>

        if (envelope.type !== 'res' || envelope.id !== requestId) {
          return
        }

        this.socket?.removeEventListener('message', handleMessage)

        if (!envelope.ok) {
          const error = envelope as GatewayErrorResponse
          const detailsCode = error.error.details?.code
          const message = error.error.message ?? 'Gateway request failed'
          reject(new Error(detailsCode ? `${message} (${detailsCode})` : message))
          return
        }

        resolve((envelope as GatewaySuccessResponse<T>).payload)
      }

      this.socket?.addEventListener('message', handleMessage)
    })
  }

  private waitForEvent<T>(eventName: string) {
    return new Promise<T>((resolve) => {
      const handleMessage = (event: MessageEvent<string>) => {
        const envelope = JSON.parse(event.data) as GatewayEnvelope<T>

        if (envelope.type !== 'event' || envelope.event !== eventName) {
          return
        }

        this.socket?.removeEventListener('message', handleMessage)
        resolve(envelope.payload as T)
      }

      this.socket?.addEventListener('message', handleMessage)
    })
  }
}
