import React, { useState } from 'react';
import { FaQuestion, FaTimes, FaChevronDown, FaChevronUp, FaEnvelope, FaPhone, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// FAQ DATA — Checkwize specific, limited disclosure
const FAQ_CATEGORIES = [
  {
    id: 'account',
    label: 'Account & Login',
    roles: ['user', 'admin', 'super_admin'],
    questions: [
      {
        q: 'I forgot my password. How do I reset it?',
        a: 'On the login page, click "Forgot Password" and enter your registered email. You will receive a password reset link. If you signed up with Google, your password is managed by Google — visit myaccount.google.com to reset it.'
      },
      {
        q: 'How do I update my profile information?',
        a: 'Go to your Dashboard → Overview tab → Quick Actions → click "Edit Profile". You can update your name and email from there.'
      },
      {
        q: 'Why is my account showing as Inactive?',
        a: 'Your account may have been deactivated by an administrator. Please raise a support ticket or contact us via email for assistance.'
      },
      {
        q: 'Can I change my registered email address?',
        a: 'Yes, go to Dashboard → Overview → Edit Profile. Update your email and save. If you use Google login, your email is tied to your Google account and cannot be changed here.'
      },
    ]
  },
  {
    id: 'consent',
    label: 'Consent Form',
    roles: ['user'],
    questions: [
      {
        q: 'Why do I need to fill a consent form before submitting documents?',
        a: 'The consent form is a mandatory step that authorizes us to process your personal data and documents for verification purposes. Without consent approval, document submission is not available.'
      },
      {
        q: 'I submitted my consent form. How long does approval take?',
        a: 'Consent forms are reviewed by our team. You will see the status update in your Dashboard Overview under "Consent". You will also receive a notification once it is reviewed.'
      },
      {
        q: 'My consent form was rejected. What should I do?',
        a: 'If your consent form was rejected, you can re-submit it. Go to Dashboard → Quick Actions → "Re-submit Consent". Ensure all details are accurate before submitting again.'
      },
      {
        q: 'My consent status shows "Pending review". Is that normal?',
        a: 'Yes, this means your form has been submitted and is awaiting review by our team. No action is needed from your side at this stage.'
      },
    ]
  },
  {
    id: 'documents',
    label: 'Document Upload',
    roles: ['user'],
    questions: [
      {
        q: 'What file formats are accepted for document upload?',
        a: 'We accept common image formats (JPG, PNG) and PDF files. Each file must not exceed 2MB in size. If your file is larger, please compress it before uploading.'
      },
      {
        q: 'My file upload is failing. What should I try?',
        a: 'First check that your file is under 2MB and is a supported format (JPG, PNG, PDF). Try a different browser if the issue persists. Clear your browser cache and retry. If still failing, raise a support ticket.'
      },
      {
        q: 'What is a Geotagged Photo and how do I take one?',
        a: 'A geotagged photo is taken with location services enabled on your device camera. Enable location access in your camera app settings, then take a photo that clearly shows the exterior of the house where you currently reside. The same house should match the address on your Aadhaar card.'
      },
      {
        q: 'Can I submit documents for multiple services at once?',
        a: 'Yes, use the "All Services" option in the verification services form to submit documents for all services in one go. Alternatively, you can submit each service separately.'
      },
      {
        q: 'My address verification requires a current address. What does that mean?',
        a: 'When sharing your current address, you must be physically present at the address mentioned on your Aadhaar card. Use the "Share Current Address" button which will detect your GPS location. This must match your Aadhaar address.'
      },
    ]
  },
  {
    id: 'verification',
    label: 'Verification Status',
    roles: ['user'],
    questions: [
      {
        q: 'What does "Pending" status mean?',
        a: '"Pending" means your application has been submitted and is in the queue for review. No action is needed from your side.'
      },
      {
        q: 'What does "Under Review" mean?',
        a: '"Under Review" means our team is actively reviewing your submitted documents. This is a normal part of the process.'
      },
      {
        q: 'My application shows "Insufficient". What do I do?',
        a: '"Insufficient" means additional or clearer documents are required. Check the Remarks section in your application details — there will be a note explaining what is needed. Go to Dashboard → My Applications → View Details to see the remarks, then resubmit the application with the required documents via the Verification Services tab.'
      },
      {
        q: 'My application is "Approved". How do I download my verification result?',
        a: 'Go to Dashboard → My Applications → click "View Details" on the approved application. Scroll to the "Verification Result" section and click "Download Verification PDF". This is the official document issued by our team.'
      },
      {
        q: 'My application was "Rejected". Can I reapply?',
        a: 'Yes. Go to Dashboard → My Applications → View Details on the rejected application to read the remarks. Then go to Verification Services tab and submit a new application with the correct documents.'
      },
    ]
  },
  {
    id: 'general',
    label: 'General',
    roles: ['user', 'admin', 'super_admin'],
    questions: [
      {
        q: 'Is my data safe with Checkwize?',
        a: 'Yes. All documents and personal data are handled securely. We do not share your information with unauthorized third parties. Our processes comply with applicable data protection standards.'
      },
      {
        q: 'Which browsers are supported?',
        a: 'Checkwize works best on the latest versions of Chrome, Firefox, Edge, and Safari. We recommend keeping your browser updated for the best experience.'
      },
      {
        q: 'How do I contact support?',
        a: 'You can reach us via email using the support form in this Help Center. If there is no response, a call support option is also available. Our team will get back to you as soon as possible.'
      },
    ]
  },
  {
    id: 'admin_help',
    label: 'Admin — Managing Users & Applications',
    roles: ['admin', 'super_admin'],
    questions: [
      {
        q: 'How do I approve or reject a user application?',
        a: 'Go to Application Management tab → find the application → click the eye icon to review → change the Status dropdown to Approved or Rejected → add any Remarks if needed → click Save.'
      },
      {
        q: 'How do I send a notification to a user?',
        a: 'Go to the Overview tab in your dashboard. You will find the "Send Notification" panel. Search for the user by name or email, enter a title and message, then click Send.'
      },
      {
        q: 'A user says they did not receive a notification. What should I check?',
        a: 'Notifications appear as a bell icon in the user\'s dashboard header. Ask the user to check the bell icon for any unread notifications. Note that notifications disappear once dismissed.'
      },
      {
        q: 'How do I attach a result PDF for an approved application?',
        a: 'In the Application Review modal, after setting status to Approved, use the "Attach Result PDF" file input to upload the verification result PDF. Click Save. The user will then be able to download it from their application details.'
      },
      {
        q: 'What is the difference between Consent Forms and Applications tabs?',
        a: 'The Consent Forms tab shows user consent submissions that need to be approved before users can submit verification documents. The Applications tab shows the actual verification document submissions.'
      },
    ]
  },
];

// Auto-generate ticket number
const generateTicketNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const rand = Math.floor(Math.random() * 900 + 100);
  return `TKT-${timestamp}-${rand}`;
};

