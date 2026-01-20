export type ServerStatus = 'online' | 'offline' | 'unknown'

export interface Server {
  id: string
  name: string
  ip: string
  status: ServerStatus
  provider: string
  price: number
  currency: string
  paymentDate: string
  lastPing?: number
  lastPaidMonth?: string  // "2026-01"
}

export interface Folder {
  id: string
  name: string
  color: string
  servers: Server[]
}

export interface Payment {
  id: string
  serverId: string
  serverName: string
  amount: number
  currency: string
  amountRub: number
  exchangeRate: number
  paidAt: string
  paymentMonth: string
}

export interface PaymentSummary {
  totalRub: number
  byCurrency: Record<string, number>
  byCurrencyRub: Record<string, number>
  paymentsCount: number
  month: string
}

export interface ExchangeRates {
  rates: Record<string, number>
  updatedAt: string | null
}

export type SortBy = 'position' | 'payment_urgency'

// Metrics types
export interface ServerMetrics {
  cpuPercent: number
  memoryPercent: number
  memoryUsedMb: number
  memoryTotalMb: number
  diskPercent: number
  diskUsedGb: number
  diskTotalGb: number
  uptimeSeconds: number
  loadAvg1: number | null
  loadAvg5: number | null
  loadAvg15: number | null
  collectedAt: string
}

export interface MetricsHistory {
  serverId: number
  serverName: string
  current: ServerMetrics | null
  history: ServerMetrics[]
  avgCpu12h: number | null
  avgMemory12h: number | null
}

export interface AgentToken {
  agentToken: string
  serverId: number
  serverName: string
}

export interface CurrentMetrics {
  cpuPercent: number
  memoryPercent: number
  memoryUsedMb: number
  memoryTotalMb: number
  diskPercent: number
  collectedAt: string
}

export type AllMetrics = Record<string, CurrentMetrics>
