# Agent Office runtime layer

This folder is the integration bridge between the dashboard UI and live OpenClaw Gateway data.

## Current state
- `protocol.ts` defines the basic Gateway WS envelope shapes, `hello-ok.snapshot/auth` fields, and auth error hints.
- `deviceAuth.ts` provides browser-side device identity generation, persistence, and the verified v3 signing payload builder.
- `wsClient.ts` provides a minimal WebSocket client scaffold with request/response, event waiting, and signed operator-connect scaffolding.
- `gateway.ts` now performs a first real read-only snapshot fetch via `system-presence` plus `sessions.list`, and plumbs optional shared-secret auth from Vite env config.
- `adapters.ts` maps a gateway snapshot into the dashboard worker and timeline model.
- `useOfficeRuntime` can switch between mock mode and gateway mode.
- local-first worker inference now merges presence with conservative session heuristics (`label`, `status`, `summary`, `task`) so the dashboard can estimate queue depth and worker state without extra model work.

## Intended live data path
1. Connect to the OpenClaw Gateway WebSocket.
2. Authenticate as an operator client.
3. Read session/task data from Gateway RPC methods and events.
4. Convert them into `GatewayOfficeSnapshot`.
5. Map them into the office scene using `buildScenarioFromGateway`.

## Good candidate Gateway surfaces
- `sessions.list`
- `sessions.preview`
- `sessions.get`
- `system-presence`
- `sessions.subscribe`
- `sessions.messages.subscribe`
- live events: `sessions.changed`, `session.message`, `presence`, `chat`

## Important note
This runtime now uses the installed OpenClaw package's verified v3 device-auth payload shape.

What is verified from the local OpenClaw docs and installed dist:
- browser/operator clients receive `connect.challenge` before `connect`
- `connect` uses protocol `3`
- shared-secret auth uses `connect.params.auth.token` or `connect.params.auth.password`
- successful connects can return `hello-ok.auth.deviceToken`, which should be persisted if non-empty
- reconnect precedence is shared token/password first, then explicit/stored device token
- Agent Office now follows that precedence conservatively and will not overwrite a cached device token with an empty or missing token on later connects
- the canonical signer payload is `v3|deviceId|clientId|clientMode|role|scopesCsv|signedAtMs|token|nonce|platform|deviceFamily`
- `platform` and `deviceFamily` are normalized as trimmed lowercase ASCII strings before signing
- a valid client id for this style of browser client is `gateway-client`, with `client.mode: "ui"`

Still uncertain:
- the exact `sessions.list` row shape is not fully documented in the installed package, so Agent Office currently uses only conservative fields it could verify in shipped artifacts (`key`, `label`, `model`, `modelProvider`, `spawnedBy`) and treats the read-only office mapping as heuristic.

Gateway mode is now a safer read-only integration scaffold, but the office-specific session-to-worker mapping is still integration-in-progress rather than a fully productized live view.

## Local config notes
- `VITE_OPENCLAW_GATEWAY_URL` enables Gateway mode.
- `VITE_OPENCLAW_GATEWAY_TOKEN` or `VITE_OPENCLAW_GATEWAY_PASSWORD` explicitly selects shared-secret auth style.
- `VITE_OPENCLAW_GATEWAY_SHARED_SECRET` is also supported, with optional `VITE_OPENCLAW_GATEWAY_SHARED_SECRET_KIND=password` when the secret should be sent as `auth.password` instead of `auth.token`.
- If a shared secret is configured, Agent Office prefers it for connect auth and only falls back to an explicit or stored device token when no shared secret is available.

## Why this layer exists
The Gateway owns session and task truth. The dashboard should consume that truth through Gateway RPC/event streams instead of reading local files directly.
