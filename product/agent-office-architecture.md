# Agent Office Architecture

## Frontend
- React + TypeScript SPA
- Office scene rendered with normal DOM layout first
- Optional future upgrade to Canvas/Phaser if needed

## Data Model
Each worker should expose:
- id
- label
- role
- model
- status
- taskTitle
- lastCompletedTask
- startedAt
- durationLabel
- energyState

## Worker Status Enum
- idle
- sleeping
- working
- waiting
- blocked
- done

## Data Sources
### MVP
- local mock state in frontend

### Later
- OpenClaw session/task/subagent state
- Optional polling or websocket feed

## Main Interaction Model
- `main` can delegate work to `vision` and `logic`
- Delegation should create a visible event in UI
- Workers update status based on assigned task lifecycle

## UI Regions
- Center: office scene
- Right: event/activity panel
- Bottom or side: selected worker detail panel
