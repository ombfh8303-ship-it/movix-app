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

// سيرفرات مشغلات محدثة وفعالة
const WATCH_SERVERS = [
  { 
    id: 'vidsrc_icu', 
    name: 'Server 1 (VidSrc.icu)', 
    getUrl: (id, type, s, e) => type === 'tv' ? `https://vidsrc.icu/embed/tv/${id}/${s}/${e}` : `https://vidsrc.icu/embed/movie/${id}` 
  },
  { 
    id: 'vidsrc_me', 
    name: 'Server 2 (VidSrc.me)', 
    getUrl: (id, type, s, e) => type === 'tv' ? `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}` : `https://vidsrc.me/embed/movie?tmdb=${id}` 
  },
  { 
    id: 'superembed', 
    name: 'Server 3 (SuperEmbed)', 
    getUrl: (id, type, s, e) => type === 'tv' ? `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1&s=${s}&e=${e}` : `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1` 
  },
  { 
    id: 'autoembed', 
    name: 'Server 4 (AutoEmbed)', 
    getUrl: (id, type, s, e) => type === 'tv' ? `https://player.autoembed.cc/embed/tv/${id}/${s}/${e}` : `https://player.autoembed.cc/embed/movie/${id}` 
  }
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
            {/* مشغل الفيديو مع الحمايات المحدثة وخيار الفتح في تبويب جديد */}
            {isWatching ? (
              <div className="relative w-full aspect-video bg-black flex flex-col">
                <iframe
                  key={`${activeServer.id}-${details?.id}-${selectedSeasonNumber}-${selectedEpisodeNumber}`}
                  src={currentEmbedUrl}
                  title="Watch Server"
                  className="w-full h-full border-0"
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                  referrerPolicy="no-referrer"
                />
                <div className="bg-[#0B1220] p-2 flex justify-between items-center text-[10px] text-[#94A3B8] border-t border-[#1E293B]">
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

              {/* اختيار المواسم والحلقات للمسلسلات */}
              {selectedItemType === 'tv' && details?.seasons?.length > 0 && (
                <div className="space-y-4 pt-2">
                  <SectionTitle title={lang === 'ar-SA' ? 'المواسم والحلقات' : 'Seasons & Episodes'} icon="📺" />
                  <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                    {details.seasons.filter(s => s.season_number > 0).map(s => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedSeasonNumber(s.season_number)}
                        className={`flex-shrink-0 px-4 py-2 rounded-xl text-[10px] font-bold border transition-colors ${selectedSeasonNumber === s.season_number ? 'bg-[#3B82F6] border-[#3B82F6] text-white' : 'bg-[#0B1220] border-[#1E293B] text-[#94A3B8]'}`}
                      >
                        {lang === 'ar-SA' ? `الموسم ${s.season_number}` : `Season ${s.season_number}`}
                      </button>
                    ))}
                  </div>

                  {seasonLoading ? (
                    <div className="py-6 text-center text-xs text-[#64748B] animate-pulse">{lang === 'ar-SA' ? 'جاري تحميل الحلقات...' : 'Loading episodes...'}</div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {seasonDetails?.episodes?.map(ep => (
                        <button
                          key={ep.id}
                          onClick={() => handleStartWatching(ep.episode_number)}
                          className={`py-3 rounded-xl text-xs font-bold border flex flex-col items-center gap-1 transition-colors ${selectedEpisodeNumber === ep.episode_number && isWatching ? 'bg-[#3B82F6] border-[#3B82F6] text-white' : 'bg-[#0B1220] border-[#1E293B] text-[#CBD5E1]'}`}
                        >
                          <span>{lang === 'ar-SA' ? `حلقة ${ep.episode_number}` : `Ep ${ep.episode_number}`}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* قصة العمل */}
              <div className="space-y-3">
                <SectionTitle title={lang === 'ar-SA' ? 'قصة العمل' : 'Story'} icon="✦" />
                <div className="bg-[#0B1220] border border-[#1E293B] rounded-2xl p-4">
                  <p className={`text-[#CBD5E1] text-[13px] leading-7 ${overviewExpanded ? '' : 'line-clamp-3'}`}>
                    {details?.overview || (lang === 'ar-SA' ? 'لا توجد قصة متاحة لهذا العمل حالياً.' : 'No overview available.')}
                  </p>
                  {details?.overview && details.overview.length > 120 && (
                    <button onClick={() => setOverviewExpanded(!overviewExpanded)} className="text-[#60A5FA] text-[11px] font-bold mt-2">
                      {overviewExpanded ? (lang === 'ar-SA' ? 'عرض أقل' : 'Show Less') : (lang === 'ar-SA' ? 'عرض القصة كاملة' : 'Read More')}
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        }
      </div>}

      {/* نافذة التريلر */}
      {trailerKey && (
        <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-black rounded-2xl overflow-hidden aspect-video border border-[#1E293B]">
            <button onClick={() => setTrailerKey(null)} className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center">✕</button>
            <iframe
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
              title="Trailer"
              className="w-full h-full border-0"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

    </div>
  );
}

// المكونات الفرعية المساعدة
function SectionTitle({ title, icon }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[#3B82F6] text-xs">{icon}</span>
      <h2 className="text-base font-black text-white">{title}</h2>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }) {
  const icons = {
    home: '🏠',
    movie: '🎬',
    tv: '📺',
    history: '◷',
    heart: '♥'
  };
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-[#3B82F6]' : 'text-[#64748B]'}`}>
      <span className="text-lg leading-none">{icons[icon]}</span>
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  );
}

function MovieCard({ item, onClick }) {
  const title = item.title || item.name;
  const rating = item.vote_average?.toFixed(1) || '7.0';
  const year = item.release_date?.substring(0, 4) || item.first_air_date?.substring(0, 4);

  return (
    <div onClick={onClick} className="cursor-pointer group relative bg-[#0F172A] border border-[#1E293B] rounded-2xl overflow-hidden aspect-[2/3]">
      {item.poster_path ? (
        <img src={`${IMAGE_BASE_URL}${item.poster_path}`} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-[#64748B] text-[10px] text-center p-2">{title}</div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90" />
      <div className="absolute bottom-2 inset-x-2 space-y-1">
        <h4 className="text-[11px] font-bold text-white truncate">{title}</h4>
        <div className="flex items-center justify-between text-[9px] text-[#CBD5E1]">
          <span className="text-[#60A5FA] font-bold">★ {rating}</span>
          <span>{year}</span>
        </div>
      </div>
    </div>
  );
}

function HorizontalSection({ title, icon, items, loading, onItemClick, onViewAll, lang }) {
  if (!items?.length && !loading) return null;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <SectionTitle title={title} icon={icon} />
        {onViewAll && <button onClick={onViewAll} className="text-[10px] font-bold text-[#60A5FA]">{lang === 'ar-SA' ? 'عرض الكل' : 'View All'}</button>}
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2">
        {loading ? Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-28 aspect-[2/3] bg-[#111827] rounded-2xl animate-pulse" />
        )) : items.map(item => (
          <div key={item.id} className="flex-shrink-0 w-28">
            <MovieCard item={item} onClick={() => onItemClick(item)} />
          </div>
        ))}
      </div>
    </div>
  );
    }
