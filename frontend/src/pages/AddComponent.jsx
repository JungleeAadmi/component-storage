import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { componentsAPI, containersAPI, uploadAPI } from '../services/api'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Package, Upload } from 'lucide-react'

export default function AddComponent() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState({
    name: '',
    quantity: 0,
    min_quantity: 0,
    category: '',
    custom_category: '',
    specifications: '',
    package_type: '',
    value: '',
    manufacturer: '',
    part_number: '',
    purchase_link: '',
    price: '',
    datasheet_url: '',
    notes: '',
    container_id: searchParams.get('container') || '',
    tray_address: searchParams.get('tray') || '',
  })

  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  const { data: containers = [] } = useQuery({
    queryKey: ['containers'],
    queryFn: containersAPI.getAll,
  })

  const createComponentMutation = useMutation({
    mutationFn: componentsAPI.create,
    onSuccess: async (data) => {
      // Upload image if selected
      if (imageFile) {
        try {
          await uploadAPI.uploadImage(imageFile, data.id)
        } catch (error) {
          console.error('Image upload failed:', error)
        }
      }
      queryClient.invalidateQueries(['components'])
      navigate('/components')
    },
  })

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    createComponentMutation.mutate(formData)
  }

  const categories = [
    'Resistors',
    'Capacitors',
    'Diodes',
    'Transistors',
    'ICs',
    'LEDs',
    'Sensors',
    'Modules',
    'Connectors',
    'Switches',
    'Relays',
    'Crystals',
    'Batteries',
    'Tools',
    'Other',
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
          Add Component
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          Register a new component in your inventory
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="card">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Component Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                required
                placeholder="e.g., 1N4007 Diode"
              />
            </div>

            <div>
              <label className="label">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value, custom_category: '' })}
                className="input"
              >
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {formData.category === 'Other' && (
              <div>
                <label className="label">Custom Category</label>
                <input
                  type="text"
                  value={formData.custom_category}
                  onChange={(e) => setFormData({ ...formData, custom_category: e.target.value })}
                  className="input"
                  placeholder="Enter custom category"
                />
              </div>
            )}

            <div>
              <label className="label">Value/Rating</label>
              <input
                type="text"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                className="input"
                placeholder="e.g., 10kΩ, 100µF 25V"
              />
            </div>

            <div>
              <label className="label">Package Type</label>
              <input
                type="text"
                value={formData.package_type}
                onChange={(e) => setFormData({ ...formData, package_type: e.target.value })}
                className="input"
                placeholder="e.g., DO-41, 0805 SMD"
              />
            </div>
          </div>
        </div>

        {/* Quantity */}
        <div className="card">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
            Quantity
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Current Quantity</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                className="input"
                min="0"
              />
            </div>
            <div>
              <label className="label">Minimum Quantity</label>
              <input
                type="number"
                value={formData.min_quantity}
                onChange={(e) => setFormData({ ...formData, min_quantity: parseInt(e.target.value) || 0 })}
                className="input"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="card">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
            Storage Location
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Storage Container</label>
              <select
                value={formData.container_id}
                onChange={(e) => setFormData({ ...formData, container_id: e.target.value })}
                className="input"
              >
                <option value="">No container</option>
                {containers.map(container => (
                  <option key={container.id} value={container.id}>
                    {container.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Tray Address</label>
              <input
                type="text"
                value={formData.tray_address}
                onChange={(e) => setFormData({ ...formData, tray_address: e.target.value })}
                className="input"
                placeholder="e.g., 1A, BIG-2C"
              />
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="card">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
            Additional Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Manufacturer</label>
              <input
                type="text"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                className="input"
                placeholder="e.g., Texas Instruments"
              />
            </div>
            <div>
              <label className="label">Part Number or SKU</label>
              <input
                type="text"
                value={formData.part_number}
                onChange={(e) => setFormData({ ...formData, part_number: e.target.value })}
                className="input"
                placeholder="e.g., 1N4007-TP"
              />
            </div>
            <div>
              <label className="label">Price per piece</label>
              <input
                type="text"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="input"
                placeholder="e.g., ₹5/10pcs"
              />
            </div>
            <div>
              <label className="label">Purchase Link</label>
              <input
                type="url"
                value={formData.purchase_link}
                onChange={(e) => setFormData({ ...formData, purchase_link: e.target.value })}
                className="input"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="label">Datasheet URL</label>
              <input
                type="url"
                value={formData.datasheet_url}
                onChange={(e) => setFormData({ ...formData, datasheet_url: e.target.value })}
                className="input"
                placeholder="https://..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">Specifications</label>
              <textarea
                value={formData.specifications}
                onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                className="input"
                rows="3"
                placeholder="Technical specifications..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input"
                rows="3"
                placeholder="Additional notes..."
              />
            </div>
          </div>
        </div>

        {/* Image Upload */}
        <div className="card">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
            Component Image
          </h2>
          <div className="flex items-start gap-6">
            {imagePreview && (
              <div className="w-32 h-32 border border-[var(--color-border)] rounded-lg overflow-hidden flex-shrink-0">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1">
              <label className="btn btn-secondary inline-flex items-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4" />
                Choose Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              <p className="text-sm text-[var(--color-text-secondary)] mt-2">
                Upload an image of the component (max 5MB)
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/components')}
            className="btn btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createComponentMutation.isPending}
            className="btn btn-primary flex-1 inline-flex items-center justify-center gap-2"
          >
            <Package className="w-4 h-4" />
            {createComponentMutation.isPending ? 'Adding...' : 'Add Component'}
          </button>
        </div>
      </form>
    </div>
  )
}
