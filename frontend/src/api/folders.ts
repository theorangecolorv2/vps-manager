/**
 * Folders API
 */
import { apiRequest } from './client'
import type { Folder, SortBy } from '../types'

// API response types (match backend schemas)
interface FolderResponse {
  id: number
  name: string
  color: string
  position: number
  servers: ServerResponse[]
}

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
  last_paid_month: string | null
}

// Transform API response to frontend types
function transformFolder(f: FolderResponse): Folder {
  return {
    id: String(f.id),
    name: f.name,
    color: f.color,
    servers: f.servers.map(s => ({
      id: String(s.id),
      name: s.name,
      ip: s.ip,
      status: s.status,
      provider: s.provider,
      price: s.price,
      currency: s.currency,
      paymentDate: s.payment_date,
      lastPing: s.last_ping ?? undefined,
      lastPaidMonth: s.last_paid_month ?? undefined,
    })),
  }
}

export async function getFolders(sortBy: SortBy = 'position'): Promise<Folder[]> {
  const response = await apiRequest<FolderResponse[]>(`/folders?sort_by=${sortBy}`)
  return response.map(transformFolder)
}

export async function createFolder(data: {
  name: string
  color: string
}): Promise<Folder> {
  const response = await apiRequest<FolderResponse>('/folders', {
    method: 'POST',
    body: data,
  })
  return transformFolder(response)
}

export async function updateFolder(
  id: string,
  data: { name?: string; color?: string; position?: number }
): Promise<Folder> {
  const response = await apiRequest<FolderResponse>(`/folders/${id}`, {
    method: 'PUT',
    body: data,
  })
  return transformFolder(response)
}

export async function deleteFolder(id: string): Promise<void> {
  await apiRequest(`/folders/${id}`, { method: 'DELETE' })
}

export async function reorderFolders(folderIds: string[]): Promise<void> {
  await apiRequest('/folders/reorder', {
    method: 'POST',
    body: folderIds.map(id => parseInt(id)),
  })
}
