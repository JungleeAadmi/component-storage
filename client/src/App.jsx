import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ContainerForm from './pages/ContainerForm';
import ContainerView from './pages/ContainerView';
import TrayView from './pages/TrayView';
import ComponentDetail from './pages/ComponentDetail';
import Search from './pages/Search';
import Profile from './pages/Profile';
import Navbar from './components/Navbar';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return null; 
  if (!user) return <Navigate to="/login" />;
  
  return (
    <div className="min-h-screen bg-dark-900 text-gray-100 font-sans">
      <Navbar />
      <main className="p-4 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
};

// Public Route Wrapper
const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  if (user) return <Navigate to="/" />;
  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      
      {/* Protected Routes */}
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/add-container" element={<ProtectedRoute><ContainerForm /></ProtectedRoute>} />
      <Route path="/container/:id" element={<ProtectedRoute><ContainerView /></ProtectedRoute>} />
      <Route path="/tray/:id" element={<ProtectedRoute><TrayView /></ProtectedRoute>} />
      
      {/* Component Routes */}
      <Route path="/add-component" element={<ProtectedRoute><ComponentDetail /></ProtectedRoute>} />
      <Route path="/component/:id" element={<ProtectedRoute><ComponentDetail /></ProtectedRoute>} />
      
      {/* Utilities */}
      <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;