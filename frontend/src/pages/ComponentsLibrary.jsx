import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { componentsAPI } from '../services/api'
import { Search, Trash2, Plus, Minus, MapPin, ExternalLink, AlertTriangle } from 'lucide-react'
import { getCategoryBadgeClass, getStockBadgeClass, cn } from '../utils/helpers'

export default function ComponentsLibrary() {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')

  const queryClient = useQueryClient()

  const { data: components = [] } = useQuery({
    queryKey: ['components'],
    queryFn: componentsAPI.getAll,
  })

  const updateQuantityMutation = useMutation({
    mutationFn: ({ id, quantity }) => componentsAPI.updateQuantity(id, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries(['components'])
    },
  })

  const deleteComponentMutation = useMutation({
    mutationFn: componentsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['components'])
    },
  })

  const handleQuantityChange = (component, delta) => {
    const newQuantity = Math.max(0, component.quantity + delta)
    updateQuantityMutation.mutate({ id: component.id, quantity: newQuantity })
  }

  const handleDelete = (component) => {
    if (window.confirm(`Delete "${component.name}"?`)) {
      deleteComponentMutation.mutate(component.id)
    }
  }

  // Filter components
  const filteredComponents = components.filter((component) => {
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      const matches = 
        component.name?.toLowerCase().includes(search) ||
        component.category?.toLowerCase().includes(search) ||
        component.value?.toLowerCase().includes(search) ||
        component.manufacturer?.toLowerCase().includes(search) ||
        component.part_number?.toLowerCase().includes(search)
      if (!matches) return false
    }

    // Category filter
    if (categoryFilter !== 'all') {
      if (component.category?.toLowerCase() !== categoryFilter.toLowerCase()) return false
    }

    // Stock filter
    if (stockFilter === 'low') {
      if (!(component.quantity <= component.min_quantity && component.min_quantity > 0)) return false
    } else if (stockFilter === 'out') {
      if (component.quantity !== 0) return false
    }

    return true
  })

  // Get unique categories
  const categories = ['all', ...new Set(components.map(c => c.category).filter(Boolean))]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
          Components Library
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          Browse and manage all components
        </p>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search components..."
              className="input pl-10"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="input"
          >
            <option value="all">All Stock Levels</option>
            <option value="low">Low Stock Only</option>
            <option value="out">Out of Stock Only</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--color-text-secondary)]">
          Showing {filteredComponents.length} of {components.length} components
        </p>
      </div>

      {/* Components Grid */}
      {filteredComponents.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-[var(--color-text-secondary)]">
            No components found matching your filters
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredComponents.map((component) => (
            <div key={component.id} className="card hover:shadow-lg transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-[var(--color-text-primary)] mb-1">
                    {component.name}
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    {component.category && (
                      <span className={cn('px-2 py-0.5 rounded text-xs font-medium border', getCategoryBadgeClass(component.category))}>
                        {component.category}
                      </span>
                    )}
                    <span className={getStockBadgeClass(component.quantity, component.min_quantity)}>
                      {component.quantity === 0 ? 'Out' : component.quantity <= component.min_quantity ? 'Low' : 'OK'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(component)}
                  className="p-1 text-[var(--color-text-secondary)] hover:text-red-500"
                  title="Delete component"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Details */}
              <div className="space-y-2 text-sm mb-4">
                {component.value && (
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Value:</span>
                    <span className="text-[var(--color-text-primary)] font-medium">{component.value}</span>
                  </div>
                )}
                {component.part_number && (
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Part #:</span>
                    <span className="text-[var(--color-text-primary)] font-mono text-xs">{component.part_number}</span>
                  </div>
                )}
                {component.manufacturer && (
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Mfr:</span>
                    <span className="text-[var(--color-text-primary)]">{component.manufacturer}</span>
                  </div>
                )}
              </div>

              {/* Location */}
              {(component.container_name || component.tray_address) && (
                <div className="flex items-center gap-2 p-2 bg-[var(--color-bg-primary)] rounded-lg mb-4">
                  <MapPin className="w-4 h-4 text-[var(--color-primary)] flex-shrink-0" />
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    {component.container_name}
                    {component.tray_address && ` - ${component.tray_address}`}
                  </span>
                </div>
              )}

              {/* Quantity controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleQuantityChange(component, -1)}
                    disabled={component.quantity === 0}
                    className="p-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded hover:bg-[var(--color-secondary)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className="text-center min-w-[60px]">
                    <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                      {component.quantity}
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)]">
                      Min: {component.min_quantity}
                    </div>
                  </div>
                  <button
                    onClick={() => handleQuantityChange(component, 1)}
                    className="p-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded hover:bg-[var(--color-secondary)]"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {component.datasheet_url && (
                  <a
                    href={component.datasheet_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded"
                    title="View datasheet"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>

              {/* Low stock warning */}
              {component.quantity <= component.min_quantity && component.min_quantity > 0 && (
                <div className="flex items-center gap-2 mt-4 p-2 bg-amber-500/10 border border-amber-500/30 rounded text-xs text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>Stock is running low</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
