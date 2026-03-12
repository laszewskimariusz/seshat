import { NodeCard } from './NodeCard'

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
interface Cluster {
  id: string
  name: string
  type: string
  color: string
  emoji: string
  cidr?: string | null
  posX: number
  posY: number
  nodes: Node[]
}
interface Props {
  cluster: Cluster
  statuses: Record<string, { status: string }>
  onEditNode: (node: Node) => void
  onAddNode: (clusterId: string) => void
  onDragEnd: (id: string, x: number, y: number) => void
  style?: React.CSSProperties
}

const clusterColors: Record<string, string> = {
  proxmox: '#f97316',
  docker: '#3b82f6',
  k8s: '#8b5cf6',
  arm: '#ec4899',
  'bare-metal': '#6b7280',
  vps: '#14b8a6',
  general: '#6366f1',
}

export function ClusterCard({ cluster, statuses, onEditNode, onAddNode, onDragEnd, style }: Props) {
  const borderColor = clusterColors[cluster.type] || clusterColors.general

  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest('button')) return
    e.preventDefault()
    const startX = e.clientX - cluster.posX
    const startY = e.clientY - cluster.posY

    function onMove(me: MouseEvent) {
      const el = document.getElementById(`cluster-${cluster.id}`)
      if (el) {
        el.style.left = `${me.clientX - startX}px`
        el.style.top = `${me.clientY - startY}px`
      }
    }
    function onUp(me: MouseEvent) {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      onDragEnd(cluster.id, me.clientX - startX, me.clientY - startY)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const allServices = cluster.nodes.flatMap(n => n.services)
  const onlineCount = allServices.filter(s => statuses[s.id]?.status === 'online').length

  return (
    <div
      id={`cluster-${cluster.id}`}
      className="absolute bg-white border-2 rounded-xl shadow-[4px_4px_0px_#000] min-w-[260px] max-w-[320px] cursor-grab active:cursor-grabbing select-none"
      style={{ left: cluster.posX, top: cluster.posY, borderColor, ...style }}
      onMouseDown={handleMouseDown}
      data-testid={`cluster-card-${cluster.id}`}
    >
      <div className="flex items-center gap-2 p-3 border-b-2" style={{ borderColor }}>
        <span className="text-xl">{cluster.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="font-caveat text-lg leading-tight truncate">{cluster.name}</div>
          {cluster.cidr && <div className="text-xs text-gray-500 font-mono">{cluster.cidr}</div>}
        </div>
        <div className="text-xs text-gray-500 flex-shrink-0">{onlineCount}/{allServices.length} ✓</div>
        <button
          onClick={() => onAddNode(cluster.id)}
          className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 flex-shrink-0"
          data-testid={`add-node-btn-${cluster.id}`}
        >
          + node
        </button>
      </div>
      <div className="p-3 space-y-2">
        {cluster.nodes.map(node => (
          <NodeCard key={node.id} node={node} statuses={statuses} onEdit={onEditNode} />
        ))}
        {cluster.nodes.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-2">No nodes yet</p>
        )}
      </div>
    </div>
  )
}
