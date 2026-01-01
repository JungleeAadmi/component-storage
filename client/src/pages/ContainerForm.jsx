import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Box, Save, ArrowLeft, Minus, Camera, X } from 'lucide-react';
import api from '../services/api';
import CameraCapture from '../components/CameraCapture';

const ContainerForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null); // File object
  const [previewUrl, setPreviewUrl] = useState('');
  const [existingImageUrl, setExistingImageUrl] = useState('');

  const [sections, setSections] = useState([
    { name: 'Tray 1', rows: 6, cols: 5 }
  ]);

  useEffect(() => {
    if (id) {
      setIsEditMode(true);
      api.get(`/inventory/containers/${id}`)
        .then(({ data }) => {
          setName(data.name);
          setDescription(data.description || '');
          setExistingImageUrl(data.image_url || '');
          
          if (data.sections && data.sections.length > 0) {
            setSections(data.sections.map(s => ({
              id: s.id, 
              name: s.name,
              rows: s.rows,
              cols: s.cols
            })));
          }
        })
        .catch(err => console.error(err));
    }
  }, [id]);

  const handleCapture = (file) => {
    setImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setShowCamera(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const addSection = () => {
    const nextNum = sections.length + 1;
    setSections([...sections, { name: `Tray ${nextNum}`, rows: 6, cols: 5 }]);
  };

  const removeSection = (index) => {
    if (isEditMode && sections[index].id) {
      alert("Cannot delete existing trays in this version to prevent data loss.");
      return;
    }
    const newSections = sections.filter((_, i) => i !== index);
    setSections(newSections);
  };

  const updateSection = (index, field, value) => {
    const newSections = [...sections];
    newSections[index][field] = value;
    setSections(newSections);
  };

  const handleStepper = (index, field, delta) => {
    const currentVal = sections[index][field];
    const newVal = Math.max(1, currentVal + delta);
    updateSection(index, field, newVal);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('config', JSON.stringify(sections));
    
    if (image) {
      formData.append('image', image);
    }

    try {
      if (isEditMode) {
        await api.put(`/inventory/containers/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/inventory/containers', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      navigate('/'); 
    } catch (error) {
      console.error(error);
      alert("Error saving container");
    } finally {
      setLoading(false);
    }
  };

  const displayImage = previewUrl || existingImageUrl;

  return (
    <div className="max-w-2xl mx-auto pb-20">
      {showCamera && (
        <CameraCapture 
          onCapture={handleCapture} 
          onClose={() => setShowCamera(false)} 
        />
      )}

      <div className="flex items-center space-x-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 bg-dark-800 rounded-lg hover:bg-dark-700 text-gray-400 hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-white">{isEditMode ? 'Edit Storage' : 'New Storage'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Image Upload Section */}
        <div className="flex flex-col items-center justify-center space-y-4 bg-dark-800 p-6 rounded-2xl border border-dark-700">
          <div className="w-full h-48 bg-dark-900 rounded-xl border border-dark-700 overflow-hidden flex items-center justify-center relative">
            {displayImage ? (
              <img src={displayImage} className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center text-gray-600">
                <Box size={48} className="mb-2 opacity-50" />
                <span className="text-xs">No Storage Image</span>
              </div>
            )}
          </div>
          
          <div className="flex space-x-3 w-full justify-center">
            <button 
              type="button"
              onClick={() => setShowCamera(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg flex items-center space-x-2 text-sm"
            >
              <Camera size={16} /> <span>Camera</span>
            </button>
            <label className="px-4 py-2 bg-dark-900 text-gray-300 rounded-lg border border-dark-700 flex items-center space-x-2 text-sm cursor-pointer hover:bg-dark-700">
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              <span>Upload Photo</span>
            </label>
          </div>
        </div>

        <div className="bg-dark-800 p-6 rounded-2xl border border-dark-700 space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
            <Box size={20} className="text-primary-500" />
            <span>Details</span>
          </h2>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Name (e.g. Red Cabinet)</label>
            <input 
              required
              type="text" 
              className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:outline-none focus:border-primary-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <textarea 
              className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:outline-none focus:border-primary-500 h-24 resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-lg font-semibold text-white">Configuration</h2>
            <button 
              type="button"
              onClick={addSection}
              className="text-sm bg-dark-800 hover:bg-dark-700 text-primary-400 hover:text-primary-300 px-3 py-1.5 rounded-lg border border-dark-700 transition-colors flex items-center space-x-1"
            >
              <Plus size={16} />
              <span>Add Section</span>
            </button>
          </div>

          <AnimatePresence>
            {sections.map((section, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-dark-800 p-5 rounded-2xl border border-dark-700 relative group"
              >
                {/* Delete Button */}
                {(!isEditMode || !section.id) && sections.length > 1 && (
                  <button 
                    type="button"
                    onClick={() => removeSection(index)}
                    className="absolute top-4 right-4 text-dark-700 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs uppercase tracking-wide text-gray-500 font-bold mb-1">Name</label>
                    <input 
                      required
                      type="text" 
                      className="w-full bg-dark-900 border border-dark-700 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-primary-500"
                      value={section.name}
                      onChange={(e) => updateSection(index, 'name', e.target.value)}
                    />
                  </div>

                  {['rows', 'cols'].map(field => (
                    <div key={field}>
                        <label className="block text-xs uppercase tracking-wide text-gray-500 font-bold mb-1">
                            {field === 'rows' ? 'Rows' : 'Cols'}
                        </label>
                        <div className="flex items-center space-x-2">
                            <button 
                                type="button"
                                disabled={isEditMode && section.id}
                                onClick={() => handleStepper(index, field, -1)}
                                className="p-2 bg-dark-900 rounded-lg text-gray-400 hover:text-white disabled:opacity-30"
                            >
                                <Minus size={16} />
                            </button>
                            <div className="flex-1 bg-dark-900 rounded-lg p-2 text-center text-white text-sm font-mono border border-dark-700">
                                {section[field]}
                            </div>
                            <button 
                                type="button"
                                disabled={isEditMode && section.id}
                                onClick={() => handleStepper(index, field, 1)}
                                className="p-2 bg-dark-900 rounded-lg text-gray-400 hover:text-white disabled:opacity-30"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary-600/20 flex items-center justify-center space-x-2 transition-all"
        >
          {loading ? (
             <span className="animate-pulse">Saving...</span>
          ) : (
            <>
              <Save size={20} />
              <span>{isEditMode ? 'Update Storage' : 'Create Storage'}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default ContainerForm;