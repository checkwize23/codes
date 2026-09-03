import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import {
  FaBriefcase, FaMapMarkerAlt, FaMoneyBillWave, FaClock,
  FaSearch, FaChevronDown, FaChevronUp, FaExternalLinkAlt,
  FaGraduationCap, FaTools, FaListUl, FaTimes, FaFileAlt
} from 'react-icons/fa';

const STAGES = [
  {key:'submitted', label:'Submitted', color:'bg-gray-100 text-gray-800'},
  {key:'resume_screening', label:'Resume Screening', color:'bg-blue-100 text-blue-800'},
  {key:'hr_interview', label:'HR Interview', color:'bg-indigo-100 text-indigo-800'},
  {key:'telephonic_interview', label:'Telephonic Interview', color:'bg-purple-100 text-purple-800'},
  {key:'walk_in_interview', label:'Walk-in Interview', color:'bg-yellow-100 text-yellow-800'},
  {key:'technical_exam', label:'Technical Exam', color:'bg-orange-100 text-orange-800'},
  {key:'technical_interview', label:'Technical Interview', color:'bg-pink-100 text-pink-800'},
  {key:'final_discussion', label:'Final Discussion', color:'bg-teal-100 text-teal-800'},
  {key:'selected', label:'Selected 🎉', color:'bg-green-100 text-green-800'},
  {key:'rejected', label:'Rejected', color:'bg-red-100 text-red-800'},
];

