import { buildChallengePayload, getOrCreateGatewayDeviceIdentity } from './deviceAuth'
import type {
  GatewayChallengePayload,
  GatewayConnectOptions,
  GatewayEnvelope,
  GatewayHelloOk,
  GatewayRequest,
  GatewaySuccessResponse,
} from './protocol'

function createRequestId() {
  return `req_${Math.random().toString(36).slice(2, 10)}`
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
    const challengePayload = buildChallengePayload({
      nonce: challenge.nonce,
      ts: challenge.ts,
      signedAt,
      publicKey: device.publicKey,
      deviceId: device.id,
    })
    const signature = await device.signChallenge(challengePayload)

    console.info('[Agent Office] Received Gateway challenge and prepared signed device handshake', {
      deviceId: device.id,
      signedAt,
    })

    const response = await this.sendRequest<GatewayHelloOk>('connect', {
      minProtocol: 3,
      maxProtocol: 3,
      client: {
        id: options.clientId ?? 'agent-office',
        version: options.clientVersion ?? '0.0.0',
        platform: 'web',
        mode: 'operator',
      },
      role: 'operator',
      scopes: options.scopes ?? ['operator.read'],
      caps: [],
      commands: [],
      permissions: {},
      auth: options.deviceToken || device.token ? { deviceToken: options.deviceToken ?? device.token } : {},
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
          reject(new Error(envelope.error.message ?? 'Gateway request failed'))
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
