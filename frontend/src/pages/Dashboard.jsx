import { useQuery } from '@tanstack/react-query'
import { componentsAPI, containersAPI } from '../services/api'
import { Package, Grid3x3, AlertTriangle, TrendingUp } from 'lucide-react'
import StatsCard from '../components/dashboard/StatsCard'
import { Link } from 'react-router-dom'
import { getCategoryBadgeClass } from '../utils/helpers'

export default function Dashboard() {
  const { data: containers = [], isLoading: loadingContainers } = useQuery({
    queryKey: ['containers'],
    queryFn: containersAPI.getAll,
  })

  const { data: components = [], isLoading: loadingComponents } = useQuery({
    queryKey: ['components'],
    queryFn: componentsAPI.getAll,
  })

  const { data: stats } = useQuery({
    queryKey: ['statistics'],
    queryFn: componentsAPI.getStatistics,
  })

  const { data: lowStockComponents = [] } = useQuery({
    queryKey: ['low-stock'],
    queryFn: componentsAPI.getLowStock,
  })

  const totalComponents = components.length
  const totalQuantity = components.reduce((sum, c) => sum + (c.quantity || 0), 0)
  const lowStockCount = lowStockComponents.length

  if (loadingContainers || loadingComponents) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[var(--color-text-secondary)]">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Dashboard</h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          Overview of your component inventory
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Components"
          value={totalComponents}
          icon={Package}
          description={`${totalQuantity} pieces in stock`}
        />
        <StatsCard
          title="Storage Containers"
          value={containers.length}
          icon={Grid3x3}
          description={`${containers.filter(c => c.component_count > 0).length} in use`}
        />
        <StatsCard
          title="Low Stock Alerts"
          value={lowStockCount}
          icon={AlertTriangle}
          description={lowStockCount > 0 ? 'Needs attention' : 'All good'}
          className={lowStockCount > 0 ? 'border-amber-500/30' : ''}
        />
        <StatsCard
          title="Categories"
          value={stats?.total_categories || 0}
          icon={TrendingUp}
          description="Component types"
        />
      </div>

      {/* Low Stock Alert */}
      {lowStockCount > 0 && (
        <div className="card border-amber-500/30 bg-amber-500/5">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">
                Low Stock Alert
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                {lowStockCount} component{lowStockCount !== 1 ? 's are' : ' is'} running low on stock
              </p>
              <div className="space-y-2">
                {lowStockComponents.slice(0, 5).map((component) => (
                  <div
                    key={component.id}
                    className="flex items-center justify-between p-2 bg-[var(--color-bg-secondary)] rounded-lg"
                  >
                    <div className="flex-1">
                      <span className="font-medium text-[var(--color-text-primary)]">
                        {component.name}
                      </span>
                      {component.category && (
                        <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium border ${getCategoryBadgeClass(component.category)}`}>
                          {component.category}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-amber-500">
                        {component.quantity} / {component.min_quantity}
                      </div>
                      <div className="text-xs text-[var(--color-text-secondary)]">
                        {component.container_name} - {component.tray_address}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {lowStockCount > 5 && (
                <Link
                  to="/components"
                  className="inline-block mt-3 text-sm text-[var(--color-primary)] hover:underline"
                >
                  View all {lowStockCount} low stock components →
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top Categories */}
      {stats?.top_categories && stats.top_categories.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-[var(--color-text-primary)] mb-4">
            Top Categories
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {stats.top_categories.map((cat) => (
              <div
                key={cat.category}
                className="p-4 bg-[var(--color-bg-primary)] rounded-lg text-center"
              >
                <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                  {cat.count}
                </div>
                <div className="text-sm text-[var(--color-text-secondary)] mt-1 capitalize">
                  {cat.category}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link to="/add-component" className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-[var(--color-primary)]/10 rounded-lg">
              <Package className="w-6 h-6 text-[var(--color-primary)]" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--color-text-primary)]">
                Add Component
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Register a new component
              </p>
            </div>
          </div>
        </Link>

        <Link to="/containers" className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-[var(--color-primary)]/10 rounded-lg">
              <Grid3x3 className="w-6 h-6 text-[var(--color-primary)]" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--color-text-primary)]">
                Manage Containers
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                View and organize storage
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
