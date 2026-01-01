import { useNavigate } from 'react-router-dom';
import { Trash2, Edit2, Box } from 'lucide-react';
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

  const bind = useLongPress(handleLongPress, handleClick, { shouldPreventDefault: true });

  const handleDelete = async (e) => {
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
    <div className="relative group select-none h-full">
      <motion.div 
        {...bind}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="bg-dark-800 p-0 pb-4 rounded-2xl border border-dark-700 hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-500/10 transition-all cursor-pointer h-full flex flex-col items-center overflow-hidden"
      >
        {/* Full Image Cover */}
        <div className="w-full aspect-[4/3] bg-dark-900 border-b border-dark-700 overflow-hidden relative">
             {container.image_url ? (
                 <img 
                    src={container.image_url} 
                    alt={container.name} 
                    className="w-full h-full object-cover"
                 />
             ) : (
                 <div className="w-full h-full flex items-center justify-center bg-dark-800/50">
                    <Box size={40} className="text-dark-600" />
                 </div>
             )}
             
             {/* Gradient Overlay for Text Visibility */}
             <div className="absolute inset-0 bg-gradient-to-t from-dark-800 to-transparent opacity-50"></div>
        </div>
        
        {/* Text Info */}
        <div className="text-center w-full px-3 mt-3">
          <h3 className="text-white font-bold text-lg truncate w-full">
            {container.name || 'Untitled'}
          </h3>
        </div>
      </motion.div>

      {/* Menu Overlay */}
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