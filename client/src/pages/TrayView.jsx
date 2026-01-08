import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../services/api';
import GridRenderer from '../components/GridRenderer';
import ListRenderer from '../components/ListRenderer';

const TrayView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightPos = searchParams.get('highlight');

  const [section, setSection] = useState(null);
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const compRes = await api.get(`/inventory/sections/${id}/components`);
      setComponents(compRes.data);

      const sectionRes = await api.get(`/inventory/sections/${id}`);
      setSection(sectionRes.data);
      
    } catch (error) {
      console.error("Fetch error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-white">Loading...</div>;
  if (!section) return <div className="p-8 text-center text-red-500">Section not found</div>;

  return (
    <div className="pb-20">
      <div className="flex items-center space-x-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 bg-dark-800 rounded-lg text-gray-400 hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">{section.name}</h1>
          <p className="text-gray-400 text-xs">
            {section.config_type === 'list' 
                ? 'List Storage' 
                : `Tray ${section.designation_char} • ${section.rows}x${section.cols}`}
          </p>
        </div>
      </div>

      {section.config_type === 'list' ? (
        <ListRenderer 
            section={section}
            components={components}
            onUpdate={fetchData}
        />
      ) : (
        <GridRenderer 
            section={section} 
            components={components} 
            onUpdate={fetchData} 
            highlight={highlightPos} 
        />
      )}
    </div>
  );
};

export default TrayView;