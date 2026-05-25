import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';
import LoadingOverlay from '../components/LoadingOverlay';

const LoginPage = () => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, googleSignIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const _from = location.state?.from?.pathname || '/dashboard';

  // Reset 2FA states when component mounts or location changes
  useEffect(() => {
    // Clear any pending 2FA tokens when navigating to login
    if (location.pathname === '/login') {
      
      setLoading(false);
    }
  }, [location.pathname]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try{
      const result = await login(formData.email, formData.password);
      console.log('FULL RESULT',result);
    
      if (result.success && result.data?.user) {
        const user = result.data.user;

        console.log("USER:",user);
        console.log('ROLE',user.role);


        setLoading(false);
        // fallback sfae navigation 
        switch (user.role){
          case 'super_admin':
            navigate('/superadmin');
            break;
          case 'admin':
            navigate('/admin');
            break;
          default:
            navigate('/dashboard');  
        }
  
      // removed it. Check if 2FA is required
      
    } else {
      setLoading(false);
      toast.error(result.error);
    }
  } catch(error){
    setLoading(false);
    toast.error(t('somethingWentWrong'))
  }
};

  const handleGoogleSignIn = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve,0));
    try{
      const result = await googleSignIn();
    
    if (result.success) {
      const user = result.data.user;
      setLoading(false);
      
      // removed it.Check if 2FA is required
        if (user.role === 'super_admin') {
          navigate('/superadmin');
        } else if (user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }

    } else {
      setLoading(false);
      toast.error(result.error);
    }
  }catch (error){
    setLoading(false);
    toast.error(t('googleSignInFailed'));
  }
};

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="w-full mx-auto px-4 py-8 md:py-12 bg-gradient-to-t from-cyan-50 to-cyan-900 min-h-screen relative">
      {loading && <LoadingOverlay />}
      <div className='mb-8'>
        <img src="./hire_logo.png" alt="hero logo" className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-4" />
        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-center text-white drop-shadow-lg">{t('welcomeBack')}</h1>
        <p className="text-cyan-100 text-center text-sm md:text-base">{t('signInToAccount')}</p>
      </div>
    
      <div className="max-w-md mx-auto bg-white/95 backdrop-blur-sm border border-white/20 rounded-2xl p-6 md:p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">{t('signIn')}</h2>
          <p className="text-gray-600 font-medium text-sm md:text-base">{t('welcomeBackContinue')}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('emailAddress')}</label>
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 md:px-4 md:py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white/80 backdrop-blur-sm" 
              placeholder={t('enterEmail')} 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('password')}</label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'} 
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 md:px-4 md:py-3 pr-10 md:pr-12 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white/80 backdrop-blur-sm" 
                placeholder={t('enterPassword')} 
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(v => !v)}
                className="absolute inset-y-0 right-3 my-auto h-7 w-7 md:h-8 md:w-8 flex items-center justify-center text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                    <path d="M3 3l18 18" />
                    <path d="M10.58 10.58a3 3 0 104.24 4.24" />
                    <path d="M9.88 5.07A10.94 10.94 0 0112 5c7 0 10 7 10 7a18.51 18.51 0 01-3.17 4.65" />
                    <path d="M6.1 6.1A18.5 18.5 0 002 12s3 7 10 7a10.94 10.94 0 004.93-1.12" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full px-3 py-2 md:px-6 md:py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-700 text-white font-semibold text-sm md:text-base hover:from-cyan-700 hover:to-cyan-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
          >
            {loading ? t('loading') : t('signIn')}
          </button>
        </form>
        
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white/95 text-gray-500 font-medium">{t('orContinueWith')}</span>
          </div>
        </div>

        <div className="mb-6">
          <button
            onClick={handleGoogleSignIn}
            className="w-full px-3 py-2 md:px-6 md:py-4 rounded-xl bg-white text-gray-700 font-semibold text-sm md:text-base hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-gray-200 flex items-center justify-center space-x-3 cursor-pointer transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
            disabled={loading}
          >
            <img src="./google.png" alt="Google logo" className="w-4 h-4 md:w-5 md:h-5" />
            <span>{loading ? t('loading') : t('continueWithGoogle')}</span>
          </button>
        </div>
        
        <div className="text-center">
          <p className="text-gray-600 font-medium text-sm md:text-base">
            {t('dontHaveAccount')}{' '}
            <Link to="/signup" className="text-cyan-600 font-semibold hover:text-cyan-700 transition-colors duration-200">
              {t('signUp')}
            </Link>
          </p>
        </div>
      </div>
      
      <div className='text-center mt-8'>
        <p className="text-xs md:text-sm font-medium text-black">
          {t('byContinuing')}{' '}
          <Link to="/terms" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors duration-200">
            {t('termsOfService')}
          </Link>
          {' '}{t('and')}{' '}
          <Link to="/privacy" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors duration-200">
            {t('privacyPolicy')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;


