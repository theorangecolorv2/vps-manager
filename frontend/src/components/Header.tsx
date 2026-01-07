import { useState, useRef } from 'react'
import type { Folder, SortBy } from '../types'
import { logout, downloadExport, readImportFile, importData } from '../api'

interface HeaderProps {
  folders: Folder[]
  onRefresh?: () => void
  onAddServer?: () => void
  sortBy: SortBy
  onSortChange: (sort: SortBy) => void
  showSidebar: boolean
  onToggleSidebar: () => void
}

export function Header({ folders, onRefresh, onAddServer, sortBy, onSortChange, showSidebar, onToggleSidebar }: HeaderProps) {
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const totalServers = folders.reduce((sum, f) => sum + f.servers.length, 0)
  const onlineServers = folders.reduce(
    (sum, f) => sum + f.servers.filter(s => s.status === 'online').length, 0
  )
  const totalCost = folders.reduce(
    (sum, f) => sum + f.servers.reduce((s, srv) => s + srv.price, 0), 0
  )

  const handleExport = async () => {
    setExporting(true)
    try {
      await downloadExport()
    } catch (err) {
      alert('Export failed: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setExporting(false)
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const confirmed = confirm(
      'This will replace all existing data. Continue?'
    )
    if (!confirmed) {
      e.target.value = ''
      return
    }

    setImporting(true)
    try {
      const data = await readImportFile(file)
      await importData(data, true)
      onRefresh?.()
      alert('Import successful!')
    } catch (err) {
      alert('Import failed: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  return (
    <header className="bg-dark-800 border-b border-dark-500 px-6 py-4 flex items-center justify-between sticky top-0 z-50 backdrop-blur-sm">
      <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent flex items-center gap-2">
        <span className="text-2xl">⚡</span>
        VPS Manager
      </h1>

      <div className="flex gap-10">
        <div className="text-center">
          <div className="text-2xl font-bold">{totalServers}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Servers</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-500">{onlineServers}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Online</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">~{totalCost.toFixed(0)}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">EUR/month</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Sort toggle */}
        <div className="flex rounded-lg overflow-hidden border border-dark-500">
          <button
            onClick={() => onSortChange('position')}
            className={`px-3 py-2 text-sm transition-colors ${
              sortBy === 'position'
                ? 'bg-indigo-600 text-white'
                : 'bg-dark-600 hover:bg-dark-500 text-gray-400'
            }`}
            title="Sort by position"
          >
            Position
          </button>
          <button
            onClick={() => onSortChange('payment_urgency')}
            className={`px-3 py-2 text-sm transition-colors ${
              sortBy === 'payment_urgency'
                ? 'bg-indigo-600 text-white'
                : 'bg-dark-600 hover:bg-dark-500 text-gray-400'
            }`}
            title="Sort by payment urgency"
          >
            Urgency
          </button>
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          className="p-2.5 rounded-lg bg-dark-600 hover:bg-dark-500 transition-colors"
          title="Refresh"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        {/* Export button */}
        <button
          onClick={handleExport}
          disabled={exporting}
          className="p-2.5 rounded-lg bg-dark-600 hover:bg-dark-500 transition-colors disabled:opacity-50"
          title="Export JSON"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>

        {/* Import button */}
        <button
          onClick={handleImportClick}
          disabled={importing}
          className="p-2.5 rounded-lg bg-dark-600 hover:bg-dark-500 transition-colors disabled:opacity-50"
          title="Import JSON"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Add server button */}
        <button
          onClick={onAddServer}
          className="bg-indigo-500 hover:bg-indigo-400 text-white px-5 py-2.5 rounded-lg font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/30"
        >
          + Add Server
        </button>

        {/* Logout button */}
        <button
          onClick={logout}
          className="p-2.5 rounded-lg bg-dark-600 hover:bg-red-600 transition-colors"
          title="Logout"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>

        {/* Toggle sidebar button */}
        <button
          onClick={onToggleSidebar}
          className={`p-2.5 rounded-lg transition-colors ${
            showSidebar ? 'bg-indigo-600 text-white' : 'bg-dark-600 hover:bg-dark-500'
          }`}
          title={showSidebar ? 'Hide payments' : 'Show payments'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
    </header>
  )
}
