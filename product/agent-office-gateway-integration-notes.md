# Agent Office Gateway Integration Notes

## What we confirmed
- The correct live-data path is Gateway WebSocket / RPC, not local file reads.
- OpenClaw browser/operator clients rely on a challenge-based device-auth connect flow.
- The installed OpenClaw docs verify these browser/operator connect details:
  - server sends `connect.challenge` first
  - client sends `connect` with `minProtocol: 3` and `maxProtocol: 3`
  - shared-secret auth uses `connect.params.auth.token` or `connect.params.auth.password`
  - successful connects may return `hello-ok.auth.deviceToken`, which clients should persist
  - reconnect precedence is shared token/password first, then explicit device token, then stored device token, then bootstrap token
- Useful runtime surfaces most likely needed for a read-only office snapshot are:
  - `sessions.list`
  - `sessions.preview`
  - `sessions.get`
  - `system-presence`
  - `sessions.subscribe`
  - `sessions.messages.subscribe`
  - events: `sessions.changed`, `session.message`, `presence`, `chat`

## Important constraint
A browser-side Agent Office client cannot safely or correctly skip device identity.
It must eventually support:
- challenge receipt from `connect.challenge`
- device keypair handling
- challenge signing
- authenticated `connect`
- persistence of issued device token for reconnects

Remaining uncertainty:
- The docs now describe a preferred signature payload `v3` that binds extra fields such as `platform` and `deviceFamily`.
- I could not recover the exact canonical v3 payload shape from the installed package with enough confidence to safely hard-code it here.
- That means the current Agent Office signer is still a conservative scaffold, not a proven production handshake.

## Why this matters
Without implementing the real auth flow, Gateway mode can only remain a placeholder transport.
A fake connect shape would create misleading progress and likely fail against a real Gateway.

## Recommended next implementation steps
1. Verify the exact preferred v3 signed payload against a live Gateway or the upstream source tree.
2. Keep sending shared-secret auth plus cached device token together for bounded token-drift recovery when appropriate.
3. Start with `operator.read` only and fetch a minimal runtime snapshot from `sessions.list` plus `system-presence`.
4. Add `sessions.preview` or `sessions.get` only for the small number of visible worker sessions.
5. Subscribe to `sessions.changed` and `session.message` for live updates.
6. Map that snapshot into `main`, `vision`, and `logic` worker states.

## UI recommendation during transition
- Keep `Mock mode` as the default.
- Label `Gateway mode` clearly as integration-in-progress until authenticated connect works.
- Avoid pretending live state is connected before the protocol/auth layer is real.
