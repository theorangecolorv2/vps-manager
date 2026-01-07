import { useState, useEffect } from 'react'
import { Header } from './components/Header'
import { FolderSection } from './components/FolderSection'
import { AddServerModal } from './components/AddServerModal'
import { EditServerModal } from './components/EditServerModal'
import { LoginPage } from './pages/LoginPage'
import { isAuthenticated, getFolders } from './api'
import type { Folder, Server } from './types'

export default function App() {
  const [folders, setFolders] = useState<Folder[]>([])
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddServer, setShowAddServer] = useState(false)
  const [editingServer, setEditingServer] = useState<Server | null>(null)

  const isLoginPage = window.location.pathname === '/login'

  const loadFolders = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getFolders()
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
  }

  useEffect(() => {
    if (!isLoginPage && !isAuthenticated()) {
      window.location.href = '/login'
      return
    }
    if (!isLoginPage && isAuthenticated()) {
      loadFolders()
    }
  }, [isLoginPage])

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
    <div className="min-h-screen flex flex-col">
      <Header
        folders={folders}
        onRefresh={loadFolders}
        onAddServer={() => setShowAddServer(true)}
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
                onRefresh={loadFolders}
                onEditServer={setEditingServer}
              />
            ))}
          </div>
        )}
      </main>

      <AddServerModal
        isOpen={showAddServer}
        onClose={() => setShowAddServer(false)}
        onSuccess={loadFolders}
        folders={folders}
      />

      <EditServerModal
        isOpen={!!editingServer}
        onClose={() => setEditingServer(null)}
        onSuccess={loadFolders}
        server={editingServer}
        folders={folders}
      />
    </div>
  )
}
