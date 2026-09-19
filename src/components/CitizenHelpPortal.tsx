import React, { useState } from 'react';
import { FileCheck2, HelpCircle, Phone, Search, Send, Volume2 } from 'lucide-react';

const translations = {
  English: {
    title: 'Citizen Help Portal',
    subtitle: 'Track applications, understand benefits, and find the documents needed for your land acquisition case.',
    search: 'Search FAQs and benefits',
    documents: 'Required Documents',
    benefits: 'Government Benefits',
    tracking: 'Application Tracking',
    support: 'Support Request',
  },
  Hindi: {
    title: 'नागरिक सहायता पोर्टल',
    subtitle: 'अपने आवेदन की स्थिति, लाभ और आवश्यक दस्तावेज़ देखें।',
    search: 'प्रश्न और लाभ खोजें',
    documents: 'आवश्यक दस्तावेज़',
    benefits: 'सरकारी लाभ',
    tracking: 'आवेदन की स्थिति',
    support: 'सहायता अनुरोध',
  },
  Marathi: {
    title: 'नागरिक सहाय्य पोर्टल',
    subtitle: 'तुमच्या अर्जाची स्थिती, लाभ आणि आवश्यक कागदपत्रे पहा.',
    search: 'प्रश्न आणि लाभ शोधा',
    documents: 'आवश्यक कागदपत्रे',
    benefits: 'सरकारी लाभ',
    tracking: 'अर्जाची स्थिती',
    support: 'मदत विनंती',
  },
} as const;

type Language = keyof typeof translations;

export const CitizenHelpPortal: React.FC = () => {
  const [language, setLanguage] = useState<Language>('English');
  const [query, setQuery] = useState('');
  const copy = translations[language];

  const speak = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(copy.subtitle));
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">{copy.title}</h2>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">{copy.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={language} onChange={(event) => setLanguage(event.target.value as Language)} className="border border-slate-300 rounded px-3 py-2 text-xs font-semibold bg-white">
            <option>English</option>
            <option>Hindi</option>
            <option>Marathi</option>
          </select>
          <button onClick={speak} className="p-2 border border-slate-300 rounded bg-white" title="Read this section aloud" aria-label="Read this section aloud">
            <Volume2 className="w-4 h-4 text-slate-700" />
          </button>
        </div>
      </div>

      <label className="flex items-center gap-2 border border-slate-300 bg-white rounded px-3 py-2">
        <Search className="w-4 h-4 text-slate-500" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.search} className="flex-1 text-sm outline-none" />
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          [FileCheck2, copy.documents, 'Identity proof, award notice, land record, bank details, and rehabilitation documents.'],
          [HelpCircle, copy.benefits, 'Review compensation, rehabilitation, resettlement, and grievance support information.'],
          [Search, copy.tracking, 'Enter your project or application reference to view the latest recorded status.'],
          [Send, copy.support, 'Submit a question to the responsible district land acquisition office.'],
        ].map(([Icon, title, text]) => (
          <section key={String(title)} className="border border-slate-200 bg-white rounded-lg p-5 shadow-sm">
            <Icon className="w-5 h-5 text-emerald-700" />
            <h3 className="font-bold text-slate-900 mt-3">{title}</h3>
            <p className="text-xs text-slate-600 mt-1">{query ? `${text} Search term: ${query}` : text}</p>
            <button className="mt-4 text-xs font-bold text-emerald-800">Open section</button>
          </section>
        ))}
      </div>

      <div className="border border-slate-200 bg-slate-50 rounded-lg p-4 flex items-center gap-3 text-xs text-slate-700">
        <Phone className="w-4 h-4 text-emerald-700" />
        <span>For urgent case support, contact your district Competent Authority for Land Acquisition.</span>
      </div>
    </div>
  );
};
