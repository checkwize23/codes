import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  FaTimes, FaUpload, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt,
  FaGraduationCap, FaBriefcase, FaFileAlt, FaIdCard, FaChevronDown, FaChevronUp
} from 'react-icons/fa';

const uploadToCloudinary = async (file, folder = 'checkwize/careers') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'checkwize-documents');
  formData.append('folder', folder);
  const res = await fetch('https://api.cloudinary.com/v1_1/drvodxyko/raw/upload', {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!data.secure_url) throw new Error('Upload failed');
  return data.secure_url;
};

const FileUploadField = ({ label, accept, onChange, required }) => {
  const [fileName, setFileName] = useState('');
  return (
    <div>
      <label className="block text-xs font-medium text-gray-300 mb-1">{label}{required && ' *'}</label>
      <label className="flex items-center gap-2 px-3 py-2 bg-white/10 border border-white/20 rounded-lg cursor-pointer hover:bg-white/15 transition-colors">
        <FaUpload className="w-3 h-3 text-indigo-400 flex-shrink-0" />
        <span className="text-gray-300 text-xs truncate">{fileName || 'Choose file (PDF/Image)'}</span>
        <input
          type="file"
          accept={accept || '.pdf,image/*'}
          className="hidden"
          onChange={e => {
            const file = e.target.files[0];
            if (file) { setFileName(file.name); onChange(file); }
          }}
          required={required}
        />
      </label>
    </div>
  );
};

