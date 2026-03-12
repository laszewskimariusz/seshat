import { StatusDot } from './StatusDot'

interface Service { id: string; name: string; port: number; protocol: string }
interface Props { service: Service; status?: 'online' | 'offline' | 'checking' | 'unknown' }

export function ServiceTag({ service, status = 'unknown' }: Props) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 border border-gray-300 rounded-full text-xs font-nunito">
      <StatusDot status={status} />
      <span>{service.name}</span>
      <span className="text-gray-400">:{service.port}</span>
    </span>
  )
}
