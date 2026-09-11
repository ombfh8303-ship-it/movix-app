import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  { id: 4, name: 'Paramount', logo: 'https://image.tmdb.org/t/p/w200/420Paramount.png' }
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

  /* =========================
     WATCH HISTORY
  ========================= */

  const [watchHistory, setWatchHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('movix_watch_history');
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
  const [trailerLoading, setTrailerLoading] = useState(false);

  const [activeDetailTab, setActiveDetailTab] = useState('similar');

  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState(1);
  const [seasonDetails, setSeasonDetails] = useState(null);
  const [seasonLoading, setSeasonLoading] = useState(false);

  const [overviewExpanded, setOverviewExpanded] = useState(false);

  const searchTimer = useRef(null);

  /* =========================
     LOCAL STORAGE
  ========================= */

  useEffect(() => {
    try {
      localStorage.setItem(
        'movix_my_list',
        JSON.stringify(myList)
      );
    } catch {}
  }, [myList]);

  useEffect(() => {
    try {
      localStorage.setItem(
        'movix_watch_history',
        JSON.stringify(watchHistory)
      );
    } catch {}
  }, [watchHistory]);

  /* =========================
     RESET FILTERS
  ========================= */

  const resetFilters = useCallback(() => {
    setSelectedGenre('');
    setSelectedStudio(null);
    setSearchQuery('');
    setMinRating(0);
    setSelectedYear('');
    setPage(1);
    setGridItems([]);
  }, []);

  /* =========================
     GENRES
  ========================= */

  useEffect(() => {
    const type =
      activeTab === 'tv'
        ? 'tv'
        : 'movie';

    fetchGenres(type, lang)
      .then((list) => setGenres(list || []))
      .catch(() => {});
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
      setLoading(true);

      Promise.all([
        fetchTrending('movie', 1, lang),
        fetchUpcomingOrPopular('movie', 1, lang),
        fetchTopRated('movie', 1, lang),
        fetchTrending('tv', 1, lang)
      ])
        .then(
          ([
            trending,
            upcoming,
            topRated,
            tvTrending
          ]) => {
            setTrendingList(
              trending?.results || []
            );

            setLatestMoviesList(
              upcoming?.results || []
            );

            setTopRatedList(
              topRated?.results || []
            );

            setTrendingTvList(
              tvTrending?.results || []
            );

            setLoading(false);
          }
        )
        .catch(() => setLoading(false));

      /*
       * Keep all existing studio data.
       * Requests are intentionally independent so
       * one failed studio doesn't stop the others.
       */
      STUDIOS.forEach((s) => {
        const type =
          s.id === 213 || s.id === 49
            ? 'tv'
            : 'movie';

        fetchByStudio(
          type,
          s.id,
          1,
          lang
        )
          .then((res) => {
            setStudioMoviesMap((prev) => ({
              ...prev,
              [s.id]: res?.results || []
            }));
          })
          .catch(() => {});
      });
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
        (prev) =>
          (prev + 1) %
          Math.min(
            trendingList.length,
            5
          )
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [trendingList]);

  /* =========================
     GRID DATA & SEARCH
  ========================= */

  const loadGridData = useCallback(
    (
      pageNum = 1,
      append = false,
      query = searchQuery
    ) => {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const type =
        activeTab === 'tv'
          ? 'tv'
          : 'movie';

      let promise;

      if (query.trim()) {
        promise = searchMedia(
          query,
          type,
          pageNum,
          lang
        );
      } else if (selectedGenre) {
        promise = fetchByGenre(
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

        promise = fetchByStudio(
          studioType,
          selectedStudio.id,
          pageNum,
          lang
        );
      } else {
        promise = fetchTrending(
          type,
          pageNum,
          lang
        );
      }

      promise
        .then((data) => {
          let results =
            data?.results || [];

          if (minRating > 0) {
            results = results.filter(
              (item) =>
                (item.vote_average || 0) >=
                minRating
            );
          }

          if (selectedYear) {
            results = results.filter(
              (item) => {
                const date =
                  item.release_date ||
                  item.first_air_date ||
                  '';

                return date.startsWith(
                  selectedYear
                );
              }
            );
          }

          setGridItems((prev) =>
            append
              ? [...prev, ...results]
              : results
          );

          setTotalPages(
            data?.total_pages || 1
          );
        })
        .catch(() => {})
        .finally(() => {
          setLoading(false);
          setLoadingMore(false);
        });
    },
    [
      activeTab,
      selectedGenre,
      selectedStudio,
      minRating,
      selectedYear,
      lang
    ]
  );

  const handleSearchChange = (e) => {
    const val = e.target.value;

    setSearchQuery(val);
    setSelectedGenre('');
    setSelectedStudio(null);

    clearTimeout(searchTimer.current);

    searchTimer.current = setTimeout(() => {
      setPage(1);
      loadGridData(
        1,
        false,
        val
      );
    }, 400);
  };

  useEffect(() => {
    if (
      activeTab !== 'home' ||
      selectedGenre ||
      selectedStudio ||
      minRating ||
      selectedYear
    ) {
      setPage(1);

      loadGridData(
        1,
        false,
        searchQuery
      );
    }
  }, [
    activeTab,
    selectedGenre,
    selectedStudio,
    minRating,
    selectedYear,
    lang
  ]);

  const handleLoadMore = () => {
    if (
      page < totalPages &&
      !loadingMore
    ) {
      const nextPage =
        page + 1;

      setPage(nextPage);

      loadGridData(
        nextPage,
        true,
        searchQuery
      );
    }
  };

  /* =========================
     WATCH HISTORY
  ========================= */

  const addToWatchHistory = useCallback(
    (item, type = 'movie') => {
      if (!item?.id) return;

      setWatchHistory((prev) => {
        const newItem = {
          ...item,
          media_type:
            item.media_type || type,
          watchedAt:
            Date.now()
        };

        const filtered =
          prev.filter(
            (i) =>
              !(
                i.id === item.id &&
                (i.media_type ||
                  type) ===
                  newItem.media_type
              )
          );

        return [
          newItem,
          ...filtered
        ].slice(0, 30);
      });
    },
    []
  );

  const removeFromWatchHistory =
    useCallback((item) => {
      setWatchHistory((prev) =>
        prev.filter(
          (i) =>
            !(
              i.id === item.id &&
              i.media_type ===
                item.media_type
            )
        )
      );
    }, []);

  const clearWatchHistory =
    useCallback(() => {
      setWatchHistory([]);
    }, []);

  /* =========================
     DETAILS
  ========================= */

  useEffect(() => {
    if (!selectedItem) {
      setDetails(null);
      return;
    }

    setOverviewExpanded(false);
    setDetailsLoading(true);

    fetchDetails(
      selectedItemType,
      selectedItem.id,
      lang
    )
      .then((data) => {
        setDetails(data);

        if (
          selectedItemType === 'tv' &&
          data?.seasons?.length > 0
        ) {
          const firstSeason =
            data.seasons.find(
              (s) =>
                s.season_number > 0
            ) ||
            data.seasons[0];

          setSelectedSeasonNumber(
            firstSeason.season_number
          );
        }
      })
      .catch(() => {})
      .finally(() =>
        setDetailsLoading(false)
      );
  }, [
    selectedItem,
    selectedItemType,
    lang
  ]);

  /* =========================
     SEASONS
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

    setSeasonLoading(true);

    fetch(
      `https://api.themoviedb.org/3/tv/${selectedItem.id}/season/${selectedSeasonNumber}?api_key=4289874cb3f960f477028fae98f0efd0&language=${lang}`
    )
      .then((res) =>
        res.ok
          ? res.json()
          : {
              episodes: []
            }
      )
      .then((data) =>
        setSeasonDetails(data)
      )
      .catch(() =>
        setSeasonDetails({
          episodes: []
        })
      )
      .finally(() =>
        setSeasonLoading(false)
      );
  }, [
    selectedItem,
    selectedItemType,
    selectedSeasonNumber,
    lang
  ]);

  /* =========================
     REAL TRAILER
  ========================= */

  const getRealTrailer =
    useCallback(
      (data) => {
        const videos =
          data?.videos?.results || [];

        /*
         * Priority:
         * 1. Official YouTube Trailer
         * 2. YouTube Trailer
         * 3. YouTube Teaser
         * 4. Any YouTube video
         */

        return (
          videos.find(
            (video) =>
              video.site ===
                'YouTube' &&
              video.type ===
                'Trailer' &&
              video.official === true
          ) ||
          videos.find(
            (video) =>
              video.site ===
                'YouTube' &&
              video.type ===
                'Trailer'
          ) ||
          videos.find(
            (video) =>
              video.site ===
                'YouTube' &&
              video.type ===
                'Teaser'
          ) ||
          videos.find(
            (video) =>
              video.site ===
              'YouTube'
          ) ||
          null
        );
      },
      []
    );

  const handlePlayTrailer =
    useCallback(
      async (
        item,
        type = 'movie'
      ) => {
        if (!item) return;

        setTrailerLoading(true);

        try {
          /*
           * If this is already the open detail page,
           * use its loaded videos instead of another API request.
           */
          if (
            details &&
            details.id === item.id &&
            selectedItemType === type
          ) {
            const trailer =
              getRealTrailer(details);

            if (trailer?.key) {
              addToWatchHistory(
                item,
                type
              );

              setTrailerKey(
                trailer.key
              );

              return;
            }
          }

          const data =
            await fetchDetails(
              type,
              item.id,
              lang
            );

          const trailer =
            getRealTrailer(data);

          if (trailer?.key) {
            addToWatchHistory(
              item,
              type
            );

            setTrailerKey(
              trailer.key
            );
          } else {
            alert(
              lang === 'ar-SA'
                ? 'الإعلان الرسمي غير متوفر حالياً'
                : 'Official trailer is not available'
            );
          }
        } catch {
          alert(
            lang === 'ar-SA'
              ? 'حدث خطأ أثناء تحميل التريلر'
              : 'Error loading trailer'
          );
        } finally {
          setTrailerLoading(false);
        }
      },
      [
        details,
        selectedItemType,
        lang,
        getRealTrailer,
        addToWatchHistory
      ]
    );

  /* =========================
     MY LIST
  ========================= */

  const toggleMyList = useCallback(
    (
      item,
      type = 'movie'
    ) => {
      if (!item) return;

      setMyList((prev) => {
        const exists =
          prev.some(
            (i) => i.id === item.id
          );

        if (exists) {
          return prev.filter(
            (i) =>
              i.id !== item.id
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

  /* =========================
     OPEN DETAILS
  ========================= */

  const handleOpenDetails =
    useCallback(
      (
        item,
        type = 'movie'
      ) => {
        setActiveDetailTab(
          'similar'
        );

        setTrailerKey(null);

        setOverviewExpanded(false);

        const itemType =
          item.media_type || type;

        setSelectedItemType(
          itemType
        );

        setSelectedItem(item);
      },
      []
    );

  /* =========================
     REMOVE HISTORY ITEM
  ========================= */

  const handleHistoryClick =
    useCallback(
      (item) => {
        handleOpenDetails(
          item,
          item.media_type ||
            'movie'
        );
      },
      [handleOpenDetails]
    );

  /* =========================
     MAPS
  ========================= */

  const genresMap =
    genres.reduce(
      (acc, g) => {
        acc[g.id] = g.name;
        return acc;
      },
      {}
    );

  const featuredItem =
    trendingList.length > 0
      ? trendingList[
          heroIndex
        ] ||
        trendingList[0]
      : null;

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
        pb-24
        font-sans
        max-w-md
        mx-auto
        relative
        select-none
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
          className="
            flex
            items-center
            gap-2
            cursor-pointer
          "
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
              MOV
              <span className="text-[#3B82F6]">
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
              setTempGenre(
                selectedGenre
              );
              setTempMinRating(
                minRating
              );
              setTempSelectedYear(
                selectedYear
              );
              setShowFilterModal(
                true
              );
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
        <div className="relative">
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
            onChange={
              handleSearchChange
            }
            className="
              w-full
              h-12
              bg-[#0F172A]
              text-white
              placeholder-[#64748B]
              border
              border-[#1E293B]
              focus:border-[#3B82F6]
              px-4
              rounded-2xl
              text-xs
              outline-none
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

        {isHome &&
          genres.length > 0 && (
            <div className="
              flex
              gap-2
              overflow-x-auto
              scrollbar-none
              pb-1
            ">
              {genres
                .slice(0, 8)
                .map(
                  (genre) => (
                    <button
                      key={
                        genre.id
                      }
                      onClick={() => {
                        setSelectedGenre(
                          genre.id
                        );
                        setActiveTab(
                          'movies'
                        );
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
                      "
                    >
                      {
                        genre.name
                      }
                    </button>
                  )
                )}
            </div>
          )}

        {/* =========================
            HERO
        ========================= */}

        {isHome &&
          (loading ? (
            <div className="
              h-[390px]
              bg-[#111827]
              rounded-[28px]
              animate-pulse
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
                    "
                    loading="eager"
                  />

                  <div
                    className="
                      absolute
                      inset-0
                    "
                    style={{
                      backgroundImage:
                        'linear-gradient(to top, #05070A 0%, rgba(5,7,10,0.55) 50%, rgba(5,7,10,0.10) 100%)'
                    }}
                  />

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
                      ">
                        {featuredItem
                          .genre_ids
                          ?.length
                          ? genresMap[
                              featuredItem
                                .genre_ids[0]
                            ] ||
                            'مميز'
                          : 'مميز'}
                      </span>

                      <span className="
                        text-[9px]
                        text-[#CBD5E1]
                        bg-black/30
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
                      truncate
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
                        ★{' '}
                        {featuredItem.vote_average
                          ? featuredItem.vote_average.toFixed(
                              1
                            )
                          : '7.8'}
                      </span>

                      <span>
                        •
                      </span>

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

                      <span>
                        •
                      </span>

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
                        disabled={
                          trailerLoading
                        }
                        className="
                          h-11
                          bg-[#3B82F6]
                          text-white
                          font-black
                          rounded-2xl
                          text-xs
                          flex
                          items-center
                          justify-center
                          gap-2
                          shadow-lg
                          shadow-[#3B82F6]/20
                          disabled:opacity-70
                        "
                      >
                        <span>
                          ▶
                        </span>

                        <span>
                          {trailerLoading
                            ? lang ===
                              'ar-SA'
                              ? 'جاري التحميل...'
                              : 'Loading...'
                            : lang ===
                              'ar-SA'
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
                          bg-[#0F172A]
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
                        "
                      >
                        <span>
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
                            ? lang ===
                              'ar-SA'
                              ? 'في قائمتي'
                              : 'In List'
                            : lang ===
                              'ar-SA'
                            ? 'قائمتي'
                            : 'My List'}
                        </span>
                      </button>
                    </div>

                    <div className="
                      flex
                      justify-center
                      gap-1.5
                      pt-1
                    ">
                      {trendingList
                        .slice(0, 5)
                        .map(
                          (
                            _,
                            index
                          ) => (
                            <button
                              key={
                                index
                              }
                              onClick={() =>
                                setHeroIndex(
                                  index
                                )
                              }
                              className={`h-1.5 rounded-full ${
                                heroIndex ===
                                index
                                  ? 'w-6 bg-[#3B82F6]'
                                  : 'w-1.5 bg-[#64748B]/60'
                              }`}
                            />
                          )
                        )}
                    </div>
                  </div>
                </div>
              </div>
            )
          ))}

        {/* =========================
            HOME SECTIONS
        ========================= */}

        {isHome && (
          <div className="space-y-8">
            <HorizontalSection
              title={
                lang ===
                'ar-SA'
                  ? 'الأكثر رواجاً'
                  : 'Trending Now'
              }
              icon="🔥"
              items={
                trendingList
              }
              loading={loading}
              onItemClick={(
                item
              ) =>
                handleOpenDetails(
                  item,
                  'movie'
                )
              }
              onViewAll={() =>
                setActiveTab(
                  'movies'
                )
              }
              lang={lang}
            />

            <HorizontalSection
              title={
                lang ===
                'ar-SA'
                  ? 'أحدث الأفلام'
                  : 'Latest Movies'
              }
              icon="✦"
              items={
                latestMoviesList
              }
              loading={loading}
              onItemClick={(
                item
              ) =>
                handleOpenDetails(
                  item,
                  'movie'
                )
              }
              onViewAll={() =>
                setActiveTab(
                  'movies'
                )
              }
              lang={lang}
            />

            <HorizontalSection
              title={
                lang ===
                'ar-SA'
                  ? 'الأعلى تقييماً'
                  : 'Top Rated'
              }
              icon="★"
              items={
                topRatedList
              }
              loading={loading}
              onItemClick={(
                item
              ) =>
                handleOpenDetails(
                  item,
                  'movie'
                )
              }
              onViewAll={() =>
                setActiveTab(
                  'movies'
                )
              }
              lang={lang}
            />

            <HorizontalSection
              title={
                lang ===
                'ar-SA'
                  ? 'المسلسلات الرائجة'
                  : 'Popular TV'
              }
              icon="▣"
              items={
                trendingTvList
              }
              loading={loading}
              onItemClick={(
                item
              ) =>
                handleOpenDetails(
                  item,
                  'tv'
                )
              }
              onViewAll={() =>
                setActiveTab(
                  'tv'
                )
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
                  lang ===
                  'ar-SA'
                    ? 'شركات الإنتاج'
                    : 'Production Studios'
                }
                icon="▣"
              />

              {STUDIOS.map(
                (studio) => {
                  const studioItems =
                    studioMoviesMap[
                      studio.id
                    ] || [];

                  if (
                    studioItems.length ===
                      0 &&
                    !loading
                  ) {
                    return null;
                  }

                  const itemType =
                    studio.id ===
                      213 ||
                    studio.id === 49
                      ? 'tv'
                      : 'movie';

                  return (
                    <HorizontalSection
                      key={
                        studio.id
                      }
                      title={
                        studio.name
                      }
                      icon="•"
                      items={
                        studioItems
                      }
                      loading={
                        loading
                      }
                      onItemClick={(
                        item
                      ) =>
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
                          itemType ===
                            'tv'
                            ? 'tv'
                            : 'movies'
                        );
                      }}
                      lang={lang}
                    />
                  );
                }
              )}
            </div>
          </div>
        )}

        {/* =========================
            WATCH HISTORY
        ========================= */}

        {activeTab ===
          'history' && (
          <div className="
            space-y-5
          ">
            <div className="
              flex
              items-center
              justify-between
            ">
              <SectionTitle
                title={
                  lang ===
                  'ar-SA'
                    ? 'سجل المشاهدة'
                    : 'Watch History'
                }
                icon="◷"
              />

              {watchHistory.length >
                0 && (
                <button
                  onClick={
                    clearWatchHistory
                  }
                  className="
                    text-[9px]
                    text-[#94A3B8]
                    bg-[#0F172A]
                    border
                    border-[#1E293B]
                    px-3
                    py-1.5
                    rounded-full
                  "
                >
                  {lang ===
                  'ar-SA'
                    ? 'مسح السجل'
                    : 'Clear'}
                </button>
              )}
            </div>

            {watchHistory.length ===
            0 ? (
              <div className="
                py-20
                text-center
                text-[#64748B]
              ">
                <div className="
                  w-16
                  h-16
                  mx-auto
                  rounded-2xl
                  bg-[#0F172A]
                  border
                  border-[#1E293B]
                  flex
                  items-center
                  justify-center
                  text-2xl
                  mb-4
                ">
                  ◷
                </div>

                <p className="text-xs">
                  {lang ===
                  'ar-SA'
                    ? 'لا يوجد شيء في سجل المشاهدة بعد.'
                    : 'Your watch history is empty.'}
                </p>
              </div>
            ) : (
              <div className="
                grid
                grid-cols-3
                gap-3
              ">
                {watchHistory.map(
                  (item) => (
                    <div
                      key={`${item.media_type}-${item.id}`}
                      className="
                        relative
                      "
                    >
                      <MovieCard
                        item={item}
                        onClick={() =>
                          handleHistoryClick(
                            item
                          )
                        }
                      />

                      <button
                        onClick={(e) => {
                          e.stopPropagation();

                          removeFromWatchHistory(
                            item
                          );
                        }}
                        className="
                          absolute
                          top-2
                          left-2
                          w-7
                          h-7
                          rounded-full
                          bg-black/75
                          border
                          border-white/10
                          text-white
                          text-[10px]
                          z-10
                        "
                        aria-label="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}

        {/* =========================
            MY LIST
        ========================= */}

        {activeTab ===
          'mylist' &&
          !searchQuery && (
            <div className="
              space-y-5
            ">
              <SectionTitle
                title={
                  lang ===
                  'ar-SA'
                    ? 'قائمتي'
                    : 'My List'
                }
                icon="♥"
              />

              {myList.length ===
              0 ? (
                <div className="
                  text-center
                  py-20
                  text-[#64748B]
                ">
                  <div className="
                    w-16
                    h-16
                    mx-auto
                    rounded-2xl
                    bg-[#0F172A]
                    border
                    border-[#1E293B]
                    flex
                    items-center
                    justify-center
                    text-2xl
                    mb-4
                  ">
                    ♡
                  </div>

                  <p className="text-xs">
                    {lang ===
                    'ar-SA'
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
                  {myList.map(
                    (item) => (
                      <MovieCard
                        key={
                          item.id
                        }
                        item={item}
                        onClick={() =>
                          handleOpenDetails(
                            item,
                            item.media_type ||
                              'movie'
                          )
                        }
                      />
                    )
                  )}
                </div>
              )}
            </div>
          )}

        {/* =========================
            GRID
        ========================= */}

        {(activeTab !==
          'home' ||
          searchQuery ||
          selectedGenre ||
          selectedStudio ||
          minRating > 0 ||
          selectedYear) &&
          activeTab !==
            'mylist' &&
          activeTab !==
            'history' && (
            <div className="
              space-y-5
            ">
              <div className="
                flex
                items-end
                justify-between
                gap-3
              ">
                <h3 className="
                  text-lg
                  font-black
                  text-white
                ">
                  {searchQuery
                    ? lang ===
                      'ar-SA'
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
                    ? lang ===
                      'ar-SA'
                      ? 'الأفلام'
                      : 'Movies'
                    : lang ===
                      'ar-SA'
                    ? 'المسلسلات'
                    : 'TV Series'}
                </h3>

                {(selectedGenre ||
                  selectedStudio ||
                  minRating > 0 ||
                  selectedYear) && (
                  <button
                    onClick={
                      resetFilters
                    }
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
                    {lang ===
                    'ar-SA'
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
                  }).map(
                    (_, i) => (
                      <div
                        key={i}
                        className="
                          aspect-[2/3]
                          bg-[#111827]
                          rounded-2xl
                          animate-pulse
                        "
                      />
                    )
                  )}
                </div>
              ) : gridItems.length ===
                0 ? (
                <div className="
                  text-center
                  py-20
                  text-[#64748B]
                  text-xs
                ">
                  {lang ===
                  'ar-SA'
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
                          key={
                            item.id
                          }
                          item={item}
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
                      "
                    >
                      {loadingMore
                        ? lang ===
                          'ar-SA'
                          ? 'جاري التحميل...'
                          : 'Loading...'
                        : lang ===
                          'ar-SA'
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
          PROFESSIONAL BOTTOM NAV
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
          h-[70px]
          bg-[#0B1220]/98
          border
          border-[#1E293B]
          rounded-[24px]
          flex
          items-center
          justify-around
          px-2
          shadow-xl
          shadow-black/40
        ">
          <NavItem
            icon="home"
            label={
              lang ===
              'ar-SA'
                ? 'الرئيسية'
                : 'Home'
            }
            active={
              activeTab ===
                'home' &&
              !searchQuery &&
              !selectedGenre &&
              !selectedStudio &&
              !minRating &&
              !selectedYear
            }
            onClick={() => {
              setActiveTab(
                'home'
              );
              resetFilters();
            }}
          />

          <NavItem
            icon="movie"
            label={
              lang ===
              'ar-SA'
                ? 'الأفلام'
                : 'Movies'
            }
            active={
              activeTab ===
                'movies' &&
              !searchQuery &&
              !selectedGenre &&
              !selectedStudio &&
              !minRating &&
              !selectedYear
            }
            onClick={() => {
              setActiveTab(
                'movies'
              );
              resetFilters();
            }}
          />

          <NavItem
            icon="tv"
            label={
              lang ===
              'ar-SA'
                ? 'المسلسلات'
                : 'Series'
            }
            active={
              activeTab ===
                'tv' &&
              !searchQuery &&
              !selectedGenre &&
              !selectedStudio &&
              !minRating &&
              !selectedYear
            }
            onClick={() => {
              setActiveTab(
                'tv'
              );
              resetFilters();
            }}
          />

          <NavItem
            icon="history"
            label={
              lang ===
              'ar-SA'
                ? 'السجل'
                : 'History'
            }
            active={
              activeTab ===
              'history'
            }
            onClick={() => {
              setActiveTab(
                'history'
              );
              resetFilters();
            }}
          />

          <NavItem
            icon="heart"
            label={
              lang ===
              'ar-SA'
                ? 'قائمتي'
                : 'My List'
            }
            active={
              activeTab ===
              'mylist'
            }
            onClick={() => {
              setActiveTab(
                'mylist'
              );
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
            max-h-[85vh]
            overflow-y-auto
          ">
            <div className="
              flex
              justify-between
              items-center
            ">
              <h3 className="
                text-base
                font-black
                text-white
              ">
                {lang ===
                'ar-SA'
                  ? 'تصفية المحتوى'
                  : 'Filter Content'}
              </h3>

              <button
                onClick={() =>
                  setShowFilterModal(
                    false
                  )
                }
                className="
                  w-8
                  h-8
                  rounded-full
                  bg-[#111827]
                  text-[#94A3B8]
                "
              >
                ✕
              </button>
            </div>

            <div className="
              space-y-3
            ">
              <label className="
                text-[10px]
                font-bold
                text-[#94A3B8]
              ">
                {lang ===
                'ar-SA'
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
                    setTempGenre(
                      ''
                    )
                  }
                  className={`py-2 rounded-xl text-[10px] font-bold border ${
                    tempGenre ===
                    ''
                      ? 'bg-[#3B82F6] border-[#3B82F6] text-white'
                      : 'bg-[#05070A] border-[#1E293B] text-[#94A3B8]'
                  }`}
                >
                  {lang ===
                  'ar-SA'
                    ? 'الكل'
                    : 'All'}
                </button>

                {genres.map(
                  (g) => (
                    <button
                      key={
                        g.id
                      }
                      onClick={() =>
                        setTempGenre(
                          g.id
                        )
                      }
                      className={`py-2 px-2 rounded-xl text-[10px] font-bold truncate border ${
                        String(
                          tempGenre
                        ) ===
                        String(
                          g.id
                        )
                          ? 'bg-[#3B82F6] border-[#3B82F6] text-white'
                          : 'bg-[#05070A] border-[#1E293B] text-[#94A3B8]'
                      }`}
                    >
                      {
                        g.name
                      }
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="
              space-y-2
            ">
              <label className="
                text-[10px]
                font-bold
                text-[#94A3B8]
                flex
                justify-between
              ">
                <span>
                  {lang ===
                  'ar-SA'
                    ? 'الحد الأدنى للتقييم'
                    : 'Minimum Rating'}
                </span>

                <span className="
                  text-[#60A5FA]
                ">
                  ★{' '}
                  {
                    tempMinRating
                  }+
                </span>
              </label>

              <input
                type="range"
                min="0"
                max="9"
                step="1"
                value={
                  tempMinRating
                }
                onChange={(e) =>
                  setTempMinRating(
                    Number(
                      e.target
                        .value
                    )
                  )
                }
                className="
                  w-full
                  accent-[#3B82F6]
                "
              />
            </div>

            <div className="
              space-y-2
            ">
              <label className="
                text-[10px]
                font-bold
                text-[#94A3B8]
              ">
                {lang ===
                'ar-SA'
                  ? 'سنة الإنتاج'
                  : 'Release Year'}
              </label>

              <select
                value={
                  tempSelectedYear
                }
                onChange={(e) =>
                  setTempSelectedYear(
                    e.target
                      .value
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
                  outline-none
                "
              >
                <option value="">
                  {lang ===
                  'ar-SA'
                    ? 'كل السنين'
                    : 'All Years'}
                </option>

                {Array.from(
                  {
                    length: 25
                  },
                  (_, i) =>
                    2026 - i
                ).map(
                  (y) => (
                    <option
                      key={y}
                      value={y}
                    >
                      {y}
                    </option>
                  )
                )}
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
                setSelectedStudio(
                  null
                );
                setSearchQuery(
                  ''
                );
                setShowFilterModal(
                  false
                );
              }}
              className="
                w-full
                h-12
                bg-[#3B82F6]
                text-white
                font-black
                rounded-2xl
                text-xs
              "
            >
              {lang ===
              'ar-SA'
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
              setSelectedItem(
                null
              )
            }
            className="
              fixed
              top-4
              left-4
              z-[60]
              w-10
              h-10
              rounded-full
              bg-black/60
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
                h-8
                w-8
                border-2
                border-[#3B82F6]
                border-t-transparent
              " />
            </div>
          ) : (
            <div className="
              pb-24
            ">
              {/* DETAIL HERO */}

              <div className="
                relative
                w-full
                h-[410px]
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
                    loading="eager"
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

                <div
                  className="
                    absolute
                    inset-0
                  "
                  style={{
                    backgroundImage:
                      'linear-gradient(to top, #05070A 0%, rgba(5,7,10,0.35) 55%, transparent 100%)'
                  }}
                />

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
                      text-[10px]
                      font-black
                    ">
                      ★{' '}
                      {details?.vote_average?.toFixed(
                        1
                      ) ||
                        '0.0'}
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

                    {details?.runtime && (
                      <>
                        <span className="
                          text-[#64748B]
                        ">
                          •
                        </span>

                        <span className="
                          text-[10px]
                          text-[#CBD5E1]
                        ">
                          {details.runtime}{' '}
                          {lang ===
                          'ar-SA'
                            ? 'دقيقة'
                            : 'min'}
                        </span>
                      </>
                    )}
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
                      ?.slice(
                        0,
                        4
                      )
                      .map(
                        (g) => (
                          <span
                            key={
                              g.id
                            }
                            className="
                              text-[9px]
                              text-[#CBD5E1]
                              bg-white/5
                              border
                              border-white/10
                              px-2.5
                              py-1
                              rounded-full
                            "
                          >
                            {
                              g.name
                            }
                          </span>
                        )
                      )}
                  </div>
                </div>
              </div>

              <div className="
                px-5
                mt-4
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
                    disabled={
                      trailerLoading
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
                      disabled:opacity-70
                    "
                  >
                    ▶
                    {trailerLoading
                      ? lang ===
                        'ar-SA'
                        ? 'جاري التحميل...'
                        : 'Loading...'
                      : lang ===
                        'ar-SA'
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

                {/* =========================
                    OVERVIEW / STORY
                ========================= */}

                <div className="
                  space-y-3
                ">
                  <SectionTitle
                    title={
                      lang ===
                      'ar-SA'
                        ? 'قصة العمل'
                        : 'Story'
                    }
                    icon="✦"
                  />

                  <div className="
                    bg-[#0B1220]
                    border
                    border-[#1E293B]
                    rounded-2xl
                    p-4
                  ">
                    <p
                      className={`text-[#CBD5E1] text-[13px] leading-7 ${
                        overviewExpanded
                          ? ''
                          : 'line-clamp-4'
                      }`}
                    >
                      {details?.overview ||
                        (lang ===
                        'ar-SA'
                          ? 'لا يوجد وصف متاح لهذا العمل حالياً.'
                          : 'No overview available.')}
                    </p>

                    {details
                      ?.overview
                      ?.length >
                      220 && (
                      <button
                        onClick={() =>
                          setOverviewExpanded(
                            (p) =>
                              !p
                          )
                        }
                        className="
                          mt-3
                          text-[10px]
                          font-bold
                          text-[#60A5FA]
                        "
                      >
                        {overviewExpanded
                          ? lang ===
                            'ar-SA'
                            ? 'عرض أقل'
                            : 'Show Less'
                          : lang ===
                            'ar-SA'
                          ? 'عرض القصة كاملة'
                          : 'Read Full Story'}
                      </button>
                    )}
                  </div>
                </div>

                {/* =========================
                    INFORMATION
                ========================= */}

                <div className="
                  grid
                  grid-cols-3
                  gap-2
                ">
                  <InfoBox
                    label={
                      lang ===
                      'ar-SA'
                        ? 'التقييم'
                        : 'Rating'
                    }
                    value={
                      details?.vote_average
                        ? details.vote_average.toFixed(
                            1
                          )
                        : '—'
                    }
                  />

                  <InfoBox
                    label={
                      lang ===
                      'ar-SA'
                        ? 'التصويتات'
                        : 'Votes'
                    }
                    value={
                      details?.vote_count
                        ? details.vote_count.toLocaleString()
                        : '—'
                    }
                  />

                  <InfoBox
                    label={
                      lang ===
                      'ar-SA'
                        ? 'النوع'
                        : 'Type'
                    }
                    value={
                      selectedItemType ===
                      'tv'
                        ? lang ===
                          'ar-SA'
                          ? 'مسلسل'
                          : 'Series'
                        : lang ===
                          'ar-SA'
                        ? 'فيلم'
                        : 'Movie'
                    }
                  />
                </div>

                {/* =========================
                    SEASONS
                ========================= */}

                {selectedItemType ===
                  'tv' &&
                  details?.seasons
                    ?.length >
                    0 && (
                    <div className="
                      space-y-3
                    ">
                      <SectionTitle
                        title={
                          lang ===
                          'ar-SA'
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
                          .map(
                            (s) => (
                              <button
                                key={
                                  s.id
                                }
                                onClick={() =>
                                  setSelectedSeasonNumber(
                                    s.season_number
                                  )
                                }
                                className={`flex-shrink-0 px-4 py-2 rounded-full text-[10px] font-bold border ${
                                  selectedSeasonNumber ===
                                  s.season_number
                                    ? 'bg-[#3B82F6] border-[#3B82F6] text-white'
                                    : 'bg-[#111827] border-[#1E293B] text-[#94A3B8]'
                                }`}
                              >
                                {lang ===
                                'ar-SA'
                                  ? `الموسم ${s.season_number}`
                                  : `Season ${s.season_number}`}
                              </button>
                            )
                          )}
                      </div>

                      {seasonLoading ? (
                        <div className="
                          text-center
                          py-6
                          text-xs
                          text-[#64748B]
                        ">
                          {lang ===
                          'ar-SA'
                            ? 'جاري التحميل...'
                            : 'Loading...'}
                        </div>
                      ) : (
                        <div className="
                          space-y-2
                        ">
                          {seasonDetails?.episodes?.map(
                            (
                              ep
                            ) => (
                              <div
                                key={
                                  ep.id
                                }
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
                                  loading="lazy"
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
                                    {
                                      ep.episode_number
                                    }
                                    .{' '}
                                    {
                                      ep.name
                                    }
                                  </h4>

                                  {ep.overview && (
                                    <p className="
                                      text-[9px]
                                      text-[#64748B]
                                      mt-1
                                      line-clamp-2
                                    ">
                                      {
                                        ep.overview
                                      }
                                    </p>
                                  )}
                                </div>

                                <button
                                  onClick={() =>
                                    addToWatchHistory(
                                      {
                                        ...details,
                                        id: details.id,
                                        title:
                                          details.title ||
                                          details.name,
                                        poster_path:
                                          details.poster_path,
                                        media_type:
                                          'tv'
                                      },
                                      'tv'
                                    )
                                  }
                                  className="
                                    w-8
                                    h-8
                                    rounded-full
                                    bg-[#0F172A]
                                    self-center
                                    flex
                                    items-center
                                    justify-center
                                    text-[#60A5FA]
                                    flex-shrink-0
                                  "
                                >
                                  ▶
                                </button>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  )}

                {/* =========================
                    CAST
                ========================= */}

                {details?.credits
                  ?.cast?.length >
                  0 && (
                  <div className="
                    space-y-3
                  ">
                    <SectionTitle
                      title={
                        lang ===
                        'ar-SA'
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
                        .slice(
                          0,
                          10
                        )
                        .map(
                          (
                            actor
                          ) => (
                            <div
                              key={
                                actor.id
                              }
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
                                  loading="lazy"
                                />
                              </div>

                              <p className="
                                text-[9px]
                                font-bold
                                text-white
                                truncate
                                mt-2
                              ">
                                {
                                  actor.name
                                }
                              </p>
                            </div>
                          )
                        )}
                    </div>
                  </div>
                )}

                {/* =========================
                    SIMILAR WORKS
                ========================= */}

                <div className="
                  space-y-4
                  pt-2
                ">
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
                      className={`pb-3 text-[11px] font-bold ${
                        activeDetailTab ===
                        'similar'
                          ? 'text-[#3B82F6] border-b-2 border-[#3B82F6]'
                          : 'text-[#64748B]'
                      }`}
                    >
                      {lang ===
                      'ar-SA'
                        ? 'أعمال مشابهة'
                        : 'Similar'}
                    </button>

                    <button
                      onClick={() =>
                        setActiveDetailTab(
                          'recommendations'
                        )
                      }
                      className={`pb-3 text-[11px] font-bold ${
                        activeDetailTab ===
                        'recommendations'
                          ? 'text-[#3B82F6] border-b-2 border-[#3B82F6]'
                          : 'text-[#64748B]'
                      }`}
                    >
                      {lang ===
                      'ar-SA'
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
                          : details?.recommendations
                              ?.results
                      ) || []
                    )
                      .slice(
                        0,
                        6
                      )
                      .map(
                        (
                          item
                        ) => (
                          <MovieCard
                            key={
                              item.id
                            }
                            item={
                              item
                            }
                            onClick={() =>
                              handleOpenDetails(
                                item,
                                selectedItemType
                              )
                            }
                          />
                        )
                      )}
                  </div>

                  {(
                    (
                      activeDetailTab ===
                      'similar'
                        ? details?.similar
                            ?.results
                        : details?.recommendations
                            ?.results
                    ) || []
                  ).length ===
                    0 && (
                    <div className="
                      py-8
                      text-center
                      text-[10px]
                      text-[#64748B]
                    ">
                      {lang ===
                      'ar-SA'
                        ? 'لا توجد أعمال مشابهة حالياً.'
                        : 'No similar works available.'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================
          REAL TRAILER MODAL
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
          ">
            <button
              onClick={() =>
                setTrailerKey(
                  null
                )
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
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1`}
              title="Official Trailer"
              className="
                w-full
                h-full
                border-0
              "
              allow="
                autoplay;
                encrypted-media;
                picture-in-picture
              "
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   INFO BOX
========================================================= */

const InfoBox = ({
  label,
  value
}) => (
  <div className="
    bg-[#0B1220]
    border
    border-[#1E293B]
    rounded-2xl
    p-3
    text-center
  ">
    <p className="
      text-[8px]
      text-[#64748B]
      mb-1
    ">
      {label}
    </p>

    <p className="
      text-[11px]
      font-black
      text-white
      truncate
    ">
      {value}
    </p>
  </div>
);

/* =========================================================
   SECTION TITLE
========================================================= */

const SectionTitle = ({
  title,
  icon
}) => (
  <div className="
    flex
    items-center
    gap-2
  ">
    <span className="
      w-1
      h-4
      rounded-full
      bg-[#3B82F6]
    " />

    <span className="
      text-sm
      font-black
      text-white
    ">
      {icon} {title}
    </span>
  </div>
);

/* =========================================================
   HORIZONTAL SECTION
========================================================= */

const HorizontalSection = ({
  title,
  icon,
  items,
  loading,
  onItemClick,
  onViewAll,
  lang
}) => (
  <div className="
    space-y-3
  ">
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
          "
        >
          {lang ===
          'ar-SA'
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
        }).map(
          (_, i) => (
            <div
              key={i}
              className="
                w-[120px]
                h-[180px]
                bg-[#111827]
                rounded-2xl
                animate-pulse
                flex-shrink-0
              "
            />
          )
        )}
      </div>
    ) : (
      <div className="
        flex
        gap-3
        overflow-x-auto
        scrollbar-none
        pb-1
      ">
        {items
          .slice(0, 12)
          .map(
            (item) => (
              <div
                key={
                  item.id
                }
                className="
                  w-[120px]
                  flex-shrink-0
                "
              >
                <MovieCard
                  item={item}
                  onClick={() =>
                    onItemClick(
                      item
                    )
                  }
                />
              </div>
            )
          )}
      </div>
    )}
  </div>
);

/* =========================================================
   MOVIE CARD
========================================================= */

const MovieCard = ({
  item,
  onClick
}) => (
  <div
    onClick={onClick}
    className="
      cursor-pointer
      active:scale-[.98]
      transition-transform
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
          "
          loading="lazy"
          decoding="async"
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

      <div className="
        absolute
        top-2
        right-2
        bg-[#05070A]/85
        border
        border-white/10
        px-2
        py-0.5
        rounded-full
        text-[8px]
        font-black
        text-white
        flex
        items-center
        gap-0.5
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
      pt-1.5
    ">
      <h4 className="
        text-[10px]
        font-bold
        text-white
        truncate
      ">
        {item.title ||
          item.name}
      </h4>

      <p className="
        text-[8px]
        text-[#64748B]
        mt-0.5
      ">
        {item.release_date?.substring(
          0,
          4
        ) ||
          item.first_air_date?.substring(
            0,
            4
          ) ||
          ''}
      </p>
    </div>
  </div>
);

/* =========================================================
   PROFESSIONAL NAV ITEM
========================================================= */

const NavItem = ({
  icon,
  label,
  active,
  onClick
}) => {
  const icons = {
    home: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="w-[21px] h-[21px]"
      >
        <path
          d="M3 10.8 12 3l9 7.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5.5 9.8V20h13V9.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9.5 20v-6h5v6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),

    movie: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="w-[21px] h-[21px]"
      >
        <rect
          x="3"
          y="5"
          width="18"
          height="14"
          rx="3"
        />
        <path d="m8 5 3 4M13 5l3 4M18 5l2 3" />
        <path d="M3 9h18M3 15h18" />
      </svg>
    ),

    tv: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="w-[21px] h-[21px]"
      >
        <rect
          x="3"
          y="5"
          width="18"
          height="14"
          rx="2.5"
        />
        <path
          d="m9 2 3 3 3-3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="m10 10 5 2-5 2v-4Z"
          fill="currentColor"
          stroke="none"
        />
      </svg>
    ),

    history: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="w-[21px] h-[21px]"
      >
        <path
          d="M4 12a8 8 0 1 0 2.3-5.6"
          strokeLinecap="round"
        />
        <path
          d="M4 5v4h4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 7v5l3 2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),

    heart: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="w-[21px] h-[21px]"
      >
        <path
          d="M20.8 8.8c0 5-8.8 10-8.8 10s-8.8-5-8.8-10A4.8 4.8 0 0 1 12 6.1a4.8 4.8 0 0 1 8.8 2.7Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  };

  return (
    <button
      onClick={onClick}
      className={`
        relative
        min-w-[54px]
        h-[58px]
        rounded-2xl
        flex
        flex-col
        items-center
        justify-center
        gap-1
        transition-all
        duration-200
        ${
          active
            ? 'text-[#3B82F6] bg-[#3B82F6]/10'
            : 'text-[#64748B]'
        }
      `}
    >
      {active && (
        <span className="
          absolute
          top-0
          w-7
          h-[2px]
          rounded-full
          bg-[#3B82F6]
        " />
      )}

      <span
        className={`
          flex
          items-center
          justify-center
          ${
            active
              ? 'scale-105'
              : ''
          }
        `}
      >
        {
          icons[
            icon
          ]
        }
      </span>

      <span
        className={`
          text-[8px]
          font-bold
          ${
            active
              ? 'text-[#60A5FA]'
              : 'text-[#64748B]'
          }
        `}
      >
        {label}
      </span>
    </button>
  );
};
