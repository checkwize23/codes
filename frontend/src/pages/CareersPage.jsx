import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import {
  FaBriefcase, FaMapMarkerAlt, FaMoneyBillWave, FaClock,
  FaSearch, FaChevronDown, FaChevronUp, FaExternalLinkAlt,
  FaGraduationCap, FaTools, FaListUl, FaTimes
} from 'react-icons/fa';

const CareersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedJob, setExpandedJob] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApplyPrompt, setShowApplyPrompt] = useState(false);

  useEffect(() => {
    loadJobs();
  }, []);

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
          <div className="relative max-w-xl mx-auto">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
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
