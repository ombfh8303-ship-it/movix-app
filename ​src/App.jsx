import { useState, useEffect } from 'react';
import { CapacitorUpdater } from '@capgo/capacitor-updater';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY || '2e462852d8a74a1474c39e45c77bb024';
const DISCOVER_URL = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=ar-SA&sort_by=popularity.desc`;
const SEARCH_URL = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&language=ar-SA&query=`;
const GENRES_URL = `https://api.themoviedb.org/3/genre/movie/list?api_key=${API_KEY}&language=ar-SA`;
const MOVIE_DETAILS_URL = `https://api.themoviedb.org/3/movie/`;
const COLLECTION_URL = `https://api.themoviedb.org/3/collection/`;
const IMAGE_PATH = 'https://image.tmdb.org/t/p/w500';

export default function App() {
  const [movies, setMovies] = useState([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // التصنيفات والمفضلة
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('movix_favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // النافذة المنبثقة
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [collectionMovies, setCollectionMovies] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // إدارة التحديثات الحية وتأكيد الجاهزية
  useEffect(() => {
    async function handleAutoUpdate() {
      try {
        await CapacitorUpdater.notifyAppReady();
        const version = await CapacitorUpdater.download();
        if (version) {
          await CapacitorUpdater.set(version);
        }
      } catch (err) {
        console.log('OTA update check:', err);
      }
    }
    handleAutoUpdate();

    fetch(GENRES_URL)
      .then((res) => res.json())
      .then((data) => setGenres(data.genres || []))
      .catch((err) => console.error(err));
  }, []);

  // حفظ المفضلة محلياً
  useEffect(() => {
    localStorage.setItem('movix_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // جلب الأفلام
  const fetchMovies = (pageNum = 1, genreId = selectedGenre) => {
    setLoading(true);
    let url = query.trim()
      ? `${SEARCH_URL}${encodeURIComponent(query)}&page=${pageNum}`
      : `${DISCOVER_URL}&page=${pageNum}`;

    if (!query.trim() && genreId) {
      url += `&with_genres=${genreId}`;
    }

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (pageNum === 1) {
          setMovies(data.results || []);
        } else {
          setMovies((prev) => [...prev, ...(data.results || [])]);
        }
        setTotalPages(data.total_pages > 500 ? 500 : data.total_pages);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!showFavoritesOnly) {
      fetchMovies(1, selectedGenre);
    }
  }, [selectedGenre, showFavoritesOnly]);

  const handleSearch = (e) => {
    const searchTerm = e.target.value;
    setQuery(searchTerm);
    setSelectedGenre('');
    setShowFavoritesOnly(false);
    setPage(1);

    if (searchTerm.trim() === '') {
      fetchMovies(1, '');
      return;
    }

    fetch(`${SEARCH_URL}${encodeURIComponent(searchTerm)}&page=1`)
      .then((res) => res.json())
      .then((data) => {
        setMovies(data.results || []);
        setTotalPages(data.total_pages || 1);
      });
  };

  const toggleFavorite = (movie) => {
    setFavorites((prev) => {
      const exists = prev.some((item) => item.id === movie.id);
      if (exists) {
        return prev.filter((item) => item.id !== movie.id);
      } else {
        return [...prev, movie];
      }
    });
  };

  const handleSelectMovie = (movieId) => {
    setLoadingDetails(true);
    setCollectionMovies([]);

    fetch(`${MOVIE_DETAILS_URL}${movieId}?api_key=${API_KEY}&language=ar-SA`)
      .then((res) => res.json())
      .then((data) => {
        setSelectedMovie(data);
        setLoadingDetails(false);

        if (data.belongs_to_collection) {
          fetch(`${COLLECTION_URL}${data.belongs_to_collection.id}?api_key=${API_KEY}&language=ar-SA`)
            .then((res) => res.json())
            .then((colData) => setCollectionMovies(colData.parts || []));
        }
      })
      .catch((err) => {
        console.error(err);
        setLoadingDetails(false);
      });
  };

  const displayedMovies = showFavoritesOnly ? favorites : movies;

  return (
    <div style={{ backgroundColor: '#121212', color: '#fff', minHeight: '100vh', padding: '15px', fontFamily: 'sans-serif', direction: 'rtl' }}>
      <header style={{ textAlign: 'center', marginBottom: '15px' }}>
        <h1 style={{ color: '#e50914', margin: '0 0 10px 0' }}>Movix</h1>
        
        <input
          type="text"
          placeholder="ابحث في مكتبة الأفلام..."
          value={query}
          onChange={handleSearch}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '10px 15px',
            borderRadius: '20px',
            border: 'none',
            outline: 'none',
            fontSize: '0.9rem',
            backgroundColor: '#1f1f1f',
            color: '#fff',
            textAlign: 'right'
          }}
        />

        {/* أزرار التصفية والمفضلة */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '10px 0', marginTop: '10px' }}>
          <button
            onClick={() => {
              setShowFavoritesOnly(false);
              setSelectedGenre('');
            }}
            style={{
              padding: '6px 14px',
              borderRadius: '15px',
              border: 'none',
              backgroundColor: !showFavoritesOnly && !selectedGenre ? '#e50914' : '#222',
              color: '#fff',
              whiteSpace: 'nowrap',
              fontSize: '0.8rem'
            }}
          >
            الكل
          </button>

          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            style={{
              padding: '6px 14px',
              borderRadius: '15px',
              border: 'none',
              backgroundColor: showFavoritesOnly ? '#ffb400' : '#222',
              color: showFavoritesOnly ? '#000' : '#fff',
              whiteSpace: 'nowrap',
              fontSize: '0.8rem',
              fontWeight: 'bold'
            }}
          >
            ★ المفضلة ({favorites.length})
          </button>

          {!showFavoritesOnly && genres.map((g) => (
            <button
              key={g.id}
              onClick={() => {
                setSelectedGenre(g.id);
                setPage(1);
              }}
              style={{
                padding: '6px 14px',
                borderRadius: '15px',
                border: 'none',
                backgroundColor: selectedGenre === g.id ? '#e50914' : '#222',
                color: '#fff',
                whiteSpace: 'nowrap',
                fontSize: '0.8rem'
              }}
            >
              {g.name}
            </button>
          ))}
        </div>
      </header>

      <main>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '15px' }}>
          {showFavoritesOnly ? 'قائمة المفضلة' : query ? `نتائج البحث عن: ${query}` : 'الأفلام المتاحة'}
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '12px' }}>
          {displayedMovies.map((movie, index) => {
            const isFav = favorites.some((f) => f.id === movie.id);
            return (
              <div key={`${movie.id}-${index}`} style={{ textAlign: 'center', position: 'relative' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(movie);
                  }}
                  style={{
                    position: 'absolute',
                    top: '5px',
                    left: '5px',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    color: isFav ? '#ffb400' : '#fff',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    zIndex: 2
                  }}
                >
                  {isFav ? '★' : '☆'}
                </button>

                <div onClick={() => handleSelectMovie(movie.id)} style={{ cursor: 'pointer' }}>
                  <img 
                    src={movie.poster_path ? `${IMAGE_PATH}${movie.poster_path}` : 'https://via.placeholder.com/150'} 
                    alt={movie.title} 
                    style={{ width: '100%', borderRadius: '8px', objectFit: 'cover' }} 
                  />
                  <h3 style={{ fontSize: '0.8rem', margin: '5px 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {movie.title}
                  </h3>
                  <span style={{ color: '#ffb400', fontSize: '0.75rem' }}>★ {movie.vote_average?.toFixed(1)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {!loading && !showFavoritesOnly && page < totalPages && (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button
              onClick={() => {
                const nextPage = page + 1;
                setPage(nextPage);
                fetchMovies(nextPage);
              }}
              style={{
                backgroundColor: '#e50914',
                color: '#fff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '20px',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              عرض المزيد
            </button>
          </div>
        )}
      </main>

      {/* نافذة التفاصيل والأجزاء */}
      {(selectedMovie || loadingDetails) && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '15px'
        }}>
          <div style={{
            backgroundColor: '#1f1f1f',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '85vh',
            overflowY: 'auto',
            padding: '20px',
            position: 'relative'
          }}>
            <button 
              onClick={() => setSelectedMovie(null)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                backgroundColor: '#e50914',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>

            {loadingDetails ? (
              <p style={{ textAlign: 'center' }}>جاري التحميل...</p>
            ) : selectedMovie && (
              <div>
                <img 
                  src={selectedMovie.backdrop_path ? `${IMAGE_PATH}${selectedMovie.backdrop_path}` : `${IMAGE_PATH}${selectedMovie.poster_path}`} 
                  alt={selectedMovie.title}
                  style={{ width: '100%', borderRadius: '8px', marginBottom: '15px' }}
                />
                <h2 style={{ fontSize: '1.2rem', margin: '0 0 5px 0' }}>{selectedMovie.title}</h2>
                <p style={{ color: '#ffb400', margin: '0 0 10px 0', fontSize: '0.85rem' }}>
                  ★ {selectedMovie.vote_average?.toFixed(1)} | {selectedMovie.release_date?.split('-')[0]}
                </p>
                <p style={{ fontSize: '0.85rem', lineHeight: '1.5', color: '#ccc' }}>
                  {selectedMovie.overview || 'لا يوجد وصف متاح لهذا الفيلم.'}
                </p>

                {collectionMovies.length > 0 && (
                  <div style={{ marginTop: '20px', borderTop: '1px solid #333', paddingTop: '15px' }}>
                    <h3 style={{ fontSize: '0.95rem', color: '#e50914', marginBottom: '10px' }}>
                      أجزاء السلسلة ({collectionMovies.length})
                    </h3>
                    <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
                      {collectionMovies.map((part) => (
                        <div 
                          key={part.id} 
                          onClick={() => handleSelectMovie(part.id)}
                          style={{ minWidth: '85px', cursor: 'pointer', textAlign: 'center' }}
                        >
                          <img 
                            src={part.poster_path ? `${IMAGE_PATH}${part.poster_path}` : 'https://via.placeholder.com/90'} 
                            alt={part.title}
                            style={{ width: '85px', height: '120px', borderRadius: '6px', objectFit: 'cover' }}
                          />
                          <p style={{ fontSize: '0.7rem', margin: '4px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {part.title}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
