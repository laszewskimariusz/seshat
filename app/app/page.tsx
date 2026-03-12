'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../lib/authContext'
import { apiFetch } from '../lib/api'
import { ClusterCard } from '../components/ClusterCard'
import { NewClusterModal } from '../components/NewClusterModal'
import { AddNodeModal } from '../components/AddNodeModal'
import { DetailPanel } from '../components/DetailPanel'

interface Service { id: string; name: string; port: number; protocol: string }
interface Node {
  id: string
  name: string
  type: string
  ip: string
  os?: string | null
  emoji?: string | null
  notes?: string | null
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
interface StatusEntry { status: string; latencyMs?: number | null }

export default function AppPage() {
  const { token, user, logout } = useAuth()
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [statuses, setStatuses] = useState<Record<string, StatusEntry>>({})
  const [showNewCluster, setShowNewCluster] = useState(false)
  const [addNodeCluster, setAddNodeCluster] = useState<{ id: string; name: string } | null>(null)
  const [editNode, setEditNode] = useState<Node | null>(null)
  const [checking, setChecking] = useState(false)
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const canvasRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })

  // Load clusters
  const loadClusters = useCallback(async () => {
    if (!token) return
    try {
      const data = await apiFetch('/api/clusters', {}, token)
      setClusters(data.clusters)
    } catch (e) { console.error(e) }
  }, [token])

  useEffect(() => { loadClusters() }, [loadClusters])

  // SSE status stream — token passed as query param since EventSource doesn't support headers
  useEffect(() => {
    if (!token) return
    const es = new EventSource(`/api/status/stream?token=${encodeURIComponent(token)}`)

    es.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data)
        if (payload.type === 'snapshot') {
          // Initial full snapshot: { serviceId -> StatusEntry }
          const map: Record<string, StatusEntry> = {}
          Object.entries(payload.statuses as Record<string, StatusEntry>).forEach(([id, entry]) => {
            map[id] = { status: entry.status, latencyMs: entry.latencyMs }
          })
          setStatuses(map)
        } else if (payload.type === 'status') {
          // Incremental update for a single service
          setStatuses(prev => ({
            ...prev,
            [payload.serviceId]: { status: payload.status, latencyMs: payload.latencyMs },
          }))
        }
      } catch {}
    }

    es.onerror = () => { es.close() }

    return () => { es.close() }
  }, [token])

  // Canvas pan
  function handleCanvasMouseDown(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest('[data-testid^="cluster-card"]')) return
    isDragging.current = true
    dragStart.current = { x: e.clientX - canvasOffset.x, y: e.clientY - canvasOffset.y }
  }
  function handleCanvasMouseMove(e: React.MouseEvent) {
    if (!isDragging.current) return
    setCanvasOffset({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y })
  }
  function handleCanvasMouseUp() { isDragging.current = false }

  // Zoom via wheel
  function handleWheel(e: React.WheelEvent) {
    e.preventDefault()
    setZoom(z => Math.min(2, Math.max(0.3, z - e.deltaY * 0.001)))
  }

  async function handleDragEnd(clusterId: string, x: number, y: number) {
    if (!token) return
    try {
      const data = await apiFetch(
        `/api/clusters/${clusterId}`,
        { method: 'PUT', body: JSON.stringify({ posX: Math.round(x), posY: Math.round(y) }) },
        token,
      )
      setClusters(cs => cs.map(c => c.id === clusterId ? { ...c, posX: data.cluster.posX, posY: data.cluster.posY } : c))
    } catch (e) { console.error(e) }
  }

  async function handleCreateCluster(data: { name: string; type: string; emoji: string; cidr?: string }) {
    if (!token) return
    const res = await apiFetch(
      '/api/clusters',
      { method: 'POST', body: JSON.stringify({ ...data, posX: 80 + clusters.length * 40, posY: 80 }) },
      token,
    )
    setClusters(cs => [...cs, res.cluster])
    setShowNewCluster(false)
  }

  async function handleAddNode(clusterId: string, data: { name: string; type: string; ip: string; os?: string }) {
    if (!token) return
    const res = await apiFetch(
      `/api/clusters/${clusterId}/nodes`,
      { method: 'POST', body: JSON.stringify(data) },
      token,
    )
    setClusters(cs => cs.map(c => c.id === clusterId ? { ...c, nodes: [...c.nodes, res.node] } : c))
    setAddNodeCluster(null)
  }

  async function handleSaveNode(nodeId: string, data: Partial<Node>) {
    if (!token) return
    const cluster = clusters.find(c => c.nodes.some(n => n.id === nodeId))
    if (!cluster) return
    const res = await apiFetch(
      `/api/clusters/${cluster.id}/nodes/${nodeId}`,
      { method: 'PUT', body: JSON.stringify(data) },
      token,
    )
    setClusters(cs => cs.map(c =>
      c.id === cluster.id ? { ...c, nodes: c.nodes.map(n => n.id === nodeId ? res.node : n) } : c
    ))
    setEditNode(null)
  }

  async function handleDeleteNode(nodeId: string) {
    if (!token || !window.confirm('Delete this node?')) return
    const cluster = clusters.find(c => c.nodes.some(n => n.id === nodeId))
    if (!cluster) return
    await apiFetch(`/api/clusters/${cluster.id}/nodes/${nodeId}`, { method: 'DELETE' }, token)
    setClusters(cs => cs.map(c =>
      c.id === cluster.id ? { ...c, nodes: c.nodes.filter(n => n.id !== nodeId) } : c
    ))
    setEditNode(null)
  }

  async function handleCheckStatus() {
    if (!token) return
    setChecking(true)
    try {
      const data = await apiFetch('/api/status/check', { method: 'POST' }, token)
      const map: Record<string, StatusEntry> = {}
      data.results.forEach((r: { serviceId: string; status: string; latencyMs?: number | null }) => {
        map[r.serviceId] = { status: r.status, latencyMs: r.latencyMs }
      })
      setStatuses(prev => ({ ...prev, ...map }))
    } finally { setChecking(false) }
  }

  const allServices = clusters.flatMap(c => c.nodes.flatMap(n => n.services))
  const onlineCount = allServices.filter(s => statuses[s.id]?.status === 'online').length

  return (
    <div className="h-screen bg-[#faf9f7] flex flex-col overflow-hidden">
      {/* Topbar */}
      <header className="flex items-center gap-3 px-4 py-2 bg-white border-b-2 border-black z-30 flex-shrink-0">
        <span className="font-caveat text-2xl font-bold">Seshat</span>
        <div className="h-5 w-px bg-gray-300" />
        <button
          onClick={() => setShowNewCluster(true)}
          className="px-3 py-1 bg-black text-white text-sm rounded hover:bg-gray-800"
          data-testid="new-cluster-btn"
        >
          + New Cluster
        </button>
        <button
          onClick={handleCheckStatus} disabled={checking}
          className="px-3 py-1 border-2 border-black text-sm rounded hover:bg-gray-50 disabled:opacity-50"
          data-testid="check-status-btn"
        >
          {checking ? '⟳ Checking...' : '⚡ Check Status'}
        </button>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-gray-600" data-testid="status-counter">
            {onlineCount}/{allServices.length} online
          </span>
          <span className="text-sm text-gray-500">{user?.email}</span>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-black underline">
            Logout
          </button>
        </div>
      </header>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="flex-1 relative overflow-hidden"
        style={{
          backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          cursor: isDragging.current ? 'grabbing' : 'default',
        }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        onWheel={handleWheel}
        data-testid="canvas"
      >
        <div
          style={{
            transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            position: 'absolute',
            width: '100%',
            height: '100%',
          }}
        >
          {clusters.map(cluster => (
            <ClusterCard
              key={cluster.id}
              cluster={cluster}
              statuses={statuses}
              onEditNode={setEditNode}
              onAddNode={(cid) => {
                const c = clusters.find(cl => cl.id === cid)
                if (c) setAddNodeCluster({ id: c.id, name: c.name })
              }}
              onDragEnd={handleDragEnd}
            />
          ))}
          {clusters.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-gray-400">
                <div className="font-caveat text-3xl mb-2">Your homelab is empty</div>
                <div className="text-sm">Click &quot;+ New Cluster&quot; to get started</div>
              </div>
            </div>
          )}
        </div>

        {/* Zoom controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-1 z-20">
          <button
            onClick={() => setZoom(z => Math.min(2, z + 0.1))}
            className="w-8 h-8 bg-white border-2 border-black rounded shadow-[2px_2px_0_#000] text-sm hover:bg-gray-50"
            data-testid="zoom-in"
          >+</button>
          <button
            onClick={() => setZoom(1)}
            className="w-8 h-8 bg-white border-2 border-black rounded shadow-[2px_2px_0_#000] text-xs hover:bg-gray-50"
            data-testid="zoom-reset"
          >⊙</button>
          <button
            onClick={() => setZoom(z => Math.max(0.3, z - 0.1))}
            className="w-8 h-8 bg-white border-2 border-black rounded shadow-[2px_2px_0_#000] text-sm hover:bg-gray-50"
            data-testid="zoom-out"
          >−</button>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white border-2 border-black shadow-[2px_2px_0_#000] rounded-lg p-2 text-xs z-20">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" /> online
          </div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> offline
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" /> unknown
          </div>
        </div>
      </div>

      {/* Modals */}
      {showNewCluster && (
        <NewClusterModal onClose={() => setShowNewCluster(false)} onSubmit={handleCreateCluster} />
      )}
      {addNodeCluster && (
        <AddNodeModal
          clusterId={addNodeCluster.id}
          clusterName={addNodeCluster.name}
          onClose={() => setAddNodeCluster(null)}
          onSubmit={handleAddNode}
        />
      )}
      <DetailPanel
        node={editNode}
        onClose={() => setEditNode(null)}
        onSave={handleSaveNode}
        onDelete={handleDeleteNode}
      />
    </div>
  )
}
