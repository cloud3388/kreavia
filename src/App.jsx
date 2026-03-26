import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AuthCallbackPage from './pages/auth/AuthCallbackPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { isMockMode } from './lib/supabase';
import MainLayout from './components/layout/MainLayout';
import DashboardLayout from './components/layout/DashboardLayout';
import LandingPage from './pages/LandingPage';
import PricingPage from './pages/PricingPage';
import OnboardingPage from './pages/OnboardingPage';
import LoginPage from './pages/auth/LoginPage';
import SignUpPage from './pages/auth/SignUpPage';
import BrandKitPage from './pages/dashboard/BrandKitPage';
import TemplatesPage from './pages/dashboard/TemplatesPage';
import ContentEnginePage from './pages/dashboard/ContentEnginePage';
import AnalyticsPage from './pages/dashboard/AnalyticsPage';
import SettingsPage from './pages/dashboard/SettingsPage';
import PublicBrandKitPage from './pages/PublicBrandKitPage';
import SuccessPage from './pages/SuccessPage';

const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof window.gtag === 'function') {
      window.gtag('config', 'G-HK2VPE5XMF', {
        page_path: location.pathname + location.search,
      });
    }
  }, [location]);

  return null;
};

function App() {
  return (
    <Router>
      <AnalyticsTracker />
      <AuthProvider>
        {isMockMode && (
          <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-[10px] py-1 px-4 z-[9999] text-center font-bold uppercase tracking-widest">
            Mock Auth Active — Restart Terminal to use Real Supabase
          </div>
        )}
        <Routes>
          {/* Public Routes */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route 
              path="/onboarding" 
              element={
                <ProtectedRoute>
                  <OnboardingPage />
                </ProtectedRoute>
              } 
            />
          </Route>

          {/* Standalone Route (No Headers or Navbars) */}
          <Route path="/brand/:slug" element={<PublicBrandKitPage />} />
          <Route path="/payment/success" element={<SuccessPage />} />

          {/* Dashboard Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard/brand-kit" replace />} />
            <Route path="brand-kit" element={<BrandKitPage />} />
            <Route path="templates" element={<TemplatesPage />} />
            <Route path="content" element={<ContentEnginePage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

