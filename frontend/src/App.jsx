import React from 'react';
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import HomePage from './pages/HomePage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import ServicesPage from './pages/ServicesPage.jsx';
import TeamPage from './pages/TeamPage.jsx';
import PrivacyPage from './pages/PrivacyPage.jsx';
import TermsPage from './pages/TermsPage.jsx';
import ContactPage from './pages/ContactPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import SuperAdminPage from './pages/SuperAdminPage.jsx';
import CandidateDeclarationForm from './pages/CandidateDeclarationForm.jsx';
const App = () => {
  useEffect(() => {
    fetch("https://hire-shield-backend.onrender.com/api")
      .then(() => console.log("Backend awake"))
      .catch(() => console.log("Backend still sleeping"));

  },[]);
  
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
          <Header />
          <main className="flex-1 pt-16">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/team" element={<TeamPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path='/consent-form' element={<ProtectedRoute><CandidateDeclarationForm /></ProtectedRoute>}/>
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/superadmin" 
                element={
                  <ProtectedRoute requiredRole="super_admin">
                    <SuperAdminPage />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </main>
          <Footer />
        </div>
        <Toaster 
          position="bottom-right"
          toastOptions={{
            duration: 5000,
            style: {
              background: 'linear-gradient(265deg, #ffffff 0%, #ffffff 100%)',
              color: '#000000',
              border: '1px solid #dbeafe',
              boxShadow: '0 20px 25px rgba(59, 130, 246, 0.15)',
              borderRadius: '12px',
              fontWeight: '500',
              width: 'auto',
              padding: '12px',
              height: 'auto',
              justifyContent: 'center',
              textAlign: 'center',
              display: 'flex',
            },
            success: {
              duration: 4000,
              iconTheme: {
                primary: '#000000',
                secondary: '#ffffff',
              },
            },
            error: {
              duration: 6000,
              iconTheme: {
                primary: '#000000',
                secondary: '#ffffff',
              },
            },
          }}
        />
      </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
