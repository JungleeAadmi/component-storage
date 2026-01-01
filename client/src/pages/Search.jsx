import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search as SearchIcon, ArrowRight, Package } from 'lucide-react';
import api from '../services/api';

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [term, setTerm] = useState(query || '');

  const handleSearch = async (text) => {
    if (!text) {
        setResults([]);
        return;
    }
    setLoading(true);
    try {
      const { data } = await api.get(`/inventory/search?q=${text}`);
      setResults(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (query) {
        handleSearch(query);
    }
  }, [query]);

  // Instant search handler
  const handleInput = (e) => {
    const val = e.target.value;
    setTerm(val);
    handleSearch(val);
  };

  return (
    <div className="pb-20">
      <h1 className="text-2xl font-bold text-white mb-6">Search Inventory</h1>
      
      <div className="mb-8 relative">
        <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
        <input 
          type="text" 
          placeholder="Type to search..." 
          className="w-full bg-dark-800 border border-dark-700 rounded-xl pl-12 p-4 text-white focus:outline-none focus:border-primary-500"
          value={term}
          onChange={handleInput}
          autoFocus
        />
      </div>

      <div className="space-y-4">
        {loading ? (
            <div className="text-center text-gray-500">Searching...</div>
        ) : results.length === 0 && term ? (
            <div className="text-center text-gray-500">No results found</div>
        ) : (
            results.map(item => (
                <div key={item.id} className="bg-dark-800 p-4 rounded-xl border border-dark-700 flex items-center space-x-4">
                    <div className="w-12 h-12 bg-dark-900 rounded-lg overflow-hidden flex-shrink-0">
                        {item.image_url ? (
                            <img src={item.image_url} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-600">
                                <Package size={20} />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-white font-bold truncate">{item.name}</h3>
                        <p className="text-xs text-gray-400 truncate">
                            {item.container_name} &gt; {item.section_name} &gt; <span className="text-primary-400 font-mono">{item.grid_position}</span>
                        </p>
                    </div>
                    
                    {/* Updated Link: Passes highlight param */}
                    <Link 
                        to={`/tray/${item.section_id}?highlight=${item.grid_position}`} 
                        className="p-2 bg-dark-700 rounded-lg text-white hover:bg-primary-600 transition-colors"
                    >
                        <ArrowRight size={16} />
                    </Link>
                </div>
            ))
        )}
      </div>
    </div>
  );
};

export default Search;