import React, { useEffect, useState } from 'react';
import { fetchDetails, IMAGE_BASE_URL } from '../services/tmdb';

export default function MovieDetailsModal({ item, type, lang, onClose }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getDetails = async () => {
      setLoading(true);
      const data = await fetchDetails(type, item.id, lang);
      setDetails(data);
      setLoading(false);
    };
    if (item) getDetails();
  }, [item, type, lang]);

  if (!item) return null;

  const trailer = details?.videos?.results?.find(
    (vid) => vid.site === 'YouTube' && (vid.type === 'Trailer' || vid.type === 'Teaser')
  );

  const backdrop = details?.backdrop_path
    ? `${IMAGE_BASE_URL}${details.backdrop_path}`
    : null;

  const poster = details?.poster_path
    ? `${IMAGE_BASE_URL}${details.poster_path}`
    : 'https://via.placeholder.com/500x750?text=No+Image';

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-y-auto min-h-screen text-white">
      {/* زر العودة للرئيسية */}
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-50 bg-black/70 hover:bg-red-600 text-white px-4 py-2 rounded-full backdrop-blur-md transition flex items-center gap-2 border border-gray-700 text-sm font-semibold"
      >
        ✕ {lang === 'ar-SA' ? 'إغلاق الصفحة' : 'Close Page'}
      </button>

      {loading ? (
        <div className="flex justify-center items-center h-screen text-gray-400">
          {lang === 'ar-SA' ? 'جاري تحميل التفاصيل...' : 'Loading details...'}
        </div>
      ) : (
        <div className="pb-16">
          {/* قسم الغلاف العلوي Hero Banner */}
          <div className="relative w-full h-[50vh] md:h-[65vh] bg-gray-900">
            {backdrop ? (
              <img
                src={backdrop}
                alt={details?.title || details?.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-900" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            
            {/* عنوان الفيلم والتقييم فوق الهيرو */}
            <div className="absolute bottom-6 px-6 md:px-12 w-full flex flex-col md:flex-row items-start md:items-end gap-6">
              <img
                src={poster}
                alt="Poster"
                className="w-28 md:w-44 rounded-xl shadow-2xl border-2 border-gray-800 hidden sm:block"
              />
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-yellow-500 text-black font-bold px-2.5 py-0.5 rounded text-xs">
                    ★ {details?.vote_average?.toFixed(1)}
                  </span>
                  <span className="text-sm text-gray-300">
                    {details?.release_date || details?.first_air_date}
                  </span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black text-white">
                  {details?.title || details?.name}
                </h1>
              </div>
            </div>
          </div>

          {/* محتوى التفاصيل */}
          <div className="max-w-5xl mx-auto px-6 mt-8 space-y-10">
            {/* التصنيفات (Genres) */}
            <div className="flex flex-wrap gap-2">
              {details?.genres?.map((g) => (
                <span
                  key={g.id}
                  className="bg-gray-800 text-gray-300 px-3 py-1 rounded-lg text-xs font-medium border border-gray-700"
                >
                  {g.name}
                </span>
              ))}
            </div>

            {/* القصة */}
            <div>
              <h2 className="text-xl font-bold mb-3 border-r-4 border-red-600 pr-3">
                {lang === 'ar-SA' ? 'قصة العمل' : 'Overview'}
              </h2>
              <p className="text-gray-300 leading-relaxed text-base md:text-lg">
                {details?.overview || (lang === 'ar-SA' ? 'لا يوجد وصف متاح حالياً.' : 'No overview available.')}
              </p>
            </div>

            {/* طاقم التمثيل */}
            {details?.credits?.cast?.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4 border-r-4 border-red-600 pr-3">
                  {lang === 'ar-SA' ? 'طاقم التمثيل' : 'Cast'}
                </h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                  {details.credits.cast.slice(0, 6).map((actor) => (
                    <div key={actor.id} className="bg-gray-900 rounded-xl p-3 text-center border border-gray-800">
                      <img
                        src={actor.profile_path ? `${IMAGE_BASE_URL}${actor.profile_path}` : 'https://via.placeholder.com/100'}
                        alt={actor.name}
                        className="w-16 h-16 rounded-full object-cover mx-auto mb-2 border border-gray-700"
                      />
                      <p className="text-xs font-semibold text-white truncate">{actor.name}</p>
                      <p className="text-[10px] text-gray-400 truncate">{actor.character}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* قسم التريلر المخصص في الأسفل */}
            {trailer && (
              <div className="pt-6">
                <h2 className="text-xl font-bold mb-4 border-r-4 border-red-600 pr-3">
                  {lang === 'ar-SA' ? 'الإعلان الرسمي (Trailer)' : 'Official Trailer'}
                </h2>
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-gray-800 bg-black shadow-2xl">
                  <iframe
                    src={`https://www.youtube.com/embed/${trailer.key}`}
                    title="Official Trailer"
                    className="w-full h-full border-0"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
