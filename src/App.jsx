import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchTrending, fetchTopRated, fetchUpcomingOrPopular, searchMedia,
  fetchDetails, fetchGenres, fetchByGenre, fetchByStudio,
  IMAGE_BASE_URL, BACKDROP_BASE_URL
} from './services/tmdb';

const STUDIOS = [
  { id: 213, name: 'Netflix', logo: 'https://image.tmdb.org/t/p/w200/wwemzKW8219fCA3y023392.png' },
  { id: 2, name: 'Walt Disney', logo: 'https://image.tmdb.org/t/p/w200/wdrCwoL3Bx8pM32pP3C311.png' },
  { id: 420, name: 'Marvel Studios', logo: 'https://image.tmdb.org/t/p/w200/hU3A9R9fA420133.png' },
  { id: 174, name: 'Warner Bros.', logo: 'https://image.tmdb.org/t/p/w200/vRu23414115.png' },
  { id: 49, name: 'HBO', logo: 'https://image.tmdb.org/t/p/w200/tuomPhY213.png' },
  { id: 33, name: 'Universal', logo: 'https://image.tmdb.org/t/p/w200/83o331.png' },
  { id: 4, name: 'Paramount', logo: 'https://image.tmdb.org/t/p/w200/420Paramount.png' }
];

// قائمة سيرفرات المشاهدة المتاحة المحدثة والآمنة
const WATCH_SERVERS = [
  { id: 'vidsrc', name: 'Server 1 (VidSrc)', getUrl: (id, type, s, e) => type === 'tv' ? `https://vidsrc.icu/embed/tv/${id}/${s}/${e}` : `https://vidsrc.icu/embed/movie/${id}` },
  { id: 'vidsrcpro', name: 'Server 2 (VidSrc Pro)', getUrl: (id, type, s, e) => type === 'tv' ? `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}` : `https://vidsrc.cc/v2/embed/movie/${id}` },
  { id: 'superembed', name: 'Server 3 (SuperEmbed)', getUrl: (id, type, s, e) => type === 'tv' ? `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}` : `https://multiembed.mov/?video_id=${id}&tmdb=1` },
  { id: 'embed2', name: 'Server 4 (2Embed)', getUrl: (id, type, s, e) => type === 'tv' ? `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}` : `https://www.2embed.cc/embed/${id}` }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [lang, setLang] = useState('ar-SA');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [myList, setMyList] = useState(() => { try { return JSON.parse(localStorage.getItem('movix_my_list')) || [] } catch { return [] } });
  const [watchHistory, setWatchHistory] = useState(() => { try { return JSON.parse(localStorage.getItem('movix_watch_history')) || [] } catch { return [] } });
  const [trendingList, setTrendingList] = useState([]);
  const [latestMoviesList, setLatestMoviesList] = useState([]);
  const [topRatedList, setTopRatedList] = useState([]);
  const [trendingTvList, setTrendingTvList] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [studioMoviesMap, setStudioMoviesMap] = useState({});
  const [gridItems, setGridItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedStudio, setSelectedStudio] = useState(null);
  const [minRating, setMinRating] = useState(0);
  const [selectedYear, setSelectedYear] = useState('');
  const [tempGenre, setTempGenre] = useState('');
  const [tempMinRating, setTempMinRating] = useState(0);
  const [tempSelectedYear, setTempSelectedYear] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemType, setSelectedItemType] = useState('movie');
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [trailerKey, setTrailerKey] = useState(null);
  const [trailerLoading, setTrailerLoading] = useState(false);
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState(1);
  const [seasonDetails, setSeasonDetails] = useState(null);
  const [seasonLoading, setSeasonLoading] = useState(false);
  const [overviewExpanded, setOverviewExpanded] = useState(false);

  // حالات سيرفر المشاهدة المشغلة
  const [activeServer, setActiveServer] = useState(WATCH_SERVERS[0]);
  const [selectedEpisodeNumber, setSelectedEpisodeNumber] = useState(1);
  const [isWatching, setIsWatching] = useState(false);

  const searchTimer = useRef(null);

  useEffect(() => { try { localStorage.setItem('movix_my_list', JSON.stringify(myList)) } catch { } }, [myList]);
  useEffect(() => { try { localStorage.setItem('movix_watch_history', JSON.stringify(watchHistory)) } catch { } }, [watchHistory]);

  const resetFilters = useCallback(() => {
    setSelectedGenre(''); setSelectedStudio(null); setSearchQuery('');
    setMinRating(0); setSelectedYear(''); setPage(1); setGridItems([]);
  }, []);

  useEffect(() => {
    const type = activeTab === 'tv' ? 'tv' : 'movie';
    fetchGenres(type, lang).then(x => setGenres(x || [])).catch(() => { });
  }, [activeTab, lang]);

  useEffect(() => {
    if (activeTab === 'home' && !searchQuery && !selectedGenre && !selectedStudio && !minRating && !selectedYear) {
      setLoading(true);
      Promise.all([
        fetchTrending('movie', 1, lang),
        fetchUpcomingOrPopular('movie', 1, lang),
        fetchTopRated('movie', 1, lang),
        fetchTrending('tv', 1, lang)
      ]).then(([a, b, c, d]) => {
        setTrendingList(a?.results || []);
        setLatestMoviesList(b?.results || []);
        setTopRatedList(c?.results || []);
        setTrendingTvList(d?.results || []);
        setLoading(false);
      }).catch(() => setLoading(false));

      STUDIOS.forEach(s => {
        const type = s.id === 213 || s.id === 49 ? 'tv' : 'movie';
        fetchByStudio(type, s.id, 1, lang).then(r => {
          setStudioMoviesMap(p => ({ ...p, [s.id]: r?.results || [] }));
        }).catch(() => { });
      });
    }
  }, [activeTab, searchQuery, selectedGenre, selectedStudio, minRating, selectedYear, lang]);

  useEffect(() => {
    if (!trendingList.length) return;
    const t = setInterval(() => setHeroIndex(p => (p + 1) % Math.min(trendingList.length, 5)), 5000);
    return () => clearInterval(t);
  }, [trendingList]);

  const loadGridData = useCallback((pageNum = 1, append = false, query = searchQuery) => {
    pageNum === 1 ? setLoading(true) : setLoadingMore(true);
    const type = activeTab === 'tv' ? 'tv' : 'movie';
    let promise;
    if (query.trim()) promise = searchMedia(query, type, pageNum, lang);
    else if (selectedGenre) promise = fetchByGenre(type, selectedGenre, pageNum, lang);
    else if (selectedStudio) {
      const st = selectedStudio.id === 213 || selectedStudio.id === 49 ? 'tv' : type;
      promise = fetchByStudio(st, selectedStudio.id, pageNum, lang);
    } else promise = fetchTrending(type, pageNum, lang);

    promise.then(data => {
      let results = data?.results || [];
      if (minRating > 0) results = results.filter(x => (x.vote_average || 0) >= minRating);
      if (selectedYear) results = results.filter(x => {
        const d = x.release_date || x.first_air_date || '';
        return d.startsWith(selectedYear);
      });
      setGridItems(p => append ? [...p, ...results] : results);
      setTotalPages(data?.total_pages || 1);
    }).catch(() => { }).finally(() => { setLoading(false); setLoadingMore(false) });
  }, [activeTab, selectedGenre, selectedStudio, minRating, selectedYear, lang, searchQuery]);

  const handleSearchChange = e => {
    const val = e.target.value;
    setSearchQuery(val); setSelectedGenre(''); setSelectedStudio(null);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1); loadGridData(1, false, val);
    }, 400);
  };

  useEffect(() => {
    if (activeTab !== 'home' || selectedGenre || selectedStudio || minRating || selectedYear) {
      setPage(1); loadGridData(1, false, searchQuery);
    }
  }, [activeTab, selectedGenre, selectedStudio, minRating, selectedYear, lang, loadGridData, searchQuery]);

  const handleLoadMore = () => {
    if (page < totalPages && !loadingMore) {
      const n = page + 1; setPage(n); loadGridData(n, true, searchQuery);
    }
  };

  const addToWatchHistory = useCallback((item, type = 'movie') => {
    if (!item?.id) return;
    setWatchHistory(prev => {
      const ni = { ...item, media_type: item.media_type || type, watchedAt: Date.now() };
      const filtered = prev.filter(i => !(i.id === item.id && (i.media_type || type) === ni.media_type));
      return [ni, ...filtered].slice(0, 30);
    });
  }, []);

  const removeFromWatchHistory = useCallback(item => {
    setWatchHistory(p => p.filter(i => !(i.id === item.id && i.media_type === item.media_type)));
  }, []);

  const clearWatchHistory = useCallback(() => setWatchHistory([]), []);

  useEffect(() => {
    if (!selectedItem) { setDetails(null); setIsWatching(false); return }
    setOverviewExpanded(false); setDetailsLoading(true); setIsWatching(false);
    fetchDetails(selectedItemType, selectedItem.id, lang).then(data => {
      setDetails(data);
      if (selectedItemType === 'tv' && data?.seasons?.length) {
        const first = data.seasons.find(s => s.season_number > 0) || data.seasons[0];
        setSelectedSeasonNumber(first.season_number);
        setSelectedEpisodeNumber(1);
      }
    }).catch(() => { }).finally(() => setDetailsLoading(false));
  }, [selectedItem, selectedItemType, lang]);

  useEffect(() => {
    if (selectedItemType !== 'tv' || !selectedItem?.id) {
      setSeasonDetails(null); return;
    }
    setSeasonLoading(true);
    fetch(`https://api.themoviedb.org/3/tv/${selectedItem.id}/season/${selectedSeasonNumber}?api_key=4289874cb3f960f477028fae98f0efd0&language=${lang}`)
      .then(r => r.ok ? r.json() : { episodes: [] })
      .then(setSeasonDetails).catch(() => setSeasonDetails({ episodes: [] })).finally(() => setSeasonLoading(false));
  }, [selectedItem, selectedItemType, selectedSeasonNumber, lang]);

  const getRealTrailer = useCallback(data => {
    const v = data?.videos?.results || [];
    return v.find(x => x.site === 'YouTube' && x.type === 'Trailer' && x.official === true)
      || v.find(x => x.site === 'YouTube' && x.type === 'Trailer')
      || v.find(x => x.site === 'YouTube' && x.type === 'Teaser')
      || v.find(x => x.site === 'YouTube') || null;
  }, []);

  const handlePlayTrailer = useCallback(async (item, type = 'movie') => {
    if (!item) return;
    setTrailerLoading(true);
    try {
      let data = details && details.id === item.id && selectedItemType === type ? details : await fetchDetails(type, item.id, lang);
      const trailer = getRealTrailer(data);
      if (trailer?.key) {
        addToWatchHistory(item, type);
        setTrailerKey(trailer.key);
      } else alert(lang === 'ar-SA' ? 'الإعلان الرسمي غير متوفر حالياً' : 'Official trailer is not available');
    } catch {
      alert(lang === 'ar-SA' ? 'حدث خطأ أثناء تحميل التريلر' : 'Error loading trailer');
    } finally { setTrailerLoading(false) }
  }, [details, selectedItemType, lang, getRealTrailer, addToWatchHistory]);

  const handleStartWatching = useCallback((epNum = 1) => {
    if (!details) return;
    setSelectedEpisodeNumber(epNum);
    setIsWatching(true);
    addToWatchHistory(details, selectedItemType);
  }, [details, selectedItemType, addToWatchHistory]);

  const toggleMyList = useCallback((item, type = 'movie') => {
    if (!item) return;
    setMyList(prev => {
      const exists = prev.some(i => i.id === item.id);
      if (exists) return prev.filter(i => i.id !== item.id);
      return [...prev, { ...item, media_type: type }];
    });
  }, []);

  const isInMyList = useCallback(id => myList.some(i => i.id === id), [myList]);

  const handleOpenDetails = useCallback((item, type = 'movie') => {
    setTrailerKey(null); setOverviewExpanded(false); setIsWatching(false);
    const itemType = item.media_type || type;
    setSelectedItemType(itemType); setSelectedItem(item);
  }, []);

  const genresMap = genres.reduce((a, g) => (a[g.id] = g.name, a), {});
  const featuredItem = trendingList[heroIndex] || trendingList[0];
  const isHome = activeTab === 'home' && !searchQuery && !selectedGenre && !selectedStudio && !minRating && !selectedYear;

  const currentEmbedUrl = activeServer.getUrl(details?.id, selectedItemType, selectedSeasonNumber, selectedEpisodeNumber);

  return (
    <div className="min-h-screen bg-[#05070A] text-[#F8FAFC] pb-24 font-sans max-w-md mx-auto relative select-none" dir={lang === 'ar-SA' ? 'rtl' : 'ltr'}>

      <header className="px-4 pt-5 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setActiveTab('home'); resetFilters() }}>
          <div className="w-9 h-9 rounded-xl bg-[#3B82F6] flex items-center justify-center text-white text-sm font-black">▶</div>
          <div className="leading-none">
            <span className="text-[19px] font-black tracking-[0.08em] text-white">MOV<span className="text-[#3B82F6]">IX</span></span>
            <p className="text-[7px] text-[#64748B] tracking-[0.22em] mt-1 uppercase">Movie Streaming</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setLang(p => p === 'ar-SA' ? 'en-US' : 'ar-SA')} className="h-9 px-3 rounded-full bg-[#0F172A] border border-[#1E293B] text-[#CBD5E1] text-[10px] font-bold flex items-center gap-1.5">🌐 {lang === 'ar-SA' ? 'EN' : 'العربية'}</button>
          <button onClick={() => { setTempGenre(selectedGenre); setTempMinRating(minRating); setTempSelectedYear(selectedYear); setShowFilterModal(true) }} className="w-9 h-9 rounded-full bg-[#0F172A] border border-[#1E293B] text-[#CBD5E1] flex items-center justify-center">⚙</button>
        </div>
      </header>

      <div className="px-4 pt-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 w-10 flex items-center justify-center pointer-events-none text-[#64748B]">🔍</div>
          <input value={searchQuery} onChange={handleSearchChange} placeholder={lang === 'ar-SA' ? 'ابحث عن فيلم، مسلسل، ممثل...' : 'Search movies, series, actors...'} className="w-full h-12 bg-[#0F172A] text-white placeholder-[#64748B] border border-[#1E293B] focus:border-[#3B82F6] px-4 rounded-2xl text-xs outline-none pl-10" />
        </div>
      </div>

      <main className="px-4 pt-5 space-y-8">

        {isHome && genres.length > 0 && <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">{genres.slice(0, 8).map(g => <button key={g.id} onClick={() => { setSelectedGenre(g.id); setActiveTab('movies') }} className="flex-shrink-0 px-4 py-2 rounded-full bg-[#0F172A] border border-[#1E293B] text-[#94A3B8] text-[10px] font-bold">{g.name}</button>)}</div>}

        {isHome && (loading ? <div className="h-[390px] bg-[#111827] rounded-[28px] animate-pulse" /> : featuredItem &&
          <div className="relative overflow-hidden rounded-[28px] bg-[#111827] border border-[#1E293B]">
            <div className="relative h-[390px] w-full">
              <img src={`${BACKDROP_BASE_URL}${featuredItem.backdrop_path || featuredItem.poster_path}`} alt={featuredItem.title || featuredItem.name} className="w-full h-full object-cover" loading="eager" />
              <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(to top,#05070A 0%,rgba(5,7,10,.55) 50%,rgba(5,7,10,.10) 100%)' }} />
              <div className="absolute bottom-5 inset-x-5 space-y-3">
                <div className="flex items-center gap-2"><span className="bg-[#3B82F6] text-white px-2.5 py-1 rounded-full text-[9px] font-black">{featuredItem.genre_ids?.length ? genresMap[featuredItem.genre_ids[0]] || 'مميز' : 'مميز'}</span><span className="text-[9px] text-[#CBD5E1] bg-black/30 border border-white/10 px-2 py-1 rounded-full">جديد</span></div>
                <h1 className="text-[28px] font-black text-white leading-tight truncate">{featuredItem.title || featuredItem.name}</h1>
                <div className="flex items-center gap-2 text-[10px] text-[#CBD5E1]"><span className="text-[#60A5FA] font-bold">★ {featuredItem.vote_average?.toFixed(1) || '7.8'}</span><span>•</span><span>{featuredItem.release_date?.substring(0, 4) || featuredItem.first_air_date?.substring(0, 4) || '2026'}</span><span>•</span><span>HD</span></div>
                <div className="grid grid-cols-[1.35fr_1fr] gap-2 pt-1">
                  <button onClick={() => handleOpenDetails(featuredItem, 'movie')} className="h-11 bg-[#3B82F6] text-white font-black rounded-2xl text-xs flex items-center justify-center gap-2">▶ {lang === 'ar-SA' ? 'شاهد الآن' : 'Watch Now'}</button>
                  <button onClick={() => toggleMyList(featuredItem, 'movie')} className="h-11 bg-[#0F172A] border border-white/10 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2">{isInMyList(featuredItem.id) ? '✓' : '＋'} {isInMyList(featuredItem.id) ? (lang === 'ar-SA' ? 'في قائمتي' : 'In List') : (lang === 'ar-SA' ? 'قائمتي' : 'My List')}</button>
                </div>
                <div className="flex justify-center gap-1.5 pt-1">{trendingList.slice(0, 5).map((_, i) => <button key={i} onClick={() => setHeroIndex(i)} className={`h-1.5 rounded-full ${heroIndex === i ? 'w-6 bg-[#3B82F6]' : 'w-1.5 bg-[#64748B]/60'}`} />)}</div>
              </div>
            </div>
          </div>)}

        {isHome && <div className="space-y-8">
          <HorizontalSection title={lang === 'ar-SA' ? 'الأكثر رواجاً' : 'Trending Now'} icon="🔥" items={trendingList} loading={loading} onItemClick={x => handleOpenDetails(x, 'movie')} onViewAll={() => setActiveTab('movies')} lang={lang} />
          <HorizontalSection title={lang === 'ar-SA' ? 'أحدث الأفلام' : 'Latest Movies'} icon="✦" items={latestMoviesList} loading={loading} onItemClick={x => handleOpenDetails(x, 'movie')} onViewAll={() => setActiveTab('movies')} lang={lang} />
          <HorizontalSection title={lang === 'ar-SA' ? 'الأعلى تقييماً' : 'Top Rated'} icon="★" items={topRatedList} loading={loading} onItemClick={x => handleOpenDetails(x, 'movie')} onViewAll={() => setActiveTab('movies')} lang={lang} />
          <HorizontalSection title={lang === 'ar-SA' ? 'المسلسلات الرائجة' : 'Popular TV'} icon="▣" items={trendingTvList} loading={loading} onItemClick={x => handleOpenDetails(x, 'tv')} onViewAll={() => setActiveTab('tv')} lang={lang} />

          <div className="pt-5 border-t border-[#1E293B] space-y-8">
            <SectionTitle title={lang === 'ar-SA' ? 'شركات الإنتاج' : 'Production Studios'} icon="▣" />
            {STUDIOS.map(s => {
              const items = studioMoviesMap[s.id] || [];
              if (!items.length && !loading) return null;
              const type = s.id === 213 || s.id === 49 ? 'tv' : 'movie';
              return <HorizontalSection key={s.id} title={s.name} icon="•" items={items} loading={loading} onItemClick={x => handleOpenDetails(x, type)} onViewAll={() => { setSelectedStudio(s); setActiveTab(type === 'tv' ? 'tv' : 'movies') }} lang={lang} />
            })}
          </div>
        </div>}

        {activeTab === 'history' && <div className="space-y-5">
          <div className="flex items-center justify-between"><SectionTitle title={lang === 'ar-SA' ? 'سجل المشاهدة' : 'Watch History'} icon="◷" />{watchHistory.length > 0 && <button onClick={clearWatchHistory} className="text-[9px] text-[#94A3B8] bg-[#0F172A] border border-[#1E293B] px-3 py-1.5 rounded-full">{lang === 'ar-SA' ? 'مسح السجل' : 'Clear'}</button>}</div>
          {!watchHistory.length ? <div className="py-20 text-center text-[#64748B]"><div className="w-16 h-16 mx-auto rounded-2xl bg-[#0F172A] border border-[#1E293B] flex items-center justify-center text-2xl mb-4">◷</div><p className="text-xs">{lang === 'ar-SA' ? 'لا يوجد شيء في سجل المشاهدة بعد.' : 'Your watch history is empty.'}</p></div> :
            <div className="grid grid-cols-3 gap-3">{watchHistory.map(item => <div key={`${item.media_type}-${item.id}`} className="relative"><MovieCard item={item} onClick={() => handleOpenDetails(item, item.media_type || 'movie')} /><button onClick={e => { e.stopPropagation(); removeFromWatchHistory(item) }} className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black/75 border border-white/10 text-white text-[10px] z-10">✕</button></div>)}</div>}
        </div>}

        {activeTab === 'mylist' && !searchQuery && <div className="space-y-5">
          <SectionTitle title={lang === 'ar-SA' ? 'قائمتي' : 'My List'} icon="♥" />
          {!myList.length ? <div className="text-center py-20 text-[#64748B]"><div className="w-16 h-16 mx-auto rounded-2xl bg-[#0F172A] border border-[#1E293B] flex items-center justify-center text-2xl mb-4">♡</div><p className="text-xs">{lang === 'ar-SA' ? 'لم تقم بإضافة أي أعمال لقائمتك بعد.' : 'No items in your list yet.'}</p></div> : <div className="grid grid-cols-3 gap-3">{myList.map(item => <MovieCard key={item.id} item={item} onClick={() => handleOpenDetails(item, item.media_type || 'movie')} />)}</div>}
        </div>}

        {(activeTab !== 'home' || searchQuery || selectedGenre || selectedStudio || minRating > 0 || selectedYear) && activeTab !== 'mylist' && activeTab !== 'history' &&
          <div className="space-y-5">
            <div className="flex items-end justify-between gap-3">
              <h3 className="text-lg font-black text-white">{searchQuery ? (lang === 'ar-SA' ? 'نتائج البحث' : 'Search Results') : selectedStudio ? selectedStudio.name : selectedGenre ? genres.find(g => g.id === Number(selectedGenre))?.name : activeTab === 'movies' ? (lang === 'ar-SA' ? 'الأفلام' : 'Movies') : (lang === 'ar-SA' ? 'المسلسلات' : 'TV Series')}</h3>
              {(selectedGenre || selectedStudio || minRating > 0 || selectedYear) && <button onClick={resetFilters} className="text-[9px] text-[#60A5FA] bg-[#3B82F6]/10 px-3 py-1.5 rounded-full border border-[#3B82F6]/20">{lang === 'ar-SA' ? 'إلغاء الفلتر' : 'Clear'}</button>}
            </div>
            {loading ? <div className="grid grid-cols-3 gap-3">{Array.from({ length: 9 }).map((_, i) => <div key={i} className="aspect-[2/3] bg-[#111827] rounded-2xl animate-pulse" />)}</div> : !gridItems.length ? <div className="text-center py-20 text-[#64748B] text-xs">{lang === 'ar-SA' ? 'لم يتم العثور على نتائج.' : 'No results found.'}</div> :
              <>
                <div className="grid grid-cols-3 gap-3">{gridItems.map(item => <MovieCard key={item.id} item={item} onClick={() => handleOpenDetails(item, activeTab === 'tv' ? 'tv' : 'movie')} />)}</div>
                {page < totalPages && <button onClick={handleLoadMore} disabled={loadingMore} className="w-full h-12 bg-[#0F172A] border border-[#1E293B] text-[#60A5FA] font-bold rounded-2xl text-xs">{loadingMore ? (lang === 'ar-SA' ? 'جاري التحميل...' : 'Loading...') : (lang === 'ar-SA' ? 'تحميل المزيد' : 'Load More')}</button>}
              </>}
          </div>}
      </main>

      {/* Navigation Bar */}
      <div className="fixed bottom-3 inset-x-3 mx-auto max-w-md z-40">
        <nav className="h-[70px] bg-[#0B1220] border border-[#1E293B] rounded-[24px] flex items-center justify-around px-2 shadow-xl shadow-black/40">
          <NavItem icon="home" label={lang === 'ar-SA' ? 'الرئيسية' : 'Home'} active={activeTab === 'home' && !searchQuery && !selectedGenre && !selectedStudio && !minRating && !selectedYear} onClick={() => { setActiveTab('home'); resetFilters() }} />
          <NavItem icon="movie" label={lang === 'ar-SA' ? 'الأفلام' : 'Movies'} active={activeTab === 'movies' && !searchQuery && !selectedGenre && !selectedStudio && !minRating && !selectedYear} onClick={() => { setActiveTab('movies'); resetFilters() }} />
          <NavItem icon="tv" label={lang === 'ar-SA' ? 'المسلسلات' : 'Series'} active={activeTab === 'tv' && !searchQuery && !selectedGenre && !selectedStudio && !minRating && !selectedYear} onClick={() => { setActiveTab('tv'); resetFilters() }} />
          <NavItem icon="history" label={lang === 'ar-SA' ? 'السجل' : 'History'} active={activeTab === 'history'} onClick={() => { setActiveTab('history'); resetFilters() }} />
          <NavItem icon="heart" label={lang === 'ar-SA' ? 'قائمتي' : 'My List'} active={activeTab === 'mylist'} onClick={() => { setActiveTab('mylist'); resetFilters() }} />
        </nav>
      </div>

      {/* Filter Modal */}
      {showFilterModal && <div className="fixed inset-0 z-50 bg-black/80 flex items-end justify-center p-3">
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-[28px] w-full max-w-md p-5 space-y-5 max-h-[85vh] overflow-y-auto">
          <div className="flex justify-between items-center"><h3 className="text-base font-black text-white">{lang === 'ar-SA' ? 'تصفية المحتوى' : 'Filter Content'}</h3><button onClick={() => setShowFilterModal(false)} className="w-8 h-8 rounded-full bg-[#111827] text-[#94A3B8]">✕</button></div>
          <div className="space-y-3"><label className="text-[10px] font-bold text-[#94A3B8]">{lang === 'ar-SA' ? 'التصنيف' : 'Genre'}</label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              <button onClick={() => setTempGenre('')} className={`py-2 rounded-xl text-[10px] font-bold border ${tempGenre === '' ? 'bg-[#3B82F6] border-[#3B82F6] text-white' : 'bg-[#05070A] border-[#1E293B] text-[#94A3B8]'}`}>{lang === 'ar-SA' ? 'الكل' : 'All'}</button>
              {genres.map(g => <button key={g.id} onClick={() => setTempGenre(g.id)} className={`py-2 px-2 rounded-xl text-[10px] font-bold truncate border ${String(tempGenre) === String(g.id) ? 'bg-[#3B82F6] border-[#3B82F6] text-white' : 'bg-[#05070A] border-[#1E293B] text-[#94A3B8]'}`}>{g.name}</button>)}
            </div></div>
          <div className="space-y-2"><label className="text-[10px] font-bold text-[#94A3B8] flex justify-between"><span>{lang === 'ar-SA' ? 'الحد الأدنى للتقييم' : 'Minimum Rating'}</span><span className="text-[#60A5FA]">★ {tempMinRating}+</span></label>
            <input type="range" min="0" max="9" step="1" value={tempMinRating} onChange={e => setTempMinRating(Number(e.target.value))} className="w-full accent-[#3B82F6]" /></div>
          <div className="space-y-2"><label className="text-[10px] font-bold text-[#94A3B8]">{lang === 'ar-SA' ? 'سنة الإنتاج' : 'Release Year'}</label>
            <select value={tempSelectedYear} onChange={e => setTempSelectedYear(e.target.value)} className="w-full bg-[#05070A] border border-[#1E293B] text-white text-xs rounded-xl p-3 outline-none">
              <option value="">{lang === 'ar-SA' ? 'كل السنين' : 'All Years'}</option>
              {Array.from({ length: 25 }, (_, i) => 2026 - i).map(y => <option key={y} value={y}>{y}</option>)}
            </select></div>
          <button onClick={() => { setSelectedGenre(tempGenre); setMinRating(tempMinRating); setSelectedYear(tempSelectedYear); setSelectedStudio(null); setSearchQuery(''); setShowFilterModal(false) }} className="w-full h-12 bg-[#3B82F6] text-white font-black rounded-2xl text-xs">{lang === 'ar-SA' ? 'تطبيق الفلتر' : 'Apply Filters'}</button>
        </div></div>}

      {/* Details Modal / Player Window */}
      {selectedItem && <div className="fixed inset-0 z-50 bg-[#05070A] overflow-y-auto min-h-screen text-[#F8FAFC]">
        <button onClick={() => setSelectedItem(null)} className="fixed top-4 left-4 z-[60] w-10 h-10 rounded-full bg-black/60 border border-white/10 text-white flex items-center justify-center">✕</button>

        {detailsLoading ? <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-2 border-[#3B82F6] border-t-transparent" /></div> :
          <div className="pb-24">
            {/* مشغل الفيديو مع الحماية الكاملة لمنع التوجيه والشاشة البيضاء */}
            {isWatching ? (
              <div className="relative w-full aspect-video bg-black">
                <iframe
                  key={currentEmbedUrl}
                  src={currentEmbedUrl}
                  title="Watch Server"
                  className="w-full h-full border-0"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  sandbox="allow-scripts allow-same-origin allow-forms"
                  referrerPolicy="origin"
                />
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
                <button onClick={() => handleStartWatching(selectedEpisodeNumber)} className="h-12 bg-[#3B82F6] text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2">▶ {lang === 'ar-SA' ? 'مشاهدة الآن' : 'Watch Now'}</button>
                <button onClick={() => handlePlayTrailer(details, selectedItemType)} disabled={trailerLoading} className="h-12 bg-[#1E293B] text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 disabled:opacity-70">🎬 {trailerLoading ? (lang === 'ar-SA' ? 'جاري...' : 'Loading...') : (lang === 'ar-SA' ? 'التريلر' : 'Trailer')}</button>
                <button onClick={() => toggleMyList(details, selectedItemType)} className="h-12 w-12 bg-[#111827] border border-[#1E293B] rounded-2xl text-white text-lg flex items-center justify-center">{isInMyList(details?.id) ? '✓' : '＋'}</button>
              </div>

              {/* اختيار سيرفر المشاهدة */}
              <div className="space-y-3">
                <SectionTitle title={lang === 'ar-SA' ? 'سيرفرات المشاهدة' : 'Server Sources'} icon="🌐" />
                <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                  {WATCH_SERVERS.map(srv => (
                    <button
                      key={srv.id}
                      onClick={() => { setActiveServer(srv); setIsWatching(true); }}
                      className={`flex-shrink-0 px-4 py-2 rounded-xl text-[10px] font-bold border transition-colors ${activeServer.id === srv.id ? 'bg-[#3B82F6] border-[#3B82F6] text-white' : 'bg-[#0B1220] border-[#1E293B] text-[#94A3B8]'}`}
                    >
                      {srv.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <SectionTitle title={lang === 'ar-SA' ? 'قصة العمل' : 'Story'} icon="✦" />
                <div className="bg-[#0B1220] border border-[#1E293B] rounded-2xl p-4">
                  <p className={`text-[#CBD5E1] text-[13px] leading-7 ${overviewExpanded ? '' : 'line-clamp-4'}`}>{details?.overview || (lang === 'ar-SA' ? 'لا يوجد وصف متاح لهذا العمل حالياً.' : 'No overview available.')}</p>
                  {details?.overview?.length > 220 && <button onClick={() => setOverviewExpanded(p => !p)} className="mt-3 text-[10px] font-bold text-[#60A5FA]">{overviewExpanded ? (lang === 'ar-SA' ? 'عرض أقل' : 'Show Less') : (lang === 'ar-SA' ? 'عرض القصة كاملة' : 'Read Full Story')}</button>}
                </div></div>

              <div className="grid grid-cols-3 gap-2">
                <InfoBox label={lang === 'ar-SA' ? 'التقييم' : 'Rating'} value={details?.vote_average ? details.vote_average.toFixed(1) : '—'} />
                <InfoBox label={lang === 'ar-SA' ? 'التصويتات' : 'Votes'} value={details?.vote_count ? details.vote_count.toLocaleString() : '—'} />
                <InfoBox label={lang === 'ar-SA' ? 'النوع' : 'Type'} value={selectedItemType === 'tv' ? (lang === 'ar-SA' ? 'مسلسل' : 'Series') : (lang === 'ar-SA' ? 'فيلم' : 'Movie')} />
              </div>

              {selectedItemType === 'tv' && details?.seasons?.length > 0 && <div className="space-y-3">
                <SectionTitle title={lang === 'ar-SA' ? 'المواسم والحلقات' : 'Seasons & Episodes'} icon="▣" />
                <div className="flex gap-2 overflow-x-auto scrollbar-none">{details.seasons.filter(s => s.season_number > 0).map(s => <button key={s.id} onClick={() => setSelectedSeasonNumber(s.season_number)} className={`flex-shrink-0 px-4 py-2 rounded-full text-[10px] font-bold border ${selectedSeasonNumber === s.season_number ? 'bg-[#3B82F6] border-[#3B82F6] text-white' : 'bg-[#111827] border-[#1E293B] text-[#94A3B8]'}`}>{lang === 'ar-SA' ? `الموسم ${s.season_number}` : `Season ${s.season_number}`}</button>)}</div>
                {seasonLoading ? <div className="text-center py-6 text-xs text-[#64748B]">{lang === 'ar-SA' ? 'جاري التحميل...' : 'Loading...'}</div> :
                  <div className="space-y-2">{seasonDetails?.episodes?.map(ep => <div key={ep.id} className="flex gap-3 bg-[#111827] p-2 rounded-2xl border border-[#1E293B]">
                    <img src={ep.still_path ? `${IMAGE_BASE_URL}${ep.still_path}` : 'https://via.placeholder.com/100x60?text=EP'} alt={ep.name} className="w-20 h-12 rounded-xl object-cover flex-shrink-0" loading="lazy" />
                    <div className="min-w-0 flex-1 flex flex-col justify-center"><h4 className="text-[10px] font-bold text-white truncate">{ep.episode_number}. {ep.name}</h4>{ep.overview && <p className="text-[9px] text-[#64748B] mt-1 line-clamp-2">{ep.overview}</p>}</div>
                    <button onClick={() => handleStartWatching(ep.episode_number)} className="w-8 h-8 rounded-full bg-[#0F172A] self-center flex items-center justify-center text-[#60A5FA] flex-shrink-0">▶</button>
                  </div>)}</div>}
              </div>}

              {details?.credits?.cast?.length > 0 && <div className="space-y-3">
                <SectionTitle title={lang === 'ar-SA' ? 'طاقم التمثيل' : 'Cast'} icon="●" />
                <div className="flex gap-3 overflow-x-auto scrollbar-none">{details.credits.cast.slice(0, 10).map(actor => <div key={actor.id} className="flex-shrink-0 w-20 text-center">
                  <div className="w-16 h-16 mx-auto rounded-full overflow-hidden border border-[#1E293B] bg-[#111827]"><img src={actor.profile_path ? `${IMAGE_BASE_URL}${actor.profile_path}` : 'https://via.placeholder.com/100?text=Actor'} alt={actor.name} className="w-full h-full object-cover" loading="lazy" /></div>
                  <p className="text-[9px] font-bold text-white truncate mt-2">{actor.name}</p>
                </div>)}</div>
              </div>}

              {details?.similar?.results?.length > 0 && <HorizontalDetailSection
                title={lang === 'ar-SA' ? 'أفلام مشابهة' : 'Similar Movies'}
                icon="🎬"
                items={details.similar.results}
                type={selectedItemType}
                onItemClick={handleOpenDetails}
                lang={lang}
              />}

              {details?.recommendations?.results?.length > 0 && <HorizontalDetailSection
                title={lang === 'ar-SA' ? 'ننصحك بمشاهدتها' : 'Recommended for You'}
                icon="🔥"
                items={details.recommendations.results}
                type={selectedItemType}
                onItemClick={handleOpenDetails}
                lang={lang}
              />}

            </div></div>}
      </div>}

      {/* Trailer Modal */}
      {trailerKey && <div className="fixed inset-0 z-[70] bg-black/95 flex items-center justify-center p-3">
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-[#1E293B]">
          <button onClick={() => setTrailerKey(null)} className="absolute top-2 right-2 bg-[#3B82F6] text-white w-8 h-8 rounded-full text-xs font-bold z-10">✕</button>
          <iframe src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1`} title="Official Trailer" className="w-full h-full border-0" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
        </div></div>}
    </div>
  );
}

// Sub-components
const NavItem = ({ icon, label, active, onClick }) => {
  const getIcon = () => {
    switch (icon) {
      case 'home':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />;
      case 'movie':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />;
      case 'tv':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />;
      case 'history':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />;
      case 'heart':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />;
      default:
        return null;
    }
  };

  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 ${active ? 'text-[#3B82F6]' : 'text-[#64748B]'}`}>
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {getIcon()}
      </svg>
      <span className="text-[9px] font-bold">{label}</span>
    </button>
  );
};

const SectionTitle = ({ title, icon }) => (
  <div className="flex items-center gap-2">
    <span className="text-sm">{icon}</span>
    <h3 className="text-sm font-black text-white">{title}</h3>
  </div>
);

const InfoBox = ({ label, value }) => (
  <div className="bg-[#0B1220] border border-[#1E293B] p-3 rounded-2xl text-center">
    <p className="text-[9px] font-bold text-[#64748B] mb-1">{label}</p>
    <p className="text-xs font-black text-white">{value}</p>
  </div>
);

const MovieCard = ({ item, onClick }) => (
  <div onClick={onClick} className="cursor-pointer space-y-1.5 group">
    <div className="aspect-[2/3] rounded-2xl overflow-hidden bg-[#111827] border border-[#1E293B] relative">
      <img src={item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Image'} alt={item.title || item.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md border border-white/10 px-1.5 py-0.5 rounded-lg text-[8px] font-black text-[#60A5FA]">
        ★ {item.vote_average?.toFixed(1) || '0.0'}
      </div>
    </div>
    <h4 className="text-[10px] font-bold text-white truncate">{item.title || item.name}</h4>
  </div>
);

const HorizontalSection = ({ title, icon, items, loading, onItemClick, onViewAll, lang }) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <SectionTitle title={title} icon={icon} />
      {onViewAll && <button onClick={onViewAll} className="text-[10px] font-bold text-[#60A5FA]">{lang === 'ar-SA' ? 'عرض الكل' : 'View All'}</button>}
    </div>
    <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1">
      {loading ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="flex-shrink-0 w-28 aspect-[2/3] bg-[#111827] rounded-2xl animate-pulse" />)
        : items.slice(0, 10).map(item => (
          <div key={item.id} className="flex-shrink-0 w-28">
            <MovieCard item={item} onClick={() => onItemClick(item)} />
          </div>
        ))}
    </div>
  </div>
);

const HorizontalDetailSection = ({ title, icon, items, type, onItemClick, lang }) => (
  <div className="space-y-3">
    <SectionTitle title={title} icon={icon} />
    <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1">
      {items.slice(0, 10).map(item => (
        <div key={item.id} className="flex-shrink-0 w-28">
          <MovieCard item={item} onClick={() => onItemClick(item, type)} />
        </div>
      ))}
    </div>
  </div>
);
