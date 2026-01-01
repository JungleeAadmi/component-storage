import { Package, Plus, Trash2, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useLongPress from '../hooks/useLongPress';
import { useState } from 'react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

// Separate component to safely handle hooks per cell
const GridCell = ({ cellId, component, onLongPress, onClick, activeMenu, setActiveMenu, onDelete, onEdit }) => {
  
  const bind = useLongPress(
    () => onLongPress(cellId, component),
    () => onClick(cellId, component)
  );

  return (
    <div 
      className={`
        aspect-square rounded-xl border flex flex-col items-center justify-center p-2 transition-all relative overflow-hidden group
        ${component 
          ? 'bg-dark-800 border-primary-500/50' 
          : 'bg-dark-900 border-dark-700 border-dashed'}
      `}
    >
       <div {...bind} className="relative h-full w-full flex flex-col items-center justify-center">
          <span className="absolute top-1 left-2 text-[10px] font-mono text-gray-500 opacity-50">
            {cellId}
          </span>

          {component ? (
            <>
              {component.image_url ? (
                <img src={component.image_url} alt="" className="w-10 h-10 object-cover rounded-md mb-1 bg-dark-900 pointer-events-none" />
              ) : (
                <Package size={24} className="text-primary-400 mb-1" />
              )}
              <span className="text-xs text-white font-bold truncate w-full text-center px-1">
                {component.name}
              </span>
            </>
          ) : (
            <div className="h-full w-full flex items-center justify-center">
                <Plus size={20} className="text-dark-700" />
            </div>
          )}
       </div>

       <AnimatePresence>
         {activeMenu === cellId && component && (
           <motion.div 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             exit={{ opacity: 0 }}
             className="absolute inset-0 bg-dark-900/95 z-20 flex flex-col items-center justify-center space-y-2"
             onClick={(e) => e.stopPropagation()} 
           >
             <button 
               onClick={() => onEdit(component.id)}
               className="flex items-center space-x-1 text-xs text-white bg-dark-700 px-3 py-1 rounded-lg"
             >
               <Edit2 size={12} /> <span>Edit</span>
             </button>
             <button 
               onClick={() => onDelete(component.id)}
               className="flex items-center space-x-1 text-xs text-white bg-red-500 px-3 py-1 rounded-lg"
             >
               <Trash2 size={12} /> <span>Clear</span>
             </button>
             <button 
               onClick={() => setActiveMenu(null)}
               className="text-[10px] text-gray-400 mt-1 underline"
             >
               Cancel
             </button>
           </motion.div>
         )}
       </AnimatePresence>
    </div>
  );
};

const GridRenderer = ({ section, components = [], onUpdate }) => {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState(null);

  const getCellId = (row, col) => {
    const colLetter = String.fromCharCode(65 + col);
    return `${section.designation_char}-${row}${colLetter}`;
  };

  const getComponentInCell = (cellId) => {
    return components.find(c => c.grid_position === cellId);
  };

  const handleClick = (cellId, component) => {
    if (activeMenu) {
      setActiveMenu(null); 
      return;
    }
    if (component) {
      navigate(`/component/${component.id}`);
    } else {
      navigate(`/add-component?section=${section.id}&pos=${cellId}`);
    }
  };

  const handleLongPress = (cellId, component) => {
    if (component) {
      setActiveMenu(cellId);
    }
  };

  const handleDelete = async (componentId) => {
    if (window.confirm('Are you sure you want to clear this item?')) {
      try {
        await api.delete(`/inventory/components/${componentId}`);
        setActiveMenu(null);
        if (onUpdate) onUpdate();
      } catch (error) {
        console.error("Delete failed", error);
      }
    }
  };

  const handleEdit = (componentId) => {
    navigate(`/component/${componentId}?edit=true`);
  };

  return (
    <div 
      className="grid gap-2 overflow-x-auto pb-4 select-none"
      style={{ gridTemplateColumns: `repeat(${section.cols}, minmax(80px, 1fr))` }}
    >
      {Array.from({ length: section.rows }).map((_, rowIndex) => (
        Array.from({ length: section.cols }).map((_, colIndex) => {
          const rowNum = rowIndex + 1;
          const cellId = getCellId(rowNum, colIndex);
          const component = getComponentInCell(cellId);
          
          return (
            <GridCell 
              key={cellId}
              cellId={cellId}
              component={component}
              onLongPress={handleLongPress}
              onClick={handleClick}
              activeMenu={activeMenu}
              setActiveMenu={setActiveMenu}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          );
        })
      ))}
    </div>
  );
};

export default GridRenderer;