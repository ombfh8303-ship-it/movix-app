const VITE_KEY = import.meta.env.VITE_TMDB_API_KEY;
const API_KEY = (VITE_KEY && VITE_KEY.trim() !== '') ? VITE_KEY : '2e462852d8a74a1474c39e45c77bb024';
const BASE_URL = 'https://api.themoviedb.org/3';

export const getTrendingMovies = async () => {
  try {
    const response = await fetch(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("Error fetching movies:", error);
    return [];
  }
};
