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
import MovieCard from './components/MovieCard';

export default function App() {
  const [items, setItems] = useState([]);
  const [contentType, setContentType] = useState('movie');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState('ar-SA');

  // حالات التصنيفات
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('');

  // حالات التفاصيل
  const [selectedItem, setSelectedItem] = useState(null);
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // جلب قائمة التصنيفات
  useEffect(() => {
    const getGenresList = async () => {
      const list = await fetchGenres(contentType, lang);
      setGenres(list);
    };
    getGenresList();
  }, [contentType, lang]);

  // جلب البيانات
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

  // جلب التفاصيل
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

  const handleTypeChange = (type) => {
    setContentType(type);
    setSelectedGenre('');
    setPage(1);
  };

  const handleGenreChange = (genreId) => {
    setSelectedGenre(genreId);
    setSearchQuery('');
    setPage(1);
  };

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'ar-SA' ? 'en-US' : 'ar-SA'));
  };

  const featuredItem = items.length > 0 ? items[0] : null;
  const trailer = details?.videos?.results?.find(
    (vid) => vid.site === 'YouTube' && (vid.type === 'Trailer' || vid.type === 'Teaser')
  );

  return (
    <div className="min-h-screen bg-[#0d0f12] text-slate-100 font-sans antialiased selection:bg-red-600 selection:text-white pb-12" dir={lang === 'ar-SA' ? 'rtl' : 'ltr'}>
      
      {/* 1. Header شريط علوي حديث وزجاجي */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#0d0f12]/80 border-b border-slate-800/60 px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setSelectedGenre(''); setSearchQuery(''); setPage(1); }}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-red-500 flex items-center justify-center shadow-lg shadow-red-600/30">
            <span className="text-xl">🎬</span>
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-red-500">
              موڤيكس
            </h1>
            <p className="text-[10px] text-slate-400 -mt-1 font-medium tracking-widest">MOVIX STREAM</p>
          </div>
        </div>

        {/* زر التبديل بين الأفلام والمسلسلات في الهيدر */}
        <div className="hidden sm:flex bg-slate-900/80 p-1 rounded-full border border-slate-800">
          <button
            onClick={() => handleTypeChange('movie')}
            className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${
              contentType === 'movie' ? 'bg-red-600 text-white shadow-lg shadow-red-600/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            {lang === 'ar-SA' ? 'الأفلام' : 'Movies'}
          </button>
          <button
            onClick={() => handleTypeChange('tv')}
            className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${
              contentType === 'tv' ? 'bg-red-600 text-white shadow-lg shadow-red-600/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            {lang === 'ar-SA' ? 'المسلسلات' : 'TV Shows'}
          </button>
        </div>

        <button
          onClick={toggleLanguage}
          className="bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold px-4 py-2 rounded-full border border-slate-800 transition shadow-inner"
        >
          {lang === 'ar-SA' ? 'English 🌐' : 'العربية 🌐'}
        </button>
      </header>

      {/* 2. Hero Featured Section (عرض غلاف بطل أحدث فيلم متاح عند عدم البحث) */}
      {!searchQuery && !selectedGenre && page === 1 && featuredItem && (
        <div className="relative w-full h-[55vh] md:h-[65vh] mb-8 overflow-hidden group">
          <img
            src={`${BACKDROP_BASE_URL}${featuredItem.backdrop_path || featuredItem.poster_path}`}
            alt={featuredItem.title || featuredItem.name}
            className="w-full h-full object-cover transform scale-105 group-hover:scale-100 transition duration-1000 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f12] via-[#0d0f12]/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d0f12]/90 via-[#0d0f12]/30 to-transparent" />

          <div className="absolute bottom-8 px-6 md:px-12 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 bg-red-600/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md">
              🔥 {lang === 'ar-SA' ? 'الأكثر تداولاً هذا الأسبوع' : 'Trending This Week'}
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white leading-tight drop-shadow-md">
              {featuredItem.title || featuredItem.name}
            </h2>
            <p className="text-slate-300 text-xs md:text-sm line-clamp-2 leading-relaxed">
              {featuredItem.overview}
            </p>
            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => setSelectedItem(featuredItem)}
                className="bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-2.5 rounded-xl transition shadow-lg shadow-red-600/40 flex items-center gap-2 text-xs md:text-sm"
              >
                <span>▶</span> {lang === 'ar-SA' ? 'عرض التفاصيل' : 'View Details'}
              </button>
              <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 px-3 py-2 rounded-xl text-yellow-400 text-xs font-extrabold flex items-center gap-1">
                ★ {featuredItem.vote_average?.toFixed(1)}
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="px-4 md:px-8 max-w-7xl mx-auto space-y-6">

        {/* 3. شريط البحث والتبديل للجوال */}
        <div className="space-y-3">
          <div className="flex sm:hidden justify-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => handleTypeChange('movie')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
                contentType === 'movie' ? 'bg-red-600 text-white' : 'text-slate-400'
              }`}
            >
              {lang === 'ar-SA' ? 'الأفلام' : 'Movies'}
            </button>
            <button
              onClick={() => handleTypeChange('tv')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
                contentType === 'tv' ? 'bg-red-600 text-white' : 'text-slate-400'
              }`}
            >
              {lang === 'ar-SA' ? 'المسلسلات' : 'TV Shows'}
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder={lang === 'ar-SA' ? 'ابحث عن فيلم، مسلسل، أو ممثل...' : 'Search movies, tv, actors...'}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedGenre('');
                setPage(1);
              }}
              className="w-full bg-slate-900/90 text-white placeholder-slate-500 border border-slate-800 focus:border-red-500/80 px-5 py-3.5 pr-12 rounded-2xl focus:outline-none transition shadow-lg text-xs md:text-sm"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-base">🔍</span>
          </div>
        </div>

        {/* 4. التصنيفات أزرار دائرية جذابة (Chips) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => handleGenreChange('')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              selectedGenre === ''
                ? 'bg-white text-slate-950 border-white shadow-lg shadow-white/10'
                : 'bg-slate-900/80 text-slate-400 border-slate-800/80 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            {lang === 'ar-SA' ? '✨ الكل' : '✨ All'}
          </button>
          {genres.map((g) => (
            <button
              key={g.id}
              onClick={() => handleGenreChange(g.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                selectedGenre === g.id
                  ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-600/30'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800/80 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>

        {/* 5. شبكة عرض البطاقات (Grid Layout) */}
        {loading ? (
          <div className="flex justify-center items-center py-32">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {items.map((item) => (
              <div 
                key={item.id} 
                onClick={() => setSelectedItem(item)}
                className="group relative cursor-pointer rounded-2xl overflow-hidden bg-slate-900 border border-slate-800/60 transition duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-red-600/20 hover:border-slate-700"
              >
                {/* صورة البوستر */}
                <div className="aspect-[2/3] w-full overflow-hidden bg-slate-950 relative">
                  {item.poster_path ? (
                    <img
                      src={`${IMAGE_BASE_URL}${item.poster_path}`}
                      alt={item.title || item.name}
                      className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">
                      No Poster
                    </div>
                  )}

                  {/* شارة التقييم فوق الصورة */}
                  <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md text-yellow-400 border border-white/10 px-2 py-1 rounded-lg text-[11px] font-extrabold flex items-center gap-1 shadow-md">
                    ★ {item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}
                  </div>

                  {/* تدرج سفلي وتفاصيل المصغرة عند التحويم */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-90 group-hover:opacity-100 transition duration-300" />
                  
                  <div className="absolute bottom-0 p-3.5 w-full space-y-1">
                    <h3 className="text-sm font-bold text-white truncate group-hover:text-red-400 transition">
                      {item.title || item.name}
                    </h3>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                      <span>{item.release_date?.substring(0, 4) || item.first_air_date?.substring(0, 4) || '—'}</span>
                      <span className="uppercase text-[10px] bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/50">
                        {contentType === 'movie' ? (lang === 'ar-SA' ? 'فيلم' : 'Movie') : (lang === 'ar-SA' ? 'مسلسل' : 'TV')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 6. الترقيم والتنقل (Pagination) */}
        <div className="flex justify-center items-center gap-4 pt-8">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            className="px-5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold disabled:opacity-40 hover:bg-slate-800 transition"
          >
            {lang === 'ar-SA' ? '← السابق' : '← Previous'}
          </button>
          <span className="text-xs font-bold text-slate-400 bg-slate-900/50 px-4 py-2 rounded-xl border border-slate-800">
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold disabled:opacity-40 hover:bg-slate-800 transition"
          >
            {lang === 'ar-SA' ? 'التالي →' : 'Next →'}
          </button>
        </div>
      </main>

      {/* 7. صفحة تفاصيل العمل السينمائية المحدثة */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-[#0d0f12] overflow-y-auto min-h-screen text-slate-100 animate-fadeIn">
          <button
            onClick={() => setSelectedItem(null)}
            className="fixed top-5 right-5 z-50 bg-slate-900/80 hover:bg-red-600 text-white px-4 py-2 rounded-full backdrop-blur-xl transition border border-slate-700 text-xs font-bold shadow-2xl flex items-center gap-2"
          >
            ✕ {lang === 'ar-SA' ? 'إغلاق' : 'Close'}
          </button>

          {detailsLoading ? (
            <div className="flex justify-center items-center h-screen">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent"></div>
            </div>
          ) : (
            <div className="pb-20">
              <div className="relative w-full h-[55vh] md:h-[70vh] bg-slate-950">
                {details?.backdrop_path ? (
                  <img
                    src={`${BACKDROP_BASE_URL}${details.backdrop_path}`}
                    alt={details?.title || details?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-700">
                    No Image
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f12] via-[#0d0f12]/60 to-transparent" />

                <div className="absolute bottom-6 px-6 md:px-12 max-w-6xl mx-auto w-full flex items-end gap-6">
                  {details?.poster_path && (
                    <img
                      src={`${IMAGE_BASE_URL}${details.poster_path}`}
                      alt="Poster"
                      className="w-32 md:w-48 rounded-2xl shadow-2xl border-2 border-slate-800/80 hidden sm:block"
                    />
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="bg-yellow-500 text-slate-950 font-black px-2.5 py-0.5 rounded-lg text-xs">
                        ★ {details?.vote_average?.toFixed(1)}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">
                        {details?.release_date || details?.first_air_date}
                      </span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                      {details?.title || details?.name}
                    </h1>
                  </div>
                </div>
              </div>

              <div className="max-w-5xl mx-auto px-6 mt-8 space-y-8">
                <div className="flex flex-wrap gap-2">
                  {details?.genres?.map((g) => (
                    <span
                      key={g.id}
                      className="bg-slate-900 text-slate-300 px-3.5 py-1.5 rounded-xl text-xs font-bold border border-slate-800"
                    >
                      {g.name}
                    </span>
                  ))}
                </div>

                <div className="space-y-2">
                  <h2 className="text-lg font-bold text-white border-r-4 border-red-600 pr-3">
                    {lang === 'ar-SA' ? 'قصة العمل' : 'Overview'}
                  </h2>
                  <p className="text-slate-300 leading-relaxed text-sm md:text-base font-normal">
                    {details?.overview || (lang === 'ar-SA' ? 'لا يوجد وصف متاح حالياً.' : 'No overview available.')}
                  </p>
                </div>

                {details?.credits?.cast?.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="text-lg font-bold text-white border-r-4 border-red-600 pr-3">
                      {lang === 'ar-SA' ? 'طاقم التمثيل' : 'Cast'}
                    </h2>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                      {details.credits.cast.slice(0, 6).map((actor) => (
                        <div key={actor.id} className="bg-slate-900/80 rounded-2xl p-3 text-center border border-slate-800/80">
                          <img
                            src={actor.profile_path ? `${IMAGE_BASE_URL}${actor.profile_path}` : 'https://via.placeholder.com/100'}
                            alt={actor.name}
                            className="w-14 h-14 rounded-full object-cover mx-auto mb-2 border border-slate-700"
                          />
                          <p className="text-xs font-bold text-white truncate">{actor.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{actor.character}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {trailer && (
                  <div className="space-y-3 pt-4">
                    <h2 className="text-lg font-bold text-white border-r-4 border-red-600 pr-3">
                      {lang === 'ar-SA' ? 'الإعلان الرسمي (Trailer)' : 'Official Trailer'}
                    </h2>
                    <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-800 bg-black shadow-2xl">
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
