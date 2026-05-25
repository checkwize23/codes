import React from 'react'
import { useLanguage } from '../context/LanguageContext'

const TermsPage = () => {
  const { t } = useLanguage();
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">{t('termsTitle')}</h1>
      <div className="space-y-6 text-gray-700 max-w-4xl">
        <section>
          <h2 className="text-xl font-semibold mb-3 text-gray-900">{t('termsAcceptanceTitle')}</h2>
          <p>{t('termsAcceptanceBody')}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-gray-900">{t('termsUseLicenseTitle')}</h2>
          <p>{t('termsUseLicenseBody')}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-gray-900">{t('termsUserResponsibilitiesTitle')}</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>{t('termsUserResponsibilities1')}</li>
            <li>{t('termsUserResponsibilities2')}</li>
            <li>{t('termsUserResponsibilities3')}</li>
            <li>{t('termsUserResponsibilities4')}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-gray-900">{t('termsPrivacyClauseTitle')}</h2>
          <p>{t('termsPrivacyClauseBody')}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-gray-900">{t('termsAvailabilityTitle')}</h2>
          <p>{t('termsAvailabilityBody')}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-gray-900">{t('termsLiabilityTitle')}</h2>
          <p>{t('termsLiabilityBody')}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-gray-900">{t('termsContactTitle')}</h2>
          <p>{t('termsContactBody')}</p>
        </section>
      </div>
    </div>
  )
}

export default TermsPage
