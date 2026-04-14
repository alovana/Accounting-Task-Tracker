import { useEffect, useMemo, useState } from 'react'
import { scenarioPresets } from '../mockData'
import type { ScenarioPreset } from '../types'
import { buildScenarioFromGateway } from '../runtime/adapters'
import { createGatewayTransport } from '../runtime/gateway'
import type { RuntimeStatus } from '../runtime/liveState'

type RuntimeMode = 'mock' | 'gateway'

export function useOfficeRuntime(scenarioId: keyof typeof scenarioPresets) {
  const [runtimeMode, setRuntimeMode] = useState<RuntimeMode>('mock')
  const [gatewayScenario, setGatewayScenario] = useState<ScenarioPreset | null>(null)
  const [runtimeStatus, setRuntimeStatus] = useState<RuntimeStatus>({
    connection: 'idle',
    detail: 'Gateway mode is available when a Gateway URL is configured.',
  })

  useEffect(() => {
    let cancelled = false
    let timeoutId: number | null = null
    let unsubscribeFromUpdates: (() => void) | null = null
    const transport = runtimeMode === 'gateway' ? createGatewayTransport() : null

    async function loadGatewaySnapshot() {
      if (runtimeMode !== 'gateway' || !transport || cancelled) {
        return
      }

      setRuntimeStatus((current) => ({
        connection: current.lastUpdatedAt ? current.connection : 'connecting',
        detail: 'Connecting to Gateway and requesting a live operator snapshot...',
        lastUpdatedAt: current.lastUpdatedAt,
      }))

      try {
        await transport.connect()
        unsubscribeFromUpdates = transport.subscribeToUpdates(({ snapshot, runtimeStatus: nextRuntimeStatus }) => {
          if (cancelled) {
            return
          }

          setGatewayScenario(buildScenarioFromGateway(snapshot))
          setRuntimeStatus(nextRuntimeStatus)
        })
        const snapshot = await transport.fetchOfficeSnapshot()

        if (!cancelled) {
          setGatewayScenario(buildScenarioFromGateway(snapshot))
          setRuntimeStatus(
            snapshot
              ? {
                  connection: 'live',
                  detail: 'Reading live Gateway snapshot and mapping sessions into workers.',
                  lastUpdatedAt: Date.now(),
                }
              : {
                  connection: 'fallback',
                  detail: 'Gateway returned no usable office snapshot, showing local fallback scene.',
                  lastUpdatedAt: Date.now(),
                },
          )
        }

      } catch (error) {
        if (!cancelled) {
          console.warn('[Agent Office] Failed to load Gateway snapshot', error)
          setGatewayScenario(buildScenarioFromGateway(null))
          setRuntimeStatus({
            connection: 'error',
            detail: error instanceof Error ? error.message : 'Unknown Gateway connection error',
            lastUpdatedAt: Date.now(),
          })
        }
      } finally {
        if (!cancelled) {
          timeoutId = window.setTimeout(() => {
            void loadGatewaySnapshot()
          }, 30000)
        }
      }
    }

    void loadGatewaySnapshot()

    return () => {
      cancelled = true

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId)
      }

      unsubscribeFromUpdates?.()
      transport?.disconnect()
    }
  }, [runtimeMode])

  const scenario = useMemo(() => {
    if (runtimeMode === 'gateway' && gatewayScenario) {
      return gatewayScenario
    }

    return scenarioPresets[scenarioId]
  }, [gatewayScenario, runtimeMode, scenarioId])

  function handleRuntimeModeChange(nextMode: RuntimeMode) {
    setRuntimeMode(nextMode)

    if (nextMode === 'mock') {
      setGatewayScenario(null)
      setRuntimeStatus({
        connection: 'idle',
        detail: 'Using local mock scenarios, no Gateway calls needed.',
      })
    }
  }

  return {
    runtimeMode,
    setRuntimeMode: handleRuntimeModeChange,
    scenario,
    runtimeStatus,
  }
}
