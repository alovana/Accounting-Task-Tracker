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

type GatewayAuthMode = 'token' | 'password' | 'device-token' | 'none'

class GatewayRequestError extends Error {
  code?: string
  details?: GatewayErrorResponse['error']['details']

  constructor(message: string, options?: { code?: string; details?: GatewayErrorResponse['error']['details'] }) {
    super(message)
    this.name = 'GatewayRequestError'
    this.code = options?.code
    this.details = options?.details
  }
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
      authMode: 'token' as const,
      signatureToken: token,
      reusedStoredDeviceToken: false,
    }
  }

  if (password) {
    return {
      auth: {
        password,
      },
      authMode: 'password' as const,
      signatureToken: password,
      reusedStoredDeviceToken: false,
    }
  }

  if (deviceToken) {
    return {
      auth: {
        deviceToken,
      },
      authMode: 'device-token' as const,
      signatureToken: deviceToken,
      reusedStoredDeviceToken: deviceToken === normalizeCredential(storedDeviceToken),
    }
  }

  return {
    auth: {},
    authMode: 'none' as const,
    signatureToken: undefined,
    reusedStoredDeviceToken: false,
  }
}

function shouldRetryConnectWithDeviceToken(error: unknown, authMode: GatewayAuthMode, hasDeviceToken: boolean) {
  if (!hasDeviceToken || (authMode !== 'token' && authMode !== 'password')) {
    return false
  }

  if (!(error instanceof GatewayRequestError)) {
    return false
  }

  return error.details?.canRetryWithDeviceToken === true
}

export class GatewayWsClient {
  private socket: WebSocket | null = null
  private url: string
  private eventListeners = new Map<string, Set<(payload: unknown, envelope: GatewayEnvelope<unknown>) => void>>()

  constructor(url: string) {
    this.url = url
  }

  async connect() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return
    }

    if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
      await new Promise<void>((resolve, reject) => {
        this.socket?.addEventListener('open', () => resolve(), { once: true })
        this.socket?.addEventListener('error', () => reject(new Error('Failed to open Gateway WebSocket')), {
          once: true,
        })
      })
      return
    }

    await new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(this.url)
      this.socket = socket

      socket.addEventListener('open', () => resolve(), { once: true })
      socket.addEventListener('error', () => reject(new Error('Failed to open Gateway WebSocket')), {
        once: true,
      })
      socket.addEventListener('message', this.handleSocketMessage)
      socket.addEventListener('close', () => {
        socket.removeEventListener('message', this.handleSocketMessage)

        if (this.socket === socket) {
          this.socket = null
        }
      })
    })
  }

  disconnect() {
    if (!this.socket) {
      return
    }

    const socket = this.socket
    this.socket = null

    if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
      socket.close()
    }
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

  onEvent<T>(eventName: string, listener: (payload: T, envelope: GatewayEnvelope<T>) => void) {
    const listeners = this.eventListeners.get(eventName) ?? new Set()
    const wrapped = listener as (payload: unknown, envelope: GatewayEnvelope<unknown>) => void
    listeners.add(wrapped)
    this.eventListeners.set(eventName, listeners)

    return () => {
      const current = this.eventListeners.get(eventName)

      if (!current) {
        return
      }

      current.delete(wrapped)

      if (current.size === 0) {
        this.eventListeners.delete(eventName)
      }
    }
  }

  async connectAsOperator(options: GatewayConnectOptions = {}) {
    const challenge = await this.waitForChallenge()
    const device = await getOrCreateGatewayDeviceIdentity()
    const clientId = options.clientId ?? 'gateway-client'
    const clientMode = options.clientMode ?? 'ui'
    const platform = options.platform ?? 'web'
    const deviceFamily = options.deviceFamily ?? 'browser'
    const requestedScopes = options.scopes ?? ['operator.read']

    const attemptConnect = async (attemptOptions: GatewayConnectOptions, fallbackReason?: string) => {
      const signedAt = Date.now()
      const { auth, authMode, signatureToken, reusedStoredDeviceToken } = resolveConnectAuth(attemptOptions, device.token)
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
        authMode,
        reusedStoredDeviceToken,
        fallbackReason,
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

      return { response, authMode }
    }

    try {
      return (await attemptConnect(options)).response
    } catch (error) {
      const hasDeviceToken = Boolean(normalizeCredential(options.deviceToken) ?? normalizeCredential(device.token))
      const primaryAuth = resolveConnectAuth(options, device.token)

      if (!shouldRetryConnectWithDeviceToken(error, primaryAuth.authMode, hasDeviceToken)) {
        throw error
      }

      console.warn('[Agent Office] Shared-secret Gateway auth failed, retrying once with device token', {
        primaryAuthMode: primaryAuth.authMode,
        code: error instanceof GatewayRequestError ? error.code : undefined,
        reason: error instanceof GatewayRequestError ? error.details?.reason : undefined,
        recommendedNextStep: error instanceof GatewayRequestError ? error.details?.recommendedNextStep : undefined,
      })

      return (
        await attemptConnect(
          {
            ...options,
            gatewayToken: undefined,
            gatewayPassword: undefined,
          },
          'shared-secret-rejected-retrying-with-device-token',
        )
      ).response
    }
  }

  private handleSocketMessage = (event: MessageEvent<string>) => {
    const envelope = JSON.parse(event.data) as GatewayEnvelope<unknown>

    if (envelope.type !== 'event') {
      return
    }

    const listeners = this.eventListeners.get(envelope.event)

    if (!listeners?.size) {
      return
    }

    for (const listener of listeners) {
      listener(envelope.payload, envelope)
    }
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
          const errorCode = error.error.code ?? detailsCode
          const message = error.error.message ?? 'Gateway request failed'
          reject(
            new GatewayRequestError(detailsCode ? `${message} (${detailsCode})` : message, {
              code: errorCode,
              details: error.error.details,
            }),
          )
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
