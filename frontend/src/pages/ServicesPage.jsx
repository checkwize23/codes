import React from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { FaHome, FaBriefcase, FaGraduationCap, FaFileAlt, FaIdCard, FaBalanceScale, FaVial, FaBolt, FaLock, FaChartBar, FaBullseye, FaCertificate, FaUserCheck, FaShieldAlt, FaUsers } from 'react-icons/fa'

const getCategoryCards = (t) => [
  {
    title: t('addressVerification'),
    description: t('addressVerificationDesc'),
    items: ['Aadhaar card', 'Passport', 'Rental agreement'],
    icon: FaHome,
  },
  {
    title: t('employmentVerification'),
    description: t('employmentVerificationDesc'),
    items: ['Payslips (3 months)', 'Appointment letter', 'Relieving letter'],
    icon: FaBriefcase,
  },
  {
    title: t('educationVerification'),
    description: t('educationVerificationDesc'),
    items: ['Degree/Engineering/etc.', 'Education certificates', '10th marks sheet'],
    icon: FaGraduationCap,
  },
  {
    title: t('cvValidation'),
    description: t('cvValidationDesc'),
    items: ['Detailed CV'],
    icon: FaFileAlt,
  },
  {
    title: t('idVerification'),
    description: t('idVerificationDesc'),
    items: ['Govt ID', 'Voter ID', 'Aadhaar', 'Passport', '10th marks card'],
    icon: FaIdCard,
  },
  {
    title: t('courtVerification'),
    description: t('courtVerificationDesc'),
    items: ['PAN Card', '10th marks sheet'],
    icon: FaBalanceScale,
  },
  {
    title: t('drugTest'),
    description: t('drugTestDesc'),
    items: ['Diagnostic centre request/report'],
    icon: FaVial,
  },
  {
    title: t('complianceConsulting'),
    description: t('complianceConsultingDesc'),
    items: ['ISO 27001', 'ISO 9001', 'ISO 22301', 'SOC 2 Type 2', 'GDPR assessments'],
    icon: FaShieldAlt,
  },
  {
    title: t('vendorAssessment'),
    description: t('vendorAssessmentDesc'),
    items: ['3rd party risk analysis', 'Vendor security evaluation'],
    icon: FaUsers,
  },
]

const ServiceCard = ({ title, description, items, icon, t }) => (
  <div className="group relative rounded-xl p-[1px] bg-gradient-to-b from-cyan-200 to-teal-200">
    <div className="h-full w-full rounded-xl bg-white p-6 shadow-sm transition-transform duration-200 group-hover:-translate-y-0.5">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-600 to-teal-500 text-white flex items-center justify-center shadow">
            {typeof icon === 'string' ? icon : React.createElement(icon, { className: 'w-6 h-6' })}
          </div>
          <h3 className="font-semibold text-gray-900 text-lg">{title}</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">{description}</p>
        {items?.length ? (
          <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1 mb-4">
            {items.map((i) => <li key={i}>{i}</li>)}
          </ul>
        ) : null}
      </div>
      <div className="pt-4">
        <Link 
          to="/dashboard" 
          className="inline-flex items-center justify-center w-full px-4 py-2 bg-gradient-to-r from-cyan-600 to-teal-500 text-white rounded-lg hover:from-cyan-700 hover:to-teal-600 transition-all duration-200 font-medium shadow-sm"
        >
          {t('applyNow')}
        </Link>
      </div>
    </div>
  </div>
)

const ServicesPage = () => {
  const { t } = useLanguage();
  const categoryCards = getCategoryCards(t);
  
  return (
    <div className="relative overflow-x-hidden">
      {/* Background blur effects matching About and Team pages */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-cyan-300/30 blur-3xl"/>
        <div className="absolute top-1/2 -right-20 h-64 w-64 rounded-full bg-teal-200/30 blur-3xl"/>
        <div className="absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-cyan-200/20 blur-3xl"/>
      </div>
      
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">{t('verificationServices')}</h1>
        <p className="text-sm md:text-base text-gray-600 mb-8 max-w-4xl">
          {t('servicesDescription')}
        </p>

        {/* Hero section with gradient background */}
        <div className="mb-8 rounded-2xl p-6 md:p-8 bg-gradient-to-r from-cyan-700 to-teal-600 text-white shadow">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="max-w-3xl">
              <h2 className="text-lg md:text-2xl font-semibold mb-1">{t('comprehensiveVerificationSolutions')}</h2>
              <p className="text-sm md:text-base text-white/90">
                {t('servicesHeroDescription')}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex gap-3 justify-center md:justify-end">
                <Link to="/dashboard" className="inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-cyan-800 font-medium hover:bg-cyan-50 transition-colors">
                  {t('goToDashboard')}
                </Link>
                <Link to="/contact" className="inline-flex items-center justify-center rounded-md border border-white/40 px-4 py-2 text-white font-medium hover:bg-white/10 transition-colors">
                  {t('contactUs')}
                </Link>
              </div>
              <div className="flex justify-center md:justify-end">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse"></span>
                  {t('trustedByCompanies')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categoryCards.map((service) => (
            <ServiceCard key={service.title} {...service} t={t} />
          ))}
        </div>

        {/* Additional info section */}
        <div className="mt-12 rounded-2xl p-6 md:p-8 bg-gradient-to-br from-cyan-50 to-teal-50 border border-cyan-100">
          <h2 className="text-xl md:text-2xl font-semibold mb-4 text-gray-800">{t('whyChooseOurVerificationServices')}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-cyan-600 text-white flex items-center justify-center flex-shrink-0">
                <FaBolt className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">{t('fastProcessing')}</h4>
                <p className="text-sm text-gray-600">{t('fastProcessingDesc')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-teal-600 text-white flex items-center justify-center flex-shrink-0">
                <FaLock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">{t('secureCompliant')}</h4>
                <p className="text-sm text-gray-600">{t('secureCompliantDesc')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-cyan-600 text-white flex items-center justify-center flex-shrink-0">
                <FaChartBar className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">{t('detailedReports')}</h4>
                <p className="text-sm text-gray-600">{t('detailedReportsDesc')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-teal-600 text-white flex items-center justify-center flex-shrink-0">
                <FaBullseye className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">{t('customizedSolutions')}</h4>
                <p className="text-sm text-gray-600">{t('customizedSolutionsDesc')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ServicesPage


