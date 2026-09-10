const API_KEY = '2e462852d8a74a1474c39e45c77bb024';
const BASE_URL = 'https://api.themoviedb.org/3';

export const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

/**
 * جلب المحتوى الشائع (أفلام أو مسلسلات) مع دعم الانتقال بين الصفحات
 * @param {'movie' | 'tv'} type - نوع المحتوى
 * @param {number} page - رقم الصفحة المراد جلبها
 * @param {string} lang - اللغة ('ar-SA' أو 'en-US')
 */
export const fetchTrending = async (type = 'movie', page = 1, lang = 'ar-SA') => {
  try {
    const response = await fetch(
      `${BASE_URL}/trending/${type}/week?api_key=${API_KEY}&language=${lang}&page=${page}`
    );
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return data; // يحتوي على results, page, total_pages, total_results
  } catch (error) {
    console.error('Error fetching trending data:', error);
    return { results: [], page: 1, total_pages: 1 };
  }
};

/**
 * البحث في الأفلام والمسلسلات عبر أي صفحة
 * @param {string} query - كلمة البحث
 * @param {'movie' | 'tv'} type - نوع المحتوى
 * @param {number} page - رقم الصفحة
 * @param {string} lang - اللغة
 */
export const searchMedia = async (query, type = 'movie', page = 1, lang = 'ar-SA') => {
  if (!query) return { results: [], page: 1, total_pages: 1 };
  try {
    const response = await fetch(
      `${BASE_URL}/search/${type}?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=${lang}&page=${page}`
    );
    if (!response.ok) throw new Error('Search request failed');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching media:', error);
    return { results: [], page: 1, total_pages: 1 };
  }
};

/**
 * جلب تفاصيل فيلم أو مسلسل محدد
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
