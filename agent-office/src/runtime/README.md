# Agent Office runtime layer

This folder is the integration bridge between the dashboard UI and live OpenClaw Gateway data.

## Current state
- `protocol.ts` defines the basic Gateway WS envelope shapes, `hello-ok.snapshot/auth` fields, and auth error hints.
- `deviceAuth.ts` provides browser-side device identity generation, persistence, and the verified v3 signing payload builder.
  - It now matches the installed Gateway device-identity contract by using Ed25519 raw public keys, base64url encoding, sha256-derived device ids, and base64url signatures.
- `wsClient.ts` provides a minimal WebSocket client scaffold with request/response, event waiting, and signed operator-connect scaffolding.
- `gateway.ts` now performs a first real read-only snapshot fetch via `system-presence` plus `sessions.list`, plumbs optional shared-secret auth from Vite env config, exposes transport cleanup so the UI can release sockets on teardown, and can consume passive live Gateway events to update presence immediately, apply conservative session deltas locally when payloads are rich enough, or trigger a serialized snapshot refresh.
- `adapters.ts` maps a gateway snapshot into the dashboard worker and timeline model.
- `useOfficeRuntime` can switch between mock mode and gateway mode.
- gateway polling is serialized with `setTimeout` and reuses one transport per gateway-mode lifecycle, which avoids overlapping refreshes and orphaned WebSocket connections during future live integration work.
- live event handling is still conservative: `presence` updates are applied directly, `sessions.changed` and `session.message` now try a small set of safe delta payload shapes first (`session`, `sessions`, `removed`, `deleted`, or single keyed rows), and `chat` still acts as a refresh hint when no office-specific mapping is safe.
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
- Gateway validates `device.id` as the sha256 hex fingerprint of the normalized raw public key, so UUID-style browser device ids are invalid for real connects
- Gateway expects device public keys and signatures in base64url-compatible form, and its shipped device identity helpers use Ed25519 rather than browser-generated P-256 ids
- `connect` uses protocol `3`
- shared-secret auth uses `connect.params.auth.token` or `connect.params.auth.password`
- successful connects can return `hello-ok.auth.deviceToken`, which should be persisted if non-empty
- successful connects can also include `hello-ok.snapshot.presence`, which Agent Office now treats as safe seed data before the first explicit snapshot refresh completes
- reconnect precedence is shared token/password first, then explicit/stored device token
- Agent Office now follows that precedence conservatively, will retry once with an explicit or stored device token only when a shared-secret connect is rejected with an explicit `canRetryWithDeviceToken` hint, and will not overwrite a cached device token with an empty or missing token on later connects
- the canonical signer payload is `v3|deviceId|clientId|clientMode|role|scopesCsv|signedAtMs|token|nonce|platform|deviceFamily`
- `platform` and `deviceFamily` are normalized as trimmed lowercase ASCII strings before signing
- a valid client id for this style of browser client is `gateway-client`, with `client.mode: "ui"`

Still uncertain:
- the exact `sessions.list` row shape is not fully documented in the installed package, so Agent Office currently uses only conservative fields it could verify in shipped artifacts (`key`, `label`, `model`, `modelProvider`, `spawnedBy`) and treats the read-only office mapping as heuristic.
- the exact acknowledgement payloads for `sessions.subscribe` and `sessions.messages.subscribe` are still treated as opaque. Agent Office only uses them as readiness toggles and does not assume durable subscription state beyond the current socket lifecycle.

Gateway mode is now a safer read-only integration scaffold, but the office-specific session-to-worker mapping is still integration-in-progress rather than a fully productized live view.

## Local config notes
- `VITE_OPENCLAW_GATEWAY_URL` enables Gateway mode.
- `VITE_OPENCLAW_GATEWAY_TOKEN` or `VITE_OPENCLAW_GATEWAY_PASSWORD` explicitly selects shared-secret auth style.
- `VITE_OPENCLAW_GATEWAY_SHARED_SECRET` is also supported, with optional `VITE_OPENCLAW_GATEWAY_SHARED_SECRET_KIND=password` when the secret should be sent as `auth.password` instead of `auth.token`.
- If a shared secret is configured, Agent Office prefers it for connect auth and only falls back to an explicit or stored device token when the Gateway explicitly marks that retry as safe.

## Why this layer exists
The Gateway owns session and task truth. The dashboard should consume that truth through Gateway RPC/event streams instead of reading local files directly.
