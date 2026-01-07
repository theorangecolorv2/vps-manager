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
