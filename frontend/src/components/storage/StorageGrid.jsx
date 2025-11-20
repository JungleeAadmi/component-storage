import { Package } from 'lucide-react'
import { cn, generateTrayAddress } from '../../utils/helpers'

export default function StorageGrid({ container, components = [], onTrayClick, partition = null }) {
  // Determine grid dimensions based on container type and partition
  let rows, cols, prefix = ''
  
  if (container.type === 'type1_dual') {
    if (partition === 'top') {
      rows = container.top_rows
      cols = container.top_cols
    } else if (partition === 'bottom') {
      rows = container.bottom_rows
      cols = container.bottom_cols
      prefix = 'BIG-'
    }
  } else {
    rows = container.rows
    cols = container.cols
  }

  const getComponentsInTray = (address) => {
    return components.filter(c => c.tray_address === address)
  }

  const getTrayColor = (address) => {
    const comps = getComponentsInTray(address)
    if (comps.length === 0) return 'bg-gray-500/10 border-gray-500/20'
    
    const hasLowStock = comps.some(c => c.quantity <= c.min_quantity && c.min_quantity > 0)
    const hasEmpty = comps.some(c => c.quantity === 0)
    
    if (hasEmpty) return 'bg-red-500/20 border-red-500/30'
    if (hasLowStock) return 'bg-amber-500/20 border-amber-500/30'
    return 'bg-purple-500/20 border-purple-500/30'
  }

  return (
    <div className="space-y-2">
      {/* Column headers */}
      <div className="grid gap-2" style={{ gridTemplateColumns: `40px repeat(${cols}, 1fr)` }}>
        <div /> {/* Empty corner */}
        {Array.from({ length: cols }, (_, i) => (
          <div key={i} className="text-center text-sm font-medium text-[var(--color-text-secondary)]">
            {String.fromCharCode(65 + i)}
          </div>
        ))}
      </div>

      {/* Grid */}
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={rowIndex} className="grid gap-2" style={{ gridTemplateColumns: `40px repeat(${cols}, 1fr)` }}>
          {/* Row header */}
          <div className="flex items-center justify-center text-sm font-medium text-[var(--color-text-secondary)]">
            {rowIndex + 1}
          </div>

          {/* Cells */}
          {Array.from({ length: cols }, (_, colIndex) => {
            const address = generateTrayAddress(container.type, rowIndex, colIndex, partition)
            const comps = getComponentsInTray(address)
            const colorClass = getTrayColor(address)

            return (
              <button
                key={colIndex}
                onClick={() => onTrayClick(address)}
                className={cn(
                  'relative aspect-square border rounded-lg transition-all hover:scale-105 hover:shadow-md',
                  colorClass
                )}
                title={`${address} (${comps.length} component${comps.length !== 1 ? 's' : ''})`}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center p-1">
                  <span className="text-xs font-mono font-semibold text-[var(--color-text-primary)]">
                    {address}
                  </span>
                  {comps.length > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <Package className="w-3 h-3" />
                      <span className="text-xs font-medium">{comps.length}</span>
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
