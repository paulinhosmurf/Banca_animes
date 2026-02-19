import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Play, TrendingUp, Clock, Sparkles } from 'lucide-react';
import { Anime, Episode } from '../types';
import { AnimeCard } from '../components/ui/AnimeCard';
import { animeService } from '../services/animeService';
import { AuthContext } from '../App';
import { supabase } from '../services/supabase';

export const Home: React.FC = () => {
  const { session } = useContext(AuthContext);
  const [featuredAnime, setFeaturedAnime] = useState<Anime | null>(null);
  const [recentEpisodes, setRecentEpisodes] = useState<Episode[]>([]);
  const [popularAnimes, setPopularAnimes] = useState<Anime[]>([]);
  const [favAnimeIds, setFavAnimeIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featured, recent, popular] = await Promise.all([
          animeService.getFeatured(),
          animeService.getRecentEpisodes(),
          animeService.getPopular()
        ]);

        setFeaturedAnime(featured);
        setRecentEpisodes(recent);
        setPopularAnimes(popular);

        // Fetch user favorites to highlight episodes
        if (session) {
           const { data: favs } = await supabase
             .from('favorites')
             .select('anime_id')
             .eq('user_id', session.user.id);
           
           if (favs) {
             setFavAnimeIds(new Set(favs.map(f => f.anime_id)));
           }
        }

      } catch (error) {
        console.error("Error fetching home data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session]);

  if (loading) return <div className="h-96 flex items-center justify-center text-brand-purple">Carregando animes...</div>;

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      {featuredAnime && (
        <section className="relative w-full h-[500px] rounded-3xl overflow-hidden shadow-2xl shadow-brand-purple/10 border border-white/5">
          <img 
            src={featuredAnime.banner_image || featuredAnime.cover_image} 
            alt={featuredAnime.title} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
          
          <div className="absolute bottom-0 left-0 p-8 md:p-12 max-w-2xl">
            <span className="px-3 py-1 bg-brand-purple/20 text-brand-light border border-brand-purple/30 rounded text-xs font-bold uppercase tracking-widest mb-4 inline-block">
              Destaque da Semana
            </span>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight drop-shadow-lg">
              {featuredAnime.title}
            </h1>
            <p className="text-gray-300 text-sm md:text-base mb-8 line-clamp-3 md:line-clamp-2 max-w-lg">
              {featuredAnime.description}
            </p>
            <div className="flex gap-4">
              <Link 
                to={`/anime/${featuredAnime.id}`} 
                className="flex items-center gap-2 bg-brand-purple hover:bg-brand-deep text-white px-8 py-3 rounded-xl font-bold transition-all hover:scale-105 shadow-lg shadow-brand-purple/30"
              >
                <Play fill="white" size={18} />
                Assistir Agora
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* New Episodes Grid */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
            <Clock className="text-brand-purple" /> Novos Episódios
          </h2>
          <Link to="/latest" className="text-sm text-gray-500 hover:text-brand-light">Ver todos</Link>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 gap-y-8">
          {recentEpisodes.length > 0 ? (
            recentEpisodes.map((ep) => {
              const isFavorite = favAnimeIds.has(ep.anime_id);
              
              return (
                <Link key={ep.id} to={`/watch/${ep.id}`} className="group relative">
                  {/* Container da miniatura com efeito condicional */}
                  <div className={`relative aspect-video rounded-lg mb-2 transition-all duration-300 ${isFavorite ? 'silver-chromatic scale-[1.02]' : 'overflow-hidden border border-white/5 group-hover:border-brand-purple/50'}`}>
                    
                    {isFavorite && (
                      <div className="absolute -top-3 -right-2 z-20 bg-gradient-to-r from-gray-200 to-white text-black text-[10px] font-bold px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] flex items-center gap-1">
                        <Sparkles size={10} className="text-yellow-600" /> NOVO
                      </div>
                    )}

                    <img 
                      src={ep.thumbnail_url || ep.animes?.cover_image} 
                      alt={ep.title} 
                      className={`w-full h-full object-cover transition-all duration-500 ${isFavorite ? 'rounded-lg' : 'opacity-80 group-hover:opacity-100 group-hover:scale-105'}`}
                    />
                    
                    <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${isFavorite ? 'opacity-0 group-hover:opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      <div className="bg-black/70 rounded-full p-2">
                        <Play size={20} className="text-white" fill="white" />
                      </div>
                    </div>
                    
                    <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-mono text-white backdrop-blur-sm border border-white/10">
                      EP {ep.episode_number}
                    </div>
                  </div>

                  <h4 className={`text-sm font-medium line-clamp-1 transition-colors ${isFavorite ? 'text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]' : 'text-gray-200 group-hover:text-brand-light'}`}>
                    {ep.animes?.title}
                  </h4>
                  <p className="text-xs text-gray-500 line-clamp-1">{ep.title || `Episódio ${ep.episode_number}`}</p>
                </Link>
              );
            })
          ) : (
             <div className="col-span-full text-center text-gray-600 py-10">Nenhum episódio recente encontrado.</div>
          )}
        </div>
      </section>

      {/* Popular Animes */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
            <TrendingUp className="text-brand-purple" /> Mais Populares
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {popularAnimes.map(anime => (
            <AnimeCard key={anime.id} anime={anime} />
          ))}
        </div>
      </section>
    </div>
  );
};