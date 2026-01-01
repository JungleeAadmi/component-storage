import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Box, Save, ArrowLeft, Minus } from 'lucide-react';
import api from '../services/api';

const ContainerForm = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // If present, we are editing
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sections, setSections] = useState([
    { name: 'Tray 1', rows: 6, cols: 5 }
  ]);

  // Load data if editing
  useEffect(() => {
    if (id) {
      setIsEditMode(true);
      api.get(`/inventory/containers/${id}`)
        .then(({ data }) => {
          setName(data.name);
          setDescription(data.description || '');
          // Map existing sections
          if (data.sections && data.sections.length > 0) {
            setSections(data.sections.map(s => ({
              id: s.id, // Keep ID for update logic
              name: s.name,
              rows: s.rows,
              cols: s.cols
            })));
          }
        })
        .catch(err => console.error(err));
    }
  }, [id]);

  const addSection = () => {
    const nextNum = sections.length + 1;
    setSections([...sections, { name: `Tray ${nextNum}`, rows: 6, cols: 5 }]);
  };

  const removeSection = (index) => {
    // If editing, preventing deletion of existing sections is safer for v1, 
    // but user asked for edit capability. 
    // For now, we allow UI removal. Backend might ignore deletion if not explicitly handled, 
    // but in this simple implementation, we just send back the list we want.
    // Note: The backend update logic currently only updates names or adds new. 
    // Deleting sections via edit form is complex (orphan items). 
    // UI will allow removing ONLY new unsaved sections for safety.
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
    try {
      if (isEditMode) {
        await api.put(`/inventory/containers/${id}`, { name, description, config: sections });
      } else {
        await api.post('/inventory/containers', { name, description, config: sections });
      }
      navigate('/'); 
    } catch (error) {
      console.error(error);
      alert("Error saving container");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <div className="flex items-center space-x-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 bg-dark-800 rounded-lg hover:bg-dark-700 text-gray-400 hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-white">{isEditMode ? 'Edit Storage' : 'New Storage'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-dark-800 p-6 rounded-2xl border border-dark-700 space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
            <Box size={20} className="text-primary-500" />
            <span>Details</span>
          </h2>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Name</label>
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
                {/* Delete Button (Only for new sections in edit mode, or any in create mode) */}
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
                                disabled={isEditMode && section.id} // Disable changing grid size of existing trays
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