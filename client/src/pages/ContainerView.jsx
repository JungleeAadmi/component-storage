import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Layers, ArrowRight, Box, X, ZoomIn } from 'lucide-react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const ContainerView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [container, setContainer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showImageZoom, setShowImageZoom] = useState(false);

  useEffect(() => {
    const fetchContainer = async () => {
      try {
        const { data } = await api.get(`/inventory/containers/${id}`);
        setContainer(data);
      } catch (error) {
        console.error("Error", error);
      } finally {
        setLoading(false);
      }
    };
    fetchContainer();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading storage unit...</div>;
  if (!container) return <div className="p-8 text-center text-red-500">Container not found</div>;

  return (
    <div>
      {/* Image Zoom Modal */}
      <AnimatePresence>
        {showImageZoom && container.image_url && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[80] bg-black flex items-center justify-center p-2"
                onClick={() => setShowImageZoom(false)}
            >
                <button className="absolute top-4 right-4 text-white p-2 bg-white/20 rounded-full">
                    <X size={24} />
                </button>
                {/* For true pinch-to-zoom on mobile, a library like react-zoom-pan-pinch 
                  is recommended. For now, we'll use a simple full-screen image 
                  which native mobile browsers often allow zooming on.
                */}
                <img src={container.image_url} className="max-w-full max-h-full object-contain" alt={container.name} />
            </motion.div>
        )}
      </AnimatePresence>

      {/* Header with Image */}
      <div className="flex items-start justify-between mb-8 bg-dark-800 p-4 rounded-2xl border border-dark-700">
        <div className="flex items-start space-x-4 flex-1">
          <button onClick={() => navigate(-1)} className="p-2 bg-dark-900 rounded-lg text-gray-400 hover:text-white shrink-0 mt-1">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">{container.name}</h1>
            <p className="text-gray-400 text-sm whitespace-pre-wrap">{container.description || "No description"}</p>
          </div>
        </div>

        {/* Container Image */}
        <div 
          className="w-24 h-24 sm:w-32 sm:h-32 bg-dark-900 rounded-xl border border-dark-700 overflow-hidden flex items-center justify-center relative group cursor-pointer ml-4 shrink-0"
          onClick={() => container.image_url && setShowImageZoom(true)}
        >
          {container.image_url ? (
            <>
              <img src={container.image_url} alt={container.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <ZoomIn className="text-white" size={24} />
              </div>
            </>
          ) : (
            <Box size={32} className="text-dark-600 opacity-50" />
          )}
        </div>
      </div>

      {/* QR Code Card (Visual Only) */}
      <div className="bg-white p-4 rounded-xl w-fit mx-auto mb-8 hidden md:block">
        <QRCodeSVG value={`${window.location.origin}/container/${container.id}`} size={128} />
        <p className="text-black text-xs text-center mt-2 font-bold">{container.name}</p>
      </div>

      {/* Sections List */}
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
        <Layers size={18} />
        <span>Trays & Drawers</span>
      </h2>

      <div className="grid gap-4">
        {container.sections && container.sections.map(section => (
          <Link to={`/tray/${section.id}`} key={section.id}>
            <div className="bg-dark-800 p-5 rounded-xl border border-dark-700 hover:border-primary-500 transition-all flex justify-between items-center group">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-dark-900 rounded-lg flex items-center justify-center text-xl font-bold text-gray-500 group-hover:text-primary-500">
                  {section.designation_char}
                </div>
                <div>
                  <h3 className="text-white font-bold">{section.name}</h3>
                  <p className="text-sm text-gray-500">
                    Configuration: {section.rows} × {section.cols} Grid
                  </p>
                </div>
              </div>
              <ArrowRight size={20} className="text-gray-600 group-hover:text-primary-500" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ContainerView;