import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, where } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import JobApplicationForm from './JobApplicationForm';
import AdminReferralForm from './AdminReferralForm';
import {
  FaBriefcase, FaMapMarkerAlt, FaMoneyBillWave, FaClock, FaPlus,
  FaEye, FaTrash, FaEdit, FaChevronDown, FaChevronUp, FaTimes,
  FaCheck, FaSearch, FaTools, FaListUl, FaUser, FaFileAlt,
  FaExternalLinkAlt, FaIdCard
} from 'react-icons/fa';

// ── Stage config ──────────────────────────────────────────────
const STAGES = [
  { key: 'submitted',             label: 'Submitted',                      color: 'bg-gray-100 text-gray-800' },
  { key: 'resume_screening',      label: 'Resume Screening',               color: 'bg-blue-100 text-blue-800' },
  { key: 'hr_interview',          label: 'HR Interview',                   color: 'bg-indigo-100 text-indigo-800' },
  { key: 'telephonic_interview',  label: 'Telephonic Interview',           color: 'bg-purple-100 text-purple-800' },
  { key: 'walk_in_interview',     label: 'Walk-in Interview',              color: 'bg-yellow-100 text-yellow-800' },
  { key: 'technical_exam',        label: 'Technical Exam',                 color: 'bg-orange-100 text-orange-800' },
  { key: 'technical_interview',   label: 'Technical Interview',            color: 'bg-pink-100 text-pink-800' },
  { key: 'final_discussion',      label: 'Final Discussion',               color: 'bg-teal-100 text-teal-800' },
  { key: 'selected',              label: 'Selected 🎉',                    color: 'bg-green-100 text-green-800' },
  { key: 'rejected',              label: 'Rejected',                       color: 'bg-red-100 text-red-800' },
];

