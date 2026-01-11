import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SalesList from './pages/SalesList';
import UsersList from './pages/UsersList';
import Settings from './pages/Settings';
import Logs from './pages/Logs';
import Reports from './pages/Reports';
import Layout from './components/Layout';
import { OfflineBanner } from './components/OfflineBanner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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
  allowedRoles: string[]
}) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <OfflineBanner />
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
      </Router>
    </QueryClientProvider>
  );
};

export default App;
