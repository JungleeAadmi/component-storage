import { useAuth } from '../context/AuthContext';
import { User, LogOut, X, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="max-w-lg mx-auto pb-20">
      {/* Header with Close Button */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">My Profile</h1>
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 bg-dark-800 rounded-lg text-gray-400 hover:text-white hover:bg-dark-700 transition-colors"
        >
          <X size={24} />
        </button>
      </div>
      
      {/* Profile Card */}
      <div className="bg-dark-800 p-8 rounded-2xl border border-dark-700 flex flex-col items-center space-y-4 mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-primary-600/20 to-transparent"></div>
        
        <div className="w-24 h-24 bg-primary-600 rounded-2xl flex items-center justify-center text-4xl font-bold text-white mb-2 shadow-xl shadow-primary-600/20 z-10">
            {user?.username?.[0]?.toUpperCase()}
        </div>
        <div className="text-center z-10">
            <h2 className="text-xl font-bold text-white">{user?.full_name}</h2>
            <p className="text-gray-400 font-mono">@{user?.username}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-4">
        {/* Placeholder for future password change */}
        <div className="bg-dark-800 p-4 rounded-xl border border-dark-700 opacity-50 cursor-not-allowed flex items-center justify-between">
            <div>
                <h3 className="text-white font-semibold">Change Password</h3>
                <p className="text-xs text-gray-500">Feature coming soon</p>
            </div>
            <User size={20} className="text-gray-600" />
        </div>

        <button 
          onClick={logout}
          className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 p-4 rounded-xl flex items-center justify-center space-x-2 transition-colors font-semibold"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Profile;