import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import toast from 'react-hot-toast'
import LoadingOverlay from '../components/LoadingOverlay'

const SignupPage = () => {
  const navigate = useNavigate();
  const { register, googleSignIn, logout } = useAuth();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const wait = (ms) => new Promise((res) => setTimeout(res, ms));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    // Validate basic fields
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || !formData.username.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    // Go to next step
    setCurrentStep(2);
  };



  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Enhanced password validation
    if (formData.password !== formData.confirmPassword) {
      setLoading(false);
      setTimeout(() => toast.error('Passwords do not match'), 50);
      return;
    }

    if (formData.password.length < 8) {
      setLoading(false);
      setTimeout(() => toast.error('Password must be at least 8 characters long'), 50);
      return;
    }

    // Check for at least one number
    if (!/\d/.test(formData.password)) {
      setLoading(false);
      setTimeout(() => toast.error('Password must contain at least one number'), 50);
      return;
    }

    // Check for at least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password)) {
      setLoading(false);
      setTimeout(() => toast.error('Password must contain at least one special character'), 50);
      return;
    }

    const start = Date.now();
    try {
      const { username, firstName, lastName, email, password } = formData;
      const result = await register({
        username,
        firstName,
        lastName,
        email,
        password
      });

      const elapsed = Date.now() - start;
      if (elapsed < 5000) await wait(5000 - elapsed);

      if (result.success) {
        setLoading(false);
        setTimeout(() => {
          toast.success('Registration successful! Please login with your credentials.');
          navigate('/login');
        }, 50);
      } else {
        setLoading(false);
        setTimeout(() => toast.error(result.error), 50);
      }
    } catch {
      const elapsed = Date.now() - start;
      if (elapsed < 10000) await wait(10000 - elapsed);
      setLoading(false);
      setTimeout(() => toast.error('Registration failed. Please try again.'), 50);
    }
  };

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="w-full mx-auto px-4 py-8 md:py-12 bg-gradient-to-t from-cyan-50 to-cyan-900 min-h-screen relative">
      {loading && <LoadingOverlay />}
      <div className='mb-8'>
        <img src="./hire_logo.png" alt="hero logo" className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-4" />
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-2 text-white drop-shadow-lg">{t('joinUs')}</h1>
        <p className="text-cyan-100 text-center text-sm md:text-base">{t('createAccountStarted')}</p>
      </div>
      
      <div className="max-w-md mx-auto bg-white/95 backdrop-blur-sm border border-white/20 rounded-2xl p-6 md:p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">{t('signUp')}</h2>
          <p className="text-gray-600 font-medium text-sm md:text-base">
            {currentStep === 1 ? t('step1Basic') : t('step2Security')}
          </p>
        </div>
        
        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center">
            <button
              onClick={() => setCurrentStep(1)}
              className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                currentStep >= 1 ? 'bg-cyan-600 text-white hover:bg-cyan-700' : 'bg-gray-300 text-gray-600 hover:bg-gray-400'
              }`}
            >
              1
            </button>
            <div className={`w-10 md:w-12 h-1 mx-2 ${
              currentStep >= 2 ? 'bg-cyan-600' : 'bg-gray-300'
            }`}></div>
            <button
              onClick={() => {
                // Only allow going to step 2 if step 1 is completed
                if (formData.firstName.trim() && formData.lastName.trim() && formData.email.trim() && formData.username.trim()) {
                  setCurrentStep(2);
                } else {
                  toast.error('Please complete step 1 first');
                }
              }}
              className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                currentStep >= 2 ? 'bg-cyan-600 text-white hover:bg-cyan-700' : 'bg-gray-300 text-gray-600 hover:bg-gray-400'
              }`}
            >
              2
            </button>
          </div>
        </div>

        {currentStep === 1 ? (
          <form onSubmit={handleNextStep} className="space-y-5 md:space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('username')}</label>
              <input 
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 md:px-4 md:py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white/80 backdrop-blur-sm" 
                placeholder={t('chooseUsername')}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('firstName')}</label>
                <input 
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 md:px-4 md:py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white/80 backdrop-blur-sm" 
                  placeholder={t('first_name')}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('lastName')}</label>
                <input 
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 md:px-4 md:py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white/80 backdrop-blur-sm" 
                  placeholder={t('last_name')}
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('emailAddress')}</label>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 md:px-4 md:py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white/80 backdrop-blur-sm" 
                placeholder={t('enterEmail')}
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="w-full px-3 py-2 md:px-6 md:py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-700 text-white font-semibold text-sm md:text-base hover:from-cyan-700 hover:to-cyan-800 transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
            >
              {t('continue')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleFinalSubmit} className="space-y-5 md:space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('password')}</label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 md:px-4 md:py-3 pr-10 md:pr-12 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white/80 backdrop-blur-sm" 
                  placeholder={t('createStrongPassword')}
                  required
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
              {/* Password requirements */}
              <div className="mt-2 space-y-1">
                <div className={`flex items-center text-[10px] md:text-xs ${formData.password.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                  <span className={`w-2 h-2 rounded-full mr-2 ${formData.password.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                  At least 8 characters
                </div>
                <div className={`flex items-center text-[10px] md:text-xs ${/\d/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                  <span className={`w-2 h-2 rounded-full mr-2 ${/\d/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                  At least one number
                </div>
                <div className={`flex items-center text-[10px] md:text-xs ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                  <span className={`w-2 h-2 rounded-full mr-2 ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                  At least one special character
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('confirmPassword')}</label>
              <div className="relative">
                <input 
                  type={showConfirmPassword ? 'text' : 'password'} 
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 md:px-4 md:py-3 pr-10 md:pr-12 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white/80 backdrop-blur-sm" 
                  placeholder={t('confirmYourPassword')}
                  required
                />
                <button
                  type="button"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowConfirmPassword(v => !v)}
                  className="absolute inset-y-0 right-3 my-auto h-7 w-7 md:h-8 md:w-8 flex items-center justify-center text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? (
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
              className="w-full px-3 py-2 md:px-6 md:py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-700 text-white font-semibold text-sm md:text-base hover:from-cyan-700 hover:to-cyan-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
            >
              {loading ? t('creatingAccount') : t('createAccount')}
            </button>
          </form>
        )}
        
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
            onClick={async () => {
              setLoading(true);
              const start = Date.now();
              const result = await googleSignIn();
              const elapsed = Date.now() - start;
              if (elapsed < 10000) await wait(10000 - elapsed);
              if (result.success) {
                // Immediately log out so user must log in manually
                logout();
                setLoading(false);
                setTimeout(() => {
                  toast.success('Google signup successful! Please login to continue.');
                  navigate('/login');
                }, 50);
              } else {
                setLoading(false);
                setTimeout(() => toast.error(result.error), 50);
              }
            }}
            className="w-full px-3 py-2 md:px-6 md:py-4 rounded-xl bg-white text-gray-700 font-semibold text-sm md:text-base hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-gray-200 flex items-center justify-center space-x-3 transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
            disabled={loading}
          >
            <img src="./google.png" alt="Google logo" className="w-4 h-4 md:w-5 md:h-5" />
            <span>{loading ? t('processing') : t('signUpWithGoogle')}</span>
          </button>
        </div>
        
        <div className="text-center">
          <p className="text-gray-600 font-medium text-sm md:text-base">
            {t('alreadyHaveAccount')}{' '}
            <Link to="/login" className="text-cyan-600 font-semibold hover:text-cyan-700 transition-colors duration-200">
              {t('signIn')}
            </Link>
          </p>
        </div>
      </div>
      
      <div className='text-center mt-8'>
        <p className="text-xs md:text-sm font-medium text-black">
          {t('byContinuing')}{' '}
          <Link to="/terms" className="text-blue-600 font-semibold transition-all duration-200">
            {t('termsOfService')}
          </Link>
          {' '}{t('and')}{' '}
          <Link to="/privacy" className="text-blue-600 font-semibold transition-all duration-200">
            {t('privacyPolicy')}
          </Link>
        </p>
      </div>
    </div>
  )
}

export default SignupPage


