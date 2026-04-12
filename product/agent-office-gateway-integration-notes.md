# Agent Office Gateway Integration Notes

## What we confirmed
- The correct live-data path is Gateway WebSocket / RPC, not local file reads.
- OpenClaw browser/operator clients rely on a challenge-based device-auth connect flow.
- The installed OpenClaw docs and dist verify these browser/operator connect details:
  - server sends `connect.challenge` first
  - client sends `connect` with `minProtocol: 3` and `maxProtocol: 3`
  - shared-secret auth uses `connect.params.auth.token` or `connect.params.auth.password`
  - successful connects may return `hello-ok.auth.deviceToken`, which clients should persist
  - reconnect precedence is shared token/password first, then explicit device token, then stored device token, then bootstrap token
  - canonical v3 signer payload from installed dist is:
    - `v3|deviceId|clientId|clientMode|role|scopesCsv|signedAtMs|token|nonce|platform|deviceFamily`
  - `platform` and `deviceFamily` are normalized as trimmed lowercase ASCII before signing
  - the connect schema expects `client.id` to be one of the built-in ids, and `gateway-client` with `client.mode: "ui"` is a safe fit for Agent Office
- Useful runtime surfaces for a first read-only office snapshot are:
  - `system-presence`
  - `sessions.list`
  - later: `sessions.preview`, `sessions.get`, `sessions.subscribe`, `sessions.messages.subscribe`
  - events: `sessions.changed`, `session.message`, `presence`, `chat`

## Important constraint
A browser-side Agent Office client cannot safely or correctly skip device identity.
It must support:
- challenge receipt from `connect.challenge`
- device keypair handling
- challenge signing
- authenticated `connect`
- persistence of issued device token for reconnects

Remaining uncertainty:
- The installed package verifies the v3 signer shape, but it does not fully document the office-relevant session row payload returned by `sessions.list`.
- That means the current Agent Office read-only snapshot mapping is intentionally conservative and heuristic, even though the auth handshake itself is now grounded in shipped OpenClaw code.

## Why this matters
Without implementing the real auth flow, Gateway mode can only remain a placeholder transport.
A fake connect shape would create misleading progress and likely fail against a real Gateway.

## Recommended next implementation steps
1. Verify Agent Office against a live Gateway to confirm whether signing should bind the shared-secret token, the device token, or whichever auth credential is actually sent for each reconnect path.
2. Keep sending shared-secret auth plus cached device token together for bounded token-drift recovery when appropriate.
3. Continue using `operator.read` only and refine the current `system-presence` + `sessions.list` snapshot mapping.
4. Add `sessions.preview` or `sessions.get` only for the small number of visible worker sessions.
5. Subscribe to `sessions.changed` and `session.message` for live updates.
6. Replace heuristic worker detection with a verified session-label or metadata contract once that shape is confirmed.

## UI recommendation during transition
- Keep `Mock mode` as the default.
- Label `Gateway mode` clearly as integration-in-progress until authenticated connect works.
- Avoid pretending live state is connected before the protocol/auth layer is real.
