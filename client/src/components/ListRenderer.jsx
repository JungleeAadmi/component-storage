import { Package, Trash2, Edit2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const ListItem = ({ component, onDelete, onEdit }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative group">
      <div 
        onClick={() => setShowMenu(!showMenu)}
        className="bg-dark-800 p-4 rounded-xl border border-dark-700 flex items-center space-x-4 cursor-pointer hover:border-primary-500/50 transition-all"
      >
        <div className="w-12 h-12 bg-dark-900 rounded-lg overflow-hidden flex-shrink-0">
            {component.image_url ? (
                <img src={component.image_url} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600">
                    <Package size={20} />
                </div>
            )}
        </div>
        <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold truncate">{component.name}</h3>
            <p className="text-xs text-gray-400">Qty: {component.quantity}</p>
        </div>
      </div>

      {/* Context Menu Overlay */}
      <AnimatePresence>
        {showMenu && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute right-0 top-full mt-2 z-20 bg-dark-800 border border-dark-600 rounded-xl shadow-xl overflow-hidden min-w-[120px]"
          >
            <button 
              onClick={() => onEdit(component.id)}
              className="flex items-center w-full px-4 py-3 text-sm text-white hover:bg-dark-700"
            >
              <Edit2 size={16} className="mr-2" /> Edit
            </button>
            <button 
              onClick={() => onDelete(component.id)}
              className="flex items-center w-full px-4 py-3 text-sm text-red-500 hover:bg-dark-700"
            >
              <Trash2 size={16} className="mr-2" /> Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Click outside closer helper would be good here, but for simplicity, we use toggle */}
      {showMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
      )}
    </div>
  );
};

const ListRenderer = ({ section, components = [], onUpdate }) => {
  const navigate = useNavigate();

  const handleDelete = async (componentId) => {
    if (window.confirm('Delete this item?')) {
      try {
        await api.delete(`/inventory/components/${componentId}`);
        if (onUpdate) onUpdate();
      } catch (error) {
        console.error("Delete failed", error);
      }
    }
  };

  const handleEdit = (componentId) => {
    navigate(`/component/${componentId}?edit=true`);
  };

  const handleAdd = () => {
    // Navigate to add component with 'list' flag or just empty pos
    navigate(`/add-component?section=${section.id}`);
  };

  return (
    <div className="pb-20">
      {/* Add Button */}
      <button 
        onClick={handleAdd}
        className="w-full mb-4 bg-dark-800 hover:bg-dark-700 border border-dashed border-dark-600 text-gray-400 hover:text-white p-4 rounded-xl flex items-center justify-center space-x-2 transition-all"
      >
        <Plus size={20} />
        <span>Add Item to {section.name}</span>
      </button>

      <div className="grid gap-3">
        {components.map(comp => (
            <ListItem 
                key={comp.id} 
                component={comp} 
                onDelete={handleDelete}
                onEdit={handleEdit}
            />
        ))}
        {components.length === 0 && (
            <div className="text-center text-gray-600 py-10 italic">
                No items in this storage unit yet.
            </div>
        )}
      </div>
    </div>
  );
};

export default ListRenderer;