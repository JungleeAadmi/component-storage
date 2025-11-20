import { X, Package, Plus, Minus, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { componentsAPI } from '../../services/api'
import { getCategoryBadgeClass, getStockBadgeClass, cn } from '../../utils/helpers'

export default function TrayDetailModal({
  isOpen,
  onClose,
  trayAddress,
  components = [],
  containerName,
  containerId
}) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const updateQuantityMutation = useMutation({
    mutationFn: ({ id, quantity }) => componentsAPI.updateQuantity(id, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries(['components'])
      queryClient.invalidateQueries(['containers'])
    },
  })

  const handleQuantityChange = (component, delta) => {
    const newQuantity = Math.max(0, component.quantity + delta)
    updateQuantityMutation.mutate({ id: component.id, quantity: newQuantity })
  }

  const handleAddComponent = () => {
    navigate(`/add-component?container=${containerId}&tray=${trayAddress}`)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl shadow-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
          <div>
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
              Tray {trayAddress}
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              {containerName} • {components.length} component{components.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {components.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto mb-4 text-[var(--color-text-secondary)] opacity-50" />
              <p className="text-[var(--color-text-secondary)] mb-4">This tray is empty</p>
              <button
                onClick={handleAddComponent}
                className="btn btn-primary inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Component to this Tray
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {components.map((component) => (
                <div
                  key={component.id}
                  className="p-4 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-[var(--color-text-primary)] mb-1">
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
                    <div className="text-right">
                      <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                        {component.quantity}
                      </div>
                      <div className="text-xs text-[var(--color-text-secondary)]">
                        Min: {component.min_quantity}
                      </div>
                    </div>
                  </div>

                  {(component.value || component.specifications) && (
                    <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                      {component.value && (
                        <div>
                          <span className="text-[var(--color-text-secondary)]">Value:</span>
                          <span className="ml-2 text-[var(--color-text-primary)]">{component.value}</span>
                        </div>
                      )}
                      {component.specifications && (
                        <div>
                          <span className="text-[var(--color-text-secondary)]">Specs:</span>
                          <span className="ml-2 text-[var(--color-text-primary)]">{component.specifications}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleQuantityChange(component, -1)}
                      disabled={component.quantity === 0}
                      className="p-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded hover:bg-[var(--color-bg-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleQuantityChange(component, 1)}
                      className="p-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded hover:bg-[var(--color-bg-primary)]"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    {component.datasheet_url && (
                      <a
                        href={component.datasheet_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto p-2 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {components.length > 0 && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-[var(--color-border)]">
            <button onClick={onClose} className="btn btn-secondary">
              Close
            </button>
            <button onClick={handleAddComponent} className="btn btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Component
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
