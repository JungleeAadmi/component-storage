import React, { useState } from 'react'
import api from '../services/api'

export default function SearchPage() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])

  async function onSearch(e) {
    e.preventDefault()
    if (!q) return
    const r = await api.search(q)
    setResults(r.data)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <form onSubmit={onSearch} className="flex gap-2 mb-4">
        <input value={q} onChange={e => setQ(e.target.value)} className="flex-1 px-3 py-2 border rounded" placeholder="Search by name, tag, tray code..." />
        <button className="px-3 py-2 bg-brand-600 text-white rounded">Search</button>
      </form>

      <div className="space-y-2">
        {results.map((r, idx) => (
          <div key={idx} className="p-3 border rounded">
            <div className="font-medium">{r.component.name} <span className="text-sm text-slate-500">({r.component.qty})</span></div>
            <div className="text-sm text-slate-500">{r.storage_name} — {r.tray_code}</div>
            <div className="text-sm text-slate-400">{r.component.specs}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
