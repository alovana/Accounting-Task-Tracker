import type { GatewayConnectOptions } from './protocol'

type SharedSecretKind = 'token' | 'password'

type ResolvedSharedSecret =
  | {
      kind: SharedSecretKind
      value: string
    }
  | undefined

function normalizeSecret(value: string | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function resolveSharedSecret(): ResolvedSharedSecret {
  const explicitToken = normalizeSecret(import.meta.env.VITE_OPENCLAW_GATEWAY_TOKEN)

  if (explicitToken) {
    return {
      kind: 'token',
      value: explicitToken,
    }
  }

  const explicitPassword = normalizeSecret(import.meta.env.VITE_OPENCLAW_GATEWAY_PASSWORD)

  if (explicitPassword) {
    return {
      kind: 'password',
      value: explicitPassword,
    }
  }

  const sharedSecret = normalizeSecret(import.meta.env.VITE_OPENCLAW_GATEWAY_SHARED_SECRET)

  if (!sharedSecret) {
    return undefined
  }

  const configuredKind = normalizeSecret(import.meta.env.VITE_OPENCLAW_GATEWAY_SHARED_SECRET_KIND)?.toLowerCase()
  const kind: SharedSecretKind = configuredKind === 'password' ? 'password' : 'token'

  return {
    kind,
    value: sharedSecret,
  }
}

export function resolveGatewayConnectOptions(base: GatewayConnectOptions): GatewayConnectOptions {
  const sharedSecret = resolveSharedSecret()

  if (!sharedSecret) {
    return base
  }

  if (sharedSecret.kind === 'password') {
    return {
      ...base,
      gatewayPassword: base.gatewayPassword ?? sharedSecret.value,
      gatewayToken: base.gatewayToken,
    }
  }

  return {
    ...base,
    gatewayToken: base.gatewayToken ?? sharedSecret.value,
    gatewayPassword: base.gatewayPassword,
  }
}

export function hasGatewaySharedSecretConfig() {
  return Boolean(resolveSharedSecret())
}
