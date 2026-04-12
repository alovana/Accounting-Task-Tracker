# Agent Office runtime layer

This folder is the integration bridge between the dashboard UI and live OpenClaw Gateway data.

## Current state
- `protocol.ts` defines the basic Gateway WS envelope shapes.
- `deviceAuth.ts` provides browser-side device identity generation, persistence, and challenge-signing helpers.
- `wsClient.ts` provides a minimal WebSocket client scaffold with request/response, event waiting, and signed operator-connect scaffolding.
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
The current WebSocket client scaffold now includes browser-side device identity persistence plus challenge-signing scaffolding, but it is still not a fully verified live integration.

OpenClaw requires challenge-based device auth during `connect`, so the next integration step is validating the exact signed payload shape against a real Gateway and then wiring live session/task RPC methods.

Until that protocol verification is complete, Gateway mode should still be treated as integration-in-progress rather than fully live-connected.

## Why this layer exists
The Gateway owns session and task truth. The dashboard should consume that truth through Gateway RPC/event streams instead of reading local files directly.