const getStateBadge = (key) => {
  const s= STAGES.find(s => s.key === key) || STAGES[0];
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.color}`}>{s.label}</span>;
};

const isStageVisible = (app) => {
  if (!app.revealToUserAt) return false;
  const d = app.revealToUserAt?.toDate ? app.revealToUserAt.toDate() : new Date(app.revealToUserAt);
  return new Date() >= d;
};

const CareersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedJob, setExpandedJob] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApplyPrompt, setShowApplyPrompt] = useState(false);
  const [myApplications, setMyApplications] = useState([]);
  const [showMyApps, setShowMyApps] = useState(false);

  useEffect(() => {
    loadJobs();
    if (user) loadMyApplications();
  }, [user]);

  const loadMyApplications = async () => {
    try {
      const userId = user?._id || user?.id || '';
      const snap = await getDocs(collection(db, 'jobApplications'));
      const mine = snap.docs .map(d => ({ id: d.id, ...d.data() }))
        .filter (a => a.applicantId === userId);
      mine.sort((a,b) => {
        const ta = a.createdAt?. toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const tb = b.createdAt?. toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return tb-ta;
      });
      setMyApplications(mine);
    } catch (e) {
      console.error(e);  
    }
  };

  const loadJobs = async () => {
    try {
      const snap = await getDocs(collection(db, 'jobListings'));
      const items = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(j => j.isActive);
      items.sort((a, b) => {
        const ta = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const tb = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return tb - ta;
      });
      setJobs(items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (job) => {
    if (!user) {
      setSelectedJob(job);
      setShowApplyPrompt(true);
      return;
    }
    if (user.role === 'user') {
      navigate('/dashboard', { state: { openCareers: true, jobId: job.jobId } });
    } else if (user.role === 'admin') {
      navigate('/admin', { state: { openCareers: true, jobId: job.jobId } });
    } else if (user.role === 'super_admin') {
      navigate('/superadmin', { state: { openCareers: true } });
    }
  };

  const filtered = jobs.filter(j =>
    (j.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (j.location || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (j.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero */}
      <div className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20" />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-indigo-300 text-sm font-medium mb-6">
            <FaBriefcase className="w-4 h-4" />
            We're Hiring
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Build the Future of
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400"> Background Verification</span>
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-8">
            Join Checkwize and help companies make safer, smarter hiring decisions.
            We're looking for passionate people to grow with us.
          </p>

          {user && myApplications.length > 0 && (
            <div className="mb-6">
              <button onClick={() => setShowMyApps(s => !s)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 border border-white/20 text-white text-sm font-medium rounded-xl hover:bg-white/20 transition-all">
                <FaFileAlt className="w-4 h-4 text-indigo-300" />
                  My Applications ({myApplications.length})                  
                </button>
            </div>    
          )}

          <div className="relative max-w-xl mx-auto">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10">
              <FaSearch className="text-gray-400 w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search by role, location..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm backdrop-blur-sm"
            />
          </div>
        </div>
      </div>
      
      {/* My Applications Panel */}
      {showMyApps && user && (
        <div className="max-w-4xl mx-auto px-4 mb-8">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 sm:p-6">
            <h3 className="text-white font-semibold text-lg mb-4">My Applications</h3>
            {myApplications.length === 0 ? (
              <p className="text-gray-400 text-sm">You haven't applied to any jobs yet.</p>
            ) : (
              <div className="space-y-3">
                {myApplications.map(app => {
                  const visible = isStageVisible(app);
                  const revealDate = app.revealToUserAt?.toDate
                    ? app.revealToUserAt.toDate()
                    : app.revealToUserAt ? new Date(app.revealToUserAt) : null;
                  return (
                    <div key={app.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <p className="text-white font-medium">{app.jobTitle}</p>
                        <p className="text-indigo-300 text-xs font-mono">{app.jobId}</p>
                        <p className="text-gray-500 text-xs mt-1">
                          Applied: {app.createdAt?.toDate ? app.createdAt.toDate().toLocaleDateString() : '—'}
                        </p>
                      </div>
                      <div className="text-right">
                        {visible ? (
                          getStageBadge(app.stage)
                        ) : (
                          <div>
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">Update pending</span>
                            {revealDate && (
                              <p className="text-gray-500 text-xs mt-1">
                                Status available on {revealDate.toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Jobs */}
      <div className="max-w-4xl mx-auto px-4 pb-20">
        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading opportunities...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <FaBriefcase className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-300 text-lg">No open positions right now.</p>
            <p className="text-gray-500 text-sm mt-2">Check back soon — we're growing fast.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-400 text-sm mb-6">{filtered.length} open position{filtered.length !== 1 ? 's' : ''}</p>
            {filtered.map(job => (
              <div key={job.id} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden hover:bg-white/15 transition-all duration-200">
                {/* Job header */}
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                          <FaBriefcase className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold text-lg">{job.title}</h3>
                          <span className="text-indigo-300 text-xs font-mono">{job.jobId}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-3">
                        {job.location && (
                          <span className="flex items-center gap-1 text-gray-300 text-sm">
                            <FaMapMarkerAlt className="w-3 h-3 text-indigo-400" />
                            {job.location}
                          </span>
                        )}
                        {job.salaryRange && (
                          <span className="flex items-center gap-1 text-gray-300 text-sm">
                            <FaMoneyBillWave className="w-3 h-3 text-green-400" />
                            {job.salaryRange}
                          </span>
                        )}
                        {job.experienceRequired && (
                          <span className="flex items-center gap-1 text-gray-300 text-sm">
                            <FaClock className="w-3 h-3 text-yellow-400" />
                            {job.experienceRequired}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleApply(job)}
                        className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200"
                      >
                        {user?.role === 'admin' ? 'Refer Someone' : 'Apply Now'}
                      </button>
                      <button
                        onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                        className="p-2.5 bg-white/10 border border-white/20 rounded-xl text-gray-300 hover:bg-white/20 transition-colors"
                      >
                        {expandedJob === job.id ? <FaChevronUp className="w-4 h-4" /> : <FaChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded details */}
                {expandedJob === job.id && (
                  <div className="border-t border-white/10 px-6 pb-6 pt-4 space-y-4">
                    {job.description && (
                      <div>
                        <h4 className="text-white font-medium text-sm mb-2">About This Role</h4>
                        <p className="text-gray-300 text-sm leading-relaxed">{job.description}</p>
                      </div>
                    )}
                    {job.requirements?.length > 0 && (
                      <div>
                        <h4 className="text-white font-medium text-sm mb-2 flex items-center gap-2">
                          <FaListUl className="w-3 h-3 text-indigo-400" /> Requirements
                        </h4>
                        <ul className="space-y-1">
                          {job.requirements.map((r, i) => (
                            <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                              <span className="text-indigo-400 mt-1">•</span> {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {job.skills?.length > 0 && (
                      <div>
                        <h4 className="text-white font-medium text-sm mb-2 flex items-center gap-2">
                          <FaTools className="w-3 h-3 text-purple-400" /> Skills
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {job.skills.map((s, i) => (
                            <span key={i} className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-indigo-300 text-xs">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {job.googleFormUrl && (
                      <div className="pt-2">
                        <a
                          href={job.googleFormUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 underline"
                        >
                          <FaExternalLinkAlt className="w-3 h-3" />
                          Also apply via Google Form
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Login Prompt Modal */}
      {showApplyPrompt && selectedJob && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-white/20 rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-lg">Login to Apply</h3>
              <button onClick={() => setShowApplyPrompt(false)} className="text-gray-400 hover:text-white">
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-300 text-sm mb-2">
              You're applying for <strong className="text-white">{selectedJob.title}</strong>
            </p>
            <p className="text-gray-400 text-xs mb-6">
              Please log in or create an account to submit your application.
              Your job ID is <span className="text-indigo-300 font-mono">{selectedJob.jobId}</span> — note it down!
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/login', { state: { from: '/careers' } })}
                className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium text-sm hover:from-indigo-600 hover:to-purple-700 transition-all"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/signup', { state: { from: '/careers' } })}
                className="w-full py-2.5 bg-white/10 border border-white/20 text-white rounded-xl font-medium text-sm hover:bg-white/20 transition-all"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CareersPage;
