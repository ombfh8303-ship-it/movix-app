import { useState, useEffect } from 'react';

const API_KEY = '2e462852d8a74a1474c39e45c77bb024';
const POPULAR_URL = `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=ar-SA&page=1`;
const SEARCH_URL = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&language=ar-SA&query=`;
const IMAGE_PATH = 'https://image.tmdb.org/t/p/w500';

export default function App() {
  const [movies, setMovies] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // جلب الأفلام الشائعة
  const fetchPopularMovies = () => {
    setLoading(true);
    fetch(POPULAR_URL)
      .then((res) => res.json())
      .then((data) => {
        setMovies(data.results || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  // البحث عن فيلم عند الكتابة
  const handleSearch = (e) => {
    const searchTerm = e.target.value;
    setQuery(searchTerm);

    if (searchTerm.trim() === '') {
      fetchPopularMovies();
      return;
    }

    setLoading(true);
    fetch(`${SEARCH_URL}${encodeURIComponent(searchTerm)}`)
      .then((res) => res.json())
      .then((data) => {
        setMovies(data.results || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPopularMovies();
  }, []);

  return (
    <div style={{ backgroundColor: '#121212', color: '#fff', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
      <header style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: '#e50914', margin: '0 0 10px 0' }}>Movix</h1>
        
        {/* شريط البحث */}
        <input
          type="text"
          placeholder="ابحث عن فيلم..."
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
          {query ? `نتائج البحث عن: ${query}` : 'الأفلام الشائعة الآن'}
        </h2>
        
        {loading ? (
          <p style={{ textAlign: 'center' }}>جاري التحميل...</p>
        ) : movies.length === 0 ? (
          <p style={{ textAlign: 'center' }}>لا توجد نتائج مطابقة</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '15px' }}>
            {movies.map((movie) => (
              <div key={movie.id} style={{ textAlign: 'center' }}>
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
        )}
      </main>
    </div>
  );
}
