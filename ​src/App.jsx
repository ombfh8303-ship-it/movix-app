import { useState, useEffect } from 'react';

const API_KEY = '2e462852d8a74a1474c39e45c77bb024';
const DISCOVER_URL = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=ar-SA&sort_by=popularity.desc`;
const SEARCH_URL = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&language=ar-SA&query=`;
const IMAGE_PATH = 'https://image.tmdb.org/t/p/w500';

export default function App() {
  const [movies, setMovies] = useState([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // جلب كافة الأفلام من جميع صفحات TMDB
  const fetchMovies = (pageNum = 1, isNewSearch = false) => {
    setLoading(true);
    const url = query.trim()
      ? `${SEARCH_URL}${encodeURIComponent(query)}&page=${pageNum}`
      : `${DISCOVER_URL}&page=${pageNum}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (isNewSearch || pageNum === 1) {
          setMovies(data.results || []);
        } else {
          setMovies((prev) => [...prev, ...(data.results || [])]);
        }
        setTotalPages(data.total_pages > 500 ? 500 : data.total_pages); // TMDB يدعم حتى 500 صفحة في API Discover
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  // عند فتح التطبيق أول مرة
  useEffect(() => {
    fetchMovies(1, true);
  }, []);

  // البحث عند تغيير النص
  const handleSearch = (e) => {
    const searchTerm = e.target.value;
    setQuery(searchTerm);
    setPage(1);

    if (searchTerm.trim() === '') {
      setLoading(true);
      fetch(`${DISCOVER_URL}&page=1`)
        .then((res) => res.json())
        .then((data) => {
          setMovies(data.results || []);
          setTotalPages(data.total_pages > 500 ? 500 : data.total_pages);
          setLoading(false);
        });
      return;
    }

    fetch(`${SEARCH_URL}${encodeURIComponent(searchTerm)}&page=1`)
      .then((res) => res.json())
      .then((data) => {
        setMovies(data.results || []);
        setTotalPages(data.total_pages || 1);
        setLoading(false);
      });
  };

  // تحميل الصفحة التالية عند الضغط على الزر
  const handleLoadMore = () => {
    if (page < totalPages) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchMovies(nextPage, false);
    }
  };

  return (
    <div style={{ backgroundColor: '#121212', color: '#fff', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
      <header style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: '#e50914', margin: '0 0 10px 0' }}>Movix</h1>
        
        {/* شريط البحث */}
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
            <div key={`${movie.id}-${index}`} style={{ textAlign: 'center' }}>
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

        {loading && <p style={{ textAlign: 'center', margin: '20px 0' }}>جاري التحميل...</p>}

        {/* زر تحميل المزيد من الصفحات */}
        {!loading && page < totalPages && (
          <div style={{ textAlign: 'center', marginTop: '25px' }}>
            <button
              onClick={handleLoadMore}
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
    </div>
  );
}
