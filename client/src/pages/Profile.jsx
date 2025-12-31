import { useAuth } from '../context/AuthContext';
import { User, LogOut } from 'lucide-react';

const Profile = () => {
  const { user, logout } = useAuth();

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-white mb-8">My Profile</h1>
      
      <div className="bg-dark-800 p-8 rounded-2xl border border-dark-700 flex flex-col items-center space-y-4 mb-8">
        <div className="w-24 h-24 bg-primary-600 rounded-full flex items-center justify-center text-4xl font-bold text-white mb-2">
            {user?.username?.[0]?.toUpperCase()}
        </div>
        <h2 className="text-xl font-bold text-white">{user?.full_name}</h2>
        <p className="text-gray-400">@{user?.username}</p>
      </div>

      <div className="space-y-4">
        {/* Placeholder for future password change */}
        <div className="bg-dark-800 p-4 rounded-xl border border-dark-700 opacity-50 cursor-not-allowed">
            <h3 className="text-white font-semibold">Change Password</h3>
            <p className="text-xs text-gray-500">Feature coming soon</p>
        </div>

        <button 
          onClick={logout}
          className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 p-4 rounded-xl flex items-center justify-center space-x-2 transition-colors"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Profile;