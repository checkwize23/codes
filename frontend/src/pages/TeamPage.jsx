import React from 'react'
import { useLanguage } from '../context/LanguageContext'

const Member = ({ name, title, phone, email, bio }) => {
  const { t } = useLanguage();
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="group relative rounded-xl p-[1px] bg-gradient-to-b from-cyan-200 to-teal-200">
      <div className="h-full w-full rounded-xl bg-white p-6 shadow-sm transition-transform duration-200 group-hover:-translate-y-0.5">
        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-cyan-600 to-teal-500 text-white flex items-center justify-center text-lg font-semibold shadow mb-4">
          {initials}
        </div>
        <div className="text-center">
          <div className="font-semibold text-gray-900">{name}</div>
          <div className="text-xs text-cyan-700 font-medium mb-3">{title}</div>
        </div>
        <p className="text-sm text-gray-600 mb-4 text-left">
          {bio}
        </p>
        <div className="flex items-center justify-between text-sm">
          <a href={`tel:${phone}`} className="inline-flex items-center gap-2 rounded-md border border-cyan-200 bg-white px-3 py-1.5 text-cyan-700 font-medium hover:bg-cyan-50">
            <span>{t('call')}</span>
            <span className="text-gray-500">{phone}</span>
          </a>
          <span className="text-xs text-gray-400">{t('available')}</span>
        </div>

        <div className="mt-2">
          <a href={'mailto:${email}'} className="inline-flex items-center gap-2 rounded-md border border-teal-200 bg-white px-3 py-1.5 text-teal-700 font-medium hover:bg-teal-50">
            <span>{t('email')}</span>
            <span className="text-gray-500">{email}</span>
          </a>  
        </div>
      </div>
    </div>
  )
}

const TeamPage = () => {
  const { t } = useLanguage();
  const team = [
    {
      name: t('kumarJagannathName'),
      title: t('kumarJagannathTitle'),
      phone: '7996969355',
      email: 'kumar.jagannath@checkwize.com',
      bio: t('kumarJagannathBio')
    },
    {
      name: t('divyaMuruganName'),
      title: t('divyaMuruganTitle'),
      phone: '8105159428',
      email: 'divya.murugan@checkwize.com',
      bio: t('divyaMuruganBio')
    }
  ]
  return (
    <div className="relative overflow-x-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-cyan-300/30 blur-3xl"/>
        <div className="absolute top-1/2 -right-20 h-64 w-64 rounded-full bg-teal-200/30 blur-3xl"/>
      </div>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">{t('ourTeam')}</h1>
        <p className="text-sm md:text-base text-gray-600 mb-8 max-w-2xl">{t('peopleBehindMission')}</p>
        <div className="mb-8 rounded-2xl p-6 md:p-8 bg-gradient-to-r from-cyan-700 to-teal-600 text-white shadow">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="max-w-3xl">
              <h2 className="text-lg md:text-2xl font-semibold mb-1">{t('weBuildWithTrust')}</h2>
              <p className="text-sm md:text-base text-white/90">{t('teamBlendsStrategy')}</p>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex gap-3 justify-center md:justify-end">
                <a href="/contact" className="inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm md:text-base text-cyan-800 font-medium hover:bg-cyan-50">{t('workWithUs')}</a>
                <a href="/services" className="inline-flex items-center justify-center rounded-md border border-white/40 px-4 py-2 text-sm md:text-base text-white font-medium hover:bg-white/10">{t('seeWhatWeDo')}</a>
              </div>
             </div>
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 p-2">
          {team.map(m => <Member key={m.name} {...m} />)}
        </div>
      </div>
    </div>
  )
}

export default TeamPage


