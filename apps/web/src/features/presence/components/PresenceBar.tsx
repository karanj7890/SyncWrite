import type { AwarenessUser } from '../hooks/useAwareness'
import { UserAvatar } from './UserAvatar'

interface PresenceBarProps {
  users: AwarenessUser[]
  maxVisible?: number
}

export function PresenceBar({ users, maxVisible = 5 }: PresenceBarProps) {
  const visible = users.slice(0, maxVisible)
  const overflow = users.length - maxVisible

  return (
    <div className="flex items-center -space-x-1">
      {visible.map((u) => (
        <UserAvatar key={u.clientId} name={u.name} color={u.color} />
      ))}
      {overflow > 0 && (
        <span className="text-xs text-slate-500 pl-2">+{overflow}</span>
      )}
    </div>
  )
}
