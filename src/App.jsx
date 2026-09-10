import React, { useState, useEffect, useMemo, useCallback } from 'react';
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

// قائمة شركات الإنتاج العالمية الشهيرة والمعرفات الخاصة بها في TMDB
const STUDIOS = [
  { id: 213, name: 'Netflix', logo: 'https://image.tmdb.org/t/p/w200/wwemzKW8219fCA3y023392.png' },
  { id: 2, name: 'Walt Disney', logo: 'https://image.tmdb.org/t/p/w200/wdrCwoL3Bx8pM32pP3C311.png' },
  { id: 420, name: 'Marvel Studios', logo: 'https://image.tmdb.org/t/p/w200/hU3A9R9fA420133.png' },
  { id: 174, name: 'Warner Bros.', logo: 'https://image.tmdb.org/t/p/w200/vRu23414115.png' },
  { id: 49, name: 'HBO', logo: 'https://image.tmdb.org/t/p/w200/tuomPhY213.png' },
  { id: 33, name: 'Universal', logo: 'https://image.tmdb.org/t/p/w200/83o331.png' },
  { id: 4, name: 'Paramount', logo: 'https://image.tmdb.org/t/p/w200/420Paramount.png' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'movies' | 'tv' | 'mylist'
  const [lang, setLang] = useState('ar-SA');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // إدارة القائمة الشخصية (قائمتي)
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

  // مؤشر البانر الرئيسي للتقليب التلقائي
  const [heroIndex, setHeroIndex] = useState(0);

  // أفلام شركات الإنتاج (لكل شركة)
  const [studioMoviesMap, setStudioMoviesMap] = useState({});

  // بيانات الشبكة والبحث
  const [gridItems, setGridItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // التصنيفات والفلترة حسب الشركة أو Genre
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedStudio, setSelectedStudio] = useState(null);
  const [tempGenre, setTempGenre] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);

  // التفاصيل ومشغل التريلر
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemType, setSelectedItemType] = useState('movie');
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [trailerKey, setTrailerKey] = useState(null);

  // إعادة ضبط التصفح والفلترة
  const resetFilters = useCallback(() => {
    setSelectedGenre('');
    setSelectedStudio(null);
    setSearchQuery('');
    setPage(1);
  }, []);

  // حفظ القائمة الشخصية تلقائياً
  useEffect(() => {
    try {
      localStorage.setItem('movix_my_list', JSON.stringify(myList));
    } catch (err) {
      console.error('Error saving my list to localStorage:', err);
    }
  }, [myList]);

  // جلب التصنيفات بناءً على النوع الحالي
  useEffect(() => {
    let isMounted = true;
    const getGenresList = async () => {
      const type = activeTab === 'tv' ? 'tv' : 'movie';
      try {
        const list = await fetchGenres(type, lang);
        if (isMounted) setGenres(list || []);
      } catch (err) {
        console.error('Error fetching genres:', err);
      }
    };
    getGenresList();
    return () => { isMounted = false; };
  }, [activeTab, lang]);

  // جلب محتوى الصفحة الرئيسية (الأقسام الرئيسية + أعمال شركات الإنتاج)
  useEffect(() => {
    if (activeTab === 'home' && !searchQuery && !selectedGenre && !selectedStudio) {
      let isMounted = true;
      const loadHomeContent = async () => {
        setLoading(true);
        try {
          const [trending, upcoming, topRated, tvTrending] = await Promise.all([
            fetchTrending('movie', 1, lang),
            fetchUpcomingOrPopular('movie', 1, lang),
            fetchTopRated('movie', 1, lang),
            fetchTrending('tv', 1, lang)
          ]);

          if (!isMounted) return;

          setTrendingList(trending?.results || []);
          setLatestMoviesList(upcoming?.results || []);
          setTopRatedList(topRated?.results || []);
          setTrendingTvList(tvTrending?.results || []);

          // جلب أفلام الشركات بشكل متوازي
          const studioResults = await Promise.all(
            STUDIOS.map(async (s) => {
              const res = await fetchByGenre('movie', '', 1, lang, s.id);
              return { id: s.id, items: res?.results || [] };
            })
          );

          if (!isMounted) return;

          const sMap = studioResults.reduce((acc, sr) => {
            acc[sr.id] = sr.items;
            return acc;
          }, {});
          setStudioMoviesMap(sMap);

        } catch (err) {
          console.error('Error fetching home content:', err);
        } finally {
          if (isMounted) setLoading(false);
        }
      };
      loadHomeContent();
      return () => { isMounted = false; };
    }
  }, [activeTab, searchQuery, selectedGenre, selectedStudio, lang]);

  // تقليب البانر الرئيسي تلقائياً كل 5 ثوانٍ
  useEffect(() => {
    if (trendingList.length === 0) return;
    const interval = setInterval(() => {
      setHeroIndex((prevIndex) => (prevIndex + 1) % Math.min(trendingList.length, 5));
    }, 5000);
    return () => clearInterval(interval);
  }, [trendingList]);

  // جلب المحتوى الشبكي (عند البحث، تصفح تصنيف، أو شركة)
  useEffect(() => {
    if (activeTab !== 'home' || searchQuery || selectedGenre || selectedStudio) {
      let isMounted = true;
      const loadGridContent = async () => {
        setLoading(true);
        const type = activeTab === 'tv' ? 'tv' : 'movie';
        let data;

        try {
          if (searchQuery.trim()) {
            data = await searchMedia(searchQuery, type, page, lang);
          } else if (selectedGenre) {
            data = await fetchByGenre(type, selectedGenre, page, lang);
          } else if (selectedStudio) {
            data = await fetchByGenre(type, '', page, lang, selectedStudio.id);
          } else {
            data = await fetchTrending(type, page, lang);
          }

          if (isMounted) {
            setGridItems(data?.results || []);
            setTotalPages(data?.total_pages || 1);
          }
        } catch (err) {
          console.error('Error fetching grid items:', err);
        } finally {
          if (isMounted) setLoading(false);
        }
      };
      loadGridContent();
      return () => { isMounted = false; };
    }
  }, [activeTab, page, searchQuery, selectedGenre, selectedStudio, lang]);

  // جلب التفاصيل والتريلر
  useEffect(() => {
    if (!selectedItem) {
      setDetails(null);
      return;
    }
    let isMounted = true;
    const getDetails = async () => {
      setDetailsLoading(true);
      try {
        const data = await fetchDetails(selectedItemType, selectedItem.id, lang);
        if (!isMounted) return;
        setDetails(data);
        const trailer = data?.videos?.results?.find(
          (vid) => vid.site === 'YouTube' && (vid.type === 'Trailer' || vid.type === 'Teaser')
        );
        setTrailerKey(trailer ? trailer.key : null);
      } catch (err) {
        console.error('Error fetching details:', err);
      } finally {
        if (isMounted) setDetailsLoading(false);
      }
    };
    getDetails();
    return () => { isMounted = false; };
  }, [selectedItem, selectedItemType, lang]);

  // تشغيل الإعلان التشويقي
  const handlePlayTrailer = useCallback(async (item, type = 'movie') => {
    if (!item) return;
    try {
      const data = await fetchDetails(type, item.id, lang);
      const trailer = data?.videos?.results?.find(
        (vid) => vid.site === 'YouTube' && (vid.type === 'Trailer' || vid.type === 'Teaser')
      );
      if (trailer) {
        setTrailerKey(trailer.key);
      } else {
        alert(lang === 'ar-SA' ? 'عذراً، الإعلان التشويقي غير متوفر حالياً' : 'Trailer not available');
      }
    } catch {
      alert(lang === 'ar-SA' ? 'حدث خطأ في جلب العرض التشويقي' : 'Error loading trailer');
    }
  }, [lang]);

  // إضافة / إزالة من قائمتي
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
    setSelectedItemType(item.media_type || type);
    setSelectedItem(item);
  }, []);

  const featuredItem = useMemo(() => {
    if (trendingList.length > 0) {
      return trendingList[heroIndex] || trendingList[0];
    }
    return null;
  }, [trendingList, heroIndex]);

  const genresMap = useMemo(() => {
    return genres.reduce((acc, g) => {
      acc[g.id] = g.name;
      return acc;
    }, {});
  }, [genres]);

  return (
    <div
      className="min-h-screen bg-[#05070A] text-[#F8FAFC] antialiased pb-20 font-sans max-w-md mx-auto relative overflow-hidden"
      dir={lang === 'ar-SA' ? 'rtl' : 'ltr'}
    >
      {/* 1. الشريط العلوي Header */}
      <header className="pt-4 px-5 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => {
          setActiveTab('home');
          resetFilters();
        }}>
          <div className="w-8 h-8 rounded-lg bg-[#3B82F6] flex items-center justify-center text-white text-xs font-black shadow-md shadow-[#3B82F6]/30">
            ▶
          </div>
          <span className="text-lg font-black tracking-wider text-white">
            MOV<span className="text-[#3B82F6]">IX</span>
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setLang((p) => (p === 'ar-SA' ? 'en-US' : 'ar-SA'))}
            className="flex items-center gap-1 text-xs font-bold bg-[#111827] border border-[#1E293B] px-3 py-1 rounded-full text-[#94A3B8] active:scale-95 transition"
          >
            <span>{lang === 'ar-SA' ? 'EN' : 'العربية'}</span>
            <span>🌐</span>
          </button>

          <button
            onClick={() => {
              setTempGenre(selectedGenre);
              setShowFilterModal(true);
            }}
            className="text-white text-sm bg-[#111827] p-2 rounded-full border border-[#1E293B] active:scale-95 transition"
            title={lang === 'ar-SA' ? 'التصنيفات' : 'Filter Genres'}
          >
            🔍
          </button>

          <div className="w-8 h-8 rounded-full bg-[#111827] border border-[#1E293B] flex items-center justify-center text-xs text-[#94A3B8]">
            👤
          </div>
        </div>
      </header>

      {/* 2. حقل البحث */}
      <div className="px-4 pt-3">
        <div className="relative">
          <input
            type="text"
            placeholder={lang === 'ar-SA' ? 'ابحث عن فيلم أو مسلسل...' : 'Search movies, TV shows...'}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedGenre('');
              setSelectedStudio(null);
              setPage(1);
            }}
            className="w-full bg-[#111827] text-white placeholder-[#94A3B8] border border-[#1E293B] focus:border-[#3B82F6] px-4 py-2.5 rounded-2xl text-xs focus:outline-none transition"
          />
          <span className={`absolute top-1/2 -translate-y-1/2 text-[#94A3B8] text-xs ${lang === 'ar-SA' ? 'left-3' : 'right-3'}`}>🔍</span>
        </div>
      </div>

      <main className="px-4 pt-4 space-y-6">

        {/* 3. شريط اختيار شركات الإنتاج السريع */}
        {!searchQuery && (
          <div className="space-y-2.5">
            <h3 className="text-sm font-extrabold text-[#F8FAFC] border-r-4 border-[#3B82F6] pr-2">
              {lang === 'ar-SA' ? 'تصفح حسب الشركة' : 'Browse by Studio'}
            </h3>
            <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
              {STUDIOS.map((studio) => {
                const isSelected = selectedStudio?.id === studio.id;
                return (
                  <button
                    key={studio.id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedStudio(null);
                      } else {
                        setSelectedStudio(studio);
                        setSelectedGenre('');
                        setSearchQuery('');
                        setPage(1);
                      }
                    }}
                    className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl border flex items-center justify-center gap-1.5 transition active:scale-95 ${
                      isSelected
                        ? 'bg-[#3B82F6] border-[#3B82F6] text-white font-black shadow-lg shadow-[#3B82F6]/30'
                        : 'bg-[#111827] border-[#1E293B] hover:border-gray-700 text-[#94A3B8]'
                    }`}
                  >
                    <span className="text-xs font-bold">{studio.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. البانر الرئيسي (Hero Section) المزود بالتبديل التلقائي */}
        {activeTab === 'home' && !searchQuery && !selectedGenre && !selectedStudio && (
          loading ? (
            <div className="h-[340px] bg-[#111827] rounded-3xl animate-pulse" />
          ) : (
            featuredItem && (
              <div className="relative rounded-3xl overflow-hidden bg-[#111827] border border-[#1E293B] shadow-xl transition-all duration-500">
                <div className="relative h-[340px] w-full">
                  <img
                    src={`${BACKDROP_BASE_URL}${featuredItem.backdrop_path || featuredItem.poster_path}`}
                    alt={featuredItem.title || featuredItem.name}
                    className="w-full h-full object-cover transition-all duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#05070A] via-[#05070A]/50 to-transparent" />

                  <div className="absolute bottom-4 inset-x-4 space-y-2">
                    <div className="inline-block bg-[#3B82F6]/20 border border-[#3B82F6]/40 text-[#60A5FA] text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                      {featuredItem.genre_ids && featuredItem.genre_ids.length > 0 ? genresMap[featuredItem.genre_ids[0]] || 'مغامرة' : 'مغامرة'}
                    </div>

                    <h2 className="text-2xl font-black text-white truncate">
                      {featuredItem.title || featuredItem.name}
                    </h2>

                    <div className="flex items-center gap-2 text-[11px] text-[#94A3B8] font-medium">
                      <span>{featuredItem.genre_ids?.map((id) => genresMap[id]).filter(Boolean).slice(0, 2).join(' • ') || 'مغامرة • عائلي'}</span>
                      <span>•</span>
                      <span>{featuredItem.release_date?.substring(0, 4) || '2026'}</span>
                      <span className="bg-[#3B82F6]/20 border border-[#3B82F6]/30 text-[#60A5FA] px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                        ★ {featuredItem.vote_average?.toFixed(1) || '7.8'}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#94A3B8] line-clamp-2 leading-relaxed pt-1">
                      {featuredItem.overview || (lang === 'ar-SA' ? 'رحلة جديدة عبر المحيط...' : 'No description available.')}
                    </p>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button
                        onClick={() => handlePlayTrailer(featuredItem, 'movie')}
                        className="bg-[#3B82F6] hover:bg-blue-600 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
                      >
                        <span>▶</span>
                        <span>{lang === 'ar-SA' ? 'شاهد الآن' : 'Watch Now'}</span>
                      </button>

                      <button
                        onClick={() => toggleMyList(featuredItem, 'movie')}
                        className="bg-[#0F172A] border border-[#1E293B] text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
                      >
                        <span>{isInMyList(featuredItem.id) ? '✓' : '＋'}</span>
                        <span>{isInMyList(featuredItem.id) ? (lang === 'ar-SA' ? 'في قائمتي' : 'In List') : (lang === 'ar-SA' ? 'أضف إلى قائمتي' : 'Add to List')}</span>
                      </button>
                    </div>

                    {/* مؤشر النقاط للتقليب التلقائي */}
                    <div className="flex justify-center items-center gap-1.5 pt-2">
                      {trendingList.slice(0, 5).map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setHeroIndex(idx)}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            idx === heroIndex ? 'w-5 bg-[#3B82F6]' : 'w-1.5 bg-gray-600/50'
                          }`}
                        />
                      ))}
                    </div>

                  </div>
                </div>
              </div>
            )
          )
        )}

        {/* 5. أقسام العرض الأفقي بالصفحة الرئيسية */}
        {activeTab === 'home' && !searchQuery && !selectedGenre && !selectedStudio && (
          <div className="space-y-6">
            <HorizontalSection
              title={lang === 'ar-SA' ? '🔥 الأكثر تداولاً' : '🔥 Trending'}
              items={trendingList}
              genresMap={genresMap}
              loading={loading}
              onItemClick={(item) => handleOpenDetails(item, 'movie')}
              onViewAll={() => setActiveTab('movies')}
              lang={lang}
            />

            <HorizontalSection
              title={lang === 'ar-SA' ? '🎬 أحدث الأفلام' : '🎬 Latest Movies'}
              items={latestMoviesList}
              genresMap={genresMap}
              loading={loading}
              onItemClick={(item) => handleOpenDetails(item, 'movie')}
              onViewAll={() => setActiveTab('movies')}
              lang={lang}
            />

            <HorizontalSection
              title={lang === 'ar-SA' ? '⭐ الأعلى تقييماً' : '⭐ Top Rated'}
              items={topRatedList}
              genresMap={genresMap}
              loading={loading}
              onItemClick={(item) => handleOpenDetails(item, 'movie')}
              onViewAll={() => setActiveTab('movies')}
              lang={lang}
            />

            <HorizontalSection
              title={lang === 'ar-SA' ? '📺 المسلسلات الرائجة' : '📺 Popular TV'}
              items={trendingTvList}
              genresMap={genresMap}
              loading={loading}
              onItemClick={(item) => handleOpenDetails(item, 'tv')}
              onViewAll={() => setActiveTab('tv')}
              lang={lang}
            />

            {/* صفوف أفلام شركات الإنتاج العالمية */}
            <div className="pt-2 space-y-6 border-t border-[#1E293B]">
              <h2 className="text-base font-black text-white tracking-wide border-r-4 border-[#3B82F6] pr-2">
                {lang === 'ar-SA' ? '🏢 أعمال شركات الإنتاج' : '🏢 Production Studios Content'}
              </h2>

              {STUDIOS.map((studio) => {
                const studioItems = studioMoviesMap[studio.id] || [];
                if (studioItems.length === 0 && !loading) return null;

                return (
                  <HorizontalSection
                    key={studio.id}
                    title={`🎬 ${studio.name}`}
                    items={studioItems}
                    genresMap={genresMap}
                    loading={loading}
                    onItemClick={(item) => handleOpenDetails(item, 'movie')}
                    onViewAll={() => {
                      setSelectedStudio(studio);
                      setActiveTab('movies');
                    }}
                    lang={lang}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* 6. عرض قائمة "قائمتي" */}
        {activeTab === 'mylist' && !searchQuery && (
          <div className="space-y-4 pt-2">
            <h3 className="text-base font-black text-white border-r-4 border-[#3B82F6] pr-2">
              {lang === 'ar-SA' ? 'قائمتي المفضلّة' : 'My List'}
            </h3>

            {myList.length === 0 ? (
              <div className="text-center py-16 text-[#94A3B8] space-y-2">
                <span className="text-3xl block">🔖</span>
                <p className="text-xs">{lang === 'ar-SA' ? 'لم تقم بإضافة أي أعمال لقائمتك بعد.' : 'No items added to your list yet.'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {myList.map((item) => (
                  <MovieCard
                    key={item.id}
                    item={item}
                    genresMap={genresMap}
                    onClick={() => handleOpenDetails(item, item.media_type || 'movie')}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 7. العرض الشبكي (أفلام، مسلسلات، استوديو محدد، بحث، أو تصنيف) */}
        {(activeTab !== 'home' || searchQuery || selectedGenre || selectedStudio) && activeTab !== 'mylist' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white border-r-4 border-[#3B82F6] pr-2">
                {searchQuery
                  ? (lang === 'ar-SA' ? 'نتائج البحث' : 'Search Results')
                  : selectedStudio
                  ? (lang === 'ar-SA' ? `أعمال شركة: ${selectedStudio.name}` : `Studio: ${selectedStudio.name}`)
                  : selectedGenre
                  ? genres.find((g) => g.id === Number(selectedGenre))?.name
                  : activeTab === 'movies'
                  ? (lang === 'ar-SA' ? 'الأفلام' : 'Movies')
                  : (lang === 'ar-SA' ? 'المسلسلات' : 'TV Series')}
              </h3>

              {(selectedGenre || selectedStudio) && (
                <button
                  onClick={() => {
                    setSelectedGenre('');
                    setSelectedStudio(null);
                  }}
                  className="text-[10px] text-[#60A5FA] bg-[#3B82F6]/10 px-2.5 py-1 rounded-full border border-[#3B82F6]/30"
                >
                  {lang === 'ar-SA' ? 'إلغاء الفلتر ✕' : 'Clear Filter ✕'}
                </button>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-[#111827] rounded-2xl h-48 animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {gridItems.map((item) => (
                    <MovieCard
                      key={item.id}
                      item={item}
                      genresMap={genresMap}
                      onClick={() => handleOpenDetails(item, activeTab === 'tv' ? 'tv' : 'movie')}
                    />
                  ))}
                </div>

                {/* التنقل بين الصفحات */}
                <div className="flex justify-center items-center gap-3 pt-4">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    className="px-3 py-1.5 bg-[#111827] border border-[#1E293B] rounded-xl text-xs font-bold text-[#94A3B8] disabled:opacity-30 active:scale-95 transition"
                  >
                    {lang === 'ar-SA' ? 'السابق' : 'Prev'}
                  </button>
                  <span className="text-xs font-bold text-[#94A3B8]">
                    {page} / {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1.5 bg-[#111827] border border-[#1E293B] rounded-xl text-xs font-bold text-[#94A3B8] disabled:opacity-30 active:scale-95 transition"
                  >
                    {lang === 'ar-SA' ? 'التالي' : 'Next'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

      </main>

      {/* 8. الشريط السفلي Navigation Bar */}
      <div className="fixed bottom-0 inset-x-0 mx-auto max-w-md bg-[#05070A]/95 border-t border-[#1E293B] backdrop-blur-md z-40 py-2">
        <nav className="flex items-center justify-around px-2">
          <NavItem
            icon={
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
            }
            label={lang === 'ar-SA' ? 'الرئيسية' : 'Home'}
            active={activeTab === 'home' && !searchQuery && !selectedGenre && !selectedStudio}
            onClick={() => {
              setActiveTab('home');
              resetFilters();
            }}
          />
          <NavItem
            icon={
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>
              </svg>
            }
            label={lang === 'ar-SA' ? 'الأفلام' : 'Movies'}
            active={activeTab === 'movies' && !searchQuery && !selectedGenre && !selectedStudio}
            onClick={() => {
              setActiveTab('movies');
              resetFilters();
            }}
          />
          <NavItem
            icon={
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z"/>
              </svg>
            }
            label={lang === 'ar-SA' ? 'المسلسلات' : 'TV Series'}
            active={activeTab === 'tv' && !searchQuery && !selectedGenre && !selectedStudio}
            onClick={() => {
              setActiveTab('tv');
              resetFilters();
            }}
          />
          <NavItem
            icon={
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            }
            label={lang === 'ar-SA' ? 'قائمتي' : 'My List'}
            active={activeTab === 'mylist'}
            onClick={() => {
              setActiveTab('mylist');
              resetFilters();
            }}
          />
        </nav>
      </div>

      {/* 9. نافذة اختيار التصنيفات (Filter Modal) */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#111827] border border-[#1E293B] rounded-3xl w-full max-w-xs p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#1E293B] pb-2.5">
              <h3 className="text-xs font-bold text-white">
                {lang === 'ar-SA' ? 'اختر التصنيف' : 'Select Genre'}
              </h3>
              <button onClick={() => setShowFilterModal(false)} className="text-[#94A3B8] hover:text-white text-xs">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              <button
                onClick={() => setTempGenre('')}
                className={`py-2 rounded-xl text-xs font-bold border transition ${
                  tempGenre === '' ? 'bg-[#3B82F6] text-white border-[#3B82F6]' : 'bg-[#05070A] text-[#94A3B8] border-[#1E293B]'
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
                      : 'bg-[#05070A] text-[#94A3B8] border-[#1E293B]'
                  }`}
                >
                  {g.name}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setSelectedGenre(tempGenre);
                setSelectedStudio(null);
                setSearchQuery('');
                setPage(1);
                setShowFilterModal(false);
              }}
              className="w-full bg-[#3B82F6] hover:bg-blue-600 text-white font-extrabold py-2.5 rounded-2xl text-xs active:scale-95 transition"
            >
              {lang === 'ar-SA' ? 'تطبيق' : 'Apply'}
            </button>
          </div>
        </div>
      )}

      {/* 10. نافذة التفاصيل الفردية (Details Modal) */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-[#05070A] overflow-y-auto min-h-screen text-[#F8FAFC]">
          <button
            onClick={() => setSelectedItem(null)}
            className={`fixed top-4 z-50 bg-[#111827]/90 hover:bg-[#3B82F6] text-white px-3.5 py-1.5 rounded-full transition border border-[#1E293B] text-xs font-bold shadow-2xl flex items-center gap-1 active:scale-95 ${lang === 'ar-SA' ? 'left-4' : 'right-4'}`}
          >
            ✕ {lang === 'ar-SA' ? 'إغلاق' : 'Close'}
          </button>

          {detailsLoading ? (
            <div className="flex justify-center items-center h-screen">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#3B82F6] border-t-transparent"></div>
            </div>
          ) : (
            <div className="pb-20">
              <div className="relative w-full h-[320px] bg-[#05070A]">
                {details?.backdrop_path ? (
                  <img
                    src={`${BACKDROP_BASE_URL}${details.backdrop_path}`}
                    alt={details?.title || details?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#94A3B8] text-xs">No Image</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#05070A] via-[#05070A]/50 to-transparent" />

                <div className="absolute bottom-4 px-4 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#3B82F6] text-white font-extrabold px-1.5 py-0.5 rounded text-[10px]">
                      ★ {details?.vote_average?.toFixed(1) || '0.0'}
                    </span>
                    <span className="text-[11px] text-[#94A3B8]">
                      {details?.release_date?.substring(0, 4) || details?.first_air_date?.substring(0, 4)}
                    </span>
                  </div>
                  <h1 className="text-xl font-black text-white">
                    {details?.title || details?.name}
                  </h1>
                </div>
              </div>

              <div className="px-4 mt-4 space-y-5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex flex-wrap gap-1">
                    {details?.genres?.map((g) => (
                      <span
                        key={g.id}
                        className="bg-[#111827] text-[#94A3B8] px-2.5 py-0.5 rounded-lg text-[10px] font-semibold border border-[#1E293B]"
                      >
                        {g.name}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleMyList(details, selectedItemType)}
                      className="bg-[#111827] border border-[#1E293B] text-white font-bold px-3 py-2 rounded-xl text-xs active:scale-95 transition"
                    >
                      {isInMyList(details?.id) ? '✓' : '＋'}
                    </button>

                    <button
                      onClick={() => handlePlayTrailer(details, selectedItemType)}
                      className="bg-[#3B82F6] text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1 active:scale-95 transition"
                    >
                      <span>▶</span>
                      <span>{lang === 'ar-SA' ? 'التريلر' : 'Trailer'}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h3 className={`text-xs font-bold text-white border-l-2 border-[#3B82F6] ${lang === 'ar-SA' ? 'border-r-2 border-l-0 pr-2' : 'pl-2'}`}>
                    {lang === 'ar-SA' ? 'القصة' : 'Overview'}
                  </h3>
                  <p className="text-[#94A3B8] text-xs leading-relaxed">
                    {details?.overview || (lang === 'ar-SA' ? 'لا يوجد وصف متاح.' : 'No overview available.')}
                  </p>
                </div>

                {/* طاقم التمثيل */}
                {details?.credits?.cast?.length > 0 && (
                  <div className="space-y-2">
                    <h3 className={`text-xs font-bold text-white border-l-2 border-[#3B82F6] ${lang === 'ar-SA' ? 'border-r-2 border-l-0 pr-2' : 'pl-2'}`}>
                      {lang === 'ar-SA' ? 'طاقم التمثيل' : 'Cast'}
                    </h3>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                      {details.credits.cast.slice(0, 6).map((actor) => (
                        <div key={actor.id} className="flex-shrink-0 w-20 bg-[#111827] rounded-xl p-2 text-center border border-[#1E293B]">
                          <img
                            src={actor.profile_path ? `${IMAGE_BASE_URL}${actor.profile_path}` : 'https://via.placeholder.com/100?text=Actor'}
                            alt={actor.name}
                            className="w-10 h-10 rounded-full object-cover mx-auto mb-1 border border-gray-700"
                            loading="lazy"
                          />
                          <p className="text-[9px] font-bold text-white truncate">{actor.name}</p>
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

      {/* 11. مشغل التريلر المباشر */}
      {trailerKey && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-3 backdrop-blur-sm">
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-[#1E293B]">
            <button
              onClick={() => setTrailerKey(null)}
              className="absolute top-2 right-2 bg-[#3B82F6] text-white w-7 h-7 rounded-full text-xs font-bold z-10 active:scale-95 flex items-center justify-center"
            >
              ✕
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
              title="Trailer"
              className="w-full h-full border-0"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------- المكونات المساعدة ----------------

function HorizontalSection({ title, items, genresMap, loading, onItemClick, onViewAll, lang }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-black text-white tracking-wide border-r-4 border-[#3B82F6] pr-2">
          {title}
        </h3>
        {onViewAll && (
          <button onClick={onViewAll} className="text-xs text-[#60A5FA] hover:text-blue-400 font-bold active:scale-95 transition">
            {lang === 'ar-SA' ? 'عرض الكل >' : 'See All >'}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-28 h-40 bg-[#111827] rounded-2xl animate-pulse flex-shrink-0" />
          ))}
        </div>
      ) : (
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          {items.map((item) => (
            <div key={item.id} className="w-28 flex-shrink-0">
              <MovieCard item={item} genresMap={genresMap} onClick={() => onItemClick(item)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MovieCard({ item, genresMap = {}, onClick }) {
  const genreName = item.genre_ids && item.genre_ids.length > 0 ? genresMap[item.genre_ids[0]] : null;

  return (
    <div
      onClick={onClick}
      className="bg-[#111827] rounded-2xl overflow-hidden border border-[#1E293B] hover:border-gray-700 transition cursor-pointer space-y-1.5 p-1 group active:scale-95"
    >
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#05070A]">
        {item.poster_path ? (
          <img
            src={`${IMAGE_BASE_URL}${item.poster_path}`}
            alt={item.title || item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#94A3B8] text-[9px]">No Image</div>
        )}
        <div className="absolute top-1.5 right-1.5 bg-black/80 border border-[#1E293B] px-1.5 py-0.5 rounded-md text-[9px] font-extrabold text-white flex items-center gap-0.5">
          <span>{item.vote_average ? item.vote_average.toFixed(1) : '7.5'}</span>
          <span className="text-[#3B82F6]">★</span>
        </div>
      </div>

      <div className="px-1 pb-1 space-y-0.5">
        <h4 className="text-[11px] font-bold text-white truncate">{item.title || item.name}</h4>
        <div className="flex items-center gap-1 text-[9px] text-[#94A3B8]">
          <span>{item.release_date?.substring(0, 4) || item.first_air_date?.substring(0, 4) || '2026'}</span>
          {genreName && (
            <>
              <span>•</span>
              <span className="truncate">{genreName}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 px-3 py-1 transition duration-200 active:scale-95 ${
        active
          ? 'text-[#3B82F6] font-black'
          : 'text-[#94A3B8] hover:text-white font-medium'
      }`}
    >
      <div className="w-5 h-5">{icon}</div>
      <span className="text-[10px] tracking-wide">{label}</span>
    </button>
  );
}
