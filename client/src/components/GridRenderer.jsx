import { Package, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GridRenderer = ({ section, components = [] }) => {
  const navigate = useNavigate();

  // Helper to calculate "A-1A" style IDs
  const getCellId = (row, col) => {
    // Row is 1-based, Col is 0-based index converted to Letter
    const colLetter = String.fromCharCode(65 + col); // 0=A, 1=B
    return `${section.designation_char}-${row}${colLetter}`;
  };

  const getComponentInCell = (cellId) => {
    return components.find(c => c.grid_position === cellId);
  };

  const handleCellClick = (cellId, component) => {
    if (component) {
      navigate(`/component/${component.id}`);
    } else {
      navigate(`/add-component?section=${section.id}&pos=${cellId}`);
    }
  };

  if (!section) return null;

  return (
    <div 
      className="grid gap-2 overflow-x-auto pb-4 select-none"
      style={{ 
        gridTemplateColumns: `repeat(${section.cols}, minmax(80px, 1fr))` 
      }}
    >
      {Array.from({ length: section.rows }).map((_, rowIndex) => (
        Array.from({ length: section.cols }).map((_, colIndex) => {
          const rowNum = rowIndex + 1;
          const cellId = getCellId(rowNum, colIndex);
          const component = getComponentInCell(cellId);
          
          return (
            <div 
              key={cellId}
              onClick={() => handleCellClick(cellId, component)}
              className={`
                aspect-square rounded-xl border flex flex-col items-center justify-center p-2 cursor-pointer transition-all relative overflow-hidden group
                ${component 
                  ? 'bg-dark-800 border-primary-500/50 hover:bg-dark-700 hover:shadow-lg hover:shadow-primary-500/10' 
                  : 'bg-dark-900 border-dark-700 hover:border-gray-500 border-dashed'}
              `}
            >
              {/* Position Label (Top Left) */}
              <span className="absolute top-1 left-2 text-[10px] font-mono text-gray-500 opacity-50 group-hover:opacity-100 transition-opacity">
                {cellId}
              </span>

              {component ? (
                <>
                  {component.image_url ? (
                    <img src={component.image_url} alt="" className="w-10 h-10 object-cover rounded-md mb-1 bg-dark-900" />
                  ) : (
                    <Package size={24} className="text-primary-400 mb-1" />
                  )}
                  <span className="text-xs text-white font-bold truncate w-full text-center px-1">
                    {component.name}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    Qty: {component.quantity}
                  </span>
                </>
              ) : (
                <Plus size={20} className="text-dark-700 group-hover:text-gray-400 transition-colors" />
              )}
            </div>
          );
        })
      ))}
    </div>
  );
};

export default GridRenderer;