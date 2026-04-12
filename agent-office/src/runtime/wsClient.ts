import type { GatewayEnvelope, GatewayHelloOk, GatewayRequest, GatewaySuccessResponse } from './protocol'

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
    return this.waitForEvent<{ nonce: string; ts: number }>('connect.challenge')
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

  async connectAsOperatorPlaceholder() {
    const challenge = await this.waitForChallenge()

    console.info('[Agent Office] Received Gateway challenge', challenge)

    return this.sendRequest<GatewayHelloOk>('connect', {
      minProtocol: 3,
      maxProtocol: 3,
      client: {
        id: 'agent-office',
        version: '0.0.0',
        platform: 'web',
        mode: 'operator',
      },
      role: 'operator',
      scopes: ['operator.read'],
      caps: [],
      commands: [],
      permissions: {},
      auth: {},
      locale: 'en-US',
      userAgent: 'agent-office/0.0.0',
      device: {
        id: 'agent-office-placeholder-device',
        publicKey: 'placeholder',
        signature: 'placeholder',
        signedAt: Date.now(),
        nonce: typeof challenge === 'object' && challenge && 'nonce' in challenge ? challenge.nonce : '',
      },
    })
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
