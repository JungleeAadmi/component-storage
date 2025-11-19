import React, { useEffect, useState } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import StorageBuilder from './pages/StorageBuilder'
import StorageView from './pages/StorageView'
import SearchPage from './pages/SearchPage'
import api from './services/api'

export default function App() {
  const [dark, setDark] = useState(() => !!localStorage.getItem('dark'))

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('dark', dark ? '1' : '')
  }, [dark])

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors">
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur sticky top-0 z-40 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-semibold text-lg">Component Storage</Link>
          <div className="flex items-center gap-3">
            <Link to="/create" className="px-3 py-1 rounded bg-brand-500 text-white">Add Storage</Link>
            <Link to="/search" className="px-3 py-1 rounded border">Search</Link>
            <button onClick={() => setDark(d => !d)} className="px-3 py-1 rounded border">
              {dark ? 'Light' : 'Dark'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/create" element={<StorageBuilder />} />
          <Route path="/storage/:id" element={<StorageView />} />
          <Route path="/search" element={<SearchPage />} />
        </Routes>
      </main>
    </div>
  )
}
