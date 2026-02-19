export interface Profile {
  id: string;
  username: string;
  avatar_url: string;
  role: 'user' | 'admin';
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Anime {
  id: string;
  title: string;
  slug: string;
  description: string;
  cover_image: string;
  banner_image: string;
  category_id: number;
  status: 'Lançamento' | 'Finalizado' | 'Em Breve';
  views_count: number;
  created_at: string;
  categories?: Category; // Joined data
}

export interface Episode {
  id: string;
  anime_id: string;
  episode_number: number;
  title: string;
  video_url: string;
  thumbnail_url: string;
  created_at: string;
  animes?: Anime; // Joined data
}

export interface Favorite {
  id: string;
  user_id: string;
  anime_id: string;
}
