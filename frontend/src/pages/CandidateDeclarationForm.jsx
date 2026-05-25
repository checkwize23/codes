import React, { useState } from "react";
import { db } from "../firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const STEPS = [
  { number: 1, label: "Personal" },
  { number: 2, label: "Address" },
  { number: 3, label: "Education" },
  { number: 4, label: "Employment" },
  { number: 5, label: "References" },
  { number: 6, label: "Other" },
  { number: 7, label: "Declaration" },
];

const inputClass =
  "w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm";

const labelClass = "block text-sm font-medium text-gray-300 mb-1";

const CandidateDeclarationForm = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    personal: {},
    address: {},
    education: [{}],
    employment: [{}],
    references: [{}],
    other: {},
    declaration: {
      agreed: false,
      signature: "",
    },
  });

  const handleChange = (section, field, value) => {
    setForm((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const addEducation = () =>
    setForm((prev) => ({ ...prev, education: [...prev.education, {}] }));

  const updateEducation = (index, field, value) => {
    const list = [...form.education];
    list[index] = { ...list[index], [field]: value };
    setForm((prev) => ({ ...prev, education: list }));
  };

  const addEmployment = () =>
    setForm((prev) => ({ ...prev, employment: [...prev.employment, {}] }));

  const updateEmployment = (index, field, value) => {
    const list = [...form.employment];
    list[index] = { ...list[index], [field]: value };
    setForm((prev) => ({ ...prev, employment: list }));
  };

  const addReference = () =>
    setForm((prev) => ({ ...prev, references: [...prev.references, {}] }));

  const updateReference = (index, field, value) => {
    const list = [...form.references];
    list[index] = { ...list[index], [field]: value };
    setForm((prev) => ({ ...prev, references: list }));
  };

  const handleSubmit = async () => {
    if (!form.declaration.agreed) {
      return toast.error("You must accept the declaration to proceed.");
    }
    if (!form.declaration.signature?.trim()) {
      return toast.error("Please type your full name as a signature.");
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, "serviceRequests"), {
        userId: user._id || user.uid || user.email,
        userEmail: user.email,
        userName: user.displayName || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        serviceKey: "consent",
        personal: form.personal,
        address: form.address,
        education: form.education,
        employment: form.employment,
        references: form.references,
        other: form.other,
        consentData: {
          fullName: form.personal?.fullName || "",
          agreed: form.declaration?.agreed || false,
          signature: form.declaration?.signature || "",
        },
        status: "pending",
        remarks: "",
        reviewedBy: "",
        reviewedAt: null,
        submittedAt: serverTimestamp(),
      });

      toast.success("Consent form submitted successfully!");
      setStep(1);
      setForm({
        personal: {},
        address: {},
        education: [{}],
        employment: [{}],
        references: [{}],
        other: {},
        declaration: { agreed: false, signature: "" },
      });
    } catch (err) {
      console.error(err);
      toast.error("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 pb-16 pt-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Page Title */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">
            Candidate Declaration Form
          </h1>
          <p className="text-gray-300 text-sm mt-1">
            Please complete all sections accurately before submitting.
          </p>
        </div>

        {/* Step Progress Bar */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/10 shadow-2xl mb-6">
          <div className="flex items-center justify-between overflow-x-auto gap-1">
            {STEPS.map((s, idx) => (
              <div key={s.number} className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${
                      step === s.number
                        ? "bg-gradient-to-r from-emerald-500 to-slate-600 border-emerald-400 text-white scale-110"
                        : step > s.number
                        ? "bg-emerald-600 border-emerald-500 text-white"
                        : "bg-white/10 border-white/20 text-gray-400"
                    }`}
                  >
                    {step > s.number ? "✓" : s.number}
                  </div>
                  <span className="text-xs text-gray-400 mt-1 hidden sm:block">{s.label}</span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-1 rounded transition-all duration-300 ${
                      step > s.number ? "bg-emerald-500" : "bg-white/10"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-5 sm:p-7">

          {/* STEP 1 — Personal Details */}
          {step === 1 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-gradient-to-r from-emerald-500 to-slate-600 flex items-center justify-center text-xs font-bold text-white">1</span>
                Personal Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Full Name</label>
                  <input
                    className={inputClass}
                    placeholder="Enter your full name"
                    value={form.personal.fullName || ""}
                    onChange={(e) => handleChange("personal", "fullName", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Father's Name</label>
                  <input
                    className={inputClass}
                    placeholder="Enter father's name"
                    value={form.personal.fatherName || ""}
                    onChange={(e) => handleChange("personal", "fatherName", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Date of Birth</label>
                  <input
                    type="date"
                    className={inputClass}
                    value={form.personal.dob || ""}
                    onChange={(e) => handleChange("personal", "dob", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Phone Number</label>
                  <input
                    className={inputClass}
                    placeholder="Enter phone number"
                    value={form.personal.phone || ""}
                    onChange={(e) => handleChange("personal", "phone", e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 — Address */}
          {step === 2 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-gradient-to-r from-emerald-500 to-slate-600 flex items-center justify-center text-xs font-bold text-white">2</span>
                Address
              </h2>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Street / House No.</label>
                  <input
                    className={inputClass}
                    placeholder="Enter street address"
                    value={form.address.street || ""}
                    onChange={(e) => handleChange("address", "street", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>City</label>
                  <input
                    className={inputClass}
                    placeholder="Enter city"
                    value={form.address.city || ""}
                    onChange={(e) => handleChange("address", "city", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>State</label>
                  <input
                    className={inputClass}
                    placeholder="Enter state"
                    value={form.address.state || ""}
                    onChange={(e) => handleChange("address", "state", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>PIN / ZIP Code</label>
                  <input
                    className={inputClass}
                    placeholder="Enter PIN code"
                    value={form.address.pin || ""}
                    onChange={(e) => handleChange("address", "pin", e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 — Education */}
          {step === 3 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-gradient-to-r from-emerald-500 to-slate-600 flex items-center justify-center text-xs font-bold text-white">3</span>
                Education
              </h2>
              <div className="space-y-5">
                {form.education.map((edu, idx) => (
                  <div key={idx} className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <p className="text-xs text-gray-400 font-semibold mb-3 uppercase tracking-wider">
                      Education #{idx + 1}
                    </p>
                    <div className="space-y-3">
                      <div>
                        <label className={labelClass}>Course / Degree</label>
                        <input
                          className={inputClass}
                          placeholder="e.g. B.Tech, MBA"
                          value={edu.course || ""}
                          onChange={(e) => updateEducation(idx, "course", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>University / Institution</label>
                        <input
                          className={inputClass}
                          placeholder="Enter institution name"
                          value={edu.university || ""}
                          onChange={(e) => updateEducation(idx, "university", e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelClass}>Year of Passing</label>
                          <input
                            className={inputClass}
                            placeholder="e.g. 2022"
                            value={edu.year || ""}
                            onChange={(e) => updateEducation(idx, "year", e.target.value)}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Percentage / CGPA</label>
                          <input
                            className={inputClass}
                            placeholder="e.g. 8.5"
                            value={edu.grade || ""}
                            onChange={(e) => updateEducation(idx, "grade", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addEducation}
                className="mt-4 w-full py-2 text-sm font-medium text-emerald-300 border border-emerald-500/40 rounded-lg hover:bg-emerald-500/10 transition-all duration-200"
              >
                + Add Another Education
              </button>
            </div>
          )}

          {/* STEP 4 — Employment */}
          {step === 4 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-gradient-to-r from-emerald-500 to-slate-600 flex items-center justify-center text-xs font-bold text-white">4</span>
                Employment History
              </h2>
              <div className="space-y-5">
                {form.employment.map((emp, idx) => (
                  <div key={idx} className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <p className="text-xs text-gray-400 font-semibold mb-3 uppercase tracking-wider">
                      Employment #{idx + 1}
                    </p>
                    <div className="space-y-3">
                      <div>
                        <label className={labelClass}>Company Name</label>
                        <input
                          className={inputClass}
                          placeholder="Enter company name"
                          value={emp.company || ""}
                          onChange={(e) => updateEmployment(idx, "company", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Designation</label>
                        <input
                          className={inputClass}
                          placeholder="Enter your role/designation"
                          value={emp.designation || ""}
                          onChange={(e) => updateEmployment(idx, "designation", e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelClass}>From</label>
                          <input
                            type="date"
                            className={inputClass}
                            value={emp.from || ""}
                            onChange={(e) => updateEmployment(idx, "from", e.target.value)}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>To</label>
                          <input
                            type="date"
                            className={inputClass}
                            value={emp.to || ""}
                            onChange={(e) => updateEmployment(idx, "to", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addEmployment}
                className="mt-4 w-full py-2 text-sm font-medium text-emerald-300 border border-emerald-500/40 rounded-lg hover:bg-emerald-500/10 transition-all duration-200"
              >
                + Add Another Employment
              </button>
            </div>
          )}

          {/* STEP 5 — References */}
          {step === 5 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-gradient-to-r from-emerald-500 to-slate-600 flex items-center justify-center text-xs font-bold text-white">5</span>
                References
              </h2>
              <div className="space-y-5">
                {form.references.map((ref, idx) => (
                  <div key={idx} className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <p className="text-xs text-gray-400 font-semibold mb-3 uppercase tracking-wider">
                      Reference #{idx + 1}
                    </p>
                    <div className="space-y-3">
                      <div>
                        <label className={labelClass}>Full Name</label>
                        <input
                          className={inputClass}
                          placeholder="Reference person's name"
                          value={ref.name || ""}
                          onChange={(e) => updateReference(idx, "name", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Email</label>
                        <input
                          type="email"
                          className={inputClass}
                          placeholder="Reference person's email"
                          value={ref.email || ""}
                          onChange={(e) => updateReference(idx, "email", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Phone</label>
                        <input
                          className={inputClass}
                          placeholder="Reference person's phone"
                          value={ref.phone || ""}
                          onChange={(e) => updateReference(idx, "phone", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Relationship</label>
                        <input
                          className={inputClass}
                          placeholder="e.g. Former Manager, Colleague"
                          value={ref.relationship || ""}
                          onChange={(e) => updateReference(idx, "relationship", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addReference}
                className="mt-4 w-full py-2 text-sm font-medium text-emerald-300 border border-emerald-500/40 rounded-lg hover:bg-emerald-500/10 transition-all duration-200"
              >
                + Add Another Reference
              </button>
            </div>
          )}

          {/* STEP 6 — Other Details */}
          {step === 6 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-gradient-to-r from-emerald-500 to-slate-600 flex items-center justify-center text-xs font-bold text-white">6</span>
                Other Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Do you have any pending criminal case?</label>
                  <select
                    className={inputClass}
                    value={form.other.criminal || "No"}
                    onChange={(e) => handleChange("other", "criminal", e.target.value)}
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Any health conditions we should be aware of?</label>
                  <textarea
                    className={`${inputClass} resize-none h-20`}
                    placeholder="Leave blank if none"
                    value={form.other.health || ""}
                    onChange={(e) => handleChange("other", "health", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Additional Remarks</label>
                  <textarea
                    className={`${inputClass} resize-none h-20`}
                    placeholder="Any other information you wish to share"
                    value={form.other.remarks || ""}
                    onChange={(e) => handleChange("other", "remarks", e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 7 — Declaration */}
          {step === 7 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-gradient-to-r from-emerald-500 to-slate-600 flex items-center justify-center text-xs font-bold text-white">7</span>
                Declaration
              </h2>
              <div className="space-y-5">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-sm text-gray-300 leading-relaxed">
                  I hereby declare that all the information provided in this form is true and accurate to the best of my knowledge. I understand that providing false information may result in the rejection of my application or termination of employment. I consent to CheckWize verifying the information I have provided.
                </div>
                <div>
                  <label className={labelClass}>Full Name (as signature)</label>
                  <input
                    className={inputClass}
                    placeholder="Type your full name to sign"
                    value={form.declaration.signature || ""}
                    onChange={(e) => handleChange("declaration", "signature", e.target.value)}
                  />
                </div>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-0.5">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={form.declaration.agreed || false}
                      onChange={(e) => handleChange("declaration", "agreed", e.target.checked)}
                    />
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                      form.declaration.agreed
                        ? "bg-emerald-500 border-emerald-500"
                        : "bg-white/10 border-white/30 group-hover:border-emerald-400"
                    }`}>
                      {form.declaration.agreed && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                    I agree to all terms and confirm the declaration above is true and accurate.
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex justify-between items-center">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-5 py-2 text-sm font-medium text-gray-300 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-all duration-200"
              >
                ← Back
              </button>
            ) : (
              <div />
            )}

            {step < 7 && (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-slate-600 rounded-lg hover:from-emerald-600 hover:to-slate-700 transition-all duration-200 shadow-lg"
              >
                Next →
              </button>
            )}

            {step === 7 && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-slate-600 rounded-lg hover:from-emerald-600 hover:to-slate-700 transition-all duration-200 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting..." : "Submit Form"}
              </button>
            )}
          </div>
        </div>

        {/* Step label below on mobile */}
        <p className="text-center text-xs text-gray-500 mt-4">
          Step {step} of 7 — {STEPS[step - 1].label}
        </p>
      </div>
    </div>
  );
};

export default CandidateDeclarationForm;
