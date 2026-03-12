'use client'
import { useState, useEffect } from 'react'

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

interface Props {
  node: Node | null
  onClose: () => void
  onSave: (id: string, data: Partial<Node>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function DetailPanel({ node, onClose, onSave, onDelete }: Props) {
  const [name, setName] = useState('')
  const [ip, setIp] = useState('')
  const [type, setType] = useState('VM')
  const [os, setOs] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (node) {
      setName(node.name)
      setIp(node.ip)
      setType(node.type)
      setOs(node.os || '')
      setNotes(node.notes || '')
    }
  }, [node])

  if (!node) return null

  async function handleSave() {
    setSaving(true)
    await onSave(node!.id, { name, ip, type, os: os || undefined, notes: notes || undefined })
    setSaving(false)
  }

  return (
    <div
      className="fixed right-0 top-0 h-full w-80 bg-white border-l-2 border-black shadow-[-4px_0px_0px_#000] z-40 flex flex-col"
      data-testid="detail-panel"
    >
      <div className="flex items-center justify-between p-4 border-b-2 border-black">
        <h2 className="font-caveat text-xl">Edit Node</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-black text-xl leading-none">×</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            value={name} onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-black focus:outline-none"
            data-testid="detail-name-input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">IP</label>
          <input
            value={ip} onChange={e => setIp(e.target.value)}
            className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-black focus:outline-none font-mono"
            data-testid="detail-ip-input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <select
            value={type} onChange={e => setType(e.target.value)}
            className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-black focus:outline-none"
          >
            {['VM', 'CT', 'Docker', 'bare-metal'].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">OS</label>
          <input
            value={os} onChange={e => setOs(e.target.value)}
            className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-black focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-black focus:outline-none resize-none"
          />
        </div>
        {node.services.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-2">Services</label>
            <div className="space-y-1">
              {node.services.map(s => (
                <div key={s.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded border">
                  <span>{s.name}</span>
                  <span className="text-gray-500 font-mono">{s.protocol}:{s.port}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="p-4 border-t-2 border-black space-y-2">
        <button
          onClick={handleSave} disabled={saving}
          className="w-full py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50"
          data-testid="detail-save-btn"
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
        <button
          onClick={() => onDelete(node.id)}
          className="w-full py-2 border-2 border-red-300 text-red-600 rounded hover:bg-red-50"
          data-testid="detail-delete-btn"
        >
          Delete node
        </button>
      </div>
    </div>
  )
}
