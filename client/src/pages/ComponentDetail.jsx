import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { Camera, Save, ArrowLeft, Link as LinkIcon, Edit2, X, ZoomIn } from 'lucide-react';
import api from '../services/api';
import CameraCapture from '../components/CameraCapture';
import { motion, AnimatePresence } from 'framer-motion';

const ComponentDetail = () => {
  const [searchParams] = useSearchParams();
  const { id } = useParams();
  const navigate = useNavigate();

  const sectionId = searchParams.get('section');
  const pos = searchParams.get('pos');
  const isEditModeParam = searchParams.get('edit') === 'true';

  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isEditing, setIsEditing] = useState(!id || isEditModeParam);
  const [showImageZoom, setShowImageZoom] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    quantity: 1,
    specification: '',
    purchase_link: '',
    custom_data: '',
    image: null
  });
  const [previewUrl, setPreviewUrl] = useState('');
  const [existingImageUrl, setExistingImageUrl] = useState('');

  useEffect(() => {
    if (id) {
      const fetchComponent = async () => {
        try {
          const { data } = await api.get(`/inventory/components/${id}`);
          setFormData({
            name: data.name,
            quantity: data.quantity,
            specification: data.specification || '',
            purchase_link: data.purchase_link || '',
            custom_data: data.custom_data?.notes || '',
            image: null
          });
          setExistingImageUrl(data.image_url);
        } catch (error) {
          console.error("Fetch error", error);
        }
      };
      fetchComponent();
    }
  }, [id]);

  const handleCapture = (file) => {
    setFormData({ ...formData, image: file });
    setPreviewUrl(URL.createObjectURL(file));
    setShowCamera(false);
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
    if (sectionId) data.append('section_id', sectionId);
    if (pos) data.append('grid_position', pos);
    
    data.append('name', formData.name);
    data.append('quantity', formData.quantity);
    data.append('specification', formData.specification);
    data.append('purchase_link', formData.purchase_link);
    data.append('custom_data', JSON.stringify({ notes: formData.custom_data }));
    if (formData.image) {
      data.append('image', formData.image);
    }

    try {
      if (id) {
        await api.put(`/inventory/components/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
        setIsEditing(false);
      } else {
        await api.post('/inventory/components', data, { headers: { 'Content-Type': 'multipart/form-data' } });
        navigate(-1);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const displayImage = previewUrl || existingImageUrl;

  return (
    <div className="max-w-xl mx-auto pb-20">
      {showCamera && (
        <CameraCapture 
          onCapture={handleCapture} 
          onClose={() => setShowCamera(false)} 
        />
      )}

      <AnimatePresence>
        {showImageZoom && displayImage && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[80] bg-black flex items-center justify-center p-2"
                onClick={() => setShowImageZoom(false)}
            >
                <button className="absolute top-4 right-4 text-white p-2 bg-white/20 rounded-full">
                    <X size={24} />
                </button>
                <img src={displayImage} className="max-w-full max-h-full object-contain" />
            </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
            <button onClick={() => navigate(-1)} className="p-2 bg-dark-800 rounded-lg hover:text-white text-gray-400">
            <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold text-white">
            {isEditing ? (id ? 'Edit Component' : 'Add Component') : 'Details'}
            </h1>
        </div>
        {!isEditing && (
            <button 
                onClick={() => setIsEditing(true)}
                className="p-2 bg-primary-600 rounded-lg text-white shadow-lg"
            >
                <Edit2 size={20} />
            </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div 
            className="w-full aspect-video bg-dark-800 rounded-2xl border border-dark-700 overflow-hidden flex items-center justify-center relative group"
            onClick={() => displayImage && setShowImageZoom(true)}
          >
            {displayImage ? (
              <>
                <img src={displayImage} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                    <ZoomIn className="text-white" size={32} />
                </div>
              </>
            ) : (
              <span className="text-gray-600 text-xs">No Image</span>
            )}
          </div>
          
          {isEditing && (
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
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Name</label>
            {isEditing ? (
                <input 
                required
                type="text" 
                className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:outline-none focus:border-primary-500"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                />
            ) : (
                <div className="text-xl font-bold text-white">{formData.name}</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Quantity</label>
              {isEditing ? (
                  <input 
                    type="number" 
                    className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:outline-none focus:border-primary-500"
                    value={formData.quantity}
                    onChange={e => setFormData({...formData, quantity: e.target.value})}
                  />
              ) : (
                  <div className="text-lg text-white font-mono">{formData.quantity}</div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Specifications</label>
            {isEditing ? (
                <textarea 
                className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:outline-none focus:border-primary-500 h-24"
                value={formData.specification}
                onChange={e => setFormData({...formData, specification: e.target.value})}
                />
            ) : (
                <div className="text-gray-300 whitespace-pre-wrap">{formData.specification || "N/A"}</div>
            )}
          </div>

          {formData.purchase_link && (
            <div>
                <label className="block text-sm text-gray-400 mb-1">Link</label>
                {isEditing ? (
                    <input 
                    type="url" 
                    className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white"
                    value={formData.purchase_link}
                    onChange={e => setFormData({...formData, purchase_link: e.target.value})}
                    />
                ) : (
                    <a href={formData.purchase_link} target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:underline flex items-center space-x-1">
                        <LinkIcon size={14} /> <span>Open Link</span>
                    </a>
                )}
            </div>
          )}
        </div>

        {isEditing && (
            <button 
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary-600/20 flex items-center justify-center space-x-2"
            >
            {loading ? 'Saving...' : <><Save size={20} /><span>Save Changes</span></>}
            </button>
        )}
      </form>
    </div>
  );
};

export default ComponentDetail;