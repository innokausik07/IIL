import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import GoogleSheetList from './pages/GoogleSheetList';
import MovedSheetList from './pages/MovedSheetList';
import CrossAuditList from './pages/CrossAuditList';
import StoreStockList from './pages/StoreStockList';
import CreateUser from './pages/CreateUser';
import LocationMaster from './pages/LocationMaster';
import StateMaster from './pages/StateMaster';
import CityMaster from './pages/CityMaster';
import BrandMaster from './pages/BrandMaster';
import ColorMaster from './pages/ColorMaster';
import TaxMaster from './pages/TaxMaster';
import CourierMaster from './pages/CourierMaster';
import ParameterMaster from './pages/ParameterMaster';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading"><div className="spinner"></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/" replace /> : <Signup />} />
      <Route path="/" element={<ProtectedRoute><GoogleSheetList /></ProtectedRoute>} />
      <Route path="/moved-sheet" element={<ProtectedRoute><MovedSheetList /></ProtectedRoute>} />
      <Route path="/cross-audit" element={<ProtectedRoute><CrossAuditList /></ProtectedRoute>} />
      <Route path="/store-stock" element={<ProtectedRoute><StoreStockList /></ProtectedRoute>} />
      <Route path="/admin/create-user"      element={<ProtectedRoute><CreateUser /></ProtectedRoute>} />
      <Route path="/admin/location-master"  element={<ProtectedRoute><LocationMaster /></ProtectedRoute>} />
      <Route path="/admin/state-master"     element={<ProtectedRoute><StateMaster /></ProtectedRoute>} />
      <Route path="/admin/city-master"      element={<ProtectedRoute><CityMaster /></ProtectedRoute>} />
      <Route path="/admin/brand-master"     element={<ProtectedRoute><BrandMaster /></ProtectedRoute>} />
      <Route path="/admin/color-master"     element={<ProtectedRoute><ColorMaster /></ProtectedRoute>} />
      <Route path="/admin/tax-master"       element={<ProtectedRoute><TaxMaster /></ProtectedRoute>} />
      <Route path="/admin/courier-master"   element={<ProtectedRoute><CourierMaster /></ProtectedRoute>} />
      <Route path="/admin/parameter-master" element={<ProtectedRoute><ParameterMaster /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
