'use client'
import { useState } from 'react'

interface Props {
  clusterId: string
  clusterName: string
  onClose: () => void
  onSubmit: (clusterId: string, data: { name: string; type: string; ip: string; os?: string }) => Promise<void>
}

export function AddNodeModal({ clusterId, clusterName, onClose, onSubmit }: Props) {
  const [name, setName] = useState('')
  const [type, setType] = useState('VM')
  const [ip, setIp] = useState('192.168.')
  const [os, setOs] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await onSubmit(clusterId, { name, type, ip, os: os || undefined })
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white border-2 border-black shadow-[4px_4px_0px_#000] rounded-xl p-6 w-full max-w-sm"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="font-caveat text-2xl mb-1">Add Node</h2>
        <p className="text-sm text-gray-500 mb-4">to {clusterName}</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              value={name} onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-black focus:outline-none"
              placeholder="pve-01" required data-testid="node-name-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              value={type} onChange={e => setType(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-black focus:outline-none"
              data-testid="node-type-select"
            >
              {['VM', 'CT', 'Docker', 'bare-metal'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">IP Address</label>
            <input
              value={ip} onChange={e => setIp(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-black focus:outline-none font-mono"
              placeholder="192.168.1.10" required data-testid="node-ip-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              OS <span className="text-gray-400">(optional)</span>
            </label>
            <input
              value={os} onChange={e => setOs(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-black focus:outline-none"
              placeholder="Ubuntu 24.04"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border-2 border-gray-300 rounded hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="submit" disabled={loading}
              className="flex-1 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50"
              data-testid="add-node-submit"
            >
              {loading ? 'Adding...' : 'Add Node'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
