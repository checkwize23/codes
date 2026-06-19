import React, { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { db } from "../firebase";
import { collection, getDocs, doc, deleteDoc, updateDoc, orderBy, query } from "firebase/firestore";
import toast from "react-hot-toast";

import CandidateDeclarationForm from "../pages/CandidateDeclarationForm";
import { 
  FaUser, 
  FaChartBar, 
  FaCheckCircle, 
  FaUserEdit,
  FaLock,
  FaTimes,
  FaEye,
  FaSearch,
  FaChevronDown,
  FaFileAlt,
  FaClock,
  FaExclamationTriangle,
  FaCheck,
  FaTimes as FaReject,
  FaEdit,
  FaTrash,
  FaBolt,
  FaEnvelope
} from 'react-icons/fa';
import LoadingOverlay from "./LoadingOverlay";

const AdminDashboard = () => {
  const {
    user,
    getAllUsers,
    updateUserStatus,
    deleteUser,
    updateProfile,
    changePassword,
  } = useAuth();
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [showConsentForm, setShowConsentForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showContactView, setShowContactView] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [contactStep, setContactStep] = useState(1);
 
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
  // Profile editing states
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  // Contact management states
  const [contacts, setContacts] = useState([]);
  const [contactSearchTerm, setContactSearchTerm] = useState("");
  const [contactCurrentPage, setContactCurrentPage] = useState(1);
  const [contactsPerPage, setContactsPerPage] = useState(5);

  // Notification states
  const [viewedUsers, setViewedUsers] = useState(new Set());
  const [viewedContacts, setViewedContacts] = useState(new Set());
  const [viewedApplications, setViewedApplications] = useState(new Set());
  const [showUserView, setShowUserView] = useState(false);
  const [selectedUserRow, setSelectedUserRow] = useState(null);
  


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

  // New applications indicator
  const newApplicationsCount = applications.filter((a) => !viewedApplications.has(a.id)).length;

  // Safe date formatter for Firestore Timestamps, numbers, and strings
  const formatDate = (value) => {
    if (!value) return "—";
    let dateValue = null;
    if (typeof value?.toDate === "function") {
      dateValue = value.toDate();
    } else if (typeof value === "object" && value !== null) {
      const seconds = typeof value.seconds === "number" ? value.seconds : (typeof value._seconds === "number" ? value._seconds : null);
      if (typeof seconds === "number") {
        dateValue = new Date(seconds * 1000);
      }
    }
    if (!dateValue) {
      if (typeof value === "number") {
        dateValue = new Date(value);
      } else if (typeof value === "string") {
        dateValue = new Date(value);
      }
    }
    if (!dateValue || isNaN(dateValue.getTime())) return "—";
    return dateValue.toLocaleDateString();
  };

  // Check if user signed up through Google (has googleId)
  const isGoogleUser = user?.googleId || user?.authProvider === "google";

  // Profile form states
  const [profileForm, setProfileForm] = useState({
    username: user?.username || "",
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    loadUsers();
    loadContacts();
    loadViewedStatus();
    loadApplications();
    loadConsentForms();
  }, []);

  // Update profile form when user data changes
  useEffect(() => {
    if (user) {
      setProfileForm({
        username: user.username || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
      });
    }
  }, [user]);

  // Listen for contact updates
  useEffect(() => {
    const handleContactUpdate = () => {
      loadContacts();
    };

    window.addEventListener("contactUpdated", handleContactUpdate);
    return () => {
      window.removeEventListener("contactUpdated", handleContactUpdate);
    };
  }, []);

  const loadViewedStatus = () => {
    const savedViewedUsers = localStorage.getItem("adminViewedUsers");
    const savedViewedContacts = localStorage.getItem("adminViewedContacts");
    const savedViewedApplications = localStorage.getItem("adminViewedApplications");

    if (savedViewedUsers) {
      setViewedUsers(new Set(JSON.parse(savedViewedUsers)));
    }
    if (savedViewedContacts) {
      setViewedContacts(new Set(JSON.parse(savedViewedContacts)));
    }
    if (savedViewedApplications) {
      setViewedApplications(new Set(JSON.parse(savedViewedApplications)));
    }
    const savedViewedConsents = localStorage.getItem('adminViewedConsents');
      if (savedViewedConsents) {
      setViewedConsents(new Set(JSON.parse(savedViewedConsents)));
    }
  };

  const saveViewedStatus = (type, id) => {
    if (type === "user") {
      const newViewedUsers = new Set([...viewedUsers, id]);
      setViewedUsers(newViewedUsers);
      localStorage.setItem(
        "adminViewedUsers",
        JSON.stringify([...newViewedUsers])
      );
    } else if (type === "contact") {
      const newViewedContacts = new Set([...viewedContacts, id]);
      setViewedContacts(newViewedContacts);
      localStorage.setItem(
        "adminViewedContacts",
        JSON.stringify([...newViewedContacts])
      );
    } else if (type === "application") {
      const newViewedApplications = new Set([...viewedApplications, id]);
      setViewedApplications(newViewedApplications);
      localStorage.setItem(
        "adminViewedApplications",
        JSON.stringify([...newViewedApplications])
      );
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    const result = await getAllUsers();
    if (result.success) {
      // Filter out super admins and other admins - regular admins can only manage users
      const regularUsers = result.users.filter((u) => u.role === "user");
      setUsers(regularUsers);
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
  const newViewed = new Set([...viewedConsents, consent.id]);
  setViewedConsents(newViewed);
  localStorage.setItem('adminViewedConsents', JSON.stringify([...newViewed]));
};

const handleUpdateConsentStatus = async () => {
  if (!selectedConsent) return;
  try {
    await updateDoc(doc(db, 'serviceRequests', selectedConsent.id), {
      status: consentStatusUpdate.status,
      remarks: consentStatusUpdate.remarks || '',
      reviewedBy: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Admin',
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


  const handleViewContact = (contact) => {
    setSelectedContact(contact);
    setShowContactView(true);
    setContactStep(1);
    saveViewedStatus("contact", contact.id);
  };


  // Profile update handlers
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await updateProfile(profileForm);
    if (result.success) {
      toast.success(t("profileUpdated"));
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
      toast.error(t("passwordsDoNotMatch"));
      setLoading(false);
      return;
    }
    const result = await changePassword(
      passwordForm.currentPassword,
      passwordForm.newPassword
    );
    if (result.success) {
      toast.success(t("passwordChanged"));
      setShowPasswordChange(false);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  const getRoleBadge = (role) => {
    const badges = {
      super_admin: "bg-purple-100 text-purple-800",
      admin: "bg-blue-100 text-blue-800",
      user: "bg-gray-100 text-gray-800",
    };
    return badges[role] || "bg-gray-100 text-gray-800";
  };

  const getStatusBadge = (isActive) => {
    return isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  };

  // Contact filtering and pagination
  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name?.toLowerCase().includes(contactSearchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(contactSearchTerm.toLowerCase()) ||
      contact.message?.toLowerCase().includes(contactSearchTerm.toLowerCase())
  );

  const indexOfLastContact = contactCurrentPage * contactsPerPage;
  const indexOfFirstContact = indexOfLastContact - contactsPerPage;
  const currentContacts = filteredContacts.slice(
    indexOfFirstContact,
    indexOfLastContact
  );
  const totalContactPages = Math.ceil(
    filteredContacts.length / contactsPerPage
  );

  const stats = {
    total: users.length,
    active: users.filter((u) => u.isActive).length,
    inactive: users.filter((u) => !u.isActive).length,
  };

  // Get new items count
  const newUsersCount = users.filter((u) => !viewedUsers.has(u._id)).length;
  const newContactsCount = contacts.filter(
    (c) => !viewedContacts.has(c.id)
  ).length;

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
              <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg text-left pt-4">
                {t("Admin Dashboard")}
              </h1>
              <p className="text-indigo-100 mt-1 drop-shadow-md italic text-left text-sm sm:text-base">
                {t("welcomeBack")}, {user?.firstName} {user?.lastName}
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
              { id: "overview", name: t("overview"), icon: "" },
              {
                id: "users",
                name: t("userManagement"),
                count: newUsersCount,
                icon: "",
              },
              {
                id: "applications",
                name: t('applicationManagement') || "Application Management",
                count: newApplicationsCount,
                icon: "",
              },
              {
                id: "contacts",
                name: t("contactManagement"),
                count: newContactsCount,
                icon: "",
              },
              {
                id: "consents",
                name: "Consent Forms",
                count: consentForms.filter(c => !viewedConsents.has(c.id)).length,
                icon: "",
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex-1 py-3 sm:py-4 px-3 sm:px-6 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 transform hover:scale-105 cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg border border-white/20"
                    : "text-gray-300 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-center space-x-1 sm:space-x-2">
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
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-4 sm:p-6 hover:bg-white/15 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-white">
                  {t("userManagement")}
                </h3>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <FaChartBar className="text-white text-sm sm:text-lg" />
                </div>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex justify-between items-center p-2 sm:p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-300 text-sm sm:text-base">
                    {t("totalUsers")}:
                  </span>
                  <span className="font-bold text-white text-base sm:text-lg">
                    {stats.total}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 sm:p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-300 text-sm sm:text-base">
                    {t("activeUsers")}:
                  </span>
                  <span className="font-bold text-emerald-400 text-base sm:text-lg">
                    {stats.active}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 sm:p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-300 text-sm sm:text-base">
                    {t("inactiveUsers")}:
                  </span>
                  <span className="font-bold text-red-400 text-base sm:text-lg">
                    {stats.inactive}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-4 sm:p-6 hover:bg-white/15 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-white">
                  {t("yourProfile")}
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowProfileEdit(true)}
                    className="px-3 py-1 text-xs font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                  >
                    Edit
                  </button>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <FaUser className="text-white text-sm sm:text-lg" />
                  </div>
                </div>
              </div>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                  <span className="text-gray-300 text-sm sm:text-base">
                    {t("name")}:
                  </span>
                  <span className="text-white font-medium text-sm sm:text-base">
                    {user?.firstName} {user?.lastName}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                  <span className="text-gray-300 text-sm sm:text-base">
                    {t("email")}:
                  </span>
                  <span className="text-white font-medium text-sm sm:text-base">
                    {user?.email}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                  <span className="text-gray-300 text-sm sm:text-base">
                    {t("username")}:
                  </span>
                  <span className="text-white font-medium text-sm sm:text-base">
                    {user?.username}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                  <span className="text-gray-300">{t("role")}:</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(
                      user?.role
                    )}`}
                  >
                    {user?.role?.replace("_", " ")}
                  </span>
                </div>
                {/* <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                  <span className="text-gray-300">{t("status")}:</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                      user?.isActive
                    )}`}
                  >
                    {user?.isActive ? t("Active User") : t("Inactive User")}
                  </span>
                </div> */}
                {!isGoogleUser && (
                  <div className="pt-2">
                    <button
                      onClick={() => setShowPasswordChange(true)}
                      className="w-full px-3 py-2 text-xs font-medium text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
                    >
                      {t("changePassword")}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* QUICK ACTIONS */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Quick Actions
              </h3>
              <button onClick={() => setShowConsentForm(true)} className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                Open Consent Form
              </button>
              
              <button onClick={() => setActiveTab('contacts')} className="w-full px-4 py-2 mt-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200">
                <FaEnvelope className="inline mr-2" /> View Contacts
              </button>
              <button onClick={() => setActiveTab('consents')} className="w-full px-4 py-2 mt-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors duration-200">
                <FaFileAlt className="inline mr-2" /> View Consent Forms
              </button>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20">
            <div className="px-6 py-4 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">
                User Management
              </h3>
              <p className="text-sm text-gray-300 mt-1">
                Manage regular users only
              </p>
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-transparent divide-y divide-white/20">
                    {users.map((userItem) => (
                      <tr key={userItem._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 w-10 h-10">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                                {userItem.firstName?.charAt(0)}
                                {userItem.lastName?.charAt(0)}
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
                              <div className="text-sm text-gray-300">
                                {userItem.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                              userItem.isActive
                            )}`}
                          >
                            {userItem.isActive ? "Active" : "Inactive"}
                          </span>
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
                                const newViewedUsers = new Set([...viewedUsers, userItem._id]);
                                setViewedUsers(newViewedUsers);
                                localStorage.setItem('adminViewedUsers', JSON.stringify([...newViewedUsers]));
                              }}
                              className="text-indigo-400 hover:text-indigo-300 p-2 rounded-full hover:bg-white/10 transition-colors duration-200"
                              title="View User"
                            >
                              <FaEye className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && (
                  <div className="p-6 text-center text-gray-400">
                    No regular users found.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "applications" && (
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
                {/* Mobile: dropdowns */}
                <div className="w-full flex flex-col gap-2 md:hidden">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-300">Status:</span>
                    <select
                      value={appStatusFilter}
                      onChange={(e)=>{ setAppStatusFilter(e.target.value); setAppCurrentPage(1); }}
                      className="flex-1 px-2 py-1.5 rounded-lg bg-white/10 border border-white/20 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {['All','Pending','Under Review','Insufficient','Approved','Rejected'].map(s => (
                        <option key={s} value={s} className="bg-slate-800 text-white">{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-300">Type:</span>
                    <select
                      value={appTypeFilter}
                      onChange={(e)=>{ setAppTypeFilter(e.target.value); setAppCurrentPage(1); }}
                      className="flex-1 px-2 py-1.5 rounded-lg bg-white/10 border border-white/20 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      {['All', ...Array.from(new Set(applications.map(a => (a.serviceKey||'Verification').replace(/[-_]/g,' ').replace(/\b\w/g, c=> c.toUpperCase()) )))].map(t => (
                        <option key={t} value={t} className="bg-slate-800 text-white">{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {/* Desktop/Tablet: button pills */}
                <div className="hidden md:flex items-center space-x-2">
                  <span className="text-sm text-gray-300">Status:</span>
                  {['All','Pending','Under Review','Insufficient','Approved','Rejected'].map(s => (
                    <button key={s} onClick={()=>{ setAppStatusFilter(s); setAppCurrentPage(1); }} className={`px-2 py-1 rounded-full text-xs border ${appStatusFilter===s?'bg-indigo-600 text-white border-indigo-500':'bg-white/10 text-gray-300 border-white/20 hover:bg-white/20'}`}>{s}</button>
                  ))}
                </div>
                <div className="hidden md:flex items-center space-x-2 mt-2 sm:mt-0">
                  <span className="text-sm text-gray-300">Type:</span>
                  {['All', ...Array.from(new Set(applications.map(a => (a.serviceKey||'Verification').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) ))) ].map(t => (
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
                        const typeRaw = (a.serviceKey || 'Verification').replace(/[-_]/g, ' ') .replace(/\b\w/g, (c)=> c.toUpperCase ());
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
            <div className="relative mx-auto p-3 sm:p-0 w-full sm:w-full max-w-2xl my-8">
              <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 transform transition-all max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/20">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                      <FaFileAlt className="w-5 h-5 text-white" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-white">Review Application</h3>
                      <p className="text-sm text-gray-300">{(selectedApp.serviceKey || 'Verification').replace(/[-_]/g,' ') .replace(/\b\w/g, (c) => c.toUpperCase())}</p>
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
                                const path = (() => {
                                  try {
                                    const decoded = decodeURIComponent(u)
                                    const m = decoded.match(/\/o\/(.*)\?alt=/)
                                    if (m && m[1]) return m[1]
                                    return decoded.split('/o/')[1]?.split('?')[0] || ''
                                  } catch { return '' }
                                })()
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
                    {/* Location - Desktop */}
                    {(selectedApp.detectedAddress || selectedApp.latitude) && (
                      <div className="hidden sm:block">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Submitted Location</label>
                        <div className="bg-white/5 rounded-lg p-3 border border-white/10 space-y-1">
                          {selectedApp.detectedAddress && (
                            <p className="text-sm text-white">{selectedApp.detectedAddress}</p>
                          )}
                          {selectedApp.latitude && (
                            <p className="text-xs text-gray-400">{selectedApp.latitude}, {selectedApp.longitude}</p>
                          )}
                          {selectedApp.latitude && (
                            <a href={`https://www.google.com/maps?q=${selectedApp.latitude},${selectedApp.longitude}`} target="_blank" rel="noopener noreferrer"
                              className="text-cyan-400 hover:text-cyan-300 underline text-sm block">
                              View on Google Maps ↗
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Result PDF upload - Desktop */}
                    <div className="hidden sm:block md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Attach Result PDF <span className="text-gray-400 font-normal">(optional — visible to user after approval)</span>
                      </label>
                      {selectedApp.resultPdf && (
                        <div className="mb-2">
                          <a href={selectedApp.resultPdf} target="_blank" rel="noopener noreferrer"
                            className="text-cyan-400 hover:text-cyan-300 underline text-sm">
                            View existing PDF ↗
                          </a>
                        </div>
                      )}
                      <input type="file" accept=".pdf" onChange={(e) => setAppUpdate(s => ({ ...s, resultPdf: e.target.files?.[0] || null }))}
                        className="block w-full text-sm text-gray-300 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-cyan-600 file:text-white hover:file:bg-cyan-700 file:cursor-pointer"/>
                      {appUpdate.resultPdf && (
                        <p className="text-xs text-emerald-400 mt-1">✓ {appUpdate.resultPdf.name} selected</p>
                      )}
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
                          {selectedApp.serviceKey === "consent" && selectedApp.consentData && (
                            <div className="ng-white/5 rounded-lg p-3 border border-white/10">
                              <label className="block text-xs font-medium text-gray-300 mb-1">
                                Consent Details
                              </label>
                              <p className="text-sm text-white">
                                Name: {selectedApp.consentData.fullName}
                              </p>
                              <p className="text-sm text-white">
                                Company: {selectedApp.consentData.companyName}
                              </p>
                              <p className="text-sm text-white">
                                Agreed: {selectedApp.consentData.agreed ? "Yes" : "No"}
                              </p>
                              </div>        
                          )}
                        </div>
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
                          <div>
                            <label className="block text-xs font-medium text-gray-300">
                              Attach Result PDF <span className="text-gray-500">(optional)</span>
                            </label>
                            {selectedApp.resultPdf && (
                              <a href={selectedApp.resultPdf} target="_blank" rel="noopener noreferrer"
                                className="text-cyan-400 underline text-xs block mb-1">
                                View existing PDF ↗
                              </a>
                            )}
                            <input type="file" accept=".pdf" onChange={(e) => setAppUpdate(s => ({ ...s, resultPdf: e.target.files?.[0] || null }))}
                              className="block w-full text-xs text-gray-300 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-cyan-600 file:text-white hover:file:bg-cyan-700 file:cursor-pointer mt-1"/>
                            {appUpdate.resultPdf && (
                              <p className="text-xs text-emerald-400 mt-1">✓ {appUpdate.resultPdf.name}</p>
                            )}
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
                                (()=>{ const path = (() => { try { const decoded = decodeURIComponent(String(v)); const m = decoded.match(/\/o\/(.*)\?alt=/); if (m && m[1]) return m[1]; return decoded.split('/o/')[1]?.split('?')[0] || '' } catch { return '' } })(); return (
                                  <button onClick={() => window.open(String(v), '_blank')} className="text-indigo-300 hover:text-indigo-200 underline break-all text-sm text-left">Open document</button>
                                ) })()
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
                      
                      // result approved pdf attachment
                      let resultPdfUrl = selectedApp.resultPdf || null;
                      if (appUpdate.resultPdf) {
                        const formData = new FormData();
                        formData.append('file', appUpdate.resultPdf);
                        formData.append('upload_preset', 'checkwize_documents'); 
                        formData.append('resource_type', 'raw');
                        const res = await fetch('https://api.cloudinary.com/v1_1/drvodxyko/raw/upload', { 
                          method: 'POST',
                          body: formData
                        });
                        const data = await res.json();
                        resultPdfUrl = data.secure_url;
                      }

                      await updateDoc(doc(db,'serviceRequests', selectedApp.id), {
                        status: toBackend(appUpdate.status),
                        remarks: appUpdate.remarks || '',
                        reviewedBy: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Admin',
                        reviewedAt: new Date(),
                        ...(resultPdfUrl ? { resultPdf: resultPdfUrl } : {})
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
                    <p className="text-sm text-white break-all">{selectedApp.userName || selectedApp.userEmail || selectedApp.userId || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center justify-end space-x-3 px-6 py-4 bg-white/5 rounded-b-2xl">
                  <button onClick={()=>setShowAppUser(false)} className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/20">Close</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User View Modal */}
        {showUserView && selectedUserRow && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-[9999] flex items-center justify-center modal-backdrop">
            <div className="relative mx-auto p-0 w-full max-w-md">
              <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 transform transition-all">
                <div className="flex items-center justify-between p-6 border-b border-white/20">
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
                <div className="px-6 py-4 space-y-3">
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
                    <span className="text-gray-300">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedUserRow.isActive)}`}>{selectedUserRow.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
                <div className="flex items-center justify-end space-x-3 px-6 py-4 bg-white/5 rounded-b-2xl">
                  <button onClick={() => setShowUserView(false)} className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200">Close</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "contacts" && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20">
            <div className="px-6 py-4 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">
                Contact Management
              </h3>
              <p className="text-sm text-gray-300 mt-1">
                View contact form submissions
              </p>
            </div>

            {/* Search Bar */}
            <div className="px-6 py-4 border-b border-white/20">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="w-full md:w-[80%]">
                  <label htmlFor="contactSearch" className="sr-only">
                    Search contacts
                  </label>
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
                      className="block w-full pl-9 pr-3 py-1.5 md:py-2 border border-white/20 rounded-lg leading-5 bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:placeholder-gray-300 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs md:text-sm"
                    />
                  </div>
                </div>
                {/* Contacts per page selector */}
                <div className="flex items-center space-x-2 md:self-auto">
                  <label
                    htmlFor="contactsPerPage"
                    className="text-xs md:text-sm font-medium text-gray-300"
                  >
                    Show:
                  </label>
                  <div className="relative">
                    <select
                      id="contactsPerPage"
                      value={contactsPerPage}
                      onChange={(e) =>
                        setContactsPerPage(Number(e.target.value))
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

            {filteredContacts.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-400">No contact submissions found.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/20">
                    <thead className="bg-white/10">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Company Info
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Message
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          User Info
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Submitted
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
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
                                <div className="text-sm text-gray-300">
                                  {contact.email}
                                </div>
                                {contact.phone && (
                                  <div className="text-sm text-gray-300">
                                    {contact.phone}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {contact.companyInfo && (
                              <div className="text-sm text-white">
                                {contact.companyInfo.companyName && (
                                  <div className="font-medium">
                                    {contact.companyInfo.companyName}
                                  </div>
                                )}
                                {contact.companyInfo.companyPhone && (
                                  <div className="text-gray-300">
                                    {contact.companyInfo.companyPhone}
                                  </div>
                                )}
                                {contact.companyInfo.companyEmail && (
                                  <div className="text-gray-300">
                                    {contact.companyInfo.companyEmail}
                                  </div>
                                )}
                                {contact.companyInfo.companyAddress && (
                                  <div
                                    className="text-gray-300 max-w-xs truncate"
                                    title={contact.companyInfo.companyAddress}
                                  >
                                    {contact.companyInfo.companyAddress}
                                  </div>
                                )}
                                {!contact.companyInfo.companyName &&
                                  !contact.companyInfo.companyPhone &&
                                  !contact.companyInfo.companyEmail &&
                                  !contact.companyInfo.companyAddress && (
                                    <span className="text-gray-400 italic">
                                      No company info
                                    </span>
                                  )}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div
                              className="text-sm text-white max-w-xs truncate"
                              title={contact.message}
                            >
                              {contact.message}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-300">
                              {contact.userRole === "guest" ? (
                                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs border border-gray-200">
                                  Guest User
                                </span>
                              ) : (
                                <span
                                  className={`px-2 py-1 rounded-full text-xs border ${
                                    contact.userRole === "super_admin"
                                      ? "bg-purple-100 text-purple-800 border-purple-200"
                                      : contact.userRole === "admin"
                                      ? "bg-blue-100 text-blue-800 border-blue-200"
                                      : "bg-green-100 text-green-800 border-green-200"
                                  }`}
                                >
                                  {contact.userRole?.replace("_", " ")}
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
                                className="text-indigo-600 hover:text-indigo-900 p-2 rounded-full hover:bg-indigo-50 transition-colors duration-200"
                                title="View Details"
                              >
                                <FaEye className="w-5 h-5" />
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
                  <div className="px-6 py-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        Showing {indexOfFirstContact + 1} to{" "}
                        {Math.min(indexOfLastContact, filteredContacts.length)}{" "}
                        of {filteredContacts.length} results
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() =>
                            setContactCurrentPage(contactCurrentPage - 1)
                          }
                          disabled={contactCurrentPage === 1}
                          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                          Previous
                        </button>
                        {Array.from(
                          { length: totalContactPages },
                          (_, i) => i + 1
                        ).map((page) => (
                          <button
                            key={page}
                            onClick={() => setContactCurrentPage(page)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                              contactCurrentPage === page
                                ? "bg-indigo-600 text-white shadow-lg"
                                : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        <button
                          onClick={() =>
                            setContactCurrentPage(contactCurrentPage + 1)
                          }
                          disabled={contactCurrentPage === totalContactPages}
                          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
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
        {activeTab === "consents" && (
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20">
          <div className="px-6 py-4 border-b border-white/10">
            <h3 className="text-lg font-semibold text-white">Consent Form Management</h3>
            <p className="text-sm text-gray-300 mt-1">Review and respond to user consent form submissions</p>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-4 border-b border-white/20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="w-full md:w-[80%]">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                </div>
                <input type="text" placeholder="Search by name or email..." value={consentSearchTerm}
                  onChange={(e) => setConsentSearchTerm(e.target.value)} className="block w-full pl-9 pr-3 py-1.5 md:py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs md:text-sm"/>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-xs md:text-sm font-medium text-gray-300">Show:</label>
              <div className="relative">
                <select value={consentsPerPage} onChange={(e) => setConsentsPerPage(Number(e.target.value))}
                  className="block w-20 pr-7 pl-3 py-1.5 md:py-2 border border-white/20 rounded-lg bg-cyan-700 text-white focus:outline-none text-xs md:text-sm appearance-none">
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={20}>20</option>
                </select>
                <FaChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-300" />
              </div>
              <span className="text-xs md:text-sm text-gray-300">per page</span>
            </div>
          </div>
        </div>

        {/* Table */}
        {consentForms.length === 0 ? (
          <div className="p-6 text-center">
            <FaFileAlt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-300 text-lg">No consent forms submitted yet</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/20">
                <thead className="bg-white/10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Submitted</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-transparent divide-y divide-white/20">
                  {consentForms .filter(c =>
                    (c.userName || c.userEmail || c.userId || '').toLowerCase().includes(consentSearchTerm.toLowerCase()) ||
                    (c.consentData?.companyName || '').toLowerCase().includes(consentSearchTerm.toLowerCase())
                  )
                  .slice((consentCurrentPage - 1) * consentsPerPage, consentCurrentPage * consentsPerPage)
                  .map(consent => (
                    <tr key={consent.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                            {(consent.userName || consent.userEmail || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white flex items-center">
                              {consent.userName || consent.userEmail || consent.userId || '—'}
                              {!viewedConsents.has(consent.id) && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-500 text-white">NEW</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-300">{consent.userEmail || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {consent.consentData?.companyName || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          (consent.status || 'pending').toLowerCase() === 'approved' ? 'bg-green-100 text-green-800' :
                          (consent.status || '').toLowerCase() === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {consent.status ? consent.status.charAt(0).toUpperCase() + consent.status.slice(1) : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {formatDate(consent.submittedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button onClick={() => handleViewConsent(consent)} className="text-indigo-400 hover:text-indigo-300 p-2 rounded-full hover:bg-white/10 transition-colors duration-200"
                          title="View & Respond">
                            <FaEye className="w-5 h-5" />
                          </button>
                          <button onClick={() => handleDeleteConsent(consent.id, consent.userName || consent.userEmail || 'this consent')} className="text-red-400 hover:text-red-300 p-2 rounded-full hover:bg-white/10 transition-colors duration-200"
                          title="Delete">
                            <FaTrash className="w-4 h-4" />
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
            (c.userName || c.userEmail || c.userId || '').toLowerCase().includes(consentSearchTerm.toLowerCase()) ||
            (c.consentData?.companyName || '').toLowerCase().includes(consentSearchTerm.toLowerCase())
          ).length / consentsPerPage) > 1 && (
            <div className="px-6 py-4 border-t border-white/20">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-300">
                  Showing {(consentCurrentPage - 1) * consentsPerPage + 1} to{' '}
                  {Math.min(consentCurrentPage * consentsPerPage, consentForms.length)} of {consentForms.length} results
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => setConsentCurrentPage(consentCurrentPage - 1)} disabled={consentCurrentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-300 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed">
                    Previous
                  </button>
                  <button onClick={() => setConsentCurrentPage(consentCurrentPage + 1)} disabled={consentCurrentPage * consentsPerPage >= consentForms.length}
                    className="px-3 py-2 text-sm font-medium text-gray-300 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed">
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
    
        {/* Consent View Modal */}
        {showConsentView && selectedConsent && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-[9999] flex items-center justify-center modal-backdrop">
            <div className="relative mx-auto p-3 sm:p-0 w-full sm:w-full max-w-2xl">
              <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20">
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/20">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                      <FaFileAlt className="w-5 h-5 text-white" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-white">Consent Form Details</h3>
                      <p className="text-sm text-gray-300">{selectedConsent.userName || selectedConsent.userEmail || 'User'}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowConsentView(false)} className="text-gray-400 hover:text-white transition-colors duration-200">
                    <FaTimes className="w-6 h-6" />
                  </button>
                </div>

                {/* Body */}
                <div className="px-4 sm:px-6 py-4 space-y-4">

                  {/* Desktop full layout */}
                  <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300">Full Name</label>
                      <p className="text-sm text-white">{selectedConsent.consentData?.fullName || selectedConsent.userName || '—'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300">Email</label>
                      <p className="text-sm text-white">{selectedConsent.userEmail || '—'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300">Company</label>
                      <p className="text-sm text-white">{selectedConsent.consentData?.companyName || '—'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300">Agreed to Terms</label>
                      <p className="text-sm text-white">{selectedConsent.consentData?.agreed ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300">Submitted</label>
                      <p className="text-sm text-white">{formatDate(selectedConsent.submittedAt)}</p>
                    </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-300">Current Status</label>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        (selectedConsent.status || 'pending').toLowerCase() === 'approved' ? 'bg-green-100 text-green-800' :
                        (selectedConsent.status || '').toLowerCase() === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedConsent.status ? selectedConsent.status.charAt(0).toUpperCase() + selectedConsent.status.slice(1) : 'Pending'}
                      </span>
                    </div>
                  </div>

                  {/* Response Section */}
                  <div className="hidden sm:block border-t border-white/20 pt-4">
                    <h4 className="text-sm font-semibold text-white mb-3">Update Response</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                        <select value={consentStatusUpdate.status} onChange={(e) => setConsentStatusUpdate(s => ({ ...s, status: e.target.value }))}
                          className="block w-full bg-gray-800/90 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                          <option value="pending" className="bg-gray-800">Pending</option>
                          <option value="approved" className="bg-gray-800">Approved</option>
                          <option value="rejected" className="bg-gray-800">Rejected</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Remarks</label>
                        <input value={consentStatusUpdate.remarks} onChange={(e) => setConsentStatusUpdate(s => ({ ...s, remarks: e.target.value }))}
                          className="block w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white" placeholder="Optional remarks for the user"/>
                      </div>
                    </div>
                  </div>

                  {/* Mobile step layout */}
                  <div className="sm:hidden">
                    {consentViewStep === 1 && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-300">Full Name</label>
                          <p className="text-sm text-white">{selectedConsent.consentData?.fullName || selectedConsent.userName || '—'}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-300">Email</label>
                          <p className="text-sm text-white">{selectedConsent.userEmail || '—'}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-300">Company</label>
                          <p className="text-sm text-white">{selectedConsent.consentData?.companyName || '—'}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-300">Agreed to Terms</label>
                          <p className="text-sm text-white">{selectedConsent.consentData?.agreed ? 'Yes' : 'No'}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-300">Submitted</label>
                          <p className="text-sm text-white">{formatDate(selectedConsent.submittedAt)}</p>
                        </div>
                      </div>
                    )}
                    {consentViewStep === 2 && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-white">Update Response</h4>
                        <div>
                          <label className="block text-xs font-medium text-gray-300 mb-1">Status</label>
                            <select value={consentStatusUpdate.status} onChange={(e) => setConsentStatusUpdate(s => ({ ...s, status: e.target.value }))}
                              className="block w-full bg-gray-800/90 border border-white/20 rounded-lg px-3 py-2 text-white text-sm">
                              <option value="pending" className="bg-gray-800">Pending</option>
                              <option value="approved" className="bg-gray-800">Approved</option>
                              <option value="rejected" className="bg-gray-800">Rejected</option>
                            </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-300 mb-1">Remarks</label>
                          <input value={consentStatusUpdate.remarks} onChange={(e) => setConsentStatusUpdate(s => ({ ...s, remarks: e.target.value }))}
                            className="block w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm" placeholder="Optional remarks for the user"/>
                        </div>
                      </div>
                    )}
                    <div className="mt-4 flex items-center justify-between">
                      <button onClick={() => setConsentViewStep(s => Math.max(1, s - 1))} disabled={consentViewStep === 1} className="px-3 py-2 text-xs font-medium text-gray-300 bg-white/10 border border-white/20 rounded-lg disabled:opacity-50">Previous</button>
                      <span className="text-xs text-gray-400">Step {consentViewStep} of 2</span>
                      <button onClick={() => setConsentViewStep(s => Math.min(2, s + 1))} disabled={consentViewStep === 2} className="px-3 py-2 text-xs font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg disabled:opacity-50">Next</button>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end space-x-3 px-6 py-4 bg-white/5 rounded-b-2xl">
                  <button onClick={() => setShowConsentView(false)} className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20">Close</button>
                  <button onClick={handleUpdateConsentStatus} className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg hover:from-green-600 hover:to-emerald-700">
                    Save Response
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Consent Delete Confirmation Modal */}
        {showConsentDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-[9999] flex items-center justify-center modal-backdrop">
            <div className="relative mx-auto p-0 w-full max-w-md">
              <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20">
                <div className="flex items-center justify-between p-6 border-b border-white/20">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-red-500 to-rose-600 rounded-full flex items-center justify-center">
                      <FaExclamationTriangle className="w-5 h-5 text-white" />
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
                  <p className="text-gray-300 text-sm">
                    Are you sure you want to delete the consent form for <span className="text-white font-semibold">{consentDeleteTarget.name}</span>?
                  </p>
                </div>
                <div className="flex items-center justify-end space-x-3 px-6 py-4 bg-white/5 rounded-b-2xl">
                  <button onClick={() => setShowConsentDeleteConfirm(false)} className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20">Cancel</button>
                  <button onClick={confirmConsentDelete} className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-rose-600 rounded-lg hover:from-red-600 hover:to-rose-700">Delete</button>
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
                      <h3 className="text-lg font-semibold text-white">
                        Contact Details
                      </h3>
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
                      <h4 className="font-semibold text-white border-b border-white/20 pb-2">
                        Contact Information
                      </h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-300">
                          Full Name
                        </label>
                        <p className="text-sm text-white">
                          {selectedContact.name}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300">
                          Email
                        </label>
                        <p className="text-sm text-white">
                          {selectedContact.email}
                        </p>
                      </div>
                      {selectedContact.phone && (
                        <div>
                          <label className="block text-sm font-medium text-gray-300">
                            Phone
                          </label>
                          <p className="text-sm text-white">
                            {selectedContact.phone}
                          </p>
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-300">
                          Message
                        </label>
                        <p className="text-sm text-white bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/20">
                          {selectedContact.message}
                        </p>
                      </div>
                    </div>

                    {/* Company Information */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-white border-b border-white/20 pb-2">
                        Company Information
                      </h4>
                      {selectedContact.companyInfo ? (
                        <div className="space-y-3">
                          {selectedContact.companyInfo.companyName && (
                            <div>
                              <label className="block text-sm font-medium text-gray-300">
                                Company Name
                              </label>
                              <p className="text-sm text-white">
                                {selectedContact.companyInfo.companyName}
                              </p>
                            </div>
                          )}
                          {selectedContact.companyInfo.companyPhone && (
                            <div>
                              <label className="block text-sm font-medium text-gray-300">
                                Company Phone
                              </label>
                              <p className="text-sm text-white">
                                {selectedContact.companyInfo.companyPhone}
                              </p>
                            </div>
                          )}
                          {selectedContact.companyInfo.companyEmail && (
                            <div>
                              <label className="block text-sm font-medium text-gray-300">
                                Company Email
                              </label>
                              <p className="text-sm text-white">
                                {selectedContact.companyInfo.companyEmail}
                              </p>
                            </div>
                          )}
                          {selectedContact.companyInfo.companyAddress && (
                            <div>
                              <label className="block text-sm font-medium text-gray-300">
                                Company Address
                              </label>
                              <p className="text-sm text-white bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/20">
                                {selectedContact.companyInfo.companyAddress}
                              </p>
                            </div>
                          )}
                          {!selectedContact.companyInfo.companyName &&
                            !selectedContact.companyInfo.companyPhone &&
                            !selectedContact.companyInfo.companyEmail &&
                            !selectedContact.companyInfo.companyAddress && (
                              <p className="text-gray-400 italic">
                                No company information provided
                              </p>
                            )}
                        </div>
                      ) : (
                        <p className="text-gray-400 italic">
                          No company information provided
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Additional Information (desktop) */}
                  <div className="hidden sm:block mt-6 pt-4 border-t border-white/20">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300">
                          User Role
                        </label>
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            selectedContact.userRole === "guest"
                              ? "bg-gray-100 text-gray-800 border border-gray-200"
                              : selectedContact.userRole === "super_admin"
                              ? "bg-purple-100 text-purple-800 border border-purple-200"
                              : selectedContact.userRole === "admin"
                              ? "bg-blue-100 text-blue-800 border border-blue-200"
                              : "bg-green-100 text-green-800 border border-green-200"
                          }`}
                        >
                          {selectedContact.userRole === "guest"
                            ? "Guest User"
                            : selectedContact.userRole?.replace("_", " ")}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300">
                          Submitted Date
                        </label>
                        <p className="text-sm text-white">
                          {formatDate(selectedContact.submittedAt)}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300">
                          Contact ID
                        </label>
                        <p className="text-sm text-white font-mono">
                          {selectedContact.id}
                        </p>
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

        

        {/* Profile Edit Modal */}
        {showProfileEdit && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-[9999] flex items-center justify-center modal-backdrop">
            <div className="relative mx-auto p-0 w-full max-w-md">
              <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 transform transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/20">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-white">
                        {t("updateProfile")}
                      </h3>
                      <p className="text-sm text-gray-300">
                        Update your profile information
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowProfileEdit(false)}
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleUpdateProfile} className="px-6 py-4">
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="username"
                        className="block text-sm font-medium text-gray-300 mb-1"
                      >
                        {t("username")}
                      </label>
                      <input
                        type="text"
                        id="username"
                        value={profileForm.username}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            username: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="firstName"
                        className="block text-sm font-medium text-gray-300 mb-1"
                      >
                        {t("firstName")}
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        value={profileForm.firstName}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            firstName: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="lastName"
                        className="block text-sm font-medium text-gray-300 mb-1"
                      >
                        {t("lastName")}
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        value={profileForm.lastName}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            lastName: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-300 mb-1"
                      >
                        {t("email")}
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={profileForm.email}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            email: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-white/20">
                    <button
                      type="button"
                      onClick={() => setShowProfileEdit(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                    >
                      {t("cancel")}
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 border border-transparent rounded-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                    >
                      {t("updateProfile")}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Password Change Modal */}
        {showPasswordChange && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-[9999] flex items-center justify-center modal-backdrop">
            <div className="relative mx-auto p-0 w-full max-w-md">
              <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 transform transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/20">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-white">
                        {t("changePassword")}
                      </h3>
                      <p className="text-sm text-gray-300">
                        Update your password
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPasswordChange(false)}
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleChangePassword} className="px-6 py-4">
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="currentPassword"
                        className="block text-sm font-medium text-gray-300 mb-1"
                      >
                        Current Password
                      </label>
                      <input
                        type="password"
                        id="currentPassword"
                        value={passwordForm.currentPassword}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            currentPassword: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="newPassword"
                        className="block text-sm font-medium text-gray-300 mb-1"
                      >
                        New Password
                      </label>
                      <input
                        type="password"
                        id="newPassword"
                        value={passwordForm.newPassword}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            newPassword: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="confirmPassword"
                        className="block text-sm font-medium text-gray-300 mb-1"
                      >
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        value={passwordForm.confirmPassword}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            confirmPassword: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-white/20">
                    <button
                      type="button"
                      onClick={() => setShowPasswordChange(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                    >
                      {t("cancel")}
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-600 border border-transparent rounded-lg hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
                    >
                      {t("changePassword")}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
             
      {showConsentForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-900 p-6 rounded-lg w-[90%] max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => setShowConsentForm(false)}
              className="text-white mb-4"
            >
              Close
            </button>

            <CandidateDeclarationForm />

          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default AdminDashboard;
