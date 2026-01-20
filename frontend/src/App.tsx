import { useState, useEffect, useCallback } from 'react'
import { Header } from './components/Header'
import { FolderSection } from './components/FolderSection'
import { AddServerModal } from './components/AddServerModal'
import { EditServerModal } from './components/EditServerModal'
import { PaymentConfirmModal } from './components/PaymentConfirmModal'
import { PaymentSidebar } from './components/PaymentSidebar'
import { MetricsModal } from './components/MetricsModal'
import { LoginPage } from './pages/LoginPage'
import {
  isAuthenticated,
  getFolders,
  createPayment,
  getPayments,
  getPaymentSummary,
  getExchangeRates,
  getAllCurrentMetrics,
} from './api'
import type { Folder, Server, SortBy, Payment, PaymentSummary, ExchangeRates, AllMetrics } from './types'

export default function App() {
  const [folders, setFolders] = useState<Folder[]>([])
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddServer, setShowAddServer] = useState(false)
  const [editingServer, setEditingServer] = useState<Server | null>(null)

  // Payment state
  const [sortBy, setSortBy] = useState<SortBy>('position')
  const [showSidebar, setShowSidebar] = useState(false)
  const [confirmingPayment, setConfirmingPayment] = useState<Server | null>(null)
  const [metricsServer, setMetricsServer] = useState<Server | null>(null)
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null)
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null)
  const [recentPayments, setRecentPayments] = useState<Payment[]>([])
  const [allMetrics, setAllMetrics] = useState<AllMetrics>({})

  const isLoginPage = window.location.pathname === '/login'

  const loadFolders = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getFolders(sortBy)
      setFolders(data)
      setExpandedFolders(prev => {
        const next = new Set(prev)
        data.forEach(f => {
          if (!prev.has(f.id)) next.add(f.id)
        })
        return next.size === 0 ? new Set(data.map(f => f.id)) : next
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [sortBy])

  const loadPaymentData = useCallback(async () => {
    try {
      const [summary, rates, payments] = await Promise.all([
        getPaymentSummary(),
        getExchangeRates(),
        getPayments({ limit: 10 }),
      ])
      setPaymentSummary(summary)
      setExchangeRates(rates)
      setRecentPayments(payments)
    } catch (err) {
      console.error('Failed to load payment data:', err)
    }
  }, [])

  const loadMetrics = useCallback(async () => {
    try {
      const metrics = await getAllCurrentMetrics()
      setAllMetrics(metrics)
    } catch (err) {
      console.error('Failed to load metrics:', err)
    }
  }, [])

  useEffect(() => {
    if (!isLoginPage && !isAuthenticated()) {
      window.location.href = '/login'
      return
    }
    if (!isLoginPage && isAuthenticated()) {
      loadFolders()
      loadPaymentData()
      loadMetrics()

      // Refresh metrics every 60 seconds
      const metricsInterval = setInterval(loadMetrics, 60000)
      return () => clearInterval(metricsInterval)
    }
  }, [isLoginPage, loadFolders, loadPaymentData, loadMetrics])

  // Reload folders when sortBy changes
  useEffect(() => {
    if (!isLoginPage && isAuthenticated()) {
      loadFolders()
    }
  }, [sortBy, isLoginPage, loadFolders])

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }

  const handlePaymentRequest = (server: Server) => {
    setConfirmingPayment(server)
  }

  const handleConfirmPayment = async () => {
    if (!confirmingPayment) return
    await createPayment(confirmingPayment.id)
    setConfirmingPayment(null)
    // Reload data
    await Promise.all([loadFolders(), loadPaymentData()])
  }

  if (isLoginPage) {
    return <LoginPage onSuccess={() => window.location.href = '/'} />
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">{error}</div>
          <button
            onClick={loadFolders}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          folders={folders}
          onRefresh={() => { loadFolders(); loadPaymentData(); }}
          onAddServer={() => setShowAddServer(true)}
          sortBy={sortBy}
          onSortChange={setSortBy}
          showSidebar={showSidebar}
          onToggleSidebar={() => setShowSidebar(!showSidebar)}
          exchangeRates={exchangeRates}
        />

        <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
          {folders.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <p className="mb-4">No servers yet.</p>
              <button
                onClick={() => setShowAddServer(true)}
                className="px-6 py-3 bg-indigo-500 hover:bg-indigo-400 rounded-lg font-semibold"
              >
                + Add Your First Server
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {folders.map(folder => (
                <FolderSection
                  key={folder.id}
                  folder={folder}
                  isExpanded={expandedFolders.has(folder.id)}
                  onToggle={() => toggleFolder(folder.id)}
                  onRefresh={() => { loadFolders(); loadPaymentData(); loadMetrics(); }}
                  onEditServer={setEditingServer}
                  onPaymentServer={handlePaymentRequest}
                  onMetricsServer={setMetricsServer}
                  allMetrics={allMetrics}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Payment sidebar */}
      {showSidebar && (
        <PaymentSidebar
          summary={paymentSummary}
          exchangeRates={exchangeRates}
          recentPayments={recentPayments}
          onClose={() => setShowSidebar(false)}
        />
      )}

      {/* Modals */}
      <AddServerModal
        isOpen={showAddServer}
        onClose={() => setShowAddServer(false)}
        onSuccess={() => { loadFolders(); loadPaymentData(); }}
        folders={folders}
      />

      <EditServerModal
        isOpen={!!editingServer}
        onClose={() => setEditingServer(null)}
        onSuccess={() => { loadFolders(); loadPaymentData(); }}
        server={editingServer}
        folders={folders}
        onPayment={handlePaymentRequest}
      />

      <PaymentConfirmModal
        isOpen={!!confirmingPayment}
        onClose={() => setConfirmingPayment(null)}
        onConfirm={handleConfirmPayment}
        server={confirmingPayment}
        exchangeRates={exchangeRates}
      />

      <MetricsModal
        isOpen={!!metricsServer}
        onClose={() => setMetricsServer(null)}
        server={metricsServer}
      />
    </div>
  )
}
