import React from 'react';
import { IMAGE_BASE_URL } from '../services/tmdb';

export default function MovieCard({ item, type }) {
  const title = item.title || item.name || 'بدون عنوان';
  const releaseDate = item.release_date || item.first_air_date || '';
  const year = releaseDate ? releaseDate.split('-')[0] : '';
  const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
  const poster = item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image';

  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300 flex flex-col cursor-pointer border border-gray-800">
      <div className="relative aspect-[2/3] bg-gray-800">
        <img
          src={poster}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md text-yellow-400 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1">
          ★ {rating}
        </div>
      </div>
      <div className="p-3 flex flex-col justify-between flex-1">
        <h3 className="text-white text-sm font-semibold line-clamp-1">{title}</h3>
        <div className="flex justify-between items-center text-xs text-gray-400 mt-2">
          <span>{year}</span>
          <span className="uppercase text-[10px] bg-gray-800 px-2 py-0.5 rounded text-gray-300">
            {type === 'tv' ? 'مسلسل' : 'فيلم'}
          </span>
        </div>
      </div>
    </div>
  );
}
