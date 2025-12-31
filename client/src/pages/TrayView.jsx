import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../services/api';
import GridRenderer from '../components/GridRenderer';

const TrayView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [section, setSection] = useState(null);
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const compRes = await api.get(`/inventory/sections/${id}/components`);
      setComponents(compRes.data);

      if (!section) {
        const containersRes = await api.get('/inventory/containers');
        for (const c of containersRes.data) {
            const detail = await api.get(`/inventory/containers/${c.id}`);
            const found = detail.data.sections.find(s => s.id == id);
            if (found) {
                setSection(found);
                break;
            }
        }
      }
    } catch (error) {
      console.error("Fetch error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-white">Loading Tray...</div>;
  if (!section) return <div className="p-8 text-center text-red-500">Tray not found</div>;

  return (
    <div className="pb-20">
      <div className="flex items-center space-x-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 bg-dark-800 rounded-lg text-gray-400 hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">{section.name}</h1>
          <p className="text-gray-400 text-xs">Tray {section.designation_char} • {section.rows}x{section.cols}</p>
        </div>
      </div>

      <GridRenderer 
        section={section} 
        components={components} 
        onUpdate={fetchData} 
      />
    </div>
  );
};

export default TrayView;