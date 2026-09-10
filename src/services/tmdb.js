const API_KEY = '2e462852d8a74a1474c39e45c77bb024';
const BASE_URL = 'https://api.themoviedb.org/3';

export const BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/original';
export const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

/**
 * قائمة الاستوديوهات الشهيرة المعرفة افتراضياً
 */
export const DEFAULT_STUDIOS = [
  { id: 420, name: 'Marvel Studios', type: 'movie' },
  { id: 174, name: 'Warner Bros. Pictures', type: 'movie' },
  { id: 2, name: 'Walt Disney Pictures', type: 'movie' },
  { id: 213, name: 'Netflix', type: 'tv' }
];

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
 * جلب أفلام وأعمال شركة إنتاج معينة (Company ID)
 */
export const fetchByCompany = async (companyId, page = 1, lang = 'ar-SA') => {
  try {
    const response = await fetch(
      `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_companies=${companyId}&language=${lang}&page=${page}&sort_by=popularity.desc`
    );
    if (!response.ok) throw new Error('Failed to fetch by company');
    return await response.json();
  } catch (error) {
    console.error('Error fetching company movies:', error);
    return { results: [], page: 1, total_pages: 1 };
  }
};

/**
 * جلب أعمال شركة/منصة إنتاج محددة مع يدعم معالجة المنصات الرقمية كـ Netflix
 */
export const fetchByStudio = async (type = 'movie', studioId, page = 1, lang = 'ar-SA') => {
  try {
    const isNetflix = studioId === 213 || studioId === '213';
    const param = (type === 'tv' || isNetflix)
      ? `with_networks=${studioId}`
      : `with_companies=${studioId}`;

    const response = await fetch(
      `${BASE_URL}/discover/${type}?api_key=${API_KEY}&${param}&language=${lang}&page=${page}&sort_by=popularity.desc`
    );
    
    if (!response.ok) throw new Error('Failed to fetch studio content');
    return await response.json();
  } catch (error) {
    console.error('Error fetching studio content:', error);
    return { results: [], page: 1, total_pages: 1 };
  }
};

/**
 * جلب بيانات عدة استوديوهات دفعة واحدة وآمنة دون تعطل التطبيق
 */
export const fetchMultipleStudios = async (studiosList = DEFAULT_STUDIOS, lang = 'ar-SA') => {
  const promises = studiosList.map(async (studio) => {
    try {
      const data = await fetchByStudio(studio.type || 'movie', studio.id, 1, lang);
      return {
        id: studio.id,
        name: studio.name,
        results: data.results || []
      };
    } catch (err) {
      console.error(`Failed loading studio ${studio.name}:`, err);
      return { id: studio.id, name: studio.name, results: [] };
    }
  });

  const results = await Promise.allSettled(promises);
  return results
    .filter((res) => res.status === 'fulfilled')
    .map((res) => res.value);
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
 * جلب الأحدث / القادمة قريباً
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
 * جلب تفاصيل الفيلم أو المسلسل شاملة الفيديوهات والتريلر وطاقم التمثيل
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
