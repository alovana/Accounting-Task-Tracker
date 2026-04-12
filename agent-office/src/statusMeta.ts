import type { WorkerStatus } from './types'

export const statusMeta: Record<
  WorkerStatus,
  { label: string; emoji: string; tone: string; description: string }
> = {
  working: { label: 'Working', emoji: '⚙️', tone: 'working', description: 'Actively processing a task' },
  sleeping: { label: 'Sleeping', emoji: '💤', tone: 'sleeping', description: 'Resting with no queued work' },
  idle: { label: 'Idle', emoji: '🪑', tone: 'idle', description: 'Available and ready for assignment' },
  waiting: { label: 'Waiting', emoji: '⏳', tone: 'waiting', description: 'Waiting for another worker or input' },
  blocked: { label: 'Blocked', emoji: '🚧', tone: 'blocked', description: 'Cannot continue until a blocker is cleared' },
  done: { label: 'Done', emoji: '✅', tone: 'done', description: 'Task completed and ready for review' },
}
