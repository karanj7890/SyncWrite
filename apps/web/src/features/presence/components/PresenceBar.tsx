import type { AwarenessUser } from '../hooks/useAwareness'
import { UserAvatar } from './UserAvatar'

interface PresenceBarProps {
  users: AwarenessUser[]
  maxVisible?: number
}

export function PresenceBar({ users, maxVisible = 5 }: PresenceBarProps) {
  const visible = users.slice(0, maxVisible)
  const overflow = users.length - maxVisible
  const allNames = users.map((user) => user.name).join(', ')

  return (
    <div
      className="flex items-center rounded-full border border-slate-200 bg-white/90 px-2 py-1 shadow-sm backdrop-blur-sm max-w-[180px] sm:max-w-none"
      title={allNames}
      aria-label={`${users.length} collaborators online`}
    >
      <div className="flex items-center -space-x-2">
      {visible.map((u) => (
        <UserAvatar key={u.clientId} name={u.name} color={u.color} />
      ))}
      </div>
      {overflow > 0 && (
        <span className="ml-2 inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-slate-100 px-2 text-[11px] font-semibold text-slate-600 ring-2 ring-white">
          +{overflow}
        </span>
      )}
    </div>
  )
}
