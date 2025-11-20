import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Package, Grid3x3, Library, LayoutDashboard, Menu, X } from 'lucide-react'
import GlobalSearch from './search/GlobalSearch'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  const navigation = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Storage Containers', path: '/containers', icon: Grid3x3 },
    { name: 'Components Library', path: '/components', icon: Library },
    { name: 'Add Component', path: '/add-component', icon: Package },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[var(--color-bg-secondary)] border-r border-[var(--color-border)] transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-[var(--color-primary)]" />
            <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Component Storage
            </h1>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-primary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[var(--color-border)]">
          <div className="text-xs text-[var(--color-text-secondary)]">
            <p>Component Storage v1.0.0</p>
            <p className="mt-1">Self-hosted inventory system</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex-1 max-w-2xl mx-auto">
              <GlobalSearch />
            </div>

            <div className="w-10" /> {/* Spacer for alignment */}
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
