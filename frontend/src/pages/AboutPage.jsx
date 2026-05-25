import React from 'react'
import { useLanguage } from '../context/LanguageContext'
import { FaBullseye, FaEye, FaStar, FaRocket, FaLock, FaMobileAlt } from 'react-icons/fa'
import { Helmet } from "react-helmet-async"
const AboutPage = () => {
  const { t } = useLanguage();
  return (
   <>
    <Helmet>
        <title> About CheckWize | Background Verification Platform </title>
        <meta name="description" content="Learn about CheckWize, a startup building background verification solutions for businesses." />
      </Helmet>
    
    <div className="relative overflow-x-hidden">
      {/* Background blur effects matching Team page */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-cyan-300/30 blur-3xl"/>
        <div className="absolute top-1/2 -right-20 h-64 w-64 rounded-full bg-teal-200/30 blur-3xl"/>
        <div className="absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-cyan-200/20 blur-3xl"/>
      </div>
      
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">{t('aboutTitle')}</h1>
        <p className="text-sm md:text-base text-gray-600 mb-8 max-w-4xl">
          {t('aboutDescription')}
        </p>

        {/* Hero section with gradient background */}
        <div className="mb-8 rounded-2xl p-6 md:p-8 bg-gradient-to-r from-cyan-700 to-teal-600 text-white shadow">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="max-w-3xl">
              <h2 className="text-lg md:text-2xl font-semibold mb-1">{t('buildingTrustThroughInnovation')}</h2>
              <p className="text-sm md:text-base text-white/90">
                {t('buildingTrustDescription')}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex gap-3 justify-center md:justify-end">
                <a href="/contact" className="inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-cyan-800 font-medium hover:bg-cyan-50 transition-colors">
                  {t('getStarted')}
                </a>
                <a href="/services" className="inline-flex items-center justify-center rounded-md border border-white/40 px-4 py-2 text-white font-medium hover:bg-white/10 transition-colors">
                  {t('ourServices')}
                </a>
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

        {/* Mission, Vision, Values cards with enhanced styling */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <div className="group relative rounded-xl p-[1px] bg-gradient-to-b from-cyan-200 to-teal-200">
            <div className="h-full w-full rounded-xl bg-white p-6 shadow-sm transition-transform duration-200 group-hover:-translate-y-0.5">
              <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-cyan-600 to-teal-500 text-white flex items-center justify-center shadow mb-4">
                <FaBullseye className="w-7 h-7" />
              </div>
              <h3 className="font-semibold text-gray-900 text-center mb-3">{t('mission')}</h3>
              <p className="text-sm text-gray-600 text-center">
                {t('missionDescription')}
              </p>
            </div>
          </div>
          
          <div className="group relative rounded-xl p-[1px] bg-gradient-to-b from-cyan-200 to-teal-200">
            <div className="h-full w-full rounded-xl bg-white p-6 shadow-sm transition-transform duration-200 group-hover:-translate-y-0.5">
              <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-cyan-600 to-teal-500 text-white flex items-center justify-center shadow mb-4">
                <FaEye className="w-7 h-7" />
              </div>
              <h3 className="font-semibold text-gray-900 text-center mb-3">{t('vision')}</h3>
              <p className="text-sm text-gray-600 text-center">
                {t('visionDescription')}
              </p>
            </div>
          </div>
          
          <div className="group relative rounded-xl p-[1px] bg-gradient-to-b from-cyan-200 to-teal-200">
            <div className="h-full w-full rounded-xl bg-white p-6 shadow-sm transition-transform duration-200 group-hover:-translate-y-0.5">
              <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-cyan-600 to-teal-500 text-white flex items-center justify-center shadow mb-4">
                <FaStar className="w-7 h-7" />
              </div>
              <h3 className="font-semibold text-gray-900 text-center mb-3">{t('values')}</h3>
              <p className="text-sm text-gray-600 text-center">
                {t('valuesDescription')}
              </p>
            </div>
          </div>
        </div>

        {/* Additional company info section */}
        <div className="rounded-2xl p-6 md:p-8 bg-gradient-to-br from-cyan-50 to-teal-50 border border-cyan-100">
          <h2 className="text-xl md:text-2xl font-semibold mb-4 text-gray-800">{t('Why Choose CheckWize')}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-cyan-600 text-white flex items-center justify-center flex-shrink-0">
                <FaRocket className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">{t('fastEfficient')}</h4>
                <p className="text-sm text-gray-600">{t('fastEfficientDesc')}</p>
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
                <FaMobileAlt className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">{t('mobileFirst')}</h4>
                <p className="text-sm text-gray-600">{t('mobileFirstDesc')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-teal-600 text-white flex items-center justify-center flex-shrink-0">
                <FaBullseye className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">{t('scalableSolution')}</h4>
                <p className="text-sm text-gray-600">{t('scalableSolutionDesc')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </> 
  )
}

export default AboutPage
