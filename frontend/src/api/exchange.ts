/**
 * Exchange rates API
 */
import { apiRequest } from './client'
import type { ExchangeRates } from '../types'

interface ExchangeRatesResponse {
  rates: Record<string, number>
  updated_at: string | null
}

function transformRates(r: ExchangeRatesResponse): ExchangeRates {
  return {
    rates: r.rates,
    updatedAt: r.updated_at,
  }
}

export async function getExchangeRates(): Promise<ExchangeRates> {
  const response = await apiRequest<ExchangeRatesResponse>('/exchange/rates')
  return transformRates(response)
}

export async function refreshExchangeRates(): Promise<ExchangeRates> {
  const response = await apiRequest<ExchangeRatesResponse>('/exchange/rates/refresh', {
    method: 'POST',
  })
  return transformRates(response)
}
