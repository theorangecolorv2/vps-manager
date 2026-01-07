import { useState } from 'react'
import { Modal } from './Modal'
import type { Server, ExchangeRates } from '../types'

interface PaymentConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  server: Server | null
  exchangeRates: ExchangeRates | null
}

export function PaymentConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  server,
  exchangeRates,
}: PaymentConfirmModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!server) return null

  const rate = exchangeRates?.rates[server.currency] ?? 1
  const amountRub = server.price * rate

  const handleConfirm = async () => {
    setLoading(true)
    setError(null)
    try {
      await onConfirm()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record payment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Payment">
      <div className="space-y-4">
        <p className="text-gray-300">
          Mark server <span className="font-semibold text-white">{server.name}</span> as paid for this month?
        </p>

        <div className="bg-dark-700 rounded-lg p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">Amount:</span>
            <span className="font-mono text-white">
              {server.price} {server.currency}
            </span>
          </div>
          {server.currency !== 'RUB' && (
            <div className="flex justify-between">
              <span className="text-gray-400">In RUB:</span>
              <span className="font-mono text-green-400">
                ~{amountRub.toFixed(0)} RUB
              </span>
            </div>
          )}
          {server.currency !== 'RUB' && exchangeRates && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Rate:</span>
              <span className="font-mono text-gray-400">
                1 {server.currency} = {rate.toFixed(2)} RUB
              </span>
            </div>
          )}
        </div>

        {error && (
          <div className="text-red-400 text-sm">{error}</div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-dark-600 hover:bg-dark-500 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? 'Recording...' : 'Confirm Payment'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
