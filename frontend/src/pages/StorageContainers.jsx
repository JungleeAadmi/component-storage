import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { containersAPI, componentsAPI } from '../services/api'
import { Plus, Edit, Trash2 } from 'lucide-react'
import StorageGrid from '../components/storage/StorageGrid'
import TrayDetailModal from '../components/storage/TrayDetailModal'

export default function StorageContainers() {
  const [selectedTray, setSelectedTray] = useState(null)
  const [selectedContainer, setSelectedContainer] = useState(null)
  const [showNewContainerModal, setShowNewContainerModal] = useState(false)
  const [newContainer, setNewContainer] = useState({
    name: '',
    type: 'type2_uniform',
    top_rows: 5,
    top_cols: 6,
    bottom_rows: 3,
    bottom_cols: 3,
    rows: 5,
    cols: 6,
  })

  const queryClient = useQueryClient()

  const { data: containers = [] } = useQuery({
    queryKey: ['containers'],
    queryFn: containersAPI.getAll,
  })

  const { data: components = [] } = useQuery({
    queryKey: ['components'],
    queryFn: componentsAPI.getAll,
  })

  const createContainerMutation = useMutation({
    mutationFn: containersAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['containers'])
      setShowNewContainerModal(false)
      setNewContainer({
        name: '',
        type: 'type2_uniform',
        top_rows: 5,
        top_cols: 6,
        bottom_rows: 3,
        bottom_cols: 3,
        rows: 5,
        cols: 6,
      })
    },
  })

  const deleteContainerMutation = useMutation({
    mutationFn: containersAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['containers'])
    },
  })

  const handleTrayClick = (address, container) => {
    setSelectedTray(address)
    setSelectedContainer(container)
  }

  const handleCreateContainer = (e) => {
    e.preventDefault()
    createContainerMutation.mutate(newContainer)
  }

  const handleDeleteContainer = (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteContainerMutation.mutate(id)
    }
  }

  const getContainerComponents = (containerId) => {
    return components.filter(c => c.container_id === containerId)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
            Storage Containers
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Manage your component storage organization
          </p>
        </div>
        <button
          onClick={() => setShowNewContainerModal(true)}
          className="btn btn-primary inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Container
        </button>
      </div>

      {/* Containers List */}
      {containers.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-[var(--color-text-secondary)] mb-4">
            No storage containers yet
          </p>
          <button
            onClick={() => setShowNewContainerModal(true)}
            className="btn btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Your First Container
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {containers.map((container) => {
            const containerComponents = getContainerComponents(container.id)
            
            return (
              <div key={container.id} className="card">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
                      {container.name}
                    </h2>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                      {container.type === 'type1_dual' ? 'Type 1 (Dual Partition)' : 
                       container.type === 'type2_uniform' ? 'Type 2 (Uniform)' : 'Custom'} • 
                      {' '}{containerComponents.length} component{containerComponents.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded"
                      title="Edit container"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteContainer(container.id, container.name)}
                      className="p-2 text-[var(--color-text-secondary)] hover:text-red-500 hover:bg-red-500/10 rounded"
                      title="Delete container"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {container.type === 'type1_dual' ? (
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-4">
                        Top Section ({container.top_rows} × {container.top_cols})
                      </h3>
                      <StorageGrid
                        container={container}
                        components={containerComponents}
                        onTrayClick={(address) => handleTrayClick(address, container)}
                        partition="top"
                      />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-4">
                        Bottom Section - Large Trays ({container.bottom_rows} × {container.bottom_cols})
                      </h3>
                      <StorageGrid
                        container={container}
                        components={containerComponents}
                        onTrayClick={(address) => handleTrayClick(address, container)}
                        partition="bottom"
                      />
                    </div>
                  </div>
                ) : (
                  <StorageGrid
                    container={container}
                    components={containerComponents}
                    onTrayClick={(address) => handleTrayClick(address, container)}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* New Container Modal */}
      {showNewContainerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowNewContainerModal(false)} />
          <div className="relative w-full max-w-md bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl shadow-2xl p-6">
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
              Add Storage Container
            </h2>
            <form onSubmit={handleCreateContainer} className="space-y-4">
              <div>
                <label className="label">Container Name</label>
                <input
                  type="text"
                  value={newContainer.name}
                  onChange={(e) => setNewContainer({ ...newContainer, name: e.target.value })}
                  className="input"
                  required
                  placeholder="e.g., Workshop Cabinet A"
                />
              </div>

              <div>
                <label className="label">Container Type</label>
                <select
                  value={newContainer.type}
                  onChange={(e) => setNewContainer({ ...newContainer, type: e.target.value })}
                  className="input"
                >
                  <option value="type1_dual">Type 1 (5×6 top + 3×3 bottom)</option>
                  <option value="type2_uniform">Type 2 (5×6 uniform)</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {newContainer.type === 'type1_dual' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Top Rows</label>
                      <input
                        type="number"
                        value={newContainer.top_rows}
                        onChange={(e) => setNewContainer({ ...newContainer, top_rows: parseInt(e.target.value) })}
                        className="input"
                        min="1"
                        max="20"
                      />
                    </div>
                    <div>
                      <label className="label">Top Columns</label>
                      <input
                        type="number"
                        value={newContainer.top_cols}
                        onChange={(e) => setNewContainer({ ...newContainer, top_cols: parseInt(e.target.value) })}
                        className="input"
                        min="1"
                        max="26"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Bottom Rows</label>
                      <input
                        type="number"
                        value={newContainer.bottom_rows}
                        onChange={(e) => setNewContainer({ ...newContainer, bottom_rows: parseInt(e.target.value) })}
                        className="input"
                        min="1"
                        max="20"
                      />
                    </div>
                    <div>
                      <label className="label">Bottom Columns</label>
                      <input
                        type="number"
                        value={newContainer.bottom_cols}
                        onChange={(e) => setNewContainer({ ...newContainer, bottom_cols: parseInt(e.target.value) })}
                        className="input"
                        min="1"
                        max="26"
                      />
                    </div>
                  </div>
                </>
              )}

              {(newContainer.type === 'type2_uniform' || newContainer.type === 'custom') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Rows</label>
                    <input
                      type="number"
                      value={newContainer.rows}
                      onChange={(e) => setNewContainer({ ...newContainer, rows: parseInt(e.target.value) })}
                      className="input"
                      min="1"
                      max="20"
                    />
                  </div>
                  <div>
                    <label className="label">Columns</label>
                    <input
                      type="number"
                      value={newContainer.cols}
                      onChange={(e) => setNewContainer({ ...newContainer, cols: parseInt(e.target.value) })}
                      className="input"
                      min="1"
                      max="26"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewContainerModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createContainerMutation.isPending}
                  className="btn btn-primary flex-1"
                >
                  {createContainerMutation.isPending ? 'Creating...' : 'Create Container'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tray Detail Modal */}
      {selectedTray && selectedContainer && (
        <TrayDetailModal
          isOpen={!!selectedTray}
          onClose={() => {
            setSelectedTray(null)
            setSelectedContainer(null)
          }}
          trayAddress={selectedTray}
          components={components.filter(c => 
            c.container_id === selectedContainer.id && 
            c.tray_address === selectedTray
          )}
          containerName={selectedContainer.name}
          containerId={selectedContainer.id}
        />
      )}
    </div>
  )
}
