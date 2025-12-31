import { Link } from 'react-router-dom';
import { Box, Layers } from 'lucide-react';
import { motion } from 'framer-motion';

const ContainerCard = ({ container }) => {
  return (
    <Link to={`/container/${container.id}`}>
      <motion.div 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="bg-dark-800 p-5 rounded-2xl border border-dark-700 hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-500/10 transition-all cursor-pointer group"
      >
        <div className="flex flex-col items-center text-center space-y-3">
          {/* Icon Circle */}
          <div className="w-16 h-16 bg-dark-900 rounded-full flex items-center justify-center group-hover:bg-primary-600/10 transition-colors">
            <Box size={32} className="text-gray-400 group-hover:text-primary-500 transition-colors" />
          </div>
          
          {/* Text Info */}
          <div>
            <h3 className="text-white font-semibold text-lg truncate w-full max-w-[150px]">
              {container.name}
            </h3>
            <div className="flex items-center justify-center space-x-1 text-xs text-gray-500 mt-1">
              <Layers size={12} />
              <span>
                 {/* Safely handle if sections are not joined yet */}
                 {container.sections ? container.sections.length : 0} Sections
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default ContainerCard;