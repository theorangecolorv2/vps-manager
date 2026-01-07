import type { Folder, Server } from '../types'
import { ServerCard } from './ServerCard'

interface FolderSectionProps {
  folder: Folder
  isExpanded: boolean
  onToggle: () => void
  onRefresh?: () => void
  onEditServer?: (server: Server) => void
}

export function FolderSection({ folder, isExpanded, onToggle, onRefresh, onEditServer }: FolderSectionProps) {
  const onlineCount = folder.servers.filter(s => s.status === 'online').length
  const totalCost = folder.servers.reduce((sum, s) => sum + s.price, 0)

  return (
    <div className="bg-dark-800 rounded-xl border border-dark-500 overflow-hidden">
      <div
        className="p-4 flex justify-between items-center cursor-pointer hover:bg-dark-700 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl" style={{ color: folder.color }}>
            {isExpanded ? '📂' : '📁'}
          </span>
          <h2 className="text-lg font-semibold">{folder.name}</h2>
          <span className="text-sm text-gray-500 bg-dark-700 px-3 py-0.5 rounded-full">
            {folder.servers.length} servers
          </span>
        </div>

        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2 text-sm text-gray-400">
            <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px] shadow-green-500" />
            {onlineCount}/{folder.servers.length}
          </span>
          <span className="text-sm text-gray-500 font-mono">
            ~{totalCost.toFixed(0)} EUR/mo
          </span>
          <span className={`text-2xl text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
            ›
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 animate-slideDown">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {folder.servers.map(server => (
              <ServerCard
                key={server.id}
                server={server}
                onEdit={onEditServer}
                onDelete={onRefresh}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
