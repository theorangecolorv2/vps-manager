import type { PaymentSummary, ExchangeRates, Payment } from '../types'

interface PaymentSidebarProps {
  summary: PaymentSummary | null
  exchangeRates: ExchangeRates | null
  recentPayments: Payment[]
  onClose: () => void
}

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-')
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  return `${months[parseInt(month) - 1]} ${year}`
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  const date = new Date(dateStr)
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

export function PaymentSidebar({
  summary,
  exchangeRates,
  recentPayments,
  onClose,
}: PaymentSidebarProps) {
  const currentMonth = new Date().toISOString().slice(0, 7)

  return (
    <div className="w-80 bg-dark-800 border-l border-dark-500 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-dark-500">
        <h2 className="font-semibold text-white">Payments</h2>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-dark-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Monthly Summary */}
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-3">
            {formatMonth(summary?.month ?? currentMonth)}
          </h3>

          {summary ? (
            <div className="bg-dark-700 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Total spent:</span>
                <span className="text-xl font-bold text-green-400">
                  {summary.totalRub.toLocaleString()} RUB
                </span>
              </div>

              <div className="border-t border-dark-500 pt-3 space-y-2">
                {Object.entries(summary.byCurrency).map(([currency, amount]) => (
                  amount > 0 && (
                    <div key={currency} className="flex justify-between text-sm">
                      <span className="text-gray-400">{currency}:</span>
                      <span className="text-gray-300">
                        {amount.toFixed(2)} ({summary.byCurrencyRub[currency]?.toLocaleString() ?? 0} RUB)
                      </span>
                    </div>
                  )
                ))}
              </div>

              <div className="text-sm text-gray-500">
                {summary.paymentsCount} payment{summary.paymentsCount !== 1 ? 's' : ''}
              </div>
            </div>
          ) : (
            <div className="bg-dark-700 rounded-lg p-4 text-gray-500 text-center">
              No payments yet
            </div>
          )}
        </div>

        {/* Exchange Rates */}
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-3">Exchange Rates</h3>
          <div className="bg-dark-700 rounded-lg p-4 space-y-2">
            {exchangeRates ? (
              <>
                {Object.entries(exchangeRates.rates)
                  .filter(([currency]) => currency !== 'RUB')
                  .map(([currency, rate]) => (
                    <div key={currency} className="flex justify-between text-sm">
                      <span className="text-gray-400">1 {currency} =</span>
                      <span className="font-mono text-gray-300">{rate.toFixed(2)} RUB</span>
                    </div>
                  ))}
                <div className="text-xs text-gray-500 pt-2 border-t border-dark-500">
                  Updated: {formatTime(exchangeRates.updatedAt)}
                </div>
              </>
            ) : (
              <div className="text-gray-500 text-center">Loading...</div>
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-3">Recent Payments</h3>
          {recentPayments.length > 0 ? (
            <div className="space-y-2">
              {recentPayments.slice(0, 10).map(payment => (
                <div
                  key={payment.id}
                  className="bg-dark-700 rounded-lg p-3 flex justify-between items-center"
                >
                  <div>
                    <div className="text-sm font-medium text-white">{payment.serverName}</div>
                    <div className="text-xs text-gray-500">{formatDate(payment.paidAt)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono text-gray-300">
                      {payment.amount} {payment.currency}
                    </div>
                    {payment.currency !== 'RUB' && (
                      <div className="text-xs text-gray-500">
                        {payment.amountRub.toFixed(0)} RUB
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-dark-700 rounded-lg p-4 text-gray-500 text-center">
              No payments recorded
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
