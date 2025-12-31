import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

const Dashboard = () => {
  return (
    <div>
      {/* Top Bar for Actions */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">My Storage</h2>
        <button className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-all shadow-lg shadow-primary-600/20">
          <Plus size={20} />
          <span>Add Container</span>
        </button>
      </div>

      {/* Search Bar Placeholder */}
      <div className="mb-8">
        <input 
          type="text" 
          placeholder="Search components, values, or locations..." 
          className="w-full bg-dark-800 border border-dark-700 rounded-xl p-4 text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all shadow-sm"
        />
      </div>

      {/* Empty State / Grid Placeholder */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* We will map containers here later */}
        <div className="bg-dark-800 p-6 rounded-2xl border border-dashed border-dark-700 flex flex-col items-center justify-center text-center h-48 opacity-50">
          <p className="text-gray-400">No containers yet</p>
          <span className="text-xs text-gray-500 mt-1">Click top right to add one</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;