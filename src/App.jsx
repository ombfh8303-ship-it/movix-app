import React, { useState, useEffect } from 'react';
import {
  fetchTrending,
  searchMedia,
  fetchDetails,
  fetchGenres,
  fetchByGenre,
  IMAGE_BASE_URL,
  BACKDROP_BASE_URL
} from './services/tmdb';

export default function App() {
  const [items, setItems] = useState([]);
  const [contentType, setContentType] = useState('movie'); // 'movie' or 'tv'
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState('ar-SA');

  // التصنيفات ونافذة الفلترة
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [tempGenre, setTempGenre] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);

  // التفاصيل
  const [selectedItem, setSelectedItem] = useState(null);
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // جلب التصنيفات
  useEffect(() => {
    const getGenresList = async () => {
      const list = await fetchGenres(contentType, lang);
      setGenres(list);
    };
    getGenresList();
  }, [contentType, lang]);

  // جلب البيانات الرئيسية
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      let data;

      if (searchQuery.trim()) {
        data = await searchMedia(searchQuery, contentType, page, lang);
      } else if (selectedGenre) {
        data = await fetchByGenre(contentType, selectedGenre, page, lang);
      } else {
        data = await fetchTrending(contentType, page, lang);
      }

      setItems(data.results || []);
      setTotalPages(data.total_pages || 1);
      setLoading(false);
    };
    loadData();
  }, [contentType, page, searchQuery, selectedGenre, lang]);

  // جلب تفاصيل الفيلم/المسلسل
  useEffect(() => {
    if (!selectedItem) {
      setDetails(null);
      return;
    }
    const getDetails = async () => {
      setDetailsLoading(true);
      const data = await fetchDetails(contentType, selectedItem.id, lang);
      setDetails(data);
      setDetailsLoading(false);
    };
    getDetails();
  }, [selectedItem, contentType, lang]);

  const handleApplyFilter = () => {
    setSelectedGenre(tempGenre);
    setSearchQuery('');
    setPage(1);
    setShowFilterModal(false);
  };

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'ar-SA' ? 'en-US' : 'ar-SA'));
  };

  const featuredItem = items.length > 0 ? items[0] : null;
  const trailer = details?.videos?.results?.find(
    (vid) => vid.site === 'YouTube' && (vid.type === 'Trailer' || vid.type === 'Teaser')
  );

  return (
    <div className="min-h-screen bg-black text-slate-100 font-sans antialiased pb-28 selection:bg-amber-500 selection:text-black" dir={lang === 'ar-SA' ? 'rtl' : 'ltr'}>
      
      {/* 1. Header علوي أنيق بأسلوب الموبايل */}
      <header className="px-5 py-4 flex items-center justify-between sticky top-0 z-30 bg-black/90 backdrop-blur-md border-b border-amber-900/20">
        <div className="w-10 h-10 rounded-full bg-amber-200/20 border border-amber-400/30 flex items-center justify-center text-amber-300 font-bold">
          👤
        </div>
        <div className="text-center">
          <h1 className="text-lg font-black tracking-wider text-amber-200">
            موڤيكس
          </h1>
        </div>
        <button
          onClick={toggleLanguage}
          className="text-amber-200 bg-amber-950/40 border border-amber-500/30 px-3 py-1.5 rounded-full text-xs font-semibold"
        >
          {lang === 'ar-SA' ? 'EN' : 'عربي'}
        </button>
      </header>

      <main className="px-4 max-w-md md:max-w-4xl mx-auto space-y-6 pt-2">

        {/* 2. البانر الرئيسي الأكثر تداولاً بتصميم الـ Curved Hero البارز */}
        {!searchQuery && !selectedGenre && page === 1 && featuredItem && (
          <div className="relative rounded-3xl overflow-hidden bg-zinc-900 border border-amber-500/30 shadow-2xl shadow-amber-900/10">
            <div className="relative h-64 md:h-80 w-full">
              <img
                src={`${BACKDROP_BASE_URL}${featuredItem.backdrop_path || featuredItem.poster_path}`}
                alt={featuredItem.title || featuredItem.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              
              {/* زر التشغيل الخشي/الدافئ المميز */}
              <button 
                onClick={() => setSelectedItem(featuredItem)}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-2xl bg-amber-200/90 text-black flex items-center justify-center text-xl font-bold shadow-xl hover:scale-105 transition border border-amber-300"
              >
                ▶
              </button>

              <div className="absolute bottom-4 inset-x-0 text-center px-4 space-y-1">
                <span className="text-[11px] font-bold tracking-widest text-amber-300 uppercase bg-black/60 px-3 py-1 rounded-full border border-amber-500/30 backdrop-blur-md">
                  🔥 {lang === 'ar-SA' ? 'الأكثر تداولاً هذا الأسبوع' : 'Trending This Week'}
                </span>
                <h2 className="text-xl md:text-2xl font-black text-white truncate drop-shadow-md">
                  {featuredItem.title || featuredItem.name}
                </h2>
              </div>
            </div>
          </div>
        )}

        {/* 3. شريط البحث والفرز */}
        <div className="space-y-3">
          <div className="relative">
            <input
              type="text"
              placeholder={lang === 'ar-SA' ? 'ابحث عن فيلم أو مسلسل...' : 'Search movies, tv...'}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedGenre('');
                setPage(1);
              }}
              className="w-full bg-zinc-900/90 text-amber-100 placeholder-zinc-500 border border-amber-500/20 px-5 py-3.5 pr-11 rounded-2xl focus:outline-none focus:border-amber-400 text-sm shadow-inner"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">🔍</span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <h3 className="text-base font-extrabold text-amber-100">
              {searchQuery
                ? (lang === 'ar-SA' ? 'نتائج البحث' : 'Search Results')
                : selectedGenre
                ? genres.find((g) => g.id === Number(selectedGenre))?.name || (lang === 'ar-SA' ? 'الأفلام' : 'Movies')
                : contentType === 'movie'
                ? (lang === 'ar-SA' ? 'الأفلام الشائعة' : 'Popular Movies')
                : (lang === 'ar-SA' ? 'المسلسلات الشائعة' : 'Popular TV Series')}
            </h3>

            {/* زر فتح نافذة الفلترة المبتكرة */}
            <button
              onClick={() => {
                setTempGenre(selectedGenre);
                setShowFilterModal(true);
              }}
              className="flex items-center gap-1.5 bg-zinc-900 text-amber-200 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-zinc-800 transition"
            >
              <span>⚙️</span>
              <span>{lang === 'ar-SA' ? 'التصنيف' : 'Filter'}</span>
            </button>
          </div>
        </div>

        {/* 4. شبكة عرض البطاقات ذات الحواف الدافئة Curved Glass */}
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-amber-300 border-t-transparent"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="group relative cursor-pointer rounded-2xl overflow-hidden bg-zinc-900 border border-amber-500/20 hover:border-amber-400/60 transition duration-300 shadow-lg"
              >
                <div className="aspect-[2/3] w-full overflow-hidden relative">
                  {item.poster_path ? (
                    <img
                      src={`${IMAGE_BASE_URL}${item.poster_path}`}
                      alt={item.title || item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">
                      No Poster
                    </div>
                  )}

                  {/* شارة التقييم الدافئة */}
                  <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-lg text-[10px] font-black">
                    ★ {item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                  <div className="absolute bottom-2 inset-x-2 text-center">
                    <p className="text-xs font-bold text-white truncate drop-shadow">
                      {item.title || item.name}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* الترقيم */}
        <div className="flex justify-center items-center gap-4 pt-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            className="px-4 py-2 bg-zinc-900 border border-amber-500/20 rounded-xl text-xs font-bold text-amber-200 disabled:opacity-30"
          >
            {lang === 'ar-SA' ? 'السابق' : 'Prev'}
          </button>
          <span className="text-xs font-bold text-zinc-400">
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 bg-zinc-900 border border-amber-500/20 rounded-xl text-xs font-bold text-amber-200 disabled:opacity-30"
          >
            {lang === 'ar-SA' ? 'التالي' : 'Next'}
          </button>
        </div>
      </main>

      {/* 5. Bottom Navigation Bar شريط التنقل السفلي الفاخر */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-t border-amber-900/30 px-4 py-2.5 max-w-md md:max-w-4xl mx-auto flex items-center justify-around">
        <button
          onClick={() => {
            setSelectedGenre('');
            setSearchQuery('');
            setContentType('movie');
            setPage(1);
          }}
          className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-2xl transition ${
            contentType === 'movie' && !selectedGenre
              ? 'bg-amber-200 text-black font-bold shadow-md shadow-amber-400/20'
              : 'text-zinc-400 hover:text-amber-200'
          }`}
        >
          <span className="text-base">🏠</span>
          <span className="text-[10px]">{lang === 'ar-SA' ? 'الرئيسية' : 'Home'}</span>
        </button>

        <button
          onClick={() => {
            setContentType('movie');
            setSelectedGenre('');
            setPage(1);
          }}
          className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-2xl transition ${
            contentType === 'movie' && selectedGenre === ''
              ? 'text-amber-300 font-bold'
              : 'text-zinc-400 hover:text-amber-200'
          }`}
        >
          <span className="text-base">🎬</span>
          <span className="text-[10px]">{lang === 'ar-SA' ? 'الأفلام' : 'Movies'}</span>
        </button>

        <button
          onClick={() => {
            setContentType('tv');
            setSelectedGenre('');
            setPage(1);
          }}
          className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-2xl transition ${
            contentType === 'tv'
              ? 'bg-amber-200 text-black font-bold shadow-md shadow-amber-400/20'
              : 'text-zinc-400 hover:text-amber-200'
          }`}
        >
          <span className="text-base">📺</span>
          <span className="text-[10px]">{lang === 'ar-SA' ? 'المسلسلات' : 'TV Series'}</span>
        </button>

        <button
          onClick={() => setShowFilterModal(true)}
          className="flex flex-col items-center gap-1 px-4 py-1.5 rounded-2xl text-zinc-400 hover:text-amber-200 transition"
        >
          <span className="text-base">🎛️</span>
          <span className="text-[10px]">{lang === 'ar-SA' ? 'التصنيفات' : 'Genres'}</span>
        </button>
      </nav>

      {/* 6. Filter Modal نافذة اختيار التصنيف (شبيه بالصورة الأخيرة) */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-amber-500/30 rounded-3xl w-full max-w-sm p-6 space-y-5 shadow-2xl animate-scaleIn">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-amber-200">
                {lang === 'ar-SA' ? 'اختر التصنيف' : 'Select Genre'}
              </h3>
              <button
                onClick={() => setShowFilterModal(false)}
                className="text-zinc-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
              <button
                onClick={() => setTempGenre('')}
                className={`py-2 rounded-xl text-xs font-bold transition border ${
                  tempGenre === ''
                    ? 'bg-amber-200 text-black border-amber-300'
                    : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                }`}
              >
                {lang === 'ar-SA' ? 'الكل' : 'All'}
              </button>
              {genres.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setTempGenre(g.id)}
                  className={`py-2 rounded-xl text-xs font-bold truncate transition border px-1 ${
                    String(tempGenre) === String(g.id)
                      ? 'bg-amber-200 text-black border-amber-300'
                      : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                  }`}
                >
                  {g.name}
                </button>
              ))}
            </div>

            <button
              onClick={handleApplyFilter}
              className="w-full bg-amber-200 hover:bg-amber-300 text-black font-extrabold py-3 rounded-2xl shadow-lg transition text-sm"
            >
              {lang === 'ar-SA' ? 'تطبيق الفلتر' : 'Apply'}
            </button>
          </div>
        </div>
      )}

      {/* 7. صفحة التفاصيل */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black overflow-y-auto min-h-screen text-slate-100">
          <button
            onClick={() => setSelectedItem(null)}
            className="fixed top-4 right-4 z-50 bg-zinc-900/90 hover:bg-amber-500 hover:text-black text-amber-200 px-4 py-2 rounded-full backdrop-blur-md transition border border-amber-500/30 text-xs font-bold shadow-2xl flex items-center gap-1"
          >
            ✕ {lang === 'ar-SA' ? 'إغلاق' : 'Close'}
          </button>

          {detailsLoading ? (
            <div className="flex justify-center items-center h-screen">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-amber-300 border-t-transparent"></div>
            </div>
          ) : (
            <div className="pb-24">
              <div className="relative w-full h-[50vh] md:h-[60vh] bg-zinc-950">
                {details?.backdrop_path ? (
                  <img
                    src={`${BACKDROP_BASE_URL}${details.backdrop_path}`}
                    alt={details?.title || details?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-700">
                    No Image
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                <div className="absolute bottom-6 px-6 max-w-4xl mx-auto w-full flex items-end gap-5">
                  {details?.poster_path && (
                    <img
                      src={`${IMAGE_BASE_URL}${details.poster_path}`}
                      alt="Poster"
                      className="w-28 md:w-40 rounded-2xl shadow-2xl border border-amber-500/30 hidden sm:block"
                    />
                  )}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="bg-amber-300 text-black font-black px-2 py-0.5 rounded text-[11px]">
                        ★ {details?.vote_average?.toFixed(1)}
                      </span>
                      <span className="text-xs text-zinc-400 font-semibold">
                        {details?.release_date || details?.first_air_date}
                      </span>
                    </div>
                    <h1 className="text-2xl md:text-4xl font-black text-amber-100">
                      {details?.title || details?.name}
                    </h1>
                  </div>
                </div>
              </div>

              <div className="max-w-3xl mx-auto px-6 mt-6 space-y-6">
                <div className="flex flex-wrap gap-2">
                  {details?.genres?.map((g) => (
                    <span
                      key={g.id}
                      className="bg-zinc-900 text-amber-200 px-3 py-1 rounded-xl text-xs font-bold border border-amber-500/20"
                    >
                      {g.name}
                    </span>
                  ))}
                </div>

                <div className="space-y-2">
                  <h2 className="text-base font-bold text-amber-200 border-r-4 border-amber-400 pr-3">
                    {lang === 'ar-SA' ? 'قصة العمل' : 'Overview'}
                  </h2>
                  <p className="text-zinc-300 leading-relaxed text-xs md:text-sm">
                    {details?.overview || (lang === 'ar-SA' ? 'لا يوجد وصف متاح حالياً.' : 'No overview available.')}
                  </p>
                </div>

                {details?.credits?.cast?.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="text-base font-bold text-amber-200 border-r-4 border-amber-400 pr-3">
                      {lang === 'ar-SA' ? 'طاقم التمثيل' : 'Cast'}
                    </h2>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                      {details.credits.cast.slice(0, 6).map((actor) => (
                        <div key={actor.id} className="bg-zinc-900/80 rounded-2xl p-2.5 text-center border border-amber-500/10">
                          <img
                            src={actor.profile_path ? `${IMAGE_BASE_URL}${actor.profile_path}` : 'https://via.placeholder.com/100'}
                            alt={actor.name}
                            className="w-12 h-12 rounded-full object-cover mx-auto mb-1.5 border border-zinc-700"
                          />
                          <p className="text-[11px] font-bold text-white truncate">{actor.name}</p>
                          <p className="text-[9px] text-zinc-400 truncate">{actor.character}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {trailer && (
                  <div className="space-y-3 pt-2">
                    <h2 className="text-base font-bold text-amber-200 border-r-4 border-amber-400 pr-3">
                      {lang === 'ar-SA' ? 'الإعلان الرسمي (Trailer)' : 'Official Trailer'}
                    </h2>
                    <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-amber-500/20 bg-black shadow-xl">
                      <iframe
                        src={`https://www.youtube.com/embed/${trailer.key}`}
                        title="Official Trailer"
                        className="w-full h-full border-0"
                        allowFullScreen
                      ></iframe>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
