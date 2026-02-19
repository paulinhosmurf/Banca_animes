import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Category, Anime, Episode } from '../types';
import { Plus, Video, Film, Save, AlertCircle, Link as LinkIcon, Edit, Trash2, X, List as ListIcon, Loader2 } from 'lucide-react';

export const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'anime' | 'episode'>('anime');
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  
  // Data State
  const [categories, setCategories] = useState<Category[]>([]);
  const [animesList, setAnimesList] = useState<Anime[]>([]); 
  const [episodesList, setEpisodesList] = useState<Episode[]>([]); 
  
  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Forms State
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Anime Form
  const [animeForm, setAnimeForm] = useState({
    title: '', slug: '', description: '', cover_image: '', banner_image: '', category_id: '', status: 'Lançamento'
  });

  // Episode Form
  const [epForm, setEpForm] = useState({
    anime_id: '', episode_number: '', title: '', video_url: '', thumbnail_url: ''
  });

  // Filter State for Episode List
  const [selectedAnimeFilter, setSelectedAnimeFilter] = useState<string>('');

  useEffect(() => {
    fetchHelpers();
    if (activeTab === 'anime') fetchAnimes();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'episode' && selectedAnimeFilter) {
      fetchEpisodes(selectedAnimeFilter);
    } else {
        setEpisodesList([]);
    }
  }, [selectedAnimeFilter, activeTab]);

  const fetchHelpers = async () => {
    const { data: cats } = await supabase.from('categories').select('*');
    if (cats) setCategories(cats);
  };

  const fetchAnimes = async () => {
    const { data } = await supabase.from('animes').select('*, categories(name)').order('created_at', { ascending: false });
    if (data) setAnimesList(data);
  };

  const fetchEpisodes = async (animeId: string) => {
    const { data } = await supabase
      .from('episodes')
      .select('*')
      .eq('anime_id', animeId)
      .order('episode_number', { ascending: false });
    if (data) setEpisodesList(data);
  };

  // --- ANIME ACTIONS ---

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    if (!editingId || animeForm.slug === '') {
        const newSlug = newTitle.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
            .replace(/[^a-z0-9\s-]/g, "") 
            .trim().replace(/\s+/g, '-');
        setAnimeForm(prev => ({ ...prev, title: newTitle, slug: newSlug }));
    } else {
        setAnimeForm(prev => ({ ...prev, title: newTitle }));
    }
  };

  const handleSaveAnime = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg(null);

    try {
      const payload = {
        title: animeForm.title,
        slug: animeForm.slug,
        description: animeForm.description,
        cover_image: animeForm.cover_image,
        banner_image: animeForm.banner_image,
        category_id: parseInt(animeForm.category_id),
        status: animeForm.status,
      };
      
      if (isNaN(payload.category_id)) throw new Error("Selecione uma categoria válida.");

      let res;
      if (editingId) {
        res = await supabase.from('animes').update(payload).eq('id', editingId).select();
      } else {
        res = await supabase.from('animes').insert(payload).select();
      }

      if (res.error) throw res.error;
      
      setStatusMsg({ type: 'success', text: editingId ? 'Anime atualizado com sucesso!' : 'Anime criado com sucesso!' });
      resetAnimeForm();
      fetchAnimes();
      setViewMode('list');
    } catch (err: any) {
      console.error("Erro ao salvar anime:", err);
      setStatusMsg({ type: 'error', text: err.message || 'Erro ao salvar anime.' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditAnime = (anime: Anime) => {
    setAnimeForm({
      title: anime.title,
      slug: anime.slug,
      description: anime.description || '',
      cover_image: anime.cover_image || '',
      banner_image: anime.banner_image || '',
      category_id: anime.category_id.toString(),
      status: anime.status
    });
    setEditingId(anime.id);
    setViewMode('form');
    setStatusMsg(null);
  };

  const handleDeleteAnime = async (id: string) => {
    if (!window.confirm("ATENÇÃO: Isso apagará o anime e TODOS os seus episódios permanentemente. Deseja continuar?")) return;
    
    try {
      // Tenta excluir. O .select() é opcional no delete se não precisarmos dos dados de volta,
      // mas ajuda a ver se o RLS permitiu.
      const { error, count } = await supabase
        .from('animes')
        .delete({ count: 'exact' }) // Pede a contagem de linhas afetadas
        .eq('id', id);
      
      if (error) {
        console.error("Supabase Error:", error);
        // Códigos específicos do Postgres
        if (error.code === '23503') {
           throw new Error("Erro de dependência: Execute o script SQL para habilitar DELETE CASCADE.");
        }
        throw error;
      }

      // Se não deu erro, mas count é 0 ou null, o RLS bloqueou silenciosamente
      if (count === 0) {
        throw new Error("O item não foi excluído. Verifique se você é Admin no banco de dados.");
      }
      
      setAnimesList(prev => prev.filter(a => a.id !== id));
      setStatusMsg({ type: 'success', text: 'Anime excluído com sucesso.' });
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ type: 'error', text: 'Erro ao excluir: ' + err.message });
      alert('Erro ao excluir: ' + err.message);
    }
  };

  const resetAnimeForm = () => {
    setAnimeForm({ title: '', slug: '', description: '', cover_image: '', banner_image: '', category_id: '', status: 'Lançamento' });
    setEditingId(null);
  };

  // --- EPISODE ACTIONS ---

  const handleSaveEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg(null);

    try {
      const finalVideoUrl = epForm.video_url.trim() === '' ? 'https://auto-sugoi-api' : epForm.video_url;

      const payload = {
        anime_id: epForm.anime_id,
        episode_number: parseInt(epForm.episode_number),
        title: epForm.title,
        video_url: finalVideoUrl,
        thumbnail_url: epForm.thumbnail_url
      };

      let res;
      if (editingId) {
         res = await supabase.from('episodes').update(payload).eq('id', editingId).select();
      } else {
         res = await supabase.from('episodes').insert(payload).select();
      }

      if (res.error) throw res.error;
      
      setStatusMsg({ type: 'success', text: editingId ? 'Episódio atualizado!' : 'Episódio criado!' });

      if (selectedAnimeFilter === epForm.anime_id) {
          fetchEpisodes(epForm.anime_id);
      }
      
      resetEpForm();
      setViewMode('list');
      setSelectedAnimeFilter(payload.anime_id);

    } catch (err: any) {
      console.error("Erro ao salvar episódio:", err);
      setStatusMsg({ type: 'error', text: err.message || 'Erro ao salvar episódio.' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditEpisode = (ep: Episode) => {
    setEpForm({
      anime_id: ep.anime_id,
      episode_number: ep.episode_number.toString(),
      title: ep.title || '',
      video_url: ep.video_url === 'https://auto-sugoi-api' ? '' : ep.video_url,
      thumbnail_url: ep.thumbnail_url || ''
    });
    setEditingId(ep.id);
    setViewMode('form');
    setStatusMsg(null);
  };

  const handleDeleteEpisode = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este episódio?")) return;
    try {
      const { error, count } = await supabase
        .from('episodes')
        .delete({ count: 'exact' })
        .eq('id', id);
      
      if (error) throw error;
      
      if (count === 0) {
        throw new Error("O item não foi excluído. Verifique permissões de Admin.");
      }

      setEpisodesList(prev => prev.filter(e => e.id !== id));
      setStatusMsg({ type: 'success', text: 'Episódio excluído com sucesso.' });
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ type: 'error', text: 'Erro ao excluir: ' + err.message });
      alert('Erro ao excluir: ' + err.message);
    }
  };

  const resetEpForm = () => {
    setEpForm({ anime_id: '', episode_number: '', title: '', video_url: '', thumbnail_url: '' });
    setEditingId(null);
  };

  // --- UI COMPONENTS ---

  const Input = ({ label, ...props }: any) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-400 uppercase font-bold tracking-wide">{label}</label>
      <input 
        className="bg-black/40 border border-brand-border rounded p-2 text-white focus:border-brand-purple outline-none w-full disabled:opacity-50" 
        {...props} 
      />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Painel Administrativo</h1>

      {/* Main Tabs */}
      <div className="flex gap-4 mb-6 border-b border-white/10">
        <button 
          onClick={() => { setActiveTab('anime'); setViewMode('list'); setStatusMsg(null); }}
          className={`pb-3 px-4 font-medium flex items-center gap-2 transition-colors ${activeTab === 'anime' ? 'text-brand-purple border-b-2 border-brand-purple' : 'text-gray-500 hover:text-white'}`}
        >
          <Film size={18} /> Gerenciar Animes
        </button>
        <button 
          onClick={() => { setActiveTab('episode'); setViewMode('list'); setStatusMsg(null); }}
          className={`pb-3 px-4 font-medium flex items-center gap-2 transition-colors ${activeTab === 'episode' ? 'text-brand-purple border-b-2 border-brand-purple' : 'text-gray-500 hover:text-white'}`}
        >
          <Video size={18} /> Gerenciar Episódios
        </button>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded mb-6 flex justify-between items-center ${statusMsg.type === 'error' ? 'bg-red-900/20 text-red-300 border border-red-500/30' : 'bg-green-900/20 text-green-300 border border-green-500/30'}`}>
          <span>{statusMsg.text}</span>
          <button onClick={() => setStatusMsg(null)}><X size={16} /></button>
        </div>
      )}

      {/* --- ANIME TAB CONTENT --- */}
      {activeTab === 'anime' && (
        <>
          {/* Sub Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">
              {viewMode === 'list' ? 'Lista de Animes' : (editingId ? 'Editar Anime' : 'Novo Anime')}
            </h2>
            {viewMode === 'list' ? (
              <button 
                onClick={() => { resetAnimeForm(); setViewMode('form'); }} 
                className="bg-brand-purple hover:bg-brand-deep text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors"
              >
                <Plus size={16} /> Adicionar Novo
              </button>
            ) : (
              <button 
                onClick={() => { setViewMode('list'); setStatusMsg(null); }} 
                className="bg-white/5 hover:bg-white/10 text-gray-300 px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors"
              >
                <ListIcon size={16} /> Voltar para Lista
              </button>
            )}
          </div>

          {viewMode === 'list' ? (
            <div className="bg-brand-surface rounded-xl border border-white/5 overflow-hidden">
               <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-400">
                  <thead className="bg-white/5 text-gray-200 uppercase font-bold text-xs">
                    <tr>
                      <th className="p-4">Capa</th>
                      <th className="p-4">Título</th>
                      <th className="p-4">Categoria</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {animesList.map(anime => (
                      <tr key={anime.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 w-16">
                          <img src={anime.cover_image} alt="" className="w-10 h-14 object-cover rounded bg-black" />
                        </td>
                        <td className="p-4 font-medium text-white">{anime.title}</td>
                        <td className="p-4">{anime.categories?.name}</td>
                        <td className="p-4">
                           <span className={`px-2 py-1 rounded text-xs border ${anime.status === 'Lançamento' ? 'border-green-500/30 text-green-400' : 'border-gray-600 text-gray-500'}`}>
                             {anime.status}
                           </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button onClick={() => handleEditAnime(anime)} className="p-2 hover:bg-blue-500/20 hover:text-blue-400 rounded transition-colors" title="Editar">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDeleteAnime(anime.id)} className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded transition-colors" title="Excluir">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {animesList.length === 0 && <div className="p-8 text-center text-gray-500">Nenhum anime cadastrado.</div>}
               </div>
            </div>
          ) : (
            <form onSubmit={handleSaveAnime} className="space-y-4 bg-brand-surface p-6 rounded-xl border border-white/5 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Título" value={animeForm.title} onChange={handleTitleChange} required />
                <Input label="Slug (URL)" value={animeForm.slug} onChange={(e: any) => setAnimeForm({...animeForm, slug: e.target.value})} className="bg-black/60 border border-brand-border rounded p-2 text-gray-400 font-mono w-full" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="flex flex-col gap-1">
                   <label className="text-xs text-gray-400 uppercase font-bold tracking-wide">Categoria</label>
                   <select 
                     className="bg-black/40 border border-brand-border rounded p-2 text-white focus:border-brand-purple outline-none w-full"
                     value={animeForm.category_id}
                     onChange={(e) => setAnimeForm({...animeForm, category_id: e.target.value})}
                     required
                   >
                     <option value="">Selecione...</option>
                     {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                </div>
                <div className="flex flex-col gap-1">
                   <label className="text-xs text-gray-400 uppercase font-bold tracking-wide">Status</label>
                   <select 
                     className="bg-black/40 border border-brand-border rounded p-2 text-white focus:border-brand-purple outline-none w-full"
                     value={animeForm.status}
                     onChange={(e) => setAnimeForm({...animeForm, status: e.target.value})}
                     required
                   >
                     <option value="Lançamento">Lançamento</option>
                     <option value="Finalizado">Finalizado</option>
                     <option value="Em Breve">Em Breve</option>
                   </select>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 uppercase font-bold tracking-wide">Sinopse</label>
                <textarea 
                   className="bg-black/40 border border-brand-border rounded p-2 text-white focus:border-brand-purple outline-none h-24 w-full"
                   value={animeForm.description}
                   onChange={(e) => setAnimeForm({...animeForm, description: e.target.value})}
                   required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="URL da Capa (Vertical)" value={animeForm.cover_image} onChange={(e: any) => setAnimeForm({...animeForm, cover_image: e.target.value})} required />
                  <Input label="URL do Banner (Horizontal)" value={animeForm.banner_image} onChange={(e: any) => setAnimeForm({...animeForm, banner_image: e.target.value})} />
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="submit" disabled={loading} className="bg-brand-purple hover:bg-brand-deep text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-all hover:scale-105 shadow-lg shadow-brand-purple/20">
                   {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 
                   {loading ? 'Salvando...' : (editingId ? 'Atualizar Anime' : 'Criar Anime')}
                </button>
                <button type="button" onClick={() => setViewMode('list')} className="bg-transparent border border-white/10 hover:bg-white/5 text-gray-400 px-4 py-2 rounded-lg">
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </>
      )}

      {/* --- EPISODE TAB CONTENT --- */}
      {activeTab === 'episode' && (
        <>
           {/* Sub Header */}
           <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">
              {viewMode === 'list' ? 'Lista de Episódios' : (editingId ? 'Editar Episódio' : 'Novo Episódio')}
            </h2>
            {viewMode === 'list' ? (
              <button 
                onClick={() => { resetEpForm(); setViewMode('form'); if(selectedAnimeFilter) setEpForm(prev => ({...prev, anime_id: selectedAnimeFilter})) }} 
                className="bg-brand-purple hover:bg-brand-deep text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors"
              >
                <Plus size={16} /> Adicionar Novo
              </button>
            ) : (
              <button 
                onClick={() => { setViewMode('list'); setStatusMsg(null); }} 
                className="bg-white/5 hover:bg-white/10 text-gray-300 px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors"
              >
                <ListIcon size={16} /> Voltar para Lista
              </button>
            )}
          </div>

          {viewMode === 'list' ? (
            <div className="space-y-6">
                {/* Filter */}
                <div className="bg-brand-surface p-4 rounded-xl border border-white/5 flex items-center gap-4">
                    <label className="text-gray-400 font-bold whitespace-nowrap">Selecione o Anime:</label>
                    <select 
                        className="bg-black/40 border border-brand-border rounded p-2 text-white focus:border-brand-purple outline-none w-full max-w-md"
                        value={selectedAnimeFilter}
                        onChange={(e) => setSelectedAnimeFilter(e.target.value)}
                    >
                        <option value="">-- Escolha um anime para gerenciar --</option>
                        {animesList.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                    </select>
                </div>

                {selectedAnimeFilter ? (
                    <div className="bg-brand-surface rounded-xl border border-white/5 overflow-hidden">
                        <table className="w-full text-left text-sm text-gray-400">
                        <thead className="bg-white/5 text-gray-200 uppercase font-bold text-xs">
                            <tr>
                                <th className="p-4 w-20">#</th>
                                <th className="p-4">Título do Episódio</th>
                                <th className="p-4">Vídeo</th>
                                <th className="p-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {episodesList.map(ep => (
                            <tr key={ep.id} className="hover:bg-white/5 transition-colors">
                                <td className="p-4 font-bold text-white">{ep.episode_number}</td>
                                <td className="p-4">{ep.title || '-'}</td>
                                <td className="p-4 max-w-xs truncate text-xs font-mono opacity-70">
                                    {ep.video_url}
                                </td>
                                <td className="p-4 text-right space-x-2">
                                <button onClick={() => handleEditEpisode(ep)} className="p-2 hover:bg-blue-500/20 hover:text-blue-400 rounded transition-colors" title="Editar">
                                    <Edit size={16} />
                                </button>
                                <button onClick={() => handleDeleteEpisode(ep.id)} className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded transition-colors" title="Excluir">
                                    <Trash2 size={16} />
                                </button>
                                </td>
                            </tr>
                            ))}
                            {episodesList.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center">Nenhum episódio encontrado para este anime.</td>
                                </tr>
                            )}
                        </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500 bg-brand-surface border border-white/5 rounded-xl border-dashed">
                        Selecione um anime acima para ver os episódios.
                    </div>
                )}
            </div>
          ) : (
            <form onSubmit={handleSaveEpisode} className="space-y-4 bg-brand-surface p-6 rounded-xl border border-white/5 animate-fade-in">
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400 uppercase font-bold tracking-wide">Anime</label>
                    <select 
                    className="bg-black/40 border border-brand-border rounded p-2 text-white focus:border-brand-purple outline-none w-full"
                    value={epForm.anime_id}
                    onChange={(e) => setEpForm({...epForm, anime_id: e.target.value})}
                    required
                    disabled={!!editingId} // Disable changing anime when editing to prevent conflicts
                    >
                    <option value="">Selecione...</option>
                    {animesList.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                    </select>
                </div>

                <div className="grid grid-cols-[100px_1fr] gap-4">
                    <Input label="Número" type="number" value={epForm.episode_number} onChange={(e: any) => setEpForm({...epForm, episode_number: e.target.value})} required />
                    <Input label="Título (Opcional)" value={epForm.title} onChange={(e: any) => setEpForm({...epForm, title: e.target.value})} />
                </div>
                
                <div className="bg-brand-purple/10 border border-brand-purple/30 p-4 rounded-lg mb-2 flex gap-3">
                    <AlertCircle size={20} className="text-brand-purple mt-0.5 shrink-0" />
                    <div className="space-y-2 text-xs text-gray-300">
                        <p>
                        <span className="font-bold text-white">Opção 1: Automático (SugoiAPI)</span><br/>
                        Deixe o campo URL vazio.
                        </p>
                        <p>
                        <span className="font-bold text-white">Opção 2: Link Externo / Embed</span><br/>
                        Cole o link (MixDrop, Dailymotion, MP4) ou o código HTML do Embed.
                        </p>
                    </div>
                </div>
                
                <div className="relative">
                    <Input 
                    label="URL do Vídeo / Código Embed" 
                    value={epForm.video_url} 
                    onChange={(e: any) => setEpForm({...epForm, video_url: e.target.value})} 
                    placeholder="Ex: https://... ou <iframe src=..." 
                    />
                    <LinkIcon size={14} className="absolute right-3 top-8 text-gray-500" />
                </div>
                
                <Input label="Thumbnail URL (Opcional)" value={epForm.thumbnail_url} onChange={(e: any) => setEpForm({...epForm, thumbnail_url: e.target.value})} />
                
                <div className="pt-4 flex gap-3">
                    <button type="submit" disabled={loading} className="bg-brand-purple hover:bg-brand-deep text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-all hover:scale-105 shadow-lg shadow-brand-purple/20">
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    {loading ? 'Salvando...' : (editingId ? 'Atualizar Episódio' : 'Adicionar Episódio')}
                    </button>
                    <button type="button" onClick={() => setViewMode('list')} className="bg-transparent border border-white/10 hover:bg-white/5 text-gray-400 px-4 py-2 rounded-lg">
                    Cancelar
                    </button>
                </div>
            </form>
          )}
        </>
      )}
    </div>
  );
};