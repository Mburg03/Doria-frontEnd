import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Packages from './pages/Packages';
import Settings from './pages/Settings';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminUsers from './pages/AdminUsers';
import Accounts from './pages/Accounts';
import Insights from './pages/Insights';
import ProviderDetails from './pages/ProviderDetails';
import Categories from './pages/Categories';
import CategoryDetail from './pages/CategoryDetail';
import { useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';
import Layout from './components/Layout';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot" element={<ForgotPassword />} />
      <Route path="/reset" element={<ResetPassword />} />

      {/* Protected Routes with Persistent Layout */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/packages" element={<Packages />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/categories/:id" element={<CategoryDetail />} />
        {/* Fase 4: Detalle de Proveedor (Inteligencia) */}
        <Route path="/insights/provider/:id" element={<ProviderDetails />} />
        <Route path="/admin/users" element={<AdminUsers />} />
      </Route>
    </Routes>
  );
}

export default App;
