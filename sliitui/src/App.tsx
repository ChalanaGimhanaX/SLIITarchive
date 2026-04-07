import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";

import { Footer, Navbar } from "@/src/components/Layout";
import { ProtectedRoute } from "@/src/components/ProtectedRoute";
import { AuthProvider, useAuth } from "@/src/features/auth/AuthProvider";
import { trackPageView } from "@/src/lib/analytics";
import AdminPortal from "@/src/pages/Admin";
import AboutPage from "@/src/pages/About";
import Dashboard from "@/src/pages/Dashboard";
import GuidelinesPage from "@/src/pages/Guidelines";
import Home from "@/src/pages/Home";
import LoginPage from "@/src/pages/Login";
import PrivacyPolicyPage from "@/src/pages/PrivacyPolicy";
import SearchResults from "@/src/pages/Search";
import SupportPage from "@/src/pages/Support";
import TermsPage from "@/src/pages/Terms";
import ContributionPage from "@/src/pages/Upload";

function AppContent() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const isAdminScreen = location.pathname.startsWith("/admin");

  useEffect(() => {
    trackPageView(`${location.pathname}${location.search}${location.hash}`);
  }, [location.hash, location.pathname, location.search]);

  return (
    <div className="flex flex-col min-h-screen">
      {!isAdminScreen && <Navbar />}
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/guidelines" element={<GuidelinesPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/search" element={<SearchResults />} />
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
          />
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <ContributionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["moderator", "admin"]}>
                <AdminPortal />
              </ProtectedRoute>
            }
          />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {!isAdminScreen && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}
