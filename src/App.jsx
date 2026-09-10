import React, { useState, useEffect } from 'react';
import { fetchTrending, searchMedia } from './services/tmdb';
import MovieCard from './components/MovieCard';
import MovieDetailsModal from './components/MovieDetailsModal';

export default function App() {
  const [items, setItems] = useState([]);
  const [contentType, setContentType] = useState('movie');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState('ar-SA');
  const [selectedItem, setSelectedItem] = useState(null);

  const loadData = async () => {
    setLoading(true);
    let data;
    if (searchQuery.trim()) {
      data = await searchMedia(searchQuery, contentType, page, lang);
    } else {
      data = await fetchTrending(contentType, page, lang);
    }
    setItems(data.results || []);
    setTotalPages(data.total_pages || 1);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [contentType, page, searchQuery, lang]);

  const handleTypeChange = (type) => {
    setContentType(type);
    setPage(1);
  };

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'ar-SA' ? 'en-US' : 'ar-SA'));
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8" dir={lang === 'ar-SA' ? 'rtl' : 'ltr'}>
      <header className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🎬</span>
          <h1 className="text-2xl font-bold text-red-600">موڤيكس</h1>
        </div>
        <button
          onClick={toggleLanguage}
          className="bg-gray-800 hover:bg-gray-700 text-sm px-4 py-2 rounded-lg border border-gray-700 transition"
        >
          {lang === 'ar-SA' ? 'English 🌐' : 'العربية 🌐'}
        </button>
      </header>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <input
          type="text"
          placeholder={lang === 'ar-SA' ? 'ابحث عن فيلم أو مسلسل...' : 'Search movies or TV show...'}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          className="flex-1 bg-gray-900 border border-gray-800 px-4 py-3 rounded-xl focus:outline-none focus:border-red-600 text-sm"
        />

        <div className="flex gap-2">
          <button
            onClick={() => handleTypeChange('movie')}
            className={`px-6 py-3 rounded-xl text-sm font-semibold transition ${
              contentType === 'movie' ? 'bg-red-600 text-white' : 'bg-gray-900 text-gray-400 border border-gray-800'
            }`}
          >
            {lang === 'ar-SA' ? 'الأفلام' : 'Movies'}
          </button>
          <button
            onClick={() => handleTypeChange('tv')}
            className={`px-6 py-3 rounded-xl text-sm font-semibold transition ${
              contentType === 'tv' ? 'bg-red-600 text-white' : 'bg-gray-900 text-gray-400 border border-gray-800'
            }`}
          >
            {lang === 'ar-SA' ? 'المسلسلات' : 'TV Shows'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">
          {lang === 'ar-SA' ? 'جاري التحميل...' : 'Loading...'}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {items.map((item) => (
            <div key={item.id} onClick={() => setSelectedItem(item)}>
              <MovieCard item={item} type={contentType} />
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-center items-center gap-4 mt-12 py-4">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
          className="px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm disabled:opacity-50"
        >
          {lang === 'ar-SA' ? 'السابق' : 'Previous'}
        </button>
        <span className="text-sm text-gray-400">
          {page} / {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm disabled:opacity-50"
        >
          {lang === 'ar-SA' ? 'التالي' : 'Next'}
        </button>
      </div>

      {selectedItem && (
        <MovieDetailsModal
          item={selectedItem}
          type={contentType}
          lang={lang}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}
