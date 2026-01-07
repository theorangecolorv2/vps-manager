/**
 * Backup API (export/import)
 */
import { apiRequest } from './client'

export interface ServerExport {
  name: string
  ip: string
  provider: string
  price: number
  currency: string
  payment_date: string
}

export interface FolderExport {
  name: string
  color: string
  servers: ServerExport[]
}

export interface ExportData {
  version: string
  exported_at: string
  folders: FolderExport[]
}

export interface ImportData {
  version: string
  folders: FolderExport[]
}

export async function exportData(): Promise<ExportData> {
  return apiRequest<ExportData>('/backup/export')
}

export async function importData(
  data: ImportData,
  replace: boolean = true
): Promise<{ status: string; imported_folders: number; imported_servers: number }> {
  return apiRequest(`/backup/import?replace=${replace}`, {
    method: 'POST',
    body: data,
  })
}

// Helper to download export as file
export async function downloadExport(): Promise<void> {
  const data = await exportData()
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `vps-manager-backup-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Helper to read import file
export function readImportFile(file: File): Promise<ImportData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        resolve(data)
      } catch {
        reject(new Error('Invalid JSON file'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}
