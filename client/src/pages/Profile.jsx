import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, X, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [passData, setPassData] = useState({ current: '', new: '' });
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: '', text: '' });
    try {
      await api.put('/auth/password', {
        currentPassword: passData.current,
        newPassword: passData.new
      });
      setMsg({ type: 'success', text: 'Password updated successfully' });
      setPassData({ current: '', new: '' });
    } catch (error) {
      setMsg({ type: 'error', text: error.response?.data?.message || 'Failed to update' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto pb-20">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">My Profile</h1>
        <button onClick={() => navigate(-1)} className="p-2 bg-dark-800 rounded-lg text-gray-400 hover:text-white">
          <X size={24} />
        </button>
      </div>
      
      <div className="bg-dark-800 p-8 rounded-2xl border border-dark-700 flex flex-col items-center space-y-4 mb-8">
        <div className="w-24 h-24 bg-primary-600 rounded-2xl flex items-center justify-center text-4xl font-bold text-white mb-2">
            {user?.username?.[0]?.toUpperCase()}
        </div>
        <div className="text-center">
            <h2 className="text-xl font-bold text-white">{user?.full_name}</h2>
            <p className="text-gray-400 font-mono">@{user?.username}</p>
        </div>
      </div>

      <div className="bg-dark-800 p-6 rounded-2xl border border-dark-700 mb-6">
        <h3 className="text-white font-semibold mb-4 flex items-center space-x-2">
            <Lock size={18} className="text-primary-500" />
            <span>Change Password</span>
        </h3>

        {msg.text && (
            <div className={`p-3 rounded-lg text-sm mb-4 flex items-center space-x-2 ${msg.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                {msg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                <span>{msg.text}</span>
            </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4">
            <input 
                type="password" 
                placeholder="Current Password"
                className="w-full bg-dark-900 border border-dark-700 rounded-lg p-3 text-white text-sm focus:border-primary-500 focus:outline-none"
                value={passData.current}
                onChange={e => setPassData({...passData, current: e.target.value})}
                required
            />
            <input 
                type="password" 
                placeholder="New Password"
                className="w-full bg-dark-900 border border-dark-700 rounded-lg p-3 text-white text-sm focus:border-primary-500 focus:outline-none"
                value={passData.new}
                onChange={e => setPassData({...passData, new: e.target.value})}
                required
            />
            <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-dark-700 hover:bg-dark-600 text-white text-sm py-2 rounded-lg transition-colors"
            >
                {loading ? 'Updating...' : 'Update Password'}
            </button>
        </form>
      </div>

      <button 
        onClick={logout}
        className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 p-4 rounded-xl flex items-center justify-center space-x-2 transition-colors font-semibold"
      >
        <LogOut size={20} />
        <span>Sign Out</span>
      </button>
    </div>
  );
};

export default Profile;