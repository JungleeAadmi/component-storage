import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Box, Save, ArrowLeft } from 'lucide-react';
import api from '../services/api';

const ContainerForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  
  // Dynamic Sections State
  const [sections, setSections] = useState([
    { name: 'Tray 1', rows: 6, cols: 5 } // Default first tray
  ]);

  const addSection = () => {
    const nextNum = sections.length + 1;
    setSections([...sections, { name: `Tray ${nextNum}`, rows: 6, cols: 5 }]);
  };

  const removeSection = (index) => {
    const newSections = sections.filter((_, i) => i !== index);
    setSections(newSections);
  };

  const updateSection = (index, field, value) => {
    const newSections = [...sections];
    newSections[index][field] = value;
    setSections(newSections);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/inventory/containers', {
        name,
        description,
        config: sections
      });
      navigate('/'); // Go back to dashboard on success
    } catch (error) {
      console.error("Failed to create container", error);
      alert("Error creating container");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 bg-dark-800 rounded-lg hover:bg-dark-700 text-gray-400 hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-white">New Storage Unit</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Basic Info Card */}
        <div className="bg-dark-800 p-6 rounded-2xl border border-dark-700 space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
            <Box size={20} className="text-primary-500" />
            <span>Container Details</span>
          </h2>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Name (e.g., Red Cabinet)</label>
            <input 
              required
              type="text" 
              className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:outline-none focus:border-primary-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Description (Optional)</label>
            <textarea 
              className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:outline-none focus:border-primary-500 h-24 resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Sections Configuration */}
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
                exit={{ opacity: 0, height: 0 }}
                className="bg-dark-800 p-5 rounded-2xl border border-dark-700 relative group"
              >
                {/* Remove Button */}
                {sections.length > 1 && (
                  <button 
                    type="button"
                    onClick={() => removeSection(index)}
                    className="absolute top-4 right-4 text-dark-700 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Section Name */}
                  <div className="md:col-span-2">
                    <label className="block text-xs uppercase tracking-wide text-gray-500 font-bold mb-1">
                      Section Name (Tray/Drawer)
                    </label>
                    <input 
                      required
                      type="text" 
                      className="w-full bg-dark-900 border border-dark-700 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-primary-500"
                      value={section.name}
                      onChange={(e) => updateSection(index, 'name', e.target.value)}
                    />
                  </div>

                  {/* Rows */}
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-gray-500 font-bold mb-1">
                      Rows (Horizontal)
                    </label>
                    <input 
                      required
                      type="number" min="1" max="20"
                      className="w-full bg-dark-900 border border-dark-700 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-primary-500"
                      value={section.rows}
                      onChange={(e) => updateSection(index, 'rows', parseInt(e.target.value) || 1)}
                    />
                  </div>

                  {/* Cols */}
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-gray-500 font-bold mb-1">
                      Columns (Vertical)
                    </label>
                    <input 
                      required
                      type="number" min="1" max="20"
                      className="w-full bg-dark-900 border border-dark-700 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-primary-500"
                      value={section.cols}
                      onChange={(e) => updateSection(index, 'cols', parseInt(e.target.value) || 1)}
                    />
                  </div>
                </div>

                {/* Visual Hint */}
                <div className="mt-3 text-xs text-gray-500 bg-dark-900/50 p-2 rounded border border-dashed border-dark-700 text-center">
                  Will generate {section.rows * section.cols} slots ({section.rows}x{section.cols})
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Submit Button */}
        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary-600/20 flex items-center justify-center space-x-2 transition-all"
        >
          {loading ? (
             <span className="animate-pulse">Creating...</span>
          ) : (
            <>
              <Save size={20} />
              <span>Create Storage Unit</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default ContainerForm;