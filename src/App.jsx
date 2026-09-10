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

  // جلب قائمة التصنيفات عند تغيير النوع أو اللغة
  useEffect(() => {
    const getGenresList = async () => {
      const list = await fetchGenres(contentType, lang);
      setGenres(list);
    };
    getGenresList();
  }, [contentType, lang]);

  // جلب البيانات (أبحاث / تصنيف / الأكثر تداولاً)
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

  // جلب تفاصيل العنصر المحدد
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

  const trailer = details?.videos?.results?.find(
    (vid) => vid.site === 'YouTube' && (vid.type === 'Trailer' || vid.type === 'Teaser')
  );

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8" dir={lang === 'ar-SA' ? 'rtl' : 'ltr'}>
      {/* الهيدر الرئيسي */}
      <header className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🎬</span>
          <h1 className="text-2xl font-bold text-red-600">موڤيكس</h1>
        </div>
        <button
          onClick={toggleLanguage}
          className="bg-gray-800 hover:bg-gray-700 text-sm px-4 py-2 rounded-lg border border-gray-700 transition"
        >
          {lang === 'ar-SA' ? 'English 🌐' : 'العربية 🌐'}
        </button>
      </header>

      {/* البحث وتحديد النوع (أفلام/مسلسلات) */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <input
          type="text"
          placeholder={lang === 'ar-SA' ? 'ابحث عن فيلم أو مسلسل...' : 'Search movies or TV show...'}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setSelectedGenre('');
            setPage(1);
          }}
          className="flex-1 bg-gray-900 border border-gray-800 px-4 py-3 rounded-xl focus:outline-none focus:border-red-600 text-sm"
        />

        <div className="flex gap-2">
          <button
            onClick={() => handleTypeChange('movie')}
            className={`px-6 py-3 rounded-xl text-sm font-semibold transition ${
              contentType === 'movie' ? 'bg-red-600 text-white' : 'bg-gray-900 text-gray-400 border border-gray-800'
            }`}
          >
            {lang === 'ar-SA' ? 'الأفلام' : 'Movies'}
          </button>
          <button
            onClick={() => handleTypeChange('tv')}
            className={`px-6 py-3 rounded-xl text-sm font-semibold transition ${
              contentType === 'tv' ? 'bg-red-600 text-white' : 'bg-gray-900 text-gray-400 border border-gray-800'
            }`}
          >
            {lang === 'ar-SA' ? 'المسلسلات' : 'TV Shows'}
          </button>
        </div>
      </div>

      {/* شريط الأقسام والتصنيفات (Genres Slider) */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
        <button
          onClick={() => handleGenreChange('')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
            selectedGenre === ''
              ? 'bg-white text-black border-white'
              : 'bg-gray-900 text-gray-400 border-gray-800 hover:bg-gray-800'
          }`}
        >
          {lang === 'ar-SA' ? 'الكل 🌟' : 'All 🌟'}
        </button>
        {genres.map((g) => (
          <button
            key={g.id}
            onClick={() => handleGenreChange(g.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
              selectedGenre === g.id
                ? 'bg-white text-black border-white'
                : 'bg-gray-900 text-gray-400 border-gray-800 hover:bg-gray-800'
            }`}
          >
            {g.name}
          </button>
        ))}
      </div>

      {/* عرض المحتوى */}
      {loading ? (
        <div className="text-center py-20 text-gray-500">
          {lang === 'ar-SA' ? 'جاري التحميل...' : 'Loading...'}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {items.map((item) => (
            <div key={item.id} onClick={() => setSelectedItem(item)}>
              <MovieCard item={item} type={contentType} />
            </div>
          ))}
        </div>
      )}

      {/* التنقل بين الصفحات */}
      <div className="flex justify-center items-center gap-4 mt-12 py-4">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
          className="px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm disabled:opacity-50"
        >
          {lang === 'ar-SA' ? 'السابق' : 'Previous'}
        </button>
        <span className="text-sm text-gray-400">
          {page} / {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm disabled:opacity-50"
        >
          {lang === 'ar-SA' ? 'التالي' : 'Next'}
        </button>
      </div>

      {/* صفحة التفاصيل */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black overflow-y-auto min-h-screen text-white">
          <button
            onClick={() => setSelectedItem(null)}
            className="fixed top-4 right-4 z-50 bg-black/70 hover:bg-red-600 text-white px-4 py-2 rounded-full backdrop-blur-md transition flex items-center gap-2 border border-gray-700 text-sm font-semibold"
          >
            ✕ {lang === 'ar-SA' ? 'إغلاق الصفحة' : 'Close Page'}
          </button>

          {detailsLoading ? (
            <div className="flex justify-center items-center h-screen text-gray-400">
              {lang === 'ar-SA' ? 'جاري تحميل التفاصيل...' : 'Loading details...'}
            </div>
          ) : (
            <div className="pb-16">
              <div className="relative w-full h-[50vh] md:h-[65vh] bg-gray-900">
                {details?.backdrop_path ? (
                  <img
                    src={`${BACKDROP_BASE_URL}${details.backdrop_path}`}
                    alt={details?.title || details?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-900 flex items-center justify-center text-gray-600">
                    No Backdrop Image
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                <div className="absolute bottom-6 px-6 md:px-12 w-full flex items-end gap-6">
                  {details?.poster_path && (
                    <img
                      src={`${IMAGE_BASE_URL}${details.poster_path}`}
                      alt="Poster"
                      className="w-28 md:w-44 rounded-xl shadow-2xl border-2 border-gray-800 hidden sm:block"
                    />
                  )}
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="bg-yellow-500 text-black font-bold px-2.5 py-0.5 rounded text-xs">
                        ★ {details?.vote_average?.toFixed(1)}
                      </span>
                      <span className="text-sm text-gray-300">
                        {details?.release_date || details?.first_air_date}
                      </span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-white">
                      {details?.title || details?.name}
                    </h1>
                  </div>
                </div>
              </div>

              <div className="max-w-5xl mx-auto px-6 mt-8 space-y-10">
                <div className="flex flex-wrap gap-2">
                  {details?.genres?.map((g) => (
                    <span
                      key={g.id}
                      className="bg-gray-800 text-gray-300 px-3 py-1 rounded-lg text-xs font-medium border border-gray-700"
                    >
                      {g.name}
                    </span>
                  ))}
                </div>

                <div>
                  <h2 className="text-xl font-bold mb-3 border-r-4 border-red-600 pr-3">
                    {lang === 'ar-SA' ? 'قصة العمل' : 'Overview'}
                  </h2>
                  <p className="text-gray-300 leading-relaxed text-base md:text-lg">
                    {details?.overview || (lang === 'ar-SA' ? 'لا يوجد وصف متاح حالياً.' : 'No overview available.')}
                  </p>
                </div>

                {details?.credits?.cast?.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold mb-4 border-r-4 border-red-600 pr-3">
                      {lang === 'ar-SA' ? 'طاقم التمثيل' : 'Cast'}
                    </h2>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                      {details.credits.cast.slice(0, 6).map((actor) => (
                        <div key={actor.id} className="bg-gray-900 rounded-xl p-3 text-center border border-gray-800">
                          <img
                            src={actor.profile_path ? `${IMAGE_BASE_URL}${actor.profile_path}` : 'https://via.placeholder.com/100'}
                            alt={actor.name}
                            className="w-16 h-16 rounded-full object-cover mx-auto mb-2 border border-gray-700"
                          />
                          <p className="text-xs font-semibold text-white truncate">{actor.name}</p>
                          <p className="text-[10px] text-gray-400 truncate">{actor.character}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {trailer && (
                  <div className="pt-6">
                    <h2 className="text-xl font-bold mb-4 border-r-4 border-red-600 pr-3">
                      {lang === 'ar-SA' ? 'الإعلان الرسمي (Trailer)' : 'Official Trailer'}
                    </h2>
                    <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-gray-800 bg-black shadow-2xl">
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
