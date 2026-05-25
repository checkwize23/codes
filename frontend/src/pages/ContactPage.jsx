import React, { useState } from 'react';
import LoadingOverlay from '../components/LoadingOverlay';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

const ContactPage = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : '',
    email: user?.email || '',
    phone: '',
    message: ''
  });
  const [companyData, setCompanyData] = useState({
    companyName: '',
    companyPhone: '',
    companyEmail: '',
    companyAddress: ''
  });
  const [loading, setLoading] = useState(false);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
    return re.test(String(email).toLowerCase());
  };

  const validatePhone = (phone) => {
    const digitsOnly = String(phone).replace(/\D/g, '');
    return digitsOnly.length === 10;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCompanyChange = (e) => {
    setCompanyData({
      ...companyData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Basic validations
      if (!validateEmail(formData.email)) {
        setLoading(false);
        toast.error('Please enter a valid email address');
        return;
      }
      if (!validatePhone(formData.phone)) {
        setLoading(false);
        toast.error('Please enter a valid 10-digit phone number');
        return;
      }
      if (companyData.companyEmail && !validateEmail(companyData.companyEmail)) {
        setLoading(false);
        toast.error('Please enter a valid company email address');
        return;
      }
      if (companyData.companyPhone && !validatePhone(companyData.companyPhone)) {
        setLoading(false);
        toast.error('Please enter a valid 10-digit company phone number');
        return;
      }

      // Prepare contact data for Firebase
      const contactData = {
        // Personal information
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: formData.message,
        
        // Company information
        companyInfo: {
          companyName: companyData.companyName || null,
          companyPhone: companyData.companyPhone || null,
          companyEmail: companyData.companyEmail || null,
          companyAddress: companyData.companyAddress || null
        },
        
        // Metadata
        userId: user?._id || null,
        userRole: user?.role || 'guest',
        submittedAt: serverTimestamp(),
        status: 'new', // new, read, responded
        isRead: false
      };

      // Save contact form data to Firebase "Contact" collection
      const docRef = await addDoc(collection(db, 'Contact'), contactData);
      
      // send email notification
      // NEW - fire and forget, don't await
      fetch(`${import.meta.env.VITE_API_URL || 'https://codes-4oz0.onrender.com'}/service-requests/contact/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json'},
      body: JSON.stringify(contactData),
      }).catch(err => console.error('Email failed but form was saved:', err));

      
      toast.success(t('contactSubmitted'))
      // Dispatch event to update admin dashboards
      window.dispatchEvent(new Event('contactUpdated'));
      
      toast.success(t('contactSubmitted'));
      setFormData({ name: '', email: '', phone: '', message: '' });
      setCompanyData({ companyName: '', companyPhone: '', companyEmail: '', companyAddress: '' });
    } catch (error) {
      console.error('Error submitting contact form:', error);
      toast.error('Failed to submit message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative overflow-x-hidden">
      {loading && <LoadingOverlay />}
      {/* Background blur effects to match About/Team */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-cyan-300/30 blur-3xl"/>
        <div className="absolute top-1/2 -right-20 h-64 w-64 rounded-full bg-teal-200/30 blur-3xl"/>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{t('contactTitle')}</h1>
          <p className="text-sm md:text-base text-gray-600 max-w-2xl">{t('haveQuestions')}</p>
        </div>

        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="rounded-2xl p-6 md:p-8 shadow-2xl bg-gradient-to-r from-cyan-700 to-teal-600 text-white">
            <h2 className="text-lg md:text-2xl font-bold mb-6">{t('sendMessage')}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  {t('fullName')} *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/80 border border-white/30 outline-none focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-200"
                  placeholder={`Enter your ${t('fullName').toLowerCase()}`}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  {t('emailAddress')} *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/80 border border-white/30 outline-none focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-200"
                  placeholder={`Enter your ${t('email').toLowerCase()}`}
                  inputMode="email"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium mb-2">
                  {t('phoneNumber')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '');
                    setFormData({ ...formData, phone: digits.slice(0, 10) });
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/80 border border-white/30 outline-none focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-200"
                  placeholder={`Enter your ${t('phone').toLowerCase()}`}
                  inputMode="tel"
                  pattern="^[0-9]{10}$"
                  maxLength="10"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2">
                  {t('message')} *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows="5"
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/80 border border-white/30 outline-none focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-200 resize-none"
                  placeholder="Tell us how we can help you..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 rounded-xl bg-white text-cyan-800 font-semibold hover:bg-cyan-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
              >
                {loading ? t('loading') : t('sendMessage')}
              </button>
            </form>
          </div>

          {/* Company Information Form */}
          <div className="space-y-8">
            {/* Company Info Form */}
            <div className="rounded-2xl p-6 md:p-8 shadow-2xl bg-gradient-to-r from-cyan-700 to-teal-600 text-white">
              <h2 className="text-lg md:text-2xl font-bold mb-2">{t('companyInformation')}</h2>
              <p className="text-sm text-white/90 mb-6">{t('pleaseProvideCompany')}</p>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium mb-2">
                    {t('companyName')}
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    name="companyName"
                    value={companyData.companyName}
                    onChange={handleCompanyChange}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/80 border border-white/30 outline-none focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-200"
                    placeholder={t('enterCompanyName')}
                  />
                </div>

                <div>
                  <label htmlFor="companyPhone" className="block text-sm font-medium mb-2">
                    {t('companyPhone')}
                  </label>
                  <input
                    type="tel"
                    id="companyPhone"
                    name="companyPhone"
                    value={companyData.companyPhone}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '');
                      setCompanyData({ ...companyData, companyPhone: digits.slice(0, 10) });
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/80 border border-white/30 outline-none focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-200"
                    placeholder={t('enterCompanyPhone')}
                    inputMode="tel"
                    pattern="^[0-9]{10}$"
                    maxLength="10"
                  />
                </div>

                <div>
                  <label htmlFor="companyEmail" className="block text-sm font-medium mb-2">
                    {t('companyEmail')}
                  </label>
                  <input
                    type="email"
                    id="companyEmail"
                    name="companyEmail"
                    value={companyData.companyEmail}
                    onChange={handleCompanyChange}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/80 border border-white/30 outline-none focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-200"
                    placeholder={t('enterCompanyEmail')}
                    inputMode="email"
                  />
                </div>

                <div>
                  <label htmlFor="companyAddress" className="block text-sm font-medium mb-2">
                    {t('companyAddress')}
                  </label>
                  <textarea
                    id="companyAddress"
                    name="companyAddress"
                    rows="3"
                    value={companyData.companyAddress}
                    onChange={handleCompanyChange}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/80 border border-white/30 outline-none focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-200 resize-none"
                    placeholder={t('enterCompanyAddress')}
                  />
                </div>
              </div>
            </div>

            {/* Business Hours Info */}
            <div className="rounded-2xl p-6 md:p-8 shadow-2xl bg-gradient-to-r from-cyan-700 to-teal-600 text-white">
              <h2 className="text-lg md:text-2xl font-bold mb-6">{t('businessHours')}</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-white/90">{t('mondayFriday')}</span>
                  <span className="font-semibold">9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/90">{t('saturday')}</span>
                  <span className="font-semibold">10:00 AM - 4:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/90">{t('sunday')}</span>
                  <span className="font-semibold">{t('closed')}</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-white/10 rounded-lg">
                <p className="text-sm">
                  <strong>{t('emergencySupport')}</strong> {t('available247')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;


