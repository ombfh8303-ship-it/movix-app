import React, { useState, useEffect } from 'react';
import {
  fetchTrending,
  fetchTopRated,
  fetchUpcomingOrPopular,
  searchMedia,
  fetchDetails,
  fetchGenres,
  fetchByGenre,
  IMAGE_BASE_URL,
  BACKDROP_BASE_URL
} from './services/tmdb';

// شركات الإنتاج الشهيرة
const COMPANIES = [
  { id: 420, name: 'Marvel', logo: '⚡' },
  { id: 2, name: 'Walt Disney', logo: '🏰' },
  { id: 33, name: 'Universal', logo: '🌐' },
  { id: 174, name: 'Warner Bros.', logo: '🛡️' },
  { id: 213, name: 'Netflix', logo: '🎬' },
  { id: 3186, name: 'HBO', logo: '👑' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'movies' | 'tv' | 'mylist'
  const [lang, setLang] = useState('ar-SA');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // قائمة "قائمتي" من LocalStorage
  const [myList, setMyList] = useState(() => {
    try {
      const saved = localStorage.getItem('movix_my_list');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // بيانات الصفحة الرئيسية
  const [trendingList, setTrendingList] = useState([]);
  const [latestMoviesList, setLatestMoviesList] = useState([]);
  const [topRatedList, setTopRatedList] = useState([]);
  const [trendingTvList, setTrendingTvList] = useState([]);

  // بيانات الشبكة العامة (لصفحات الأفلام / المسلسلات / الفلترة / البحث)
  const [gridItems, setGridItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // التصنيفات ونافذة الفلترة
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [tempGenre, setTempGenre] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);

  // التفاصيل
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemType, setSelectedItemType] = useState('movie');
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // مراقبة التمرير للـ Header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // حفظ القائمة الشخصية
  useEffect(() => {
    localStorage.setItem('movix_my_list', JSON.stringify(myList));
  }, [myList]);

  // جلب التصنيفات
  useEffect(() => {
    const getGenresList = async () => {
      const type = activeTab === 'tv' ? 'tv' : 'movie';
      const list = await fetchGenres(type, lang);
      setGenres(list);
    };
    getGenresList();
  }, [activeTab, lang]);

  // جلب محتوى الصفحة الرئيسية (أقسام أفقية متتالية)
  useEffect(() => {
    if (activeTab === 'home' && !searchQuery && !selectedGenre) {
      const loadHomeContent = async () => {
        setLoading(true);
        const [trending, upcoming, topRated, tvTrending] = await Promise.all([
          fetchTrending('movie', 1, lang),
          fetchUpcomingOrPopular('movie', 1, lang),
          fetchTopRated('movie', 1, lang),
          fetchTrending('tv', 1, lang)
        ]);
        setTrendingList(trending.results || []);
        setLatestMoviesList(upcoming.results || []);
        setTopRatedList(topRated.results || []);
        setTrendingTvList(tvTrending.results || []);
        setLoading(false);
      };
      loadHomeContent();
    }
  }, [activeTab, searchQuery, selectedGenre, lang]);

  // جلب محتوى العرض الشبكي (الأفلام/المسلسلات/البحث/التصنيف)
  useEffect(() => {
    if (activeTab !== 'home' || searchQuery || selectedGenre) {
      const loadGridContent = async () => {
        setLoading(true);
        const type = activeTab === 'tv' ? 'tv' : 'movie';
        let data;

        if (searchQuery.trim()) {
          data = await searchMedia(searchQuery, type, page, lang);
        } else if (selectedGenre) {
          data = await fetchByGenre(type, selectedGenre, page, lang);
        } else {
          data = await fetchTrending(type, page, lang);
        }

        setGridItems(data.results || []);
        setTotalPages(data.total_pages || 1);
        setLoading(false);
      };
      loadGridContent();
    }
  }, [activeTab, page, searchQuery, selectedGenre, lang]);

  // جلب تفاصيل العمل السينمائي
  useEffect(() => {
    if (!selectedItem) {
      setDetails(null);
      return;
    }
    const getDetails = async () => {
      setDetailsLoading(true);
      const data = await fetchDetails(selectedItemType, selectedItem.id, lang);
      setDetails(data);
      setDetailsLoading(false);
    };
    getDetails();
  }, [selectedItem, selectedItemType, lang]);

  const toggleMyList = (item, type = 'movie') => {
    const exists = myList.some((i) => i.id === item.id);
    if (exists) {
      setMyList(myList.filter((i) => i.id !== item.id));
    } else {
      setMyList([...myList, { ...item, media_type: type }]);
    }
  };

  const isInMyList = (itemId) => myList.some((i) => i.id === itemId);

  const handleOpenDetails = (item, type = 'movie') => {
    setSelectedItemType(type);
    setSelectedItem(item);
  };

  const featuredItem = trendingList.length > 0 ? trendingList[0] : null;
  const trailer = details?.videos?.results?.find(
    (vid) => vid.site === 'YouTube' && (vid.type === 'Trailer' || vid.type === 'Teaser')
  );

  return (
    <div
      className="min-h-screen bg-[#08080a] text-zinc-100 antialiased pb-24 selection:bg-amber-500 selection:text-black"
      dir={lang === 'ar-SA' ? 'rtl' : 'ltr'}
    >
      {/* 1. Header العصري المتكيف */}
      <header
        className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
          scrolled
            ? 'bg-[#08080a]/90 backdrop-blur-xl border-b border-white/5 py-3 shadow-2xl'
            : 'bg-gradient-to-b from-black/90 via-black/40 to-transparent py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-amber-200 p-[1px]">
              <div className="w-full h-full bg-black rounded-full flex items-center justify-center text-amber-300 font-bold text-sm">
                👤
              </div>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500">
              MOVIX
            </h1>
          </div>

          <button
            onClick={() => setLang((prev) => (prev === 'ar-SA' ? 'en-US' : 'ar-SA'))}
            className="text-amber-300 bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/50 px-3.5 py-1.5 rounded-full text-xs font-bold transition duration-300 backdrop-blur-md"
          >
            {lang === 'ar-SA' ? 'English' : 'العربية'}
          </button>
        </div>
      </header>

      <main className="pt-16 max-w-7xl mx-auto px-4 md:px-8 space-y-8">
        
        {/* 2. شريط البحث والفلترة الأصلي - محتفظ بمساره بدون إنشاء شريط جديد */}
        <div className="pt-2 space-y-3">
          <div className="relative max-w-2xl mx-auto">
            <input
              type="text"
              placeholder={lang === 'ar-SA' ? 'ابحث عن فيلم، مسلسل، ممثل...' : 'Search movies, TV shows...'}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedGenre('');
                setPage(1);
              }}
              className="w-full bg-zinc-900/80 text-amber-50 placeholder-zinc-500 border border-white/10 focus:border-amber-500/50 px-5 py-3.5 pr-11 rounded-2xl focus:outline-none text-sm transition shadow-2xl backdrop-blur-md"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">🔍</span>
          </div>

          <div className="flex items-center justify-between pt-2">
            <h2 className="text-lg font-bold text-amber-100 flex items-center gap-2">
              {searchQuery
                ? (lang === 'ar-SA' ? 'نتائج البحث' : 'Search Results')
                : selectedGenre
                ? genres.find((g) => g.id === Number(selectedGenre))?.name
                : activeTab === 'home'
                ? ''
                : activeTab === 'movies'
                ? (lang === 'ar-SA' ? 'مكتبة الأفلام' : 'Movies')
                : activeTab === 'tv'
                ? (lang === 'ar-SA' ? 'مكتبة المسلسلات' : 'TV Series')
                : (lang === 'ar-SA' ? 'قائمتي المفضلّة' : 'My List')}
            </h2>

            {activeTab !== 'mylist' && (
              <button
                onClick={() => {
                  setTempGenre(selectedGenre);
                  setShowFilterModal(true);
                }}
                className="flex items-center gap-2 bg-zinc-900/80 text-amber-300 border border-amber-500/20 hover:border-amber-500/50 px-3.5 py-1.5 rounded-xl text-xs font-bold transition backdrop-blur-md"
              >
                <span>⚙️</span>
                <span>{lang === 'ar-SA' ? 'التصنيف' : 'Genres'}</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. العرض الرئيسي: الصفحة الرئيسية الأفقية OR الشبكة */}
        {activeTab === 'home' && !searchQuery && !selectedGenre ? (
          
          /* ==================== محتوى الصفحة الرئيسية (Streaming Hub) ==================== */
          <div className="space-y-10">

            {/* 🔥 Hero Banner سينمائي بعرض شاشة ذكي */}
            {loading ? (
              <HeroSkeleton />
            ) : (
              featuredItem && (
                <div className="relative rounded-3xl overflow-hidden bg-zinc-900 border border-white/5 shadow-2xl group">
                  <div className="relative h-[380px] sm:h-[460px] md:h-[520px] w-full">
                    <img
                      src={`${BACKDROP_BASE_URL}${featuredItem.backdrop_path || featuredItem.poster_path}`}
                      alt={featuredItem.title || featuredItem.name}
                      className="w-full h-full object-cover object-top transition duration-700 group-hover:scale-105"
                    />
                    {/* تدرج التعتيم الداكن المزدوج */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#08080a] via-[#08080a]/50 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#08080a]/80 via-transparent to-transparent" />

                    {/* تفاصيل الهيرو النصية */}
                    <div className="absolute bottom-6 inset-x-6 md:inset-x-10 space-y-3 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-400 text-black text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                          🔥 {lang === 'ar-SA' ? 'الأكثر تداولاً' : 'Trending'}
                        </span>
                        <span className="text-xs font-bold text-amber-200">
                          ★ {featuredItem.vote_average?.toFixed(1)}
                        </span>
                        <span className="text-xs text-zinc-400">
                          {featuredItem.release_date?.substring(0, 4) || featuredItem.first_air_date?.substring(0, 4)}
                        </span>
                      </div>

                      <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white leading-tight drop-shadow-xl">
                        {featuredItem.title || featuredItem.name}
                      </h2>

                      <p className="text-xs sm:text-sm text-zinc-300 line-clamp-2 sm:line-clamp-3 leading-relaxed font-normal">
                        {featuredItem.overview || (lang === 'ar-SA' ? 'فيلم سينمائي مشوق مميز للغاية متوفر للعرض الآن.' : 'Featured movie available now.')}
                      </p>

                      {/* أزرار التشغيل والحفظ */}
                      <div className="flex items-center gap-3 pt-2">
                        <button
                          onClick={() => handleOpenDetails(featuredItem, 'movie')}
                          className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-extrabold px-6 py-3 rounded-xl shadow-lg shadow-amber-500/20 text-xs sm:text-sm transition duration-300 transform hover:scale-105"
                        >
                          <span>▶</span>
                          <span>{lang === 'ar-SA' ? 'شاهد الآن' : 'Watch Now'}</span>
                        </button>

                        <button
                          onClick={() => toggleMyList(featuredItem, 'movie')}
                          className="flex items-center gap-2 bg-zinc-900/80 hover:bg-zinc-800 text-white font-bold px-5 py-3 rounded-xl border border-white/10 text-xs sm:text-sm transition backdrop-blur-md"
                        >
                          <span>{isInMyList(featuredItem.id) ? '✓' : '＋'}</span>
                          <span>{isInMyList(featuredItem.id) ? (lang === 'ar-SA' ? 'في قائمتي' : 'In My List') : (lang === 'ar-SA' ? 'أضف إلى قائمتي' : 'My List')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}

            {/* الأقسام بالترتيب المحدد بالضبط */}

            {/* 1. 🔥 الأكثر تداولاً */}
            <SectionRow
              title={lang === 'ar-SA' ? '🔥 الأكثر تداولاً هذا الأسبوع' : '🔥 Trending This Week'}
              items={trendingList}
              loading={loading}
              onItemClick={(item) => handleOpenDetails(item, 'movie')}
              isInMyList={isInMyList}
              toggleMyList={toggleMyList}
              onViewAll={() => setActiveTab('movies')}
              lang={lang}
            />

            {/* 2. 🎬 أحدث الأفلام والقادمة قريباً */}
            <SectionRow
              title={lang === 'ar-SA' ? '🎬 أحدث الأفلام' : '🎬 Latest Movies'}
              items={latestMoviesList}
              loading={loading}
              onItemClick={(item) => handleOpenDetails(item, 'movie')}
              isInMyList={isInMyList}
              toggleMyList={toggleMyList}
              onViewAll={() => setActiveTab('movies')}
              lang={lang}
            />

            {/* 3. ⭐ الأعلى تقييماً */}
            <SectionRow
              title={lang === 'ar-SA' ? '⭐ الأعلى تقييماً' : '⭐ Top Rated'}
              items={topRatedList}
              loading={loading}
              onItemClick={(item) => handleOpenDetails(item, 'movie')}
              isInMyList={isInMyList}
              toggleMyList={toggleMyList}
              onViewAll={() => setActiveTab('movies')}
              lang={lang}
            />

            {/* 4. 📺 المسلسلات الرائجة */}
            <SectionRow
              title={lang === 'ar-SA' ? '📺 المسلسلات الرائجة' : '📺 Popular TV Series'}
              items={trendingTvList}
              loading={loading}
              onItemClick={(item) => handleOpenDetails(item, 'tv')}
              isInMyList={isInMyList}
              toggleMyList={(item) => toggleMyList(item, 'tv')}
              onViewAll={() => setActiveTab('tv')}
              lang={lang}
            />

            {/* 5. 🏢 شركات الإنتاج */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-amber-200 flex items-center gap-2">
                <span>🏢</span>
                <span>{lang === 'ar-SA' ? 'شركات الإنتاج الشهيرة' : 'Production Companies'}</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {COMPANIES.map((company) => (
                  <div
                    key={company.id}
                    className="bg-zinc-900/60 border border-white/5 hover:border-amber-500/40 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition hover:bg-zinc-800/80 group shadow-md"
                  >
                    <span className="text-2xl group-hover:scale-110 transition">{company.logo}</span>
                    <span className="text-xs font-bold text-zinc-300 group-hover:text-amber-300">{company.name}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : activeTab === 'mylist' ? (
          
          /* ==================== عرض قائمتي المفضلّة ==================== */
          <div className="space-y-6">
            {myList.length === 0 ? (
              <div className="text-center py-20 text-zinc-500 space-y-3">
                <span className="text-4xl">📂</span>
                <p className="text-sm">{lang === 'ar-SA' ? 'قائمتك فارغة حالياً. أضف بعض الأفلام أو المسلسلات!' : 'Your list is currently empty.'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {myList.map((item) => (
                  <PosterCard
                    key={item.id}
                    item={item}
                    onItemClick={() => handleOpenDetails(item, item.media_type || 'movie')}
                    isInMyList={isInMyList(item.id)}
                    toggleMyList={() => toggleMyList(item, item.media_type || 'movie')}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (

          /* ==================== العرض الشبكي (Grid View) للأفلام والمسلسلات ==================== */
          <div className="space-y-6">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {gridItems.map((item) => (
                    <PosterCard
                      key={item.id}
                      item={item}
                      onItemClick={() => handleOpenDetails(item, activeTab === 'tv' ? 'tv' : 'movie')}
                      isInMyList={isInMyList(item.id)}
                      toggleMyList={() => toggleMyList(item, activeTab === 'tv' ? 'tv' : 'movie')}
                    />
                  ))}
                </div>

                {/* الترقيم (Pagination) */}
                <div className="flex justify-center items-center gap-4 pt-6">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-xl text-xs font-bold text-amber-200 disabled:opacity-30 hover:bg-zinc-800 transition"
                  >
                    {lang === 'ar-SA' ? 'السابق' : 'Prev'}
                  </button>
                  <span className="text-xs font-bold text-zinc-400">
                    {page} / {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-xl text-xs font-bold text-amber-200 disabled:opacity-30 hover:bg-zinc-800 transition"
                  >
                    {lang === 'ar-SA' ? 'التالي' : 'Next'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

      </main>

      {/* 4. Bottom Navigation Bar العصري والدقيق */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-[#08080a]/95 backdrop-blur-2xl border-t border-white/5 py-2 px-6 max-w-md md:max-w-xl mx-auto rounded-t-3xl shadow-2xl flex items-center justify-around">
        <NavButton
          active={activeTab === 'home' && !searchQuery && !selectedGenre}
          onClick={() => {
            setActiveTab('home');
            setSelectedGenre('');
            setSearchQuery('');
          }}
          icon="🏠"
          label={lang === 'ar-SA' ? 'الرئيسية' : 'Home'}
        />
        <NavButton
          active={activeTab === 'movies' && !selectedGenre && !searchQuery}
          onClick={() => {
            setActiveTab('movies');
            setSelectedGenre('');
            setSearchQuery('');
            setPage(1);
          }}
          icon="🎬"
          label={lang === 'ar-SA' ? 'الأفلام' : 'Movies'}
        />
        <NavButton
          active={activeTab === 'tv' && !selectedGenre && !searchQuery}
          onClick={() => {
            setActiveTab('tv');
            setSelectedGenre('');
            setSearchQuery('');
            setPage(1);
          }}
          icon="📺"
          label={lang === 'ar-SA' ? 'المسلسلات' : 'TV Series'}
        />
        <NavButton
          active={activeTab === 'mylist'}
          onClick={() => {
            setActiveTab('mylist');
            setSelectedGenre('');
            setSearchQuery('');
          }}
          icon="🔖"
          label={lang === 'ar-SA' ? 'قائمتي' : 'My List'}
        />
      </nav>

      {/* 5. Filter Modal نافذة التصنيفات المودرن */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121216] border border-white/10 rounded-3xl w-full max-w-sm p-6 space-y-5 shadow-2xl animate-scaleIn">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-amber-200">
                {lang === 'ar-SA' ? 'اختر التصنيف السينمائي' : 'Select Genre'}
              </h3>
              <button
                onClick={() => setShowFilterModal(false)}
                className="text-zinc-400 hover:text-white text-base"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
              <button
                onClick={() => setTempGenre('')}
                className={`py-2 rounded-xl text-xs font-bold transition border ${
                  tempGenre === ''
                    ? 'bg-amber-400 text-black border-amber-300'
                    : 'bg-zinc-900 text-zinc-300 border-white/5 hover:bg-zinc-800'
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
                      ? 'bg-amber-400 text-black border-amber-300'
                      : 'bg-zinc-900 text-zinc-300 border-white/5 hover:bg-zinc-800'
                  }`}
                >
                  {g.name}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setSelectedGenre(tempGenre);
                setSearchQuery('');
                setPage(1);
                setShowFilterModal(false);
              }}
              className="w-full bg-gradient-to-r from-amber-400 to-amber-500 text-black font-extrabold py-3 rounded-2xl shadow-lg transition text-xs"
            >
              {lang === 'ar-SA' ? 'تطبيق الفلتر' : 'Apply Filter'}
            </button>
          </div>
        </div>
      )}

      {/* 6. Modal تفاصيل الفيلم/المسلسل السينمائي المحدث بالكامل */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-[#08080a] overflow-y-auto min-h-screen text-zinc-100">
          <button
            onClick={() => setSelectedItem(null)}
            className="fixed top-5 right-5 z-50 bg-black/70 hover:bg-amber-500 hover:text-black text-amber-200 px-4 py-2 rounded-full backdrop-blur-md transition border border-white/10 text-xs font-bold shadow-2xl flex items-center gap-1.5"
          >
            ✕ {lang === 'ar-SA' ? 'إغلاق' : 'Close'}
          </button>

          {detailsLoading ? (
            <div className="flex justify-center items-center h-screen">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-amber-400 border-t-transparent"></div>
            </div>
          ) : (
            <div className="pb-24">
              {/* الغلاف العلوي الهيرو للتفاصيل */}
              <div className="relative w-full h-[55vh] md:h-[65vh] bg-zinc-950">
                {details?.backdrop_path ? (
                  <img
                    src={`${BACKDROP_BASE_URL}${details.backdrop_path}`}
                    alt={details?.title || details?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-700">No Image</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#08080a] via-[#08080a]/60 to-transparent" />

                <div className="absolute bottom-6 px-6 max-w-5xl mx-auto w-full flex items-end gap-6">
                  {details?.poster_path && (
                    <img
                      src={`${IMAGE_BASE_URL}${details.poster_path}`}
                      alt="Poster"
                      className="w-32 md:w-44 rounded-2xl shadow-2xl border border-white/10 hidden sm:block aspect-[2/3] object-cover"
                    />
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-amber-400 text-black font-black px-2 py-0.5 rounded text-[11px]">
                        ★ {details?.vote_average?.toFixed(1)}
                      </span>
                      <span className="text-xs text-zinc-400 font-medium">
                        {details?.release_date?.substring(0, 4) || details?.first_air_date?.substring(0, 4)}
                      </span>
                      {details?.runtime && (
                        <span className="text-xs text-zinc-400">
                          • {details.runtime} {lang === 'ar-SA' ? 'دقيقة' : 'min'}
                        </span>
                      )}
                    </div>
                    <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white">
                      {details?.title || details?.name}
                    </h1>
                  </div>
                </div>
              </div>

              {/* محتوى قصة الفيلم والممثلين والعرض */}
              <div className="max-w-4xl mx-auto px-6 mt-6 space-y-8">
                
                {/* الأزرار والتصنيف */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-2">
                    {details?.genres?.map((g) => (
                      <span
                        key={g.id}
                        className="bg-zinc-900 text-amber-300 px-3 py-1 rounded-xl text-xs font-semibold border border-white/5"
                      >
                        {g.name}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => toggleMyList(details, selectedItemType)}
                    className="flex items-center gap-2 bg-zinc-900 border border-white/10 text-white font-bold px-4 py-2 rounded-xl text-xs hover:border-amber-400 transition"
                  >
                    <span>{isInMyList(details?.id) ? '✓' : '＋'}</span>
                    <span>{isInMyList(details?.id) ? (lang === 'ar-SA' ? 'في قائمتي' : 'In List') : (lang === 'ar-SA' ? 'أضف لقائمتي' : 'Add to List')}</span>
                  </button>
                </div>

                {/* القصة */}
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-amber-200 border-r-4 border-amber-400 pr-3">
                    {lang === 'ar-SA' ? 'قصة العمل' : 'Overview'}
                  </h3>
                  <p className="text-zinc-300 leading-relaxed text-xs sm:text-sm">
                    {details?.overview || (lang === 'ar-SA' ? 'لا يوجد وصف متاح حالياً.' : 'No overview available.')}
                  </p>
                </div>

                {/* طاقم التمثيل */}
                {details?.credits?.cast?.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-amber-200 border-r-4 border-amber-400 pr-3">
                      {lang === 'ar-SA' ? 'طاقم التمثيل' : 'Cast'}
                    </h3>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                      {details.credits.cast.slice(0, 6).map((actor) => (
                        <div key={actor.id} className="bg-zinc-900/60 rounded-2xl p-2.5 text-center border border-white/5">
                          <img
                            src={actor.profile_path ? `${IMAGE_BASE_URL}${actor.profile_path}` : 'https://via.placeholder.com/100'}
                            alt={actor.name}
                            className="w-12 h-12 rounded-full object-cover mx-auto mb-1.5 border border-white/10"
                          />
                          <p className="text-[11px] font-bold text-white truncate">{actor.name}</p>
                          <p className="text-[9px] text-zinc-400 truncate">{actor.character}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* الإعلان التشويقي Trailer */}
                {trailer && (
                  <div className="space-y-3 pt-2">
                    <h3 className="text-sm font-bold text-amber-200 border-r-4 border-amber-400 pr-3">
                      {lang === 'ar-SA' ? 'الإعلان الرسمي (Trailer)' : 'Official Trailer'}
                    </h3>
                    <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/10 bg-black shadow-2xl">
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

// ---------------- مكونات فرعية ومساعدة لمزيد من التنظيم والأداء ----------------

// 1. صف أفقي احترافي متجاوب (Horizontal Row)
function SectionRow({ title, items, loading, onItemClick, isInMyList, toggleMyList, onViewAll, lang }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-amber-100">{title}</h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs font-semibold text-amber-400 hover:underline"
          >
            {lang === 'ar-SA' ? 'عرض الكل ←' : 'See All →'}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-32 sm:w-36">
              <CardSkeleton />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-3.5 overflow-x-auto pb-2 scrollbar-hide">
          {items.map((item) => (
            <div key={item.id} className="flex-shrink-0 w-32 sm:w-36">
              <PosterCard
                item={item}
                onItemClick={() => onItemClick(item)}
                isInMyList={isInMyList(item.id)}
                toggleMyList={() => toggleMyList(item)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 2. بطاقة البوستر السينمائية المحسّنة (Poster Card 2:3)
function PosterCard({ item, onItemClick, isInMyList, toggleMyList }) {
  return (
    <div className="group relative cursor-pointer rounded-2xl overflow-hidden bg-zinc-900/80 border border-white/5 hover:border-amber-500/50 transition duration-300 shadow-md">
      <div onClick={onItemClick} className="aspect-[2/3] w-full overflow-hidden relative">
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

        {/* Badge التقييم */}
        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md text-amber-300 border border-amber-500/20 px-1.5 py-0.5 rounded-md text-[10px] font-bold">
          ★ {item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}
        </div>

        {/* زر الإضافة السريعة لقائمتي */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleMyList();
          }}
          className="absolute top-2 left-2 w-7 h-7 bg-black/70 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center text-xs text-white hover:bg-amber-400 hover:text-black transition"
        >
          {isInMyList ? '✓' : '＋'}
        </button>

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
      </div>

      <div onClick={onItemClick} className="p-2 space-y-0.5">
        <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-300 transition">
          {item.title || item.name}
        </h4>
        <p className="text-[10px] text-zinc-400">
          {item.release_date?.substring(0, 4) || item.first_air_date?.substring(0, 4) || '—'}
        </p>
      </div>
    </div>
  );
}

// 3. أزرار شريط التنقل السفلي المودرن
function NavButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 px-3 py-1 rounded-2xl transition duration-300 ${
        active
          ? 'text-amber-400 font-bold scale-105'
          : 'text-zinc-400 hover:text-zinc-200'
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span className="text-[10px]">{label}</span>
      {active && <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-0.5" />}
    </button>
  );
}

// 4. هياكل عظمية للتحميل (Skeletons)
function CardSkeleton() {
  return (
    <div className="rounded-2xl bg-zinc-900 border border-white/5 overflow-hidden animate-skeleton">
      <div className="aspect-[2/3] bg-zinc-800" />
      <div className="p-2 space-y-1.5">
        <div className="h-3 bg-zinc-800 rounded w-3/4" />
        <div className="h-2 bg-zinc-800 rounded w-1/2" />
      </div>
    </div>
  );
}

function HeroSkeleton() {
  return (
    <div className="h-[380px] sm:h-[460px] bg-zinc-900 rounded-3xl animate-skeleton border border-white/5" />
  );
}
