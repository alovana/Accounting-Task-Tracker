const DEVICE_STORAGE_KEY = 'agent-office.gateway.device'

type PersistedGatewayDevice = {
  id: string
  token?: string
  tokenScopes?: string[]
  tokenRole?: string
  publicKeySpkiB64: string
  privateKeyPkcs8B64: string
  createdAt: number
  updatedAt: number
}

export type GatewayDeviceIdentity = {
  id: string
  publicKey: string
  signChallenge: (payload: string) => Promise<string>
  token?: string
  tokenScopes?: string[]
  tokenRole?: string
  saveIssuedToken: (token: string | undefined, meta?: { scopes?: string[]; role?: string }) => Promise<void>
}

function normalizeIssuedToken(token: string | undefined) {
  const trimmed = token?.trim()
  return trimmed ? trimmed : undefined
}

function encodeBase64(bytes: Uint8Array) {
  let binary = ''

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return btoa(binary)
}

function decodeBase64(input: string) {
  const binary = atob(input)
  const output = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    output[index] = binary.charCodeAt(index)
  }

  return output
}

function createDeviceId() {
  if (typeof crypto.randomUUID === 'function') {
    return `agent-office-${crypto.randomUUID()}`
  }

  return `agent-office-${Math.random().toString(36).slice(2, 12)}`
}

async function exportPublicKey(publicKey: CryptoKey) {
  const exported = await crypto.subtle.exportKey('spki', publicKey)
  return encodeBase64(new Uint8Array(exported))
}

async function exportPrivateKey(privateKey: CryptoKey) {
  const exported = await crypto.subtle.exportKey('pkcs8', privateKey)
  return encodeBase64(new Uint8Array(exported))
}

async function importPublicKey(publicKeySpkiB64: string) {
  return crypto.subtle.importKey(
    'spki',
    decodeBase64(publicKeySpkiB64),
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true,
    ['verify'],
  )
}

async function importPrivateKey(privateKeyPkcs8B64: string) {
  return crypto.subtle.importKey(
    'pkcs8',
    decodeBase64(privateKeyPkcs8B64),
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true,
    ['sign'],
  )
}

function loadPersistedDevice(): PersistedGatewayDevice | null {
  try {
    const raw = window.localStorage.getItem(DEVICE_STORAGE_KEY)

    if (!raw) {
      return null
    }

    return JSON.parse(raw) as PersistedGatewayDevice
  } catch (error) {
    console.warn('[Agent Office] Failed to load persisted Gateway device identity', error)
    return null
  }
}

function persistDevice(device: PersistedGatewayDevice) {
  window.localStorage.setItem(DEVICE_STORAGE_KEY, JSON.stringify(device))
}

function normalizeDeviceMetadataForAuth(value?: string | null) {
  if (typeof value !== 'string') {
    return ''
  }

  const trimmed = value.trim()

  if (!trimmed) {
    return ''
  }

  return trimmed.replace(/[A-Z]/g, (char) => String.fromCharCode(char.charCodeAt(0) + 32))
}

function challengePayloadToSign(input: {
  deviceId: string
  clientId: string
  clientMode: string
  role: string
  scopes: string[]
  signedAtMs: number
  token?: string | null
  nonce: string
  platform?: string | null
  deviceFamily?: string | null
}) {
  const scopes = input.scopes.join(',')
  const token = input.token ?? ''
  const platform = normalizeDeviceMetadataForAuth(input.platform)
  const deviceFamily = normalizeDeviceMetadataForAuth(input.deviceFamily)

  return [
    'v3',
    input.deviceId,
    input.clientId,
    input.clientMode,
    input.role,
    scopes,
    String(input.signedAtMs),
    token,
    input.nonce,
    platform,
    deviceFamily,
  ].join('|')
}

export function buildChallengePayload(input: {
  deviceId: string
  clientId: string
  clientMode: string
  role: string
  scopes: string[]
  signedAtMs: number
  token?: string | null
  nonce: string
  platform?: string | null
  deviceFamily?: string | null
}) {
  return challengePayloadToSign(input)
}

export async function getOrCreateGatewayDeviceIdentity(): Promise<GatewayDeviceIdentity> {
  const persisted = loadPersistedDevice()

  if (persisted) {
    await importPublicKey(persisted.publicKeySpkiB64)
    const privateKey = await importPrivateKey(persisted.privateKeyPkcs8B64)

    return {
      id: persisted.id,
      publicKey: persisted.publicKeySpkiB64,
      token: persisted.token,
      tokenScopes: persisted.tokenScopes,
      tokenRole: persisted.tokenRole,
      async signChallenge(payload: string) {
        const signature = await crypto.subtle.sign(
          {
            name: 'ECDSA',
            hash: 'SHA-256',
          },
          privateKey,
          new TextEncoder().encode(payload),
        )

        return encodeBase64(new Uint8Array(signature))
      },
      async saveIssuedToken(token, meta) {
        const normalizedToken = normalizeIssuedToken(token)

        if (!normalizedToken) {
          return
        }

        persistDevice({
          ...persisted,
          token: normalizedToken,
          tokenScopes: meta?.scopes,
          tokenRole: meta?.role,
          updatedAt: Date.now(),
        })
      },
    }
  }

  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true,
    ['sign', 'verify'],
  )

  const created: PersistedGatewayDevice = {
    id: createDeviceId(),
    publicKeySpkiB64: await exportPublicKey(keyPair.publicKey),
    privateKeyPkcs8B64: await exportPrivateKey(keyPair.privateKey),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  persistDevice(created)

  return {
    id: created.id,
    publicKey: created.publicKeySpkiB64,
    async signChallenge(payload: string) {
      const signature = await crypto.subtle.sign(
        {
          name: 'ECDSA',
          hash: 'SHA-256',
        },
        keyPair.privateKey,
        new TextEncoder().encode(payload),
      )

      return encodeBase64(new Uint8Array(signature))
    },
    async saveIssuedToken(token, meta) {
      const normalizedToken = normalizeIssuedToken(token)

      if (!normalizedToken) {
        return
      }

      persistDevice({
        ...created,
        token: normalizedToken,
        tokenScopes: meta?.scopes,
        tokenRole: meta?.role,
        updatedAt: Date.now(),
      })
    },
  }
}