const getStageBadge = (key) => {
  const s = STAGES.find(s => s.key === key) || STAGES[0];
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.color}`}>{s.label}</span>;
};

const isStageVisibleToUser = (app) => {
  if (!app.revealToUserAt) return false;
  const revealDate = app.revealToUserAt?.toDate ? app.revealToUserAt.toDate() : new Date(app.revealToUserAt);
  return new Date() >= revealDate;
};

const generateJobId = () => {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `CWZ-${year}-${rand}`;
};

// ── SuperAdmin: Create Job Form ───────────────────────────────
const CreateJobForm = ({ onClose, onSuccess, editJob }) => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: editJob?.title || '',
    description: editJob?.description || '',
    location: editJob?.location || '',
    salaryRange: editJob?.salaryRange || '',
    experienceRequired: editJob?.experienceRequired || '',
    requirements: editJob?.requirements?.join('\n') || '',
    skills: editJob?.skills?.join(', ') || '',
    googleFormUrl: editJob?.googleFormUrl || '',
    isActive: editJob?.isActive !== undefined ? editJob.isActive : true,
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Job title is required'); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        salaryRange: form.salaryRange.trim(),
        experienceRequired: form.experienceRequired.trim(),
        requirements: form.requirements.split('\n').map(r => r.trim()).filter(Boolean),
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
        googleFormUrl: form.googleFormUrl.trim(),
        isActive: form.isActive,
        updatedAt: serverTimestamp(),
      };
      if (editJob) {
        await updateDoc(doc(db, 'jobListings', editJob.id), payload);
        toast.success('Job updated!');
      } else {
        await addDoc(collection(db, 'jobListings'), {
          ...payload,
          jobId: generateJobId(),
          createdBy: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
          createdAt: serverTimestamp(),
        });
        toast.success('Job posted!');
      }
      onSuccess();
    } catch (e) {
      console.error(e);
      toast.error('Failed to save job');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-800 border border-white/20 rounded-2xl shadow-2xl flex flex-col" style={{maxHeight: 'min(95vh, 850px)'}}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
          <h3 className="text-white font-semibold text-lg">{editJob ? 'Edit Job' : 'Post New Job'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><FaTimes className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              ['Job Title *', 'title', 'text'],
              ['Location', 'location', 'text'],
              ['Salary Range', 'salaryRange', 'text'],
              ['Experience Required', 'experienceRequired', 'text'],
            ].map(([label, key, type]) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-300 mb-1">{label}</label>
                <input type={type} value={form[key]} onChange={e => set(key, e.target.value)}
                  placeholder={key === 'salaryRange' ? 'e.g. ₹5-8 LPA' : key === 'experienceRequired' ? 'e.g. 2-4 years' : ''}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Job Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
              placeholder="Describe the role, responsibilities, team..."
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Requirements (one per line)</label>
            <textarea value={form.requirements} onChange={e => set('requirements', e.target.value)} rows={3}
              placeholder={"Bachelor's degree in relevant field\n2+ years of experience\nStrong communication skills"}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Skills (comma separated)</label>
            <input type="text" value={form.skills} onChange={e => set('skills', e.target.value)}
              placeholder="e.g. Communication, MS Excel, Data Analysis"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Google Form URL (optional)</label>
            <input type="url" value={form.googleFormUrl} onChange={e => set('googleFormUrl', e.target.value)}
              placeholder="https://forms.gle/..."
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
            <p className="text-gray-500 text-xs mt-1">Candidates will see a link to apply via Google Form as an alternative option.</p>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => set('isActive', !form.isActive)}
              className={`w-11 h-6 rounded-full transition-colors duration-200 relative flex-shrink-0 ${form.isActive ? 'bg-indigo-600' : 'bg-gray-600'}`}>
              <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${form.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
            <span className="text-gray-300 text-sm">{form.isActive ? 'Active (visible to all)' : 'Inactive (hidden)'}</span>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/10 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-300 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 text-sm text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50">
            {saving ? 'Saving...' : editJob ? 'Update Job' : 'Post Job'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── SuperAdmin: Application detail modal ─────────────────────
const AppDetailModal = ({ app, onClose, onUpdate }) => {
  const [newStage, setNewStage] = useState(app.stage || 'submitted');
  const [revealDays, setRevealDays] = useState(2);
  const [saving, setSaving] = useState(false);

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const revealDate = new Date();
      revealDate.setDate(revealDate.getDate() + revealDays);
      await updateDoc(doc(db, 'jobApplications', app.id), {
        stage: newStage,
        stageUpdatedAt: serverTimestamp(),
        revealToUserAt: revealDate,
        adminCanSeeAt: serverTimestamp(),
      });
      toast.success('Application stage updated!');
      onUpdate();
      onClose();
    } catch (e) {
      console.error(e);
      toast.error('Failed to update');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-800 border border-white/20 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
          <div>
            <h3 className="text-white font-semibold">Application — {app.applicantName}</h3>
            <p className="text-gray-400 text-xs">{app.jobTitle} · {app.jobId}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><FaTimes className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Personal Info */}
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Name', app.fullName || app.applicantName],
              ['Email', app.applicantEmail],
              ['Phone', app.phone],
              ['Location', app.location],
              ['Gender', app.gender],
              ['Education', app.education],
              ['Salary Expectation', app.salaryExpectation],
              ['Experienced', app.isExperienced ? 'Yes' : 'No (Fresher)'],
            ].map(([label, val]) => val ? (
              <div key={label} className="p-2 bg-white/5 rounded-lg border border-white/10">
                <p className="text-gray-400 text-xs">{label}</p>
                <p className="text-white text-sm">{val}</p>
              </div>
            ) : null)}
          </div>

          {app.isExperienced && (
            <div className="space-y-2">
              <h4 className="text-indigo-300 text-sm font-medium">Work Experience</h4>
              {[
                ['Previous Company', app.previousCompany],
                ['Company Location', app.companyLocation],
                ['Current Salary', app.currentSalary],
                ['Expected Salary', app.expectedSalary],
                ['Projects', app.projects],
              ].map(([label, val]) => val ? (
                <div key={label} className="p-2 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-gray-400 text-xs">{label}</p>
                  <p className="text-white text-sm">{val}</p>
                </div>
              ) : null)}
            </div>
          )}

          {/* Documents */}
          <div>
            <h4 className="text-indigo-300 text-sm font-medium mb-2">Documents</h4>
            <div className="space-y-2">
              {[
                ['Aadhaar Card', app.aadhaarUrl],
                ['PAN Card', app.panUrl],
                ['Resume', app.resumeUrl],
                ['Cover Letter', app.coverLetterUrl],
                ['Experience Letter', app.experienceLetterUrl],
              ].filter(([, url]) => url).map(([label, url]) => (
                <div key={label} className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/10">
                  <span className="text-gray-300 text-sm">{label}</span>
                  <a href={url} target="_blank" rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 text-xs underline flex items-center gap-1">
                    Open <FaExternalLinkAlt className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Stage Update */}
          <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl space-y-3">
            <h4 className="text-indigo-300 text-sm font-medium">Update Application Stage</h4>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Current Stage</label>
              <select value={newStage} onChange={e => setNewStage(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {STAGES.map(s => (
                  <option key={s.key} value={s.key} className="bg-slate-800">{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Reveal to candidate after how many days?
              </label>
              <div className="flex items-center gap-3">
                {[0, 1, 2, 3, 5, 7].map(d => (
                  <button key={d} type="button" onClick={() => setRevealDays(d)}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${revealDays === d ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/10 border-white/20 text-gray-300 hover:bg-white/20'}`}>
                    {d === 0 ? 'Immediately' : `${d}d`}
                  </button>
                ))}
              </div>
              <p className="text-gray-500 text-xs mt-1">
                Admin sees immediately. Candidate sees after {revealDays === 0 ? 'immediately' : `${revealDays} day${revealDays > 1 ? 's' : ''}`}.
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/10 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-300 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20">Close</button>
          <button onClick={handleUpdate} disabled={saving}
            className="px-5 py-2 text-sm text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Update Stage'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main CareersTab component ─────────────────────────────────
