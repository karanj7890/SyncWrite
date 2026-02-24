export function getDocColor(id: string): string {
  const colors = [
    'bg-blue-100',
    'bg-purple-100',
    'bg-green-100',
    'bg-amber-100',
    'bg-pink-100',
    'bg-rose-100',
  ]
  const index = id.charCodeAt(0) % colors.length
  return colors[index]
}

export function formatTimeAgo(dateInput: string | number): string {
  const timestamp = typeof dateInput === 'string' ? new Date(dateInput).getTime() : dateInput
  const seconds = Math.floor((Date.now() - timestamp) / 1000)

  if (seconds < 60) return 'just now'

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(timestamp))
}

export function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.body.textContent?.trim() || ''
}
