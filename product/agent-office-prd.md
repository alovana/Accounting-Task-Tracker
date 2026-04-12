# Agent Office PRD

## Vision
Agent Office is a 2D game-style dashboard that visualizes AI workers as a small office team. The `main` agent acts as the manager and delegates work to specialist subagents like `vision` and `logic`.

## Goals
- Show which AI model is active for each worker
- Show live worker state: idle, sleeping, working, waiting, blocked, done
- Make delegation easy to understand visually
- Keep the first version lightweight and fast to build

## MVP Scope
- One 2D office scene
- Three workers: `main`, `vision`, `logic`
- Status-driven character states
- Simple activity log panel
- Worker detail panel with:
  - name
  - role
  - current model
  - current status
  - current task
  - last completed task
  - active duration
- Animated delegation from `main` to worker

## Non-Goals (for MVP)
- Full game mechanics
- Pathfinding or free walking simulation
- Complex multiplayer views
- Asset editor

## Core User Questions
- Which agent is working right now?
- Which model is each agent using?
- Is a worker idle, sleeping, blocked, or busy?
- What task is each worker doing?
- Did `main` delegate work to `vision` or `logic`?

## Suggested Tech Direction
- React + TypeScript + Vite
- Tailwind for layout and styling
- Framer Motion or lightweight CSS animation for character states
- Mock runtime data first, then connect to real OpenClaw session/task state

## MVP Screens
- Main office dashboard
- Worker detail drawer or side panel

## Future Expansion
- More subagents
- More rooms/desks
- Historical timeline / replay
- Sound effects and richer animations
- Task queue visualization
