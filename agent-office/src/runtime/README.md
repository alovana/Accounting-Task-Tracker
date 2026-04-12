# Agent Office runtime layer

This folder is the integration bridge between the dashboard UI and live OpenClaw Gateway data.

## Current state
- `protocol.ts` defines the basic Gateway WS envelope shapes.
- `wsClient.ts` provides a minimal WebSocket client scaffold with request/response and event waiting.
- `gateway.ts` defines the transport contract and a placeholder WebSocket transport.
- `adapters.ts` maps a gateway snapshot into the dashboard worker and timeline model.
- `useOfficeRuntime` can switch between mock mode and gateway mode.

## Intended live data path
1. Connect to the OpenClaw Gateway WebSocket.
2. Authenticate as an operator client.
3. Read session/task data from Gateway RPC methods and events.
4. Convert them into `GatewayOfficeSnapshot`.
5. Map them into the office scene using `buildScenarioFromGateway`.

## Good candidate Gateway surfaces
- `sessions.list`
- `sessions.get` / `sessions.preview`
- background task state
- `system-presence`
- live event subscriptions for session/task changes

## Important note
The current WebSocket client scaffold is intentionally incomplete for auth. OpenClaw requires challenge-based device auth during `connect`, so the next integration step is implementing a real authenticated operator connect flow that matches the Gateway protocol.

That means the browser app will need device identity management, challenge signing, and device-token reuse. Until that exists, Gateway mode should be treated as integration-in-progress rather than live-connected.

## Why this layer exists
The Gateway owns session and task truth. The dashboard should consume that truth through Gateway RPC/event streams instead of reading local files directly.
