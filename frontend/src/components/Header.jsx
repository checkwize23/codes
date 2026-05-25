import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import toast from 'react-hot-toast';

const Header = () => {
  const { user, isAuthenticated, logout, isSuperAdmin, isAdmin, updateProfile, updateSuperAdminProfile, changePassword } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Profile management states
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  
  // Check if user signed up through Google (has googleId)
  const isGoogleUser = user?.googleId || user?.authProvider === 'google';

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    username: user?.username || ''
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Update profile form when user changes
  useEffect(() => {
    setProfileForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      username: user?.username || ''
    });
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    // Use the appropriate function based on user role
    const updateFunction = isSuperAdmin ? updateSuperAdminProfile : updateProfile;
    const result = await updateFunction(profileForm);
    
    if (result.success) {
      // Check if 2FA setup is required after email change
      if (result.data?.requires2FASetup) {
        toast.success('Profile updated successfully! 2FA setup will be required on next login due to email change.', { duration: 5000 });
      } else {
        toast.success(t('profileUpdated'));
      }
      setShowProfileEdit(false);
    } else {
      toast.error(result.error);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(t('passwordsDoNotMatch'));
      return;
    }
    const result = await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
    if (result.success) {
      toast.success(t('passwordChanged'));
      setShowPasswordChange(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      toast.error(result.error);
    }
  };

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const progress = Math.min(window.scrollY / 200, 1);
          setScrollProgress(progress);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.profile-dropdown-container')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // Close modals when clicking outside
  useEffect(() => {
    const handleModalClickOutside = (event) => {
      if ((showProfileEdit || showPasswordChange) && event.target.classList.contains('modal-backdrop')) {
        if (showProfileEdit) setShowProfileEdit(false);
        if (showPasswordChange) setShowPasswordChange(false);
      }
    };

    document.addEventListener('mousedown', handleModalClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleModalClickOutside);
    };
  }, [showProfileEdit, showPasswordChange]);

  const getDashboardLink = () => {
    if (isSuperAdmin) return '/superadmin';
    if (isAdmin) return '/admin';
    return '/dashboard';
  };

  // getRoleBadge was unused; removed to satisfy linter

     const isScrolled = scrollProgress > 0.02;
   // Use darker colors for better visibility, especially on mobile
   const fromLightness = 10 + 20 * scrollProgress; // darker -> slightly lighter
   const toLightness = 25 + 35 * scrollProgress;   // darker -> slightly lighter
   const alpha = 0.98 - 0.05 * scrollProgress;    // more opaque for better visibility

           const headerStyle = {
        background: `linear-gradient(to left, hsla(190, 90%, ${fromLightness}%, ${alpha}), hsla(190, 100%, ${toLightness}%, ${alpha}))`,
        backdropFilter: `blur(${Math.round(8 + 12 * scrollProgress)}px)`
      };

  const averageLightness = (fromLightness + toLightness) / 2;
  // Use gradient-based contrast just for the title, independent of route theme
  const isTitleOnDark = averageLightness < 50;
  
  // Determine if we're on a dashboard page (dark background) or other pages (light background)
  const isDashboardPage = location.pathname === '/dashboard' || 
                         location.pathname === '/admin' || 
                         location.pathname === '/superadmin';
  const isDarkBackground = isDashboardPage; // Dashboard pages have dark backgrounds, others have light

  const navLinkClass = ({ isActive }) => {
    if (isActive) {
      return `px-3 py-2 text-md font-medium rounded-md ${isDarkBackground ? 'text-cyan-900 bg-white/90' : 'text-white bg-cyan-700'}`;
    }
    return `px-3 py-2 text-sm font-medium rounded-md ${isDarkBackground ? 'text-white/90 hover:text-white hover:bg-white/10' : 'text-cyan-100 hover:text-cyan-900 hover:bg-cyan-50'}`;
  };

     return (
     <>
               <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'shadow-lg' : 'shadow-none'} backdrop-blur-md bg-slate-700/90 sm:bg-transparent ${isDarkBackground ? 'text-white' : 'text-gray-900'}`} style={headerStyle}>
       <div className="container mx-auto px-2 sm:px-4 flex items-center justify-between h-16 sm:h-18">
         {/* Logo and Title - Hidden on mobile */}
         <Link to="/" className="hidden sm:flex items-center gap-1 sm:gap-2">
           <img src="./checkwize_logo.png" alt="CheckWize logo" className="h-10 w-auto object-contain" />
           <div className='text-lg sm:text-xl md:text-2xl'>
           <span className={`font-semibold ${isTitleOnDark ? 'text-white' : 'text-gray-800'}`}>Check</span>
           <span className={`font-bold ${isTitleOnDark ? 'text-cyan-300' : 'text-cyan-700'}`}>Wize</span>
           </div>
         </Link>
         
         {/* Mobile Menu Button - Moved to left on mobile */}
         <button 
           className="sm:hidden p-2 text-white hover:bg-white/10 rounded-md"
           onClick={() => setShowMobileMenu(!showMobileMenu)}
         >
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
           </svg>
         </button>
         
         {/* Desktop Navigation */}
         <nav className="hidden md:flex items-center gap-1">
           {/* <NavLink to="/" className={navLinkClass} end>{t('home')}</NavLink> */}
           <NavLink to="/services" className={navLinkClass}>{t('services')}</NavLink>
           <NavLink to="/about" className={navLinkClass}>{t('about')}</NavLink>
           <NavLink to="/team" className={navLinkClass}>{t('team')}</NavLink>
           
           {(!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'super_admin')) && (
             <NavLink to="/contact" className={navLinkClass}>{t('contact')}</NavLink>
           )}

          {isAuthenticated && user?.role === 'user' &&( <NavLink to="/consent-form" className={navLinkClass}>
           Consent Form
           </NavLink>
          )}
         </nav>

                 <div className="flex items-center gap-1 sm:gap-2">
           <LanguageSwitcher />
           {isAuthenticated ? (
             <div className="relative profile-dropdown-container">
               <button
                 onClick={() => setShowDropdown(!showDropdown)}
                 className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-sm sm:text-md font-medium rounded-md cursor-pointer ${isDarkBackground ? 'text-white/90 hover:text-white hover:bg-white/10' : 'text-gray-100 hover:text-blue-700 hover:bg-gray-50'}`}
               >
                 <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs sm:text-sm font-medium">
                   {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                 </div>
                 <span className="hidden sm:block">{user?.firstName} {user?.lastName}</span>
               </button>
              
              {showDropdown && (
                <div className={`absolute right-2 sm:right-0 mr-2 sm:mr-0 mt-2 w-48 max-w-[90vw] sm:max-w-none backdrop-blur-sm rounded-xl shadow-2xl py-0 z-[9999] ${
                  isDarkBackground 
                    ? 'bg-white/10 border border-white/20' 
                    : 'bg-white/95 border border-gray-200/50'
                }`}>
                  <Link
                    to={getDashboardLink()}
                    onClick={() => setShowDropdown(false)}
                    className={`block px-4 py-2 text-sm hover:rounded-t-xl flex items-center space-x-2 font-semibold transition-colors duration-200 ${
                      isDarkBackground 
                        ? 'text-white hover:bg-white/10' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                    </svg>
                    <span>{t('dashboard')}</span>
                  </Link>
                  <button
                    onClick={() => {
                      setShowProfileEdit(true);
                      setShowDropdown(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm cursor-pointer flex items-center space-x-2 font-semibold transition-colors duration-200 ${
                      isDarkBackground 
                        ? 'text-white hover:bg-white/10' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>{t('edit')} {t('yourProfile')}</span>
                  </button>
                  {!isGoogleUser && (
                    <button
                      onClick={() => {
                        setShowPasswordChange(true);
                        setShowDropdown(false);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm cursor-pointer flex items-center space-x-2 font-semibold transition-colors duration-200 ${
                        isDarkBackground 
                          ? 'text-white hover:bg-white/10' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      <span>{t('changePassword')}</span>
                    </button>
                  )}
                  <div className={`border-t my-1 ${
                    isDarkBackground ? 'border-white/20' : 'border-gray-200/50'
                  }`}></div>
                  <button
                    onClick={handleLogout}
                    className={`block w-full text-left px-4 py-2 text-sm hover:rounded-b-xl flex items-center cursor-pointer space-x-2 font-semibold transition-colors duration-200 ${
                      isDarkBackground 
                        ? 'text-white hover:bg-red-500/20 hover:text-red-300' 
                        : 'text-gray-700 hover:bg-red-50 hover:text-red-600'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>{t('logout')}</span>
                  </button>
                </div>
              )}
            </div>
                     ) : (
             <>
               <Link to="/login" className={`px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium ${isDarkBackground ? 'text-white hover:text-cyan-200' : 'text-cyan-100 hover:text-gray-100'}`}>
                 {t('login')}
               </Link>
               <Link to="/signup" className={`px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 ${
                 isDarkBackground 
                   ? 'text-cyan-900 bg-white hover:bg-gray-100' 
                   : 'text-white bg-cyan-600 hover:bg-cyan-700'
               }`}>
                 {t('getVerified')}
               </Link>
             </>
           )}
                </div>
              </div>
      </header>

             {/* Mobile Navigation Menu */}
       {showMobileMenu && (
         <div className="sm:hidden fixed top-16 left-0 w-full bg-slate-700/90 backdrop-blur-md border-b border-white/20 shadow-lg z-40">
           {/* Mobile Menu Header with Logo and Title */}
           <div className="container mx-auto px-4 py-3 border-b border-white/20">
             <Link to="/" className="flex items-center gap-2" onClick={() => setShowMobileMenu(false)}>
               <img src="./checkwize_logo.png" alt="CheckWize logo" className="h-8 w-auto object-contain" />
               <div className="text-lg">
                 <span className="font-semibold text-white">Check</span>
                 <span className="font-bold text-cyan-300">Wize</span>
               </div>
             </Link>
           </div>
           
           {/* Mobile Navigation Links */}
           <nav className="container mx-auto px-4 py-4 space-y-2">
             <NavLink 
               to="/services" 
               className="block px-4 py-3 text-white hover:bg-white/10 rounded-md transition-colors font-medium"
               onClick={() => setShowMobileMenu(false)}
             >
               {t('services')}
             </NavLink>
             <NavLink 
               to="/about" 
               className="block px-4 py-3 text-white hover:bg-white/10 rounded-md transition-colors font-medium"
               onClick={() => setShowMobileMenu(false)}
             >
               {t('about')}
             </NavLink>
             <NavLink 
               to="/team" 
               className="block px-4 py-3 text-white hover:bg-white/10 rounded-md transition-colors font-medium"
               onClick={() => setShowMobileMenu(false)}
             >
               {t('team')}
             </NavLink>
             
             {(!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'super_admin')) && (
               <NavLink 
                 to="/contact" 
                 className="block px-4 py-3 text-white hover:bg-white/10 rounded-md transition-colors font-medium"
                 onClick={() => setShowMobileMenu(false)}
               >
                 {t('contact')}
               </NavLink>
             )}
             
             {isAuthenticated && user?.role === 'user' && (
              <NavLink to="/consent-form" className="block px-4 py-3 text-white hover:bg-white/10 rounded-md transition-colors font-medium"
                onClick={() => setShowMobileMenu(false)}>
                  Consent Form
                </NavLink>
             )}
           </nav>
         </div>
       )}

           {/* Profile Edit Modal - Rendered outside header */}
      {showProfileEdit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-[9999] flex items-center justify-center modal-backdrop p-4">
          <div className="relative mx-auto p-0 w-full max-w-sm sm:max-w-md">
            <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 transform transition-all">
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/20">
               <div className="flex items-center">
                 <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                   <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                   </svg>
                 </div>
                                   <div className="ml-3">
                    <h3 className="text-base sm:text-lg font-semibold text-white">{t('edit')} {t('yourProfile')}</h3>
                    <p className="text-xs sm:text-sm text-gray-300">Update your profile information</p>
                  </div>
               </div>
               <button
                 onClick={() => setShowProfileEdit(false)}
                 className="text-gray-400 hover:text-white transition-colors duration-200"
               >
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
             </div>

                           {/* Content */}
              <div className="px-4 sm:px-6 py-4">
                <form onSubmit={handleUpdateProfile} className="space-y-3 sm:space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-300 mb-2">{t('username')}</label>
                   <input
                     type="text"
                     required
                     value={profileForm.username}
                     onChange={(e) => setProfileForm({...profileForm, username: e.target.value})}
                     className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                     placeholder={`Enter ${t('username').toLowerCase()}`}
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-300 mb-2">{t('email')}</label>
                   <input
                     type="email"
                     required
                     value={profileForm.email}
                     onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                     className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                     placeholder={`Enter ${t('email').toLowerCase()}`}
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-300 mb-2">{t('firstName')}</label>
                   <input
                     type="text"
                     required
                     value={profileForm.firstName}
                     onChange={(e) => setProfileForm({...profileForm, firstName: e.target.value})}
                     className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                     placeholder={`Enter ${t('firstName').toLowerCase()}`}
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-300 mb-2">{t('lastName')}</label>
                   <input
                     type="text"
                     required
                     value={profileForm.lastName}
                     onChange={(e) => setProfileForm({...profileForm, lastName: e.target.value})}
                     className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                     placeholder={`Enter ${t('lastName').toLowerCase()}`}
                   />
                 </div>
               </form>
             </div>

                           {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-end space-y-2 sm:space-y-0 sm:space-x-3 px-4 sm:px-6 py-4 bg-white/5 rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => setShowProfileEdit(false)}
                  className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-300 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  onClick={handleUpdateProfile}
                  className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 border border-transparent rounded-lg hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                >
                  {t('updateProfile')}
                </button>
              </div>
           </div>
         </div>
       </div>
     )}

           {/* Password Change Modal - Rendered outside header */}
      {showPasswordChange && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-[9999] flex items-center justify-center modal-backdrop p-4">
          <div className="relative mx-auto p-0 w-full max-w-sm sm:max-w-md">
            <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 transform transition-all">
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/20">
               <div className="flex items-center">
                 <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                   <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                   </svg>
                 </div>
                                   <div className="ml-3">
                    <h3 className="text-base sm:text-lg font-semibold text-white">{t('changePassword')}</h3>
                    <p className="text-xs sm:text-sm text-gray-300">Update your account password</p>
                  </div>
               </div>
               <button
                 onClick={() => setShowPasswordChange(false)}
                 className="text-gray-400 hover:text-white transition-colors duration-200"
               >
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
             </div>

                           {/* Content */}
              <div className="px-4 sm:px-6 py-4">
                <form onSubmit={handleChangePassword} className="space-y-3 sm:space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                   <input
                     type="password"
                     required
                     value={passwordForm.currentPassword}
                     onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                     className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                     placeholder="Enter current password"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                   <input
                     type="password"
                     required
                     value={passwordForm.newPassword}
                     onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                     className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                     placeholder="Enter new password"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                   <input
                     type="password"
                     required
                     value={passwordForm.confirmPassword}
                     onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                     className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                     placeholder="Confirm new password"
                   />
                 </div>
               </form>
             </div>

                           {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-end space-y-2 sm:space-y-0 sm:space-x-3 px-4 sm:px-6 py-4 bg-white/5 rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => setShowPasswordChange(false)}
                  className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-300 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleChangePassword}
                  className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 border border-transparent rounded-lg hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                >
                  Change Password
                </button>
              </div>
           </div>
         </div>
       </div>
     )}
   </>
   );
 };

export default Header;


