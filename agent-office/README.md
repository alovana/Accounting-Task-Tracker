# Agent Office

2D game-style dashboard for visualizing AI workers and model activity.

## MVP
- main, vision, logic workers
- live-like status visualization
- model badges
- delegation animation
- activity log

## Stack
- React
- TypeScript
- Vite

## Next
Run:

```bash
npm install
npm run dev
```

## Gateway mode
Create `.env.local` from `.env.example` and set:

```bash
VITE_OPENCLAW_GATEWAY_URL=ws://127.0.0.1:18789
# optional, depending on your Gateway auth setup
VITE_OPENCLAW_GATEWAY_TOKEN=replace-me
# or
VITE_OPENCLAW_GATEWAY_PASSWORD=replace-me
```

Current Gateway mode behavior:
- performs real challenge-based device auth
- requests `operator.read`
- reads `system-presence` and `sessions.list`
- subscribes to `sessions.changed`, `session.message`, `presence`, and `chat` when available
- shows lightweight diagnostics in the runtime card:
  - auth mode used
  - whether presence shape was verified
  - whether sessions shape was verified

Recommended verification flow:
1. Start OpenClaw Gateway.
2. Run Agent Office in dev mode.
3. Switch to `Gateway mode`.
4. Confirm the runtime card shows `Gateway live` plus diagnostics like `auth token/device-token`, `presence ok`, and `sessions ok`.
5. Check browser console for discovered Gateway methods/events.
