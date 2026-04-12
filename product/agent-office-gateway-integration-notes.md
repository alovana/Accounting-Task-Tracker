# Agent Office Gateway Integration Notes

## What we confirmed
- The correct live-data path is Gateway WebSocket / RPC, not local file reads.
- Useful runtime surfaces likely include:
  - `sessions.list`
  - `sessions.get` / `sessions.preview`
  - background task state
  - `system-presence`
  - live subscription events
- OpenClaw browser/operator clients rely on a challenge-based device-auth connect flow.

## Important constraint
A browser-side Agent Office client cannot safely or correctly skip device identity.
It must eventually support:
- challenge receipt from `connect.challenge`
- device keypair handling
- challenge signing
- authenticated `connect`
- likely persistence of issued device token for reconnects

## Why this matters
Without implementing the real auth flow, Gateway mode can only remain a placeholder transport.
A fake connect shape would create misleading progress and likely fail against a real Gateway.

## Recommended next implementation steps
1. Add browser-side device identity management using Web Crypto.
2. Implement challenge signing compatible with the Gateway protocol.
3. Store and reuse device token after successful connect.
4. Start with read-only operator scope and fetch a minimal runtime snapshot.
5. Map that snapshot into `main`, `vision`, and `logic` worker states.

## UI recommendation during transition
- Keep `Mock mode` as the default.
- Label `Gateway mode` clearly as integration-in-progress until authenticated connect works.
- Avoid pretending live state is connected before the protocol/auth layer is real.
