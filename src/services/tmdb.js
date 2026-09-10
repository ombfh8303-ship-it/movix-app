const API_KEY = '2e462852d8a74a1474c39e45c77bb024';
const BASE_URL = 'https://api.themoviedb.org/3';

export const BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/original';
export const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

/**
 * جلب قائمة التصنيفات (Genres) للأفلام أو المسلسلات
 */
export const fetchGenres = async (type = 'movie', lang = 'ar-SA') => {
  try {
    const response = await fetch(
      `${BASE_URL}/genre/${type}/list?api_key=${API_KEY}&language=${lang}`
    );
    if (!response.ok) throw new Error('Failed to fetch genres');
    const data = await response.json();
    return data.genres || [];
  } catch (error) {
    console.error('Error fetching genres:', error);
    return [];
  }
};

/**
 * جلب الأفلام أو المسلسلات حسب تصنيف معين (Genre ID)
 */
export const fetchByGenre = async (type = 'movie', genreId, page = 1, lang = 'ar-SA') => {
  try {
    const response = await fetch(
      `${BASE_URL}/discover/${type}?api_key=${API_KEY}&with_genres=${genreId}&language=${lang}&page=${page}`
    );
    if (!response.ok) throw new Error('Failed to fetch media by genre');
    return await response.json();
  } catch (error) {
    console.error('Error fetching by genre:', error);
    return { results: [], page: 1, total_pages: 1 };
  }
};

/**
 * جلب المحتوى الشائع (الأكثر تداولاً)
 */
export const fetchTrending = async (type = 'movie', page = 1, lang = 'ar-SA') => {
  try {
    const response = await fetch(
      `${BASE_URL}/trending/${type}/week?api_key=${API_KEY}&language=${lang}&page=${page}`
    );
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error('Error fetching trending data:', error);
    return { results: [], page: 1, total_pages: 1 };
  }
};

/**
 * جلب الأعلى تقييماً (Top Rated)
 */
export const fetchTopRated = async (type = 'movie', page = 1, lang = 'ar-SA') => {
  try {
    const response = await fetch(
      `${BASE_URL}/${type}/top_rated?api_key=${API_KEY}&language=${lang}&page=${page}`
    );
    if (!response.ok) throw new Error('Failed to fetch top rated data');
    return await response.json();
  } catch (error) {
    console.error('Error fetching top rated data:', error);
    return { results: [], page: 1, total_pages: 1 };
  }
};

/**
 * جلب الأحدث / القادمة قريباً (Upcoming for movies / On The Air for TV)
 */
export const fetchUpcomingOrPopular = async (type = 'movie', page = 1, lang = 'ar-SA') => {
  const endpoint = type === 'movie' ? 'upcoming' : 'on_the_air';
  try {
    const response = await fetch(
      `${BASE_URL}/${type}/${endpoint}?api_key=${API_KEY}&language=${lang}&page=${page}`
    );
    if (!response.ok) throw new Error('Failed to fetch upcoming/latest data');
    return await response.json();
  } catch (error) {
    console.error('Error fetching upcoming/latest data:', error);
    return { results: [], page: 1, total_pages: 1 };
  }
};

/**
 * البحث في الأفلام والمسلسلات
 */
export const searchMedia = async (query, type = 'movie', page = 1, lang = 'ar-SA') => {
  if (!query) return { results: [], page: 1, total_pages: 1 };
  try {
    const response = await fetch(
      `${BASE_URL}/search/${type}?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=${lang}&page=${page}`
    );
    if (!response.ok) throw new Error('Search request failed');
    return await response.json();
  } catch (error) {
    console.error('Error searching media:', error);
    return { results: [], page: 1, total_pages: 1 };
  }
};

/**
 * جلب تفاصيل الفيلم أو المسلسل
 */
export const fetchDetails = async (type, id, lang = 'ar-SA') => {
  try {
    const response = await fetch(
      `${BASE_URL}/${type}/${id}?api_key=${API_KEY}&language=${lang}&append_to_response=videos,credits`
    );
    if (!response.ok) throw new Error('Details request failed');
    return await response.json();
  } catch (error) {
    console.error('Error fetching details:', error);
    return null;
  }
};
