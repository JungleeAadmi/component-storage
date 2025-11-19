import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

export default function Dashboard() {
  const [storages, setStorages] = useState([])

  useEffect(() => {
    api.listStorages().then(r => setStorages(r.data)).catch(() => setStorages([]))
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Storages</h1>
        <Link to="/create" className="text-sm text-brand-700">+ Create storage</Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {storages.map(s => (
          <Link key={s.id} to={`/storage/${s.id}`} className="p-4 border rounded hover:shadow">
            <div className="font-medium">{s.name}</div>
            <div className="text-sm text-slate-500">{s.type}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
