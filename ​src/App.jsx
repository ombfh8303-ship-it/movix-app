import { useState, useEffect } from 'react';

const API_KEY = 'YOUR_TMDB_API_KEY'; // ضع مفتاح TMDB الخاص بك هنا لاحقاً

export default function App() {
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    // جلب الأفلام الأكثر شهرة (نموذج بيانات مؤقت للتجربة)
    setMovies([
      { id: 1, title: 'Inception', rating: 8.8, image: 'https://via.placeholder.com/150' },
      { id: 2, title: 'Interstellar', rating: 8.6, image: 'https://via.placeholder.com/150' },
      { id: 3, title: 'The Dark Knight', rating: 9.0, image: 'https://via.placeholder.com/150' }
    ]);
  }, []);

  return (
    <div style={{ backgroundColor: '#121212', color: '#fff', minHeight: '100vh', padding: '20px' }}>
      <header style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: '#e50914', margin: 0 }}>Movix</h1>
        <p>تصفح أحدث الأفلام والمسلسلات</p>
      </header>

      <main>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '15px' }}>الأفلام الأكثر شهرة</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '15px' }}>
          {movies.map((movie) => (
            <div key={movie.id} style={{ textAlign: 'center' }}>
              <img 
                src={movie.image} 
                alt={movie.title} 
                style={{ width: '100%', borderRadius: '8px' }} 
              />
              <h3 style={{ fontSize: '0.9rem', margin: '5px 0 2px' }}>{movie.title}</h3>
              <span style={{ color: '#ffb400', fontSize: '0.8rem' }}>★ {movie.rating}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
