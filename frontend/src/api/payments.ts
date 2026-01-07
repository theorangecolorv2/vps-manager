/**
 * Payments API
 */
import { apiRequest } from './client'
import type { Payment, PaymentSummary } from '../types'

// API response types
interface PaymentResponse {
  id: number
  server_id: number
  server_name: string
  amount: number
  currency: string
  amount_rub: number
  exchange_rate: number
  paid_at: string
  payment_month: string
}

interface PaymentSummaryResponse {
  total_rub: number
  by_currency: Record<string, number>
  by_currency_rub: Record<string, number>
  payments_count: number
  month: string
}

function transformPayment(p: PaymentResponse): Payment {
  return {
    id: String(p.id),
    serverId: String(p.server_id),
    serverName: p.server_name,
    amount: p.amount,
    currency: p.currency,
    amountRub: p.amount_rub,
    exchangeRate: p.exchange_rate,
    paidAt: p.paid_at,
    paymentMonth: p.payment_month,
  }
}

function transformSummary(s: PaymentSummaryResponse): PaymentSummary {
  return {
    totalRub: s.total_rub,
    byCurrency: s.by_currency,
    byCurrencyRub: s.by_currency_rub,
    paymentsCount: s.payments_count,
    month: s.month,
  }
}

export async function createPayment(serverId: string): Promise<Payment> {
  const response = await apiRequest<PaymentResponse>(`/payments/${serverId}`, {
    method: 'POST',
  })
  return transformPayment(response)
}

export async function getPayments(options?: {
  month?: string
  serverId?: string
  limit?: number
}): Promise<Payment[]> {
  const params = new URLSearchParams()
  if (options?.month) params.set('month', options.month)
  if (options?.serverId) params.set('server_id', options.serverId)
  if (options?.limit) params.set('limit', String(options.limit))

  const query = params.toString() ? `?${params.toString()}` : ''
  const response = await apiRequest<PaymentResponse[]>(`/payments${query}`)
  return response.map(transformPayment)
}

export async function getPaymentSummary(month?: string): Promise<PaymentSummary> {
  const query = month ? `?month=${month}` : ''
  const response = await apiRequest<PaymentSummaryResponse>(`/payments/summary${query}`)
  return transformSummary(response)
}

export async function deletePayment(paymentId: string): Promise<void> {
  await apiRequest(`/payments/${paymentId}`, { method: 'DELETE' })
}
