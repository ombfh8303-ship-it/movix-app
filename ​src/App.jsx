import React, { useState } from 'react';
import { Play, Globe, Film, Tv, TrendingUp } from 'lucide-react';

export default function App() {
  const [lang, setLang] = useState('ar');

  const toggleLanguage = () => {
    setLang(prev => (prev === 'ar' ? 'en' : 'ar'));
  };

  const isAr = lang === 'ar';

  return (
    <div className={`min-h-screen bg-[#08080a] text-white ${isAr ? 'rtl' : 'ltr'}`} dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-amber-500/20 bg-[#0d0d12]">
        <h1 className="text-2xl font-black tracking-wider text-amber-500">MOVIX</h1>
        <button 
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 text-sm font-medium"
        >
          <Globe className="w-4 h-4" />
          {isAr ? 'English' : 'العربية'}
        </button>
      </header>

      {/* Hero Banner */}
      <main className="p-6 max-w-5xl mx-auto space-y-8">
        <section className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-amber-900/40 to-slate-900 p-8 border border-amber-500/30">
          <span className="inline-block px-3 py-1 bg-amber-500 text-black text-xs font-bold rounded-full mb-3">
            {isAr ? 'حصرى' : 'EXCLUSIVE'}
          </span>
          <h2 className="text-3xl font-bold mb-2">
            {isAr ? 'عالم الترفيه بين يديك' : 'Unlimited Movies & Series'}
          </h2>
          <p className="text-gray-400 text-sm max-w-md mb-6">
            {isAr 
              ? 'استمتع بمشاهدة أحدث الأفلام والمسلسلات بجودة عالية وتجربة سلسة.' 
              : 'Watch the latest movies and TV shows in high quality with a seamless experience.'}
          </p>
          <button className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl transition-all">
            <Play className="w-5 h-5 fill-current" />
            {isAr ? 'شاهد الآن' : 'Watch Now'}
          </button>
        </section>

        {/* Quick Navigation */}
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { icon: Film, labelAr: 'الأفلام', labelEn: 'Movies' },
            { icon: Tv, labelAr: 'المسلسلات', labelEn: 'Series' },
            { icon: TrendingUp, labelAr: 'الأكثر شهرة', labelEn: 'Trending' }
          ].map((item, idx) => (
            <div key={idx} className="p-4 bg-[#12121a] rounded-xl border border-gray-800 flex flex-col items-center justify-center gap-2 text-amber-400">
              <item.icon className="w-6 h-6" />
              <span className="text-xs font-bold text-gray-200">{isAr ? item.labelAr : item.labelEn}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
