import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  fetchTrending,
  fetchTopRated,
  fetchUpcomingOrPopular,
  searchMedia,
  fetchDetails,
  fetchGenres,
  fetchByGenre,
  fetchByCompany,
  IMAGE_BASE_URL,
  BACKDROP_BASE_URL
} from './services/tmdb';

// قائمة شركات الإنتاج الشهيرة
const COMPANIES = [
  { id: 420, name: 'مارفل سينماتيك - Marvel', logo: '⚡' },
  { id: 2, name: 'والت ديزني - Walt Disney', logo: '🏰' },
  { id: 33, name: 'يونيفيرسال - Universal', logo: '🌐' },
  { id: 174, name: 'وارنر برذرز - Warner Bros', logo: '🛡️' },
  { id: 213, name: 'نتفليكس - Netflix', logo: '🎬' },
  { id: 3186, name: 'إتش بي أوه - HBO', logo: '👑' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [lang, setLang] = useState('ar-SA');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // قائمة "قائمتي"
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
  const [companyMovies, setCompanyMovies] = useState({});

  // بيانات الشبكة العامة
  const [gridItems, setGridItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // التصنيفات والفلترة
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [tempGenre, setTempGenre] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);

  // التفاصيل والإعلان (Trailer)
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemType, setSelectedItemType] = useState('movie');
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [trailerKey, setTrailerKey] = useState(null);

  // مراقبة التمرير
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 30);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
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

  // جلب محتوى الصفحة الرئيسية
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

        const companyResults = {};
        await Promise.all(
          COMPANIES.map(async (comp) => {
            const res = await fetchByCompany(comp.id, 1, lang);
            companyResults[comp.id] = res.results || [];
          })
        );
        setCompanyMovies(companyResults);
        setLoading(false);
      };
      loadHomeContent();
    }
  }, [activeTab, searchQuery, selectedGenre, lang]);

  // جلب محتوى العرض الشبكي
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

  // جلب التفاصيل
  useEffect(() => {
    if (!selectedItem) {
      setDetails(null);
      return;
    }
    const getDetails = async () => {
      setDetailsLoading(true);
      const data = await fetchDetails(selectedItemType, selectedItem.id, lang);
      setDetails(data);
      const trailer = data?.videos?.results?.find(
        (vid) => vid.site === 'YouTube' && (vid.type === 'Trailer' || vid.type === 'Teaser')
      );
      setTrailerKey(trailer ? trailer.key : null);
      setDetailsLoading(false);
    };
    getDetails();
  }, [selectedItem, selectedItemType, lang]);

  // تشغيل الإعلان التشويقي
  const handlePlayTrailer = useCallback(async (item, type = 'movie') => {
    if (!item) return;
    if (item.videos?.results) {
      const trailer = item.videos.results.find(
        (vid) => vid.site === 'YouTube' && (vid.type === 'Trailer' || vid.type === 'Teaser')
      );
      if (trailer) {
        setTrailerKey(trailer.key);
        return;
      }
    }
    const data = await fetchDetails(type, item.id, lang);
    const trailer = data?.videos?.results?.find(
      (vid) => vid.site === 'YouTube' && (vid.type === 'Trailer' || vid.type === 'Teaser')
    );
    if (trailer) {
      setTrailerKey(trailer.key);
    } else {
      alert(lang === 'ar-SA' ? 'عذراً، الإعلان التشويقي غير متوفر حالياً' : 'Trailer not available');
    }
  }, [lang]);

  const toggleMyList = useCallback((item, type = 'movie') => {
    setMyList((prev) => {
      const exists = prev.some((i) => i.id === item.id);
      if (exists) {
        return prev.filter((i) => i.id !== item.id);
      }
      return [...prev, { ...item, media_type: type }];
    });
  }, []);

  const isInMyList = useCallback((itemId) => myList.some((i) => i.id === itemId), [myList]);

  const handleOpenDetails = useCallback((item, type = 'movie') => {
    setSelectedItemType(type);
    setSelectedItem(item);
  }, []);

  const featuredItem = useMemo(() => (trendingList.length > 0 ? trendingList[0] : null), [trendingList]);

  return (
    <div
      className="min-h-screen bg-[#05070A] text-[#F8FAFC] antialiased pb-24 font-sans selection:bg-[#3B82F6] selection:text-white"
      dir={lang === 'ar-SA' ? 'rtl' : 'ltr'}
    >
      {/* 1. Header */}
      <header
        className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
          scrolled
            ? 'bg-[#05070A]/90 backdrop-blur-md border-b border-[#3B82F6]/20 py-3 shadow-2xl'
            : 'bg-gradient-to-b from-[#05070A]/90 via-[#05070A]/40 to-transparent py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#3B82F6] flex items-center justify-center text-white font-black text-xl shadow-lg shadow-[#3B82F6]/30">
              ▶
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-wider text-white">
              MOV<span className="text-[#3B82F6]">IX</span>
            </h1>
          </div>

          <button
            onClick={() => setLang((prev) => (prev === 'ar-SA' ? 'en-US' : 'ar-SA'))}
            className="text-[#60A5FA] bg-[#3B82F6]/10 border border-[#3B82F6]/30 hover:border-[#3B82F6] px-4 py-1.5 rounded-full text-xs font-bold transition active:scale-95"
          >
            {lang === 'ar-SA' ? 'EN' : 'العربية'}
          </button>
        </div>
      </header>

      <main className="pt-16 max-w-7xl mx-auto px-4 md:px-8 space-y-8">
        
        {/* 2. شريط البحث والتصنيف */}
        <div className="pt-2 space-y-3">
          <div className="relative max-w-2xl mx-auto">
            <input
              type="text"
              placeholder={lang === 'ar-SA' ? 'ابحث عن فيلم، مسلسل...' : 'Search movies, TV shows...'}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedGenre('');
                setPage(1);
              }}
              className="w-full bg-[#111827] text-white placeholder-[#94A3B8] border border-[#3B82F6]/20 focus:border-[#3B82F6] px-5 py-3.5 pr-11 rounded-2xl focus:outline-none text-sm transition shadow-xl"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] text-sm">🔍</span>
          </div>

          <div className="flex items-center justify-between pt-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
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
                className="flex items-center gap-2 bg-[#111827] text-[#60A5FA] border border-[#3B82F6]/30 hover:border-[#3B82F6] px-4 py-1.5 rounded-xl text-xs font-bold transition active:scale-95"
              >
                <span>⚙️</span>
                <span>{lang === 'ar-SA' ? 'التصنيف' : 'Genres'}</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. الصفحة الرئيسية */}
        {activeTab === 'home' && !searchQuery && !selectedGenre ? (
          <div className="space-y-10">

            {/* Hero Banner */}
            {loading ? (
              <HeroSkeleton />
            ) : (
              featuredItem && (
                <div className="relative rounded-3xl overflow-hidden bg-[#111827] border border-[#3B82F6]/20 shadow-2xl group">
                  <div className="relative h-[380px] sm:h-[460px] md:h-[520px] w-full">
                    <img
                      src={`${BACKDROP_BASE_URL}${featuredItem.backdrop_path || featuredItem.poster_path}`}
                      alt={featuredItem.title || featuredItem.name}
                      className="w-full h-full object-cover object-top transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#05070A] via-[#05070A]/50 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#05070A]/80 via-transparent to-transparent" />

                    <div className="absolute bottom-6 inset-x-6 md:inset-x-10 space-y-3 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <span className="bg-[#3B82F6] text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-md uppercase tracking-wider shadow-md shadow-[#3B82F6]/40">
                          🔥 {lang === 'ar-SA' ? 'الأكثر تداولاً' : 'Trending'}
                        </span>
                        <span className="bg-[#111827]/80 border border-[#3B82F6]/40 text-[#60A5FA] px-2 py-0.5 rounded-md text-xs font-bold">
                          ★ {featuredItem.vote_average?.toFixed(1)}
                        </span>
                      </div>

                      <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white leading-tight">
                        {featuredItem.title || featuredItem.name}
                      </h2>

                      <p className="text-xs sm:text-sm text-[#94A3B8] line-clamp-2 sm:line-clamp-3">
                        {featuredItem.overview || (lang === 'ar-SA' ? 'فيلم سينمائي مميز متوفر للعرض الآن.' : 'Featured movie available now.')}
                      </p>

                      <div className="flex items-center gap-3 pt-2">
                        <button
                          onClick={() => handlePlayTrailer(featuredItem, 'movie')}
                          className="flex items-center gap-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-extrabold px-6 py-3 rounded-xl shadow-lg shadow-[#3B82F6]/30 text-xs sm:text-sm transition active:scale-95"
                        >
                          <span>▶</span>
                          <span>{lang === 'ar-SA' ? 'شاهد الآن' : 'Watch Now'}</span>
                        </button>

                        <button
                          onClick={() => handleOpenDetails(featuredItem, 'movie')}
                          className="flex items-center gap-2 bg-[#111827]/80 hover:bg-[#111827] text-white font-bold px-5 py-3 rounded-xl border border-[#3B82F6]/30 text-xs sm:text-sm transition active:scale-95"
                        >
                          <span>ℹ️</span>
                          <span>{lang === 'ar-SA' ? 'التفاصيل' : 'Details'}</span>
                        </button>

                        <button
                          onClick={() => toggleMyList(featuredItem, 'movie')}
                          className="w-11 h-11 bg-[#111827]/80 hover:bg-[#111827] text-white font-bold rounded-xl border border-[#3B82F6]/30 flex items-center justify-center transition active:scale-95"
                        >
                          {isInMyList(featuredItem.id) ? '✓' : '＋'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}

            {/* الأقسام المختلفة */}
            <SectionRow
              title={lang === 'ar-SA' ? '🔥 الأكثر تداولاً' : '🔥 Trending This Week'}
              items={trendingList}
              loading={loading}
              onItemClick={(item) => handleOpenDetails(item, 'movie')}
              onPlayTrailer={(item) => handlePlayTrailer(item, 'movie')}
              isInMyList={isInMyList}
              toggleMyList={toggleMyList}
              onViewAll={() => setActiveTab('movies')}
              lang={lang}
            />

            <SectionRow
              title={lang === 'ar-SA' ? '🎬 أحدث الأفلام' : '🎬 Latest Movies'}
              items={latestMoviesList}
              loading={loading}
              onItemClick={(item) => handleOpenDetails(item, 'movie')}
              onPlayTrailer={(item) => handlePlayTrailer(item, 'movie')}
              isInMyList={isInMyList}
              toggleMyList={toggleMyList}
              onViewAll={() => setActiveTab('movies')}
              lang={lang}
            />

            <SectionRow
              title={lang === 'ar-SA' ? '⭐ الأعلى تقييماً' : '⭐ Top Rated'}
              items={topRatedList}
              loading={loading}
              onItemClick={(item) => handleOpenDetails(item, 'movie')}
              onPlayTrailer={(item) => handlePlayTrailer(item, 'movie')}
              isInMyList={isInMyList}
              toggleMyList={toggleMyList}
              onViewAll={() => setActiveTab('movies')}
              lang={lang}
            />

            <SectionRow
              title={lang === 'ar-SA' ? '📺 المسلسلات الرائجة' : '📺 Popular TV Series'}
              items={trendingTvList}
              loading={loading}
              onItemClick={(item) => handleOpenDetails(item, 'tv')}
              onPlayTrailer={(item) => handlePlayTrailer(item, 'tv')}
              isInMyList={isInMyList}
              toggleMyList={(item) => toggleMyList(item, 'tv')}
              onViewAll={() => setActiveTab('tv')}
              lang={lang}
            />

            {/* شركات الإنتاج بصفوف أفقية */}
            <div className="space-y-8 pt-4 border-t border-[#3B82F6]/20">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏢</span>
                <h3 className="text-lg font-black text-white">
                  {lang === 'ar-SA' ? 'أعمال شركات الإنتاج العالمية' : 'Production Companies Showcase'}
                </h3>
              </div>

              {COMPANIES.map((company) => (
                <SectionRow
                  key={company.id}
                  title={`${company.logo} ${company.name}`}
                  items={companyMovies[company.id] || []}
                  loading={loading}
                  onItemClick={(item) => handleOpenDetails(item, 'movie')}
                  onPlayTrailer={(item) => handlePlayTrailer(item, 'movie')}
                  isInMyList={isInMyList}
                  toggleMyList={toggleMyList}
                  lang={lang}
                />
              ))}
            </div>

          </div>
        ) : activeTab === 'mylist' ? (
          
          /* قائمتي */
          <div className="space-y-6">
            {myList.length === 0 ? (
              <div className="text-center py-20 text-[#94A3B8] space-y-3">
                <span className="text-4xl">📂</span>
                <p className="text-sm">{lang === 'ar-SA' ? 'قائمتك فارغة حالياً.' : 'Your list is empty.'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {myList.map((item) => (
                  <PosterCard
                    key={item.id}
                    item={item}
                    onItemClick={() => handleOpenDetails(item, item.media_type || 'movie')}
                    onPlayTrailer={() => handlePlayTrailer(item, item.media_type || 'movie')}
                    isInMyList={isInMyList(item.id)}
                    toggleMyList={() => toggleMyList(item, item.media_type || 'movie')}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (

          /* العرض الشبكي */
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
                      onPlayTrailer={() => handlePlayTrailer(item, activeTab === 'tv' ? 'tv' : 'movie')}
                      isInMyList={isInMyList(item.id)}
                      toggleMyList={() => toggleMyList(item, activeTab === 'tv' ? 'tv' : 'movie')}
                    />
                  ))}
                </div>

                <div className="flex justify-center items-center gap-4 pt-6">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    className="px-4 py-2 bg-[#111827] border border-[#3B82F6]/30 rounded-xl text-xs font-bold text-[#60A5FA] disabled:opacity-30 active:scale-95"
                  >
                    {lang === 'ar-SA' ? 'السابق' : 'Prev'}
                  </button>
                  <span className="text-xs font-bold text-[#94A3B8]">
                    {page} / {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-4 py-2 bg-[#111827] border border-[#3B82F6]/30 rounded-xl text-xs font-bold text-[#60A5FA] disabled:opacity-30 active:scale-95"
                  >
                    {lang === 'ar-SA' ? 'التالي' : 'Next'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

      </main>

      {/* 4. Bottom Navigation (مطابق للتصميم بحدود مضيئة) */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-[#05070A]/95 border-t border-[#3B82F6]/30 py-2.5 px-6 max-w-md md:max-w-xl mx-auto rounded-t-3xl shadow-2xl backdrop-blur-lg flex items-center justify-around">
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

      {/* 5. مشغل التريلر المباشر */}
      {trailerKey && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl aspect-video rounded-3xl overflow-hidden bg-black border border-[#3B82F6]/40 shadow-2xl">
            <button
              onClick={() => setTrailerKey(null)}
              className="absolute top-4 right-4 z-50 bg-[#3B82F6] hover:bg-[#2563EB] text-white w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition"
            >
              ✕
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
              title="Trailer"
              className="w-full h-full border-0"
              allow="autoplay; encrypted-media"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}

      {/* 6. Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#111827] border border-[#3B82F6]/30 rounded-3xl w-full max-w-sm p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#3B82F6]/20 pb-3">
              <h3 className="text-sm font-bold text-white">
                {lang === 'ar-SA' ? 'اختر التصنيف' : 'Select Genre'}
              </h3>
              <button onClick={() => setShowFilterModal(false)} className="text-[#94A3B8] hover:text-white">✕</button>
            </div>

            <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
              <button
                onClick={() => setTempGenre('')}
                className={`py-2 rounded-xl text-xs font-bold border transition ${
                  tempGenre === '' ? 'bg-[#3B82F6] text-white border-[#3B82F6]' : 'bg-[#05070A] text-[#94A3B8] border-[#3B82F6]/10'
                }`}
              >
                {lang === 'ar-SA' ? 'الكل' : 'All'}
              </button>
              {genres.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setTempGenre(g.id)}
                  className={`py-2 rounded-xl text-xs font-bold truncate border px-1 transition ${
                    String(tempGenre) === String(g.id)
                      ? 'bg-[#3B82F6] text-white border-[#3B82F6]'
                      : 'bg-[#05070A] text-[#94A3B8] border-[#3B82F6]/10'
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
              className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-extrabold py-3 rounded-2xl text-xs active:scale-95 transition shadow-lg shadow-[#3B82F6]/30"
            >
              {lang === 'ar-SA' ? 'تطبيق' : 'Apply'}
            </button>
          </div>
        </div>
      )}

      {/* 7. Modal التفاصيل */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-[#05070A] overflow-y-auto min-h-screen text-[#F8FAFC]">
          <button
            onClick={() => setSelectedItem(null)}
            className="fixed top-5 right-5 z-50 bg-[#111827]/90 hover:bg-[#3B82F6] hover:text-white text-white px-4 py-2 rounded-full transition border border-[#3B82F6]/30 text-xs font-bold shadow-2xl flex items-center gap-1.5 active:scale-95"
          >
            ✕ {lang === 'ar-SA' ? 'إغلاق' : 'Close'}
          </button>

          {detailsLoading ? (
            <div className="flex justify-center items-center h-screen">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#3B82F6] border-t-transparent"></div>
            </div>
          ) : (
            <div className="pb-24">
              <div className="relative w-full h-[55vh] md:h-[65vh] bg-[#05070A]">
                {details?.backdrop_path ? (
                  <img
                    src={`${BACKDROP_BASE_URL}${details.backdrop_path}`}
                    alt={details?.title || details?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#94A3B8]">No Image</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#05070A] via-[#05070A]/60 to-transparent" />

                <div className="absolute bottom-6 px-6 max-w-5xl mx-auto w-full flex items-end gap-6">
                  {details?.poster_path && (
                    <img
                      src={`${IMAGE_BASE_URL}${details.poster_path}`}
                      alt="Poster"
                      className="w-32 md:w-44 rounded-2xl shadow-2xl border border-[#3B82F6]/30 hidden sm:block aspect-[2/3] object-cover"
                    />
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-[#3B82F6] text-white font-extrabold px-2 py-0.5 rounded text-[11px]">
                        ★ {details?.vote_average?.toFixed(1)}
                      </span>
                      <span className="text-xs text-[#94A3B8] font-medium">
                        {details?.release_date?.substring(0, 4) || details?.first_air_date?.substring(0, 4)}
                      </span>
                      {details?.runtime && (
                        <span className="text-xs text-[#94A3B8]">
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

              <div className="max-w-4xl mx-auto px-6 mt-6 space-y-8">
                
                {/* قسم أزرار التفاعل (التريلر باللون الأزرق) */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-2">
                    {details?.genres?.map((g) => (
                      <span
                        key={g.id}
                        className="bg-[#111827] text-[#60A5FA] px-3 py-1 rounded-xl text-xs font-semibold border border-[#3B82F6]/20"
                      >
                        {g.name}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handlePlayTrailer(details, selectedItemType)}
                      className="flex items-center gap-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-[#3B82F6]/30 transition active:scale-95"
                    >
                      <span>▶</span>
                      <span>{lang === 'ar-SA' ? 'شاهد التريلر' : 'Watch Trailer'}</span>
                    </button>

                    <button
                      onClick={() => toggleMyList(details, selectedItemType)}
                      className="flex items-center gap-2 bg-[#111827] border border-[#3B82F6]/30 text-white font-bold px-4 py-2.5 rounded-xl text-xs hover:border-[#3B82F6] transition active:scale-95"
                    >
                      <span>{isInMyList(details?.id) ? '✓' : '＋'}</span>
                      <span>{isInMyList(details?.id) ? (lang === 'ar-SA' ? 'في قائمتي' : 'In List') : (lang === 'ar-SA' ? 'أضف لقائمتي' : 'Add to List')}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-white border-r-4 border-[#3B82F6] pr-3">
                    {lang === 'ar-SA' ? 'قصة العمل' : 'Overview'}
                  </h3>
                  <p className="text-[#94A3B8] leading-relaxed text-xs sm:text-sm">
                    {details?.overview || (lang === 'ar-SA' ? 'لا يوجد وصف متاح حالياً.' : 'No overview available.')}
                  </p>
                </div>

                {/* طاقم التمثيل */}
                {details?.credits?.cast?.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-white border-r-4 border-[#3B82F6] pr-3">
                      {lang === 'ar-SA' ? 'طاقم التمثيل' : 'Cast'}
                    </h3>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                      {details.credits.cast.slice(0, 6).map((actor) => (
                        <div key={actor.id} className="bg-[#111827]/80 rounded-2xl p-2.5 text-center border border-[#3B82F6]/10">
                          <img
                            src={actor.profile_path ? `${IMAGE_BASE_URL}${actor.profile_path}` : 'https://via.placeholder.com/100'}
                            alt={actor.name}
                            className="w-12 h-12 rounded-full object-cover mx-auto mb-1.5 border border-[#3B82F6]/30"
                            loading="lazy"
                          />
                          <p className="text-[11px] font-bold text-white truncate">{actor.name}</p>
                          <p className="text-[9px] text-[#94A3B8] truncate">{actor.character}</p>
                        </div>
                      ))}
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

// ---------------- مكونات فرعية ----------------

const SectionRow = React.memo(({ title, items, loading, onItemClick, onPlayTrailer, isInMyList, toggleMyList, onViewAll, lang }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-white">{title}</h3>
        {onViewAll && (
          <button onClick={onViewAll} className="text-xs font-semibold text-[#60A5FA] hover:underline">
            {lang === 'ar-SA' ? 'عرض الكل ←' : 'See All →'}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-32 sm:w-36">
              <CardSkeleton />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-3.5 overflow-x-auto pb-2">
          {items.map((item) => (
            <div key={item.id} className="flex-shrink-0 w-32 sm:w-36">
              <PosterCard
                item={item}
                onItemClick={() => onItemClick(item)}
                onPlayTrailer={() => onPlayTrailer(item)}
                isInMyList={isInMyList(item.id)}
                toggleMyList={() => toggleMyList(item)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

const PosterCard = React.memo(({ item, onItemClick, onPlayTrailer, isInMyList, toggleMyList }) => {
  return (
    <div className="group relative cursor-pointer rounded-2xl overflow-hidden bg-[#111827] border border-[#3B82F6]/10 hover:border-[#3B82F6]/60 transition duration-300 shadow-lg">
      <div className="aspect-[2/3] w-full overflow-hidden relative">
        {item.poster_path ? (
          <img
            src={`${IMAGE_BASE_URL}${item.poster_path}`}
            alt={item.title || item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            loading="lazy"
            onClick={onItemClick}
          />
        ) : (
          <div onClick={onItemClick} className="w-full h-full flex items-center justify-center text-[#94A3B8] text-xs">
            No Poster
          </div>
        )}

        <div className="absolute top-2 right-2 bg-[#05070A]/80 text-[#60A5FA] border border-[#3B82F6]/30 px-1.5 py-0.5 rounded-md text-[10px] font-bold">
          ★ {item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onPlayTrailer();
          }}
          className="absolute inset-0 m-auto w-10 h-10 bg-[#3B82F6] text-white rounded-full flex items-center justify-center text-sm font-black shadow-xl shadow-[#3B82F6]/50 opacity-0 group-hover:opacity-100 transition duration-200 transform scale-90 group-hover:scale-100"
        >
          ▶
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleMyList();
          }}
          className="absolute top-2 left-2 w-7 h-7 bg-[#05070A]/80 rounded-full border border-[#3B82F6]/30 flex items-center justify-center text-xs text-white hover:bg-[#3B82F6] transition active:scale-90"
        >
          {isInMyList ? '✓' : '＋'}
        </button>
      </div>

      <div onClick={onItemClick} className="p-2 space-y-0.5">
        <h4 className="text-xs font-bold text-white truncate group-hover:text-[#60A5FA] transition">
          {item.title || item.name}
        </h4>
        <p className="text-[10px] text-[#94A3B8]">
          {item.release_date?.substring(0, 4) || item.first_air_date?.substring(0, 4) || '—'}
        </p>
      </div>
    </div>
  );
});

function NavButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 px-3 py-1 rounded-2xl transition duration-200 active:scale-90 ${
        active ? 'text-[#3B82F6] font-bold scale-105' : 'text-[#94A3B8] hover:text-white'
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span className="text-[10px]">{label}</span>
      {active && <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] mt-0.5 shadow-sm shadow-[#3B82F6]" />}
    </button>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl bg-[#111827] border border-[#3B82F6]/10 overflow-hidden">
      <div className="aspect-[2/3] bg-[#05070A] animate-pulse" />
      <div className="p-2 space-y-1.5">
        <div className="h-3 bg-[#05070A] rounded w-3/4 animate-pulse" />
        <div className="h-2 bg-[#05070A] rounded w-1/2 animate-pulse" />
      </div>
    </div>
  );
}

function HeroSkeleton() {
  return (
    <div className="h-[380px] sm:h-[460px] bg-[#111827] rounded-3xl animate-pulse border border-[#3B82F6]/10" />
  );
}
