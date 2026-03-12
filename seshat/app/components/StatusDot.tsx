interface Props { status: 'online' | 'offline' | 'checking' | 'unknown'; size?: 'sm' | 'md' }

export function StatusDot({ status, size = 'sm' }: Props) {
  const s = size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'
  const colors = {
    online: 'bg-green-500 animate-pulse',
    offline: 'bg-red-500',
    checking: 'bg-yellow-400 animate-ping',
    unknown: 'bg-gray-400',
  }
  return (
    <span
      className={`inline-block rounded-full ${s} ${colors[status]}`}
      data-testid={`status-dot-${status}`}
    />
  )
}
