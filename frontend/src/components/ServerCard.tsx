import type { Server } from '../types'
import { StatusBadge } from './StatusBadge'
import { useState } from 'react'
import { deleteServer } from '../api'

interface ServerCardProps {
  server: Server
  onEdit?: (server: Server) => void
  onDelete?: () => void
  onPayment?: (server: Server) => void
}

function isPaidThisMonth(lastPaidMonth?: string): boolean {
  if (!lastPaidMonth) return false
  const currentMonth = new Date().toISOString().slice(0, 7)
  return lastPaidMonth === currentMonth
}

function getPingColor(ping: number): string {
  if (ping < 90) return 'text-green-500'
  if (ping < 200) return 'text-yellow-500'
  return 'text-red-500'
}

export function ServerCard({ server, onEdit, onDelete, onPayment }: ServerCardProps) {
  const [copied, setCopied] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const paidThisMonth = isPaidThisMonth(server.lastPaidMonth)

  const copyIP = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(server.ip)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`Delete server "${server.name}"?`)) return

    setDeleting(true)
    try {
      await deleteServer(server.id)
      onDelete?.()
    } catch (err) {
      alert('Failed to delete: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setDeleting(false)
    }
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(server)
  }

  const handlePayment = (e: React.MouseEvent) => {
    e.stopPropagation()
    onPayment?.(server)
  }

  return (
    <div className="bg-dark-700 rounded-lg p-4 border border-dark-500 hover:border-dark-400 hover:bg-dark-600 transition-all group relative">
      {/* Payment status indicator */}
      {server.price > 0 && (
        <div className={`absolute top-2 left-2 px-2 py-0.5 text-xs rounded-full ${
          paidThisMonth
            ? 'bg-green-500/20 text-green-400'
            : 'bg-red-500/20 text-red-400'
        }`}>
          {paidThisMonth ? 'Paid' : 'Unpaid'}
        </div>
      )}

      {/* Action buttons */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Payment button - show only if has price and not paid this month */}
        {server.price > 0 && !paidThisMonth && (
          <button
            onClick={handlePayment}
            className="p-1.5 rounded bg-dark-500 hover:bg-green-600 transition-colors"
            title="Mark as paid"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
        )}
        <button
          onClick={handleEdit}
          className="p-1.5 rounded bg-dark-500 hover:bg-blue-600 transition-colors"
          title="Edit"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-1.5 rounded bg-dark-500 hover:bg-red-600 transition-colors disabled:opacity-50"
          title="Delete"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-white">{server.name}</h3>
        <StatusBadge status={server.status} />
      </div>

      <div className="font-mono text-sm text-blue-400 mb-3 pb-3 border-b border-dark-500 flex flex-row gap-2">
        <button className='hover:text-white transition-colors' onClick={copyIP}>{server.ip}</button>
        <span className='text-white'>{copied ? '✓' : ''}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wide">Provider</div>
          <div className="text-sm text-gray-300">{server.provider || '—'}</div>
        </div>
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wide">Price</div>
          <div className="text-sm text-gray-300">
            {server.price > 0 ? `${server.price} ${server.currency}` : 'Free'}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wide">Payment</div>
          <div className="text-sm text-gray-300">
            {server.paymentDate !== '-' ? `${server.paymentDate}th` : '—'}
          </div>
        </div>
        {server.lastPing !== undefined && (
          <div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wide">Ping</div>
            <div className={`text-sm font-mono ${getPingColor(server.lastPing)}`}>
              {server.lastPing}ms
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
