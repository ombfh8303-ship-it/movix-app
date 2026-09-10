const API_KEY = '2e462852d8a74a1474c39e45c77bb024';
const BASE_URL = 'https://api.themoviedb.org/3';

export const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

/**
 * جلب المحتوى الشائع (أفلام أو مسلسلات) مع دعم الانتقال بين الصفحات
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
 * البحث في الأفلام والمسلسلات عبر أي صفحة
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
 * جلب تفاصيل الفيلم أو المسلسل مع الفيديوهات والممثلين
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
