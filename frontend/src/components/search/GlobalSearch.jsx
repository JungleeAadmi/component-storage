import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { componentsAPI, containersAPI } from '../../services/api'
import { Search, Package, MapPin, X } from 'lucide-react'
import { cn, getCategoryBadgeClass, getStockBadgeClass } from '../../utils/helpers'

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const { data: components = [] } = useQuery({
    queryKey: ['components'],
    queryFn: componentsAPI.getAll,
  })

  const { data: containers = [] } = useQuery({
    queryKey: ['containers'],
    queryFn: containersAPI.getAll,
  })

  // Keyboard shortcut (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Filter components based on search term
  const filteredComponents = components.filter((component) => {
    if (!searchTerm) return false
    const search = searchTerm.toLowerCase()
    return (
      component.name?.toLowerCase().includes(search) ||
      component.category?.toLowerCase().includes(search) ||
      component.value?.toLowerCase().includes(search) ||
      component.manufacturer?.toLowerCase().includes(search) ||
      component.part_number?.toLowerCase().includes(search) ||
      component.tray_address?.toLowerCase().includes(search) ||
      component.container_name?.toLowerCase().includes(search)
    )
  })

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full max-w-md flex items-center gap-2 px-4 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
      >
        <Search className="w-4 h-4" />
        <span className="flex-1 text-left text-sm">Search components...</span>
        <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-mono bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded">
          Ctrl+K
        </kbd>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl shadow-2xl">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)]">
          <Search className="w-5 h-5 text-[var(--color-text-secondary)]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, category, value, part number, location..."
            className="flex-1 bg-transparent border-none outline-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)]"
            autoFocus
          />
          <button
            onClick={() => setIsOpen(false)}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {!searchTerm ? (
            <div className="p-8 text-center text-[var(--color-text-secondary)]">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Type to search components...</p>
              <p className="text-sm mt-2">Search by name, category, value, or location</p>
            </div>
          ) : filteredComponents.length === 0 ? (
            <div className="p-8 text-center text-[var(--color-text-secondary)]">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No components found</p>
              <p className="text-sm mt-2">Try a different search term</p>
            </div>
          ) : (
            <div className="p-2">
              {filteredComponents.map((component) => (
                <div
                  key={component.id}
                  className="p-3 rounded-lg hover:bg-[var(--color-bg-primary)] cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-[var(--color-text-primary)]">
                          {component.name}
                        </h3>
                        {component.category && (
                          <span className={cn('px-2 py-0.5 rounded text-xs font-medium border', getCategoryBadgeClass(component.category))}>
                            {component.category}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-[var(--color-text-secondary)]">
                        {component.value && <span>{component.value}</span>}
                        {component.part_number && <span>PN: {component.part_number}</span>}
                      </div>
                      {(component.container_name || component.tray_address) && (
                        <div className="flex items-center gap-2 mt-2">
                          <MapPin className="w-4 h-4 text-[var(--color-primary)]" />
                          <span className="text-sm text-[var(--color-text-secondary)]">
                            {component.container_name}
                            {component.tray_address && ` - Tray ${component.tray_address}`}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-[var(--color-text-primary)]">
                        {component.quantity}
                      </div>
                      <span className={getStockBadgeClass(component.quantity, component.min_quantity)}>
                        {component.quantity === 0 ? 'Out of Stock' : component.quantity <= component.min_quantity ? 'Low Stock' : 'In Stock'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
