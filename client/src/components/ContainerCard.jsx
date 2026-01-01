import { useNavigate } from 'react-router-dom';
import { Trash2, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useLongPress from '../hooks/useLongPress';
import { useState } from 'react';
import api from '../services/api';

const ContainerVisualizer = ({ sections }) => {
  if (!sections || sections.length === 0) {
    return <div className="w-full h-full bg-dark-800 rounded flex items-center justify-center text-[8px] text-gray-600">Empty</div>;
  }

  // Calculate total rows to distribute height proportionally
  const totalRows = sections.reduce((acc, s) => acc + (s.rows || 1), 0);

  return (
    <div className="w-full h-full flex flex-col gap-[2px] p-[4px]">
      {sections.map((section, idx) => {
        // Calculate relative height percentage, min 10%
        const heightPercent = Math.max((section.rows / totalRows) * 100, 10);
        
        return (
          <div 
            key={idx} 
            className="w-full border border-primary-500/30 bg-primary-900/10 rounded-[2px] overflow-hidden flex flex-col"
            style={{ height: `${heightPercent}%` }}
          >
            {/* Mini Grid Representation */}
            <div 
                className="w-full h-full grid gap-[1px] content-stretch"
                style={{ 
                    gridTemplateColumns: `repeat(${Math.min(section.cols, 8)}, 1fr)`, // Cap cols at 8 for visual sanity
                    gridTemplateRows: `repeat(${Math.min(section.rows, 8)}, 1fr)` 
                }}
            >
                {/* Render only enough cells to fill the visual, capped at 20 to prevent DOM overload */}
                {Array.from({ length: Math.min(section.rows * section.cols, 20) }).map((_, i) => (
                    <div key={i} className="bg-primary-500/20 rounded-[1px]"></div>
                ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

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
        className="bg-dark-800 p-4 rounded-2xl border border-dark-700 hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-500/10 transition-all cursor-pointer h-full flex flex-col items-center"
      >
        {/* Dynamic Icon Container */}
        <div className="w-16 h-16 mb-3 bg-dark-900 rounded-lg border border-dark-600 overflow-hidden shadow-inner">
             <ContainerVisualizer sections={container.sections} />
        </div>
        
        {/* Text Info */}
        <div className="text-center w-full">
          <h3 className="text-white font-semibold text-sm sm:text-base truncate w-full px-1">
            {container.name || 'Untitled'}
          </h3>
          {/* Section count removed as requested */}
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