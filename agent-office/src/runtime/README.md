# Agent Office runtime layer

This folder is the integration bridge between the dashboard UI and live OpenClaw Gateway data.

## Current state
- `gateway.ts` defines the transport contract and a placeholder WebSocket transport.
- `adapters.ts` maps a gateway snapshot into the dashboard's worker and timeline model.
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
- task/background task state
- `system-presence`
- live event subscriptions for session/task changes

## Why this layer exists
The Gateway owns session and task truth. The dashboard should consume that truth through Gateway RPC/event streams instead of reading local files directly.