const CareersTab = () => {
  const { user } = useAuth();
  const role = user?.role || 'user';

  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeSection, setActiveSection] = useState('listings');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedJob, setExpandedJob] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [editJob, setEditJob] = useState(null);
  const [showApply, setShowApply] = useState(false);
  const [showRefer, setShowRefer] = useState(false);
  const [activeJob, setActiveJob] = useState(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const jobsSnap = await getDocs(collection(db, 'jobListings'));
      const allJobs = jobsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      allJobs.sort((a, b) => {
        const ta = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const tb = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return tb - ta;
      });
      setJobs(allJobs);

      if (role === 'super_admin') {
        const appSnap = await getDocs(collection(db, 'jobApplications'));
        const refSnap = await getDocs(collection(db, 'jobReferrals'));
        setApplications(appSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setReferrals(refSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      }

      if (role === 'admin') {
        const appSnap = await getDocs(collection(db, 'jobApplications'));
        const allApps = appSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setApplications(allApps);
      }

      if (role === 'user') {
        const userId = user?._id || user?.id || '';
        const appSnap = await getDocs(collection(db, 'jobApplications'));
        const mine = appSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(a => a.applicantId === userId);
        setMyApplications(mine);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load careers data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Delete this job listing? This will NOT delete existing applications for this job.')) return;
    try {
      await deleteDoc(doc(db, 'jobListings', jobId));
      toast.success('Job deleted');
      loadAll();
    } catch (e) {
      toast.error('Failed to delete job');
    }
  };

  const handleDeleteApplication = async (appId, applicantName) => {
    if (!window.confirm(`Delete the application from ${applicantName}? This permanently removes all their submitted data.`)) return;
    try {
      await deleteDoc(doc(db, 'jobApplications', appId));
      toast.success('Application deleted');
      loadAll();
    } catch (e) {
      toast.error('Failed to delete application');
    }
  };

  const filteredJobs = jobs.filter(j => {
    const active = role !== 'super_admin' ? j.isActive : true;
    const term = searchTerm.toLowerCase();
    return active && (
      (j.title || '').toLowerCase().includes(term) ||
      (j.location || '').toLowerCase().includes(term)
    );
  });

  const formatDate = (val) => {
    if (!val) return '—';
    const d = val?.toDate ? val.toDate() : new Date(val);
    return d.toLocaleDateString();
  };

  if (loading) {
    return <div className="text-center py-16 text-gray-400">Loading careers...</div>;
  }

  // ── Sections for superadmin ───────────────────────────────
  const superAdminSections = [
    { id: 'listings', label: 'Job Listings' },
    { id: 'applications', label: `Applications (${applications.length})` },
    { id: 'referrals', label: `Referrals (${referrals.length})` },
  ];

  const adminSections = [
    { id: 'listings', label: 'Job Listings' },
    { id: 'applications', label: `Candidate Updates (${applications.length})` },
  ];

  const userSections = [
    { id: 'listings', label: 'Open Positions' },
    { id: 'myapps', label: `My Applications (${myApplications.length})` },
  ];

  const sections = role === 'super_admin' ? superAdminSections : role === 'admin' ? adminSections : userSections;

  return (
    <div className="space-y-4">
      {/* Section switcher */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-1 border border-white/10 flex gap-1 flex-wrap">
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
              activeSection === s.id
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* ── JOB LISTINGS ── */}
      {activeSection === 'listings' && (
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h3 className="text-white font-semibold text-lg">
                {role === 'super_admin' ? 'All Job Listings' : 'Open Positions'}
              </h3>
              <p className="text-gray-400 text-sm">{filteredJobs.length} position{filteredJobs.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                  <FaSearch className="text-gray-400 w-3 h-3" />
                </div>
                <input type="text" placeholder="Search jobs..." value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
              </div>
              {role === 'super_admin' && (
                <button onClick={() => { setEditJob(null); setShowCreateJob(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all">
                  <FaPlus className="w-3 h-3" /> Post Job
                </button>
              )}
            </div>
          </div>

          {filteredJobs.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <FaBriefcase className="w-12 h-12 mx-auto mb-3 text-gray-500" />
              <p>{role === 'super_admin' ? 'No jobs posted yet. Click "Post Job" to create one.' : 'No open positions right now.'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredJobs.map(job => (
                <div key={job.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-white font-medium">{job.title}</h4>
                        <span className="text-indigo-300 text-xs font-mono">{job.jobId}</span>
                        {role === 'super_admin' && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${job.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                            {job.isActive ? 'Active' : 'Inactive'}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 mt-1.5">
                        {job.location && <span className="text-gray-400 text-xs flex items-center gap-1"><FaMapMarkerAlt className="w-3 h-3" />{job.location}</span>}
                        {job.salaryRange && <span className="text-gray-400 text-xs flex items-center gap-1"><FaMoneyBillWave className="w-3 h-3" />{job.salaryRange}</span>}
                        {job.experienceRequired && <span className="text-gray-400 text-xs flex items-center gap-1"><FaClock className="w-3 h-3" />{job.experienceRequired}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {role === 'user' && (
                        <button onClick={() => { setActiveJob(job); setShowApply(true); }}
                          className="px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all">
                          Apply
                        </button>
                      )}
                      {role === 'admin' && (
                        <button onClick={() => { setActiveJob(job); setShowRefer(true); }}
                          className="px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all">
                          Refer
                        </button>
                      )}
                      {role === 'super_admin' && (
                        <>
                          <button onClick={() => { setEditJob(job); setShowCreateJob(true); }}
                            className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-white/10 rounded-lg">
                            <FaEdit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteJob(job.id)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-white/10 rounded-lg">
                            <FaTrash className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg">
                        {expandedJob === job.id ? <FaChevronUp className="w-4 h-4" /> : <FaChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  {expandedJob === job.id && (
                    <div className="border-t border-white/10 p-4 space-y-3">
                      {job.description && <p className="text-gray-300 text-sm leading-relaxed">{job.description}</p>}
                      {job.requirements?.length > 0 && (
                        <div>
                          <p className="text-white text-xs font-medium mb-1">Requirements</p>
                          <ul className="space-y-1">{job.requirements.map((r, i) => (
                            <li key={i} className="text-gray-300 text-xs flex items-start gap-2"><span className="text-indigo-400">•</span>{r}</li>
                          ))}</ul>
                        </div>
                      )}
                      {job.skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {job.skills.map((s, i) => (
                            <span key={i} className="px-2 py-0.5 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-indigo-300 text-xs">{s}</span>
                          ))}
                        </div>
                      )}
                      {job.googleFormUrl && (
                        <a href={job.googleFormUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 underline">
                          <FaExternalLinkAlt className="w-3 h-3" /> Apply via Google Form
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── APPLICATIONS (SuperAdmin + Admin) ── */}
      {activeSection === 'applications' && (role === 'super_admin' || role === 'admin') && (
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-4 sm:p-6">
          <h3 className="text-white font-semibold text-lg mb-4">
            {role === 'super_admin' ? 'All Applications' : 'Candidate Stage Updates'}
          </h3>
          {applications.length === 0 ? (
            <div className="text-center py-10 text-gray-400">No applications yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-white/5">
                  <tr>
                    {(role === 'super_admin'
                      ? ['Candidate', 'Job', 'Stage', 'Applied', 'Reveal Date', 'Actions']
                      : ['Candidate', 'Job', 'Stage', 'Applied']
                    ).map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {applications.map(app => (
                    <tr key={app.id} className="hover:bg-white/5">
                      <td className="px-4 py-3">
                        <p className="text-sm text-white font-medium">{app.applicantName}</p>
                        <p className="text-xs text-gray-400">{app.applicantEmail}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-300">{app.jobTitle}</p>
                        <p className="text-xs text-indigo-300 font-mono">{app.jobId}</p>
                      </td>
                      <td className="px-4 py-3">{getStageBadge(app.stage)}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{formatDate(app.createdAt)}</td>
                      {role === 'super_admin' && (
                        <>
                          <td className="px-4 py-3 text-xs text-gray-400">
                            {app.revealToUserAt
                              ? formatDate(app.revealToUserAt)
                              : <span className="text-yellow-400">Not set</span>}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button onClick={() => setSelectedApp(app)}
                                className="text-indigo-400 hover:text-indigo-300 p-1.5 rounded hover:bg-white/10"
                                title="View & Update Stage">
                                <FaEye className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteApplication(app.id, app.applicantName)}
                                className="text-red-400 hover:text-red-300 p-1.5 rounded hover:bg-white/10"
                                title="Delete Application">
                                <FaTrash className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── REFERRALS (SuperAdmin only) ── */}
      {activeSection === 'referrals' && role === 'super_admin' && (
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-4 sm:p-6">
          <h3 className="text-white font-semibold text-lg mb-4">Admin Referrals</h3>
          {referrals.length === 0 ? (
            <div className="text-center py-10 text-gray-400">No referrals yet.</div>
          ) : (
            <div className="space-y-3">
              {referrals.map(ref => (
                <div key={ref.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                      <p className="text-white font-medium">{ref.candidateName}</p>
                      <p className="text-gray-400 text-xs">{ref.candidateEmail} · {ref.candidatePhone}</p>
                      <p className="text-indigo-300 text-xs mt-1">Job: <span className="font-mono">{ref.jobId}</span> — {ref.jobTitle}</p>
                      <p className="text-gray-300 text-xs mt-1">Referred by: {ref.adminName} ({ref.relation})</p>
                      <p className="text-gray-400 text-xs mt-1">{ref.message}</p>
                    </div>
                    <div className="flex-shrink-0">
                      {ref.resumeUrl && (
                        <a href={ref.resumeUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 underline">
                          <FaFileAlt className="w-3 h-3" /> Resume
                        </a>
                      )}
                      <p className="text-gray-500 text-xs mt-1">{formatDate(ref.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MY APPLICATIONS (User only) ── */}
      {activeSection === 'myapps' && role === 'user' && (
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-4 sm:p-6">
          <h3 className="text-white font-semibold text-lg mb-4">My Applications</h3>
          {myApplications.length === 0 ? (
            <div className="text-center py-10">
              <FaFileAlt className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-300">You haven't applied to any jobs yet.</p>
              <p className="text-gray-500 text-sm mt-1">Browse open positions and hit Apply.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myApplications.map(app => {
                const visible = isStageVisibleToUser(app);
                const revealDate = app.revealToUserAt?.toDate ? app.revealToUserAt.toDate() : app.revealToUserAt ? new Date(app.revealToUserAt) : null;
                return (
                  <div key={app.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <p className="text-white font-medium">{app.jobTitle}</p>
                        <p className="text-indigo-300 text-xs font-mono">{app.jobId}</p>
                        <p className="text-gray-500 text-xs mt-1">Applied: {formatDate(app.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        {visible
                          ? getStageBadge(app.stage)
                          : (
                            <div className="text-right">
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">Update pending</span>
                              {revealDate && (
                                <p className="text-gray-500 text-xs mt-1">
                                  Status update on {revealDate.toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          )
                        }
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showCreateJob && (
        <CreateJobForm
          editJob={editJob}
          onClose={() => { setShowCreateJob(false); setEditJob(null); }}
          onSuccess={() => { setShowCreateJob(false); setEditJob(null); loadAll(); }}
        />
      )}
      {showApply && activeJob && (
        <JobApplicationForm
          job={activeJob}
          onClose={() => { setShowApply(false); setActiveJob(null); }}
          onSuccess={() => { setShowApply(false); setActiveJob(null); loadAll(); }}
        />
      )}
      {showRefer && activeJob && (
        <AdminReferralForm
          job={activeJob}
          onClose={() => { setShowRefer(false); setActiveJob(null); }}
          onSuccess={() => { setShowRefer(false); setActiveJob(null); loadAll(); }}
        />
      )}
      {selectedApp && (
        <AppDetailModal
          app={selectedApp}
          onClose={() => setSelectedApp(null)}
          onUpdate={loadAll}
        />
      )}
    </div>
  );
};

export default CareersTab;
