import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { initializeDefaultData } from './services/storage.service';
import './i18n/config';

import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Locations from './pages/Locations';
import Packages from './pages/Packages';
import Users from './pages/Users';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import PublicPackageDetail from './pages/PublicPackageDetail';
import LandingPage from './pages/LandingPage';

// Initialize default data on first load
initializeDefaultData();

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes - No Auth Required */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/p/:trackingNumber/:pickupCode" element={<PublicPackageDetail />} />
          
          <Route path="/login" element={<Login />} />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/customers"
            element={
              <ProtectedRoute>
                <Layout>
                  <Customers />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/packages"
            element={
              <ProtectedRoute>
                <Layout>
                  <Packages />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/locations"
            element={
              <ProtectedRoute adminOnly>
                <Layout>
                  <Locations />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/users"
            element={
              <ProtectedRoute adminOnly>
                <Layout>
                  <Users />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Layout>
                  <Reports />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/settings"
            element={
              <ProtectedRoute adminOnly>
                <Layout>
                  <Settings />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
