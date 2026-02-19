import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { AnimeDetails } from './pages/AnimeDetails';
import { Player } from './pages/Player';
import { Admin } from './pages/Admin';
import { AuthPage } from './pages/Auth';
import { Profile } from './pages/Profile';
import { supabase, isSupabaseConfigured } from './services/supabase';
import { Session } from '@supabase/supabase-js';
import { ShieldAlert } from 'lucide-react';

// Auth Context to share session state
export const AuthContext = React.createContext<{ session: Session | null; isAdmin: boolean; refreshSession: () => void }>({ session: null, isAdmin: false, refreshSession: () => {} });

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      checkAdmin(session?.user.id);
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      checkAdmin(session?.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdmin = async (userId?: string) => {
    if (!userId) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    
    setIsAdmin(data?.role === 'admin');
    setLoading(false);
  };

  const refreshSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-black text-gray-200 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 max-w-lg w-full shadow-2xl shadow-brand-purple/10">
          <div className="w-16 h-16 bg-brand-purple/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="text-brand-purple" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Configuração Necessária</h1>
          <p className="text-gray-400 mb-6">
            Não foi possível conectar ao Supabase. Por favor, configure as variáveis de ambiente com suas credenciais.
          </p>
          
          <div className="bg-black/50 rounded-lg p-4 text-left font-mono text-xs text-gray-300 border border-white/5 space-y-2 mb-6">
            <div>
              <span className="text-brand-purple">VITE_SUPABASE_URL</span>=https://seu-projeto.supabase.co
            </div>
            <div>
              <span className="text-brand-purple">VITE_SUPABASE_ANON_KEY</span>=sua-chave-anonima
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Adicione estas chaves ao seu arquivo .env ou às configurações do seu ambiente de deploy.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-brand-purple">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-current"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ session, isAdmin, refreshSession }}>
      <HashRouter>
        <ScrollToTop />
        <div className="min-h-screen bg-black text-gray-200 flex flex-col">
          <Navbar />
          <main className="flex-grow pt-20 px-4 md:px-8 pb-12 max-w-7xl mx-auto w-full">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={!session ? <AuthPage /> : <Navigate to="/" />} />
              <Route path="/profile" element={session ? <Profile /> : <Navigate to="/auth" />} />
              <Route path="/anime/:id" element={<AnimeDetails />} />
              <Route path="/watch/:episodeId" element={session ? <Player /> : <Navigate to="/auth" />} />
              <Route path="/admin" element={isAdmin ? <Admin /> : <Navigate to="/" />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
          
          <footer className="border-t border-brand-border py-8 text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} Banca dos Animes. Todos os direitos reservados.</p>
          </footer>
        </div>
      </HashRouter>
    </AuthContext.Provider>
  );
};

export default App;