const JobApplicationForm = ({ job, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [isExperienced, setIsExperienced] = useState(false);

  const [form, setForm] = useState({
    fullName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
    email: user?.email || '',
    alternateEmail: '',
    phone: '',
    alternatePhone: '',
    gender: '',
    location: '',
    salaryExpectation: '',
    education: '',
    educationDetails: '',
    currentSalary: '',
    expectedSalary: '',
    previousCompany: '',
    companyLocation: '',
    companyDetails: '',
    projects: '',
  });

  const [files, setFiles] = useState({
    aadhaar: null,
    pan: null,
    resume: null,
    coverLetter: null,
    experienceLetter: null,
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    if (!files.aadhaar) { toast.error('Please upload your Aadhaar card'); return; }
    if (!files.pan) { toast.error('Please upload your PAN card'); return; }
    if (!files.resume) { toast.error('Please upload your resume'); return; }

    setSubmitting(true);
    try {
      toast.loading('Uploading documents...');
      const aadhaarUrl = await uploadToCloudinary(files.aadhaar);
      const panUrl = await uploadToCloudinary(files.pan);
      const resumeUrl = await uploadToCloudinary(files.resume);
      let coverLetterUrl = '', experienceLetterUrl = '';
      if (isExperienced && files.coverLetter) coverLetterUrl = await uploadToCloudinary(files.coverLetter);
      if (isExperienced && files.experienceLetter) experienceLetterUrl = await uploadToCloudinary(files.experienceLetter);
      toast.dismiss();

      await addDoc(collection(db, 'jobApplications'), {
        jobId: job.jobId,
        jobTitle: job.title,
        applicantId: user?._id || user?.id || '',
        applicantName: form.fullName,
        applicantEmail: form.email,
        ...form,
        isExperienced,
        aadhaarUrl,
        panUrl,
        resumeUrl,
        coverLetterUrl,
        experienceLetterUrl,
        stage: 'submitted',
        stageUpdatedAt: serverTimestamp(),
        revealToUserAt: null,
        adminCanSeeAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });

      toast.success('Application submitted successfully!');
      onSuccess();
    } catch (e) {
      toast.dismiss();
      console.error(e);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalSteps = isExperienced ? 4 : 3;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-slate-800 border border-white/20 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
          <div>
            <h3 className="text-white font-semibold text-lg">Apply — {job.title}</h3>
            <p className="text-indigo-300 text-xs font-mono">{job.jobId} · Step {step} of {totalSteps}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><FaTimes className="w-5 h-5" /></button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-white/10 flex-shrink-0">
          <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }} />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Step 1 — Personal Info */}
          {step === 1 && (
            <div className="space-y-4">
              <h4 className="text-indigo-300 font-medium text-sm uppercase tracking-wider">Personal Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  ['Full Name', 'fullName', 'text', true],
                  ['Email', 'email', 'email', true],
                  ['Alternate Email', 'alternateEmail', 'email', false],
                  ['Phone Number', 'phone', 'tel', true],
                  ['Alternate Phone', 'alternatePhone', 'tel', false],
                  ['Location', 'location', 'text', true],
                ].map(([label, key, type, req]) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-300 mb-1">{label}{req && ' *'}</label>
                    <input type={type} value={form[key]} onChange={e => set(key, e.target.value)} required={req}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Gender *</label>
                <div className="flex gap-3 flex-wrap">
                  {['Male', 'Female', 'Non-binary', 'Prefer not to say'].map(g => (
                    <button key={g} type="button" onClick={() => set('gender', g)}
                      className={`px-4 py-2 rounded-lg text-sm border transition-all ${form.gender === g ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/10 border-white/20 text-gray-300 hover:bg-white/20'}`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-2">Do you have work experience?</label>
                <div className="flex gap-3">
                  {[['Yes', true], ['No (Fresher)', false]].map(([label, val]) => (
                    <button key={label} type="button" onClick={() => setIsExperienced(val)}
                      className={`px-4 py-2 rounded-lg text-sm border transition-all ${isExperienced === val ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/10 border-white/20 text-gray-300 hover:bg-white/20'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — Education & Salary */}
          {step === 2 && (
            <div className="space-y-4">
              <h4 className="text-indigo-300 font-medium text-sm uppercase tracking-wider">Education & Salary</h4>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Highest Education *</label>
                <select value={form.education} onChange={e => set('education', e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                  <option value="" className="bg-slate-800">Select education level</option>
                  {['High School (10th)', 'HSC / 12th', 'Diploma', 'Bachelor\'s Degree', 'Master\'s Degree', 'PhD', 'Other'].map(e => (
                    <option key={e} value={e} className="bg-slate-800">{e}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Education Details *</label>
                <textarea value={form.educationDetails} onChange={e => set('educationDetails', e.target.value)} rows={3}
                  placeholder="Institution name, year of passing, percentage/CGPA, specialization..."
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Salary Expectation *</label>
                  <input type="text" value={form.salaryExpectation} onChange={e => set('salaryExpectation', e.target.value)}
                    placeholder="e.g. ₹5-7 LPA"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                </div>
                {isExperienced && (
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Current Salary</label>
                    <input type="text" value={form.currentSalary} onChange={e => set('currentSalary', e.target.value)}
                      placeholder="e.g. ₹4 LPA"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3 — Experience (only if experienced) */}
          {step === 3 && isExperienced && (
            <div className="space-y-4">
              <h4 className="text-indigo-300 font-medium text-sm uppercase tracking-wider">Work Experience</h4>
              {[
                ['Previous Company Name *', 'previousCompany'],
                ['Company Location *', 'companyLocation'],
                ['Company Details', 'companyDetails'],
              ].map(([label, key]) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-300 mb-1">{label}</label>
                  <input type="text" value={form[key]} onChange={e => set(key, e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Projects Done There</label>
                <textarea value={form.projects} onChange={e => set('projects', e.target.value)} rows={3}
                  placeholder="Briefly describe key projects you worked on..."
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Expected Salary</label>
                <input type="text" value={form.expectedSalary} onChange={e => set('expectedSalary', e.target.value)}
                  placeholder="e.g. ₹8 LPA"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
              </div>
            </div>
          )}

          {/* Last step — Document Uploads */}
          {step === totalSteps && (
            <div className="space-y-4">
              <h4 className="text-indigo-300 font-medium text-sm uppercase tracking-wider">Document Uploads</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FileUploadField label="Aadhaar Card" required onChange={f => setFiles(p => ({ ...p, aadhaar: f }))} />
                <FileUploadField label="PAN Card" required onChange={f => setFiles(p => ({ ...p, pan: f }))} />
                <FileUploadField label="Resume" required onChange={f => setFiles(p => ({ ...p, resume: f }))} />
                {isExperienced && (
                  <>
                    <FileUploadField label="Cover Letter" onChange={f => setFiles(p => ({ ...p, coverLetter: f }))} />
                    <FileUploadField label="Experience Letter" onChange={f => setFiles(p => ({ ...p, experienceLetter: f }))} />
                  </>
                )}
              </div>
              {job.googleFormUrl && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <p className="text-emerald-300 text-xs">
                    You can also submit your application via{' '}
                    <a href={job.googleFormUrl} target="_blank" rel="noopener noreferrer" className="underline font-medium">Google Form</a>
                    {' '}as a backup.
                  </p>
                </div>
              )}
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                <p className="text-indigo-300 text-xs">
                  By submitting, you consent to Checkwize processing your personal data for recruitment purposes.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 flex-shrink-0">
          <button onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
            className="px-4 py-2 text-sm text-gray-300 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors">
            {step > 1 ? 'Previous' : 'Cancel'}
          </button>
          {step < totalSteps ? (
            <button onClick={() => setStep(s => s + 1)}
              className="px-5 py-2 text-sm text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all">
              Next
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting}
              className="px-5 py-2 text-sm text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 transition-all">
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobApplicationForm;
