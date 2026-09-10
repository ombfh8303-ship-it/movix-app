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

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [lang, setLang] = useState('ar-SA');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

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

  // بيانات الشبكة العامة
  const [gridItems, setGridItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // التفاصيل والتريلر
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemType, setSelectedItemType] = useState('movie');
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [trailerKey, setTrailerKey] = useState(null);

  // حفظ القائمة الشخصية
  useEffect(() => {
    localStorage.setItem('movix_my_list', JSON.stringify(myList));
  }, [myList]);

  // جلب محتوى الصفحة الرئيسية
  useEffect(() => {
    if (activeTab === 'home' && !searchQuery) {
      const loadHomeContent = async () => {
        setLoading(true);
        const [trending, upcoming, topRated] = await Promise.all([
          fetchTrending('movie', 1, lang),
          fetchUpcomingOrPopular('movie', 1, lang),
          fetchTopRated('movie', 1, lang)
        ]);

        setTrendingList(trending.results || []);
        setLatestMoviesList(upcoming.results || []);
        setTopRatedList(topRated.results || []);
        setLoading(false);
      };
      loadHomeContent();
    }
  }, [activeTab, searchQuery, lang]);

  // جلب محتوى البحث أو الأقسام الأخرى
  useEffect(() => {
    if (activeTab !== 'home' || searchQuery) {
      const loadGridContent = async () => {
        setLoading(true);
        const type = activeTab === 'tv' ? 'tv' : 'movie';
        let data;

        if (searchQuery.trim()) {
          data = await searchMedia(searchQuery, type, page, lang);
        } else {
          data = await fetchTrending(type, page, lang);
        }

        setGridItems(data.results || []);
        setTotalPages(data.total_pages || 1);
        setLoading(false);
      };
      loadGridContent();
    }
  }, [activeTab, page, searchQuery, lang]);

  // جلب تفاصيل العمل
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

  const handlePlayTrailer = useCallback(async (item, type = 'movie') => {
    if (!item) return;
    const data = await fetchDetails(type, item.id, lang);
    const trailer = data?.videos?.results?.find(
      (vid) => vid.site === 'YouTube' && (vid.type === 'Trailer' || vid.type === 'Teaser')
    );
    if (trailer) {
      setTrailerKey(trailer.key);
    } else {
      alert(lang === 'ar-SA' ? 'عذراً، الإعلان غير متوفر' : 'Trailer not available');
    }
  }, [lang]);

  const toggleMyList = useCallback((item, type = 'movie') => {
    setMyList((prev) => {
      const exists = prev.some((i) => i.id === item.id);
      if (exists) return prev.filter((i) => i.id !== item.id);
      return [...prev, { ...item, media_type: type }];
    });
  }, []);

  const isInMyList = useCallback((itemId) => myList.some((i) => i.id === itemId), [myList]);

  const featuredItem = useMemo(() => (trendingList.length > 0 ? trendingList[0] : null), [trendingList]);

  return (
    <div
      className="min-h-screen bg-[#05070A] text-[#F8FAFC] antialiased pb-28 font-sans border-[3px] border-[#3B82F6]/30 rounded-[35px] overflow-hidden my-2 max-w-md mx-auto shadow-[0_0_50px_rgba(59,130,246,0.15)]"
      dir={lang === 'ar-SA' ? 'rtl' : 'ltr'}
    >
      {/* 1. Top Bar */}
      <div className="pt-4 px-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#3B82F6] flex items-center justify-center text-white text-xs font-black shadow-md shadow-[#3B82F6]/40">
            ▶
          </div>
          <span className="text-lg font-black tracking-wider text-white">
            MOV<span className="text-[#3B82F6]">IX</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setLang((p) => (p === 'ar-SA' ? 'en-US' : 'ar-SA'))}
            className="flex items-center gap-1 text-xs font-bold bg-[#111827] border border-[#3B82F6]/30 px-2.5 py-1 rounded-full text-[#60A5FA]"
          >
            <span>{lang === 'ar-SA' ? 'EN' : 'العربية'}</span>
            <span>🌐</span>
          </button>
          <button className="text-white text-base">🔍</button>
          <div className="w-7 h-7 rounded-full bg-[#111827] border border-[#3B82F6]/40 flex items-center justify-center text-xs text-[#3B82F6]">
            👤
          </div>
        </div>
      </div>

      <main className="px-4 pt-4 space-y-6">

        {/* 2. Hero Section (طابق الصورة تماماً) */}
        {activeTab === 'home' && !searchQuery && featuredItem && (
          <div className="relative rounded-3xl overflow-hidden bg-[#111827] border border-[#3B82F6]/20 shadow-xl">
            <div className="relative h-[340px] w-full">
              <img
                src={`${BACKDROP_BASE_URL}${featuredItem.backdrop_path || featuredItem.poster_path}`}
                alt={featuredItem.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#05070A] via-[#05070A]/40 to-transparent" />

              {/* تفاصيل الهيرو */}
              <div className="absolute bottom-4 inset-x-4 space-y-2">
                <div className="inline-block bg-[#3B82F6]/20 border border-[#3B82F6]/40 text-[#60A5FA] text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                  مغامرة
                </div>

                <h2 className="text-2xl font-black text-white">
                  {featuredItem.title || featuredItem.name}
                </h2>

                <div className="flex items-center gap-2 text-[11px] text-[#94A3B8] font-medium">
                  <span>مغامرة</span>
                  <span>•</span>
                  <span>عائلي</span>
                  <span>•</span>
                  <span>2026</span>
                  <span className="bg-[#3B82F6]/20 text-[#3B82F6] px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 mr-auto">
                    ★ {featuredItem.vote_average?.toFixed(1) || '7.8'}
                  </span>
                </div>

                <p className="text-[11px] text-[#94A3B8] line-clamp-2 leading-relaxed pt-1">
                  {featuredItem.overview || 'رحلة جديدة عبر المحيط، حيث تبدأ موانا مغامرة ملحمية لاكتشاف هويتها وإنقاذ شعبها.'}
                </p>

                {/* أزرار الإجراءات في البانر */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => handlePlayTrailer(featuredItem)}
                    className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-[#3B82F6]/30 active:scale-95 transition"
                  >
                    <span>▶</span>
                    <span>شاهد الآن</span>
                  </button>

                  <button
                    onClick={() => toggleMyList(featuredItem)}
                    className="bg-[#111827]/80 border border-[#3B82F6]/30 hover:border-[#3B82F6] text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
                  >
                    <span>{isInMyList(featuredItem.id) ? '✓' : '＋'}</span>
                    <span>أضف إلى قائمتي</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. قسم "الأكثر تداولاً" (طابق الصورة) */}
        {activeTab === 'home' && !searchQuery && (
          <>
            <HorizontalSection
              title="🔥 الأكثر تداولاً"
              items={trendingList}
              onItemClick={(item) => {
                setSelectedItemType('movie');
                setSelectedItem(item);
              }}
            />

            <HorizontalSection
              title="🎬 أحدث الأفلام"
              items={latestMoviesList}
              onItemClick={(item) => {
                setSelectedItemType('movie');
                setSelectedItem(item);
              }}
            />
          </>
        )}

        {/* 4. عرض القوائم والبحث */}
        {(activeTab !== 'home' || searchQuery) && (
          <div className="grid grid-cols-2 gap-3 pt-2">
            {gridItems.map((item) => (
              <MovieCard
                key={item.id}
                item={item}
                onClick={() => {
                  setSelectedItemType(activeTab === 'tv' ? 'tv' : 'movie');
                  setSelectedItem(item);
                }}
              />
            ))}
          </div>
        )}

      </main>

      {/* 5. Navbar سفلي مطابق للصورة */}
      <div className="fixed bottom-3 inset-x-0 mx-auto max-w-sm px-4">
        <nav className="bg-[#05070A]/90 border border-[#3B82F6]/30 backdrop-blur-md rounded-2xl py-2 px-3 flex items-center justify-around shadow-2xl">
          <NavItem
            icon="🏠"
            label="الرئيسية"
            active={activeTab === 'home'}
            onClick={() => setActiveTab('home')}
          />
          <NavItem
            icon="🎬"
            label="الأفلام"
            active={activeTab === 'movies'}
            onClick={() => setActiveTab('movies')}
          />
          <NavItem
            icon="📺"
            label="المسلسلات"
            active={activeTab === 'tv'}
            onClick={() => setActiveTab('tv')}
          />
          <NavItem
            icon="♡"
            label="قائمتي"
            active={activeTab === 'mylist'}
            onClick={() => setActiveTab('mylist')}
          />
        </nav>
      </div>

      {/* مشغل التريلر */}
      {trailerKey && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-3">
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-[#3B82F6]">
            <button
              onClick={() => setTrailerKey(null)}
              className="absolute top-2 right-2 bg-[#3B82F6] text-white w-7 h-7 rounded-full text-xs font-bold z-10"
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

// ---------------- مكونات العرض الفرعية ----------------

function HorizontalSection({ title, items, onItemClick }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-white">{title}</h3>
        <button className="text-[11px] text-[#60A5FA] font-bold">عرض الكل &gt;</button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
        {items.map((item) => (
          <div key={item.id} className="w-28 flex-shrink-0">
            <MovieCard item={item} onClick={() => onItemClick(item)} />
          </div>
        ))}
      </div>
    </div>
  );
}

function MovieCard({ item, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-[#111827] rounded-2xl overflow-hidden border border-[#3B82F6]/15 hover:border-[#3B82F6]/50 transition cursor-pointer shadow-md space-y-1.5 p-1"
    >
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#05070A]">
        {item.poster_path ? (
          <img
            src={`${IMAGE_BASE_URL}${item.poster_path}`}
            alt={item.title || item.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#94A3B8] text-[10px]">No Image</div>
        )}
        <div className="absolute top-1.5 right-1.5 bg-[#05070A]/80 border border-[#3B82F6]/40 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold text-white flex items-center gap-0.5">
          <span>{item.vote_average ? item.vote_average.toFixed(1) : '7.5'}</span>
          <span className="text-[#60A5FA]">★</span>
        </div>
      </div>

      <div className="px-1 pb-1 space-y-0.5">
        <h4 className="text-[11px] font-bold text-white truncate">{item.title || item.name}</h4>
        <div className="flex items-center gap-1 text-[9px] text-[#94A3B8]">
          <span>{item.release_date?.substring(0, 4) || '2026'}</span>
          <span>•</span>
          <span className="truncate">خيال علمي</span>
        </div>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition ${
        active ? 'text-[#3B82F6] font-bold' : 'text-[#94A3B8]'
      }`}
    >
      <span className="text-base">{icon}</span>
      <span className="text-[10px]">{label}</span>
    </button>
  );
}
