import { scenarioPresets } from '../mockData'
import type { ScenarioPreset, TimelineEvent, Worker } from '../types'
import { durationFromStatus, energyFromStatus } from './liveState'
import type { GatewayOfficeSnapshot } from './gateway'

export function buildScenarioFromGateway(snapshot: GatewayOfficeSnapshot | null): ScenarioPreset {
  const fallback = scenarioPresets.planning

  if (!snapshot) {
    return fallback
  }

  const workers: Worker[] = fallback.workers.map((worker) => {
    const incoming = snapshot.workers?.find((candidate) => candidate.id === worker.id)

    return {
      ...worker,
      model: incoming?.model ?? worker.model,
      status: incoming?.status ?? worker.status,
      task: incoming?.task ?? worker.task,
      queue: incoming?.queue ?? worker.queue,
      energy: energyFromStatus(incoming?.status ?? worker.status),
      duration: durationFromStatus(incoming?.status ?? worker.status, incoming?.lastActiveLabel ?? worker.lastActiveLabel),
      lastActiveLabel: incoming?.lastActiveLabel ?? worker.lastActiveLabel,
      monitoring: incoming?.monitoring ?? { source: 'mock' },
    }
  })

  const timeline: TimelineEvent[] =
    snapshot.timeline?.map((event) => ({
      id: event.id,
      actorId: event.actorId,
      kind: event.kind,
      title: event.title,
      detail: event.detail,
      time: event.time,
      targetId: event.targetId,
      durationLabel: event.durationLabel,
      tags: event.tags,
    })) ?? fallback.timeline

  return {
    label: snapshot.scenarioLabel ?? fallback.label,
    delegation: snapshot.delegation ?? fallback.delegation,
    workers,
    timeline,
    monitoring: snapshot.monitoring ?? { source: 'mock' },
  }
}
