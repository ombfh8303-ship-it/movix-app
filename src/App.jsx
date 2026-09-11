Import React, { useState, useEffect, useCallback, useRef } from 'react';
Import {
  FetchTrending, fetchTopRated, fetchUpcomingOrPopular, searchMedia,
  FetchDetails, fetchGenres, fetchByGenre, fetchByStudio,
  IMAGE_BASE_URL, BACKDROP_BASE_URL
} from './services/tmdb';

Const STUDIOS = [
  { id: 213, name: 'Netflix', logo: 'https://image.tmdb.org/t/p/w200/wwemzKW8219fCA3y023392.png' },
  { id: 2, name: 'Walt Disney', logo: 'https://image.tmdb.org/t/p/w200/wdrCwoL3Bx8pM32pP3C311.png' },
  { id: 420, name: 'Marvel Studios', logo: 'https://image.tmdb.org/t/p/w200/hU3A9R9fA420133.png' },
  { id: 174, name: 'Warner Bros.', logo: 'https://image.tmdb.org/t/p/w200/vRu23414115.png' },
  { id: 49, name: 'HBO', logo: 'https://image.tmdb.org/t/p/w200/tuomPhY213.png' },
  { id: 33, name: 'Universal', logo: 'https://image.tmdb.org/t/p/w200/83o331.png' },
  { id: 4, name: 'Paramount', logo: 'https://image.tmdb.org/t/p/w200/420Paramount.png' }
];

// 🟢 سيرفرات المشاهدة المحدثة والشغالة حالياً بدون مشكلة ERR_NAME_NOT_RESOLVED
Const WATCH_SERVERS = [
  { 
    Id: 'vidsrc_icu', 
    Name: 'VidSrc ICU', 
    GetUrl: (id, type, s, e) => type === 'tv' 
      ? `https://vidsrc.icu/embed/tv/${id}/${s}/${e}` 
      : `https://vidsrc.icu/embed/movie/${id}` 
  },
  { 
    Id: 'vidsrc_me', 
    Name: 'VidSrc Me', 
    GetUrl: (id, type, s, e) => type === 'tv' 
      ? `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}` 
      : `https://vidsrc.me/embed/movie?tmdb=${id}` 
  },
  { 
    Id: 'autoembed', 
    Name: 'AutoEmbed', 
    GetUrl: (id, type, s, e) => type === 'tv' 
      ? `https://player.autoembed.cc/tv/${id}/${s}/${e}` 
      : `https://player.autoembed.cc/movie/${id}` 
  },
  { 
    Id: 'smashystream', 
    Name: 'SmashyStream', 
    GetUrl: (id, type, s, e) => type === 'tv' 
      ? `https://embed.smashystream.com/playere.php?tmdb=${id}&season=${s}&episode=${e}` 
      : `https://embed.smashystream.com/playere.php?tmdb=${id}` 
  },
  { 
    Id: 'multiembed', 
    Name: 'MultiEmbed', 
    GetUrl: (id, type, s, e) => type === 'tv' 
      ? `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1&s=${s}&e=${e}` 
      : `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1` 
  },
  { 
    Id: 'vidsrc_pm', 
    Name: 'VidSrc PM', 
    GetUrl: (id, type, s, e) => type === 'tv' 
      ? `https://vidsrc.pm/embed/tv/${id}/${s}/${e}` 
      : `https://vidsrc.pm/embed/movie/${id}` 
  },
  { 
    Id: '2embed', 
    Name: '2Embed', 
    GetUrl: (id, type, s, e) => type === 'tv' 
      ? `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}` 
      : `https://www.2embed.cc/embed/${id}` 
  }
];

