import { supabase } from './supabase';
import { Anime, Episode } from '../types';

// URL da API Sugoi (Docker Local)
const SUGOI_API_URL = "http://localhost:3000";

// Placeholder para identificar quando devemos buscar automaticamente
const AUTO_API_PLACEHOLDER = "https://auto-sugoi-api";

export interface IAnimeService {
  getFeatured(): Promise<Anime | null>;
  getRecentEpisodes(): Promise<Episode[]>;
  getPopular(): Promise<Anime[]>;
  getAnimeDetails(id: string): Promise<Anime | null>;
  getEpisodes(animeId: string): Promise<Episode[]>;
  getEpisodeDetails(episodeId: string): Promise<Episode | null>;
  getEpisodeNeighbors(animeId: string, currentNumber: number): Promise<{ prev: string | null; next: string | null }>;
  incrementViews(animeId: string): Promise<void>;
}

export const animeService: IAnimeService = {
  
  async getFeatured() {
    const { data } = await supabase
      .from('animes')
      .select('*, categories(name)')
      .order('views_count', { ascending: false })
      .limit(1)
      .single();
    return data;
  },

  async getRecentEpisodes() {
    const { data } = await supabase
      .from('episodes')
      .select('*, animes(id, title, cover_image, slug)')
      .order('created_at', { ascending: false })
      .limit(10);
    return data || [];
  },

  async getPopular() {
    const { data } = await supabase
      .from('animes')
      .select('*, categories(name)')
      .order('views_count', { ascending: false })
      .limit(10);
    return data || [];
  },

  async getAnimeDetails(id: string) {
    const { data, error } = await supabase
      .from('animes')
      .select('*, categories(name)')
      .eq('id', id)
      .single();
    
    if (error) return null;
    return data;
  },

  async getEpisodes(animeId: string) {
    const { data } = await supabase
      .from('episodes')
      .select('*')
      .eq('anime_id', animeId)
      .order('episode_number', { ascending: true });
    return data || [];
  },

  async getEpisodeDetails(id: string) {
    // 1. Busca os metadados no Supabase
    const { data, error } = await supabase
      .from('episodes')
      .select('*, animes(*)')
      .eq('id', id)
      .single();
    
    if (error || !data) return null;

    // 2. Lógica de Decisão do Player
    // Se o link NÃO FOR o placeholder e NÃO estiver vazio, respeitamos o link manual (Vimeo, TokyoVideo, etc)
    const isManualLink = data.video_url && data.video_url !== AUTO_API_PLACEHOLDER && data.video_url.trim() !== '';

    if (isManualLink) {
        console.log("[Player] Usando link manual cadastrado:", data.video_url);
        return data;
    }

    // 3. Se for placeholder, tenta buscar na SugoiAPI
    try {
      if (data.animes?.slug) {
        const slug = data.animes.slug;
        const episodeNum = data.episode_number;
        const season = 1; 

        console.log("[Player] Buscando na SugoiAPI...");
        const response = await fetch(`${SUGOI_API_URL}/episode/${slug}/${season}/${episodeNum}`);
        
        if (response.ok) {
          const json = await response.json();
          
          if (!json.error && json.data && Array.isArray(json.data)) {
            const provider = json.data.find((p: any) => p.episodes && p.episodes.length > 0);
            
            if (provider && provider.episodes[0]?.episode) {
              console.log(`[SugoiAPI] Link encontrado via ${provider.name}`);
              data.video_url = provider.episodes[0].episode;
            }
          }
        }
      }
    } catch (apiError) {
      console.warn("[SugoiAPI] Falha ao conectar. Verifique se o Docker está rodando.", apiError);
    }

    return data;
  },

  async getEpisodeNeighbors(animeId: string, currentNumber: number) {
    const { data: siblings } = await supabase
      .from('episodes')
      .select('id, episode_number')
      .eq('anime_id', animeId)
      .in('episode_number', [currentNumber - 1, currentNumber + 1]);

    let next = null;
    let prev = null;

    if (siblings) {
      const nextEp = siblings.find(s => s.episode_number === currentNumber + 1);
      const prevEp = siblings.find(s => s.episode_number === currentNumber - 1);
      if (nextEp) next = nextEp.id;
      if (prevEp) prev = prevEp.id;
    }

    return { prev, next };
  },

  async incrementViews(animeId: string) {
    // Placeholder
  }
};