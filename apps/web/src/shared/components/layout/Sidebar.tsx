import { FileText, Star, Trash2, Feather, LogOut } from 'lucide-react'
import { cn } from '../../utils/cn'
import { useAppStore } from '../../../store/useAppStore'
import { useLogout } from '../../../features/auth/hooks/useAuth'

interface SidebarProps {
  activeSection: 'all' | 'starred' | 'trash'
  onSectionChange: (section: 'all' | 'starred' | 'trash') => void
  className?: string
}

const navItems = [
  { id: 'all', label: 'All Documents', icon: FileText },
  { id: 'starred', label: 'Starred', icon: Star },
  { id: 'trash', label: 'Trash', icon: Trash2 },
] as const

export function Sidebar({ activeSection, onSectionChange, className }: SidebarProps) {
  const user = useAppStore((s) => s.user)
  const logout = useLogout()

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <aside
      className={cn(
        'w-64 bg-slate-50 border-r border-slate-200 flex flex-col h-full',
        className,
      )}
    >
      <div className="p-6">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-xl mb-8">
          <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
            <Feather className="h-5 w-5" />
          </div>
          <span>SyncWrite</span>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = activeSection === item.id
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )}
              >
                <Icon
                  className={cn('h-4 w-4', isActive ? 'text-indigo-600' : 'text-slate-400')}
                />
                {item.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* User info + logout */}
      <div className="mt-auto p-4 border-t border-slate-200">
        <div className="flex items-center gap-3">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="h-8 w-8 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-semibold flex-shrink-0">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
