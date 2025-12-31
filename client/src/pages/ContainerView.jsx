import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Layers, ArrowRight } from 'lucide-react';
import api from '../services/api';

const ContainerView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [container, setContainer] = useState(null);
  const [loading, setLoading] = useState(true);

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
      <div className="flex items-center space-x-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 bg-dark-800 rounded-lg text-gray-400 hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">{container.name}</h1>
          <p className="text-gray-400 text-sm">{container.description || "No description"}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl w-fit mx-auto mb-8 hidden md:block">
        <QRCodeSVG value={`${window.location.origin}/container/${container.id}`} size={128} />
        <p className="text-black text-xs text-center mt-2 font-bold">{container.name}</p>
      </div>

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