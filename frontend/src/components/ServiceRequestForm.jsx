import React, { useMemo, useState, useEffect, useRef } from 'react'
import LoadingOverlay from './LoadingOverlay'
import { db, auth } from '../firebase'
import { uploadToCloudinary } from "../../utils/cloudinaryUpload";
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { signInAnonymously } from 'firebase/auth'

const SERVICES = {
  'all-services': {
    label: 'All Services',
    description: 'Submit all required documents and information for comprehensive verification in one go.',
    isAllServices: true,
  },
  address: {
    label: 'Address Verification',
    description: 'Upload proof of address documents.',
    documents: [
      { key: 'aadhaar', label: 'Aadhaar Card', multiple: false },
      { key: 'passport', label: 'Passport', multiple: false },
      { key: 'rentalAgreement', label: 'Rental Agreement', multiple: false },
    ],
  },
  employment: {
    label: 'Employment Verification',
    description: 'Provide past employment proofs. You can add multiple employments.',
    repeatableGroup: {
      key: 'employments',
      label: 'Employment',
      fields: [
        { key: 'payslips', label: 'Last 3 Months Payslips', multiple: true },
        { key: 'appointmentLetter', label: 'Appointment Letter', multiple: false },
        { key: 'relievingLetter', label: 'Relieving Letter', multiple: false },
      ],
    },
  },
  education: {
    label: 'Education Verification',
    description: 'Upload education certificates and marksheets.',
    documents: [
      { key: 'certificates', label: 'Education Certificates (Degree/Diploma/etc.)', multiple: true },
      { key: 'tenthMarks', label: '10th Marks Sheet', multiple: false },
    ],
  },
  cv: {
    label: 'CV Validation',
    description: 'Upload detailed CV for validation.',
    documents: [
      { key: 'cvDocument', label: 'Detailed CV', multiple: false },
    ],
  },
  id: {
    label: 'ID Verification',
    description: 'Upload government issued ID documents.',
    documents: [
      { key: 'govtId', label: 'Govt ID (driver license/etc.)', multiple: false },
      { key: 'voterId', label: 'Voter ID', multiple: false },
      { key: 'aadhaar', label: 'Aadhaar Card', multiple: false },
      { key: 'passport', label: 'Passport', multiple: false },
      { key: 'tenthMarks', label: '10th Marks Card', multiple: false },
    ],
  },
  court: {
    label: 'Court Verification',
    description: 'Upload PAN card and 10th marks sheet.',
    documents: [
      { key: 'pan', label: 'PAN Card', multiple: false },
      { key: 'tenthMarks', label: '10th Marks Sheet', multiple: false },
    ],
  },
  drug: {
    label: 'Drug Test',
    description: 'Upload diagnostic centre sample request or report as applicable.',
    documents: [
      { key: 'sample', label: 'Diagnostic Centre Request/Report', multiple: false },
    ],
  },
  compliance:{
    label:'Compliance Consulting',
    description: 'Upload compliance-related documents for verification.',
    documents:[
      { key: 'complianceReport', label:' Compliance Report', multiple: false },
      { key: 'policyDocs', label: 'Policy Documents', multiple: true},
      { key: 'auditDocs', label: 'Audit Documents', multiple: true},
    ],
    extraFields: [
      {key: 'companyName', label:'Company Name', type: 'text'},
      { key: 'complianceType', label: 'Compliance type', type: 'text'},
      { key: 'auditPeriod', label: 'Audit Period', type: 'text'},
    ]
  },
  vendor:{
      label: "Vendor Assessment",
      description: 'Upload vendor-related documents for assessment.',
      repeatableGroup: {
        key: "vendors",
        label:"Vendor",
        fields:[
        { key: 'vendorName', label:'Vendor Name', type: 'text'},
        { key: 'vendorType', label:'Vendor type', type: 'select', options: ['Supplier', 'Contractor', 'Consultancy', 'Partner']},
        { key: 'riskLevel', label: 'Risk Level',type: 'select', options: ['Low', 'Medium', 'High']},
        { key: 'vendorAgreement', label: 'Vendor Agreement', type:'file',multiple: false},
        { key: 'companyProfile', label: 'Company Profile',type:'file', multiple: false},
        { key: 'financialDocs', label: 'Financial Documents',type:'file', multiple: true},
      ],
  },
}
}

const MAX_FILE_BYTES = 2 * 1024 * 1024 // 2MB per file limit