Export default function App() {
  Const [activeTab, setActiveTab] = useState('home');
  Const [lang, setLang] = useState('ar-SA');
  Const [searchQuery, setSearchQuery] = useState('');
  Const [loading, setLoading] = useState(false);
  Const [loadingMore, setLoadingMore] = useState(false);
  
  Const [myList, setMyList] = useState(() => { 
    Try { return JSON.parse(localStorage.getItem('movix_my_list')) || []; } catch { return []; } 
  });
  Const [watchHistory, setWatchHistory] = useState(() => { 
    Try { return JSON.parse(localStorage.getItem('movix_watch_history')) || []; } catch { return []; } 
  });

  Const [trendingList, setTrendingList] = useState([]);
  Const [latestMoviesList, setLatestMoviesList] = useState([]);
  Const [topRatedList, setTopRatedList] = useState([]);
  Const [trendingTvList, setTrendingTvList] = useState([]);
  Const [heroIndex, setHeroIndex] = useState(0);
  Const [studioMoviesMap, setStudioMoviesMap] = useState({});
  Const [gridItems, setGridItems] = useState([]);
  Const [page, setPage] = useState(1);
  Const [totalPages, setTotalPages] = useState(1);
  Const [genres, setGenres] = useState([]);
  
  Const [selectedGenre, setSelectedGenre] = useState('');
  Const [selectedStudio, setSelectedStudio] = useState(null);
  Const [minRating, setMinRating] = useState(0);
  Const [selectedYear, setSelectedYear] = useState('');
  
  Const [tempGenre, setTempGenre] = useState('');
  Const [tempMinRating, setTempMinRating] = useState(0);
  Const [tempSelectedYear, setTempSelectedYear] = useState('');
  Const [showFilterModal, setShowFilterModal] = useState(false);

  Const [selectedItem, setSelectedItem] = useState(null);
  Const [selectedItemType, setSelectedItemType] = useState('movie');
  Const [details, setDetails] = useState(null);
  Const [detailsLoading, setDetailsLoading] = useState(false);
  Const [trailerKey, setTrailerKey] = useState(null);
  Const [trailerLoading, setTrailerLoading] = useState(false);
  Const [selectedSeasonNumber, setSelectedSeasonNumber] = useState(1);
  Const [seasonDetails, setSeasonDetails] = useState(null);
  Const [seasonLoading, setSeasonLoading] = useState(false);
  Const [overviewExpanded, setOverviewExpanded] = useState(false);

  Const [activeServer, setActiveServer] = useState(WATCH_SERVERS[0]);
  Const [selectedEpisodeNumber, setSelectedEpisodeNumber] = useState(1);
  Const [isWatching, setIsWatching] = useState(false);

  Const searchTimer = useRef(null);

  UseEffect(() => { try { localStorage.setItem('movix_my_list', JSON.stringify(myList)); } catch { } }, [myList]);
  UseEffect(() => { try { localStorage.setItem('movix_watch_history', JSON.stringify(watchHistory)); } catch { } }, [watchHistory]);

  Const resetFilters = useCallback(() => {
    SetSelectedGenre(''); setSelectedStudio(null); setSearchQuery('');
    SetMinRating(0); setSelectedYear(''); setPage(1); setGridItems([]);
  }, []);

  UseEffect(() => {
    Const type = activeTab === 'tv' ? 'tv' : 'movie';
    FetchGenres(type, lang).then(x => setGenres(x || [])).catch(() => { });
  }, [activeTab, lang]);

  UseEffect(() => {
    If (activeTab === 'home' && !searchQuery && !selectedGenre && !selectedStudio && !minRating && !selectedYear) {
      SetLoading(true);
      Promise.all([
        FetchTrending('movie', 1, lang),
        FetchUpcomingOrPopular('movie', 1, lang),
        FetchTopRated('movie', 1, lang),
        FetchTrending('tv', 1, lang)
      ]).then(([a, b, c, d]) => {
        SetTrendingList(a?.results || []);
        SetLatestMoviesList(b?.results || []);
        SetTopRatedList(c?.results || []);
        SetTrendingTvList(d?.results || []);
        SetLoading(false);
      }).catch(() => setLoading(false));

      STUDIOS.forEach(s => {
        Const type = (s.id === 213 || s.id === 49) ? 'tv' : 'movie';
        FetchByStudio(type, s.id, 1, lang).then(r => {
          SetStudioMoviesMap(p => ({ ...p, [s.id]: r?.results || [] }));
        }).catch(() => { });
      });
    }
  }, [activeTab, searchQuery, selectedGenre, selectedStudio, minRating, selectedYear, lang]);

  UseEffect(() => {
    If (!trendingList.length) return;
    Const t = setInterval(() => setHeroIndex(p => (p + 1) % Math.min(trendingList.length, 5)), 5000);
    Return () => clearInterval(t);
  }, [trendingList]);

  Const loadGridData = useCallback((pageNum = 1, append = false, query = searchQuery) => {
    PageNum === 1 ? setLoading(true) : setLoadingMore(true);
    Const type = activeTab === 'tv' ? 'tv' : 'movie';
    Let promise;
    If (query.trim()) promise = searchMedia(query, type, pageNum, lang);
    Else if (selectedGenre) promise = fetchByGenre(type, selectedGenre, pageNum, lang);
    Else if (selectedStudio) {
      Const st = (selectedStudio.id === 213 || selectedStudio.id === 49) ? 'tv' : type;
      Promise = fetchByStudio(st, selectedStudio.id, pageNum, lang);
    } else promise = fetchTrending(type, pageNum, lang);

    Promise.then(data => {
      Let results = data?.results || [];
      If (minRating > 0) results = results.filter(x => (x.vote_average || 0) >= minRating);
      If (selectedYear) results = results.filter(x => {
        Const d = x.release_date || x.first_air_date || '';
        Return d.startsWith(selectedYear);
      });
      SetGridItems(p => append ? [...p, ...results] : results);
      SetTotalPages(data?.total_pages || 1);
    }).catch(() => { }).finally(() => { setLoading(false); setLoadingMore(false); });
  }, [activeTab, selectedGenre, selectedStudio, minRating, selectedYear, lang, searchQuery]);

  Const handleSearchChange = e => {
    Const val = e.target.value;
    SetSearchQuery(val); setSelectedGenre(''); setSelectedStudio(null);
    ClearTimeout(searchTimer.current);
    SearchTimer.current = setTimeout(() => {
      SetPage(1); loadGridData(1, false, val);
    }, 400);
  };

  UseEffect(() => {
    If (activeTab !== 'home' || selectedGenre || selectedStudio || minRating || selectedYear) {
      SetPage(1); loadGridData(1, false, searchQuery);
    }
  }, [activeTab, selectedGenre, selectedStudio, minRating, selectedYear, lang, loadGridData, searchQuery]);

  Const handleLoadMore = () => {
    If (page < totalPages && !loadingMore) {
      Const n = page + 1; setPage(n); loadGridData(n, true, searchQuery);
    }
  };

  Const addToWatchHistory = useCallback((item, type = 'movie') => {
    If (!item?.id) return;
    SetWatchHistory(prev => {
      Const ni = { ...item, media_type: item.media_type || type, watchedAt: Date.now() };
      Const filtered = prev.filter(i => !(i.id === item.id && (i.media_type || type) === ni.media_type));
      Return [ni, ...filtered].slice(0, 30);
    });
  }, []);

  Const removeFromWatchHistory = useCallback(item => {
    SetWatchHistory(p => p.filter(i => !(i.id === item.id && i.media_type === item.media_type)));
  }, []);

  Const clearWatchHistory = useCallback(() => setWatchHistory([]), []);

  UseEffect(() => {
    If (!selectedItem) { setDetails(null); setIsWatching(false); return; }
    SetOverviewExpanded(false); setDetailsLoading(true); setIsWatching(false);
    FetchDetails(selectedItemType, selectedItem.id, lang).then(data => {
      SetDetails(data);
      If (selectedItemType === 'tv' && data?.seasons?.length) {
        Const first = data.seasons.find(s => s.season_number > 0) || data.seasons[0];
        SetSelectedSeasonNumber(first.season_number);
        SetSelectedEpisodeNumber(1);
      }
    }).catch(() => { }).finally(() => setDetailsLoading(false));
  }, [selectedItem, selectedItemType, lang]);

  UseEffect(() => {
    If (selectedItemType !== 'tv' || !selectedItem?.id) {
      SetSeasonDetails(null); return;
    }
    SetSeasonLoading(true);
    Fetch(`https://api.themoviedb.org/3/tv/${selectedItem.id}/season/${selectedSeasonNumber}?api_key=4289874cb3f960f477028fae98f0efd0&language=${lang}`)
      .then(r => r.ok ? R.json() : { episodes: [] })
      .then(setSeasonDetails).catch(() => setSeasonDetails({ episodes: [] })).finally(() => setSeasonLoading(false));
  }, [selectedItem, selectedItemType, selectedSeasonNumber, lang]);

  Const getRealTrailer = useCallback(data => {
    Const v = data?.videos?.results || [];
    Return v.find(x => x.site === 'YouTube' && x.type === 'Trailer' && x.official === true)
      || v.find(x => x.site === 'YouTube' && x.type === 'Trailer')
      || v.find(x => x.site === 'YouTube' && x.type === 'Teaser')
      || v.find(x => x.site === 'YouTube') || null;
  }, []);

  Const handlePlayTrailer = useCallback(async (item, type = 'movie') => {
    If (!item) return;
    SetTrailerLoading(true);
    Try {
      Let data = details && details.id === item.id && selectedItemType === type ? Details : await fetchDetails(type, item.id, lang);
      Const trailer = getRealTrailer(data);
      If (trailer?.key) {
        AddToWatchHistory(item, type);
        SetTrailerKey(trailer.key);
      } else alert(lang === 'ar-SA' ? 'الإعلان الرسمي غير متوفر حالياً' : 'Official trailer is not available');
    } catch {
      Alert(lang === 'ar-SA' ? 'حدث خطأ أثناء تحميل التريلر' : 'Error loading trailer');
    } finally { setTrailerLoading(false); }
  }, [details, selectedItemType, lang, getRealTrailer, addToWatchHistory]);

  Const handleStartWatching = useCallback((epNum = 1) => {
    If (!details) return;
    SetSelectedEpisodeNumber(epNum);
    SetIsWatching(true);
    AddToWatchHistory(details, selectedItemType);
  }, [details, selectedItemType, addToWatchHistory]);

  Const toggleMyList = useCallback((item, type = 'movie') => {
    If (!item) return;
    SetMyList(prev => {
      Const exists = prev.some(i => i.id === item.id);
      If (exists) return prev.filter(i => i.id !== item.id);
      Return [...prev, { ...item, media_type: type }];
    });
  }, []);

  Const isInMyList = useCallback(id => myList.some(i => i.id === id), [myList]);

  Const handleOpenDetails = useCallback((item, type = 'movie') => {
    SetTrailerKey(null); setOverviewExpanded(false); setIsWatching(false);
    Const itemType = item.media_type || type;
    SetSelectedItemType(itemType); setSelectedItem(item);
  }, []);

  Const genresMap = genres.reduce((a, g) => (a[g.id] = g.name, a), {});
  Const featuredItem = trendingList[heroIndex] || trendingList[0];
  Const isHome = activeTab === 'home' && !searchQuery && !selectedGenre && !selectedStudio && !minRating && !selectedYear;

  Const currentEmbedUrl = details ? ActiveServer.getUrl(details.id, selectedItemType, selectedSeasonNumber, selectedEpisodeNumber) : '';

  Return (
    <div className="min-h-screen bg-[#05070A] text-[#F8FAFC] pb-24 font-sans max-w-md mx-auto relative select-none" dir={lang === 'ar-SA' ? 'rtl' : 'ltr'}>

      {/* الهيدر علوي */}
      <header className="px-4 pt-5 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setActiveTab('home'); resetFilters(); }}>
          <div className="w-9 h-9 rounded-xl bg-[#3B82F6] flex items-center justify-center text-white text-sm font-black shadow-lg shadow-[#3B82F6]/30">▶</div>
          <div className="leading-none">
            <span className="text-[19px] font-black tracking-[0.08em] text-white">MOV<span className="text-[#3B82F6]">IX</span></span>
            <p className="text-[7px] text-[#64748B] tracking-[0.22em] mt-1 uppercase">Movie Streaming</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setLang(p => p === 'ar-SA' ? 'en-US' : 'ar-SA')} className="h-9 px-3 rounded-full bg-[#0F172A] border border-[#1E293B] text-[#CBD5E1] text-[10px] font-bold flex items-center gap-1.5 active:scale-95 transition-transform">
            🌐 {lang === 'ar-SA' ? 'EN' : 'العربية'}
          </button>
          <button onClick={() => { setTempGenre(selectedGenre); setTempMinRating(minRating); setTempSelectedYear(selectedYear); setShowFilterModal(true); }} className="w-9 h-9 rounded-full bg-[#0F172A] border border-[#1E293B] text-[#CBD5E1] flex items-center justify-center active:scale-95 transition-transform">
            ⚙
          </button>
        </div>
      </header>

      {/* شريط البحث */}
      <div className="px-4 pt-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 w-10 flex items-center justify-center pointer-events-none text-[#64748B]">🔍</div>
          <input value={searchQuery} onChange={handleSearchChange} placeholder={lang === 'ar-SA' ? 'ابحث عن فيلم، مسلسل، ممثل...' : 'Search movies, series, actors...'} className="w-full h-12 bg-[#0F172A] text-white placeholder-[#64748B] border border-[#1E293B] focus:border-[#3B82F6] px-4 rounded-2xl text-xs outline-none pl-10 transition-all" />
        </div>
      </div>

      <main className="px-4 pt-5 space-y-8">

        {/* التصنيفات السريعة */}
        {isHome && genres.length > 0 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
            {genres.slice(0, 10).map(g => (
              <button key={g.id} onClick={() => { setSelectedGenre(g.id); setActiveTab('movies'); }} className="flex-shrink-0 px-4 py-2 rounded-full bg-[#0F172A] border border-[#1E293B] text-[#94A3B8] text-[10px] font-bold active:scale-95 transition-all">
                {g.name}
              </button>
            ))}
          </div>
        )}

        {/* البانر الرئيسي المميز */}
        {isHome && (loading ? <div className="h-[390px] bg-[#111827] rounded-[28px] animate-pulse" /> : featuredItem &&
          <div className="relative overflow-hidden rounded-[28px] bg-[#111827] border border-[#1E293B] shadow-2xl">
            <div className="relative h-[390px] w-full">
              <img src={`${BACKDROP_BASE_URL}${featuredItem.backdrop_path || featuredItem.poster_path}`} alt={featuredItem.title || featuredItem.name} className="w-full h-full object-cover" loading="eager" />
              <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(to top,#05070A 0%,rgba(5,7,10,.55) 50%,rgba(5,7,10,.10) 100%)' }} />
              <div className="absolute bottom-5 inset-x-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="bg-[#3B82F6] text-white px-2.5 py-1 rounded-full text-[9px] font-black">{featuredItem.genre_ids?.length ? GenresMap[featuredItem.genre_ids[0]] || 'مميز' : 'مميز'}</span>
                  <span className="text-[9px] text-[#CBD5E1] bg-black/30 border border-white/10 px-2 py-1 rounded-full backdrop-blur-md">جديد</span>
                </div>
                <h1 className="text-[28px] font-black text-white leading-tight truncate">{featuredItem.title || featuredItem.name}</h1>
                <div className="flex items-center gap-2 text-[10px] text-[#CBD5E1]">
                  <span className="text-[#60A5FA] font-bold">★ {featuredItem.vote_average?.toFixed(1) || '7.8'}</span>
                  <span>•</span>
                  <span>{featuredItem.release_date?.substring(0, 4) || featuredItem.first_air_date?.substring(0, 4) || '2026'}</span>
                  <span>•</span>
                  <span className="border border-white/20 px-1 rounded text-[8px]">HD</span>
                </div>
                <div className="grid grid-cols-[1.35fr_1fr] gap-2 pt-1">
                  <button onClick={() => handleOpenDetails(featuredItem, 'movie')} className="h-11 bg-[#3B82F6] active:bg-[#2563EB] text-white font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#3B82F6]/25 transition-all">
                    ▶ {lang === 'ar-SA' ? 'شاهد الآن' : 'Watch Now'}
                  </button>
                  <button onClick={() => toggleMyList(featuredItem, 'movie')} className="h-11 bg-[#0F172A] border border-white/10 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 active:scale-95 transition-all">
                    {isInMyList(featuredItem.id) ? '✓' : '＋'} {isInMyList(featuredItem.id) ? (lang === 'ar-SA' ? 'في قائمتي' : 'In List') : (lang === 'ar-SA' ? 'قائمتي' : 'My List')}
                  </button>
                </div>
                <div className="flex justify-center gap-1.5 pt-1">
                  {trendingList.slice(0, 5).map((_, i) => (
                    <button key={i} onClick={() => setHeroIndex(i)} className={`h-1.5 rounded-full transition-all ${heroIndex === i ? 'w-6 bg-[#3B82F6]' : 'w-1.5 bg-[#64748B]/60'}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>)}

        {/* أقسام الصفحة الرئيسية */}
        {isHome && <div className="space-y-8">
          <HorizontalSection title={lang === 'ar-SA' ? 'الأكثر رواجاً' : 'Trending Now'} icon="🔥" items={trendingList} loading={loading} onItemClick={x => handleOpenDetails(x, 'movie')} onViewAll={() => setActiveTab('movies')} lang={lang} />
          <HorizontalSection title={lang === 'ar-SA' ? 'أحدث الأفلام' : 'Latest Movies'} icon="✦" items={latestMoviesList} loading={loading} onItemClick={x => handleOpenDetails(x, 'movie')} onViewAll={() => setActiveTab('movies')} lang={lang} />
          <HorizontalSection title={lang === 'ar-SA' ? 'الأعلى تقييماً' : 'Top Rated'} icon="★" items={topRatedList} loading={loading} onItemClick={x => handleOpenDetails(x, 'movie')} onViewAll={() => setActiveTab('movies')} lang={lang} />
          <HorizontalSection title={lang === 'ar-SA' ? 'المسلسلات الرائجة' : 'Popular TV'} icon="▣" items={trendingTvList} loading={loading} onItemClick={x => handleOpenDetails(x, 'tv')} onViewAll={() => setActiveTab('tv')} lang={lang} />

          {/* شركات الإنتاج */}
          <div className="pt-5 border-t border-[#1E293B] space-y-8">
            <SectionTitle title={lang === 'ar-SA' ? 'شركات الإنتاج' : 'Production Studios'} icon="🏢" />
            {STUDIOS.map(s => {
              Const items = studioMoviesMap[s.id] || [];
              If (!items.length && !loading) return null;
              Const type = (s.id === 213 || s.id === 49) ? 'tv' : 'movie';
              Return <HorizontalSection key={s.id} title={s.name} icon="•" items={items} loading={loading} onItemClick={x => handleOpenDetails(x, type)} onViewAll={() => { setSelectedStudio(s); setActiveTab(type === 'tv' ? 'tv' : 'movies'); }} lang={lang} />;
            })}
          </div>
        </div>}

        {/* تبويب سجل المشاهدة */}
        {activeTab === 'history' && <div className="space-y-5">
          <div className="flex items-center justify-between">
            <SectionTitle title={lang === 'ar-SA' ? 'سجل المشاهدة' : 'Watch History'} icon="◷" />
            {watchHistory.length > 0 && <button onClick={clearWatchHistory} className="text-[9px] text-[#94A3B8] bg-[#0F172A] border border-[#1E293B] px-3 py-1.5 rounded-full hover:bg-red-500/20 hover:text-red-400 transition-colors">{lang === 'ar-SA' ? 'مسح السجل' : 'Clear'}</button>}
          </div>
          {!watchHistory.length ? <div className="py-20 text-center text-[#64748B]"><div className="w-16 h-16 mx-auto rounded-2xl bg-[#0F172A] border border-[#1E293B] flex items-center justify-center text-2xl mb-4">◷</div><p className="text-xs">{lang === 'ar-SA' ? 'لا يوجد شيء في سجل المشاهدة بعد.' : 'Your watch history is empty.'}</p></div> :
            <div className="grid grid-cols-3 gap-3">{watchHistory.map(item => <div key={`${item.media_type}-${item.id}`} className="relative"><MovieCard item={item} onClick={() => handleOpenDetails(item, item.media_type || 'movie')} /><button onClick={e => { e.stopPropagation(); removeFromWatchHistory(item); }} className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black/75 border border-white/10 text-white text-[10px] z-10 flex items-center justify-center">✕</button></div>)}</div>}
        </div>}

        {/* تبويب قائمتي */}
        {activeTab === 'mylist' && !searchQuery && <div className="space-y-5">
          <SectionTitle title={lang === 'ar-SA' ? 'قائمتي' : 'My List'} icon="♥" />
          {!myList.length ? <div className="text-center py-20 text-[#64748B]"><div className="w-16 h-16 mx-auto rounded-2xl bg-[#0F172A] border border-[#1E293B] flex items-center justify-center text-2xl mb-4">♡</div><p className="text-xs">{lang === 'ar-SA' ? 'لم تقم بإضافة أي أعمال لقائمتك بعد.' : 'No items in your list yet.'}</p></div> : <div className="grid grid-cols-3 gap-3">{myList.map(item => <MovieCard key={item.id} item={item} onClick={() => handleOpenDetails(item, item.media_type || 'movie')} />)}</div>}
        </div>}

        {/* شبكة الأعمال (Grid Results) */}
        {(activeTab !== 'home' || searchQuery || selectedGenre || selectedStudio || minRating > 0 || selectedYear) && activeTab !== 'mylist' && activeTab !== 'history' &&
          <div className="space-y-5">
            <div className="flex items-end justify-between gap-3">
              <h3 className="text-lg font-black text-white">{searchQuery ? (lang === 'ar-SA' ? 'نتائج البحث' : 'Search Results') : selectedStudio ? SelectedStudio.name : selectedGenre ? Genres.find(g => g.id === Number(selectedGenre))?.name : activeTab === 'movies' ? (lang === 'ar-SA' ? 'الأفلام' : 'Movies') : (lang === 'ar-SA' ? 'المسلسلات' : 'TV Series')}</h3>
              {(selectedGenre || selectedStudio || minRating > 0 || selectedYear) && <button onClick={resetFilters} className="text-[9px] text-[#60A5FA] bg-[#3B82F6]/10 px-3 py-1.5 rounded-full border border-[#3B82F6]/20">{lang === 'ar-SA' ? 'إلغاء الفلتر' : 'Clear'}</button>}
            </div>
            {loading ? <div className="grid grid-cols-3 gap-3">{Array.from({ length: 9 }).map((_, i) => <div key={i} className="aspect-[2/3] bg-[#111827] rounded-2xl animate-pulse" />)}</div> : !gridItems.length ? <div className="text-center py-20 text-[#64748B] text-xs">{lang === 'ar-SA' ? 'لم يتم العثور على نتائج.' : 'No results found.'}</div> :
              <>
                <div className="grid grid-cols-3 gap-3">{gridItems.map(item => <MovieCard key={item.id} item={item} onClick={() => handleOpenDetails(item, activeTab === 'tv' ? 'tv' : 'movie')} />)}</div>
                {page < totalPages && <button onClick={handleLoadMore} disabled={loadingMore} className="w-full h-12 bg-[#0F172A] border border-[#1E293B] text-[#60A5FA] font-bold rounded-2xl text-xs active:scale-95 transition-transform">{loadingMore ? (lang === 'ar-SA' ? 'جاري التحميل...' : 'Loading...') : (lang === 'ar-SA' ? 'تحميل المزيد' : 'Load More')}</button>}
              </>}
          </div>}
      </main>

      {/* شريط التنقل السفلي Navigation Bar */}
      <div className="fixed bottom-3 inset-x-3 mx-auto max-w-md z-40">
        <nav className="h-[70px] bg-[#0B1220]/90 backdrop-blur-xl border border-[#1E293B] rounded-[24px] flex items-center justify-around px-2 shadow-2xl shadow-black">
          <NavItem icon="home" label={lang === 'ar-SA' ? 'الرئيسية' : 'Home'} active={activeTab === 'home' && !searchQuery && !selectedGenre && !selectedStudio && !minRating && !selectedYear} onClick={() => { setActiveTab('home'); resetFilters(); }} />
          <NavItem icon="movie" label={lang === 'ar-SA' ? 'الأفلام' : 'Movies'} active={activeTab === 'movies' && !searchQuery && !selectedGenre && !selectedStudio && !minRating && !selectedYear} onClick={() => { setActiveTab('movies'); resetFilters(); }} />
          <NavItem icon="tv" label={lang === 'ar-SA' ? 'المسلسلات' : 'Series'} active={activeTab === 'tv' && !searchQuery && !selectedGenre && !selectedStudio && !minRating && !selectedYear} onClick={() => { setActiveTab('tv'); resetFilters(); }} />
          <NavItem icon="history" label={lang === 'ar-SA' ? 'السجل' : 'History'} active={activeTab === 'history'} onClick={() => { setActiveTab('history'); resetFilters(); }} />
          <NavItem icon="heart" label={lang === 'ar-SA' ? 'قائمتي' : 'My List'} active={activeTab === 'mylist'} onClick={() => { setActiveTab('mylist'); resetFilters(); }} />
        </nav>
      </div>

      {/* نافذة الفلتر Modal */}
      {showFilterModal && <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center p-3 animate-fade-in">
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-[28px] w-full max-w-md p-5 space-y-5 max-h-[85vh] overflow-y-auto shadow-2xl">
          <div className="flex justify-between items-center"><h3 className="text-base font-black text-white">{lang === 'ar-SA' ? 'تصفية المحتوى' : 'Filter Content'}</h3><button onClick={() => setShowFilterModal(false)} className="w-8 h-8 rounded-full bg-[#111827] text-[#94A3B8]">✕</button></div>
          <div className="space-y-3"><label className="text-[10px] font-bold text-[#94A3B8]">{lang === 'ar-SA' ? 'التصنيف' : 'Genre'}</label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              <button onClick={() => setTempGenre('')} className={`py-2 rounded-xl text-[10px] font-bold border transition-all ${tempGenre === '' ? 'bg-[#3B82F6] border-[#3B82F6] text-white' : 'bg-[#05070A] border-[#1E293B] text-[#94A3B8]'}`}>{lang === 'ar-SA' ? 'الكل' : 'All'}</button>
              {genres.map(g => <button key={g.id} onClick={() => setTempGenre(g.id)} className={`py-2 px-2 rounded-xl text-[10px] font-bold truncate border transition-all ${String(tempGenre) === String(g.id) ? 'bg-[#3B82F6] border-[#3B82F6] text-white' : 'bg-[#05070A] border-[#1E293B] text-[#94A3B8]'}`}>{g.name}</button>)}
            </div></div>
          <div className="space-y-2"><label className="text-[10px] font-bold text-[#94A3B8] flex justify-between"><span>{lang === 'ar-SA' ? 'الحد الأدنى للتقييم' : 'Minimum Rating'}</span><span className="text-[#60A5FA]">★ {tempMinRating}+</span></label>
            <input type="range" min="0" max="9" step="1" value={tempMinRating} onChange={e => setTempMinRating(Number(e.target.value))} className="w-full accent-[#3B82F6]" /></div>
          <div className="space-y-2"><label className="text-[10px] font-bold text-[#94A3B8]">{lang === 'ar-SA' ? 'سنة الإنتاج' : 'Release Year'}</label>
            <select value={tempSelectedYear} onChange={e => setTempSelectedYear(e.target.value)} className="w-full bg-[#05070A] border border-[#1E293B] text-white text-xs rounded-xl p-3 outline-none">
              <option value="">{lang === 'ar-SA' ? 'كل السنين' : 'All Years'}</option>
              {Array.from({ length: 25 }, (_, i) => 2026 - i).map(y => <option key={y} value={y}>{y}</option>)}
            </select></div>
          <button onClick={() => { setSelectedGenre(tempGenre); setMinRating(tempMinRating); setSelectedYear(tempSelectedYear); setSelectedStudio(null); setSearchQuery(''); setShowFilterModal(false); }} className="w-full h-12 bg-[#3B82F6] text-white font-black rounded-2xl text-xs active:scale-95 transition-all">{lang === 'ar-SA' ? 'تطبيق الفلتر' : 'Apply Filters'}</button>
        </div></div>}

      {/* صفحة تفاصيل العمل / المشغل (Player Modal) */}
      {selectedItem && <div className="fixed inset-0 z-50 bg-[#05070A] overflow-y-auto min-h-screen text-[#F8FAFC]">
        <button onClick={() => setSelectedItem(null)} className="fixed top-4 right-4 z-[60] w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white flex items-center justify-center">✕</button>

        {detailsLoading ? <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-2 border-[#3B82F6] border-t-transparent" /></div> :
          <div className="pb-24">
            {isWatching ? (
              <div className="relative w-full aspect-video bg-black flex flex-col rounded-b-2xl overflow-hidden border-b border-[#1E293B]">
                {/* 🟢 مشغل الـ iframe مع خصائص السماح اللازمة لمنع الحظر */}
                <iframe
                  Key={`${activeServer.id}-${details?.id}-${selectedSeasonNumber}-${selectedEpisodeNumber}`}
                  Src={currentEmbedUrl}
                  Title="Watch Server"
                  ClassName="w-full h-full border-0"
                  Allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  Sandbox="allow-forms allow-pointer-lock allow-same-origin allow-scripts allow-top-navigation"
                  AllowFullScreen
                  ReferrerPolicy="no-referrer-when-downgrade"
                />
                <div className="bg-[#0B1220] p-2 flex justify-between items-center text-[10px] text-[#94A3B8]">
                  <span>{lang === 'ar-SA' ? 'تواجه مشكلة في المشاهدة؟' : 'Trouble playing?'}</span>
                  <a href={currentEmbedUrl} target="_blank" rel="noopener noreferrer" className="text-[#60A5FA] font-bold underline">
                    {lang === 'ar-SA' ? 'فتح السيرفر في نافذة خارجية ↗' : 'Open in new tab ↗'}
                  </a>
                </div>
              </div>
            ) : (
              <div className="relative w-full h-[410px] bg-[#05070A]">
                {details?.backdrop_path ? <img src={`${BACKDROP_BASE_URL}${details.backdrop_path}`} alt={details.title || details.name} className="w-full h-full object-cover" loading="eager" /> : <div className="w-full h-full flex items-center justify-center text-[#64748B] text-xs">No Image</div>}
                <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(to top,#05070A 0%,rgba(5,7,10,.35) 55%,transparent 100%)' }} />
                <div className="absolute bottom-5 inset-x-5 space-y-3">
                  <div className="flex items-center gap-2"><span className="bg-[#3B82F6] text-white px-2.5 py-1 rounded-full text-[10px] font-black">★ {details?.vote_average?.toFixed(1) || '0.0'}</span><span className="text-[10px] text-[#CBD5E1]">{details?.release_date?.substring(0, 4) || details?.first_air_date?.substring(0, 4)}</span>{details?.runtime && <><span className="text-[#64748B]">•</span><span className="text-[10px] text-[#CBD5E1]">{details.runtime} {lang === 'ar-SA' ? 'دقيقة' : 'min'}</span></>}</div>
                  <h1 className="text-3xl font-black leading-tight">{details?.title || details?.name}</h1>
                  <div className="flex flex-wrap gap-2">{details?.genres?.slice(0, 4).map(g => <span key={g.id} className="text-[9px] text-[#CBD5E1] bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">{g.name}</span>)}</div>
                </div></div>
            )}

            <div className="px-5 mt-4 space-y-7">
              <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                <button onClick={() => handleStartWatching(selectedEpisodeNumber)} className="h-12 bg-[#3B82F6] active:bg-[#2563EB] text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-[#3B82F6]/30 transition-all">▶ {lang === 'ar-SA' ? 'مشاهدة الآن' : 'Watch Now'}</button>
                <button onClick={() => handlePlayTrailer(details, selectedItemType)} disabled={trailerLoading} className="h-12 bg-[#1E293B] text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 disabled:opacity-70 active:scale-95 transition-all">🎬 {trailerLoading ? (lang === 'ar-SA' ? 'جاري...' : 'Loading...') : (lang === 'ar-SA' ? 'التريلر' : 'Trailer')}</button>
                <button onClick={() => toggleMyList(details, selectedItemType)} className="h-12 w-12 bg-[#111827] border border-[#1E293B] rounded-2xl text-white text-lg flex items-center justify-center active:scale-95 transition-all">{isInMyList(details?.id) ? '✓' : '＋'}</button>
              </div>

              {/* اختيار سيرفر المشاهدة */}
              <div className="space-y-3">
                <SectionTitle title={lang === 'ar-SA' ? 'سيرفرات المشاهدة' : 'Server Sources'} icon="🌐" />
                <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                  {WATCH_SERVERS.map(srv => (
                    <button
                      Key={srv.id}
                      OnClick={() => { setActiveServer(srv); setIsWatching(true); }}
                      ClassName={`flex-shrink-0 px-4 py-2.5 rounded-xl text-[10px] font-bold border transition-all ${activeServer.id === srv.id ? 'bg-[#3B82F6] border-[#3B82F6] text-white shadow-md shadow-[#3B82F6]/30' : 'bg-[#0F172A] border-[#1E293B] text-[#94A3B8]'}`}
                    >
                      {srv.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* مواسم وحلقات المسلسلات */}
              {selectedItemType === 'tv' && details?.seasons?.length > 0 && (
                <div className="space-y-4 pt-2 border-t border-[#1E293B]">
                  <SectionTitle title={lang === 'ar-SA' ? 'المواسم والحلقات' : 'Seasons & Episodes'} icon="📺" />
                  
                  {/* شريط اختيار الموسم */}
                  <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                    {details.seasons.filter(s => s.season_number > 0).map(s => (
                      <button
                        Key={s.id}
                        OnClick={() => setSelectedSeasonNumber(s.season_number)}
                        ClassName={`flex-shrink-0 px-4 py-2 rounded-xl text-[10px] font-bold border transition-all ${selectedSeasonNumber === s.season_number ? 'bg-[#3B82F6] border-[#3B82F6] text-white' : 'bg-[#0F172A] border-[#1E293B] text-[#94A3B8]'}`}
                      >
                        {lang === 'ar-SA' ? `الموسم ${s.season_number}` : `Season ${s.season_number}`}
                      </button>
                    ))}
                  </div>

                  {/* قائمة الحلقات */}
                  {seasonLoading ? (
                    <div className="py-8 text-center text-xs text-[#64748B] animate-pulse">{lang === 'ar-SA' ? 'جاري تحميل الحلقات...' : 'Loading episodes...'}</div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                      {seasonDetails?.episodes?.map(ep => (
                        <button
                          Key={ep.id}
                          OnClick={() => handleStartWatching(ep.episode_number)}
                          ClassName={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between ${selectedEpisodeNumber === ep.episode_number && isWatching ? 'bg-[#3B82F6]/20 border-[#3B82F6] text-white' : 'bg-[#0F172A] border-[#1E293B] text-[#94A3B8]'}`}
                        >
                          <span className="text-[11px] font-bold text-white line-clamp-1">{ep.episode_number}. {ep.name}</span>
                          <span className="text-[9px] text-[#64748B] mt-1">{ep.air_date || ''}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* القصة والتفاصيل */}
              <div className="space-y-2 pt-2 border-t border-[#1E293B]">
                <SectionTitle title={lang === 'ar-SA' ? 'القصة' : 'Overview'} icon="📖" />
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  {details?.overview ? (
                    OverviewExpanded || details.overview.length <= 150
                      ? Details.overview
                      : `${details.overview.slice(0, 150)}... `
                  ) : (lang === 'ar-SA' ? 'لا يوجد وصف متوفر.' : 'No description available.')}
                  {details?.overview && details.overview.length > 150 && (
                    <button onClick={() => setOverviewExpanded(!overviewExpanded)} className="text-[#60A5FA] font-bold mr-1 inline-block">
                      {overviewExpanded ? (lang === 'ar-SA' ? 'عرض أقل' : 'Show less') : (lang === 'ar-SA' ? 'اقرأ المزيد' : 'Read more')}
                    </button>
                  )}
                </p>
              </div>

            </div>
          </div>
        }
      </div>}

      {/* Modal مشاهدة التريلر على YouTube */}
      {trailerKey && (
        <div className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl aspect-video bg-black rounded-2xl overflow-hidden border border-[#1E293B] shadow-2xl">
            <button onClick={() => setTrailerKey(null)} className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center border border-white/10">✕</button>
            <iframe
              Src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
              Title="Trailer"
              ClassName="w-full h-full border-0"
              Allow="autoplay; encrypted-media; picture-in-picture"
              AllowFullScreen
            />
          </div>
        </div>
      )}

    </div>
  );
}

// عناصر واجهة المستخدم المساعدة (UI Helpers)
Function SectionTitle({ title, icon }) {
  Return (
    <div className="flex items-center gap-2">
      <span className="text-sm">{icon}</span>
      <h2 className="text-sm font-black tracking-wide text-white">{title}</h2>
    </div>
  );
}

Function HorizontalSection({ title, icon, items, loading, onItemClick, onViewAll, lang }) {
  If (loading) return <div className="h-44 bg-[#0F172A] rounded-2xl animate-pulse" />;
  If (!items?.length) return null;

  Return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <SectionTitle title={title} icon={icon} />
        {onViewAll && <button onClick={onViewAll} className="text-[10px] text-[#60A5FA] font-bold">{lang === 'ar-SA' ? 'عرض الكل' : 'View All'}</button>}
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2">
        {items.map(item => (
          <div key={item.id} className="flex-shrink-0 w-28">
            <MovieCard item={item} onClick={() => onItemClick(item)} />
          </div>
        ))}
      </div>
    </div>
  );
}

Function MovieCard({ item, onClick }) {
  Const title = item.title || item.name;
  Const rating = item.vote_average ? Item.vote_average.toFixed(1) : null;

  Return (
    <div onClick={onClick} className="group cursor-pointer space-y-1.5 active:scale-95 transition-transform duration-150">
      <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-[#0F172A] border border-[#1E293B]">
        {item.poster_path ? (
          <img src={`${IMAGE_BASE_URL}${item.poster_path}`} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] text-[#64748B]">No Image</div>
        )}
        {rating && (
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md border border-white/10 px-1.5 py-0.5 rounded-lg text-[9px] font-bold text-[#60A5FA]">
            ★ {rating}
          </div>
        )}
      </div>
      <h3 className="text-[11px] font-bold text-[#E2E8F0] truncate leading-tight">{title}</h3>
    </div>
  );
}

Function NavItem({ icon, label, active, onClick }) {
  Const icons = {
    Home: '🏠',
    Movie: '🎬',
    Tv: '📺',
    History: '◷',
    Heart: '♡'
  };

  Return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center gap-1 w-14 h-12 rounded-2xl transition-all ${active ? 'text-[#3B82F6]' : 'text-[#64748B]'}`}>
      <span className="text-base">{icons[icon]}</span>
      <span className="text-[9px] font-bold">{label}</span>
    </button>
  );
}
