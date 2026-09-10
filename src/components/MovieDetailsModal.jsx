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

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-center items-center p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl relative my-8 text-white">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 bg-black/60 text-white w-9 h-9 rounded-full flex items-center justify-center hover:bg-red-600 transition"
        >
          ✕
        </button>

        {loading ? (
          <div className="p-12 text-center text-gray-400">
            {lang === 'ar-SA' ? 'جاري تحميل التفاصيل...' : 'Loading details...'}
          </div>
        ) : (
          <div>
            <div className="relative aspect-video bg-black">
              {trailer ? (
                <iframe
                  src={`https://www.youtube.com/embed/${trailer.key}`}
                  title="Trailer"
                  className="w-full h-full border-0"
                  allowFullScreen
                ></iframe>
              ) : (
                <img
                  src={`${IMAGE_BASE_URL}${details?.backdrop_path || item.poster_path}`}
                  alt={item.title || item.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start gap-4">
                <h2 className="text-2xl font-bold">{details?.title || details?.name}</h2>
                <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                  ★ {details?.vote_average?.toFixed(1)}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {details?.genres?.map((g) => (
                  <span key={g.id} className="text-xs bg-gray-800 px-2.5 py-1 rounded-md text-gray-300">
                    {g.name}
                  </span>
                ))}
              </div>

              <p className="text-sm text-gray-300 leading-relaxed">
                {details?.overview || (lang === 'ar-SA' ? 'لا يوجد وصف متاح.' : 'No overview available.')}
              </p>

              {details?.credits?.cast?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-gray-400">
                    {lang === 'ar-SA' ? 'طاقم التمثيل:' : 'Cast:'}
                  </h3>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {details.credits.cast.slice(0, 6).map((actor) => (
                      <div key={actor.id} className="flex-shrink-0 text-center w-16">
                        <img
                          src={actor.profile_path ? `${IMAGE_BASE_URL}${actor.profile_path}` : 'https://via.placeholder.com/100'}
                          alt={actor.name}
                          className="w-12 h-12 rounded-full object-cover mx-auto mb-1 border border-gray-700"
                        />
                        <p className="text-[10px] text-gray-300 truncate">{actor.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
