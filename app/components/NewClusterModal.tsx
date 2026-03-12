'use client'
import { useState } from 'react'

const CLUSTER_TYPES = [
  { id: 'proxmox', label: 'Proxmox', emoji: '🔥' },
  { id: 'docker', label: 'Docker', emoji: '🐳' },
  { id: 'k8s', label: 'Kubernetes', emoji: '☸️' },
  { id: 'arm', label: 'ARM / Pi', emoji: '🍓' },
  { id: 'bare-metal', label: 'Bare Metal', emoji: '🖥️' },
  { id: 'vps', label: 'VPS', emoji: '☁️' },
]

interface Props {
  onClose: () => void
  onSubmit: (data: { name: string; type: string; emoji: string; cidr?: string }) => Promise<void>
}

export function NewClusterModal({ onClose, onSubmit }: Props) {
  const [name, setName] = useState('')
  const [type, setType] = useState('general')
  const [cidr, setCidr] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const ct = CLUSTER_TYPES.find(t => t.id === type)
    await onSubmit({ name, type, emoji: ct?.emoji || '🖥️', cidr: cidr || undefined })
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white border-2 border-black shadow-[4px_4px_0px_#000] rounded-xl p-6 w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="font-caveat text-2xl mb-4">New Cluster</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              value={name} onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-black focus:outline-none"
              placeholder="Home Lab" required data-testid="cluster-name-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {CLUSTER_TYPES.map(t => (
                <button
                  key={t.id} type="button" onClick={() => setType(t.id)}
                  className={`p-2 border-2 rounded text-center text-sm transition-all ${type === t.id ? 'border-black shadow-[2px_2px_0px_#000]' : 'border-gray-200 hover:border-gray-400'}`}
                  data-testid={`cluster-type-${t.id}`}
                >
                  <div className="text-xl mb-1">{t.emoji}</div>
                  <div>{t.label}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              CIDR <span className="text-gray-400">(optional)</span>
            </label>
            <input
              value={cidr} onChange={e => setCidr(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-black focus:outline-none font-mono"
              placeholder="192.168.1.0/24"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border-2 border-gray-300 rounded hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="submit" disabled={loading}
              className="flex-1 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50"
              data-testid="create-cluster-btn"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
