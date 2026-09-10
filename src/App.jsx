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

  // حفظ القائمة الشخصية تلقائياً
  useEffect(() => {
    localStorage.setItem('movix_my_list', JSON.stringify(myList));
  }, [myList]);

  // جلب التصنيفات بناءً على النوع الحالي
  useEffect(() => {
    const getGenresList = async () => {
      const type = activeTab === 'tv' ? 'tv' : 'movie';
      const list = await fetchGenres(type, lang);
      setGenres(list || []);
    };
    getGenresList();
  }, [activeTab, lang]);

  // جلب محتوى الصفحة الرئيسية (الأقسام الرئيسية + أعمال شركات الإنتاج)
  useEffect(() => {
    if (activeTab === 'home' && !searchQuery && !selectedGenre && !selectedStudio) {
      const loadHomeContent = async () => {
        setLoading(true);
        try {
          const [trending, upcoming, topRated, tvTrending] = await Promise.all([
            fetchTrending('movie', 1, lang),
            fetchUpcomingOrPopular('movie', 1, lang),
            fetchTopRated('movie', 1, lang),
            fetchTrending('tv', 1, lang)
          ]);

          setTrendingList(trending?.results || []);
          setLatestMoviesList(upcoming?.results || []);
          setTopRatedList(topRated?.results || []);
          setTrendingTvList(tvTrending?.results || []);

          // جلب أفلام الشركات بشكل متوازي
          const studioPromises = STUDIOS.map((s) =>
            fetchByGenre('movie', '', 1, lang, s.id).then((res) => ({
              id: s.id,
              items: res?.results || []
            }))
          );
          const studioResults = await Promise.all(studioPromises);
          const sMap = {};
          studioResults.forEach((sr) => {
            sMap[sr.id] = sr.items;
          });
          setStudioMoviesMap(sMap);

        } catch (err) {
          console.error('Error fetching home content:', err);
        } finally {
          setLoading(false);
        }
      };
      loadHomeContent();
    }
  }, [activeTab, searchQuery, selectedGenre, selectedStudio, lang]);

  // جلب المحتوى الشبكي (عند البحث، تصفح تصنيف، أو شركة)
  useEffect(() => {
    if (activeTab !== 'home' || searchQuery || selectedGenre || selectedStudio) {
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

          setGridItems(data?.results || []);
          setTotalPages(data?.total_pages || 1);
        } catch (err) {
          console.error('Error fetching grid items:', err);
        } finally {
          setLoading(false);
        }
      };
      loadGridContent();
    }
  }, [activeTab, page, searchQuery, selectedGenre, selectedStudio, lang]);

  // جلب التفاصيل والتريلر
  useEffect(() => {
    if (!selectedItem) {
      setDetails(null);
      return;
    }
    const getDetails = async () => {
      setDetailsLoading(true);
      try {
        const data = await fetchDetails(selectedItemType, selectedItem.id, lang);
        setDetails(data);
        const trailer = data?.videos?.results?.find(
          (vid) => vid.site === 'YouTube' && (vid.type === 'Trailer' || vid.type === 'Teaser')
        );
        setTrailerKey(trailer ? trailer.key : null);
      } catch (err) {
        console.error('Error fetching details:', err);
      } finally {
        setDetailsLoading(false);
      }
    };
    getDetails();
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

  const featuredItem = useMemo(() => (trendingList.length > 0 ? trendingList[0] : null), [trendingList]);

  const genresMap = useMemo(() => {
    const map = {};
    genres.forEach((g) => {
      map[g.id] = g.name;
    });
    return map;
  }, [genres]);

  return (
    <div
      className="min-h-screen bg-[#090C10] text-[#F8FAFC] antialiased pb-28 font-sans max-w-md mx-auto relative overflow-hidden"
      dir={lang === 'ar-SA' ? 'rtl' : 'ltr'}
    >
      {/* 1. الشريط العلوي Header */}
      <header className="pt-4 px-5 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => {
          setActiveTab('home');
          setSelectedGenre('');
          setSelectedStudio(null);
          setSearchQuery('');
        }}>
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white text-xs font-black shadow-md shadow-red-600/30">
            ▶
          </div>
          <span className="text-lg font-black tracking-wider text-white">
            MOV<span className="text-red-600">IX</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setLang((p) => (p === 'ar-SA' ? 'en-US' : 'ar-SA'))}
            className="flex items-center gap-1 text-xs font-bold bg-[#161B22] border border-gray-800 px-3 py-1 rounded-full text-gray-300 active:scale-95 transition"
          >
            <span>{lang === 'ar-SA' ? 'EN' : 'العربية'}</span>
            <span>🌐</span>
          </button>

          <button
            onClick={() => {
              setTempGenre(selectedGenre);
              setShowFilterModal(true);
            }}
            className="text-white text-sm bg-[#161B22] p-2 rounded-full border border-gray-800 active:scale-95 transition"
            title={lang === 'ar-SA' ? 'التصنيفات' : 'Filter Genres'}
          >
            ⚙️
          </button>

          <div className="w-8 h-8 rounded-full bg-[#161B22] border border-gray-800 flex items-center justify-center text-xs text-gray-300">
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
            className="w-full bg-[#161B22] text-white placeholder-gray-500 border border-gray-800 focus:border-red-600 px-4 py-2.5 rounded-2xl text-xs focus:outline-none transition"
          />
          <span className={`absolute top-1/2 -translate-y-1/2 text-gray-400 text-xs ${lang === 'ar-SA' ? 'left-3' : 'right-3'}`}>🔍</span>
        </div>
      </div>

      <main className="px-4 pt-4 space-y-7">

        {/* 3. شريط اختيار شركات الإنتاج السريع */}
        {!searchQuery && (
          <div className="space-y-2.5">
            <h3 className="text-sm font-extrabold text-gray-300 border-r-4 border-red-600 pr-2">
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
                        ? 'bg-red-600 border-red-600 text-white font-black shadow-lg shadow-red-600/30'
                        : 'bg-[#161B22] border-gray-800 hover:border-gray-700 text-gray-300'
                    }`}
                  >
                    <span className="text-xs font-bold">{studio.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. البانر الرئيسي (Hero Section) */}
        {activeTab === 'home' && !searchQuery && !selectedGenre && !selectedStudio && (
          loading ? (
            <div className="h-[320px] bg-[#161B22] rounded-3xl animate-pulse" />
          ) : (
            featuredItem && (
              <div className="relative rounded-3xl overflow-hidden bg-[#161B22] border border-gray-800 shadow-xl">
                <div className="relative h-[320px] w-full">
                  <img
                    src={`${BACKDROP_BASE_URL}${featuredItem.backdrop_path || featuredItem.poster_path}`}
                    alt={featuredItem.title || featuredItem.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#090C10] via-[#090C10]/40 to-transparent" />

                  <div className="absolute bottom-4 inset-x-4 space-y-2">
                    <div className="inline-block bg-red-600/20 border border-red-600/40 text-red-400 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                      🔥 {lang === 'ar-SA' ? 'المستحب حالياً' : 'Featured'}
                    </div>

                    <h2 className="text-xl font-black text-white truncate">
                      {featuredItem.title || featuredItem.name}
                    </h2>

                    <div className="flex items-center gap-2 text-[11px] text-gray-400 font-medium">
                      <span>{featuredItem.release_date?.substring(0, 4) || '2026'}</span>
                      <span className="bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                        ★ {featuredItem.vote_average?.toFixed(1) || '7.8'}
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed pt-1">
                      {featuredItem.overview || (lang === 'ar-SA' ? 'لا يوجد وصف متاح.' : 'No description available.')}
                    </p>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button
                        onClick={() => handlePlayTrailer(featuredItem, 'movie')}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
                      >
                        <span>▶</span>
                        <span>{lang === 'ar-SA' ? 'شاهد الآن' : 'Watch Now'}</span>
                      </button>

                      <button
                        onClick={() => toggleMyList(featuredItem, 'movie')}
                        className="bg-[#161B22] border border-gray-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
                      >
                        <span>{isInMyList(featuredItem.id) ? '✓' : '＋'}</span>
                        <span>{isInMyList(featuredItem.id) ? (lang === 'ar-SA' ? 'في قائمتي' : 'In List') : (lang === 'ar-SA' ? 'أضف لقائمتي' : 'Add to List')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          )
        )}

        {/* 5. أقسام العرض الأفقي بالصفحة الرئيسية */}
        {activeTab === 'home' && !searchQuery && !selectedGenre && !selectedStudio && (
          <div className="space-y-7">
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
            <div className="pt-2 space-y-7 border-t border-gray-800/80">
              <h2 className="text-base font-black text-white tracking-wide border-r-4 border-red-600 pr-2">
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
            <h3 className="text-base font-black text-white border-r-4 border-red-600 pr-2">
              {lang === 'ar-SA' ? 'قائمتي المفضلّة' : 'My List'}
            </h3>

            {myList.length === 0 ? (
              <div className="text-center py-16 text-gray-500 space-y-2">
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
              <h3 className="text-base font-black text-white border-r-4 border-red-600 pr-2">
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
                  className="text-[10px] text-red-400 bg-red-600/10 px-2.5 py-1 rounded-full border border-red-600/30"
                >
                  {lang === 'ar-SA' ? 'إلغاء الفلتر ✕' : 'Clear Filter ✕'}
                </button>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-[#161B22] rounded-2xl h-48 animate-pulse" />
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
                    className="px-3 py-1.5 bg-[#161B22] border border-gray-800 rounded-xl text-xs font-bold text-gray-300 disabled:opacity-30 active:scale-95"
                  >
                    {lang === 'ar-SA' ? 'السابق' : 'Prev'}
                  </button>
                  <span className="text-xs font-bold text-gray-500">
                    {page} / {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1.5 bg-[#161B22] border border-gray-800 rounded-xl text-xs font-bold text-gray-300 disabled:opacity-30 active:scale-95"
                  >
                    {lang === 'ar-SA' ? 'التالي' : 'Next'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

      </main>

      {/* 8. الشريط السفلي Navigation Bar المُحسّن والأكثر احترافية */}
      <div className="fixed bottom-3 inset-x-0 mx-auto max-w-sm px-4 z-40">
        <nav className="bg-[#161B22]/95 border border-gray-700/80 backdrop-blur-xl rounded-2xl py-2 px-2 flex items-center justify-around shadow-2xl shadow-black/80">
          <NavItem
            icon="🏠"
            label={lang === 'ar-SA' ? 'الرئيسية' : 'Home'}
            active={activeTab === 'home' && !searchQuery && !selectedGenre && !selectedStudio}
            onClick={() => {
              setActiveTab('home');
              setSelectedGenre('');
              setSelectedStudio(null);
              setSearchQuery('');
            }}
          />
          <NavItem
            icon="🎬"
            label={lang === 'ar-SA' ? 'الأفلام' : 'Movies'}
            active={activeTab === 'movies' && !searchQuery && !selectedGenre && !selectedStudio}
            onClick={() => {
              setActiveTab('movies');
              setSelectedGenre('');
              setSelectedStudio(null);
              setSearchQuery('');
              setPage(1);
            }}
          />
          <NavItem
            icon="📺"
            label={lang === 'ar-SA' ? 'المسلسلات' : 'TV Series'}
            active={activeTab === 'tv' && !searchQuery && !selectedGenre && !selectedStudio}
            onClick={() => {
              setActiveTab('tv');
              setSelectedGenre('');
              setSelectedStudio(null);
              setSearchQuery('');
              setPage(1);
            }}
          />
          <NavItem
            icon="♡"
            label={lang === 'ar-SA' ? 'قائمتي' : 'My List'}
            active={activeTab === 'mylist'}
            onClick={() => {
              setActiveTab('mylist');
              setSelectedGenre('');
              setSelectedStudio(null);
              setSearchQuery('');
            }}
          />
        </nav>
      </div>

      {/* 9. نافذة اختيار التصنيفات (Filter Modal) */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#161B22] border border-gray-800 rounded-3xl w-full max-w-xs p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-800 pb-2.5">
              <h3 className="text-xs font-bold text-white">
                {lang === 'ar-SA' ? 'اختر التصنيف' : 'Select Genre'}
              </h3>
              <button onClick={() => setShowFilterModal(false)} className="text-gray-400 hover:text-white text-xs">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              <button
                onClick={() => setTempGenre('')}
                className={`py-2 rounded-xl text-xs font-bold border transition ${
                  tempGenre === '' ? 'bg-red-600 text-white border-red-600' : 'bg-[#090C10] text-gray-400 border-gray-800'
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
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-[#090C10] text-gray-400 border-gray-800'
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
              className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold py-2.5 rounded-2xl text-xs active:scale-95 transition"
            >
              {lang === 'ar-SA' ? 'تطبيق' : 'Apply'}
            </button>
          </div>
        </div>
      )}

      {/* 10. نافذة التفاصيل الفردية (Details Modal) */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-[#090C10] overflow-y-auto min-h-screen text-[#F8FAFC]">
          <button
            onClick={() => setSelectedItem(null)}
            className={`fixed top-4 z-50 bg-[#161B22]/90 hover:bg-red-600 text-white px-3.5 py-1.5 rounded-full transition border border-gray-800 text-xs font-bold shadow-2xl flex items-center gap-1 active:scale-95 ${lang === 'ar-SA' ? 'left-4' : 'right-4'}`}
          >
            ✕ {lang === 'ar-SA' ? 'إغلاق' : 'Close'}
          </button>

          {detailsLoading ? (
            <div className="flex justify-center items-center h-screen">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-600 border-t-transparent"></div>
            </div>
          ) : (
            <div className="pb-20">
              <div className="relative w-full h-[320px] bg-[#090C10]">
                {details?.backdrop_path ? (
                  <img
                    src={`${BACKDROP_BASE_URL}${details.backdrop_path}`}
                    alt={details?.title || details?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">No Image</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#090C10] via-[#090C10]/50 to-transparent" />

                <div className="absolute bottom-4 px-4 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-500 text-black font-extrabold px-1.5 py-0.5 rounded text-[10px]">
                      ★ {details?.vote_average?.toFixed(1) || '0.0'}
                    </span>
                    <span className="text-[11px] text-gray-400">
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
                        className="bg-[#161B22] text-gray-300 px-2.5 py-0.5 rounded-lg text-[10px] font-semibold border border-gray-800"
                      >
                        {g.name}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleMyList(details, selectedItemType)}
                      className="bg-[#161B22] border border-gray-800 text-white font-bold px-3 py-2 rounded-xl text-xs active:scale-95 transition"
                    >
                      {isInMyList(details?.id) ? '✓' : '＋'}
                    </button>

                    <button
                      onClick={() => handlePlayTrailer(details, selectedItemType)}
                      className="bg-red-600 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1 active:scale-95 transition"
                    >
                      <span>▶</span>
                      <span>{lang === 'ar-SA' ? 'التريلر' : 'Trailer'}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h3 className={`text-xs font-bold text-white border-l-2 border-red-600 ${lang === 'ar-SA' ? 'border-r-2 border-l-0 pr-2' : 'pl-2'}`}>
                    {lang === 'ar-SA' ? 'القصة' : 'Overview'}
                  </h3>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    {details?.overview || (lang === 'ar-SA' ? 'لا يوجد وصف متاح.' : 'No overview available.')}
                  </p>
                </div>

                {/* طاقم التمثيل */}
                {details?.credits?.cast?.length > 0 && (
                  <div className="space-y-2">
                    <h3 className={`text-xs font-bold text-white border-l-2 border-red-600 ${lang === 'ar-SA' ? 'border-r-2 border-l-0 pr-2' : 'pl-2'}`}>
                      {lang === 'ar-SA' ? 'طاقم التمثيل' : 'Cast'}
                    </h3>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                      {details.credits.cast.slice(0, 6).map((actor) => (
                        <div key={actor.id} className="flex-shrink-0 w-20 bg-[#161B22] rounded-xl p-2 text-center border border-gray-800">
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
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-gray-800">
            <button
              onClick={() => setTrailerKey(null)}
              className="absolute top-2 right-2 bg-red-600 text-white w-7 h-7 rounded-full text-xs font-bold z-10 active:scale-95 flex items-center justify-center"
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
        <h3 className="text-base font-black text-white tracking-wide border-r-4 border-red-600 pr-2">
          {title}
        </h3>
        {onViewAll && (
          <button onClick={onViewAll} className="text-xs text-red-500 hover:text-red-400 font-bold active:scale-95 transition">
            {lang === 'ar-SA' ? 'عرض الكل >' : 'See All >'}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-28 h-40 bg-[#161B22] rounded-2xl animate-pulse flex-shrink-0" />
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
      className="bg-[#161B22] rounded-2xl overflow-hidden border border-gray-800 hover:border-gray-700 transition cursor-pointer space-y-1.5 p-1 group active:scale-95"
    >
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#090C10]">
        {item.poster_path ? (
          <img
            src={`${IMAGE_BASE_URL}${item.poster_path}`}
            alt={item.title || item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 text-[9px]">No Image</div>
        )}
        <div className="absolute top-1.5 right-1.5 bg-black/80 border border-gray-800 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold text-white flex items-center gap-0.5">
          <span>{item.vote_average ? item.vote_average.toFixed(1) : '7.5'}</span>
          <span className="text-amber-400">★</span>
        </div>
      </div>

      <div className="px-1 pb-1 space-y-0.5">
        <h4 className="text-[11px] font-bold text-white truncate">{item.title || item.name}</h4>
        <div className="flex items-center gap-1 text-[9px] text-gray-400">
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
      className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition duration-200 active:scale-95 ${
        active
          ? 'bg-red-600/15 text-red-500 font-black scale-105 border border-red-600/30'
          : 'text-gray-400 hover:text-white font-medium'
      }`}
    >
      <span className="text-lg leading-none">{icon}</span>
      <span className="text-[11px] tracking-wide">{label}</span>
    </button>
  );
}