const FileInput = ({ id, label, multiple, onChange }) => {
  const [selectedLabel, setSelectedLabel] = useState('No file chosen')
  const inputRef = useRef(null)

  const handleLocalChange = (e) => {
    const files = multiple ? Array.from(e.target.files || []) : (e.target.files?.[0] || null)
    if (multiple) {
      setSelectedLabel(files.length > 0 ? `${files.length} file(s) selected` : 'No file chosen')
    } else {
      setSelectedLabel(files ? files.name : 'No file chosen')
    }
    onChange(files)
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor={id}>{label}</label>
      <input
        ref={inputRef}
        id={id}
        type="file"
        multiple={!!multiple}
        onChange={handleLocalChange}
        className="sr-only"
      />
      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3">
        <label
          htmlFor={id}
          className="w-full sm:w-auto text-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-600 text-white rounded-lg hover:from-emerald-600 hover:to-cyan-700 text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer"
        >
          Choose file
        </label>
        <span className="mt-2 sm:mt-0 text-xs text-gray-400 break-all">
          {selectedLabel}
        </span>
      </div>
    </div>
  )
}

const ServiceRequestForm = () => {
  const { user } = useAuth()
  const [serviceKey, setServiceKey] = useState('address')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formState, setFormState] = useState({})
  const [numReferences, setNumReferences] = useState(1)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const [isMobile, setIsMobile] = useState(false)
  const [allServicesStep, setAllServicesStep] = useState(1)

  const current = useMemo(() => SERVICES[serviceKey], [serviceKey])
  const [consentGiven, setConsentGiven] = useState(false)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Detect mobile viewport to enable 2-step flow for All Services
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)')
    const update = () => setIsMobile(!!mql.matches)
    update()
    if (mql.addEventListener) {
      mql.addEventListener('change', update)
    } else {
      mql.addListener(update)
    }
    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener('change', update)
      } else {
        mql.removeListener(update)
      }
    }
  }, [])

  const handleDocumentChange = (docKey, value) => {
    setFormState((prev) => ({ ...prev, [docKey]: value }))
  }

  const handleAllServicesDocumentChange = (serviceKey, docKey, value) => {
    setFormState((prev) => ({
      ...prev,
      [serviceKey]: {
        ...prev[serviceKey],
        [docKey]: value
      }
    }))
  }

  const addEmployment = () => {
    setFormState((prev) => ({ ...prev, employments: [ ...(prev.employments || []), {} ] }))
  }

  const updateEmployment = (index, fieldKey, value) => {
    setFormState((prev) => {
      const list = [...(prev.employments || [])]
      list[index] = { ...(list[index] || {}), [fieldKey]: value }
      return { ...prev, employments: list }
    })
  }

  const removeEmployment = (index) => {
    setFormState((prev) => {
      const list = [...(prev.employments || [])]
      list.splice(index, 1)
      return { ...prev, employments: list }
    })
  }

  const addAllServicesEmployment = () => {
    setFormState((prev) => ({
      ...prev,
      employment: {
        ...prev.employment,
        employments: [...(prev.employment?.employments || []), {}]
      }
    }))
  }

  const updateAllServicesEmployment = (index, fieldKey, value) => {
    setFormState((prev) => {
      const list = [...(prev.employment?.employments || [])]
      list[index] = { ...(list[index] || {}), [fieldKey]: value }
      return {
        ...prev,
        employment: {
          ...prev.employment,
          employments: list
        }
      }
    })
  }

  const removeAllServicesEmployment = (index) => {
    setFormState((prev) => {
      const list = [...(prev.employment?.employments || [])]
      list.splice(index, 1)
      return {
        ...prev,
        employment: {
          ...prev.employment,
          employments: list
        }
      }
    })
  }

  const addAllServicesVendor = () => {
    setFormState((prev) => ({
      ...prev,
      vendor: {
        ...prev.vendor,
        vendors: [...(prev.vendor?.vendors || []), {}]
      }
    }))
  }

  const updateAllServicesVendor = (index, fileKey, value) => {
    setFormState((prev) => {
      const list = [...(prev.vendor?.vendors || [])]
      list[index] = {...(list[index] || {}), [fileKey]: value}

      return {
        ...prev,
        vendor: {
          ...prev.vendor,
          vendors:list
        }
      }
    })
  }

  const removeAllServicesVendor = (index) => {
    setFormState((prev) => {
      const list = [...(prev.vendor?.vendors || [])]
      list.splice(index, 1)

      return {
        ...prev,
        vendor: {
          ...prev.vendor,
          vendors: list
        }
      }
    })
  }


  const addAllServicesReferenceName = (serviceKey) => {
    setFormState((prev) => ({
      ...prev,
      [serviceKey]: {
        ...prev[serviceKey],
        referenceNames: [...(prev[serviceKey]?.referenceNames || ['']), '']
      }
    }))
  }

  const updateAllServicesReferenceName = (serviceKey, index, value) => {
    setFormState((prev) => {
      const newNames = [...(prev[serviceKey]?.referenceNames || [])]
      newNames[index] = value
      return {
        ...prev,
        [serviceKey]: {
          ...prev[serviceKey],
          referenceNames: newNames
        }
      }
    })
  }

  const removeAllServicesReferenceName = (serviceKey, index) => {
    setFormState((prev) => {
      const newNames = [...(prev[serviceKey]?.referenceNames || [])]
      newNames.splice(index, 1)
      return {
        ...prev,
        [serviceKey]: {
          ...prev[serviceKey],
          referenceNames: newNames
        }
      }
    })
  }

  const resolveUserId = () => {
    // Prefer Firebase Auth UID for Storage paths to satisfy common security rules
    const firebaseUid = auth?.currentUser?.uid
    return firebaseUid || user?._id || user?.id || user?.email || 'anonymous'
  }

  const resolveUserName = () => {
    const full = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim()
    return full || user?.username || (user?.email ? user.email.split('@')[0] : '') || 'user'
  }

  const sanitizeFolder = (name) => String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'user'

  const uploadFileOrFiles = async (basePath, key, fileOrFiles) => {
    if (!fileOrFiles) return null
    if (Array.isArray(fileOrFiles)) {
      const urls = []
      for (const file of fileOrFiles) {
        if (file && file.size > MAX_FILE_BYTES) {
          throw new Error(`File ${file.name} exceeds 2MB limit`)
        }
        urls.push(await uploadToCloudinary(file))
      }
      return urls
    } else {
      const file = fileOrFiles
      if (file && file.size > MAX_FILE_BYTES) {
        throw new Error(`File ${file.name} exceeds 2MB limit`)
      }
      return await uploadToCloudinary(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!consentGiven) {
      toast.error('You must give consent before submitting.')
      return
    }

    if (!user) {
      toast.error('Please log in to submit a request.')
      return
    }
    
    setSubmitting(true)
    try {
      // Ensure Firebase Auth session exists for Storage Rules
      if (!auth.currentUser) {
        try {
          await signInAnonymously(auth)
        } catch (authErr) {
          console.error('Anonymous sign-in failed:', authErr)
        }
      }

      const uid = resolveUserId()
      const timestamp = Date.now()

      if (serviceKey === 'all-services') {
        // Handle all services submission
        const displayName = sanitizeFolder(resolveUserName())
        const basePath = `users/${uid}/${displayName}/all-services/${timestamp}`
        const requests = []
        
        // Define all services for comprehensive submission
        const allServices = {
          address: {
            documents: [
              { key: 'aadhaar', label: 'Aadhaar Card', multiple: false },
              { key: 'passport', label: 'Passport', multiple: false },
              { key: 'rentalAgreement', label: 'Rental Agreement', multiple: false },
            ],
          },
          employment: {
            repeatableGroup: {
              key: 'employments',
              fields: [
                { key: 'payslips', label: 'Last 3 Months Payslips', multiple: true },
                { key: 'appointmentLetter', label: 'Appointment Letter', multiple: false },
                { key: 'relievingLetter', label: 'Relieving Letter', multiple: false },
              ],
            },
          },
          education: {
            documents: [
              { key: 'certificates', label: 'Education Certificates (Degree/Diploma/etc.)', multiple: true },
              { key: 'tenthMarks', label: '10th Marks Sheet', multiple: false },
            ],
          },
          cv: {
            documents: [
              { key: 'cvDocument', label: 'Detailed CV', multiple: false },
            ],
          },
          id: {
            documents: [
              { key: 'govtId', label: 'Govt ID (driver license/etc.)', multiple: false },
              { key: 'voterId', label: 'Voter ID', multiple: false },
              { key: 'aadhaar', label: 'Aadhaar Card', multiple: false },
              { key: 'passport', label: 'Passport', multiple: false },
              { key: 'tenthMarks', label: '10th Marks Card', multiple: false },
            ],
          },
          court: {
            documents: [
              { key: 'pan', label: 'PAN Card', multiple: false },
              { key: 'tenthMarks', label: '10th Marks Sheet', multiple: false },
            ],
          },
          drug: {
            documents: [
              { key: 'sample', label: 'Diagnostic Centre Request/Report', multiple: false },
            ],
          },
          compliance: {
            documents: [
              { key: 'complianceReport',label: 'Compliance Report', multiple: false},
              { key: 'policyDocs',label:'Policy Documents', multiple: true},
              { key: 'auditDocs',label:'Audit Documents', multiple: true},
            ],
            extraFields:[
              { key: 'companyName', label:'Compnay Name', type: 'text' },
              { key: 'complianceType', label: 'Compliance Type', type: 'text' },
              { key: 'auditPeriod', label: 'Audit Period', type: 'text' }
            ]
          },
          vendor: {
            repeatableGroup:{
              key: 'vendors',
              fields: [
                { key: 'vendorName', label: 'Vendor Name', type: 'text'},
                { key: 'vendorType', label: 'Vendor type', type: 'select', options: ['Supplier', 'Contractor', 'Consultancy', 'Partner']},
                { key: 'riskLevel', label: 'Risk Level',type: 'select', options: ['Low', 'Medium', 'High']},
                { key: 'vendorAgreement',label:'Vendor Agreement',type:'file', multiple: false},
                { key: 'companyProfile',label:'Company Profile',type:'file', multiple: false},
                { key: 'financialDocs',label:'Financial Documents',type:'file', multiple: true},
            
              ],
          }
          }
        }

        for (const [serviceKey, service] of Object.entries(allServices)) {
          const serviceData = formState[serviceKey]
          if (!serviceData) continue

          const payload = {
            serviceKey,
            notes: notes || '',
            userId: uid,
            userName: resolveUserName(),
            userEmail: user?.email || null,
            status: 'submitted',
            createdAt: serverTimestamp(),
            isAllServicesSubmission: true,
            allServicesTimestamp: timestamp
          }

          // Handle documents
          if (service.documents) {
            for (const doc of service.documents) {
              if (serviceData[doc.key]) {
                payload[doc.key] = await uploadFileOrFiles(basePath, `${serviceKey}_${doc.key}`, serviceData[doc.key])
              }
            }
          }

          // Handle employment repeatable group
          if (service.repeatableGroup?.key === 'employments' && serviceData.employments) {
            const items = []
            for (const [index, emp] of serviceData.employments.entries()) {
              const empBase = `${basePath}/employment_${index + 1}`
              const record = {}
              for (const f of service.repeatableGroup.fields) {
                if (emp[f.key]) {
                  record[f.key] = await uploadFileOrFiles(empBase, f.key, emp[f.key])
                }
              }
              items.push(record)
            }
            payload.employments = items
          }

          if (service.repeatableGroup?.key === 'vendors' && serviceData.vendors){
            const items = []
            for (const [index, vendor] of serviceData.vendors.entries()) {
              const vendorBase = `${basePath}/vendor_${index + 1}`
              const record = {
                vendorName: '',
                vendorType: '',
                riskLevel: '',
                vendorAgreement: null,
                companyProfile: null,
                financialDocs: []
              }
              for (const f of service.repeatableGroup.fields) {
                if (vendor[f.key] === undefined || vendor[f.key] === null || vendor[f.key] === '') continue
                
                if (f.type === 'text' || f.type === 'select') {
                  record[f.key] = vendor [f.key] || ''
                } else {
                  record[f.key] = vendor[f.key]
                    ? await uploadFileOrFiles (vendorBase, f.key, vendor[f.key])
                    : (f.multiple ? [] : null)
                }
              }
              items.push(record)
              }
              payload.vendors = items
            }
            

          // Handle extra fields
          if (service.extraFields) {
            for (const f of service.extraFields) {
              payload[f.key] = serviceData[f.key] ?? null
            }
          }

          // Handle reference names
          if (service.referenceNames && serviceData.referenceNames) {
            payload.referenceNames = serviceData.referenceNames.filter(name => name.trim() !== '')
          }

          // Only submit if there's actual data
          const hasData = Object.keys(payload).some(key => 
            key !== 'serviceKey' && 
            key !== 'notes' && 
            key !== 'userId' && 
            key !== 'status' && 
            key !== 'createdAt' && 
            key !== 'isAllServicesSubmission' && 
            key !== 'allServicesTimestamp' && 
            payload[key] !== null && 
            payload[key] !== undefined
          )

          if (hasData) {
            requests.push(addDoc(collection(db, 'serviceRequests'), payload))
          }
        }

        // Handle references submission separately
        if (formState.references?.referenceNames && formState.references.referenceNames.some(name => name.trim() !== '')) {
          const referencesPayload = {
            serviceKey: 'references',
            notes: notes || '',
            userId: uid,
            userName: resolveUserName(),
            userEmail: user?.email || null,
            status: 'submitted',
            createdAt: serverTimestamp(),
            isAllServicesSubmission: true,
            allServicesTimestamp: timestamp,
            referenceNames: formState.references.referenceNames.filter(name => name.trim() !== '')
          }
          requests.push(addDoc(collection(db, 'serviceRequests'), referencesPayload))
        }

        if (requests.length === 0) {
          toast.error('Please upload at least one document to submit.')
          setSubmitting(false)
          return
        }

        await Promise.all(requests)
        toast.success(`Successfully submitted ${requests.length} service request(s)!`)
      } else {
        // Handle single service submission
        const displayName = sanitizeFolder(resolveUserName())
        const basePath = `users/${uid}/${displayName}/${serviceKey}/${timestamp}`
        const payload = { serviceKey, notes: notes || '', userId: uid, userName: resolveUserName(), userEmail: user?.email || null, status: 'submitted', createdAt: serverTimestamp() }

      if (current.documents) {
        for (const doc of current.documents) {
          payload[doc.key] = await uploadFileOrFiles(basePath, doc.key, formState[doc.key])
        }
      }

      if (current.repeatableGroup?.key === 'employments') {
        const items = []
        for (const [index, emp] of (formState.employments || []).entries()) {
          const empBase = `${basePath}/employment_${index + 1}`
          const record = {}
          for (const f of current.repeatableGroup.fields) {
            record[f.key] = await uploadFileOrFiles(empBase, f.key, emp?.[f.key])
          }
          items.push(record)
        }
        payload.employments = items
      }

      if(current.repeatableGroup?.key === 'vendors') {
        const items = []
        
        for (const [index, vendor] of (formState.vendors || []).entries()) {
          const vendorBase = `${basePath}/vendor_${index + 1}`
          const record = {}

          for (const f of current.repeatableGroup.fields){
            if(vendor[f.key] === undefined || vendor[f.key] === null || vendor[f.key] === '') continue

            if (f.type === 'text' || f.type === 'select') {
              record[f.key] =  vendor[f.key] || ''
            } else {
            record[f.key] = vendor[f.key]
            ? await uploadFileOrFiles(vendorBase, f.key, vendor[f.key])
            : (f.multiple ? [] : null ) 
          }
        }
          items.push(record)
        }  
          payload.vendors = items
        }

      if (current.extraFields) {
        for (const f of current.extraFields) {
          payload[f.key] = formState[f.key] ?? null
        }
      }

      await addDoc(collection(db, 'serviceRequests'), payload)
      toast.success('Request submitted successfully!')

      }

      setFormState({})
      setNotes('')
      setNumReferences(1)
    } catch (err) {
      console.error(err)
      const message = typeof err?.message === 'string' && err.message.includes('exceeds 2MB')
        ? err.message
        : 'Failed to submit request.'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl shadow-2xl border border-white/10 p-6">
      {submitting && <LoadingOverlay />}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-2">Apply for Verification</h3>
        <p className="text-gray-300">Select a service and upload required documents.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Service</label>
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent flex items-center justify-between"
            >
              <span>{SERVICES[serviceKey]?.label}</span>
              <svg 
                className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isDropdownOpen && (
              <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-white/20 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                {Object.entries(SERVICES).map(([key, svc]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setServiceKey(key)
                      setFormState({})
                      setIsDropdownOpen(false)
                    }}
                    className={`w-full text-left px-4 py-3 text-sm transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg ${
                      key === serviceKey 
                        ? 'bg-gradient-to-r from-emerald-500 to-cyan-600 text-white' 
                        : 'text-gray-300 hover:bg-gradient-to-r hover:from-emerald-500/20 hover:to-cyan-600/20 hover:text-white'
                    }`}
                  >
                    {svc.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2">{current.description}</p>
        </div>

        {/* All Services Form */}
        {serviceKey === 'all-services' && (
          <div className="space-y-8">
            {isMobile && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button type="button" onClick={() => setAllServicesStep(1)} className={`w-8 h-8 rounded-full text-sm font-semibold ${allServicesStep === 1 ? 'bg-emerald-600 text-white' : 'bg-white/10 text-gray-300'}`}>1</button>
                  <div className="w-10 h-1 bg-white/20 rounded"></div>
                  <button type="button" onClick={() => setAllServicesStep(2)} className={`w-8 h-8 rounded-full text-sm font-semibold ${allServicesStep === 2 ? 'bg-emerald-600 text-white' : 'bg-white/10 text-gray-300'}`}>2</button>
                </div>
                <div className="text-xs text-gray-300">Step {allServicesStep} of 2</div>
              </div>
            )}
            {Object.entries(SERVICES)
              .filter(([key]) => key !== 'all-services')
              .filter(([key]) => {
                if (!isMobile) return true
                const step1 = ['address', 'employment', 'education']
                const step2 = ['cv', 'id', 'court', 'drug','compliance', 'vendor']
                return allServicesStep === 1 ? step1.includes(key) : step2.includes(key)
              })
              .map(([serviceKey, service]) => (
              <div key={serviceKey} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 shadow-lg hover:bg-white/10 transition-all duration-300">
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-white mb-2">{service.label}</h4>
                  <p className="text-sm text-gray-300">{service.description}</p>
        </div>

        {/* Static documents */}
                {service.documents && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {service.documents.map((doc) => (
                      <FileInput
                        key={doc.key}
                        id={`${serviceKey}-${doc.key}`}
                        label={doc.label}
                        multiple={doc.multiple}
                        onChange={(val) => handleAllServicesDocumentChange(serviceKey, doc.key, val)}
                      />
                    ))}
                  </div>
                )}

                {/* Repeatable employment section */}
                {service.repeatableGroup?.key === 'employments' && (
                  <div className="space-y-4 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <h5 className="font-medium text-white">Employment Items</h5>
                      <button 
                        type="button" 
                        onClick={addAllServicesEmployment} 
                        className="mt-2 md:mt-0 w-full md:w-auto px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-600 text-white rounded-lg hover:from-emerald-600 hover:to-cyan-700 text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        Add Employment
                      </button>
                    </div>
                    {(formState[serviceKey]?.employments || []).map((emp, idx) => (
                      <div key={idx} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {service.repeatableGroup.fields.map((f) => (
                            <FileInput
                              key={f.key}
                              id={`emp-${idx}-${f.key}`}
                              label={f.label}
                              multiple={f.multiple}
                              onChange={(val) => updateAllServicesEmployment(idx, f.key, val)}
                            />
                          ))}
                        </div>
                        <div className="flex justify-end">
                          <button 
                            type="button" 
                            onClick={() => removeAllServicesEmployment(idx)} 
                            className="w-full md:w-auto px-4 py-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/30 hover:text-red-200 text-sm font-medium transition-all duration-200"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {service.repeatableGroup?.key === 'vendors' && (
                  <div className="space-y-4 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <h5 className="font-medium text-white">Vendor Items</h5>
                      <button 
                        type="button" onClick={addAllServicesVendor}
                        className="mt-2 md:mt-0 w-full md:w-auto px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-600 text-white rounded-lg">
                          Add Vendor
                        </button>
                    </div>

                    {(formState[serviceKey]?.vendors || []).map((vendor, idx) => (
                      <div key={idx} className="bg-white/5 backdrop-blur-sm border border-white/10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {service.repeatableGroup.fields.map((f) => (
                            f.type === 'text' ? (
                              <input key={f.key} type="text"
                                placeholder={f.label} value={vendor[f.key] || ''} onChange={(e) => updateAllServicesVendor (idx, f.key, e.target.value)}
                                className="w-full bg-white/10 backdrop-blur-sm border-white/20 border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 appwarance-none"/>  
                            ) : f.type === 'select' ? (
                              <select key={f.key} value={vendor[f.key] || ''} onChange={(e) => updateAllServicesVendor(idx, f.key, e.target.value )}
                                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 appearance-none">
                               <option value= "" className="bg-slate-800 text-gray-300">Select {f.label}</option>
                               {f.options.map(opt => (
                                <option key={opt} value={opt} className="bg-slate-800 text-white">{opt}</option>
                               ))}
                               </select>
                            ) : (
                            <FileInput key={f.key} id={`vendor-${idx}-${f.key}`}
                              label={f.label} multiple={f.multiple} onChange={(val) => updateAllServicesVendor(idx, f.key, val)} />
                            )    
                            ))}
                        </div>    

                        <div className="flex justify-end">
                          <button type="button" onClick={() => removeAllServicesVendor(idx)}
                            className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg">
                              Remove
                          </button>
                        </div>
                      </div>    
                    ))}
                  </div>  
                )}

                {/* Extra fields */}
                {service.extraFields && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {service.extraFields.map((f) => (
                      <div key={f.key}>
                        <label className="block text-sm font-medium text-gray-300 mb-2">{f.label}</label>
                        <input
                          type={f.type || 'text'}
                          min={f.min}
                          max={f.max}
                          value={f.key === 'numReferences' ? numReferences : (formState[serviceKey]?.[f.key] ?? '')}
                          onChange={(e) => {
                            if (f.key === 'numReferences') {
                              setNumReferences(e.target.value)
                            } else {
                              setFormState((prev) => ({
                                ...prev,
                                [serviceKey]: {
                                  ...prev[serviceKey],
                                  [f.key]: e.target.value
                                }
                              }))
                            }
                          }}
                          className="mt-1 block w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Reference Names Section */}
                {service.referenceNames && (
                  <div className="space-y-4 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <h5 className="font-medium text-white">Reference Names</h5>
                      <button 
                        type="button" 
                        onClick={() => addAllServicesReferenceName(serviceKey)} 
                        className="mt-2 md:mt-0 w-full md:w-auto px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        Add Reference
                      </button>
                    </div>
                    <p className="text-xs text-gray-400">Add names of people who can provide references for you</p>
                    {(formState[serviceKey]?.referenceNames || ['']).map((name, idx) => (
                      <div key={idx} className="flex flex-col md:flex-row md:items-center md:space-x-3">
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => updateAllServicesReferenceName(serviceKey, idx, e.target.value)}
                          placeholder={`Reference ${idx + 1} name`}
                          className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                        <button 
                          type="button" 
                          onClick={() => removeAllServicesReferenceName(serviceKey, idx)} 
                          className="mt-2 md:mt-0 w-full md:w-auto px-4 py-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/30 hover:text-red-200 text-sm font-medium transition-all duration-200"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Dedicated References Section for All Services */}
            {(!isMobile || allServicesStep === 2) && (
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 shadow-lg hover:bg-white/10 transition-all duration-300">
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-white mb-2">References</h4>
                <p className="text-sm text-gray-300">Provide references details. You can add reference names.</p>
              </div>

              {/* Reference Names Section */}
              <div className="space-y-4 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <h5 className="font-medium text-white">Reference Names</h5>
                  <button 
                    type="button" 
                    onClick={() => addAllServicesReferenceName('references')} 
                    className="mt-2 md:mt-0 w-full md:w-auto px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    Add Reference
                  </button>
                </div>
                <p className="text-xs text-gray-400">Add names of people who can provide references for you</p>
                {(formState.references?.referenceNames || ['']).map((name, idx) => (
                  <div key={idx} className="flex flex-col md:flex-row md:items-center md:space-x-3">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => updateAllServicesReferenceName('references', idx, e.target.value)}
                      placeholder={`Reference ${idx + 1} name`}
                      className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                    <button 
                      type="button" 
                      onClick={() => removeAllServicesReferenceName('references', idx)} 
                      className="mt-2 md:mt-0 w-full md:w-auto px-4 py-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/30 hover:text-red-200 text-sm font-medium transition-all duration-200"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
            )}

            {isMobile && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                {allServicesStep === 2 && (
                  <button type="button" onClick={() => setAllServicesStep(1)} className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-300 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/20 transition-colors duration-200">Back</button>
                )}
                {allServicesStep === 1 && (
                  <button type="button" onClick={() => setAllServicesStep(2)} className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-cyan-600 rounded-lg hover:from-emerald-600 hover:to-cyan-700 transition-all duration-200">Next</button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Single Service Form */}
        {serviceKey !== 'all-services' && current.documents && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {current.documents.map((doc) => (
              <FileInput
                key={doc.key}
                id={`${serviceKey}-${doc.key}`}
                label={doc.label}
                multiple={doc.multiple}
                onChange={(val) => handleDocumentChange(doc.key, val)}
              />
            ))}
          </div>
        )}

        {/* Repeatable employment section for single services */}
        {serviceKey !== 'all-services' && current.repeatableGroup?.key === 'employments' && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <h4 className="font-medium text-white">Employment Items</h4>
              <button type="button" onClick={addEmployment} className="mt-2 md:mt-0 w-full md:w-auto px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-600 text-white rounded-lg hover:from-emerald-600 hover:to-cyan-700 text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-200">Add Employment</button>
            </div>
            {(formState.employments || []).map((emp, idx) => (
              <div key={idx} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {current.repeatableGroup.fields.map((f) => (
                    <FileInput
                      key={f.key}
                      id={`emp-${idx}-${f.key}`}
                      label={f.label}
                      multiple={f.multiple}
                      onChange={(val) => updateEmployment(idx, f.key, val)}
                    />
                  ))}
                </div>
                <div className="flex justify-end">
                  <button type="button" onClick={() => removeEmployment(idx)} className="w-full md:w-auto px-4 py-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/30 hover:text-red-200 text-sm font-medium transition-all duration-200">Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {serviceKey !== 'all-services' && current.repeatableGroup?.key === 'vendors' && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <h4 className="font-medium text-white">Vendor Items</h4>
              <button
                type="button" onClick={() =>
                  setFormState((prev) => ({
                  ...prev,
                  vendors: [...(prev.vendors || []), {}],
                }))
              }
              className="mt-2 md:mt-0 w-full md:w-auto px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-600 text-white rounded-lg">
              Add Vendor
              </button>
            </div>

            {(formState.vendors || []).map((vendor, idx) => (
              <div key={idx} className="bg-white/5 border rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {current.repeatableGroup.fields.map((f) =>
                    f.type === 'text' ? (
                      <input key={f.key} type="text" placeholder={f.label} value={vendor[f.key] || ''} onChange={(e) => {
                        const list = [...(formState.vendors || [])]
                        list[idx] = { ...list[idx], [f.key]: e.target.value }
                        setFormState((prev) => ({ ...prev, vendors: list }))
                      }}
                      className="w-full bg-white/10 backdrop-blur-sm border-white/20 border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 appearance-none"/>
                    ) : f.type === 'select' ? (
                      <select key={f.key} value={vendor[f.key] || ''} onChange={(e) => {
                        const list = [...(formState.vendors || [])]
                        list[idx] = { ...list[idx], [f.key]: e.target.value }
                        setFormState((prev) => ({ ...prev, vendors: list }))
                      }}
                      className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 appearance-none">
                      <option value="" className="bg-slate-800 text-gray-300">Select {f.label}</option>
                      {f.options.map((opt) => (
                        <option key={opt} value={opt} className="bg-slate-800 text-white" >
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <FileInput key={f.key} id={`vendor-${idx}-${f.key}`} label={f.label} multiple={f.multiple} onChange={(val) => {
                        const list = [...(formState.vendors || [])]
                        list[idx] = { ...list[idx], [f.key]: val }
                        setFormState((prev) => ({ ...prev, vendors: list }))
                      }}
                    />
                  )
              )}
        </div>

        <div className="flex justify-end">
          <button
            type="button" onClick={() => {
              const list = [...(formState.vendors || [])]
              list.splice(idx, 1)
              setFormState((prev) => ({ ...prev, vendors: list }))
            }}
            className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg">
            Remove
          </button>
        </div>
      </div>
    ))}
  </div>
)}

        {/* Extra fields for single services */}
        {serviceKey !== 'all-services' && current.extraFields && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {current.extraFields.map((f) => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-gray-300 mb-2">{f.label}</label>
                <input
                  type={f.type || 'text'}
                  min={f.min}
                  max={f.max}
                  value={formState[f.key] ?? ''}
                  onChange={(e) => setFormState((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  className="mt-1 block w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            ))}
          </div>
        )}


        {(!isMobile || serviceKey !== 'all-services' || (isMobile && serviceKey === 'all-services' && allServicesStep === 2)) && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 block w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Any additional information for the verifier"
            />
          </div>
        )}

        <div className="flex items-start space-x-2 mt-4">
          <input type="checkbox" id="consent" checked={consentGiven} onChange={(e) => setConsentGiven(e.target.checked)} className="mt-1"/>
          <label htmlFor= "consent" className="text-sm text-gray-300">
            I give my consent to process my personal data and documents for verification purposes.
          </label>
        </div>


        {(!isMobile || serviceKey !== 'all-services' || (isMobile && serviceKey === 'all-services' && allServicesStep === 2)) && (
          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting || !consentGiven}
              className="w-full sm:w-auto sm:min-w-[12rem] sm:px-8 py-3 bg-gradient-to-r from-emerald-500 to-cyan-600 text-white rounded-lg hover:from-emerald-600 hover:to-cyan-700 disabled:opacity-60 font-medium shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer text-center"
            >
              {submitting 
                ? (serviceKey === 'all-services' ? 'Submitting All Services...' : 'Submitting...') 
                : (serviceKey === 'all-services' ? 'Submit All Services' : 'Submit Request')
              }
            </button>
          </div>
        )}
      </form>
    </div>
  )
}

export default ServiceRequestForm


