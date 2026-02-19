import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, PlayCircle, Calendar, Tag } from 'lucide-react';
import { supabase } from '../services/supabase';
import { Anime, Episode } from '../types';
import { AuthContext } from '../App';
import { animeService } from '../services/animeService';

export const AnimeDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { session } = useContext(AuthContext);
  const [anime, setAnime] = useState<Anime | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchAnimeData(id);
  }, [id, session]);

  const fetchAnimeData = async (animeId: string) => {
    try {
      // 1. Fetch Anime & Episodes via Service
      const [animeData, epsData] = await Promise.all([
        animeService.getAnimeDetails(animeId),
        animeService.getEpisodes(animeId)
      ]);

      setAnime(animeData);
      setEpisodes(epsData);

      // 2. Favorites still use Supabase directly (Auth related)
      if (session && animeData) {
        const { data: favData } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('anime_id', animeData.id)
          .single();
        setIsFavorite(!!favData);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!session || !anime) return;
    
    // Auth logic stays in component for now as it couples with AuthContext
    if (isFavorite) {
      await supabase.from('favorites').delete().eq('user_id', session.user.id).eq('anime_id', anime.id);
      setIsFavorite(false);
    } else {
      await supabase.from('favorites').insert({ user_id: session.user.id, anime_id: anime.id });
      setIsFavorite(true);
    }
  };

  if (loading) return <div className="p-10 text-center">Carregando detalhes...</div>;
  if (!anime) return <div className="p-10 text-center">Anime não encontrado.</div>;

  return (
    <div className="animate-fade-in">
      {/* Backdrop */}
      <div className="absolute top-0 left-0 w-full h-[400px] overflow-hidden -z-10 opacity-30 mask-image-b">
        <img src={anime.banner_image || anime.cover_image} alt="Backdrop" className="w-full h-full object-cover blur-sm" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/80 to-black" />
      </div>

      <div className="grid md:grid-cols-[300px_1fr] gap-8 mt-8">
        {/* Left Column: Cover & Actions */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl overflow-hidden shadow-2xl shadow-brand-purple/20 border border-white/10 aspect-[2/3]">
            <img src={anime.cover_image} alt={anime.title} className="w-full h-full object-cover" />
          </div>
          
          <button 
            onClick={toggleFavorite}
            className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${isFavorite ? 'bg-red-500/10 text-red-400 border border-red-500/50' : 'bg-white/5 hover:bg-white/10 border border-white/10'}`}
          >
            <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
            {isFavorite ? 'Remover Favorito' : 'Adicionar Favorito'}
          </button>
        </div>

        {/* Right Column: Info & Episodes */}
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">{anime.title}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-6">
              <span className="flex items-center gap-1"><Tag size={14} className="text-brand-purple" /> {anime.categories?.name}</span>
              <span className="flex items-center gap-1"><Calendar size={14} className="text-brand-purple" /> {new Date(anime.created_at).getFullYear()}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-bold border ${anime.status === 'Lançamento' ? 'border-green-500/50 text-green-400' : 'border-gray-500/50 text-gray-400'}`}>
                {anime.status}
              </span>
            </div>
            <p className="text-gray-300 leading-relaxed text-lg">
              {anime.description}
            </p>
          </div>

          {/* Episode List */}
          <div className="mt-8">
            <h3 className="text-xl font-bold text-white mb-4 border-b border-white/10 pb-2">Episódios</h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {episodes.map(ep => (
                <Link 
                  key={ep.id} 
                  to={`/watch/${ep.id}`}
                  className="flex items-center gap-4 p-3 rounded-lg bg-brand-surface border border-white/5 hover:bg-brand-purple/10 hover:border-brand-purple/30 transition-all group"
                >
                  <div className="w-8 h-8 rounded-full bg-brand-purple/20 flex items-center justify-center text-brand-purple group-hover:bg-brand-purple group-hover:text-white transition-colors font-bold text-sm">
                    {ep.episode_number}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-200 group-hover:text-white">{ep.title || `Episódio ${ep.episode_number}`}</h4>
                  </div>
                  <PlayCircle className="text-gray-500 group-hover:text-brand-light" />
                </Link>
              ))}
              {episodes.length === 0 && (
                <div className="p-4 text-gray-500 italic">Nenhum episódio disponível ainda.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};