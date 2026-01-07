import { useState, useEffect } from 'react'
import { Modal } from './Modal'
import { updateServer } from '../api'
import type { Server, Folder } from '../types'

interface EditServerModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  server: Server | null
  folders: Folder[]
}

export function EditServerModal({ isOpen, onClose, onSuccess, server, folders }: EditServerModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [ip, setIp] = useState('')
  const [provider, setProvider] = useState('')
  const [price, setPrice] = useState('')
  const [currency, setCurrency] = useState('EUR')
  const [paymentDate, setPaymentDate] = useState('')
  const [folderId, setFolderId] = useState('')

  // Populate form when server changes
  useEffect(() => {
    if (server) {
      setName(server.name)
      setIp(server.ip)
      setProvider(server.provider || '')
      setPrice(server.price > 0 ? String(server.price) : '')
      setCurrency(server.currency || 'EUR')
      setPaymentDate(server.paymentDate !== '-' ? server.paymentDate : '')
      // Find folder containing this server
      const folder = folders.find(f => f.servers.some(s => s.id === server.id))
      setFolderId(folder?.id || '')
    }
  }, [server, folders])

  const handleClose = () => {
    setError('')
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!server) return

    setError('')
    setLoading(true)

    try {
      await updateServer(server.id, {
        name,
        ip,
        provider: provider || undefined,
        price: price ? parseFloat(price) : 0,
        currency: currency || 'EUR',
        payment_date: paymentDate || '-',
        folder_id: folderId ? parseInt(folderId) : undefined,
      })
      handleClose()
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update server')
    } finally {
      setLoading(false)
    }
  }

  if (!server) return null

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit Server">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2 bg-[#1a1a1a] rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">IP Address</label>
          <input
            type="text"
            value={ip}
            onChange={e => setIp(e.target.value)}
            className="w-full px-3 py-2 bg-[#1a1a1a] rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Provider</label>
          <input
            type="text"
            value={provider}
            onChange={e => setProvider(e.target.value)}
            className="w-full px-3 py-2 bg-[#1a1a1a] rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-1">Price/month</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={e => setPrice(e.target.value)}
              className="w-full px-3 py-2 bg-[#1a1a1a] rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="w-24">
            <label className="block text-sm text-gray-400 mb-1">Currency</label>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="w-full px-3 py-2 bg-[#1a1a1a] rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="RUB">RUB</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Payment Day</label>
          <input
            type="text"
            value={paymentDate}
            onChange={e => setPaymentDate(e.target.value)}
            className="w-full px-3 py-2 bg-[#1a1a1a] rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
            placeholder="15"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Folder</label>
          <select
            value={folderId}
            onChange={e => setFolderId(e.target.value)}
            className="w-full px-3 py-2 bg-[#1a1a1a] rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
          >
            {folders.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>

        {error && <div className="text-red-400 text-sm">{error}</div>}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 rounded-lg transition-colors"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
