import React from 'react'
import { useLanguage } from '../context/LanguageContext'

const PrivacyPage = () => {
  const { t } = useLanguage();
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-4">{t('privacyTitle')}</h1>
      <div className="space-y-4 text-gray-700">
        <p>{t('privacyIntro')}</p>

        <h2 className='text-xl font-semibold'>{t('privacyHeading1')}</h2>
        <p>{t('privacyContent1')}</p>
        
        <h2 className='text-xl font-semibold'>{t('privacyHeading2')}</h2>
        <p>{t('privacyContent2')}</p>

        <h2 className='text-xl font-semibold'>{t('privacyHeading3')}</h2>
        <p>{t('privacyContent3')}</p>
        
        <p>{t('privacyContact')}</p>
      </div>
    </div>
  )
}

export default PrivacyPage


