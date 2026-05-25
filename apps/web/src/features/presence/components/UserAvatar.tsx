interface UserAvatarProps {
  name: string
  color: string
  size?: 'sm' | 'md'
}

export function UserAvatar({ name, color, size = 'sm' }: UserAvatarProps) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const sizeClass = size === 'sm' ? 'h-8 w-8 text-[11px]' : 'h-10 w-10 text-sm'

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center text-white font-semibold ring-2 ring-white shadow-sm flex-shrink-0 transition-transform duration-200 hover:-translate-y-0.5`}
      style={{ backgroundColor: color }}
      title={name}
      aria-label={name}
    >
      {initials}
    </div>
  )
}
