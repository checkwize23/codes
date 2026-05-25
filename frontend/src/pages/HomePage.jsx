import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import ImageCarousel from '../../utils/ImageCarousel'
import { FiZap, FiShield, FiTrendingUp } from 'react-icons/fi'
import { FaHome, FaBriefcase, FaGraduationCap, FaIdCard } from 'react-icons/fa'



const Stat = ({ value, label }) => (
  <div className="p-3 sm:p-4 rounded-lg bg-white shadow-sm text-center">
    <div className="text-lg sm:text-xl md:text-2xl font-semibold text-cyan-700">{value}</div>
    <div className="text-xs text-gray-500">{label}</div>
  </div>
)


const HomePage = () => {
  const { t } = useLanguage();
  const [howItWorksRevealed, setHowItWorksRevealed] = useState(false)

  useEffect(() => {
    // Trigger reveal animation on mount after a small delay
    const timer = setTimeout(() => setHowItWorksRevealed(true), 150)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="overflow-x-hidden">
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-cyan-300/30 blur-3xl"/>
          <div className="absolute top-1/3 -right-20 h-72 w-72 rounded-full bg-teal-200/30 blur-3xl"/>
          <div className="absolute bottom-0 w-full h-40 bg-gradient-to-b from-transparent to-cyan-50"/>
        </div>

        {/* Additional soft background accents below the carousel */}
        <div aria-hidden className="pointer-events-none absolute left-0 right-0 -z-10">
          <div className="absolute -top-10 left-1/3 h-56 w-56 rounded-full bg-cyan-300/25 blur-3xl"/>
          <div className="absolute top-32 right-10 h-64 w-64 rounded-full bg-teal-200/25 blur-3xl"/>
          <div className="absolute top-[28rem] left-6 h-48 w-48 rounded-full bg-cyan-200/25 blur-3xl"/>
        </div>
                 <div className="bg-gradient-to-b from-cyan-50/60 to-white/80">
           <div className="container mx-auto px-4 py-16 sm:py-20 md:py-24 lg:py-28">
             {/* Mobile Layout - Single Column */}
             <div className="block md:hidden text-center">
               <h1 className="text-2xl sm:text-3xl font-bold leading-tight mb-4">{t('heroTitle')}</h1>
                <div className="mb-4 flex items-center justify-center gap-2 rounded-full border border-cyan-200/70 bg-white/70 px-3 py-2 shadow-sm backdrop-blur-sm text-xs">
                 <span className="inline-flex items-center align-middle font-medium text-cyan-800">{t('secure')}</span>
                 <span className="inline-block align-middle text-cyan-600 animate-pulse relative top-[1px]">•</span>
                 <span className="inline-flex items-center align-middle font-medium text-cyan-800">{t('compliant')}</span>
                 <span className="inline-block align-middle text-cyan-600 animate-pulse relative top-[1px][animation-delay:200ms]">•</span>
                 <span className="inline-flex items-center align-middle font-medium text-cyan-800">{t('verified')}</span>
               </div>
               <div className="rounded-xl border border-cyan-100/70 bg-white/70 p-4 backdrop-blur-sm mb-6">
                 <p className="text-sm leading-relaxed text-gray-800 mb-3">
                   {t('heroIntro1_p1')} <span className="font-semibold text-cyan-800">CheckWize</span> {t('heroIntro1_p2')} <span className="bg-cyan-50 text-cyan-900 px-1 py-0.5 rounded">{t('fast')}</span>, <span className="bg-cyan-50 text-cyan-900 px-1 py-0.5 rounded">{t('reliable')}</span> {t('heroIntro1_and')} <span className="bg-cyan-50 text-cyan-900 px-1 py-0.5 rounded">{t('compliant')}</span> {t('heroIntro1_tail')}
                 </p>
                 <p className="text-sm leading-relaxed text-gray-800">
                   {t('heroIntro2_p1')} <span className="bg-cyan-50 text-cyan-900 px-1 py-0.5 rounded">{t('precision')}</span>, <span className="bg-cyan-50 text-cyan-900 px-1 py-0.5 rounded">{t('transparency')}</span>, {t('heroIntro1_and')} <span className="bg-cyan-50 text-cyan-900 px-1 py-0.5 rounded">{t('care')}</span>{t('heroIntro2_tail')}
                 </p>
               </div>

               <div className="relative w-full flex flex-col items-center justify-center mb-10">

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-56 h-56 rounded-full bg-cyan-200/40 blur-2xl"></div>
                </div>
                <div className='relative z-10 w-64'>
                    <ImageCarousel />            
                </div>
               </div>
               <div className="flex flex-col gap-3">
                 <Link to="/signup" className="px-5 py-3 rounded-md bg-cyan-700 text-white font-medium hover:bg-cyan-800">{t('getVerified')}</Link>
                 <Link to="/services" className="px-5 py-3 rounded-md bg-white text-cyan-800 font-medium border border-cyan-200 hover:bg-cyan-50">{t('learnMore')}</Link>
               </div>
             </div>
             
             {/* Desktop Layout - Two Columns with Carousel */}
             <div className="hidden md:grid grid-cols-2 gap-10 items-center">
               <div>
                 <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-4">{t('heroTitle')}</h1>
                <div className="mb-5 flex items-center justify-center gap-2 rounded-full border border-cyan-200/70 bg-white/70 px-4 py-2 shadow-sm backdrop-blur-sm text-sm">
                   <span className="inline-flex items-center align-middle font-medium text-cyan-800">{t('secure')}</span>
                   <span className="inline-block align-middle text-cyan-600 animate-pulse relative top-[1px]">•</span>
                   <span className="inline-flex items-center align-middle font-medium text-cyan-800">{t('compliant')}</span>
                   <span className="inline-block align-middle text-cyan-600 animate-pulse relative top-[1px] [animation-delay:200ms]">•</span>
                   <span className="inline-flex items-center align-middle font-medium text-cyan-800">{t('verified')}</span>
                 </div>
                 <div className="rounded-xl border border-cyan-100/70 bg-white/70 p-5 backdrop-blur-sm">
                   <p className="text-[1.05rem] lg:text-[1.125rem] leading-relaxed text-gray-800 mb-3">
                     {t('heroIntro1_p1')} <span className="font-semibold text-cyan-800">CheckWize</span> {t('heroIntro1_p2')} <span className="bg-cyan-50 text-cyan-900 px-1 py-0.5 rounded">{t('fast')}</span>, <span className="bg-cyan-50 text-cyan-900 px-1 py-0.5 rounded">{t('reliable')}</span> {t('heroIntro1_and')} <span className="bg-cyan-50 text-cyan-900 px-1 py-0.5 rounded">{t('compliant')}</span> {t('heroIntro1_tail')}
                   </p>
                   <p className="text-[1.05rem] lg:text-[1.125rem] leading-relaxed text-gray-800">
                     {t('heroIntro2_p1')} <span className="bg-cyan-50 text-cyan-900 px-1 py-0.5 rounded">{t('precision')}</span>, <span className="bg-cyan-50 text-cyan-900 px-1 py-0.5 rounded">{t('transparency')}</span>, {t('heroIntro1_and')} <span className="bg-cyan-50 text-cyan-900 px-1 py-0.5 rounded">{t('care')}</span>{t('heroIntro2_tail')}
                   </p>
                 </div>
                 <div className="flex gap-3 flex-wrap mt-5">
                   <Link to="/signup" className="px-5 py-3 rounded-md bg-cyan-700 text-white font-medium hover:bg-cyan-800">{t('getVerified')}</Link>
                   <Link to="/services" className="px-5 py-3 rounded-md bg-white text-cyan-800 font-medium border border-cyan-200 hover:bg-cyan-50">{t('learnMore')}</Link>
                 </div>
               </div>
               <div>
                <div className="relative w-full h-72 sm:h-80 md:h-96 lg:h-[35rem] flex items-center justify-center">
                   <div aria-hidden className="absolute h-72 w-72 lg:h-72 lg:w-72 rounded-full bg-cyan-200/50 blur-2xl"/>
                   <div className="w-[32em] h-full">
                     <ImageCarousel />
                   </div>
                 </div>
               </div>
             </div>
           </div>
         </div>
      </section>

      {/* Background effects for sections below hero */}
      <div className="relative">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-cyan-200/30 blur-3xl"/>
          <div className="absolute top-1/3 -left-20 h-64 w-64 rounded-full bg-teal-200/30 blur-3xl"/>
          <div className="absolute bottom-0 right-1/4 h-48 w-48 rounded-full bg-cyan-300/20 blur-3xl"/>
        </div>

      <section className="container mx-auto px-4 py-8 sm:py-12">
        <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-2">
          <Stat value="99.9%" label={t('uptimeAvailability')} />
          <Stat value="ISO" label={t('securityCompliance')} />
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 sm:py-16">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-4 sm:mb-6 text-left">{t('whyChooseUs')}</h2>
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {[
            { title: t('fastReliable'), desc: t('fastReliableDesc'), Icon: FiZap },
            { title: t('compliantByDesign'), desc: t('compliantByDesignDesc'), Icon: FiShield },
            { title: t('scalesWithYou'), desc: t('scalesWithYouDesc'), Icon: FiTrendingUp }
          ].map((f) => (
            <div key={f.title} className="group relative rounded-xl p-[1px] bg-gradient-to-b from-cyan-200 to-teal-200">
              <div className="h-full w-full rounded-xl bg-white p-4 sm:p-6 shadow-sm transition-transform duration-200 group-hover:-translate-y-0.5">
                <div className="mb-3 inline-flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
                  <f.Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <h3 className="font-semibold mb-2 text-sm sm:text-base">{f.title}</h3>
                <p className="text-xs sm:text-sm text-gray-600">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Services teaser - upgraded UI */}
      <section className="container mx-auto px-4 py-12">
        <div className="rounded-2xl p-6 md:p-8 bg-gradient-to-br from-cyan-50 to-teal-50 border border-cyan-100 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900">{t('verificationServices')}</h2>
            <div className="flex gap-3">
              <Link to="/services" className="px-4 py-2 rounded-md bg-white text-cyan-800 font-medium border border-cyan-200 hover:bg-cyan-50">{t('ourServices')}</Link>
              <Link to="/dashboard" className="px-4 py-2 rounded-md bg-gradient-to-r from-cyan-700 to-teal-600 text-white font-medium hover:from-cyan-800 hover:to-teal-700">{t('applyNow')}</Link>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { icon: FaHome, title: t('addressVerification'), desc: t('addressVerificationDesc') },
              { icon: FaBriefcase, title: t('employmentVerification'), desc: t('employmentVerificationDesc') },
              { icon: FaGraduationCap, title: t('educationVerification'), desc: t('educationVerificationDesc') },
              { icon: FaIdCard, title: t('idVerification'), desc: t('idVerificationDesc') },
            ].map((s) => {
              const Icon = s.icon
              return (
                <div key={s.title} className="group relative rounded-xl p-[1px] bg-gradient-to-b from-cyan-200 to-teal-200">
                  <div className="h-full w-full rounded-xl bg-white p-5 shadow-sm transition-transform duration-200 group-hover:-translate-y-0.5">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-600 to-teal-500 text-white flex items-center justify-center shrink-0 leading-none mt-0.5 md:mt-1">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{s.title}</h3>
                        <p className="text-sm text-gray-600">{s.desc}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <h2 className="text-xl md:text-3xl font-semibold mb-6">{t('howItWorks')}</h2>
        <div className="relative grid gap-6 md:grid-cols-3">
          {/* Animated connector with arrow (desktop and up) */}
          <div className="pointer-events-none absolute left-0 right-0 top-12 hidden md:block">
            <svg viewBox="0 0 100 4" preserveAspectRatio="none" className="w-full h-3">
              <defs>
                <linearGradient id="stepLine" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#bae6fd" />
                  <stop offset="50%" stopColor="#99f6e4" />
                  <stop offset="100%" stopColor="#bae6fd" />
                </linearGradient>
              </defs>
              <path d="M0 2 H100" stroke="url(#stepLine)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
              {/* Moving arrow */}
              <g>
                <polygon points="0,2 3,0.8 3,3.2" fill="#0e7490">
                  <animateMotion dur="4s" repeatCount="indefinite" keyTimes="0;1" keySplines="0.42 0 0.58 1" calcMode="spline">
                    <mpath xlinkHref="#stepPath" />
                  </animateMotion>
                </polygon>
              </g>
              {/* Hidden path reference for motion */}
              <path id="stepPath" d="M0 2 H100" fill="none" />
            </svg>
          </div>
          {[
            { step: t('initiate'), desc: t('initiateDesc') },
            { step: t('verify'), desc: t('verifyDesc') },
            { step: t('decide'), desc: t('decideDesc') }
          ].map((i, idx) => (
            <div
              key={i.step}
              className={`relative rounded-xl p-6 pl-2 shadow-sm bg-white border border-cyan-100/70 ${
                // Disable entrance animation on small screens
                'md:transition-all md:duration-700 md:ease-out md:hover:-translate-y-1 md:hover:shadow-md'
              } ${howItWorksRevealed ? 'md:opacity-100 md:translate-y-0' : 'md:opacity-0 md:translate-y-4'}`}
              style={{ transitionDelay: `${idx * 150}ms` }}
            >
              {/* Step badge */}
              <div className="absolute -top-5 left-6 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white ring-2 ring-cyan-200 text-cyan-700 text-sm font-semibold shadow">
                {idx + 1}
              </div>
              {/* Decorative top border (mobile only) */}
              <div className="md:hidden absolute top-6 left-12 right-6 h-0.5 bg-gradient-to-r from-cyan-200 via-teal-200 to-cyan-200 overflow-hidden rounded-full">
                <span className="block h-full w-12 bg-cyan-700/40 animate-pulse"></span>
              </div>
              <h3 className="mt-2 font-semibold mb-2 text-cyan-900">{i.step}</h3>
              <p className="text-sm text-gray-600">{i.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative">
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-cyan-50 to-white"/>
        <div className="container mx-auto px-4 py-16">
          <div className="rounded-2xl p-8 md:p-10 bg-gradient-to-r from-cyan-700 to-teal-600 text-white shadow-lg">
            <h3 className="text-lg md:text-2xl font-semibold mb-2 text-center md:text-left">{t('buildSaferWorkplaces')}</h3>
            <p className="text-sm md:text-base text-white/90 mb-6 text-center md:text-left">{t('oneVerifiedProfile')}</p>
            <div className="flex gap-3 flex-wrap justify-center md:justify-start">
              <Link to="/signup" className="px-5 py-3 rounded-md bg-white text-cyan-800 font-medium hover:bg-cyan-50">{t('getStarted')}</Link>
              <Link to="/contact" className="px-5 py-3 rounded-md border border-white/40 text-white font-medium hover:bg-white/10">{t('talkToUs')}</Link>
            </div>
          </div>
        </div>
      </section>

      </div>{/* end background effects wrapper */}
    </div>
  )
}

export default HomePage


