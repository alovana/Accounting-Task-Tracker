const DEVICE_STORAGE_KEY = 'agent-office.gateway.device'
const ED25519_RAW_PUBLIC_KEY_LENGTH = 32

type PersistedGatewayDevice = {
  id: string
  token?: string
  tokenScopes?: string[]
  tokenRole?: string
  publicKeyRawB64Url: string
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

function encodeBase64Url(bytes: Uint8Array) {
  return encodeBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function decodeBase64Url(input: string) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4))
  return decodeBase64(`${normalized}${padding}`)
}

async function sha256Hex(bytes: Uint8Array) {
  const exactBytes = new Uint8Array(bytes.byteLength)
  exactBytes.set(bytes)
  const digest = await crypto.subtle.digest('SHA-256', exactBytes)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function exportRawPublicKey(publicKey: CryptoKey) {
  const exported = new Uint8Array(await crypto.subtle.exportKey('raw', publicKey))

  if (exported.length !== ED25519_RAW_PUBLIC_KEY_LENGTH) {
    throw new Error('Unexpected Ed25519 public key length')
  }

  return exported
}

async function exportPrivateKey(privateKey: CryptoKey) {
  const exported = await crypto.subtle.exportKey('pkcs8', privateKey)
  return encodeBase64(new Uint8Array(exported))
}

async function importPublicKey(publicKeyRawB64Url: string) {
  return crypto.subtle.importKey('raw', decodeBase64Url(publicKeyRawB64Url), { name: 'Ed25519' }, true, ['verify'])
}

async function importPrivateKey(privateKeyPkcs8B64: string) {
  return crypto.subtle.importKey('pkcs8', decodeBase64(privateKeyPkcs8B64), { name: 'Ed25519' }, true, ['sign'])
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
    const derivedId = await sha256Hex(decodeBase64Url(persisted.publicKeyRawB64Url))
    await importPublicKey(persisted.publicKeyRawB64Url)
    const privateKey = await importPrivateKey(persisted.privateKeyPkcs8B64)

    return {
      id: derivedId,
      publicKey: persisted.publicKeyRawB64Url,
      token: persisted.token,
      tokenScopes: persisted.tokenScopes,
      tokenRole: persisted.tokenRole,
      async signChallenge(payload: string) {
        const signature = await crypto.subtle.sign('Ed25519', privateKey, new TextEncoder().encode(payload))

        return encodeBase64Url(new Uint8Array(signature))
      },
      async saveIssuedToken(token, meta) {
        const normalizedToken = normalizeIssuedToken(token)

        if (!normalizedToken) {
          return
        }

        persistDevice({
          ...persisted,
          id: derivedId,
          token: normalizedToken,
          tokenScopes: meta?.scopes,
          tokenRole: meta?.role,
          updatedAt: Date.now(),
        })
      },
    }
  }

  const keyPair = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify'])
  const publicKeyRaw = await exportRawPublicKey(keyPair.publicKey)
  const derivedId = await sha256Hex(publicKeyRaw)

  const created: PersistedGatewayDevice = {
    id: derivedId,
    publicKeyRawB64Url: encodeBase64Url(publicKeyRaw),
    privateKeyPkcs8B64: await exportPrivateKey(keyPair.privateKey),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  persistDevice(created)

  return {
    id: created.id,
    publicKey: created.publicKeyRawB64Url,
    async signChallenge(payload: string) {
      const signature = await crypto.subtle.sign('Ed25519', keyPair.privateKey, new TextEncoder().encode(payload))

      return encodeBase64Url(new Uint8Array(signature))
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
