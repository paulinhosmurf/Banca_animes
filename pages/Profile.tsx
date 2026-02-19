import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import { supabase } from '../services/supabase';
import { User, Heart, Settings, Save, Loader2, Camera } from 'lucide-react';
import { AnimeCard } from '../components/ui/AnimeCard';
import { Anime } from '../types';

export const Profile: React.FC = () => {
  const { session, refreshSession } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState<'favorites' | 'settings'>('favorites');
  const [favorites, setFavorites] = useState<Anime[]>([]);
  const [loadingFavs, setLoadingFavs] = useState(true);
  
  // Edit Profile State
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    if (session) {
      // Init form
      setUsername(session.user.user_metadata.username || '');
      setAvatarUrl(session.user.user_metadata.avatar_url || '');
      fetchFavorites();
    }
  }, [session]);

  const fetchFavorites = async () => {
    if (!session) return;
    setLoadingFavs(true);
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          anime_id,
          animes (
            *,
            categories (name)
          )
        `)
        .eq('user_id', session.user.id);

      if (error) throw error;

      // Extract nested animes
      const favAnimes = data?.map((f: any) => f.animes).filter(Boolean) || [];
      setFavorites(favAnimes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFavs(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setSaving(true);
    setMsg(null);

    try {
      // 1. Update Supabase Auth Metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { username, avatar_url: avatarUrl }
      });
      if (authError) throw authError;

      // 2. Update Public Profiles table
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ username, avatar_url: avatarUrl })
        .eq('id', session.user.id);

      if (dbError) throw dbError;

      setMsg({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      refreshSession(); // Atualiza contexto global
    } catch (err: any) {
      console.error(err);
      setMsg({ type: 'error', text: 'Erro ao atualizar: ' + err.message });
    } finally {
      setSaving(false);
    }
  };

  if (!session) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Profile Header */}
      <div className="bg-brand-surface border border-white/5 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-brand-deep to-brand-purple opacity-20 -z-0" />
        
        <div className="relative z-10 w-32 h-32 rounded-full border-4 border-brand-surface bg-black overflow-hidden shadow-2xl">
          {session.user.user_metadata.avatar_url ? (
             <img src={session.user.user_metadata.avatar_url} alt={username} className="w-full h-full object-cover" />
          ) : (
             <div className="w-full h-full flex items-center justify-center bg-brand-purple/20 text-brand-purple">
                <User size={48} />
             </div>
          )}
        </div>

        <div className="text-center md:text-left relative z-10 flex-1">
          <h1 className="text-3xl font-bold text-white mb-1">{session.user.user_metadata.username || 'Usuário'}</h1>
          <p className="text-gray-400 text-sm mb-4">{session.user.email}</p>
          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            <button 
              onClick={() => setActiveTab('favorites')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${activeTab === 'favorites' ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/20' : 'bg-white/5 text-gray-400 hover:text-white'}`}
            >
              <Heart size={18} /> Favoritos
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${activeTab === 'settings' ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/20' : 'bg-white/5 text-gray-400 hover:text-white'}`}
            >
              <Settings size={18} /> Editar Perfil
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {activeTab === 'favorites' && (
           <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                 <Heart className="text-red-500" fill="currentColor" /> Meus Animes Favoritos
              </h2>
              
              {loadingFavs ? (
                <div className="text-center py-20 text-brand-purple animate-pulse">Carregando favoritos...</div>
              ) : favorites.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {favorites.map(anime => (
                    <AnimeCard key={anime.id} anime={anime} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 border border-white/5 rounded-xl border-dashed">
                  <Heart size={48} className="mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400 text-lg">Você ainda não tem favoritos.</p>
                  <p className="text-gray-600 text-sm">Navegue pelo site e clique no coração para salvar.</p>
                </div>
              )}
           </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto bg-brand-surface border border-white/5 rounded-xl p-8">
             <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Settings className="text-brand-purple" /> Configurações da Conta
             </h2>

             {msg && (
                <div className={`p-4 rounded-lg mb-6 text-sm ${msg.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {msg.text}
                </div>
             )}

             <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div>
                   <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">Nome de Usuário</label>
                   <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-black/50 border border-brand-border rounded-lg p-3 text-white focus:border-brand-purple outline-none transition-colors"
                      placeholder="Seu nome público"
                   />
                </div>

                <div>
                   <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">Avatar URL</label>
                   <div className="flex gap-4">
                     <div className="flex-1">
                        <input 
                            type="text" 
                            value={avatarUrl}
                            onChange={(e) => setAvatarUrl(e.target.value)}
                            className="w-full bg-black/50 border border-brand-border rounded-lg p-3 text-white focus:border-brand-purple outline-none transition-colors font-mono text-sm"
                            placeholder="https://..."
                        />
                     </div>
                     <div className="w-12 h-12 rounded bg-black border border-brand-border flex items-center justify-center shrink-0 overflow-hidden">
                        {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" /> : <Camera size={20} className="text-gray-600" />}
                     </div>
                   </div>
                   <p className="text-xs text-gray-500 mt-2">Cole o link de uma imagem (ex: Imgur, Discord CDN).</p>
                </div>

                <div className="pt-4 border-t border-white/5">
                   <button 
                      type="submit" 
                      disabled={saving}
                      className="bg-brand-purple hover:bg-brand-deep text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 transition-all hover:scale-105 shadow-lg shadow-brand-purple/20 disabled:opacity-50 disabled:scale-100"
                   >
                      {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                      Salvar Alterações
                   </button>
                </div>
             </form>
          </div>
        )}
      </div>
    </div>
  );
};