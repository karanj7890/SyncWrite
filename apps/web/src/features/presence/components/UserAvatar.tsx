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

  const sizeClass = size === 'sm' ? 'h-7 w-7 text-xs' : 'h-9 w-9 text-sm'

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center text-white font-medium ring-2 ring-white flex-shrink-0`}
      style={{ backgroundColor: color }}
      title={name}
    >
      {initials}
    </div>
  )
}
