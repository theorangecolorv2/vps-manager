/**
 * Servers API
 */
import { apiRequest } from './client'
import type { Server } from '../types'

interface ServerResponse {
  id: number
  folder_id: number
  name: string
  ip: string
  provider: string
  price: number
  currency: string
  payment_date: string
  status: 'online' | 'offline' | 'unknown'
  last_ping: number | null
  last_check: string | null
}

function transformServer(s: ServerResponse): Server {
  return {
    id: String(s.id),
    name: s.name,
    ip: s.ip,
    status: s.status,
    provider: s.provider,
    price: s.price,
    currency: s.currency,
    paymentDate: s.payment_date,
    lastPing: s.last_ping ?? undefined,
  }
}

export interface ServerCreateData {
  folder_id: number
  name: string
  ip: string
  provider?: string
  price?: number
  currency?: string
  payment_date?: string
}

export interface ServerUpdateData {
  name?: string
  ip?: string
  provider?: string
  price?: number
  currency?: string
  payment_date?: string
  folder_id?: number
}

export async function createServer(data: ServerCreateData): Promise<Server> {
  const response = await apiRequest<ServerResponse>('/servers', {
    method: 'POST',
    body: data,
  })
  return transformServer(response)
}

export async function updateServer(
  id: string,
  data: ServerUpdateData
): Promise<Server> {
  const response = await apiRequest<ServerResponse>(`/servers/${id}`, {
    method: 'PUT',
    body: data,
  })
  return transformServer(response)
}

export async function deleteServer(id: string): Promise<void> {
  await apiRequest(`/servers/${id}`, { method: 'DELETE' })
}
