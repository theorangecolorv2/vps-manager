import { useState, useEffect } from 'react'
import { Modal } from './Modal'
import { getServerMetrics, generateAgentToken, getAgentToken } from '../api'
import type { Server, MetricsHistory, AgentToken } from '../types'

interface MetricsModalProps {
  isOpen: boolean
  onClose: () => void
  server: Server | null
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

function formatBytes(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`
  return `${mb} MB`
}

function getColorForPercent(percent: number): string {
  if (percent < 50) return 'text-green-400'
  if (percent < 80) return 'text-yellow-400'
  return 'text-red-400'
}

function ProgressBar({ percent, color }: { percent: number; color: string }) {
  return (
    <div className="w-full h-2 bg-dark-600 rounded-full overflow-hidden">
      <div
        className={`h-full ${color} transition-all duration-300`}
        style={{ width: `${Math.min(percent, 100)}%` }}
      />
    </div>
  )
}

export function MetricsModal({ isOpen, onClose, server }: MetricsModalProps) {
  const [metrics, setMetrics] = useState<MetricsHistory | null>(null)
  const [token, setToken] = useState<AgentToken | null>(null)
  const [loading, setLoading] = useState(false)
  const [tokenLoading, setTokenLoading] = useState(false)
  const [error, setError] = useState('')
  const [showInstall, setShowInstall] = useState(false)
  const [copied, setCopied] = useState(false)

  // Fetch metrics when modal opens
  useEffect(() => {
    if (isOpen && server) {
      setLoading(true)
      setError('')
      Promise.all([
        getServerMetrics(server.id).catch(() => null),
        getAgentToken(server.id).catch(() => null),
      ]).then(([m, t]) => {
        setMetrics(m)
        setToken(t)
        setShowInstall(!m?.current)
      }).finally(() => setLoading(false))
    } else {
      setMetrics(null)
      setToken(null)
      setShowInstall(false)
    }
  }, [isOpen, server])

  const handleGenerateToken = async () => {
    if (!server) return
    setTokenLoading(true)
    try {
      const newToken = await generateAgentToken(server.id)
      setToken(newToken)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate token')
    } finally {
      setTokenLoading(false)
    }
  }

  const getInstallCommand = () => {
    if (!token) return ''
    const apiUrl = window.location.origin
    return `docker run -d --name vps-agent --restart=always --network=host \\
  -e API_URL="${apiUrl}" \\
  -e AGENT_TOKEN="${token.agentToken}" \\
  -e INTERVAL="60" \\
  python:3.11-alpine sh -c "pip install -q psutil requests && python -c '
import os,sys,time,signal
import psutil,requests
API=os.environ[\"API_URL\"];TK=os.environ[\"AGENT_TOKEN\"];INT=60
running=True
def stop(s,f):global running;running=False
signal.signal(signal.SIGTERM,stop);signal.signal(signal.SIGINT,stop)
while running:
 try:
  cpu=psutil.cpu_percent(1);mem=psutil.virtual_memory();disk=psutil.disk_usage(\"/\")
  up=int(time.time()-psutil.boot_time());load=(None,None,None)
  try:load=os.getloadavg()
  except:pass
  requests.post(f\"{API}/api/metrics/submit\",json={\"cpu_percent\":cpu,\"memory_percent\":mem.percent,\"memory_used_mb\":mem.used//(1024*1024),\"memory_total_mb\":mem.total//(1024*1024),\"disk_percent\":disk.percent,\"disk_used_gb\":round(disk.used/(1024**3),2),\"disk_total_gb\":round(disk.total/(1024**3),2),\"uptime_seconds\":up,\"load_avg_1\":round(load[0],2) if load[0] else None,\"load_avg_5\":round(load[1],2) if load[1] else None,\"load_avg_15\":round(load[2],2) if load[2] else None},headers={\"X-Agent-Token\":TK},timeout=10)
 except:pass
 for _ in range(INT):
  if not running:break
  time.sleep(1)
'"`
  }

  const copyCommand = () => {
    navigator.clipboard.writeText(getInstallCommand())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!server) return null

  const m = metrics?.current

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Metrics: ${server.name}`}>
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading...</div>
        ) : error ? (
          <div className="text-red-400 text-sm">{error}</div>
        ) : m ? (
          <>
            {/* Current metrics */}
            <div className="grid grid-cols-2 gap-4">
              {/* CPU */}
              <div className="bg-dark-600 rounded-lg p-3">
                <div className="text-xs text-gray-500 uppercase mb-1">CPU</div>
                <div className={`text-2xl font-bold ${getColorForPercent(m.cpuPercent)}`}>
                  {m.cpuPercent.toFixed(1)}%
                </div>
                <ProgressBar
                  percent={m.cpuPercent}
                  color={m.cpuPercent < 50 ? 'bg-green-500' : m.cpuPercent < 80 ? 'bg-yellow-500' : 'bg-red-500'}
                />
                {m.loadAvg1 !== null && (
                  <div className="text-xs text-gray-500 mt-1">
                    Load: {m.loadAvg1} / {m.loadAvg5} / {m.loadAvg15}
                  </div>
                )}
              </div>

              {/* RAM */}
              <div className="bg-dark-600 rounded-lg p-3">
                <div className="text-xs text-gray-500 uppercase mb-1">RAM</div>
                <div className={`text-2xl font-bold ${getColorForPercent(m.memoryPercent)}`}>
                  {m.memoryPercent.toFixed(1)}%
                </div>
                <ProgressBar
                  percent={m.memoryPercent}
                  color={m.memoryPercent < 50 ? 'bg-green-500' : m.memoryPercent < 80 ? 'bg-yellow-500' : 'bg-red-500'}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {formatBytes(m.memoryUsedMb)} / {formatBytes(m.memoryTotalMb)}
                </div>
              </div>

              {/* Disk */}
              <div className="bg-dark-600 rounded-lg p-3">
                <div className="text-xs text-gray-500 uppercase mb-1">Disk</div>
                <div className={`text-2xl font-bold ${getColorForPercent(m.diskPercent)}`}>
                  {m.diskPercent.toFixed(1)}%
                </div>
                <ProgressBar
                  percent={m.diskPercent}
                  color={m.diskPercent < 50 ? 'bg-green-500' : m.diskPercent < 80 ? 'bg-yellow-500' : 'bg-red-500'}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {m.diskUsedGb} GB / {m.diskTotalGb} GB
                </div>
              </div>

              {/* Uptime */}
              <div className="bg-dark-600 rounded-lg p-3">
                <div className="text-xs text-gray-500 uppercase mb-1">Uptime</div>
                <div className="text-2xl font-bold text-blue-400">
                  {formatUptime(m.uptimeSeconds)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Last update: {new Date(m.collectedAt).toLocaleTimeString()}
                </div>
              </div>
            </div>

            {/* Averages */}
            {(metrics?.avgCpu12h !== null || metrics?.avgMemory12h !== null) && (
              <div className="bg-dark-600 rounded-lg p-3">
                <div className="text-xs text-gray-500 uppercase mb-2">12h Average</div>
                <div className="flex gap-4">
                  {metrics?.avgCpu12h !== null && (
                    <div>
                      <span className="text-gray-400">CPU:</span>{' '}
                      <span className={getColorForPercent(metrics.avgCpu12h)}>
                        {metrics.avgCpu12h.toFixed(1)}%
                      </span>
                    </div>
                  )}
                  {metrics?.avgMemory12h !== null && (
                    <div>
                      <span className="text-gray-400">RAM:</span>{' '}
                      <span className={getColorForPercent(metrics.avgMemory12h)}>
                        {metrics.avgMemory12h.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={() => setShowInstall(!showInstall)}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              {showInstall ? 'Hide' : 'Show'} agent setup
            </button>
          </>
        ) : (
          <div className="text-center py-4 text-gray-400">
            <p className="mb-2">No metrics data yet</p>
            <p className="text-sm">Install the agent on this server to collect metrics</p>
          </div>
        )}

        {/* Agent setup */}
        {showInstall && (
          <div className="border-t border-dark-500 pt-4 space-y-3">
            <h4 className="font-semibold">Agent Setup</h4>

            {!token ? (
              <button
                onClick={handleGenerateToken}
                disabled={tokenLoading}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 rounded-lg transition-colors"
              >
                {tokenLoading ? 'Generating...' : 'Generate Agent Token'}
              </button>
            ) : (
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Token</div>
                  <code className="block text-xs bg-dark-600 p-2 rounded break-all">
                    {token.agentToken}
                  </code>
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-1">
                    Run on your server:
                  </div>
                  <div className="relative">
                    <pre className="text-xs bg-dark-600 p-2 rounded overflow-x-auto max-h-32">
                      {getInstallCommand()}
                    </pre>
                    <button
                      onClick={copyCommand}
                      className="absolute top-1 right-1 px-2 py-1 text-xs bg-dark-500 hover:bg-dark-400 rounded"
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleGenerateToken}
                  disabled={tokenLoading}
                  className="text-sm text-yellow-400 hover:text-yellow-300"
                >
                  Regenerate token
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}
