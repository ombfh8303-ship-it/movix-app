import { useState, useEffect } from 'react';

const API_KEY = '2e462852d8a74a1474c39e45c77bb024';
const DISCOVER_URL = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=ar-SA&sort_by=popularity.desc`;
const SEARCH_URL = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&language=ar-SA&query=`;
const MOVIE_DETAILS_URL = `https://api.themoviedb.org/3/movie/`;
const COLLECTION_URL = `https://api.themoviedb.org/3/collection/`;
const IMAGE_PATH = 'https://image.tmdb.org/t/p/w500';

export default function App() {
  const [movies, setMovies] = useState([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // حالة الفيلم المحدد للنافذة المنبثقة
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [collectionMovies, setCollectionMovies] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // جلب كافة الأفلام
  const fetchMovies = (pageNum = 1) => {
    setLoading(true);
    const url = query.trim()
      ? `${SEARCH_URL}${encodeURIComponent(query)}&page=${pageNum}`
      : `${DISCOVER_URL}&page=${pageNum}`;

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
    fetchMovies(1);
  }, []);

  // البحث
  const handleSearch = (e) => {
    const searchTerm = e.target.value;
    setQuery(searchTerm);
    setPage(1);

    if (searchTerm.trim() === '') {
      fetchMovies(1);
      return;
    }

    fetch(`${SEARCH_URL}${encodeURIComponent(searchTerm)}&page=1`)
      .then((res) => res.json())
      .then((data) => {
        setMovies(data.results || []);
        setTotalPages(data.total_pages || 1);
      });
  };

  // فتح تفاصيل الفيلم وجلب أجزائه إن وجدت
  const handleSelectMovie = (movieId) => {
    setLoadingDetails(true);
    setCollectionMovies([]);

    fetch(`${MOVIE_DETAILS_URL}${movieId}?api_key=${API_KEY}&language=ar-SA`)
      .then((res) => res.json())
      .then((data) => {
        setSelectedMovie(data);
        setLoadingDetails(false);

        // إذا كان الفيلم ينتمي إلى سلسلة/أجزاء (Collection)
        if (data.belongs_to_collection) {
          fetch(`${COLLECTION_URL}${data.belongs_to_collection.id}?api_key=${API_KEY}&language=ar-SA`)
            .then((res) => res.json())
            .then((colData) => {
              setCollectionMovies(colData.parts || []);
            });
        }
      })
      .catch((err) => {
        console.error(err);
        setLoadingDetails(false);
      });
  };

  // إغلاق النافذة
  const closeModal = () => {
    setSelectedMovie(null);
    setCollectionMovies([]);
  };

  return (
    <div style={{ backgroundColor: '#121212', color: '#fff', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
      <header style={{ textAlign: 'center', marginBottom: '20px' }}>
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
      </header>

      <main>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '15px' }}>
          {query ? `نتائج البحث عن: ${query}` : 'جميع الأفلام'}
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '15px' }}>
          {movies.map((movie, index) => (
            <div 
              key={`${movie.id}-${index}`} 
              onClick={() => handleSelectMovie(movie.id)}
              style={{ textAlign: 'center', cursor: 'pointer' }}
            >
              <img 
                src={movie.poster_path ? `${IMAGE_PATH}${movie.poster_path}` : 'https://via.placeholder.com/150'} 
                alt={movie.title} 
                style={{ width: '100%', borderRadius: '8px', objectFit: 'cover' }} 
              />
              <h3 style={{ fontSize: '0.85rem', margin: '5px 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {movie.title}
              </h3>
              <span style={{ color: '#ffb400', fontSize: '0.8rem' }}>★ {movie.vote_average?.toFixed(1)}</span>
            </div>
          ))}
        </div>

        {/* زر تحميل المزيد */}
        {!loading && page < totalPages && (
          <div style={{ textAlign: 'center', marginTop: '25px' }}>
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
                padding: '10px 25px',
                borderRadius: '20px',
                fontSize: '0.9rem',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              عرض المزيد من الأفلام
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
          padding: '20px'
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
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                backgroundColor: '#e50914',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              ✕
            </button>

            {loadingDetails ? (
              <p style={{ textAlign: 'center' }}>جاري تحميل التفاصيل...</p>
            ) : selectedMovie && (
              <div>
                <img 
                  src={selectedMovie.backdrop_path ? `${IMAGE_PATH}${selectedMovie.backdrop_path}` : `${IMAGE_PATH}${selectedMovie.poster_path}`} 
                  alt={selectedMovie.title}
                  style={{ width: '100%', borderRadius: '8px', marginBottom: '15px' }}
                />
                <h2 style={{ fontSize: '1.3rem', margin: '0 0 5px 0' }}>{selectedMovie.title}</h2>
                <p style={{ color: '#ffb400', margin: '0 0 10px 0', fontSize: '0.9rem' }}>
                  ★ {selectedMovie.vote_average?.toFixed(1)} | {selectedMovie.release_date?.split('-')[0]}
                </p>
                <p style={{ fontSize: '0.85rem', lineHeight: '1.5', color: '#ccc' }}>
                  {selectedMovie.overview || 'لا يوجد وصف متاح لهذا الفيلم.'}
                </p>

                {/* قسم أجزاء الفيلم السلسلة */}
                {collectionMovies.length > 0 && (
                  <div style={{ marginTop: '20px', borderTop: '1px solid #333', paddingTop: '15px' }}>
                    <h3 style={{ fontSize: '1rem', color: '#e50914', marginBottom: '10px' }}>
                      أجزاء السلسلة ({collectionMovies.length})
                    </h3>
                    <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
                      {collectionMovies.map((part) => (
                        <div 
                          key={part.id} 
                          onClick={() => handleSelectMovie(part.id)}
                          style={{ minWidth: '90px', cursor: 'pointer', textAlign: 'center' }}
                        >
                          <img 
                            src={part.poster_path ? `${IMAGE_PATH}${part.poster_path}` : 'https://via.placeholder.com/90'} 
                            alt={part.title}
                            style={{ width: '90px', height: '130px', borderRadius: '6px', objectFit: 'cover' }}
                          />
                          <p style={{ fontSize: '0.75rem', margin: '4px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
