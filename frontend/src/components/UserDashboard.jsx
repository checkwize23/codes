import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import ServiceRequestForm from './ServiceRequestForm';
import LoadingOverlay from './LoadingOverlay';
import { Link } from "react-router-dom";
import { useNavigate } from 'react-router-dom';
import { 
  FaUser, 
  FaBolt, 
  FaCheckCircle, 
  FaHome, 
  FaBriefcase, 
  FaGraduationCap, 
  FaIdCard,
  FaUserEdit,
  FaLock,
  FaTimes,
  FaFileAlt,
  FaClock,
  FaEye,
  FaExclamationTriangle,
  FaCheck,
  FaTimes as FaReject,
  FaShieldAlt,
  FaUsers
} from 'react-icons/fa';

const UserDashboard = () => {
  const { t } = useLanguage();
  const { user, updateProfile, changePassword } = useAuth();
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [applications, setApplications] = useState([]);
  const [appsPerPage, setAppsPerPage] = useState(5);
  const [appsCurrentPage, setAppsCurrentPage] = useState(1);
  const [showApplicationView, setShowApplicationView] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDocPreview, setShowDocPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [consentStatus, setConsentStatus] = useState(null);
  const navigate = useNavigate();
  // Check if user signed up through Google (has googleId)
  const isGoogleUser = user?.googleId || user?.authProvider === 'google';

  // Load user's applications from Firestore while preserving UI shape
  React.useEffect(() => {
    let unsubscribe = null;
    let retryCount = 0;
    const maxRetries = 3;
    
    const start = async (uid) => {
      
      // Debug: Let's also check what UIDs exist in the database
      try {
        const allDocs = await getDocs(collection(db, 'serviceRequests'));
        const allUserIds = allDocs.docs.map(d => d.data().userId).filter(Boolean);
      } catch (debugErr) {
        console.error('UserDashboard - Debug query failed:', debugErr);
      }
      
      const qRef = query(collection(db, 'serviceRequests'), where('userId', '==', uid));
      unsubscribe = onSnapshot(qRef, async (snap) => {
        retryCount = 0; // Reset retry count on successful query
        
        let items = snap.docs.map((d) => {
          const data = d.data();
          // Derive a display type from serviceKey with friendly labels
          const friendlyMap = {
            address: 'Address Verification',
            employment: 'Employment Verification',
            education: 'Education Verification',
            cv: 'CV Verification',
            id: 'ID Verification',
            court: 'Court Verification',
            drug: 'Drug Test',
            references: 'References',
            compliance: 'Compliance Consulting',
            vendor: 'Vendor Assessment',
          };
          const rawType = (data.serviceKey || 'verification').toString().toLowerCase();
          const type = friendlyMap[rawType] || (rawType.charAt(0).toUpperCase() + rawType.slice(1).replace(/[-_]/g, ' '));
          // Collect document URLs from known keys (arrays or strings)
          const docValues = [];
          Object.entries(data).forEach(([k, v]) => {
            if (k === 'userId' || k === 'notes' || k === 'remarks' || k === 'status' || k === 'serviceKey' || k === 'createdAt' || k === 'reviewedAt' || k === 'reviewedBy') return;
            if (Array.isArray(v)) {
              v.forEach((u) => typeof u === 'string' && u.startsWith('http') && docValues.push(u));
            } else if (typeof v === 'string' && v.startsWith('http')) {
              docValues.push(v);
            }
          });
          return {
            id: d.id,
            type,
            rawServiceKey: rawType,
            status: (data.status || 'submitted')
              .replace(/^(submitted)$/i, 'Pending')
              .replace(/^(under_review)$/i, 'Under Review')
              .replace(/^(insufficient)$/i, 'Insufficient')
              .replace(/^(approved)$/i, 'Approved')
              .replace(/^(rejected)$/i, 'Rejected'),
            submittedAt: data.createdAt || null,
            reviewedAt: data.reviewedAt || null,
            reviewedBy: data.reviewedBy || null,
            documents: docValues,
            notes: data.notes || '',
            remarks: data.remarks || '',
            referenceNames: Array.isArray(data.referenceNames) ? data.referenceNames.filter((n) => typeof n === 'string' && n.trim() !== '') : []
          };
        });
        
        // If no results found with current UID, try fallback with user email
        if (items.length === 0 && user?.email) {
          try {
            const emailQuery = query(collection(db, 'serviceRequests'), where('userEmail', '==', user.email));
            const emailSnap = await getDocs(emailQuery);
            
            if (emailSnap.docs.length > 0) {
              items = emailSnap.docs.map((d) => {
                const data = d.data();
                const friendlyMap = {
                  address: 'Address Verification',
                  employment: 'Employment Verification',
                  education: 'Education Verification',
                  cv: 'CV Verification',
                  id: 'ID Verification',
                  court: 'Court Verification',
                  drug: 'Drug Test',
                  compliance: 'Compliance Consulting',
                  vendor:'Vendor Assessments',
                  references: 'References',
                };
                const rawType = (data.serviceKey || 'verification').toString().toLowerCase();
                const type = friendlyMap[rawType] || (rawType.charAt(0).toUpperCase() + rawType.slice(1).replace(/[-_]/g, ' '));
                const docValues = [];
                Object.entries(data).forEach(([k, v]) => {
                  if (k === 'userId' || k === 'notes' || k === 'remarks' || k === 'status' || k === 'serviceKey' || k === 'createdAt' || k === 'reviewedAt' || k === 'reviewedBy') return;
                  if (Array.isArray(v)) {
                    v.forEach((u) => typeof u === 'string' && (u.startsWith('http') || u.includes('firebasestorage')) && docValues.push(u));
                  } else if (typeof v === 'string' && (v.startsWith('http') || v.includes('firebasestorage'))) {
                    docValues.push(v);
                  }
                });
                return {
                  id: d.id,
                  type,
                  rawServiceKey: rawType,
                  status: (data.status || 'submitted')
                    .replace(/^(submitted)$/i, 'Pending')
                    .replace(/^(under_review)$/i, 'Under Review')
                    .replace(/^(insufficient)$/i, 'Insufficient')
                    .replace(/^(approved)$/i, 'Approved')
                    .replace(/^(rejected)$/i, 'Rejected'),
                  submittedAt: data.createdAt || null,
                  reviewedAt: data.reviewedAt || null,
                  reviewedBy: data.reviewedBy || null,
                  documents: docValues,
                  notes: data.notes || '',
                  remarks: data.remarks || '',
                  referenceNames: Array.isArray(data.referenceNames) ? data.referenceNames.filter((n) => typeof n === 'string' && n.trim() !== '') : []
                };
              });
            }
          } catch (emailErr) {
            console.error('UserDashboard - Email fallback failed:', emailErr);
          }
        }
        // Fliter out consent forms from user-facing application list
        items = items.filter(item => item.rawServiceKey !== 'consent' );
        // Sort client-side by createdAt desc to avoid composite index
        items.sort((a, b) => {
          const toDate = (v) => (v?.toDate ? v.toDate() : (v ? new Date(v) : 0));
          return (toDate(b.submittedAt || b.createdAt) - toDate(a.submittedAt || a.createdAt));
        });
        
        setApplications(items);
        setAppsCurrentPage(1);
      }, (err) => {
        console.error('Failed to load applications:', err);
        // Retry with exponential backoff
        if (retryCount < maxRetries) {
          retryCount++;
          
          setTimeout(() => {
            if (uid) start(uid);
          }, Math.pow(2, retryCount) * 1000); // Exponential backoff: 2s, 4s, 8s
        }
      });
    };
    const ensureAuth = async () => {
      if (!auth.currentUser) {
        try { await signInAnonymously(auth); } catch {}
      }
      // Wait a bit for auth state to stabilize
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Use the EXACT same logic as ServiceRequestForm for consistency
      const resolveUserId = () => {
        // Prefer Firebase Auth UID for Storage paths to satisfy common security rules
        const firebaseUid = auth?.currentUser?.uid;
        return firebaseUid || user?._id || user?.id || user?.email || 'anonymous';
      };
      
      const uid = resolveUserId();
      
      
      if (uid && uid !== 'anonymous') start(uid);
    };
    const off = onAuthStateChanged(auth, (user) => {
      
      ensureAuth();
    });
    ensureAuth();
    return () => { if (unsubscribe) unsubscribe(); off && off(); };
  }, [user]);

  // consent form status
  React.useEffect(() => {
    if(!user?.email)return;
    const q = query(
      collection(db, "serviceRequests"),
      where("userEmail", "==", user.email),
      where("serviceKey", "==", "consent")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if(!snapshot.empty){
        const data = snapshot.docs[0].data();
        setConsentStatus(data.status || "pending");
      } else{
        setConsentStatus(null);
      }
    });
    return () => unsubscribe();
  }, [user]);

  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await updateProfile(profileForm);
    if (result.success) {
      // Check if 2FA setup is required after email change
      if (result.data?.requires2FASetup) {
        toast.success('Profile updated successfully! 2FA setup will be required on next login due to email change.', { duration: 5000 });
      } else {
        toast.success('Profile updated successfully!');
      }
      setShowProfileEdit(false);
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match!');
      setLoading(false);
      return;
    }
    const result = await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
    if (result.success) {
      toast.success('Password changed successfully!');
      setShowPasswordChange(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  const getStatusBadge = (isActive) => {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };


  const getApplicationStatusBadge = (status) => {
    const badges = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Under Review': 'bg-blue-100 text-blue-800',
      'Insufficient': 'bg-orange-100 text-orange-800',
      'Approved': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getApplicationStatusIcon = (status) => {
    const icons = {
      'Pending': FaClock,
      'Under Review': FaEye,
      'Insufficient': FaExclamationTriangle,
      'Approved': FaCheck,
      'Rejected': FaReject
    };
    const IconComponent = icons[status] || FaFileAlt;
    return <IconComponent className="w-4 h-4" />;
  };

  const handleViewApplication = (application) => {
    setSelectedApplication(application);
    setShowApplicationView(true);
  };

  // Safe date formatter to handle Firestore Timestamps, numbers, and strings
  const formatDate = (value) => {
    if (!value) return 'Never';
    let dateValue = null;
    if (typeof value?.toDate === 'function') {
      dateValue = value.toDate();
    } else if (typeof value === 'object' && value !== null) {
      const seconds = typeof value.seconds === 'number' ? value.seconds : (typeof value._seconds === 'number' ? value._seconds : null);
      if (typeof seconds === 'number') {
        dateValue = new Date(seconds * 1000);
      }
    }
    if (!dateValue) {
      if (typeof value === 'number') {
        dateValue = new Date(value);
      } else if (typeof value === 'string') {
        dateValue = new Date(value);
      }
    }
    if (!dateValue || isNaN(dateValue.getTime())) return 'Never';
    return dateValue.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 pb-10 relative">
      {loading && <LoadingOverlay />}
      {/* Header */}
      <div className="border-white/10">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
              <h1 className="text-xl sm:text-3xl font-bold text-white drop-shadow-lg">
                {t('dashboard')}
              </h1>
              <p className="mt-1 sm:mt-0 text-indigo-100 italic text-sm sm:text-base">
                {t('welcomeBack')}, {user?.firstName} {user?.lastName}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 mt-4 sm:mt-6">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-1 sm:p-2 border border-white/10 shadow-2xl">
          <nav className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
            {[
              { id: 'overview', name: t('overview'), icon: '' },
              { id: 'services', name: t('verificationServices'), icon: '' },
              { id: 'applications', name: t('myApplications') || 'My Applications', icon: '' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex-1 py-3 sm:py-4 px-3 sm:px-6 rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 transform hover:scale-105 cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-emerald-500 to-slate-700 text-white shadow-lg border border-white/20'
                    : 'text-gray-300 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                  <span className="text-sm sm:text-base">{tab.icon}</span>
                  <span className="text-center">{tab.name}</span>
                </div>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-1 bg-white rounded-full"></div>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Profile Summary Card */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-4 sm:p-6 hover:bg-white/15 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-white">
                  Your Profile
                </h3>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <FaUser className="text-white text-sm sm:text-lg" />
                </div>
              </div>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                  <span className="text-gray-300 text-sm sm:text-base">Name:</span>
                  <span className="text-white font-medium text-sm sm:text-base">
                    {user?.firstName} {user?.lastName}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                  <span className="text-gray-300 text-sm sm:text-base">Email:</span>
                  <span className="text-white font-medium text-sm sm:text-base">
                    {user?.email}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                  <span className="text-gray-300 text-sm sm:text-base">Username:</span>
                  <span className="text-white font-medium text-sm sm:text-base">
                    {user?.username}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                  <span className="text-gray-300 text-sm sm:text-base">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(user?.isActive)}`}>
                    {user?.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                  <span className="text-gray-300 text-sm sm:text-base">Consent:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    consentStatus === 'approved' ? 'bg-green-100 text-green-800' :
                    consentStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                    consentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {consentStatus === 'approved' ? 'Approved' : 
                     consentStatus === 'rejected' ? 'Rejected' : 
                     consentStatus === 'pending'  ? 'Pending review' :
                     'Not Submitted' }
                  </span>
                </div>      
             
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-4 sm:p-6 hover:bg-white/15 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-white">
                  Quick Actions
                </h3>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <FaBolt className="text-white text-sm sm:text-lg" />
                </div>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => setShowProfileEdit(true)}
                  className="w-full px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 cursor-pointer"
                >
                  Edit Profile
                </button>
                
                <button onClick={() => consentStatus !== 'approved' && navigate("/consent-form")}
                  disabled={consentStatus === 'approved'} className={`w-full px-3 py-2 text-sm font-medium text-white rounded-lg transition-all duration-200 ${
                    consentStatus === 'approved'
                    ? 'bg-green-600 cursor-not-allowed opacity-80'
                    : 'bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 cursor-pointer'
                  }`}>
                  {consentStatus === 'approved'
                    ? '✅ Consent Completed'
                    : consentStatus === 'rejected'
                    ? 'Re-submit Consent'
                    : 'Fill Consent Form'}
                </button>

                {!isGoogleUser && (
                  <button
                    onClick={() => setShowPasswordChange(true)}
                    className="w-full px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 cursor-pointer"
                  >
                    Change Password
                  </button>
                )}
                {isGoogleUser && (
                  <div className="text-xs text-gray-300 bg-blue-50/10 p-3 rounded-lg border border-blue-200/20">
                    <p className="font-medium text-blue-300 mb-1">Google Account</p>
                    <p className="text-xs">Your password is managed by Google. Visit your Google Account settings to change it.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Account Status Card */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-4 sm:p-6 hover:bg-white/15 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-white">
                  Account Status
                </h3>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <FaCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
              </div>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                  <span className="text-gray-300 text-sm sm:text-base">Account Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(user?.isActive)}`}>
                    {user?.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                  <span className="text-gray-300 text-sm sm:text-base">Last Login:</span>
                  <span className="text-sm text-gray-300">{formatDate(user?.lastLogin)}</span>
                </div>
              
              </div>
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="bg-gradient-to-br from-slate-800/90 via-slate-900/90 to-slate-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-4 sm:p-6 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full blur-2xl"></div>
            
            <div className="relative z-10">
              <div className="mb-6 sm:mb-8">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">{t('verificationServices')}</h3>
                    <p className="text-xs sm:text-sm text-gray-300">{t('applyVerificationHelp') || 'Apply for different verification services by uploading required documents.'}</p>
                  </div>
                </div>
                
                {/* Service highlights */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 sm:mb-6">
                  {[
                    { name: t('addressVerification'), icon: FaHome, color: 'from-blue-500 to-cyan-500' },
                    { name: t('employmentVerification'), icon: FaBriefcase, color: 'from-green-500 to-emerald-500' },
                    { name: t('educationVerification'), icon: FaGraduationCap, color: 'from-purple-500 to-pink-500' },
                    { name: t('idVerification'), icon: FaIdCard, color: 'from-orange-500 to-red-500' },
                    { name: t('complianceConsulting'), icon: FaShieldAlt, color: 'from-teal-500 to-cyan-600'},
                    { name: t('vendorAssessment'), icon: FaUsers, color: 'from-indigo-500 to-purple-600'},
                  ].map((service, index) => {
                    const IconComponent = service.icon;
                    return (
                      <div key={index} className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10 hover:bg-white/10 transition-all duration-300">
                        <div className="text-center">
                          <div className={`w-10 h-10 mx-auto mb-2 bg-gradient-to-r ${service.color} rounded-lg flex items-center justify-center text-base border border-white/20`}>
                            <IconComponent className="w-4 h-4 text-white" />
                          </div>
                          <p className="text-xs text-gray-300 font-medium break-words">{service.name}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Service Request Form with enhanced styling */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 sm:p-6 shadow-xl min-w-0 max-w-full overflow-hidden">
                <div className="max-w-full">
                  {consentStatus === 'approved' ? (
                    <ServiceRequestForm />
                  ) : (
                    <div className='text-center py-12'>
                      <div className="w-16 h-16 mx-auto mb-4 bg-yellow-500/20 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">Consent Approval required</h3>
                      <p className="text-gray-300 text-sm mb-6 max-w-md mx-auto">
                        You need to submit and get your consent form approved before you can apply for verification services.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        {consentStatus === null ? (
                          <button onClick={() => navigate('/consent-form')} className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-slate-600 text-white rounded-lg hover:from-emerald-600 hover:to-slate-700 transition-all duration-200 text-sm font-medium">
                            Submit Consent Form
                          </button>
                        ) : (
                          <div className="px-4 py-2 bg-yellow-500/20 border border-yellow-500/40 rounded-lg">
                            <p className="text-yellow-300 text-sm font-medium">
                              Your Consent form is <span className="capitalize">{consentStatus}</span> --- awaiting admin review.
                            </p>
                          </div> 
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
            )}

        {activeTab === 'applications' && (
          <div className="bg-gradient-to-br from-slate-800/90 via-slate-900/90 to-slate-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-4 sm:p-6 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full blur-2xl"></div>
            
            <div className="relative z-10">
              <div className="mb-6 sm:mb-8">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <FaFileAlt className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">My Applications</h3>
                    <p className="text-xs sm:text-sm text-gray-300">Track the status of your verification applications</p>
                  </div>
                </div>
                
                {/* Application Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                  {[
                    { status: 'Pending', count: applications.filter(app => app.status === 'Pending').length, color: 'from-yellow-500 to-orange-500' },
                    { status: 'Under Review', count: applications.filter(app => app.status === 'Under Review').length, color: 'from-blue-500 to-cyan-500' },
                    { status: 'Insufficient', count: applications.filter(app => app.status === 'Insufficient').length, color: 'from-orange-500 to-red-500' },
                    { status: 'Approved', count: applications.filter(app => app.status === 'Approved').length, color: 'from-green-500 to-emerald-500' },
                    { status: 'Rejected', count: applications.filter(app => app.status === 'Rejected').length, color: 'from-red-500 to-pink-500' }
                  ].map((stat, index) => (
                    <div key={index} className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10 hover:bg-white/10 transition-all duration-300">
                      <div className="text-center">
                        <div className={`w-10 h-10 mx-auto mb-2 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center text-base border border-white/20`}>
                          {getApplicationStatusIcon(stat.status)}
                        </div>
                        <p className="text-xs text-gray-300 font-medium">{stat.status}</p>
                        <p className="text-lg font-bold text-white">{stat.count}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Applications List */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 sm:p-6 shadow-xl">
                <h4 className="text-lg font-semibold text-white mb-4">Application History</h4>
                {applications.length === 0 ? (
                  <div className="text-center py-8">
                    <FaFileAlt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-300 text-lg">No applications found</p>
                    <p className="text-gray-400 text-sm">Submit your first verification application to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications
                      .slice((appsCurrentPage - 1) * appsPerPage, appsCurrentPage * appsPerPage)
                      .map((application) => (
                      <div key={application.id} className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-all duration-300">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h5 className="text-white font-semibold">{application.type}</h5>
                              {application.rawServiceKey !== 'references' && (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getApplicationStatusBadge(application.status)}`}>
                                  {getApplicationStatusIcon(application.status)}
                                  <span>{application.status}</span>
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-300">
                              <div>
                                <span className="font-medium">Submitted:</span> {formatDate(application.submittedAt)}
                              </div>
                              {application.reviewedAt && (
                                <div>
                                  <span className="font-medium">Reviewed:</span> {formatDate(application.reviewedAt)}
                                </div>
                              )}
                              {application.reviewedBy && (
                                <div>
                                  <span className="font-medium">Reviewed by:</span> {application.reviewedBy}
                                </div>
                              )}
                              {application.rawServiceKey === 'references' ? (
                                <div className="col-span-2">
                                  <span className="font-medium">Reference Names:</span> {application.referenceNames.length > 0 ? application.referenceNames.join(', ') : '—'}
                                </div>
                              ) : (
                                <div>
                                  <span className="font-medium">Documents:</span> {application.documents.length} file(s)
                                </div>
                              )}
                            </div>
                            {application.notes && (
                              <div className="mt-2 p-2 bg-white/5 rounded text-sm text-gray-300">
                                <span className="font-medium">Notes:</span> {application.notes}
                              </div>
                            )}
                          </div>
                          {application.rawServiceKey !== 'references' && (
                            <div className="sm:ml-4">
                              <button
                                onClick={() => handleViewApplication(application)}
                                className="w-full sm:w-auto px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 text-sm font-medium flex items-center justify-center space-x-2"
                              >
                                <FaEye className="w-4 h-4" />
                                <span>View Details</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {/* Pagination */}
                    {Math.ceil(applications.length / appsPerPage) > 1 && (
                      <div className="pt-4 border-t border-white/10">
                        <div className="flex items-center justify-between">
                          <div className="text-xs sm:text-sm text-gray-300">
                            Showing {(appsCurrentPage - 1) * appsPerPage + 1} to {Math.min(appsCurrentPage * appsPerPage, applications.length)} of {applications.length} results
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setAppsCurrentPage(p => Math.max(1, p - 1))}
                              disabled={appsCurrentPage === 1}
                              className="px-3 py-2 text-xs sm:text-sm font-medium text-gray-300 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Previous
                            </button>
                            {Array.from({ length: Math.ceil(applications.length / appsPerPage) }, (_, i) => i + 1).map(page => (
                              <button
                                key={page}
                                onClick={() => setAppsCurrentPage(page)}
                                className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors duration-200 ${appsCurrentPage === page ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-300 bg-white/10 border border-white/20 hover:bg-white/20'}`}
                              >
                                {page}
                              </button>
                            ))}
                            <button
                              onClick={() => setAppsCurrentPage(p => Math.min(Math.ceil(applications.length / appsPerPage), p + 1))}
                              disabled={appsCurrentPage * appsPerPage >= applications.length}
                              className="px-3 py-2 text-xs sm:text-sm font-medium text-gray-300 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">Profile Management</h3>
              <p className="text-sm text-gray-300">Update your profile information and manage your account settings.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h4 className="font-medium text-white mb-3">Profile Information</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Name:</span>
                    <span className="font-medium text-white">{user?.firstName} {user?.lastName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Email:</span>
                    <span className="font-medium text-white">{user?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Username:</span>
                    <span className="font-medium text-white">{user?.username}</span>
                  </div>
                  <button
                    onClick={() => setShowProfileEdit(true)}
                    className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h4 className="font-medium text-white mb-3">Security Settings</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Account Type:</span>
                    <span className="text-sm text-gray-300">
                      {isGoogleUser ? 'Google Account' : 'Regular Account'}
                    </span>
                  </div>
                  {!isGoogleUser && (
                    <button
                      onClick={() => setShowPasswordChange(true)}
                      className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
                    >
                      Change Password
                    </button>
                  )}
                  {isGoogleUser && (
                    <div className="text-sm text-gray-300 bg-blue-50/10 p-3 rounded-lg border border-blue-200/20">
                      <p className="font-medium text-blue-300 mb-1">Google Account</p>
                      <p>Your password is managed by Google. To change your password, please visit your Google Account settings.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Profile Edit Modal */}
      {showProfileEdit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-[9999] flex items-center justify-center modal-backdrop">
          <div className="relative mx-auto p-4 w-full max-w-md">
            <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 transform transition-all">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/20">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                    <FaUserEdit className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-white">Edit Profile</h3>
                    <p className="text-sm text-gray-300">Update your profile information</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowProfileEdit(false)}
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <FaTimes className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-4">
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
                    <input
                      type="text"
                      required
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm({...profileForm, firstName: e.target.value})}
                      className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
                    <input
                      type="text"
                      required
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm({...profileForm, lastName: e.target.value})}
                      className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                    <input
                      type="email"
                      required
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                      className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </form>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-end space-y-2 sm:space-y-0 sm:space-x-3 px-6 py-4 bg-white/5 rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => setShowProfileEdit(false)}
                  className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-300 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleUpdateProfile}
                  className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 border border-transparent rounded-lg hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                >
                  Update Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordChange && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-[9999] flex items-center justify-center modal-backdrop">
          <div className="relative mx-auto p-4 w-full max-w-md">
            <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 transform transition-all">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/20">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                    <FaLock className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-white">Change Password</h3>
                    <p className="text-sm text-gray-300">Update your account password</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPasswordChange(false)}
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <FaTimes className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-4">
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                    <input
                      type="password"
                      required
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                      className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                    <input
                      type="password"
                      required
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </form>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-end space-y-2 sm:space-y-0 sm:space-x-3 px-6 py-4 bg-white/5 rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => setShowPasswordChange(false)}
                  className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-300 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleChangePassword}
                  className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-600 border border-transparent rounded-lg hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Application View Modal */}
      {showApplicationView && selectedApplication && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-[9999] flex items-center justify-center modal-backdrop">
          <div className="relative mx-auto p-4 w-full max-w-[95vw] sm:max-w-2xl">
            <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 transform transition-all">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/20">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-full flex items-center justify-center">
                    <FaFileAlt className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-white">Application Details</h3>
                    <p className="text-sm text-gray-300">{selectedApplication.type}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowApplicationView(false)}
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <FaTimes className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Application Information */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-white border-b border-white/20 pb-2">
                      Application Information
                    </h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-300">Application Type</label>
                      <p className="text-sm text-white">{selectedApplication.type}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300">Status</label>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getApplicationStatusBadge(selectedApplication.status)}`}>
                        {getApplicationStatusIcon(selectedApplication.status)}
                        <span className="ml-1">{selectedApplication.status}</span>
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300">Submitted Date</label>
                      <p className="text-sm text-white">{formatDate(selectedApplication.submittedAt)}</p>
                    </div>
                    {selectedApplication.reviewedAt && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300">Reviewed Date</label>
                        <p className="text-sm text-white">{formatDate(selectedApplication.reviewedAt)}</p>
                      </div>
                    )}
                    {selectedApplication.reviewedBy && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300">Reviewed By</label>
                        <p className="text-sm text-white">{selectedApplication.reviewedBy}</p>
                      </div>
                    )}
                  </div>

                  {/* Documents and Notes */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-white border-b border-white/20 pb-2">
                      Documents & Notes
                    </h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-300">Uploaded Documents</label>
                      <div className="mt-2 space-y-2">
                        {selectedApplication.documents.map((doc, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => { setPreviewUrl(doc); setShowDocPreview(true); }}
                            className="w-full text-left flex items-center space-x-2 p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                          >
                            <FaFileAlt className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-indigo-300 underline break-all">Open Document {index + 1}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    {selectedApplication.notes && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300">Notes</label>
                        <p className="text-sm text-white bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/20 mt-2">
                          {selectedApplication.notes}
                        </p>
                      </div>
                    )}
                    {selectedApplication.remarks && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300">Remarks</label>
                        <p className="text-sm text-white bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/20 mt-2">
                          {selectedApplication.remarks}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 px-6 py-4 bg-white/5 rounded-b-2xl">
                <button
                  onClick={() => setShowApplicationView(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                >
                  Close
                </button>
                {selectedApplication.status === 'Insufficient' && (
                  <button
                    onClick={() => {
                      setShowApplicationView(false);
                      setActiveTab('services');
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 border border-transparent rounded-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                  >
                    Resubmit Application
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {showDocPreview && previewUrl && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4"
          onClick={() => { setShowDocPreview(false); setPreviewUrl(''); }}
        >
          <div
            className="relative w-full max-w-[95vw] sm:max-w-5xl h-[75vh] sm:h-[80vh] bg-slate-900/90 border border-white/20 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe title="Document Preview" src={previewUrl} className="w-full h-full bg-slate-900" />
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
