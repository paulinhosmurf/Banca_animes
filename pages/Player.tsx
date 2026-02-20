import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, List, AlertCircle } from 'lucide-react';
import { Episode } from '../types';
import { animeService } from '../services/animeService';

export const Player: React.FC = () => {
  const { episodeId } = useParams<{ episodeId: string }>();
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [nextEp, setNextEp] = useState<string | null>(null);
  const [prevEp, setPrevEp] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (episodeId) loadEpisode(episodeId);
  }, [episodeId]);

  const loadEpisode = async (id: string) => {
    try {
      setLoading(true);
      setEpisode(null); // Reset state to force re-render logic if needed
      
      const ep = await animeService.getEpisodeDetails(id);
      if (!ep) throw new Error("Episode not found");
      
      setEpisode(ep);

      if (ep.animes) {
        const { prev, next } = await animeService.getEpisodeNeighbors(ep.anime_id, ep.episode_number);
        setPrevEp(prev);
        setNextEp(next);
        
        animeService.incrementViews(ep.anime_id);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isMp4 = (url: string) => {
    const lower = url.toLowerCase();
    return lower.includes('.mp4') || 
           lower.includes('.mkv') || 
           lower.includes('mime=video/mp4') || 
           lower.includes('googlevideo.com');
  };

  // Função inteligente para corrigir links comuns e extrair SRC de iframes colados
  const getEmbedUrl = (url: string) => {
    if (!url) return '';

    // 1. Extração de Iframe HTML: Se o usuário colou o código <iframe ... src="...">
    if (url.includes('<iframe') || url.includes('src=')) {
        const srcMatch = url.match(/src=["'](.*?)["']/);
        if (srcMatch && srcMatch[1]) {
            return srcMatch[1]; // Retorna apenas a URL limpa
        }
    }

    // 2. Correção Dailymotion
    if (url.includes('dailymotion')) {
        // Se for link direto do site: dailymotion.com/video/ID
        if (url.includes('/video/')) {
            const videoId = url.split('/video/')[1].split('?')[0];
            return `https://geo.dailymotion.com/player.html?video=${videoId}`;
        }
        // Se for link curto: dai.ly/ID
        if (url.includes('dai.ly/')) {
            const videoId = url.split('dai.ly/')[1];
            return `https://geo.dailymotion.com/player.html?video=${videoId}`;
        }
        // Se já for o link do player (geo.dailymotion...), retorna ele mesmo
        return url;
    }

    // 3. Correção MixDrop: transforma /f/ em /e/
    if (url.includes('mixdrop')) {
        if (url.includes('/f/')) {
            return url.replace('/f/', '/e/');
        }
        return url;
    }

    // 4. Correção TokyoVideo: transforma /video/ em /embed/
    if (url.includes('tokyovideo.com') && url.includes('/video/')) {
        const parts = url.split('/video/');
        if (parts[1]) {
            const id = parts[1].split('/')[0]; // Pega o ID antes de qualquer query string
            return `https://www.tokyovideo.com/embed/${id}`;
        }
    }

    // 5. Correção YouTube
    if (url.includes('youtube.com') && url.includes('watch?v=')) {
        const videoId = url.split('v=')[1]?.split('&')[0];
        if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('youtu.be/')) {
        const videoId = url.split('youtu.be/')[1]?.split('?')[0];
        if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }

    return url;
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 text-brand-purple">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-current"></div>
        <p className="text-gray-400 animate-pulse">Carregando player e buscando fontes...</p>
      </div>
    );
  }

  if (!episode) return <div className="h-screen flex items-center justify-center">Episódio não encontrado.</div>;

  const finalVideoUrl = getEmbedUrl(episode.video_url);

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg md:text-xl text-gray-400 font-medium">{episode.animes?.title}</h2>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Episódio {episode.episode_number}: {episode.title || `Episódio ${episode.episode_number}`}</h1>
        </div>
        <Link to={`/anime/${episode.anime_id}`} className="bg-brand-surface p-2 rounded-full hover:bg-brand-purple/20 transition-colors">
            <List className="text-gray-300" />
        </Link>
      </div>

      {/* Player Container */}
      <div className="w-full aspect-video bg-black border border-brand-border rounded-xl overflow-hidden shadow-[0_0_50px_rgba(76,29,149,0.15)] relative group">
        {finalVideoUrl ? (
          isMp4(finalVideoUrl) ? (
            <video 
              controls 
              autoPlay 
              className="absolute inset-0 w-full h-full"
              poster={episode.thumbnail_url || episode.animes?.banner_image}
            >
              <source src={finalVideoUrl} type="video/mp4" />
              Seu navegador não suporta a tag de vídeo.
            </video>
          ) : (
            <iframe 
                key={finalVideoUrl}
                src={finalVideoUrl} 
                title={episode.title} 
                className="absolute inset-0 w-full h-full" 
                frameBorder="0"
                allowFullScreen 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="origin"
                // Sandbox removido propositalmente para suportar MixDrop e players externos que exigem scripts
            />
          )
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-brand-surface">
            <AlertCircle size={48} className="mb-4 text-red-400" />
            <p>Vídeo indisponível no momento.</p>
            <p className="text-sm mt-2">Tente novamente mais tarde.</p>
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between py-4 border-t border-white/5">
        {prevEp ? (
            <Link to={`/watch/${prevEp}`} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/5">
                <ChevronLeft /> Anterior
            </Link>
        ) : <div />}

        {nextEp ? (
            <Link to={`/watch/${nextEp}`} className="flex items-center gap-2 bg-brand-purple hover:bg-brand-deep text-white px-6 py-2 rounded-lg transition-all shadow-lg shadow-brand-purple/20">
                Próximo <ChevronRight />
            </Link>
        ) : (
            <span className="text-gray-600 cursor-not-allowed px-4">Último Episódio</span>
        )}
      </div>
    </div>
  );
};
