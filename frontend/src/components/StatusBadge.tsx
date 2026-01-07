import type { ServerStatus } from '../types'

interface StatusBadgeProps {
  status: ServerStatus
}

const statusStyles: Record<ServerStatus, string> = {
  online: 'bg-green-500/15 text-green-500',
  offline: 'bg-red-500/15 text-red-500',
  unknown: 'bg-yellow-500/15 text-yellow-500',
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full ${statusStyles[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full bg-current ${status === 'online' ? 'animate-pulse' : ''}`} />
      {status}
    </span>
  )
}
