import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../services/api'

function Tray({ tray, onAdd }) {
  return (
    <div className="p-2 border rounded">
      <div className="font-semibold">{tray.code}</div>
      <div className="text-sm text-slate-500">{tray.description}</div>
      <div className="mt-2">
        <button onClick={() => onAdd(tray)} className="px-2 py-1 text-sm border rounded">Add component</button>
      </div>
    </div>
  )
}

export default function StorageView() {
  const { id } = useParams()
  const [trays, setTrays] = useState([])

  useEffect(() => {
    api.listTrays(id).then(r => setTrays(r.data)).catch(() => setTrays([]))
  }, [id])

  function onAdd(tray) {
    const name = prompt('Component name')
    if (!name) return
    const payload = { name, qty: 1 }
    api.addComponent(tray.id, payload).then(() => alert('Added')).catch(e => alert('Error'))
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Storage #{id}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {trays.map(t => <Tray key={t.id} tray={t} onAdd={onAdd} />)}
      </div>
    </div>
  )
}
