import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FaTimes, FaUpload, FaPaperPlane } from 'react-icons/fa';

const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'checkwize-documents');
  formData.append('folder', 'checkwize/careers/referrals');
  const res = await fetch('https://api.cloudinary.com/v1_1/drvodxyko/raw/upload', {
    method: 'POST', body: formData,
  });
  const data = await res.json();
  if (!data.secure_url) throw new Error('Upload failed');
  return data.secure_url;
};

const AdminReferralForm = ({ job, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    candidateName: '',
    candidateEmail: '',
    candidatePhone: '',
    relation: '',
    message: '',
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeName, setResumeName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.candidateName.trim()) { toast.error('Enter candidate name'); return; }
    if (!form.candidateEmail.trim()) { toast.error('Enter candidate email'); return; }
    if (!form.relation.trim()) { toast.error('Enter your relation with the candidate'); return; }
    if (!form.message.trim()) { toast.error('Enter a message'); return; }
    if (!resumeFile) { toast.error('Please upload the candidate\'s resume'); return; }

    setSubmitting(true);
    try {
      toast.loading('Uploading resume...');
      const resumeUrl = await uploadToCloudinary(resumeFile);
      toast.dismiss();

      await addDoc(collection(db, 'jobReferrals'), {
        jobId: job.jobId,
        jobTitle: job.title,
        adminId: user?._id || user?.id || '',
        adminName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
        adminEmail: user?.email || '',
        candidateName: form.candidateName,
        candidateEmail: form.candidateEmail,
        candidatePhone: form.candidatePhone,
        relation: form.relation,
        message: form.message,
        resumeUrl,
        createdAt: serverTimestamp(),
      });

      toast.success('Referral submitted successfully!');
      onSuccess();
    } catch (e) {
      toast.dismiss();
      console.error(e);
      toast.error('Failed to submit referral');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-800 border border-white/20 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
          <div>
            <h3 className="text-white font-semibold text-lg">Refer a Candidate</h3>
            <p className="text-indigo-300 text-xs font-mono">{job.jobId} — {job.title}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><FaTimes className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-blue-300 text-xs">
              You are referring as <strong>{user?.firstName} {user?.lastName}</strong> ({user?.email}).
              This referral will be reviewed by the Super Admin.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              ['Candidate Full Name *', 'candidateName', 'text'],
              ['Candidate Email *', 'candidateEmail', 'email'],
              ['Candidate Phone', 'candidatePhone', 'tel'],
              ['Your Relation with Candidate *', 'relation', 'text'],
            ].map(([label, key, type]) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-300 mb-1">{label}</label>
                <input type={type} value={form[key]} onChange={e => set(key, e.target.value)}
                  placeholder={key === 'relation' ? 'e.g. Friend, Colleague, Relative' : ''}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Message *</label>
            <textarea value={form.message} onChange={e => set('message', e.target.value)} rows={4}
              placeholder="Why are you referring this candidate? What makes them a good fit for this role?"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Candidate's Resume *</label>
            <label className="flex items-center gap-2 px-3 py-2 bg-white/10 border border-white/20 rounded-lg cursor-pointer hover:bg-white/15 transition-colors">
              <FaUpload className="w-3 h-3 text-indigo-400 flex-shrink-0" />
              <span className="text-gray-300 text-xs truncate">{resumeName || 'Choose file (PDF/Image)'}</span>
              <input type="file" accept=".pdf,image/*" className="hidden"
                onChange={e => {
                  const f = e.target.files[0];
                  if (f) { setResumeFile(f); setResumeName(f.name); }
                }} />
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-300 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting}
            className="px-5 py-2 text-sm text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 flex items-center gap-2 transition-all">
            <FaPaperPlane className="w-3 h-3" />
            {submitting ? 'Submitting...' : 'Submit Referral'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminReferralForm;
