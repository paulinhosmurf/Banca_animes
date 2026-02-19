import React from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import { Anime } from '../../types';

interface AnimeCardProps {
  anime: Anime;
}

export const AnimeCard: React.FC<AnimeCardProps> = ({ anime }) => {
  return (
    <Link to={`/anime/${anime.id}`} className="group relative block w-full">
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-brand-surface border border-white/5 transition-all duration-300 group-hover:border-brand-purple/50 group-hover:shadow-[0_0_20px_rgba(109,40,217,0.3)]">
        <img 
          src={anime.cover_image} 
          alt={anime.title} 
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
          <div className="w-12 h-12 rounded-full bg-brand-purple flex items-center justify-center shadow-lg scale-50 group-hover:scale-100 transition-transform duration-300 delay-75">
            <Play fill="white" className="text-white ml-1" size={20} />
          </div>
        </div>

        {/* Status Badge */}
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur text-[10px] font-bold uppercase tracking-wider text-white border border-white/10">
          {anime.status}
        </div>
      </div>

      <div className="mt-3">
        <h3 className="font-semibold text-white group-hover:text-brand-light truncate transition-colors">{anime.title}</h3>
        <p className="text-xs text-gray-500 mt-1">{anime.categories?.name || 'Anime'}</p>
      </div>
    </Link>
  );
};