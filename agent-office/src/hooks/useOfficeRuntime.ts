import { useEffect, useMemo, useState } from 'react'
import { scenarioPresets } from '../mockData'
import type { ScenarioPreset } from '../types'
import { buildScenarioFromGateway } from '../runtime/adapters'
import { fetchGatewayOfficeSnapshot } from '../runtime/gateway'

type RuntimeMode = 'mock' | 'gateway'

export function useOfficeRuntime(scenarioId: keyof typeof scenarioPresets) {
  const [runtimeMode, setRuntimeMode] = useState<RuntimeMode>('mock')
  const [gatewayScenario, setGatewayScenario] = useState<ScenarioPreset | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadGatewaySnapshot() {
      if (runtimeMode !== 'gateway') {
        return
      }

      const snapshot = await fetchGatewayOfficeSnapshot()
      if (!cancelled) {
        setGatewayScenario(buildScenarioFromGateway(snapshot))
      }
    }

    void loadGatewaySnapshot()

    return () => {
      cancelled = true
    }
  }, [runtimeMode])

  const scenario = useMemo(() => {
    if (runtimeMode === 'gateway' && gatewayScenario) {
      return gatewayScenario
    }

    return scenarioPresets[scenarioId]
  }, [gatewayScenario, runtimeMode, scenarioId])

  return {
    runtimeMode,
    setRuntimeMode,
    scenario,
  }
}
