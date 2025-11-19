import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

function PartitionRow({ idx, value, onChange }) {
  return (
    <div className="flex gap-2 items-center">
      <input value={value.label} onChange={e => onChange(idx, 'label', e.target.value)} placeholder="Label e.g. TOP or BIG" className="px-2 py-1 border rounded" />
      <input type="number" value={value.rows} onChange={e => onChange(idx, 'rows', parseInt(e.target.value||0))} min="1" className="w-20 px-2 py-1 border rounded" />
      <input type="number" value={value.cols} onChange={e => onChange(idx, 'cols', parseInt(e.target.value||0))} min="1" className="w-20 px-2 py-1 border rounded" />
    </div>
  )
}

export default function StorageBuilder() {
  const [name, setName] = useState('')
  const [type, setType] = useState('type1')
  const [partitions, setPartitions] = useState([{ label: 'TOP', rows: 5, cols: 6 }])
  const navigate = useNavigate()

  function onChangePartition(i, field, val) {
    const copy = partitions.slice()
    copy[i] = { ...copy[i], [field]: val }
    setPartitions(copy)
  }

  function addPartition() {
    setPartitions(p => [...p, { label: 'NEW', rows: 1, cols: 1 }])
  }

  async function submit() {
    const payload = { name, type, partitions }
    try {
      const res = await api.createStorage(payload)
      navigate(`/storage/${res.data.id}`)
    } catch (err) {
      alert('Failed to create storage: ' + (err?.response?.data || err.message))
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Create Storage</h2>
      <div className="space-y-4">
        <input className="w-full px-3 py-2 border rounded" placeholder="Storage name" value={name} onChange={e => setName(e.target.value)} />
        <select value={type} onChange={e => setType(e.target.value)} className="px-3 py-2 border rounded">
          <option value="type1">Type 1 (multi-part grid)</option>
          <option value="type2">Type 2 (single grid)</option>
        </select>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium">Partitions</div>
            <button onClick={addPartition} className="px-2 py-1 border rounded text-sm">Add partition</button>
          </div>
          <div className="space-y-2">
            {partitions.map((p, i) => <PartitionRow key={i} idx={i} value={p} onChange={onChangePartition} />)}
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={submit} className="px-4 py-2 bg-brand-500 text-white rounded">Create</button>
        </div>
      </div>
    </div>
  )
}
