import { useNavigate } from 'react-router-dom';
import { Box, Layers, Trash2, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useLongPress from '../hooks/useLongPress';
import { useState } from 'react';
import api from '../services/api';

const ContainerCard = ({ container, onUpdate }) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  if (!container) return null;

  const handleClick = () => {
    if (showMenu) {
      setShowMenu(false);
      return;
    }
    navigate(`/container/${container.id}`);
  };

  const handleLongPress = () => {
    setShowMenu(true);
  };

  // Bind hook to the inner card content ONLY
  const bind = useLongPress(handleLongPress, handleClick, { shouldPreventDefault: true });

  const handleDelete = async (e) => {
    // e.stopPropagation is redundant if we are outside, but good practice
    if (window.confirm(`Delete container "${container.name}" and all contents?`)) {
      try {
        await api.delete(`/inventory/containers/${container.id}`);
        setShowMenu(false);
        if (onUpdate) onUpdate();
      } catch (error) {
        console.error("Delete failed", error);
        alert("Failed to delete");
      }
    }
  };

  const handleEdit = () => {
    setShowMenu(false);
    navigate(`/edit-container/${container.id}`);
  };

  return (
    <div className="relative group select-none">
      {/* The Clickable Card Content */}
      <motion.div 
        {...bind}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="bg-dark-800 p-5 rounded-2xl border border-dark-700 hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-500/10 transition-all cursor-pointer h-full"
      >
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 bg-dark-900 rounded-full flex items-center justify-center group-hover:bg-primary-600/10 transition-colors">
            <Box size={32} className="text-gray-400 group-hover:text-primary-500 transition-colors" />
          </div>
          
          <div>
            <h3 className="text-white font-semibold text-lg truncate w-full max-w-[150px]">
              {container.name || 'Untitled'}
            </h3>
            <div className="flex items-center justify-center space-x-1 text-xs text-gray-500 mt-1">
              <Layers size={12} />
              <span>
                  {container.sections ? container.sections.length : 0} Sections
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* The Menu Overlay - Sibling to the card, so clicks don't bubble to 'bind' */}
      <AnimatePresence>
        {showMenu && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-dark-900/95 z-20 flex flex-col items-center justify-center space-y-3 rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-white font-bold mb-1">Options</div>
            
            <button 
              onClick={handleEdit}
              className="flex items-center space-x-2 text-sm text-white bg-dark-700 px-4 py-2 rounded-lg w-3/4 justify-center"
            >
              <Edit2 size={16} /> <span>Edit</span>
            </button>
            
            <button 
              onClick={handleDelete}
              className="flex items-center space-x-2 text-sm text-white bg-red-500 px-4 py-2 rounded-lg w-3/4 justify-center"
            >
              <Trash2 size={16} /> <span>Delete</span>
            </button>
            
            <button 
              onClick={() => setShowMenu(false)}
              className="text-xs text-gray-400 mt-2 underline"
            >
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ContainerCard;