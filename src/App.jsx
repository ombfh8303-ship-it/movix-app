import React, { useState, useEffect } from 'react';
import { Search, Globe, Film, Star, Download, RefreshCw } from 'lucide-react';

const TMDB_API_KEY = "3fd2be6f0c70a2a598f084dd23308883"; // مفتاح TMDB الاحتياطي

export default function App() {
  const [lang, setLang] = useState('ar');
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const translations = {
    ar: {
      title: "موفيكس",
      searchPlaceholder: "ابحث عن فيلم...",
      popular: "الأفلام الشائعة",
      rating: "التقييم",
      langName: "English",
      dir: "rtl"
    },
    en: {
      title: "Movix",
      searchPlaceholder: "Search movies...",
      popular: "Popular Movies",
      rating: "Rating",
      langName: "العربية",
      dir: "ltr"
    }
  };

  const t = translations[lang];

  useEffect(() => {
    document.dir = t.dir;
    fetchMovies();
  }, [lang]);

  const fetchMovies = async (query = '') => {
    setLoading(true);
    try {
      const endpoint = query 
        ? `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&language=${lang === 'ar' ? 'ar-SA' : 'en-US'}&query=${encodeURIComponent(query)}`
        : `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=${lang === 'ar' ? 'ar-SA' : 'en-US'}`;
      
      const res = await fetch(endpoint);
      const data = await res.json();
      setMovies(data.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchMovies(searchTerm);
  };

  return (
    <div className="min-h-screen bg-[#08080a] text-white p-4 md:p-8 font-sans">
      {/* Header */}
      <header className="flex justify-between items-center mb-8 max-w-7xl mx-auto">
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <Film className="w-8 h-8 text-red-600" />
          <h1 className="text-2xl font-bold tracking-wider">{t.title}</h1>
        </div>

        <button 
          onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          className="flex items-center space-x-2 rtl:space-x-reverse bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition"
        >
          <Globe className="w-4 h-4" />
          <span>{t.langName}</span>
        </button>
      </header>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto mb-10">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full bg-gray-900 border border-gray-800 rounded-full py-3 px-12 text-white focus:outline-none focus:border-red-600 transition"
          />
          <Search className="absolute top-3.5 left-4 rtl:right-4 rtl:left-auto text-gray-400 w-5 h-5" />
        </form>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto">
        <h2 className="text-xl font-bold mb-6 border-b border-gray-800 pb-2">{t.popular}</h2>

        {loading ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-red-600" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {movies.map((movie) => (
              <div key={movie.id} className="bg-gray-900 rounded-xl overflow-hidden hover:scale-105 transition duration-300">
                <img 
                  src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://via.placeholder.com/500x750'} 
                  alt={movie.title}
                  className="w-full h-72 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold text-sm truncate">{movie.title}</h3>
                  <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
                    <span className="flex items-center text-yellow-500">
                      <Star className="w-3.5 h-3.5 fill-current mr-1 rtl:ml-1" />
                      {movie.vote_average?.toFixed(1)}
                    </span>
                    <span>{movie.release_date?.split('-')[0]}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
