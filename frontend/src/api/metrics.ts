/**
 * Metrics API functions
 */
import { apiRequest } from './client'
import type { MetricsHistory, AgentToken, AllMetrics } from '../types'

// Convert snake_case to camelCase for metrics
function transformMetrics(data: Record<string, unknown>): MetricsHistory {
  return {
    serverId: data.server_id as number,
    serverName: data.server_name as string,
    current: data.current ? {
      cpuPercent: (data.current as Record<string, unknown>).cpu_percent as number,
      memoryPercent: (data.current as Record<string, unknown>).memory_percent as number,
      memoryUsedMb: (data.current as Record<string, unknown>).memory_used_mb as number,
      memoryTotalMb: (data.current as Record<string, unknown>).memory_total_mb as number,
      diskPercent: (data.current as Record<string, unknown>).disk_percent as number,
      diskUsedGb: (data.current as Record<string, unknown>).disk_used_gb as number,
      diskTotalGb: (data.current as Record<string, unknown>).disk_total_gb as number,
      uptimeSeconds: (data.current as Record<string, unknown>).uptime_seconds as number,
      loadAvg1: (data.current as Record<string, unknown>).load_avg_1 as number | null,
      loadAvg5: (data.current as Record<string, unknown>).load_avg_5 as number | null,
      loadAvg15: (data.current as Record<string, unknown>).load_avg_15 as number | null,
      collectedAt: (data.current as Record<string, unknown>).collected_at as string,
    } : null,
    history: ((data.history as Record<string, unknown>[]) || []).map((m) => ({
      cpuPercent: m.cpu_percent as number,
      memoryPercent: m.memory_percent as number,
      memoryUsedMb: m.memory_used_mb as number,
      memoryTotalMb: m.memory_total_mb as number,
      diskPercent: m.disk_percent as number,
      diskUsedGb: m.disk_used_gb as number,
      diskTotalGb: m.disk_total_gb as number,
      uptimeSeconds: m.uptime_seconds as number,
      loadAvg1: m.load_avg_1 as number | null,
      loadAvg5: m.load_avg_5 as number | null,
      loadAvg15: m.load_avg_15 as number | null,
      collectedAt: m.collected_at as string,
    })),
    avgCpu12h: data.avg_cpu_12h as number | null,
    avgMemory12h: data.avg_memory_12h as number | null,
  }
}

export async function getServerMetrics(serverId: string, hours = 12): Promise<MetricsHistory> {
  const data = await apiRequest<Record<string, unknown>>(`/metrics/${serverId}?hours=${hours}`)
  return transformMetrics(data)
}

export async function generateAgentToken(serverId: string): Promise<AgentToken> {
  const data = await apiRequest<Record<string, unknown>>(`/metrics/${serverId}/token`, {
    method: 'POST',
  })
  return {
    agentToken: data.agent_token as string,
    serverId: data.server_id as number,
    serverName: data.server_name as string,
  }
}

export async function getAgentToken(serverId: string): Promise<AgentToken> {
  const data = await apiRequest<Record<string, unknown>>(`/metrics/${serverId}/token`)
  return {
    agentToken: data.agent_token as string,
    serverId: data.server_id as number,
    serverName: data.server_name as string,
  }
}

export async function revokeAgentToken(serverId: string): Promise<void> {
  await apiRequest(`/metrics/${serverId}/token`, { method: 'DELETE' })
}

export async function getAllCurrentMetrics(): Promise<AllMetrics> {
  const data = await apiRequest<Record<string, Record<string, unknown>>>('/metrics/current/all')
  const result: AllMetrics = {}
  for (const [serverId, m] of Object.entries(data)) {
    result[serverId] = {
      cpuPercent: m.cpu_percent as number,
      memoryPercent: m.memory_percent as number,
      memoryUsedMb: m.memory_used_mb as number,
      memoryTotalMb: m.memory_total_mb as number,
      diskPercent: m.disk_percent as number,
      collectedAt: m.collected_at as string,
    }
  }
  return result
}
