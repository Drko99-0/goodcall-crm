import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SalesList from './pages/SalesList';
import UsersList from './pages/UsersList';
import Settings from './pages/Settings';
import Logs from './pages/Logs';
import Reports from './pages/Reports';
import Layout from './components/Layout';
import { OfflineBanner } from './components/OfflineBanner';
import { ToastContainer } from './utils/toast.utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setNavigateCallback } from './services/api';
import { useUserData } from './hooks/use-user-data';
import type { UserRole } from './types';

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('accessToken');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const RoleProtectedRoute = ({
  children,
  allowedRoles
}: {
  children: React.ReactNode;
  allowedRoles: UserRole[]
}) => {
  const { user, loading } = useUserData();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <div className="animate-spin h-8 w-8 border-2 border-brand-500 border-t-transparent rounded-full"></div>
    </div>;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const AppRouter = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Set up the navigate callback for the api service
    setNavigateCallback(navigate);
  }, [navigate]);

  return (
    <>
      <OfflineBanner />
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/sales" element={<SalesList />} />

          <Route path="/users" element={
            <RoleProtectedRoute allowedRoles={['developer', 'gerencia']}>
              <UsersList />
            </RoleProtectedRoute>
          } />

          <Route path="/settings" element={
            <RoleProtectedRoute allowedRoles={['developer', 'gerencia']}>
              <Settings />
            </RoleProtectedRoute>
          } />

          <Route path="/logs" element={
            <RoleProtectedRoute allowedRoles={['developer', 'gerencia']}>
              <Logs />
            </RoleProtectedRoute>
          } />

          <Route path="/reports" element={
            <RoleProtectedRoute allowedRoles={['developer', 'gerencia', 'coordinador']}>
              <Reports />
            </RoleProtectedRoute>
          } />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRouter />
      </Router>
    </QueryClientProvider>
  );
};

export default App;
