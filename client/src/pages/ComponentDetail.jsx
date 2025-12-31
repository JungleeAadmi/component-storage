import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { Camera, Save, ArrowLeft, Trash2, Link as LinkIcon } from 'lucide-react';
import api from '../services/api';
import CameraCapture from '../components/CameraCapture';

const ComponentDetail = () => {
  const [searchParams] = useSearchParams();
  const { id } = useParams(); // If editing
  const navigate = useNavigate();

  // Params from URL (for new component)
  const sectionId = searchParams.get('section');
  const pos = searchParams.get('pos');

  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  
  // Form Data
  const [formData, setFormData] = useState({
    name: '',
    quantity: 1,
    specification: '',
    purchase_link: '',
    custom_data: '', // Text area for now
    image: null // File object
  });
  const [previewUrl, setPreviewUrl] = useState('');

  // Load if editing
  // Note: For simplicity in this prompt, I'm focusing on "Add". 
  // Editing uses similar logic but GETs data first.

  const handleCapture = (file) => {
    setFormData({ ...formData, image: file });
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    data.append('section_id', sectionId || 0); // Need logic for edit
    data.append('grid_position', pos || '');
    data.append('name', formData.name);
    data.append('quantity', formData.quantity);
    data.append('specification', formData.specification);
    data.append('purchase_link', formData.purchase_link);
    data.append('custom_data', JSON.stringify({ notes: formData.custom_data }));
    if (formData.image) {
      data.append('image', formData.image);
    }

    try {
      // POST to create. (PUT for update not implemented in this snippet to save space)
      await api.post('/inventory/components', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      navigate(-1);
    } catch (error) {
      console.error(error);
      alert('Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto pb-20">
      {showCamera && (
        <CameraCapture 
          onCapture={handleCapture} 
          onClose={() => setShowCamera(false)} 
        />
      )}

      <div className="flex items-center space-x-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 bg-dark-800 rounded-lg hover:text-white text-gray-400">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-white">
          {id ? 'Edit Component' : 'Add Component'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Section */}
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-32 h-32 bg-dark-800 rounded-2xl border border-dark-700 overflow-hidden flex items-center justify-center relative">
            {previewUrl ? (
              <img src={previewUrl} className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-600 text-xs">No Image</span>
            )}
          </div>
          <div className="flex space-x-3">
            <button 
              type="button"
              onClick={() => setShowCamera(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg flex items-center space-x-2 text-sm"
            >
              <Camera size={16} /> <span>Camera</span>
            </button>
            <label className="px-4 py-2 bg-dark-800 text-gray-300 rounded-lg border border-dark-700 flex items-center space-x-2 text-sm cursor-pointer hover:bg-dark-700">
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              <span>Upload</span>
            </label>
          </div>
        </div>

        {/* Location Info */}
        <div className="bg-dark-800 p-4 rounded-xl border border-dark-700 text-sm text-gray-400 flex justify-between">
            <span>Location:</span>
            <span className="text-white font-mono">{pos}</span>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Component Name</label>
            <input 
              required
              type="text" 
              className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:outline-none focus:border-primary-500"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Quantity</label>
              <input 
                type="number" 
                className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:outline-none focus:border-primary-500"
                value={formData.quantity}
                onChange={e => setFormData({...formData, quantity: e.target.value})}
              />
            </div>
             {/* Threshold field could go here */}
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Specifications</label>
            <textarea 
              className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:outline-none focus:border-primary-500 h-20"
              value={formData.specification}
              onChange={e => setFormData({...formData, specification: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Purchase Link</label>
            <div className="flex bg-dark-900 border border-dark-700 rounded-xl overflow-hidden">
                <div className="p-3 text-gray-500 bg-dark-800 border-r border-dark-700">
                    <LinkIcon size={16} />
                </div>
                <input 
                type="url" 
                className="w-full bg-transparent p-3 text-white focus:outline-none"
                placeholder="https://..."
                value={formData.purchase_link}
                onChange={e => setFormData({...formData, purchase_link: e.target.value})}
                />
            </div>
          </div>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary-600/20 flex items-center justify-center space-x-2"
        >
           {loading ? 'Saving...' : <><Save size={20} /><span>Save Component</span></>}
        </button>
      </form>
    </div>
  );
};

export default ComponentDetail;