import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  fetchTrending,
  fetchTopRated,
  fetchUpcomingOrPopular,
  searchMedia,
  fetchDetails,
  fetchGenres,
  fetchByGenre,
  fetchByStudio,
  IMAGE_BASE_URL,
  BACKDROP_BASE_URL
} from './services/tmdb';

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
  const [activeTab, setActiveTab] = useState('home');
  const [lang, setLang] = useState('ar-SA');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [myList, setMyList] = useState(() => {
    try {
      const saved = localStorage.getItem('movix_my_list');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

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
  const [activeDetailTab, setActiveDetailTab] = useState('similar');

  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState(1);
  const [seasonDetails, setSeasonDetails] = useState(null);
  const [seasonLoading, setSeasonLoading] = useState(false);

  const resetFilters = useCallback(() => {
    setSelectedGenre('');
    setSelectedStudio(null);
    setSearchQuery('');
    setMinRating(0);
    setSelectedYear('');
    setPage(1);
    setGridItems([]);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('movix_my_list', JSON.stringify(myList));
    } catch (err) {
      console.error('Error saving my list:', err);
    }
  }, [myList]);

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

    return () => {
      isMounted = false;
    };
  }, [activeTab, lang]);

  /* =========================
     HOME DATA
  ========================= */

  useEffect(() => {
    if (
      activeTab === 'home' &&
      !searchQuery &&
      !selectedGenre &&
      !selectedStudio &&
      !minRating &&
      !selectedYear
    ) {
      let isMounted = true;

      const loadHomeContent = async () => {
        setLoading(true);

        try {
          const [
            trending,
            upcoming,
            topRated,
            tvTrending
          ] = await Promise.all([
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

          const studioResults = await Promise.allSettled(
            STUDIOS.map(async (s) => {
              const type =
                s.id === 213 || s.id === 49
                  ? 'tv'
                  : 'movie';

              const res = await fetchByStudio(
                type,
                s.id,
                1,
                lang
              );

              return {
                id: s.id,
                items: res?.results || []
              };
            })
          );

          if (!isMounted) return;

          const sMap = {};

          studioResults.forEach((sr) => {
            if (sr.status === 'fulfilled') {
              sMap[sr.value.id] = sr.value.items;
            }
          });

          setStudioMoviesMap(sMap);
        } catch (err) {
          console.error('Error loading home content:', err);
        } finally {
          if (isMounted) setLoading(false);
        }
      };

      loadHomeContent();

      return () => {
        isMounted = false;
      };
    }
  }, [
    activeTab,
    searchQuery,
    selectedGenre,
    selectedStudio,
    minRating,
    selectedYear,
    lang
  ]);

  /* =========================
     HERO SLIDER
  ========================= */

  useEffect(() => {
    if (trendingList.length === 0) return;

    const interval = setInterval(() => {
      setHeroIndex(
        (prevIndex) =>
          (prevIndex + 1) %
          Math.min(trendingList.length, 5)
      );
    }, 6000);

    return () => clearInterval(interval);
  }, [trendingList]);

  /* =========================
     GRID DATA
  ========================= */

  const loadGridData = useCallback(
    async (pageNum = 1, append = false) => {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const type =
        activeTab === 'tv'
          ? 'tv'
          : 'movie';

      let data;

      try {
        if (searchQuery.trim()) {
          data = await searchMedia(
            searchQuery,
            type,
            pageNum,
            lang
          );
        } else if (selectedGenre) {
          data = await fetchByGenre(
            type,
            selectedGenre,
            pageNum,
            lang
          );
        } else if (selectedStudio) {
          const studioType =
            selectedStudio.id === 213 ||
            selectedStudio.id === 49
              ? 'tv'
              : type;

          data = await fetchByStudio(
            studioType,
            selectedStudio.id,
            pageNum,
            lang
          );
        } else {
          data = await fetchTrending(
            type,
            pageNum,
            lang
          );
        }

        let results = data?.results || [];

        if (minRating > 0) {
          results = results.filter(
            (item) =>
              (item.vote_average || 0) >=
              minRating
          );
        }

        if (selectedYear) {
          results = results.filter((item) => {
            const date =
              item.release_date ||
              item.first_air_date ||
              '';

            return date.startsWith(
              selectedYear
            );
          });
        }

        setGridItems((prev) =>
          append
            ? [...prev, ...results]
            : results
        );

        setTotalPages(
          data?.total_pages || 1
        );
      } catch (err) {
        console.error(
          'Error fetching grid items:',
          err
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [
      activeTab,
      searchQuery,
      selectedGenre,
      selectedStudio,
      minRating,
      selectedYear,
      lang
    ]
  );

  useEffect(() => {
    if (
      activeTab !== 'home' ||
      searchQuery ||
      selectedGenre ||
      selectedStudio ||
      minRating ||
      selectedYear
    ) {
      setPage(1);
      loadGridData(1, false);
    }
  }, [
    activeTab,
    searchQuery,
    selectedGenre,
    selectedStudio,
    minRating,
    selectedYear,
    lang,
    loadGridData
  ]);

  const handleLoadMore = () => {
    if (
      page < totalPages &&
      !loadingMore
    ) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadGridData(nextPage, true);
    }
  };

  /* =========================
     DETAILS
  ========================= */

  useEffect(() => {
    if (!selectedItem) {
      setDetails(null);
      return;
    }

    let isMounted = true;

    const getDetails = async () => {
      setDetailsLoading(true);

      try {
        const data = await fetchDetails(
          selectedItemType,
          selectedItem.id,
          lang
        );

        if (!isMounted) return;

        setDetails(data);

        const trailer =
          data?.videos?.results?.find(
            (vid) =>
              vid.site === 'YouTube' &&
              (
                vid.type === 'Trailer' ||
                vid.type === 'Teaser'
              )
          );

        setTrailerKey(
          trailer ? trailer.key : null
        );

        if (
          selectedItemType === 'tv' &&
          data?.seasons?.length > 0
        ) {
          const firstSeason =
            data.seasons.find(
              (s) => s.season_number > 0
            ) || data.seasons[0];

          setSelectedSeasonNumber(
            firstSeason.season_number
          );
        }
      } catch (err) {
        console.error(
          'Error fetching details:',
          err
        );
      } finally {
        if (isMounted) {
          setDetailsLoading(false);
        }
      }
    };

    getDetails();

    return () => {
      isMounted = false;
    };
  }, [
    selectedItem,
    selectedItemType,
    lang
  ]);

  /* =========================
     SEASON DETAILS
  ========================= */

  useEffect(() => {
    if (
      selectedItemType !== 'tv' ||
      !selectedItem?.id ||
      selectedSeasonNumber === null
    ) {
      setSeasonDetails(null);
      return;
    }

    let isMounted = true;

    const getSeasonDetails = async () => {
      setSeasonLoading(true);

      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/tv/${selectedItem.id}/season/${selectedSeasonNumber}?api_key=4289874cb3f960f477028fae98f0efd0&language=${lang}`
        );

        if (res.ok) {
          const data = await res.json();

          if (isMounted) {
            setSeasonDetails(data);
          }
        } else {
          if (isMounted) {
            setSeasonDetails({
              episodes: []
            });
          }
        }
      } catch (err) {
        console.error(
          'Error fetching season details:',
          err
        );

        if (isMounted) {
          setSeasonDetails({
            episodes: []
          });
        }
      } finally {
        if (isMounted) {
          setSeasonLoading(false);
        }
      }
    };

    getSeasonDetails();

    return () => {
      isMounted = false;
    };
  }, [
    selectedItem,
    selectedItemType,
    selectedSeasonNumber,
    lang
  ]);

  /* =========================
     TRAILER
  ========================= */

  const handlePlayTrailer = useCallback(
    async (item, type = 'movie') => {
      if (!item) return;

      try {
        const data = await fetchDetails(
          type,
          item.id,
          lang
        );

        const trailer =
          data?.videos?.results?.find(
            (vid) =>
              vid.site === 'YouTube' &&
              (
                vid.type === 'Trailer' ||
                vid.type === 'Teaser'
              )
          );

        if (trailer) {
          setTrailerKey(trailer.key);
        } else {
          alert(
            lang === 'ar-SA'
              ? 'عذراً، الإعلان التشويقي غير متوفر'
              : 'Trailer not available'
          );
        }
      } catch {
        alert(
          lang === 'ar-SA'
            ? 'خطأ في جلب التريلر'
            : 'Error loading trailer'
        );
      }
    },
    [lang]
  );

  /* =========================
     MY LIST
  ========================= */

  const toggleMyList = useCallback(
    (item, type = 'movie') => {
      setMyList((prev) => {
        const exists = prev.some(
          (i) => i.id === item.id
        );

        if (exists) {
          return prev.filter(
            (i) => i.id !== item.id
          );
        }

        return [
          ...prev,
          {
            ...item,
            media_type: type
          }
        ];
      });
    },
    []
  );

  const isInMyList = useCallback(
    (itemId) =>
      myList.some(
        (i) => i.id === itemId
      ),
    [myList]
  );

  const handleOpenDetails = useCallback(
    (item, type = 'movie') => {
      setActiveDetailTab('similar');
      setTrailerKey(null);
      setSelectedItemType(
        item.media_type || type
      );
      setSelectedItem(item);
    },
    []
  );

  const featuredItem = useMemo(() => {
    if (trendingList.length > 0) {
      return (
        trendingList[heroIndex] ||
        trendingList[0]
      );
    }

    return null;
  }, [
    trendingList,
    heroIndex
  ]);

  const genresMap = useMemo(() => {
    return genres.reduce(
      (acc, g) => {
        acc[g.id] = g.name;
        return acc;
      },
      {}
    );
  }, [genres]);

  const isHome =
    activeTab === 'home' &&
    !searchQuery &&
    !selectedGenre &&
    !selectedStudio &&
    !minRating &&
    !selectedYear;

  return (
    <div
      className="
        min-h-screen
        bg-[#05070A]
        text-[#F8FAFC]
        antialiased
        pb-24
        font-sans
        max-w-md
        mx-auto
        relative
        overflow-hidden
      "
      dir={
        lang === 'ar-SA'
          ? 'rtl'
          : 'ltr'
      }
    >

      {/* =========================
          HEADER
      ========================= */}

      <header className="
        px-4
        pt-5
        pb-2
        flex
        items-center
        justify-between
      ">

        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => {
            setActiveTab('home');
            resetFilters();
          }}
        >
          <div className="
            w-9
            h-9
            rounded-xl
            bg-[#3B82F6]
            flex
            items-center
            justify-center
            text-white
            text-sm
            font-black
            shadow-lg
            shadow-[#3B82F6]/25
          ">
            ▶
          </div>

          <div className="leading-none">
            <span className="
              text-[19px]
              font-black
              tracking-[0.08em]
              text-white
            ">
              MOV<span className="text-[#3B82F6]">
                IX
              </span>
            </span>

            <p className="
              text-[7px]
              text-[#64748B]
              tracking-[0.22em]
              mt-1
              uppercase
            ">
              Movie Streaming
            </p>
          </div>
        </div>

        <div className="
          flex
          items-center
          gap-2
        ">

          <button
            onClick={() =>
              setLang((p) =>
                p === 'ar-SA'
                  ? 'en-US'
                  : 'ar-SA'
              )
            }
            className="
              h-9
              px-3
              rounded-full
              bg-[#0F172A]
              border
              border-[#1E293B]
              text-[#CBD5E1]
              text-[10px]
              font-bold
              flex
              items-center
              gap-1.5
              active:scale-95
              transition
            "
          >
            <span>🌐</span>
            <span>
              {lang === 'ar-SA'
                ? 'EN'
                : 'العربية'}
            </span>
          </button>

          <button
            onClick={() => {
              setTempGenre(selectedGenre);
              setTempMinRating(minRating);
              setTempSelectedYear(
                selectedYear
              );
              setShowFilterModal(true);
            }}
            className="
              w-9
              h-9
              rounded-full
              bg-[#0F172A]
              border
              border-[#1E293B]
              text-[#CBD5E1]
              flex
              items-center
              justify-center
              text-sm
              active:scale-95
              transition
            "
          >
            ⚙
          </button>
        </div>
      </header>

      {/* =========================
          SEARCH
      ========================= */}

      <div className="px-4 pt-3">

        <div className="relative group">

          <div className="
            absolute
            inset-y-0
            left-0
            w-10
            flex
            items-center
            justify-center
            pointer-events-none
            text-[#64748B]
          ">
            🔍
          </div>

          <input
            type="text"
            placeholder={
              lang === 'ar-SA'
                ? 'ابحث عن فيلم، مسلسل، ممثل...'
                : 'Search movies, series, actors...'
            }
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(
                e.target.value
              );
              setSelectedGenre('');
              setSelectedStudio(null);
            }}
            className="
              w-full
              h-12
              bg-[#0F172A]
              text-white
              placeholder-[#64748B]
              border
              border-[#1E293B]
              focus:border-[#3B82F6]
              focus:shadow-lg
              focus:shadow-[#3B82F6]/10
              px-4
              rounded-2xl
              text-xs
              focus:outline-none
              transition
              pr-4
              pl-10
            "
          />
        </div>
      </div>

      <main className="
        px-4
        pt-5
        space-y-8
      ">

        {/* =========================
            GENRE CHIPS
        ========================= */}

        {isHome && genres.length > 0 && (
          <div className="
            flex
            gap-2
            overflow-x-auto
            scrollbar-none
            pb-1
          ">
            {genres.slice(0, 8).map((genre) => (
              <button
                key={genre.id}
                onClick={() => {
                  setSelectedGenre(
                    genre.id
                  );
                  setActiveTab('movies');
                }}
                className="
                  flex-shrink-0
                  px-4
                  py-2
                  rounded-full
                  bg-[#0F172A]
                  border
                  border-[#1E293B]
                  text-[#94A3B8]
                  text-[10px]
                  font-bold
                  active:scale-95
                  transition
                  hover:border-[#3B82F6]/50
                  hover:text-[#60A5FA]
                "
              >
                {genre.name}
              </button>
            ))}
          </div>
        )}

        {/* =========================
            HERO
        ========================= */}

        {isHome && (
          loading ? (
            <div className="
              h-[390px]
              bg-[#111827]
              rounded-[28px]
              animate-pulse
              border
              border-[#1E293B]
            " />
          ) : (
            featuredItem && (
              <div className="
                relative
                overflow-hidden
                rounded-[28px]
                bg-[#111827]
                border
                border-[#1E293B]
                shadow-2xl
                shadow-black/40
              ">

                <div className="
                  relative
                  h-[390px]
                  w-full
                ">

                  <img
                    src={`${BACKDROP_BASE_URL}${
                      featuredItem.backdrop_path ||
                      featuredItem.poster_path
                    }`}
                    alt={
                      featuredItem.title ||
                      featuredItem.name
                    }
                    className="
                      w-full
                      h-full
                      object-cover
                      scale-[1.01]
                      transition-all
                      duration-700
                    }
                  />

                  {/* Cinematic gradients */}
                  <div className="
                    absolute
                    inset-0
                    bg-gradient-to-t
                    from-[#05070A]
                    via-[#05070A]/55
                    to-[#05070A]/10
                  " />

                  <div className="
                    absolute
                    inset-0
                    bg-gradient-to-r
                    from-[#05070A]/35
                    via-transparent
                    to-transparent
                  " />

                  <div className="
                    absolute
                    inset-x-0
                    bottom-0
                    h-1/2
                    bg-gradient-to-t
                    from-[#05070A]
                    to-transparent
                  " />

                  {/* Content */}

                  <div className="
                    absolute
                    bottom-5
                    inset-x-5
                    space-y-3
                  ">

                    <div className="
                      flex
                      items-center
                      gap-2
                    ">

                      <span className="
                        bg-[#3B82F6]
                        text-white
                        px-2.5
                        py-1
                        rounded-full
                        text-[9px]
                        font-black
                        shadow-lg
                        shadow-[#3B82F6]/20
                      ">
                        {featuredItem.genre_ids?.length
                          ? genresMap[
                              featuredItem.genre_ids[0]
                            ] || 'مميز'
                          : 'مميز'}
                      </span>

                      <span className="
                        text-[9px]
                        text-[#CBD5E1]
                        bg-black/30
                        backdrop-blur-md
                        border
                        border-white/10
                        px-2
                        py-1
                        rounded-full
                      ">
                        جديد
                      </span>
                    </div>

                    <h1 className="
                      text-[28px]
                      font-black
                      text-white
                      leading-tight
                      drop-shadow-lg
                    ">
                      {featuredItem.title ||
                        featuredItem.name}
                    </h1>

                    <div className="
                      flex
                      items-center
                      gap-2
                      text-[10px]
                      text-[#CBD5E1]
                    ">

                      <span className="
                        text-[#60A5FA]
                        font-bold
                      ">
                        ★
                        {' '}
                        {featuredItem.vote_average
                          ? featuredItem.vote_average.toFixed(1)
                          : '7.8'}
                      </span>

                      <span>•</span>

                      <span>
                        {featuredItem.release_date?.substring(
                          0,
                          4
                        ) ||
                          featuredItem.first_air_date?.substring(
                            0,
                            4
                          ) ||
                          '2026'}
                      </span>

                      <span>•</span>

                      <span>
                        HD
                      </span>
                    </div>

                    <div className="
                      grid
                      grid-cols-[1.35fr_1fr]
                      gap-2
                      pt-1
                    ">

                      <button
                        onClick={() =>
                          handlePlayTrailer(
                            featuredItem,
                            'movie'
                          )
                        }
                        className="
                          h-11
                          bg-[#3B82F6]
                          hover:bg-[#2563EB]
                          text-white
                          font-black
                          rounded-2xl
                          text-xs
                          flex
                          items-center
                          justify-center
                          gap-2
                          shadow-xl
                          shadow-[#3B82F6]/20
                          active:scale-[.97]
                          transition
                        "
                      >
                        <span>▶</span>
                        <span>
                          {lang === 'ar-SA'
                            ? 'شاهد الآن'
                            : 'Watch Now'}
                        </span>
                      </button>

                      <button
                        onClick={() =>
                          toggleMyList(
                            featuredItem,
                            'movie'
                          )
                        }
                        className="
                          h-11
                          bg-[#0F172A]/90
                          backdrop-blur-md
                          border
                          border-white/10
                          text-white
                          font-bold
                          rounded-2xl
                          text-xs
                          flex
                          items-center
                          justify-center
                          gap-2
                          active:scale-[.97]
                          transition
                        "
                      >
                        <span className="text-base">
                          {isInMyList(
                            featuredItem.id
                          )
                            ? '✓'
                            : '＋'}
                        </span>

                        <span>
                          {isInMyList(
                            featuredItem.id
                          )
                            ? lang === 'ar-SA'
                              ? 'في قائمتي'
                              : 'In List'
                            : lang === 'ar-SA'
                            ? 'قائمتي'
                            : 'My List'}
                        </span>
                      </button>
                    </div>

                    {/* Slider dots */}

                    <div className="
                      flex
                      justify-center
                      gap-1.5
                      pt-1
                    ">
                      {trendingList
                        .slice(0, 5)
                        .map((_, index) => (
                          <button
                            key={index}
                            onClick={() =>
                              setHeroIndex(
                                index
                              )
                            }
                            className={`
                              h-1.5
                              rounded-full
                              transition-all
                              ${
                                heroIndex === index
                                  ? 'w-6 bg-[#3B82F6]'
                                  : 'w-1.5 bg-[#64748B]/60'
                              }
                            `}
                          />
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          )
        )}

        {/* =========================
            HOME SECTIONS
        ========================= */}

        {isHome && (
          <div className="space-y-9">

            <HorizontalSection
              title={
                lang === 'ar-SA'
                  ? 'الأكثر رواجاً'
                  : 'Trending Now'
              }
              icon="🔥"
              items={trendingList}
              genresMap={genresMap}
              loading={loading}
              onItemClick={(item) =>
                handleOpenDetails(
                  item,
                  'movie'
                )
              }
              onViewAll={() =>
                setActiveTab('movies')
              }
              lang={lang}
            />

            <HorizontalSection
              title={
                lang === 'ar-SA'
                  ? 'أحدث الأفلام'
                  : 'Latest Movies'
              }
              icon="✦"
              items={latestMoviesList}
              genresMap={genresMap}
              loading={loading}
              onItemClick={(item) =>
                handleOpenDetails(
                  item,
                  'movie'
                )
              }
              onViewAll={() =>
                setActiveTab('movies')
              }
              lang={lang}
            />

            <HorizontalSection
              title={
                lang === 'ar-SA'
                  ? 'الأعلى تقييماً'
                  : 'Top Rated'
              }
              icon="★"
              items={topRatedList}
              genresMap={genresMap}
              loading={loading}
              onItemClick={(item) =>
                handleOpenDetails(
                  item,
                  'movie'
                )
              }
              onViewAll={() =>
                setActiveTab('movies')
              }
              lang={lang}
            />

            <HorizontalSection
              title={
                lang === 'ar-SA'
                  ? 'المسلسلات الرائجة'
                  : 'Popular TV'
              }
              icon="▣"
              items={trendingTvList}
              genresMap={genresMap}
              loading={loading}
              onItemClick={(item) =>
                handleOpenDetails(
                  item,
                  'tv'
                )
              }
              onViewAll={() =>
                setActiveTab('tv')
              }
              lang={lang}
            />

            {/* STUDIOS */}

            <div className="
              pt-5
              border-t
              border-[#1E293B]
              space-y-8
            ">

              <SectionTitle
                title={
                  lang === 'ar-SA'
                    ? 'شركات الإنتاج'
                    : 'Production Studios'
                }
                icon="▣"
              />

              {STUDIOS.map((studio) => {
                const studioItems =
                  studioMoviesMap[
                    studio.id
                  ] || [];

                if (
                  studioItems.length === 0 &&
                  !loading
                ) {
                  return null;
                }

                const itemType =
                  studio.id === 213 ||
                  studio.id === 49
                    ? 'tv'
                    : 'movie';

                return (
                  <HorizontalSection
                    key={studio.id}
                    title={studio.name}
                    icon="•"
                    items={studioItems}
                    genresMap={genresMap}
                    loading={loading}
                    onItemClick={(item) =>
                      handleOpenDetails(
                        item,
                        itemType
                      )
                    }
                    onViewAll={() => {
                      setSelectedStudio(
                        studio
                      );
                      setActiveTab(
                        itemType === 'tv'
                          ? 'tv'
                          : 'movies'
                      );
                    }}
                    lang={lang}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* =========================
            MY LIST
        ========================= */}

        {activeTab === 'mylist' &&
          !searchQuery && (
            <div className="space-y-5">

              <SectionTitle
                title={
                  lang === 'ar-SA'
                    ? 'قائمتي'
                    : 'My List'
                }
                icon="♥"
              />

              {myList.length === 0 ? (
                <div className="
                  text-center
                  py-20
                  text-[#64748B]
                  space-y-3
                ">
                  <div className="
                    mx-auto
                    w-16
                    h-16
                    rounded-2xl
                    bg-[#0F172A]
                    border
                    border-[#1E293B]
                    flex
                    items-center
                    justify-center
                    text-2xl
                  ">
                    ♡
                  </div>

                  <p className="text-xs">
                    {lang === 'ar-SA'
                      ? 'لم تقم بإضافة أي أعمال لقائمتك بعد.'
                      : 'No items in your list yet.'}
                  </p>
                </div>
              ) : (
                <div className="
                  grid
                  grid-cols-3
                  gap-3
                ">
                  {myList.map((item) => (
                    <MovieCard
                      key={item.id}
                      item={item}
                      genresMap={genresMap}
                      onClick={() =>
                        handleOpenDetails(
                          item,
                          item.media_type ||
                            'movie'
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          )}

        {/* =========================
            GRID
        ========================= */}

        {(activeTab !== 'home' ||
          searchQuery ||
          selectedGenre ||
          selectedStudio ||
          minRating > 0 ||
          selectedYear) &&
          activeTab !== 'mylist' && (
            <div className="space-y-5">

              <div className="
                flex
                items-end
                justify-between
                gap-3
              ">

                <div>
                  <p className="
                    text-[9px]
                    text-[#64748B]
                    mb-1
                  ">
                    {searchQuery
                      ? 'SEARCH'
                      : 'BROWSE'}
                  </p>

                  <h3 className="
                    text-lg
                    font-black
                    text-white
                  ">
                    {searchQuery
                      ? lang === 'ar-SA'
                        ? 'نتائج البحث'
                        : 'Search Results'
                      : selectedStudio
                      ? selectedStudio.name
                      : selectedGenre
                      ? genres.find(
                          (g) =>
                            g.id ===
                            Number(
                              selectedGenre
                            )
                        )?.name
                      : activeTab ===
                        'movies'
                      ? lang === 'ar-SA'
                        ? 'الأفلام'
                        : 'Movies'
                      : lang === 'ar-SA'
                      ? 'المسلسلات'
                      : 'TV Series'}
                  </h3>
                </div>

                {(selectedGenre ||
                  selectedStudio ||
                  minRating > 0 ||
                  selectedYear) && (
                  <button
                    onClick={resetFilters}
                    className="
                      text-[9px]
                      text-[#60A5FA]
                      bg-[#3B82F6]/10
                      px-3
                      py-1.5
                      rounded-full
                      border
                      border-[#3B82F6]/20
                    "
                  >
                    {lang === 'ar-SA'
                      ? 'إلغاء الفلتر'
                      : 'Clear'}
                  </button>
                )}
              </div>

              {loading ? (
                <div className="
                  grid
                  grid-cols-3
                  gap-3
                ">
                  {Array.from({
                    length: 9
                  }).map((_, i) => (
                    <div
                      key={i}
                      className="
                        aspect-[2/3]
                        bg-[#111827]
                        rounded-2xl
                        animate-pulse
                      "
                    />
                  ))}
                </div>
              ) : gridItems.length === 0 ? (
                <div className="
                  text-center
                  py-20
                  text-[#64748B]
                  text-xs
                ">
                  {lang === 'ar-SA'
                    ? 'لم يتم العثور على نتائج.'
                    : 'No results found.'}
                </div>
              ) : (
                <>
                  <div className="
                    grid
                    grid-cols-3
                    gap-3
                  ">
                    {gridItems.map(
                      (item) => (
                        <MovieCard
                          key={item.id}
                          item={item}
                          genresMap={
                            genresMap
                          }
                          onClick={() =>
                            handleOpenDetails(
                              item,
                              activeTab ===
                                'tv'
                                ? 'tv'
                                : 'movie'
                            )
                          }
                        />
                      )
                    )}
                  </div>

                  {page <
                    totalPages && (
                    <button
                      onClick={
                        handleLoadMore
                      }
                      disabled={
                        loadingMore
                      }
                      className="
                        w-full
                        h-12
                        bg-[#0F172A]
                        border
                        border-[#1E293B]
                        text-[#60A5FA]
                        font-bold
                        rounded-2xl
                        text-xs
                        active:scale-[.98]
                        transition
                      "
                    >
                      {loadingMore
                        ? lang === 'ar-SA'
                          ? 'جاري التحميل...'
                          : 'Loading...'
                        : lang === 'ar-SA'
                        ? 'تحميل المزيد'
                        : 'Load More'}
                    </button>
                  )}
                </>
              )}
            </div>
          )}
      </main>

      {/* =========================
          BOTTOM NAV
      ========================= */}

      <div className="
        fixed
        bottom-3
        inset-x-3
        mx-auto
        max-w-md
        z-40
      ">

        <nav className="
          h-[66px]
          bg-[#0B1220]/95
          backdrop-blur-xl
          border
          border-[#1E293B]
          rounded-3xl
          shadow-2xl
          shadow-black/50
          flex
          items-center
          justify-around
          px-1
        ">

          <NavItem
            icon={
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
              </svg>
            }
            label={
              lang === 'ar-SA'
                ? 'الرئيسية'
                : 'Home'
            }
            active={
              activeTab === 'home' &&
              !searchQuery &&
              !selectedGenre &&
              !selectedStudio &&
              !minRating &&
              !selectedYear
            }
            onClick={() => {
              setActiveTab('home');
              resetFilters();
            }}
          />

          <NavItem
            icon={
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
              </svg>
            }
            label={
              lang === 'ar-SA'
                ? 'الأفلام'
                : 'Movies'
            }
            active={
              activeTab === 'movies' &&
              !searchQuery &&
              !selectedGenre &&
              !selectedStudio &&
              !minRating &&
              !selectedYear
            }
            onClick={() => {
              setActiveTab('movies');
              resetFilters();
            }}
          />

          <NavItem
            icon={
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2V5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z" />
              </svg>
            }
            label={
              lang === 'ar-SA'
                ? 'المسلسلات'
                : 'Series'
            }
            active={
              activeTab === 'tv' &&
              !searchQuery &&
              !selectedGenre &&
              !selectedStudio &&
              !minRating &&
              !selectedYear
            }
            onClick={() => {
              setActiveTab('tv');
              resetFilters();
            }}
          />

          <NavItem
            icon={
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            }
            label={
              lang === 'ar-SA'
                ? 'قائمتي'
                : 'My List'
            }
            active={
              activeTab === 'mylist'
            }
            onClick={() => {
              setActiveTab('mylist');
              resetFilters();
            }}
          />
        </nav>
      </div>

      {/* =========================
          FILTER MODAL
      ========================= */}

      {showFilterModal && (
        <div className="
          fixed
          inset-0
          z-50
          bg-black/80
          backdrop-blur-md
          flex
          items-end
          justify-center
          p-3
        ">

          <div className="
            bg-[#0F172A]
            border
            border-[#1E293B]
            rounded-[28px]
            w-full
            max-w-md
            p-5
            space-y-5
            shadow-2xl
            max-h-[85vh]
            overflow-y-auto
          ">

            <div className="
              flex
              justify-between
              items-center
            ">

              <div>
                <p className="
                  text-[9px]
                  text-[#64748B]
                  mb-1
                ">
                  MOVIX
                </p>

                <h3 className="
                  text-base
                  font-black
                  text-white
                ">
                  {lang === 'ar-SA'
                    ? 'تصفية المحتوى'
                    : 'Filter Content'}
                </h3>
              </div>

              <button
                onClick={() =>
                  setShowFilterModal(false)
                }
                className="
                  w-9
                  h-9
                  rounded-full
                  bg-[#111827]
                  border
                  border-[#1E293B]
                  text-[#94A3B8]
                "
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">

              <label className="
                text-[10px]
                font-bold
                text-[#94A3B8]
              ">
                {lang === 'ar-SA'
                  ? 'التصنيف'
                  : 'Genre'}
              </label>

              <div className="
                grid
                grid-cols-2
                gap-2
                max-h-40
                overflow-y-auto
              ">

                <button
                  onClick={() =>
                    setTempGenre('')
                  }
                  className={`
                    py-2
                    rounded-xl
                    text-[10px]
                    font-bold
                    border
                    ${
                      tempGenre === ''
                        ? 'bg-[#3B82F6] border-[#3B82F6] text-white'
                        : 'bg-[#05070A] border-[#1E293B] text-[#94A3B8]'
                    }
                  `}
                >
                  {lang === 'ar-SA'
                    ? 'الكل'
                    : 'All'}
                </button>

                {genres.map((g) => (
                  <button
                    key={g.id}
                    onClick={() =>
                      setTempGenre(g.id)
                    }
                    className={`
                      py-2
                      px-2
                      rounded-xl
                      text-[10px]
                      font-bold
                      truncate
                      border
                      ${
                        String(
                          tempGenre
                        ) ===
                        String(g.id)
                          ? 'bg-[#3B82F6] border-[#3B82F6] text-white'
                          : 'bg-[#05070A] border-[#1E293B] text-[#94A3B8]'
                      }
                    `}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">

              <label className="
                text-[10px]
                font-bold
                text-[#94A3B8]
                flex
                justify-between
              ">
                <span>
                  {lang === 'ar-SA'
                    ? 'الحد الأدنى للتقييم'
                    : 'Minimum Rating'}
                </span>

                <span className="
                  text-[#60A5FA]
                ">
                  ★ {tempMinRating}+
                </span>
              </label>

              <input
                type="range"
                min="0"
                max="9"
                step="1"
                value={tempMinRating}
                onChange={(e) =>
                  setTempMinRating(
                    Number(
                      e.target.value
                    )
                  )
                }
                className="
                  w-full
                  accent-[#3B82F6]
                "
              />
            </div>

            <div className="space-y-2">

              <label className="
                text-[10px]
                font-bold
                text-[#94A3B8]
              ">
                {lang === 'ar-SA'
                  ? 'سنة الإنتاج'
                  : 'Release Year'}
              </label>

              <select
                value={
                  tempSelectedYear
                }
                onChange={(e) =>
                  setTempSelectedYear(
                    e.target.value
                  )
                }
                className="
                  w-full
                  bg-[#05070A]
                  border
                  border-[#1E293B]
                  text-white
                  text-xs
                  rounded-xl
                  p-3
                  focus:outline-none
                "
              >
                <option value="">
                  {lang === 'ar-SA'
                    ? 'كل السنين'
                    : 'All Years'}
                </option>

                {Array.from(
                  { length: 25 },
                  (_, i) =>
                    2026 - i
                ).map((y) => (
                  <option
                    key={y}
                    value={y}
                  >
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setSelectedGenre(
                  tempGenre
                );
                setMinRating(
                  tempMinRating
                );
                setSelectedYear(
                  tempSelectedYear
                );
                setSelectedStudio(null);
                setSearchQuery('');
                setShowFilterModal(false);
              }}
              className="
                w-full
                h-12
                bg-[#3B82F6]
                hover:bg-[#2563EB]
                text-white
                font-black
                rounded-2xl
                text-xs
                shadow-lg
                shadow-[#3B82F6]/20
                active:scale-[.98]
                transition
              "
            >
              {lang === 'ar-SA'
                ? 'تطبيق الفلتر'
                : 'Apply Filters'}
            </button>
          </div>
        </div>
      )}

      {/* =========================
          DETAILS
      ========================= */}

      {selectedItem && (
        <div className="
          fixed
          inset-0
          z-50
          bg-[#05070A]
          overflow-y-auto
          min-h-screen
          text-[#F8FAFC]
        ">

          <button
            onClick={() =>
              setSelectedItem(null)
            }
            className="
              fixed
              top-4
              left-4
              z-[60]
              w-10
              h-10
              rounded-full
              bg-black/50
              backdrop-blur-md
              border
              border-white/10
              text-white
              flex
              items-center
              justify-center
              text-sm
            "
          >
            ✕
          </button>

          {detailsLoading ? (
            <div className="
              flex
              justify-center
              items-center
              h-screen
            ">
              <div className="
                animate-spin
                rounded-full
                h-9
                w-9
                border-2
                border-[#3B82F6]
                border-t-transparent
              " />
            </div>
          ) : (
            <div className="pb-24">

              {/* DETAIL HERO */}

              <div className="
                relative
                w-full
                h-[430px]
                bg-[#05070A]
              ">

                {details?.backdrop_path ? (
                  <img
                    src={`${BACKDROP_BASE_URL}${details.backdrop_path}`}
                    alt={
                      details?.title ||
                      details?.name
                    }
                    className="
                      w-full
                      h-full
                      object-cover
                    "
                  />
                ) : (
                  <div className="
                    w-full
                    h-full
                    flex
                    items-center
                    justify-center
                    text-[#64748B]
                    text-xs
                  ">
                    No Image
                  </div>
                )}

                <div className="
                  absolute
                  inset-0
                  bg-gradient-to-t
                  from-[#05070A]
                  via-[#05070A]/35
                  to-transparent
                " />

                <div className="
                  absolute
                  bottom-6
                  inset-x-5
                  space-y-3
                ">

                  <div className="
                    flex
                    items-center
                    gap-2
                  ">

                    <span className="
                      bg-[#3B82F6]
                      text-white
                      px-2.5
                      py-1
                      rounded-full
                      text-[10px]
                      font-black
                    ">
                      ★
                      {' '}
                      {details?.vote_average?.toFixed(
                        1
                      ) || '0.0'}
                    </span>

                    <span className="
                      text-[10px]
                      text-[#CBD5E1]
                    ">
                      {details?.release_date?.substring(
                        0,
                        4
                      ) ||
                        details?.first_air_date?.substring(
                          0,
                          4
                        )}
                    </span>
                  </div>

                  <h1 className="
                    text-3xl
                    font-black
                    leading-tight
                  ">
                    {details?.title ||
                      details?.name}
                  </h1>

                  <div className="
                    flex
                    flex-wrap
                    gap-2
                  ">
                    {details?.genres
                      ?.slice(0, 3)
                      .map((g) => (
                        <span
                          key={g.id}
                          className="
                            text-[9px]
                            text-[#CBD5E1]
                            bg-white/5
                            backdrop-blur-md
                            border
                            border-white/10
                            px-2.5
                            py-1
                            rounded-full
                          "
                        >
                          {g.name}
                        </span>
                      ))}
                  </div>
                </div>
              </div>

              <div className="
                px-5
                mt-1
                space-y-7
              ">

                {/* ACTIONS */}

                <div className="
                  grid
                  grid-cols-[1fr_auto]
                  gap-2
                ">

                  <button
                    onClick={() =>
                      handlePlayTrailer(
                        details,
                        selectedItemType
                      )
                    }
                    className="
                      h-12
                      bg-[#3B82F6]
                      text-white
                      rounded-2xl
                      text-xs
                      font-black
                      flex
                      items-center
                      justify-center
                      gap-2
                      shadow-lg
                      shadow-[#3B82F6]/20
                    "
                  >
                    ▶
                    {lang === 'ar-SA'
                      ? 'شاهد التريلر'
                      : 'Watch Trailer'}
                  </button>

                  <button
                    onClick={() =>
                      toggleMyList(
                        details,
                        selectedItemType
                      )
                    }
                    className="
                      h-12
                      w-14
                      bg-[#111827]
                      border
                      border-[#1E293B]
                      rounded-2xl
                      text-white
                      text-lg
                    "
                  >
                    {isInMyList(
                      details?.id
                    )
                      ? '✓'
                      : '＋'}
                  </button>
                </div>

                {/* OVERVIEW */}

                <div className="space-y-3">

                  <SectionTitle
                    title={
                      lang === 'ar-SA'
                        ? 'القصة'
                        : 'Overview'
                    }
                    icon="✦"
                  />

                  <p className="
                    text-[#CBD5E1]
                    text-xs
                    leading-7
                  ">
                    {details?.overview ||
                      (lang === 'ar-SA'
                        ? 'لا يوجد وصف متاح.'
                        : 'No overview available.')}
                  </p>
                </div>

                {/* SEASONS */}

                {selectedItemType ===
                  'tv' &&
                  details?.seasons
                    ?.length > 0 && (
                    <div className="space-y-4">

                      <SectionTitle
                        title={
                          lang === 'ar-SA'
                            ? 'المواسم والحلقات'
                            : 'Seasons & Episodes'
                        }
                        icon="▣"
                      />

                      <div className="
                        flex
                        gap-2
                        overflow-x-auto
                        scrollbar-none
                      ">
                        {details.seasons
                          .filter(
                            (s) =>
                              s.season_number >
                              0
                          )
                          .map((s) => (
                            <button
                              key={s.id}
                              onClick={() =>
                                setSelectedSeasonNumber(
                                  s.season_number
                                )
                              }
                              className={`
                                flex-shrink-0
                                px-4
                                py-2
                                rounded-full
                                text-[10px]
                                font-bold
                                border
                                ${
                                  selectedSeasonNumber ===
                                  s.season_number
                                    ? 'bg-[#3B82F6] border-[#3B82F6] text-white'
                                    : 'bg-[#111827] border-[#1E293B] text-[#94A3B8]'
                                }
                              `}
                            >
                              {lang === 'ar-SA'
                                ? `الموسم ${s.season_number}`
                                : `Season ${s.season_number}`}
                            </button>
                          ))}
                      </div>

                      {seasonLoading ? (
                        <div className="
                          text-center
                          py-8
                          text-xs
                          text-[#64748B]
                        ">
                          {lang === 'ar-SA'
                            ? 'جاري تحميل الحلقات...'
                            : 'Loading episodes...'}
                        </div>
                      ) : (
                        <div className="space-y-2">

                          {seasonDetails?.episodes?.map(
                            (ep) => (
                              <div
                                key={ep.id}
                                className="
                                  flex
                                  gap-3
                                  bg-[#111827]
                                  p-2
                                  rounded-2xl
                                  border
                                  border-[#1E293B]
                                "
                              >

                                <img
                                  src={
                                    ep.still_path
                                      ? `${IMAGE_BASE_URL}${ep.still_path}`
                                      : 'https://via.placeholder.com/100x60?text=EP'
                                  }
                                  alt={
                                    ep.name
                                  }
                                  className="
                                    w-20
                                    h-12
                                    rounded-xl
                                    object-cover
                                    flex-shrink-0
                                  "
                                />

                                <div className="
                                  min-w-0
                                  flex-1
                                  flex
                                  flex-col
                                  justify-center
                                ">

                                  <h4 className="
                                    text-[10px]
                                    font-bold
                                    text-white
                                    truncate
                                  ">
                                    {ep.episode_number}.
                                    {' '}
                                    {ep.name}
                                  </h4>

                                  <p className="
                                    text-[9px]
                                    text-[#64748B]
                                    mt-1
                                    line-clamp-1
                                  ">
                                    {ep.overview ||
                                      (lang === 'ar-SA'
                                        ? 'بدون ملخص'
                                        : 'No summary')}
                                  </p>
                                </div>

                                <div className="
                                  w-8
                                  h-8
                                  rounded-full
                                  bg-[#0F172A]
                                  self-center
                                  flex
                                  items-center
                                  justify-center
                                  text-[#60A5FA]
                                ">
                                  ▶
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  )}

                {/* CAST */}

                {details?.credits
                  ?.cast?.length > 0 && (
                  <div className="space-y-4">

                    <SectionTitle
                      title={
                        lang === 'ar-SA'
                          ? 'طاقم التمثيل'
                          : 'Cast'
                      }
                      icon="●"
                    />

                    <div className="
                      flex
                      gap-3
                      overflow-x-auto
                      scrollbar-none
                    ">
                      {details.credits.cast
                        .slice(0, 10)
                        .map((actor) => (
                          <div
                            key={actor.id}
                            className="
                              flex-shrink-0
                              w-20
                              text-center
                            "
                          >

                            <div className="
                              w-16
                              h-16
                              mx-auto
                              rounded-full
                              overflow-hidden
                              border
                              border-[#1E293B]
                              bg-[#111827]
                            ">
                              <img
                                src={
                                  actor.profile_path
                                    ? `${IMAGE_BASE_URL}${actor.profile_path}`
                                    : 'https://via.placeholder.com/100?text=Actor'
                                }
                                alt={
                                  actor.name
                                }
                                className="
                                  w-full
                                  h-full
                                  object-cover
                                "
                              />
                            </div>

                            <p className="
                              text-[9px]
                              font-bold
                              text-white
                              truncate
                              mt-2
                            ">
                              {actor.name}
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* SIMILAR / RECOMMENDATIONS */}

                <div className="space-y-4">

                  <div className="
                    flex
                    items-center
                    gap-5
                    border-b
                    border-[#1E293B]
                  ">

                    <button
                      onClick={() =>
                        setActiveDetailTab(
                          'similar'
                        )
                      }
                      className={`
                        pb-3
                        text-[11px]
                        font-bold
                        ${
                          activeDetailTab ===
                          'similar'
                            ? 'text-[#3B82F6] border-b-2 border-[#3B82F6]'
                            : 'text-[#64748B]'
                        }
                      `}
                    >
                      {lang === 'ar-SA'
                        ? 'أعمال مشابهة'
                        : 'Similar'}
                    </button>

                    <button
                      onClick={() =>
                        setActiveDetailTab(
                          'recommendations'
                        )
                      }
                      className={`
                        pb-3
                        text-[11px]
                        font-bold
                        ${
                          activeDetailTab ===
                          'recommendations'
                            ? 'text-[#3B82F6] border-b-2 border-[#3B82F6]'
                            : 'text-[#64748B]'
                        }
                      `}
                    >
                      {lang === 'ar-SA'
                        ? 'مقترح لك'
                        : 'Recommended'}
                    </button>
                  </div>

                  <div className="
                    grid
                    grid-cols-3
                    gap-3
                  ">
                    {(
                      (
                        activeDetailTab ===
                        'similar'
                          ? details?.similar
                              ?.results
                          : details
                              ?.recommendations
                              ?.results
                      ) || []
                    )
                      .slice(0, 6)
                      .map((item) => (
                        <MovieCard
                          key={item.id}
                          item={item}
                          genresMap={
                            genresMap
                          }
                          onClick={() =>
                            handleOpenDetails(
                              item,
                              selectedItemType
                            )
                          }
                        />
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================
          TRAILER
      ========================= */}

      {trailerKey && (
        <div className="
          fixed
          inset-0
          z-[70]
          bg-black/95
          flex
          items-center
          justify-center
          p-3
          backdrop-blur-md
        ">

          <div className="
            relative
            w-full
            aspect-video
            rounded-2xl
            overflow-hidden
            bg-black
            border
            border-[#1E293B]
            shadow-2xl
          ">

            <button
              onClick={() =>
                setTrailerKey(null)
              }
              className="
                absolute
                top-2
                right-2
                bg-[#3B82F6]
                text-white
                w-8
                h-8
                rounded-full
                text-xs
                font-bold
                z-10
              "
            >
              ✕
            </button>

            <iframe
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
              title="Trailer"
              className="
                w-full
                h-full
                border-0
              "
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}


/* =========================================================
   SECTION TITLE
========================================================= */

function SectionTitle({
  title,
  icon
}) {
  return (
    <div className="
      flex
      items-center
      gap-2.5
    ">
      <span className="
        w-1
        h-5
        rounded-full
        bg-[#3B82F6]
        shadow-md
        shadow-[#3B82F6]/30
      " />

      <span className="
        text-sm
        font-black
        text-white
      ">
        {icon}
        {' '}
        {title}
      </span>
    </div>
  );
}


/* =========================================================
   HORIZONTAL SECTION
========================================================= */

function HorizontalSection({
  title,
  icon,
  items,
  genresMap,
  loading,
  onItemClick,
  onViewAll,
  lang
}) {
  return (
    <div className="space-y-3">

      <div className="
        flex
        items-center
        justify-between
      ">

        <SectionTitle
          title={title}
          icon={icon}
        />

        {onViewAll && (
          <button
            onClick={onViewAll}
            className="
              text-[10px]
              text-[#60A5FA]
              font-bold
              active:scale-95
            "
          >
            {lang === 'ar-SA'
              ? 'عرض الكل ›'
              : 'See All ›'}
          </button>
        )}
      </div>

      {loading ? (
        <div className="
          flex
          gap-3
          overflow-x-auto
          scrollbar-none
        ">
          {Array.from({
            length: 4
          }).map((_, i) => (
            <div
              key={i}
              className="
                w-[128px]
                h-[220px]
                bg-[#111827]
                rounded-2xl
                animate-pulse
                flex-shrink-0
              "
            />
          ))}
        </div>
      ) : (
        <div className="
          flex
          gap-3
          overflow-x-auto
          scrollbar-none
          pb-1
        ">
          {items.map((item) => (
            <div
              key={item.id}
              className="
                w-[128px]
                flex-shrink-0
              "
            >
              <MovieCard
                item={item}
                genresMap={genresMap}
                onClick={() =>
                  onItemClick(item)
                }
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


/* =========================================================
   MOVIE CARD
========================================================= */

function MovieCard({
  item,
  genresMap = {},
  onClick
}) {
  return (
    <div
      onClick={onClick}
      className="
        group
        cursor-pointer
        active:scale-[.97]
        transition
      "
    >

      <div className="
        relative
        aspect-[2/3]
        rounded-2xl
        overflow-hidden
        bg-[#111827]
        border
        border-[#1E293B]
        shadow-lg
        shadow-black/20
      ">

        {item.poster_path ? (
          <img
            src={`${IMAGE_BASE_URL}${item.poster_path}`}
            alt={
              item.title ||
              item.name
            }
            className="
              w-full
              h-full
              object-cover
              group-hover:scale-105
              transition
              duration-500
            "
            loading="lazy"
          />
        ) : (
          <div className="
            w-full
            h-full
            flex
            items-center
            justify-center
            text-[#64748B]
            text-[9px]
          ">
            No Image
          </div>
        )}

        {/* Gradient */}

        <div className="
          absolute
          inset-x-0
          bottom-0
          h-1/3
          bg-gradient-to-t
          from-black/80
          to-transparent
        " />

        {/* Rating */}

        <div className="
          absolute
          top-2
          right-2
          bg-[#05070A]/80
          backdrop-blur-md
          border
          border-white/10
          px-2
          py-1
          rounded-full
          text-[9px]
          font-black
          text-white
          flex
          items-center
          gap-1
        ">
          <span className="
            text-[#60A5FA]
          ">
            ★
          </span>

          <span>
            {item.vote_average
              ? item.vote_average.toFixed(
                  1
                )
              : '7.5'}
          </span>
        </div>
      </div>

      <div className="
        px-0.5
        pt-2
      ">

        <h4 className="
          text-[11px]
          font-bold
          text-white
          truncate
        ">
          {item.title ||
            item.name}
        </h4>

        <div className="
          flex
          items-center
          justify-between
          mt-1
        ">

          <p className="
            text-[9px]
            text-[#64748B]
          ">
            {item.release_date?.substring(
              0,
              4
            ) ||
              item.first_air_date?.substring(
                0,
                4
              ) ||
              '2026'}
          </p>

          <span className="
            text-[8px]
            text-[#475569]
          ">
            HD
          </span>
        </div>
      </div>
    </div>
  );
}


/* =========================================================
   NAV ITEM
========================================================= */

function NavItem({
  icon,
  label,
  active,
  onClick
}) {
  return (
    <button
      onClick={onClick}
      className={`
        relative
        min-w-[68px]
        h-14
        rounded-2xl
        flex
        flex-col
        items-center
        justify-center
        gap-1
        transition
        active:scale-95
        ${
          active
            ? 'text-[#3B82F6]'
            : 'text-[#64748B] hover:text-[#CBD5E1]'
        }
      `}
    >

      {active && (
        <div className="
          absolute
          top-0
          w-8
          h-0.5
          rounded-full
          bg-[#3B82F6]
          shadow-lg
          shadow-[#3B82F6]
        " />
      )}

      <div className="
        w-5
        h-5
      ">
        {icon}
      </div>

      <span className="
        text-[9px]
        font-bold
      ">
        {label}
      </span>
    </button>
  );
                                                         }
