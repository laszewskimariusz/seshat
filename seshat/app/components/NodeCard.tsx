import { ServiceTag } from './ServiceTag'

interface Service { id: string; name: string; port: number; protocol: string }
interface Node {
  id: string
  name: string
  type: string
  ip: string
  os?: string | null
  emoji?: string | null
  services: Service[]
}
interface Props {
  node: Node
  statuses: Record<string, { status: string }>
  onEdit: (node: Node) => void
}

const typeBadgeColors: Record<string, string> = {
  VM: 'bg-blue-100 text-blue-700',
  CT: 'bg-purple-100 text-purple-700',
  Docker: 'bg-sky-100 text-sky-700',
  'bare-metal': 'bg-gray-100 text-gray-700',
}

export function NodeCard({ node, statuses, onEdit }: Props) {
  return (
    <div
      className="bg-white border-2 border-gray-200 rounded-lg p-3 cursor-pointer hover:border-black hover:shadow-[2px_2px_0px_#000] transition-all"
      onClick={() => onEdit(node)}
      data-testid={`node-card-${node.id}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{node.emoji || '💻'}</span>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{node.name}</div>
          <div className="text-xs text-gray-500 font-mono">{node.ip}</div>
        </div>
        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${typeBadgeColors[node.type] || 'bg-gray-100 text-gray-700'}`}>
          {node.type}
        </span>
      </div>
      {node.services.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {node.services.map(svc => (
            <ServiceTag
              key={svc.id}
              service={svc}
              status={(statuses[svc.id]?.status as 'online' | 'offline' | 'checking' | 'unknown') || 'unknown'}
            />
          ))}
        </div>
      )}
    </div>
  )
}
