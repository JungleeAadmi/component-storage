import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Menu, X, LogOut, User, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-dark-800 border-b border-dark-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center font-bold text-white">
              I
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Inventra</span>
          </Link>

          {/* Hamburger Button */}
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-700 transition-colors"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-dark-800 border-b border-dark-700 overflow-hidden"
          >
            <div className="px-4 py-3 space-y-2">
              <div className="flex items-center space-x-3 p-3 bg-dark-900 rounded-xl mb-4">
                <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-white">{user?.full_name || user?.username}</p>
                  <p className="text-xs text-gray-400">@{user?.username}</p>
                </div>
              </div>

              <Link to="/profile" className="flex items-center space-x-3 p-3 rounded-lg text-gray-300 hover:bg-dark-700 hover:text-white transition-colors" onClick={() => setIsOpen(false)}>
                <User size={20} />
                <span>Edit Profile</span>
              </Link>
              
              <button 
                onClick={logout}
                className="w-full flex items-center space-x-3 p-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;