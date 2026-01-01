import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Loader } from 'lucide-react';
import api from '../services/api';
import ContainerCard from '../components/ContainerCard';

const Dashboard = () => {
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchContainers = async () => {
    try {
      const { data } = await api.get('/inventory/containers');
      // Ensure data is an array before setting
      setContainers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch containers", error);
      setContainers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContainers();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">My Storage</h2>
        <Link 
          to="/add-container" 
          className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-all shadow-lg shadow-primary-600/20 active:scale-95"
        >
          <Plus size={20} />
          <span className="hidden sm:inline font-semibold">Add Container</span>
        </Link>
      </div>

      <div className="mb-8 relative">
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">
            <Search size={20} />
        </div>
        <input 
          type="text" 
          placeholder="Search components..." 
          className="w-full bg-dark-800 border border-dark-700 rounded-xl pl-12 p-4 text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all shadow-sm placeholder-gray-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
           <Link to={`/search?q=${searchTerm}`} className="absolute right-3 top-3 bg-dark-700 text-xs text-white px-2 py-1 rounded hover:bg-primary-600">
             Go
           </Link>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader className="animate-spin text-primary-500" size={32} />
        </div>
      ) : containers.length === 0 ? (
        <div className="bg-dark-800 p-8 rounded-2xl border border-dashed border-dark-700 flex flex-col items-center justify-center text-center h-64">
          <div className="w-16 h-16 bg-dark-900 rounded-full flex items-center justify-center mb-4">
            <Plus size={32} className="text-gray-600" />
          </div>
          <p className="text-gray-300 font-semibold mb-1">No containers yet</p>
          <p className="text-sm text-gray-500 max-w-xs mb-4">Start by adding your first storage unit.</p>
          <Link 
            to="/add-container"
            className="text-primary-400 hover:text-primary-300 font-semibold text-sm"
          >
            Create one now &rarr;
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {containers.map(container => (
            <ContainerCard 
                key={container.id} 
                container={container} 
                onUpdate={fetchContainers} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;