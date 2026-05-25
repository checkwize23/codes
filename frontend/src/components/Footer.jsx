import React from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'

const Footer = () => {
  const { t } = useLanguage();
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-6 sm:py-10 grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <div className="text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-3">
            <div />
            <img src="./hire_logo.png" className='w-16 h-16 sm:w-20 sm:h-20' alt="hire shield logo" />
            <span className="font-semibold text-white text-lg sm:text-xl">CheckWize</span>
          </div>
          <p className="text-xs sm:text-sm">Reliable background verification services to help you trust with confidence.</p>
        </div>
        <div className="text-center sm:text-left">
          <h4 className="text-white font-semibold mb-3 text-base sm:text-lg">Quick Links</h4>
          <ul className="space-y-2 text-xs sm:text-sm">
            <li><Link to="/services" className="hover:text-white">{t('services')}</Link></li>
            <li><Link to="/about" className="hover:text-white">{t('about')}</Link></li>
            <li><Link to="/privacy" className="hover:text-white">{t('privacyPolicy')}</Link></li>
            <li><Link to="/contact" className="hover:text-white">{t('contact')}</Link></li>
          </ul>
        </div>
        <div className="text-center sm:text-left">
          <h4 className="text-white font-semibold mb-3 text-base sm:text-lg">{t('contact')}</h4>
          <p className="text-xs sm:text-sm">Phone: +91 </p>
          <p className="text-xs sm:text-sm">Email: contact@checkwize.com</p>
          <p className="text-xs sm:text-sm">Address: Business Synergy Center, #1, 5th Floor, 5th Main, 5th Block, Jayanagar, Bengaluru - 560041</p>
        </div>
      </div>
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-3 sm:py-4 text-xs text-gray-500 text-center">© {new Date().getFullYear()} CheckWize. {t('allRightsReserved')}</div>
      </div>
    </footer>
  )
}

export default Footer


