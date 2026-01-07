import { useState } from 'react'
import { Modal } from './Modal'
import { createServer, createFolder, type ServerCreateData } from '../api'
import type { Folder } from '../types'

interface AddServerModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  folders: Folder[]
}

export function AddServerModal({ isOpen, onClose, onSuccess, folders }: AddServerModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [name, setName] = useState('')
  const [ip, setIp] = useState('')
  const [provider, setProvider] = useState('')
  const [price, setPrice] = useState('')
  const [currency, setCurrency] = useState('EUR')
  const [paymentDate, setPaymentDate] = useState('')
  const [folderId, setFolderId] = useState<string>('')
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderColor, setNewFolderColor] = useState('#6b7280')

  const resetForm = () => {
    setName('')
    setIp('')
    setProvider('')
    setPrice('')
    setCurrency('EUR')
    setPaymentDate('')
    setFolderId('')
    setNewFolderName('')
    setError('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let targetFolderId = folderId

      // Create new folder if needed
      if (folderId === 'new' && newFolderName) {
        const newFolder = await createFolder({
          name: newFolderName,
          color: newFolderColor,
        })
        targetFolderId = newFolder.id
      }

      if (!targetFolderId || targetFolderId === 'new') {
        throw new Error('Please select or create a folder')
      }

      const data: ServerCreateData = {
        folder_id: parseInt(targetFolderId),
        name,
        ip,
        provider: provider || undefined,
        price: price ? parseFloat(price) : undefined,
        currency: currency || undefined,
        payment_date: paymentDate || undefined,
      }

      await createServer(data)
      handleClose()
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Server">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Name *</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2 bg-[#1a1a1a] rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
            placeholder="API Server"
            required
          />
        </div>

        {/* IP */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">IP Address *</label>
          <input
            type="text"
            value={ip}
            onChange={e => setIp(e.target.value)}
            className="w-full px-3 py-2 bg-[#1a1a1a] rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
            placeholder="192.168.1.1"
            required
          />
        </div>

        {/* Provider */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Provider</label>
          <input
            type="text"
            value={provider}
            onChange={e => setProvider(e.target.value)}
            className="w-full px-3 py-2 bg-[#1a1a1a] rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
            placeholder="Hetzner, DigitalOcean, etc."
          />
        </div>

        {/* Price + Currency */}
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
              placeholder="10.00"
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

        {/* Payment Date */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Payment Day</label>
          <input
            type="text"
            value={paymentDate}
            onChange={e => setPaymentDate(e.target.value)}
            className="w-full px-3 py-2 bg-[#1a1a1a] rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
            placeholder="15 (day of month)"
          />
        </div>

        {/* Folder */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Folder *</label>
          <select
            value={folderId}
            onChange={e => setFolderId(e.target.value)}
            className="w-full px-3 py-2 bg-[#1a1a1a] rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
            required
          >
            <option value="">Select folder...</option>
            {folders.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
            <option value="new">+ Create new folder</option>
          </select>
        </div>

        {/* New Folder fields */}
        {folderId === 'new' && (
          <div className="space-y-3 p-3 bg-[#1a1a1a] rounded-lg">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Folder Name</label>
              <input
                type="text"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                className="w-full px-3 py-2 bg-[#2d2d2d] rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                placeholder="Production"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Color</label>
              <input
                type="color"
                value={newFolderColor}
                onChange={e => setNewFolderColor(e.target.value)}
                className="w-full h-10 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-red-400 text-sm">{error}</div>
        )}

        {/* Buttons */}
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
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
