import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { db } from '../firebase';
import { collection, getDocs, doc, deleteDoc, query, orderBy, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { 
  FaUser, 
  FaChartBar, 
  FaBolt, 
  FaCheckCircle, 
  FaUserEdit,
  FaLock,
  FaTimes,
  FaEye,
  FaTrash,
  FaSearch,
  FaChevronDown,
  FaUsers,
  FaEnvelope,
  FaShieldAlt,
  FaHome,
  FaBriefcase,
  FaGraduationCap,
  FaIdCard,
  FaFileAlt,
  FaClock,
  FaExclamationTriangle,
  FaCheck,
  FaTimes as FaReject,
  FaEdit
} from 'react-icons/fa';
import LoadingOverlay from './LoadingOverlay';

const SuperAdminDashboard = () => {
  const { user, getAllUsers, createAdmin, updateUserStatus, deleteUser } = useAuth();
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [adminStep, setAdminStep] = useState(1);
  const [showContactView, setShowContactView] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [contactStep, setContactStep] = useState(1);

  // consent form states
  // Consent form states
const [consentForms, setConsentForms] = useState([]);
const [consentSearchTerm, setConsentSearchTerm] = useState('');
const [consentCurrentPage, setConsentCurrentPage] = useState(1);
const [consentsPerPage, setConsentsPerPage] = useState(5);
const [showConsentView, setShowConsentView] = useState(false);
const [selectedConsent, setSelectedConsent] = useState(null);
const [consentViewStep, setConsentViewStep] = useState(1);
const [consentStatusUpdate, setConsentStatusUpdate] = useState({ status: '', remarks: '' });
const [viewedConsents, setViewedConsents] = useState(new Set());
const [showConsentDeleteConfirm, setShowConsentDeleteConfirm] = useState(false);
const [consentDeleteTarget, setConsentDeleteTarget] = useState({ id: '', name: '' });


  // Check if user signed up through Google (has googleId)
  const isGoogleUser = user?.googleId || user?.authProvider === 'google';

  // Search and pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(5);
  
  // Contact management states
  const [contacts, setContacts] = useState([]);
  const [contactSearchTerm, setContactSearchTerm] = useState('');
  const [contactCurrentPage, setContactCurrentPage] = useState(1);
  const [contactsPerPage, setContactsPerPage] = useState(5);

  // Safe date formatter to handle Firestore Timestamps, numbers, and strings
  const formatDate = (value) => {
    if (!value) return '—';
    let dateValue = null;
    if (typeof value?.toDate === 'function') {
      // Firestore Timestamp with toDate() (server-side objects that survived)
      dateValue = value.toDate();
    } else if (typeof value === 'object' && value !== null) {
      // Firestore Timestamp serialized over JSON, common shapes: { seconds, nanoseconds } or { _seconds, _nanoseconds }
      const seconds = typeof value.seconds === 'number' ? value.seconds : (typeof value._seconds === 'number' ? value._seconds : null);
      if (typeof seconds === 'number') {
        dateValue = new Date(seconds * 1000);
      }
    }
    if (!dateValue) {
      // Fallbacks: epoch ms number or ISO/string parseable
      if (typeof value === 'number') {
        dateValue = new Date(value);
      } else if (typeof value === 'string') {
        dateValue = new Date(value);
      }
    }
    if (!dateValue || isNaN(dateValue.getTime())) return '—';
    return dateValue.toLocaleDateString();
  };

  // Notification states
  const [viewedUsers, setViewedUsers] = useState(new Set());
  const [viewedContacts, setViewedContacts] = useState(new Set());
  const [viewedAdmins, setViewedAdmins] = useState(new Set());
  const [viewedApplications, setViewedApplications] = useState(new Set());

  // Row view modal
  const [showUserView, setShowUserView] = useState(false);
  const [selectedUserRow, setSelectedUserRow] = useState(null);

  // Delete confirmation modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form states
  const [adminForm, setAdminForm] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    department: ''
  });



  
  // Contact delete confirmation modal state
  const [showContactDeleteConfirm, setShowContactDeleteConfirm] = useState(false);
  const [contactDeleteTarget, setContactDeleteTarget] = useState({ id: '', name: '' });

  // Application management states
  const [applicationSearchTerm, setApplicationSearchTerm] = useState("");
  const [applicationsPerPage, setApplicationsPerPage] = useState(5);
  const [applications, setApplications] = useState([]);
  const [appCurrentPage, setAppCurrentPage] = useState(1);
  const [showAppView, setShowAppView] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [appViewStep, setAppViewStep] = useState(1);
  const [appUpdate, setAppUpdate] = useState({ status: '', remarks: '' });
  const [appStatusFilter, setAppStatusFilter] = useState('All');
  const [appTypeFilter, setAppTypeFilter] = useState('All');
  const [showAppUser, setShowAppUser] = useState(false);

  useEffect(() => {
    loadUsers();
    loadContacts();
    loadViewedStatus();
    loadApplications();
    loadConsentForms();
  }, []);



  const loadViewedStatus = () => {
    const savedViewedUsers = localStorage.getItem('superAdminViewedUsers');
    const savedViewedContacts = localStorage.getItem('superAdminViewedContacts');
    const savedViewedAdmins = localStorage.getItem('superAdminViewedAdmins');
    const savedViewedApplications = localStorage.getItem('superAdminViewedApplications');
    
    if (savedViewedUsers) {
      setViewedUsers(new Set(JSON.parse(savedViewedUsers)));
    }
    if (savedViewedContacts) {
      setViewedContacts(new Set(JSON.parse(savedViewedContacts)));
    }
    if (savedViewedAdmins) {
      setViewedAdmins(new Set(JSON.parse(savedViewedAdmins)));
    }
    if (savedViewedApplications) {
      setViewedApplications(new Set(JSON.parse(savedViewedApplications)));
    }
    const savedViewedConsents = localStorage.getItem('superAdminViewedConsents');
      if (savedViewedConsents) {
      setViewedConsents(new Set(JSON.parse(savedViewedConsents)));
}
  };

  const saveViewedStatus = (type, id) => {
    if (type === 'user') {
      const newViewedUsers = new Set([...viewedUsers, id]);
      setViewedUsers(newViewedUsers);
      localStorage.setItem('superAdminViewedUsers', JSON.stringify([...newViewedUsers]));
    } else if (type === 'contact') {
      const newViewedContacts = new Set([...viewedContacts, id]);
      setViewedContacts(newViewedContacts);
      localStorage.setItem('superAdminViewedContacts', JSON.stringify([...newViewedContacts]));
    } else if (type === 'admin') {
      const newViewedAdmins = new Set([...viewedAdmins, id]);
      setViewedAdmins(newViewedAdmins);
      localStorage.setItem('superAdminViewedAdmins', JSON.stringify([...newViewedAdmins]));
    } else if (type === 'application') {
      const newViewedApplications = new Set([...viewedApplications, id]);
      setViewedApplications(newViewedApplications);
      localStorage.setItem('superAdminViewedApplications', JSON.stringify([...newViewedApplications]));
    }
  };

  // Listen for contact updates
  useEffect(() => {
    const handleContactUpdate = () => {
      loadContacts();
    };

    window.addEventListener('contactUpdated', handleContactUpdate);
    return () => {
      window.removeEventListener('contactUpdated', handleContactUpdate);
    };
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const result = await getAllUsers();
    if (result.success) {
      setUsers(result.users);
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  const loadContacts = async () => {
    try {
      const contactsSnapshot = await getDocs(collection(db, 'Contact'));
      const contactsData = contactsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort by submission date (newest first)
      contactsData.sort((a, b) => {
        const dateA = a.submittedAt?.toDate ? a.submittedAt.toDate() : new Date(a.submittedAt);
        const dateB = b.submittedAt?.toDate ? b.submittedAt.toDate() : new Date(b.submittedAt);
        return dateB - dateA;
      });
      setContacts(contactsData);
    } catch (error) {
      console.error('Error loading contacts:', error);
      toast.error('Failed to load contacts');
    }
  };

  const loadApplications = async () => {
    try {
      // Avoid composite index by fetching all then sorting client-side
      const snap = await getDocs(collection(db, 'serviceRequests'));
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => {
        const ad = a.createdAt?.toDate ? a.createdAt.toDate() : (a.createdAt ? new Date(a.createdAt) : 0);
        const bd = b.createdAt?.toDate ? b.createdAt.toDate() : (b.createdAt ? new Date(b.createdAt) : 0);
        return bd - ad;
      });
      setApplications(items);
    } catch (e) {
      console.error('Error loading applications:', e);
      toast.error('Failed to load applications');
    }
  };

  const loadConsentForms = async () => {
  try {
    const snap = await getDocs(collection(db, 'serviceRequests'));
    const items = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(d => String(d.serviceKey).toLowerCase() === 'consent');
    items.sort((a, b) => {
      const ad = a.submittedAt?.toDate ? a.submittedAt.toDate() : (a.submittedAt ? new Date(a.submittedAt) : 0);
      const bd = b.submittedAt?.toDate ? b.submittedAt.toDate() : (b.submittedAt ? new Date(b.submittedAt) : 0);
      return bd - ad;
    });
    setConsentForms(items);
  } catch (e) {
    console.error('Error loading consent forms:', e);
    toast.error('Failed to load consent forms');
  }
};

const handleViewConsent = (consent) => {
  setSelectedConsent(consent);
  setConsentStatusUpdate({
    status: consent.status || 'pending',
    remarks: consent.remarks || ''
  });
  setConsentViewStep(1);
  setShowConsentView(true);
  // Mark as viewed
  const newViewed = new Set([...viewedConsents, consent.id]);
  setViewedConsents(newViewed);
  localStorage.setItem('superAdminViewedConsents', JSON.stringify([...newViewed]));
};

const handleUpdateConsentStatus = async () => {
  if (!selectedConsent) return;
  try {
    await updateDoc(doc(db, 'serviceRequests', selectedConsent.id), {
      status: consentStatusUpdate.status,
      remarks: consentStatusUpdate.remarks || '',
      reviewedBy: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Super Admin',
      reviewedAt: new Date()
    });
    toast.success('Consent form status updated!');
    setShowConsentView(false);
    loadConsentForms();
  } catch (e) {
    console.error(e);
    toast.error('Failed to update consent status');
  }
};

const handleDeleteConsent = (id, name) => {
  setConsentDeleteTarget({ id, name });
  setShowConsentDeleteConfirm(true);
};

const confirmConsentDelete = async () => {
  if (!consentDeleteTarget.id) return;
  try {
    setLoading(true);
    await deleteDoc(doc(db, 'serviceRequests', consentDeleteTarget.id));
    toast.success('Consent form deleted successfully');
    setShowConsentDeleteConfirm(false);
    setConsentDeleteTarget({ id: '', name: '' });
    loadConsentForms();
  } catch (e) {
    console.error(e);
    toast.error('Failed to delete consent form');
  } finally {
    setLoading(false);
  }
};


  // New applications indicator (not yet viewed)
  const newApplicationsCount = applications.filter((a) => !viewedApplications.has(a.id)).length;

  // Filter out current superadmin and apply search - only show regular users in User Management
  const filteredUsers = users.filter(userItem => 
    userItem._id !== user?._id && // Exclude current superadmin
    userItem.role === 'user' && // Only show regular users
    (userItem.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     userItem.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     userItem.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     userItem.username?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Filter admins for admin management tab
  const filteredAdmins = users.filter(userItem => 
    userItem._id !== user?._id && // Exclude current superadmin
    (userItem.role === 'admin' || userItem.role === 'super_admin') && // Only show admins
    (userItem.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     userItem.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     userItem.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     userItem.username?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // Contact filtering and pagination
  const filteredContacts = contacts.filter(contact => 
    contact.name?.toLowerCase().includes(contactSearchTerm.toLowerCase()) ||
    contact.email?.toLowerCase().includes(contactSearchTerm.toLowerCase()) ||
    contact.message?.toLowerCase().includes(contactSearchTerm.toLowerCase())
  );

  const indexOfLastContact = contactCurrentPage * contactsPerPage;
  const indexOfFirstContact = indexOfLastContact - contactsPerPage;
  const currentContacts = filteredContacts.slice(indexOfFirstContact, indexOfLastContact);
  const totalContactPages = Math.ceil(filteredContacts.length / contactsPerPage);

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Password strength: min 8, at least one number and one special char
    const pwd = adminForm.password || '';
    const hasMin = pwd.length >= 8;
    const hasNum = /\d/.test(pwd);
    const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd);
    if (!hasMin || !hasNum || !hasSpecial) {
      toast.error('Password must be 8+ chars with at least 1 number and 1 special character');
      setLoading(false);
      return;
    }

    const { username, email, password, firstName, lastName } = adminForm;
    const payload = { username, email, password, firstName, lastName };

    const result = await createAdmin(payload);
    if (result.success) {
      toast.success('Admin created successfully!');
      setShowCreateAdmin(false);
      setAdminForm({ username: '', email: '', password: '', firstName: '', lastName: '', phone: '', department: '' });
      loadUsers();
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  const handleStatusChange = async (userId, isActive) => {
    const result = await updateUserStatus(userId, isActive);
    if (result.success) {
      toast.success(`User ${isActive ? 'activated' : 'deactivated'} successfully!`);
      loadUsers();
    } else {
      toast.error(result.error);
    }
  };

  const handleDeleteUser = async (userId, userName, userType = 'user') => {
    setDeleteTarget({ id: userId, name: userName, type: userType });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget.id) return;

    setLoading(true);
    const result = await deleteUser(deleteTarget.id);
    if (result.success) {
      const successMessage = deleteTarget.type === 'admin' 
        ? `Admin ${deleteTarget.name} and all associated data deleted successfully`
        : `User ${deleteTarget.name} and all associated data deleted successfully`;
      toast.success(successMessage);
      setShowDeleteConfirm(false);
      setDeleteTarget({ id: '', name: '', type: '' });
      loadUsers();
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteTarget({ id: '', name: '', type: '' });
  };

  const handleViewContact = (contact) => {
    setSelectedContact(contact);
    setShowContactView(true);
    saveViewedStatus('contact', contact.id);
  };

  const handleDeleteContact = (contactId, contactName) => {
    setContactDeleteTarget({ id: contactId, name: contactName });
    setShowContactDeleteConfirm(true);
  };

  const confirmContactDelete = async () => {
    if (!contactDeleteTarget.id) return;
    try {
      setLoading(true);
      const docRef = doc(db, 'Contact', contactDeleteTarget.id);
      await deleteDoc(docRef);
      toast.success('Contact submission deleted successfully');
      setShowContactDeleteConfirm(false);
      setContactDeleteTarget({ id: '', name: '' });
      loadContacts();
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Failed to delete contact');
    } finally {
      setLoading(false);
    }
  };

  const cancelContactDelete = () => {
    setShowContactDeleteConfirm(false);
    setContactDeleteTarget({ id: '', name: '' });
  };

  //removed 2fa setup and handledisable

  const handleDeleteApplication = async () => {
    if (!deleteTarget) return;
    try {
      setLoading(true);
      const response = await fetch(`https://codes-4oz0.onrender.com/api/service-requests/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        setShowDeleteConfirm(false);
        setDeleteTarget(null);
        loadApplications();
        toast.success('Application deleted successfully!');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to delete application');
      }
    } catch (error) {
      console.error('Error deleting application:', error);
      toast.error('Failed to delete application');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      super_admin: 'bg-purple-100 text-purple-800',
      admin: 'bg-blue-100 text-blue-800',
      user: 'bg-gray-100 text-gray-800'
    };
    return badges[role] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (isActive) => {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  // Stats excluding current superadmin
  const stats = {
    total: users.filter(u => u._id !== user?._id).length,
    superAdmins: users.filter(u => u.role === 'super_admin' && u._id !== user?._id).length,
    admins: users.filter(u => u.role === 'admin').length,
    users: users.filter(u => u.role === 'user').length,
    active: users.filter(u => u.isActive && u._id !== user?._id).length,
    inactive: users.filter(u => !u.isActive && u._id !== user?._id).length
  };

  // Get new items count - only count regular users for User Management tab
  const newUsersCount = users.filter(u => !viewedUsers.has(u._id) && u._id !== user?._id && u.role === 'user').length;
  const newContactsCount = contacts.filter(c => !viewedContacts.has(c.id)).length;

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Reset to first page when users per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [usersPerPage]);

  // Reset to first page when contact search changes
  useEffect(() => {
    setContactCurrentPage(1);
  }, [contactSearchTerm]);

  // Reset to first page when contacts per page changes
  useEffect(() => {
    setContactCurrentPage(1);
  }, [contactsPerPage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pb-10">
      {loading && <LoadingOverlay />}
      {/* Header */}
      <div className="border-white/10">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div className="text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg text-left pt-4">{t('superAdminDashboard')}</h1>
              <p className="text-indigo-100 mt-1 drop-shadow-md italic text-left text-sm sm:text-base">{t('welcomeBack')}, {user?.firstName} {user?.lastName}</p>
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
              { id: 'users', name: t('userManagement'), count: newUsersCount, icon: '' },
              { id: 'admins', name: t('adminManagement') || 'Admin Management', count: newContactsCount, icon: '' },
              { id: 'applications', name: t('applicationManagement') || 'Application Management', count: newApplicationsCount, icon: '' },
              { id: 'contacts', name: t('contactManagement'), count: newContactsCount, icon: '' },
              { id: 'consents', name: 'Consent Forms', count: consentForms.filter(c => !viewedConsents.has(c.id)).length, icon:''}
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex-1 py-3 sm:py-4 px-3 sm:px-6 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 transform hover:scale-105 cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg border border-white/20'
                    : 'text-gray-300 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                  {/* <span className="text-lg">{tab.icon}</span> */}
                  <span className="text-center">{tab.name}</span>
                  {tab.count > 0 && (
                    <div className="relative">
                      <span className="absolute -top-2 -right-2 w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full animate-pulse border-2 border-white"></span>
                      <span className="ml-1 sm:ml-2 inline-flex items-center px-1 sm:px-2 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white shadow-lg">
                        {tab.count}
                      </span>
                    </div>
                  )}
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
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-4 sm:p-6 hover:bg-white/15 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-white">{t('userStatistics')}</h3>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <FaChartBar className="text-white text-sm sm:text-lg" />
                </div>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex justify-between items-center p-2 sm:p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-300 text-sm sm:text-base">{t('totalUsers')}:</span>
                  <span className="font-bold text-white text-base sm:text-lg">{stats.total}</span>
                </div>
                <div className="flex justify-between items-center p-2 sm:p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-300 text-sm sm:text-base">{t('otherSuperAdmins')}:</span>
                  <span className="font-bold text-purple-400 text-base sm:text-lg">{stats.superAdmins}</span>
                </div>
                <div className="flex justify-between items-center p-2 sm:p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-300 text-sm sm:text-base">{t('admins')}:</span>
                  <span className="font-bold text-blue-400 text-base sm:text-lg">{stats.admins}</span>
                </div>
                <div className="flex justify-between items-center p-2 sm:p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-300 text-sm sm:text-base">{t('regularUsers')}:</span>
                  <span className="font-bold text-green-400 text-base sm:text-lg">{stats.users}</span>
                </div>
                <div className="flex justify-between items-center p-2 sm:p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-300 text-sm sm:text-base">{t('activeUsers')}:</span>
                  <span className="font-bold text-emerald-400 text-base sm:text-lg">{stats.active}</span>
                </div>
                <div className="flex justify-between items-center p-2 sm:p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-300 text-sm sm:text-base">{t('inactiveUsers')}:</span>
                  <span className="font-bold text-red-400 text-base sm:text-lg">{stats.inactive}</span>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-4 sm:p-6 hover:bg-white/15 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-white">{t('quickActions')}</h3>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                  <FaBolt className="text-white text-sm sm:text-lg" />
                </div>
              </div>
              <div className="space-y-2 sm:space-y-3">
                <button
                  onClick={() => setShowCreateAdmin(true)}
                  className="w-full px-3 sm:px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors duration-200 text-sm sm:text-base cursor-pointer" 
                >
                  <FaUsers className="inline mr-2" /> {t('createNewAdmin')}
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className="w-full px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm sm:text-base cursor-pointer"
                >
                  <FaUser className="inline mr-2" /> {t('manageUsers')}
                </button>
                <button
                  onClick={() => setActiveTab('contacts')}
                  className="w-full px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 text-sm sm:text-base cursor-pointer"
                >
                  <FaEnvelope className="inline mr-2" /> {t('viewContacts')}
                </button>
                <button onClick={() => setActiveTab ('consents')} className="w-full p-3 sm:px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors duration-200 text-sm sm:text-base cursor-pointer">
                  <FaFileAlt className="inline mr-2" /> View Consent Forms
                </button>
                
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300 hover:scale-105 text-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Your Profile</h3>
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <FaUser className="text-white text-lg" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                  <span className="text-gray-300">Name:</span>
                  <span className="text-white font-medium">{user?.firstName} {user?.lastName}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                  <span className="text-gray-300">Email:</span>
                  <span className="text-white font-medium">{user?.email}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                  <span className="text-gray-300">Username:</span>
                  <span className="text-white font-medium">{user?.username}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                  <span className="text-gray-300">Role:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(user?.role)}`}>
                    {user?.role?.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                  <span className="text-gray-300">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(user?.isActive)}`}>
                    {user?.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                  <span className="text-gray-300">Account Type:</span>
                  <span className="text-sm text-white">
                    {isGoogleUser ? 'Google Account' : 'Regular Account'}
                  </span>
                </div>
              </div>
              {isGoogleUser && (
                <div className="mt-4 text-sm text-gray-300 bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/20">
                  <p className="font-medium text-white mb-1"><FaLock className="inline mr-2" />Google Account</p>
                  <p>Your password is managed by Google. To change your password, please visit your Google Account settings.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20">
            <div className="px-6 py-4 border-b border-white/20">
              <h3 className="text-lg font-semibold text-white">User Management</h3>
              <p className="text-sm text-gray-300 mt-1">Managing {filteredUsers.length} regular users</p>
            </div>
            
            {/* Search Bar */}
            <div className="px-6 py-4 border-b border-white/20">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="w-full md:w-[80%]">
                  <label htmlFor="search" className="sr-only">Search users</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaSearch className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                    </div>
                    <input
                      id="search"
                      type="text"
                      placeholder="Search by name, email, or username..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-9 pr-3 py-1.5 md:py-2 border border-white/20 rounded-lg leading-5 bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:placeholder-gray-300 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs md:text-sm"
                    />
                  </div>
                </div>
                
                {/* Users per page selector */}
                <div className="flex items-center space-x-2 md:self-auto">
                  <label htmlFor="usersPerPage" className="text-xs md:text-sm font-medium text-gray-300">
                    Show:
                  </label>
                  <div className="relative">
                    <select
                      id="usersPerPage"
                      value={usersPerPage}
                      onChange={(e) => setUsersPerPage(Number(e.target.value))}
                      className="block w-20 pr-7 pl-3 py-1.5 md:py-2 border border-white/20 rounded-lg leading-5 bg-cyan-700 backdrop-blur-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-600 focus:border-cyan-700 text-xs md:text-sm appearance-none"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={15}>15</option>
                      <option value={20}>20</option>
                    </select>
                    <FaChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 md:h-4 md:w-4 text-gray-300" />
                  </div>
                  <span className="text-xs md:text-sm text-gray-300">per page</span>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="p-6 text-center">
                <img src="./checkwize_logo.png" alt="Loading" className="w-10 h-10 mx-auto" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/20">
                    <thead className="bg-white/10">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Created</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-transparent divide-y divide-white/20">
                      {currentUsers.map((userItem) => (
                        <tr key={userItem._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 w-10 h-10">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                                  {userItem.firstName?.charAt(0)}{userItem.lastName?.charAt(0)}
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-white flex items-center">
                                  {userItem.firstName} {userItem.lastName}
                                  {!viewedUsers.has(userItem._id) && (
                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-500 text-white">
                                      NEW
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-300">{userItem.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge('user')}`}>
                              User
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleStatusChange(userItem._id, !userItem.isActive)}
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(userItem.isActive)}`}
                              disabled={userItem.role === 'super_admin'}
                            >
                              {userItem.isActive ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {formatDate(userItem.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedUserRow(userItem);
                                  setShowUserView(true);
                                  saveViewedStatus('user', userItem._id);
                                }}
                                className="text-indigo-400 hover:text-indigo-300 p-2 rounded-full hover:bg-white/10 transition-colors duration-200"
                                title="View User"
                              >
                                <FaEye className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => {
                                  handleStatusChange(userItem._id, !userItem.isActive);
                                  saveViewedStatus('user', userItem._id);
                                }}
                                className="text-blue-600 hover:text-blue-900 font-medium hover:bg-blue-50 px-3 py-1 rounded-md transition-colors duration-200"
                                disabled={userItem.role === 'super_admin'}
                              >
                                {userItem.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(userItem._id, `${userItem.firstName} ${userItem.lastName}`, 'user')}
                                className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50 transition-colors duration-200"
                                title="Delete User"
                                disabled={userItem.role === 'super_admin'}
                              >
                                <FaTrash className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-white/20">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-300">
                        Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} results
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-3 py-2 text-xs sm:text-sm font-medium text-gray-300 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors duration-200 ${
                              currentPage === page
                                ? 'bg-indigo-600 text-white shadow-lg'
                                : 'text-gray-300 bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        <button
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="px-3 py-2 text-xs sm:text-sm font-medium text-gray-300 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'admins' && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20">
            <div className="px-6 py-4 border-b border-white/20">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-white">Admin Management</h3>
                  <p className="text-sm text-gray-300 mt-1">Managing {filteredAdmins.length} admins</p>
                </div>
                <div>
                  <button
                    onClick={() => { setAdminStep(1); setShowCreateAdmin(true); }}
                    className="w-full sm:w-auto px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors duration-200"
                  >
                    Create New Admin
                  </button>
                </div>
              </div>
            </div>
            {loading ? (
              <div className="p-6 text-center">
                <img src="./checkwize_logo.png" alt="Loading" className="w-10 h-10 mx-auto" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/20">
                  <thead className="bg-white/10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Admin</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-transparent divide-y divide-white/20">
                    {filteredAdmins.map((admin) => (
                      <tr key={admin._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-white">
                              {admin.firstName} {admin.lastName}
                            </div>
                            <div className="text-sm text-gray-300">{admin.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(admin.role)}`}>
                            {admin.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(admin.isActive)}`}>
                            {admin.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {formatDate(admin.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setSelectedUserRow(admin);
                                setShowUserView(true);
                                saveViewedStatus('admin', admin._id);
                              }}
                              className="text-indigo-400 hover:text-indigo-300 p-2 rounded-full hover:bg-white/10 transition-colors duration-200"
                              title="View Admin"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            {admin.role !== 'super_admin' && (
                              <button
                                onClick={() => handleStatusChange(admin._id, !admin.isActive)}
                                className="text-blue-600 hover:text-blue-900 px-3 py-1 rounded-md hover:bg-blue-50 transition-colors duration-200"
                              >
                                {admin.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteUser(admin._id, `${admin.firstName} ${admin.lastName}`, 'admin')}
                              className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50 transition-colors duration-200"
                              title="Delete Admin"
                              disabled={admin.role === 'super_admin'}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20">
            <div className="px-6 py-4 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">
                Application Management
              </h3>
              <p className="text-sm text-gray-300 mt-1">
                Review and manage user verification applications
              </p>
            </div>

            {/* Search Bar */}
            <div className="px-6 py-4 border-b border-white/20">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="w-full md:w-[80%]">
                  <label htmlFor="applicationSearch" className="sr-only">
                    Search applications
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaSearch className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                    </div>
                    <input
                      id="applicationSearch"
                      type="text"
                      placeholder="Search by type, status, or user..."
                      value={applicationSearchTerm}
                      onChange={(e) => setApplicationSearchTerm(e.target.value)}
                      className="block w-full pl-9 pr-3 py-1.5 md:py-2 border border-white/20 rounded-lg leading-5 bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:placeholder-gray-300 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs md:text-sm"
                    />
                  </div>
                </div>

                {/* Applications per page selector */}
                <div className="flex items-center space-x-2 md:self-auto">
                  <label
                    htmlFor="applicationsPerPage"
                    className="text-xs md:text-sm font-medium text-gray-300"
                  >
                    Show:
                  </label>
                  <div className="relative">
                    <select
                      id="applicationsPerPage"
                      value={applicationsPerPage}
                      onChange={(e) =>
                        setApplicationsPerPage(Number(e.target.value))
                      }
                      className="block w-20 pr-7 pl-3 py-1.5 md:py-2 border border-white/20 rounded-lg leading-5 bg-cyan-700 backdrop-blur-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-600 focus:border-cyan-700 text-xs md:text-sm appearance-none"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={15}>15</option>
                      <option value={20}>20</option>
                    </select>
                    <FaChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 md:h-4 md:w-4 text-gray-300" />
                  </div>
                  <span className="text-xs md:text-sm text-gray-300">per page</span>
                </div>
              </div>
            </div>

            {/* Applications Table */}
            <div className="overflow-x-auto p-6">
              {/* Filters */}
              <div className="flex flex-wrap items-center justify-between mb-4">
                {/* Mobile dropdowns */}
                <div className="w-full flex flex-col gap-2 md:hidden">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-300">Status:</span>
                    <select value={appStatusFilter} onChange={(e)=>{ setAppStatusFilter(e.target.value); setAppCurrentPage(1); }} className="flex-1 px-2 py-1.5 rounded-lg bg-white/10 border border-white/20 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500">
                      {['All','Pending','Under Review','Insufficient','Approved','Rejected'].map(s => (
                        <option key={s} value={s} className="bg-slate-800 text-white">{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-300">Type:</span>
                    <select value={appTypeFilter} onChange={(e)=>{ setAppTypeFilter(e.target.value); setAppCurrentPage(1); }} className="flex-1 px-2 py-1.5 rounded-lg bg-white/10 border border-white/20 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500">
                      {['All', ...Array.from(new Set(applications.map(a => (a.serviceKey||'Verification').replace(/[-_]/g,'').replace(/\b\w/g, c => c.toUpperCase()) ))) ].map(t => (
                        <option key={t} value={t} className="bg-slate-800 text-white">{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {/* Desktop/Tablet pills */}
                <div className="hidden md:flex items-center space-x-2">
                  <span className="text-sm text-gray-300">Status:</span>
                  {['All','Pending','Under Review','Insufficient','Approved','Rejected'].map(s => (
                    <button key={s} onClick={()=>{ setAppStatusFilter(s); setAppCurrentPage(1); }} className={`px-2 py-1 rounded-full text-xs border ${appStatusFilter===s?'bg-indigo-600 text-white border-indigo-500':'bg-white/10 text-gray-300 border-white/20 hover:bg-white/20'}`}>{s}</button>
                  ))}
                </div>
                <div className="hidden md:flex items-center space-x-2 mt-2 sm:mt-0">
                  <span className="text-sm text-gray-300">Type:</span>
                  {['All', ...Array.from(new Set(applications.map(a => (a.serviceKey||'Verification').replace(/[-_]/g,' ').replace(/\b\w/g, c => c.toUpperCase()) ))) ].map(t => (
                    <button key={t} onClick={()=>{ setAppTypeFilter(t); setAppCurrentPage(1); }} className={`px-2 py-1 rounded-full text-xs border ${appTypeFilter===t?'bg-emerald-600 text-white border-emerald-500':'bg-white/10 text-gray-300 border-white/20 hover:bg-white/20'}`}>{t}</button>
                  ))}
                </div>
              </div>
              {applications.length === 0 ? (
                <div className="text-center">
                  <FaFileAlt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-300 text-lg">No applications yet</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-white/20">
                  <thead className="bg-white/10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Submitted</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-transparent divide-y divide-white/20">
                    {applications
                      .filter(a => {
                        const typeRaw = (a.serviceKey || 'Verification').replace(/[-_]/g,' ') .replace (/\b\w/g, (c) => c.toUpperCase ());
                        const type = (a.serviceKey || '').toLowerCase();
                        const statusVal = String(a.status || 'submitted').replace(/^submitted$/i,'Pending').replace(/_/g,' ');
                        const status = statusVal.toLowerCase();
                        const userInfo = (a.userId || '').toLowerCase();
                        const term = applicationSearchTerm.toLowerCase();
                        const bySearch = type.includes(term) || status.includes(term) || userInfo.includes(term);
                        const byStatus = appStatusFilter==='All' || status === appStatusFilter.toLowerCase();
                        const byType = appTypeFilter==='All' || typeRaw===appTypeFilter;
                        return bySearch && byStatus && byType;
                      })
                      .slice((appCurrentPage - 1) * applicationsPerPage, appCurrentPage * applicationsPerPage)
                      .map(app => (
                      <tr key={app.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{app.userName || app.userEmail || app.userId || '—'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {(app.serviceKey || 'Verification').replace(/[-_]/g, ' ') .replace(/\b\w/g, (c) => c.toUpperCase())}
                          {String(app.serviceKey).toLowerCase() === 'references' && Array.isArray(app.referenceNames) && app.referenceNames.length > 0 && (
                            <div className="text-xs text-gray-300 mt-1 break-all">{app.referenceNames.join(', ')}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {String(app.serviceKey).toLowerCase() === 'references' ? (
                            <span className="text-sm text-gray-400">—</span>
                          ) : (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              (app.status || 'submitted').toLowerCase() === 'approved' ? 'bg-green-100 text-green-800' :
                              (app.status || '').toLowerCase() === 'rejected' ? 'bg-red-100 text-red-800' :
                              (app.status || '').toLowerCase() === 'under_review' ? 'bg-blue-100 text-blue-800' :
                              (app.status || '').toLowerCase() === 'insufficient' ? 'bg-orange-100 text-orange-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {String(app.status || 'Pending').replace(/^submitted$/i,'Pending').replace(/_/g,' ')}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{formatDate(app.createdAt)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            {String(app.serviceKey).toLowerCase() !== 'references' && (
                              <button
                                onClick={() => { setSelectedApp(app); setAppUpdate({ status: String(app.status || '').replace(/^submitted$/i,'Pending'), remarks: app.remarks || '' }); setAppViewStep(1); setShowAppView(true); saveViewedStatus('application', app.id); }}
                                className="text-indigo-400 hover:text-indigo-300 p-2 rounded-full hover:bg-white/10 transition-colors duration-200"
                                title="Review"
                              >
                                <FaEye className="w-5 h-5" />
                              </button>
                            )}
                            <button
                              onClick={() => { setSelectedApp(app); setShowAppUser(true); }}
                              className="text-blue-400 hover:text-blue-300 p-2 rounded-full hover:bg-white/10 transition-colors duration-200"
                              title="View User"
                            >
                              <FaUser className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => { setDeleteTarget({ id: app.id, type: 'application', name: `${app.userName || app.userEmail || app.userId} - ${app.type}` }); setShowDeleteConfirm(true); }}
                              className="text-red-400 hover:text-red-300 p-2 rounded-full hover:bg-white/10 transition-colors duration-200"
                              title="Delete Application"
                            >
                              <FaTrash className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {Math.ceil(applications.filter(a => {
              const type = (a.serviceKey || '').toLowerCase();
              const status = (a.status || '').toLowerCase();
              const userInfo = (a.userId || '').toLowerCase();
              const term = applicationSearchTerm.toLowerCase();
              return type.includes(term) || status.includes(term) || userInfo.includes(term);
            }).length / applicationsPerPage) > 1 && (
              <div className="px-6 py-4 border-t border-white/20">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-300">
                    Showing {(appCurrentPage - 1) * applicationsPerPage + 1} to {Math.min(appCurrentPage * applicationsPerPage, applications.length)} of {applications.length} results
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => setAppCurrentPage(appCurrentPage - 1)} disabled={appCurrentPage === 1} className="px-3 py-2 text-sm font-medium text-gray-300 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
                    <button onClick={() => setAppCurrentPage(appCurrentPage + 1)} disabled={appCurrentPage * applicationsPerPage >= applications.length} className="px-3 py-2 text-sm font-medium text-gray-300 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Application Review Modal */}
        {showAppView && selectedApp && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-[9999] flex items-center justify-center modal-backdrop">
            <div className="relative mx-auto p-3 sm:p-0 w-full sm:w-full max-w-2xl">
              <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 transform transition-all">
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/20">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                      <FaFileAlt className="w-5 h-5 text-white" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-white">Review Application</h3>
                      <p className="text-sm text-gray-300">{(selectedApp.serviceKey || 'Verification').replace(/[-_]/g, ' ') .replace(/\b\w/g, (c) => c.toUpperCase())}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowAppView(false)} className="text-gray-400 hover:text-white transition-colors duration-200"><FaTimes className="w-6 h-6" /></button>
                </div>
                <div className="px-4 sm:px-6 py-4 space-y-4">
                  {/* Desktop/tablet full layout */}
                  <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300">User</label>
                      <p className="text-sm text-white">{selectedApp.userName || selectedApp.userEmail || selectedApp.userId}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300">Submitted</label>
                      <p className="text-sm text-white">{formatDate(selectedApp.createdAt)}</p>
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <label className="block text-sm font-medium text-gray-300">Documents</label>
                    <div className="mt-2 space-y-2">
                      {Object.entries(selectedApp).filter(([k,v]) => {
                        if (['userId','status','serviceKey','createdAt','reviewedAt','reviewedBy','notes','remarks','id','userName','userEmail','isAllServicesSubmission','allServicesTimestamp'].includes(k)) return false;
                        if (Array.isArray(v)) return v.some(x => typeof x === 'string' && x.startsWith('http'));
                        return typeof v === 'string' && v.startsWith('http');
                      }).map(([k,v]) => (
                        <div key={k} className="bg-white/5 rounded-lg p-3 border border-white/10">
                          <div className="text-xs text-gray-400 mb-2">{k.replace(/[-_]/g,' ')}</div>
                          {Array.isArray(v) ? (
                            <div className="space-y-2">
                              {v.filter(u => typeof u === 'string').map((u, idx) => {
                                const path = (() => { try { const decoded = decodeURIComponent(u); const m = decoded.match(/\/o\/(.*)\?alt=/); if (m && m[1]) return m[1]; return decoded.split('/o/')[1]?.split('?')[0] || '' } catch { return '' } })();
                                return (
                                  <button key={idx} onClick={() => window.open(u, '_blank')} className="text-indigo-300 hover:text-indigo-200 underline break-all text-sm text-left">Open document {idx+1}</button>
                                )
                              })}
                            </div>
                          ) : (
                            (()=>{
                              const path = (() => {
                                try {
                                  const decoded = decodeURIComponent(String(v))
                                  const m = decoded.match(/\/o\/(.*)\?alt=/)
                                  if (m && m[1]) return m[1]
                                  return decoded.split('/o/')[1]?.split('?')[0] || ''
                                } catch { return '' }
                              })()
                              return (
                               <button onClick={() => window.open(String(v), '_blank')} className="text-indigo-300 hover:text-indigo-200 underline break-all text-sm text-left">Open document</button> 
                              )
                            })()
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Location - Desktop */}
                  {(selectedApp.detectedAddress || selectedApp.latitude) && (
                    <div className="hidden sm:block">
                      <label className="block text-sm font-medium text-gray-300 mb-2">Submitted Location</label>
                      <div className="bg-white/5 rounded-lg p-3 border border-white/10 space-y-1">
                        {selectedApp.detectedAddress && (
                          <p className="text-sm text-white">{selectedApp.detectedAddress}</p>
                        )}
                        {selectedApp.latitude && (
                          <p className="text-xs text-gray-400">
                            {selectedApp.latitude}, {selectedApp.longitude}
                          </p>
                        )}
                        {selectedApp.latitude && (
                          <a href={`https://www.google.com/maps?q=${selectedApp.latitude},${selectedApp.longitude}`}
                            target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline text-sm block">
                            View on Google Maps ↗
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300">Status</label>
                      <select value={appUpdate.status} onChange={(e)=>setAppUpdate(s=>({ ...s, status: e.target.value }))} className="mt-1 block w-full bg-gray-800/90 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:bg-gray-700/90 transition-colors duration-200">
                        <option value="Pending" className="bg-gray-800 text-white">Pending</option>
                        <option value="Under Review" className="bg-gray-800 text-white">Under Review</option>
                        <option value="Insufficient" className="bg-gray-800 text-white">Insufficient</option>
                        <option value="Approved" className="bg-gray-800 text-white">Approved</option>
                        <option value="Rejected" className="bg-gray-800 text-white">Rejected</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300">Remarks</label>
                      <input value={appUpdate.remarks} onChange={(e)=>setAppUpdate(s=>({ ...s, remarks: e.target.value }))} className="mt-1 block w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 text-white" placeholder="Optional remarks" />
                    </div>
                  </div>

                  {/* Mobile 2-step content */}
                  <div className="sm:hidden">
                    {appViewStep === 1 && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-300">User</label>
                            <p className="text-sm text-white">{selectedApp.userName || selectedApp.userEmail || selectedApp.userId}</p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-300">Submitted</label>
                            <p className="text-sm text-white">{formatDate(selectedApp.createdAt)}</p>
                          </div>
                        </div>
                        {(selectedApp.detectedAddress || selectedApp.latitude) && (
                          <div className="bg-white/5 rounded-lg p-3 border border-white/10 space-y-1">
                            <label className="block text-xs font-medium text-gray-300 mb-1">
                              Submitted Location
                            </label>
                            {selectedApp.detectedAddress && (
                              <p className="text-sm text-white break-words">{selectedApp.detectedAddress}</p>
                            )}
                            {selectedApp.latitude && (
                              <a href={`https://www.google.com/maps?q=${selectedApp.latitude},${selectedApp.longitude}`}
                                target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline text-sm">
                                View on Google Maps
                              </a>
                            )}
                          </div>
                        )}
                        <div className="grid grid-cols-1 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-300">Status</label>
                            <select value={appUpdate.status} onChange={(e)=>setAppUpdate(s=>({ ...s, status: e.target.value }))} className="mt-1 block w-full bg-gray-800/90 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 text-white">
                              {['Pending','Under Review','Insufficient','Approved','Rejected'].map(s => (<option key={s} value={s} className="bg-gray-800 text-white">{s}</option>))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-300">Remarks</label>
                            <input value={appUpdate.remarks} onChange={(e)=>setAppUpdate(s=>({ ...s, remarks: e.target.value }))} className="mt-1 block w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 text-white" placeholder="Optional remarks" />
                          </div>
                        </div>
                      </div>
                    )}
                    {appViewStep === 2 && (
                      <div>
                        <label className="block text-xs font-medium text-gray-300">Documents</label>
                        <div className="mt-2 space-y-2">
                          {Object.entries(selectedApp).filter(([k,v]) => {
                            if (['userId','status','serviceKey','createdAt','reviewedAt','reviewedBy','notes','remarks','id','userName','userEmail','isAllServicesSubmission','allServicesTimestamp'].includes(k)) return false;
                            if (Array.isArray(v)) return v.some(x => typeof x === 'string' && x.startsWith('http'));
                            return typeof v === 'string' && v.startsWith('http');
                          }).map(([k,v]) => (
                            <div key={k} className="bg-white/5 rounded-lg p-3 border border-white/10">
                              <div className="text-xs text-gray-400 mb-2">{k.replace(/[-_]/g,' ')}</div>
                              {Array.isArray(v) ? (
                                <div className="space-y-2">
                                  {v.filter(u => typeof u === 'string').map((u, idx) => {
                                    const path = (() => { try { const decoded = decodeURIComponent(u); const m = decoded.match(/\/o\/(.*)\?alt=/); if (m && m[1]) return m[1]; return decoded.split('/o/')[1]?.split('?')[0] || '' } catch { return '' } })();
                                    return (
                                     <button key={idx} onClick={() => window.open(u, '_blank')} className="text-indigo-300 hover:text-indigo-200 underline break-all text-sm text-left">Open document {idx+1}</button> 
                                    )
                                  })}
                                </div>
                              ) : (
                                (()=>{
                                  const path = (() => { try { const decoded = decodeURIComponent(String(v)); const m = decoded.match(/\/o\/(.*)\?alt=/); if (m && m[1]) return m[1]; return decoded.split('/o/')[1]?.split('?')[0] || '' } catch { return '' } })();
                                  return (
                                    <button onClick={() => window.open(String(v), '_blank')} className="text-indigo-300 hover:text-indigo-200 underline break-all text-sm text-left">Open document</button>
                                  )
                                })()
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <button onClick={()=> setAppViewStep(s=> Math.max(1, s-1))} disabled={appViewStep===1} className="px-3 py-2 text-xs font-medium text-gray-300 bg-white/10 border border-white/20 rounded-lg disabled:opacity-50">Previous</button>
                      <span className="text-xs text-gray-400">Step {appViewStep} of 2</span>
                      {appViewStep < 2 ? (
                        <button onClick={()=> setAppViewStep(2)} className="px-3 py-2 text-xs font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg">Next</button>
                      ) : (
                        <button onClick={()=> setAppViewStep(1)} className="px-3 py-2 text-xs font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg">Back to Summary</button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end space-x-3 px-6 py-4 bg-white/5 rounded-b-2xl">
                  <button onClick={()=>setShowAppView(false)} className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/20">Close</button>
                  <button onClick={async ()=>{
                    try {
                      const toBackend = (s)=> s === 'Pending' ? 'submitted' : s.toLowerCase().replace(/\s+/g,'_');
                      await updateDoc(doc(db,'serviceRequests', selectedApp.id), {
                        status: toBackend(appUpdate.status),
                        remarks: appUpdate.remarks || '',
                        reviewedBy: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Super Admin',
                        reviewedAt: new Date()
                      });
                      toast.success('Application updated');
                      setShowAppView(false);
                      loadApplications();
                    } catch (e) {
                      console.error(e);
                      toast.error('Failed to update application');
                    }
                  }} className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">Save</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Application User Modal */}
        {showAppUser && selectedApp && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-[9999] flex items-center justify-center modal-backdrop">
            <div className="relative mx-auto p-0 w-full max-w-md">
              <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 transform transition-all">
                <div className="flex items-center justify-between p-6 border-b border-white/20">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center">
                      <FaUser className="w-5 h-5 text-white" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-white">Application User</h3>
                      <p className="text-sm text-gray-300">Identifier and quick actions</p>
                    </div>
                  </div>
                  <button onClick={() => setShowAppUser(false)} className="text-gray-400 hover:text-white transition-colors duration-200"><FaTimes className="w-6 h-6" /></button>
                </div>
                <div className="px-6 py-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300">User Identifier</label>
                    <p className="text-sm text-white break-all">{selectedApp.userId || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center justify-end space-x-3 px-6 py-4 bg-white/5 rounded-b-2xl">
                  <button onClick={()=>setShowAppUser(false)} className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/20">Close</button>
                </div>
              </div>
            </div>
          </div>
        )}


        {activeTab === 'contacts' && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20">
            <div className="px-6 py-4 border-b border-white/20">
              <h3 className="text-lg font-semibold text-white">Contact Management</h3>
              <p className="text-sm text-gray-300 mt-1">Managing {filteredContacts.length} contact submissions</p>
            </div>
            
            {/* Search Bar */}
            <div className="px-6 py-4 border-b border-white/20">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="w-full md:w-[80%]">
                  <label htmlFor="contactSearch" className="sr-only">Search contacts</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaSearch className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                    </div>
                    <input
                      id="contactSearch"
                      type="text"
                      placeholder="Search by name, email, or message..."
                      value={contactSearchTerm}
                      onChange={(e) => setContactSearchTerm(e.target.value)}
                      className="block w-full pl-9 pr-3 py-1.5 md:py-2 border border-white/20 rounded-lg leading-5 bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:placeholder-gray-300 focus:ring-1 focus:ring-cyan-600 focus:border-cyan-700 text-xs md:text-sm"
                    />
                  </div>
                </div>
                
                {/* Contacts per page selector */}
                <div className="flex items-center space-x-2 md:self-auto">
                  <label htmlFor="contactsPerPage" className="text-xs md:text-sm font-medium text-gray-300">
                    Show:
                  </label>
                  <div className="relative">
                    <select
                      id="contactsPerPage"
                      value={contactsPerPage}
                      onChange={(e) => setContactsPerPage(Number(e.target.value))}
                      className="block w-20 pr-7 pl-3 py-1.5 md:py-2 border border-white/20 rounded-lg leading-5 bg-cyan-700 backdrop-blur-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-600 focus:border-cyan-700 text-xs md:text-sm appearance-none"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={15}>15</option>
                      <option value={20}>20</option>
                    </select>
                    <FaChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 md:h-4 md:w-4 text-gray-300" />
                  </div>
                  <span className="text-xs md:text-sm text-gray-300">per page</span>
                </div>
              </div>
            </div>

            {filteredContacts.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-300">No contact submissions found.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/20">
                    <thead className="bg-white/10">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Contact</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Company Info</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Message</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User Info</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Submitted</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-transparent divide-y divide-white/20">
                      {currentContacts.map((contact) => (
                        <tr key={contact.id}>
                                                     <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 w-10 h-10">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold">
                                  {contact.name?.charAt(0)}
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-white flex items-center">
                                  {contact.name}
                                  {!viewedContacts.has(contact.id) && (
                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-500 text-white">
                                      NEW
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-300">{contact.email}</div>
                                {contact.phone && (
                                  <div className="text-sm text-gray-300">{contact.phone}</div>
                                )}
                              </div>
                            </div>
                          </td>
                           <td className="px-6 py-4">
                             {contact.companyInfo && (
                               <div className="text-sm text-white">
                                 {contact.companyInfo.companyName && (
                                   <div className="font-medium">{contact.companyInfo.companyName}</div>
                                 )}
                                 {contact.companyInfo.companyPhone && (
                                   <div className="text-gray-300">{contact.companyInfo.companyPhone}</div>
                                 )}
                                 {contact.companyInfo.companyEmail && (
                                   <div className="text-gray-300">{contact.companyInfo.companyEmail}</div>
                                 )}
                                 {contact.companyInfo.companyAddress && (
                                   <div className="text-gray-300 max-w-xs truncate" title={contact.companyInfo.companyAddress}>
                                     {contact.companyInfo.companyAddress}
                                   </div>
                                 )}
                                 {!contact.companyInfo.companyName && !contact.companyInfo.companyPhone && !contact.companyInfo.companyEmail && !contact.companyInfo.companyAddress && (
                                   <span className="text-gray-400 italic">No company info</span>
                                 )}
                               </div>
                             )}
                           </td>
                           <td className="px-6 py-4">
                             <div className="text-sm text-white max-w-xs truncate" title={contact.message}>
                               {contact.message}
                             </div>
                           </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-300">
                              {contact.userRole === 'guest' ? (
                                <span className="px-2 py-1 bg-white/10 text-white rounded-full text-xs backdrop-blur-sm">
                                  Guest User
                                </span>
                              ) : (
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  contact.userRole === 'super_admin' ? 'bg-purple-500/20 text-purple-300' :
                                  contact.userRole === 'admin' ? 'bg-blue-500/20 text-blue-300' :
                                  'bg-green-500/20 text-green-300'
                                }`}>
                                  {contact.userRole?.replace('_', ' ')}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                             {formatDate(contact.submittedAt)}
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                             <div className="flex space-x-2">
                               <button
                                 onClick={() => handleViewContact(contact)}
                                 className="text-indigo-400 hover:text-indigo-300 p-2 rounded-full hover:bg-white/10 transition-colors duration-200"
                                 title="View Details"
                               >
                                 <FaEye className="w-5 h-5" />
                               </button>
                                                             <button
                                onClick={() => handleDeleteContact(contact.id, contact.name)}
                                className="text-red-400 hover:text-red-300 p-2 rounded-full hover:bg-white/10 transition-colors duration-200"
                                title="Delete Contact"
                              >
                                 <FaTrash className="w-5 h-5" />
                               </button>
                             </div>
                           </td>
                         </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalContactPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        Showing {indexOfFirstContact + 1} to {Math.min(indexOfLastContact, filteredContacts.length)} of {filteredContacts.length} results
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setContactCurrentPage(contactCurrentPage - 1)}
                          disabled={contactCurrentPage === 1}
                          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        {Array.from({ length: totalContactPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setContactCurrentPage(page)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                              contactCurrentPage === page
                                ? 'bg-indigo-600 text-white shadow-lg'
                                : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        <button
                          onClick={() => setContactCurrentPage(contactCurrentPage + 1)}
                          disabled={contactCurrentPage === totalContactPages}
                          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
      
      {activeTab === 'consents' && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20">
            <div className="px-6 py-4 border-b border-white/20">
              <h3 className="text-lg font-semibold text-white">Consent Form Submissions</h3>
              <p className="text-sm text-gray-300 mt-1">
                Review and respond to candidate declaration forms
              </p>
            </div>

            {/* Search + per page */}
            <div className="px-6 py-4 border-b border-white/20">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="w-full md:w-[80%]">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaSearch className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={consentSearchTerm}
                      onChange={(e) => { setConsentSearchTerm(e.target.value); setConsentCurrentPage(1); }}
                      className="block w-full pl-9 pr-3 py-1.5 md:py-2 border border-white/20 rounded-lg bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs md:text-sm"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-xs md:text-sm font-medium text-gray-300">Show:</label>
                  <div className="relative">
                    <select
                      value={consentsPerPage}
                      onChange={(e) => { setConsentsPerPage(Number(e.target.value)); setConsentCurrentPage(1); }}
                      className="block w-20 pr-7 pl-3 py-1.5 md:py-2 border border-white/20 rounded-lg bg-cyan-700 text-white focus:outline-none text-xs md:text-sm appearance-none"
                    >
                      {[5,10,15,20].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <FaChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-300" />
                  </div>
                  <span className="text-xs md:text-sm text-gray-300">per page</span>
                </div>
              </div>
            </div>

            {consentForms.length === 0 ? (
              <div className="p-6 text-center">
                <FaFileAlt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-300 text-lg">No consent forms submitted yet.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/20">
                    <thead className="bg-white/10">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Candidate</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Full Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Submitted</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-transparent divide-y divide-white/20">
                      {consentForms
                        .filter(c =>
                          (c.userName || '').toLowerCase().includes(consentSearchTerm.toLowerCase()) ||
                          (c.userEmail || '').toLowerCase().includes(consentSearchTerm.toLowerCase()) ||
                          (c.personal?.fullName || '').toLowerCase().includes(consentSearchTerm.toLowerCase())
                        )
                        .slice((consentCurrentPage - 1) * consentsPerPage, consentCurrentPage * consentsPerPage)
                        .map(consent => (
                          <tr key={consent.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                                  {(consent.userName || consent.userEmail || '?').charAt(0).toUpperCase()}
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-white flex items-center gap-2">
                                    {consent.userName || consent.userEmail || consent.userId}
                                    {!viewedConsents.has(consent.id) && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-500 text-white">NEW</span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-400">{consent.userEmail}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {consent.personal?.fullName || consent.consentData?.fullName || '—'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                consent.status === 'approved' ? 'bg-green-100 text-green-800' :
                                consent.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {consent.status === 'pending' || !consent.status ? 'Pending' :
                                 consent.status.charAt(0).toUpperCase() + consent.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {formatDate(consent.submittedAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleViewConsent(consent)}
                                  className="text-emerald-400 hover:text-emerald-300 p-2 rounded-full hover:bg-white/10 transition-colors duration-200"
                                  title="Review Consent Form"
                                >
                                  <FaEye className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteConsent(consent.id, consent.userName || consent.userEmail)}
                                  className="text-red-400 hover:text-red-300 p-2 rounded-full hover:bg-white/10 transition-colors duration-200"
                                  title="Delete"
                                >
                                  <FaTrash className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {Math.ceil(consentForms.filter(c =>
                  (c.userName || '').toLowerCase().includes(consentSearchTerm.toLowerCase()) ||
                  (c.userEmail || '').toLowerCase().includes(consentSearchTerm.toLowerCase()) ||
                  (c.personal?.fullName || '').toLowerCase().includes(consentSearchTerm.toLowerCase())
                ).length / consentsPerPage) > 1 && (
                  <div className="px-6 py-4 border-t border-white/20">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-300">
                        Showing {(consentCurrentPage - 1) * consentsPerPage + 1} to{' '}
                        {Math.min(consentCurrentPage * consentsPerPage, consentForms.length)} of {consentForms.length} results
                      </div>
                      <div className="flex space-x-2">
                        <button onClick={() => setConsentCurrentPage(p => Math.max(1, p - 1))} disabled={consentCurrentPage === 1} className="px-3 py-2 text-sm font-medium text-gray-300 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
                        <button onClick={() => setConsentCurrentPage(p => p + 1)} disabled={consentCurrentPage * consentsPerPage >= consentForms.length} className="px-3 py-2 text-sm font-medium text-gray-300 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

      {/* Consent Form Review Modal */}
      {showConsentView && selectedConsent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-[9999] flex items-center justify-center">
          <div className="relative mx-auto p-3 sm:p-0 w-full max-w-3xl">
            <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20">
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/20">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <FaFileAlt className="w-5 h-5 text-white" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-white">Consent Form Review</h3>
                    <p className="text-sm text-gray-300">{selectedConsent.userName || selectedConsent.userEmail}</p>
                  </div>
                </div>
                <button onClick={() => setShowConsentView(false)} className="text-gray-400 hover:text-white">
                  <FaTimes className="w-6 h-6" />
                </button>
              </div>

              {/* Step tabs */}
              <div className="flex border-b border-white/20 overflow-x-auto">
                {['Personal', 'Address', 'Education', 'Employment', 'References', 'Other', 'Decision'].map((label, idx) => (
                  <button
                    key={label}
                    onClick={() => setConsentViewStep(idx + 1)}
                    className={`flex-1 min-w-max px-3 py-3 text-xs font-medium transition-colors ${
                      consentViewStep === idx + 1
                        ? 'text-emerald-300 border-b-2 border-emerald-400 bg-white/5'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Step content */}
              <div className="px-4 sm:px-6 py-5 max-h-[60vh] overflow-y-auto">

                {consentViewStep === 1 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-emerald-300 uppercase tracking-wider mb-3">Personal Details</h4>
                    {[
                      ['Full Name', selectedConsent.personal?.fullName],
                      ["Father's Name", selectedConsent.personal?.fatherName],
                      ['Date of Birth', selectedConsent.personal?.dob],
                      ['Phone', selectedConsent.personal?.phone],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                        <span className="text-gray-300 text-sm">{label}</span>
                        <span className="text-white text-sm font-medium">{value || '—'}</span>
                      </div>
                    ))}
                  </div>
                )}

                {consentViewStep === 2 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-emerald-300 uppercase tracking-wider mb-3">Address</h4>
                    {[
                      ['Street', selectedConsent.address?.street],
                      ['City', selectedConsent.address?.city],
                      ['State', selectedConsent.address?.state],
                      ['PIN / ZIP', selectedConsent.address?.pin],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                        <span className="text-gray-300 text-sm">{label}</span>
                        <span className="text-white text-sm font-medium">{value || '—'}</span>
                      </div>
                    ))}
                  </div>
                )}

                {consentViewStep === 3 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-emerald-300 uppercase tracking-wider mb-3">Education</h4>
                    {(selectedConsent.education || []).map((edu, idx) => (
                      <div key={idx} className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <p className="text-xs text-gray-400 font-semibold mb-3 uppercase tracking-wider">Education #{idx + 1}</p>
                        {[
                          ['Course / Degree', edu.course],
                          ['University', edu.university],
                          ['Year of Passing', edu.year],
                          ['Grade / CGPA', edu.grade],
                        ].map(([label, value]) => (
                          <div key={label} className="flex justify-between py-1.5 border-b border-white/5 last:border-0">
                            <span className="text-gray-400 text-sm">{label}</span>
                            <span className="text-white text-sm">{value || '—'}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                    {(!selectedConsent.education || selectedConsent.education.length === 0) && (
                      <p className="text-gray-400 italic text-sm">No education records provided.</p>
                    )}
                  </div>
                )}

                {consentViewStep === 4 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-emerald-300 uppercase tracking-wider mb-3">Employment History</h4>
                    {(selectedConsent.employment || []).map((emp, idx) => (
                      <div key={idx} className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <p className="text-xs text-gray-400 font-semibold mb-3 uppercase tracking-wider">Employment #{idx + 1}</p>
                        {[
                          ['Company', emp.company],
                          ['Designation', emp.designation],
                          ['From', emp.from],
                          ['To', emp.to],
                        ].map(([label, value]) => (
                          <div key={label} className="flex justify-between py-1.5 border-b border-white/5 last:border-0">
                            <span className="text-gray-400 text-sm">{label}</span>
                            <span className="text-white text-sm">{value || '—'}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                    {(!selectedConsent.employment || selectedConsent.employment.length === 0) && (
                      <p className="text-gray-400 italic text-sm">No employment records provided.</p>
                    )}
                  </div>
                )}

                {consentViewStep === 5 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-emerald-300 uppercase tracking-wider mb-3">References</h4>
                    {(selectedConsent.references || []).map((ref, idx) => (
                      <div key={idx} className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <p className="text-xs text-gray-400 font-semibold mb-3 uppercase tracking-wider">Reference #{idx + 1}</p>
                        {[
                          ['Name', ref.name],
                          ['Email', ref.email],
                          ['Phone', ref.phone],
                          ['Relationship', ref.relationship],
                        ].map(([label, value]) => (
                          <div key={label} className="flex justify-between py-1.5 border-b border-white/5 last:border-0">
                            <span className="text-gray-400 text-sm">{label}</span>
                            <span className="text-white text-sm">{value || '—'}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                    {(!selectedConsent.references || selectedConsent.references.length === 0) && (
                      <p className="text-gray-400 italic text-sm">No references provided.</p>
                    )}
                  </div>
                )}

                {consentViewStep === 6 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-emerald-300 uppercase tracking-wider mb-3">Other Details</h4>
                    {[
                      ['Criminal Case', selectedConsent.other?.criminal],
                      ['Health Conditions', selectedConsent.other?.health],
                      ['Additional Remarks', selectedConsent.other?.remarks],
                    ].map(([label, value]) => (
                      <div key={label} className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-gray-400 text-xs mb-1">{label}</p>
                        <p className="text-white text-sm">{value || '—'}</p>
                      </div>
                    ))}
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-gray-400 text-xs mb-1">Declaration Agreed</p>
                      <p className="text-white text-sm">{selectedConsent.consentData?.agreed ? 'Yes' : 'No'}</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-gray-400 text-xs mb-1">Signature</p>
                      <p className="text-white text-sm font-medium italic">{selectedConsent.consentData?.signature || '—'}</p>
                    </div>
                  </div>
                )}

                {consentViewStep === 7 && (
                  <div className="space-y-5">
                    <h4 className="text-sm font-semibold text-emerald-300 uppercase tracking-wider mb-3">Review Decision</h4>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Set Status</label>
                        <div className="flex gap-3 flex-wrap">
                          {['pending', 'approved', 'rejected'].map(s => (
                            <button
                              key={s}
                              onClick={() => setConsentStatusUpdate(prev => ({ ...prev, status: s }))}
                              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${
                                consentStatusUpdate.status === s
                                  ? s === 'approved' ? 'bg-green-600 border-green-500 text-white' :
                                    s === 'rejected' ? 'bg-red-600 border-red-500 text-white' :
                                    'bg-yellow-600 border-yellow-500 text-white'
                                  : 'bg-white/10 border-white/20 text-gray-300 hover:bg-white/20'
                              }`}
                            >
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Remarks (optional)</label>
                        <textarea
                          rows={3}
                          value={consentStatusUpdate.remarks}
                          onChange={e => setConsentStatusUpdate(prev => ({ ...prev, remarks: e.target.value }))}
                          placeholder="Add any notes for this candidate..."
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm resize-none"
                        />
                      </div>
                      {consentStatusUpdate.status === 'approved' && (
                        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                          <p className="text-green-300 text-sm">
                            ✅ Approving this form will allow the candidate to submit documents for verification.
                          </p>
                        </div>
                      )}
                      {consentStatusUpdate.status === 'rejected' && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                          <p className="text-red-300 text-sm">
                            ❌ Rejecting this form will prevent the candidate from submitting documents.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-white/5 rounded-b-2xl border-t border-white/20">
                <div className="flex gap-2">
                  <button
                    onClick={() => setConsentViewStep(s => Math.max(1, s - 1))}
                    disabled={consentViewStep === 1}
                    className="px-3 py-2 text-xs font-medium text-gray-300 bg-white/10 border border-white/20 rounded-lg disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setConsentViewStep(s => Math.min(7, s + 1))}
                    disabled={consentViewStep === 7}
                    className="px-3 py-2 text-xs font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowConsentView(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20"
                  >
                    Close
                  </button>
                  {consentViewStep === 7 && (
                    <button
                      onClick={handleUpdateConsentStatus}
                      className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg hover:from-emerald-600 hover:to-teal-700"
                    >
                      Save Decision
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Consent Delete Confirmation Modal */}
      {showConsentDeleteConfirm && consentDeleteTarget.id && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-[9999] flex items-center justify-center">
          <div className="relative mx-auto p-3 sm:p-0 w-full max-w-md">
            <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20">
              <div className="flex items-center justify-between p-6 border-b border-white/20">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center">
                    <FaTrash className="w-5 h-5 text-white" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-white">Delete Consent Form</h3>
                    <p className="text-sm text-gray-300">This action cannot be undone</p>
                  </div>
                </div>
                <button onClick={() => setShowConsentDeleteConfirm(false)} className="text-gray-400 hover:text-white">
                  <FaTimes className="w-6 h-6" />
                </button>
              </div>
              <div className="px-6 py-4">
                <p className="text-white text-center">
                  Are you sure you want to delete the consent form submitted by{' '}
                  <span className="font-semibold">{consentDeleteTarget.name}</span>?
                </p>
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-300 text-sm">This will permanently delete the candidate's declaration form and all associated data.</p>
                </div>
              </div>
              <div className="flex items-center justify-end space-x-3 px-6 py-4 bg-white/5 rounded-b-2xl">
                <button onClick={() => setShowConsentDeleteConfirm(false)} className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20">Cancel</button>
                <button onClick={confirmConsentDelete} className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 rounded-lg hover:from-red-600 hover:to-red-700">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Admin Modal */}
      {showCreateAdmin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-[9999] flex items-center justify-center modal-backdrop">
          <div className="relative mx-auto p-3 sm:p-0 w-full sm:w-full max-w-md">
            <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 transform transition-all">
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/20">
                <div className="flex items-center">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                      <FaUser className="text-white text-lg" />
                    </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-white">Create New Admin</h3>
                    <p className="text-sm text-gray-300 hidden sm:block">Add details; 2FA will be required on first login</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateAdmin(false)}
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <FaTimes className="w-6 h-6" />
                </button>

              </div>

              {/* Content */}
              <form onSubmit={handleCreateAdmin} className="hidden sm:block px-6 py-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300">First Name</label>
                    <input
                      type="text"
                      required
                      value={adminForm.firstName}
                      onChange={(e) => setAdminForm({ ...adminForm, firstName: e.target.value })}
                      className="mt-1 block w-full border border-white/20 rounded-md px-3 py-2 bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-cyan-600 focus:border-cyan-700"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Last Name</label>
                    <input
                      type="text"
                      required
                      value={adminForm.lastName}
                      onChange={(e) => setAdminForm({ ...adminForm, lastName: e.target.value })}
                      className="mt-1 block w-full border border-white/20 rounded-md px-3 py-2 bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-cyan-600 focus:border-cyan-700"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300">Email</label>
                  <input
                    type="email"
                    required
                    value={adminForm.email}
                    onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                    className="mt-1 block w-full border border-white/20 rounded-md px-3 py-2 bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-cyan-600 focus:border-cyan-700"
                    placeholder="admin@example.com"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Username</label>
                    <input
                      type="text"
                      required
                      value={adminForm.username}
                      onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })}
                      className="mt-1 block w-full border border-white/20 rounded-md px-3 py-2 bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-cyan-600 focus:border-cyan-700"
                      placeholder="john.doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Password</label>
                    <input
                      type="password"
                      required
                      value={adminForm.password}
                      onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                      className="mt-1 block w-full border border-white/20 rounded-md px-3 py-2 bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-cyan-600 focus:border-cyan-700"
                      placeholder="Strong password"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Phone (optional)</label>
                    <input
                      type="tel"
                      value={adminForm.phone}
                      onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })}
                      className="mt-1 block w-full border border-white/20 rounded-md px-3 py-2 bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-cyan-600 focus:border-cyan-700"
                      placeholder="+1 555 555 5555"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Department (optional)</label>
                    <input
                      type="text"
                      value={adminForm.department}
                      onChange={(e) => setAdminForm({ ...adminForm, department: e.target.value })}
                      className="mt-1 block w-full border border-white/20 rounded-md px-3 py-2 bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-cyan-600 focus:border-cyan-700"
                      placeholder="Operations"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-3 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowCreateAdmin(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/20 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-cyan-600 to-blue-600 border border-transparent rounded-lg hover:from-cyan-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200"
                  >
                    Create Admin
                  </button>
                </div>
              </form>

              {/* Mobile 2-step form */}
              <div className="sm:hidden px-4 py-5 space-y-4">
                {/* Stepper */}
                <div className="flex items-center gap-1">
                  {[1,2].map(n => (
                    <span key={n} className={`h-1.5 flex-1 rounded-full ${adminStep===n ? 'bg-cyan-400' : 'bg-white/20'}`}></span>
                  ))}
                </div>

                {adminStep === 1 && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-300">First Name</label>
                      <input type="text" required value={adminForm.firstName} onChange={(e)=>setAdminForm({...adminForm, firstName: e.target.value})} className="mt-1 block w-full border border-white/20 rounded-md px-3 py-2 bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-cyan-600 focus:border-cyan-700" placeholder="John" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-300">Last Name</label>
                      <input type="text" required value={adminForm.lastName} onChange={(e)=>setAdminForm({...adminForm, lastName: e.target.value})} className="mt-1 block w-full border border-white/20 rounded-md px-3 py-2 bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-cyan-600 focus:border-cyan-700" placeholder="Doe" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-300">Email</label>
                      <input type="email" required value={adminForm.email} onChange={(e)=>setAdminForm({...adminForm, email: e.target.value})} className="mt-1 block w-full border border-white/20 rounded-md px-3 py-2 bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-cyan-600 focus:border-cyan-700" placeholder="admin@example.com" />
                    </div>
                  </div>
                )}

                {adminStep === 2 && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-300">Username</label>
                      <input type="text" required value={adminForm.username} onChange={(e)=>setAdminForm({...adminForm, username: e.target.value})} className="mt-1 block w-full border border-white/20 rounded-md px-3 py-2 bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-cyan-600 focus:border-cyan-700" placeholder="john.doe" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-300">Password</label>
                      <input type="password" required value={adminForm.password} onChange={(e)=>setAdminForm({...adminForm, password: e.target.value})} className="mt-1 block w-full border border-white/20 rounded-md px-3 py-2 bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-cyan-600 focus:border-cyan-700" placeholder="Strong password" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-300">Phone (optional)</label>
                      <input type="tel" value={adminForm.phone} onChange={(e)=>setAdminForm({...adminForm, phone: e.target.value})} className="mt-1 block w-full border border-white/20 rounded-md px-3 py-2 bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-cyan-600 focus:border-cyan-700" placeholder="+1 555 555 5555" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-300">Department (optional)</label>
                      <input type="text" value={adminForm.department} onChange={(e)=>setAdminForm({...adminForm, department: e.target.value})} className="mt-1 block w-full border border-white/20 rounded-md px-3 py-2 bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-cyan-600 focus:border-cyan-700" placeholder="Operations" />
                    </div>
                  </div>
                )}

                <div className="mt-2 flex items-center justify-between">
                  <button onClick={()=> setAdminStep(s=> Math.max(1, s-1))} disabled={adminStep===1} className="px-3 py-2 text-xs font-medium text-gray-300 bg-white/10 border border-white/20 rounded-lg disabled:opacity-50">Previous</button>
                  <span className="text-xs text-gray-400">Step {adminStep} of 2</span>
                  {adminStep < 2 ? (
                    <button onClick={()=> setAdminStep(2)} className="px-3 py-2 text-xs font-medium text-white bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg">Next</button>
                  ) : (
                    <button onClick={handleCreateAdmin} className="px-3 py-2 text-xs font-medium text-white bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg">Create</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* User/Admin View Modal */}
      {showUserView && selectedUserRow && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-[9999] flex items-center justify-center modal-backdrop">
          <div className="relative mx-auto p-3 sm:p-0 w-full sm:w-full max-w-md">
            <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 transform transition-all">
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/20">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                    <FaUser className="text-white text-lg" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-white">User Details</h3>
                    <p className="text-sm text-gray-300">Basic information</p>
                  </div>
                </div>
                <button onClick={() => setShowUserView(false)} className="text-gray-400 hover:text-white transition-colors duration-200">
                  <FaTimes className="w-6 h-6" />
                </button>
              </div>
              <div className="px-4 sm:px-6 py-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300">Name:</span>
                  <span className="text-white font-medium">{selectedUserRow.firstName} {selectedUserRow.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Email:</span>
                  <span className="text-white font-medium">{selectedUserRow.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Username:</span>
                  <span className="text-white font-medium">{selectedUserRow.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Role:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(selectedUserRow.role)}`}>{selectedUserRow.role?.replace('_',' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedUserRow.isActive)}`}>{selectedUserRow.isActive ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
              <div className="flex items-center justify-end space-x-3 px-4 sm:px-6 py-4 bg-white/5 rounded-b-2xl">
                <button onClick={() => setShowUserView(false)} className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

       {/* Contact View Modal */}
       {showContactView && selectedContact && (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-[9999] flex items-center justify-center modal-backdrop">
           <div className="relative mx-auto p-3 sm:p-0 w-full sm:w-4/5 max-w-4xl">
             <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 transform transition-all">
               {/* Header */}
               <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/20">
                 <div className="flex items-center">
                   <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                     <FaUserEdit className="w-6 h-6 text-white" />
                   </div>
                   <div className="ml-3">
                     <h3 className="text-lg font-semibold text-white">Contact Details</h3>
                     <p className="text-sm text-gray-300 hidden sm:block">View contact submission information</p>
                     {/* Mobile step indicator */}
                     <div className="sm:hidden mt-1">
                       <div className="flex items-center gap-1">
                         {[1,2,3].map(n => (
                           <span key={n} className={`h-1.5 flex-1 rounded-full ${contactStep===n ? 'bg-indigo-400' : 'bg-white/20'}`}></span>
                         ))}
                       </div>
                     </div>
                   </div>
                 </div>
                 <button
                   onClick={() => setShowContactView(false)}
                   className="text-gray-400 hover:text-white transition-colors duration-200"
                 >
                   <FaTimes className="w-6 h-6" />
                 </button>
               </div>
               
               {/* Content */}
               <div className="px-4 sm:px-6 py-4">
                 {/* Desktop / Tablet full layout */}
                 <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 gap-6">
                   {/* Contact Information */}
                   <div className="space-y-4">
                     <h4 className="font-semibold text-white border-b border-white/20 pb-2">Contact Information</h4>
                     <div>
                       <label className="block text-sm font-medium text-gray-300">Full Name</label>
                       <p className="text-sm text-white">{selectedContact.name}</p>
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-300">Email</label>
                       <p className="text-sm text-white">{selectedContact.email}</p>
                     </div>
                     {selectedContact.phone && (
                       <div>
                         <label className="block text-sm font-medium text-gray-300">Phone</label>
                         <p className="text-sm text-white">{selectedContact.phone}</p>
                       </div>
                     )}
                     <div>
                       <label className="block text-sm font-medium text-gray-300">Message</label>
                       <p className="text-sm text-white bg-white/10 backdrop-blur-sm p-3 rounded-md border border-white/20">{selectedContact.message}</p>
                     </div>
                   </div>

                   {/* Company Information */}
                   <div className="space-y-4">
                     <h4 className="font-semibold text-white border-b border-white/20 pb-2">Company Information</h4>
                     {selectedContact.companyInfo ? (
                       <div className="space-y-3">
                         {selectedContact.companyInfo.companyName && (
                           <div>
                             <label className="block text-sm font-medium text-gray-300">Company Name</label>
                             <p className="text-sm text-white">{selectedContact.companyInfo.companyName}</p>
                           </div>
                         )}
                         {selectedContact.companyInfo.companyPhone && (
                           <div>
                             <label className="block text-sm font-medium text-gray-300">Company Phone</label>
                             <p className="text-sm text-white">{selectedContact.companyInfo.companyPhone}</p>
                           </div>
                         )}
                         {selectedContact.companyInfo.companyEmail && (
                           <div>
                             <label className="block text-sm font-medium text-gray-300">Company Email</label>
                             <p className="text-sm text-white">{selectedContact.companyInfo.companyEmail}</p>
                           </div>
                         )}
                         {selectedContact.companyInfo.companyAddress && (
                           <div>
                             <label className="block text-sm font-medium text-gray-300">Company Address</label>
                             <p className="text-sm text-white bg-white/10 backdrop-blur-sm p-3 rounded-md border border-white/20">{selectedContact.companyInfo.companyAddress}</p>
                           </div>
                         )}
                         {!selectedContact.companyInfo.companyName && !selectedContact.companyInfo.companyPhone && !selectedContact.companyInfo.companyEmail && !selectedContact.companyInfo.companyAddress && (
                           <p className="text-gray-400 italic">No company information provided</p>
                         )}
                       </div>
                     ) : (
                       <p className="text-gray-400 italic">No company information provided</p>
                     )}
                   </div>
                 </div>

                 {/* Additional Information (desktop) */}
                 <div className="hidden sm:block mt-6 pt-4 border-t border-white/20">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div>
                       <label className="block text-sm font-medium text-gray-300">User Role</label>
                       <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                         selectedContact.userRole === 'guest' ? 'bg-gray-100 text-gray-800' :
                         selectedContact.userRole === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                         selectedContact.userRole === 'admin' ? 'bg-blue-100 text-blue-800' :
                         'bg-green-100 text-green-800'
                       }`}>
                         {selectedContact.userRole === 'guest' ? 'Guest User' : selectedContact.userRole?.replace('_', ' ')}
                       </span>
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-300">Submitted Date</label>
                       <p className="text-sm text-white">{formatDate(selectedContact.submittedAt)}</p>
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-300">Contact ID</label>
                       <p className="text-sm text-white font-mono">{selectedContact.id}</p>
                     </div>
                   </div>
                 </div>

                 {/* Mobile step content */}
                 <div className="sm:hidden">
                   {contactStep === 1 && (
                     <div className="space-y-3">
                       <h4 className="font-semibold text-white border-b border-white/20 pb-2">Contact Information</h4>
                       <div>
                         <label className="block text-xs font-medium text-gray-300">Full Name</label>
                         <p className="text-sm text-white">{selectedContact.name}</p>
                       </div>
                       <div>
                         <label className="block text-xs font-medium text-gray-300">Email</label>
                         <p className="text-sm text-white">{selectedContact.email}</p>
                       </div>
                       {selectedContact.phone && (
                         <div>
                           <label className="block text-xs font-medium text-gray-300">Phone</label>
                           <p className="text-sm text-white">{selectedContact.phone}</p>
                         </div>
                       )}
                       <div>
                         <label className="block text-xs font-medium text-gray-300">Message</label>
                         <p className="text-sm text-white bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/20">{selectedContact.message}</p>
                       </div>
                     </div>
                   )}
                   {contactStep === 2 && (
                     <div className="space-y-3">
                       <h4 className="font-semibold text-white border-b border-white/20 pb-2">Company Information</h4>
                       {selectedContact.companyInfo ? (
                         <div className="space-y-3">
                           {selectedContact.companyInfo.companyName && (
                             <div>
                               <label className="block text-xs font-medium text-gray-300">Company Name</label>
                               <p className="text-sm text-white">{selectedContact.companyInfo.companyName}</p>
                             </div>
                           )}
                           {selectedContact.companyInfo.companyPhone && (
                             <div>
                               <label className="block text-xs font-medium text-gray-300">Company Phone</label>
                               <p className="text-sm text-white">{selectedContact.companyInfo.companyPhone}</p>
                             </div>
                           )}
                           {selectedContact.companyInfo.companyEmail && (
                             <div>
                               <label className="block text-xs font-medium text-gray-300">Company Email</label>
                               <p className="text-sm text-white">{selectedContact.companyInfo.companyEmail}</p>
                             </div>
                           )}
                           {selectedContact.companyInfo.companyAddress && (
                             <div>
                               <label className="block text-xs font-medium text-gray-300">Company Address</label>
                               <p className="text-sm text-white bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/20">{selectedContact.companyInfo.companyAddress}</p>
                             </div>
                           )}
                           {!selectedContact.companyInfo.companyName && !selectedContact.companyInfo.companyPhone && !selectedContact.companyInfo.companyEmail && !selectedContact.companyInfo.companyAddress && (
                             <p className="text-gray-400 italic">No company information provided</p>
                           )}
                         </div>
                       ) : (
                         <p className="text-gray-400 italic">No company information provided</p>
                       )}
                     </div>
                   )}
                   {contactStep === 3 && (
                     <div className="space-y-3">
                       <h4 className="font-semibold text-white border-b border-white/20 pb-2">Additional</h4>
                       <div>
                         <label className="block text-xs font-medium text-gray-300">User Role</label>
                         <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${
                           selectedContact.userRole === 'guest'
                             ? 'bg-gray-100 text-gray-800 border border-gray-200'
                             : selectedContact.userRole === 'super_admin'
                             ? 'bg-purple-100 text-purple-800 border border-purple-200'
                             : selectedContact.userRole === 'admin'
                             ? 'bg-blue-100 text-blue-800 border-blue-200'
                             : 'bg-green-100 text-green-800 border border-green-200'
                         }`}>{selectedContact.userRole === 'guest' ? 'Guest User' : selectedContact.userRole?.replace('_',' ')}</span>
                       </div>
                       <div>
                         <label className="block text-xs font-medium text-gray-300">Submitted</label>
                         <p className="text-sm text-white">{formatDate(selectedContact.submittedAt)}</p>
                       </div>
                       <div>
                         <label className="block text-xs font-medium text-gray-300">Contact ID</label>
                         <p className="text-sm text-white font-mono">{selectedContact.id}</p>
                       </div>
                     </div>
                   )}
                   {/* Step controls */}
                   <div className="mt-4 flex items-center justify-between">
                     <button onClick={()=> setContactStep(s => Math.max(1, s-1))} disabled={contactStep===1} className="px-3 py-2 text-xs font-medium text-gray-300 bg-white/10 border border-white/20 rounded-lg disabled:opacity-50">Previous</button>
                     <span className="text-xs text-gray-400">Step {contactStep} of 3</span>
                     <button onClick={()=> setContactStep(s => Math.min(3, s+1))} disabled={contactStep===3} className="px-3 py-2 text-xs font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg disabled:opacity-50">Next</button>
                   </div>
                 </div>
               </div>

               {/* Actions */}
               <div className="flex items-center justify-end space-x-3 px-4 sm:px-6 py-4 bg-white/5 rounded-b-2xl">
                 <button
                   onClick={() => setShowContactView(false)}
                   className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                 >
                   Close
                 </button>
                                   
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Delete Confirmation Modal */}
       {showDeleteConfirm && deleteTarget && (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-[9999] flex items-center justify-center modal-backdrop">
           <div className="relative mx-auto p-3 sm:p-0 w-full max-w-md">
             <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 transform transition-all">
               {/* Header */}
               <div className="flex items-center justify-between p-6 border-b border-white/20">
                 <div className="flex items-center">
                   <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center">
                     <FaTrash className="w-6 h-6 text-white" />
                   </div>
                   <div className="ml-3">
                     <h3 className="text-lg font-semibold text-white">
                       Delete {deleteTarget.type === 'application' ? 'Application' : (deleteTarget.type === 'admin' ? 'Admin' : 'User')}
                     </h3>
                     <p className="text-sm text-gray-300">This action cannot be undone</p>
                   </div>
                 </div>
                 <button
                   onClick={deleteTarget.type === 'application' ? () => setShowDeleteConfirm(false) : cancelDelete}
                   className="text-gray-400 hover:text-white transition-colors duration-200"
                 >
                   <FaTimes className="w-6 h-6" />
                 </button>
               </div>

               {/* Content */}
               <div className="px-6 py-4">
                 <div className="text-center">
                   <p className="text-white mb-4">
                     Are you sure you want to delete <span className="font-semibold text-white">{deleteTarget.name}</span>?
                   </p>
                   
                   {/* Application Deletion Warning */}
                   {deleteTarget.type === 'application' ? (
                     <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                       <p className="text-red-300 text-sm">
                         <strong>Warning:</strong> This will permanently delete:
                       </p>
                       <ul className="text-red-300 text-sm mt-2 ml-4 list-disc">
                         <li>The application record from the database</li>
                         <li>All associated documents from Firebase Storage</li>
                         <li>All related data and history</li>
                       </ul>
                     </div>
                   ) : deleteTarget.type === 'admin' ? (
                     /* Admin Deletion Warning */
                     <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                       <p className="text-red-300 text-sm">
                         <strong>Warning:</strong> This will permanently delete:
                       </p>
                       <ul className="text-red-300 text-sm mt-2 ml-4 list-disc">
                         <li>The admin account and all profile data</li>
                         <li>All applications submitted by this admin</li>
                         <li>All associated documents from Firebase Storage</li>
                         <li>All admin permissions and access rights</li>
                         <li>All related data and activity history</li>
                       </ul>
                     </div>
                   ) : deleteTarget.type === 'user' ? (
                     /* User Deletion Warning */
                     <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                       <p className="text-red-300 text-sm">
                         <strong>Warning:</strong> This will permanently delete:
                       </p>
                       <ul className="text-red-300 text-sm mt-2 ml-4 list-disc">
                         <li>The user account and all profile data</li>
                         <li>All applications submitted by this user</li>
                         <li>All associated documents from Firebase Storage</li>
                         <li>All verification requests and status history</li>
                         <li>All related data and activity logs</li>
                       </ul>
                     </div>
                   ) : (
                     /* Default Warning */
                     <p className="text-gray-300 text-sm mb-6">
                       This action cannot be undone and will permanently remove all their data.
                     </p>
                   )}
                 </div>
               </div>

               {/* Actions */}
               <div className="flex items-center justify-end space-x-3 px-6 py-4 bg-white/5 rounded-b-2xl">
                 <button
                   onClick={deleteTarget.type === 'application' ? () => setShowDeleteConfirm(false) : cancelDelete}
                   className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                 >
                   Cancel
                 </button>
                 <button
                   onClick={deleteTarget.type === 'application' ? handleDeleteApplication : confirmDelete}
                   className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 border border-transparent rounded-lg hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
                 >
                   {deleteTarget.type === 'application' ? 'Delete Permanently' : `Delete ${deleteTarget.type === 'admin' ? 'Admin' : 'User'}`}
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Contact Delete Confirmation Modal */}
       {showContactDeleteConfirm && contactDeleteTarget.id && (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-[9999] flex items-center justify-center modal-backdrop">
           <div className="relative mx-auto p-3 sm:p-0 w-full max-w-md">
             <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 transform transition-all">
               {/* Header */}
               <div className="flex items-center justify-between p-6 border-b border-white/20">
                 <div className="flex items-center">
                   <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center">
                     <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                     </svg>
                   </div>
                   <div className="ml-3">
                     <h3 className="text-lg font-semibold text-white">Confirm Deletion</h3>
                     <p className="text-sm text-gray-300">This action cannot be undone</p>
                   </div>
                 </div>
                 <button
                   onClick={cancelContactDelete}
                   className="text-gray-400 hover:text-white transition-colors duration-200"
                 >
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                   </svg>
                 </button>
               </div>

               {/* Content */}
               <div className="px-6 py-4">
                 <div className="text-center">
                   <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-r from-red-500 to-red-600 mb-4">
                     <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                     </svg>
                   </div>
                   <h3 className="text-lg font-medium text-white mb-2">
                     Delete Contact Submission
                   </h3>
                   <p className="text-sm text-gray-300 mb-4">
                     Are you sure you want to delete the contact submission from <span className="font-semibold text-white">{contactDeleteTarget.name}</span>?
                   </p>
                   
                   {/* Contact Deletion Warning */}
                   <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                     <p className="text-red-300 text-sm">
                       <strong>Warning:</strong> This will permanently delete:
                     </p>
                     <ul className="text-red-300 text-sm mt-2 ml-4 list-disc">
                       <li>The contact submission record from the database</li>
                       <li>All associated contact data and messages</li>
                       <li>All related communication history</li>
                       <li>All contact preferences and settings</li>
                     </ul>
                   </div>
                 </div>
               </div>

               {/* Actions */}
               <div className="flex items-center justify-end space-x-3 px-6 py-4 bg-white/5 rounded-b-2xl">
                 <button
                   onClick={cancelContactDelete}
                   className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                 >
                   Cancel
                 </button>
                 <button
                   onClick={confirmContactDelete}
                   className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 border border-transparent rounded-lg hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
                 >
                   Delete Contact
                 </button>
               </div>
             </div>
           </div>
         </div>
      )}

    </div>
  );
};

export default SuperAdminDashboard;