const HelpCenter = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState('faq'); // 'faq' | 'email' | 'call' | 'submitted'
  const [expandedQ, setExpandedQ] = useState(null);
  const [expandedCat, setExpandedCat] = useState(null);
  const [form, setForm] = useState({
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const userRole = user?.role || 'user';
  const userName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.username || '';
  const userEmail = user?.email || '';

  const visibleCategories = FAQ_CATEGORIES.filter(cat => cat.roles.includes(userRole));

  const handleEmailSubmit = async () => {
    if (!form.subject.trim()) { toast.error('Please enter a subject'); return; }
    if (!form.message.trim()) { toast.error('Please describe your issue'); return; }

    setSubmitting(true);
    try {
      // Count existing tickets to generate readable number
      const snap = await getDocs(collection(db, 'supportTickets'));
      const ticketNumber = `TKT-${String(snap.size + 1).padStart(4, '0')}`;

      await addDoc(collection(db, 'supportTickets'), {
        ticketNumber,
        submittedBy: userName,
        submittedByEmail: userEmail,
        submittedByRole: userRole,
        submittedById: user?._id || user?.id || '',
        subject: form.subject.trim(),
        message: form.message.trim(),
        status: 'open',
        reply: '',
        repliedBy: '',
        repliedAt: null,
        createdAt: serverTimestamp(),
      });

      setView('submitted');
      setForm({ subject: '', message: '' });
      toast.success('Support ticket submitted!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to submit ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Help Button */}
      <button
        onClick={() => { setOpen(o => !o); setView('faq'); setExpandedQ(null); setExpandedCat(null); }}
        className="fixed bottom-6 right-6 z-[9998] w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 hover:scale-110"
        title="Help & Support"
      >
        {open ? <FaTimes className="w-5 h-5" /> : <FaQuestion className="w-5 h-5" />}
      </button>

      {/* Help Panel */}
      {open && (
        <div className="fixed bottom-20 right-6 z-[9997] w-80 sm:w-96 bg-slate-800 border border-white/20 rounded-2xl shadow-2xl flex flex-col max-h-[75vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-2">
              {view !== 'faq' && (
                <button onClick={() => setView('faq')} className="text-gray-400 hover:text-white mr-1">
                  <FaArrowLeft className="w-3.5 h-3.5" />
                </button>
              )}
              <div>
                <h4 className="text-white font-semibold text-sm">
                  {view === 'faq' && 'Help Center'}
                  {view === 'email' && 'Email Support'}
                  {view === 'call' && 'Call Support'}
                  {view === 'submitted' && 'Ticket Submitted'}
                </h4>
                <p className="text-gray-400 text-xs">
                  {view === 'faq' && 'Browse common questions'}
                  {view === 'email' && 'Send us your issue'}
                  {view === 'call' && 'Speak to our team'}
                  {view === 'submitted' && 'We\'ll get back to you soon'}
                </p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white">
              <FaTimes className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 px-4 py-3 space-y-3">

            {/* FAQ View */}
            {view === 'faq' && (
              <>
                <p className="text-gray-400 text-xs">Select a topic below to find answers quickly.</p>
                {visibleCategories.map(cat => (
                  <div key={cat.id} className="border border-white/10 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 transition-colors text-left"
                    >
                      <span className="text-white text-sm font-medium">{cat.label}</span>
                      {expandedCat === cat.id
                        ? <FaChevronUp className="w-3 h-3 text-gray-400" />
                        : <FaChevronDown className="w-3 h-3 text-gray-400" />}
                    </button>
                    {expandedCat === cat.id && (
                      <div className="divide-y divide-white/5">
                        {cat.questions.map((item, idx) => (
                          <div key={idx} className="px-4 py-2">
                            <button
                              onClick={() => setExpandedQ(expandedQ === `${cat.id}-${idx}` ? null : `${cat.id}-${idx}`)}
                              className="w-full text-left flex items-start justify-between gap-2 py-1"
                            >
                              <span className="text-gray-300 text-xs leading-relaxed">{item.q}</span>
                              {expandedQ === `${cat.id}-${idx}`
                                ? <FaChevronUp className="w-3 h-3 text-gray-400 flex-shrink-0 mt-0.5" />
                                : <FaChevronDown className="w-3 h-3 text-gray-400 flex-shrink-0 mt-0.5" />}
                            </button>
                            {expandedQ === `${cat.id}-${idx}` && (
                              <div className="mt-2 mb-1 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                                <p className="text-gray-200 text-xs leading-relaxed">{item.a}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Still need help */}
                <div className="border border-white/10 rounded-xl p-4 bg-white/5 mt-2">
                  <p className="text-white text-sm font-medium mb-1">Still need help?</p>
                  <p className="text-gray-400 text-xs mb-3">If your question isn't listed above, reach out to our support team.</p>
                  <button
                    onClick={() => setView('email')}
                    className="w-full py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-medium rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
                  >
                    <FaEnvelope className="w-3 h-3" />
                    Email Support
                  </button>
                </div>
              </>
            )}

            {/* Email Support View */}
            {view === 'email' && (
              <div className="space-y-3">
                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-gray-400 text-xs">Sending as</p>
                  <p className="text-white text-sm font-medium">{userName}</p>
                  <p className="text-gray-400 text-xs">{userEmail}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Subject</label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                    placeholder="Brief description of your issue"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Message</label>
                  <textarea
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    placeholder="Describe your issue in detail..."
                    rows={5}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs resize-none"
                  />
                </div>
                <button
                  onClick={handleEmailSubmit}
                  disabled={submitting}
                  className="w-full py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-medium rounded-lg hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  <FaEnvelope className="w-3 h-3" />
                  {submitting ? 'Submitting...' : 'Submit Ticket'}
                </button>

                {/* Call fallback */}
                <div className="border border-white/10 rounded-xl p-3 bg-white/5">
                  <p className="text-gray-400 text-xs mb-2">No response after emailing? Try calling us.</p>
                  <button
                    onClick={() => setView('call')}
                    className="w-full py-2 bg-white/10 border border-white/20 text-gray-300 text-xs font-medium rounded-lg hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                  >
                    <FaPhone className="w-3 h-3" />
                    Call Support
                  </button>
                </div>
              </div>
            )}

            {/* Call Support View */}
            {view === 'call' && (
              <div className="space-y-4">
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                    <FaPhone className="w-5 h-5 text-white" />
                  </div>
                  <h5 className="text-white font-semibold text-sm mb-1">Call Support</h5>
                  <p className="text-gray-400 text-xs mb-4">Our support team is available during business hours.</p>
                  {/* ← ADD YOUR NUMBER HERE WHEN READY */}
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-yellow-300 text-xs font-medium">Phone support coming soon</p>
                    <p className="text-gray-400 text-xs mt-1">A support number will be listed here shortly.</p>
                  </div>
                </div>
                <p className="text-gray-500 text-xs text-center">
                  In the meantime, please use email support and our team will respond as soon as possible.
                </p>
              </div>
            )}

            {/* Submitted View */}
            {view === 'submitted' && (
              <div className="space-y-4 text-center py-4">
                <div className="w-14 h-14 mx-auto bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <FaCheckCircle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h5 className="text-white font-semibold text-sm mb-1">Ticket Submitted!</h5>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    Your support ticket has been received. You can track its status in the <strong className="text-gray-200">My Tickets</strong> section of your dashboard.
                  </p>
                </div>
                <button
                  onClick={() => { setView('faq'); setOpen(false); }}
                  className="w-full py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-medium rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all"
                >
                  Close
                </button>
                <button
                  onClick={() => setView('call')}
                  className="w-full py-2 bg-white/10 border border-white/20 text-gray-300 text-xs font-medium rounded-lg hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                >
                  <FaPhone className="w-3 h-3" />
                  Still need help? Call us
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default HelpCenter;
