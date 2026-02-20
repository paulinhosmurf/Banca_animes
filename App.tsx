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
import { ShieldAlert, Server, WifiOff } from 'lucide-react';

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
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Timer de segurança: Se o Supabase demorar mais de 5s, libera a tela
    const safetyTimer = setTimeout(() => {
        if (loading) {
            console.warn("Tempo limite de conexão excedido.");
            setConnectionError(true); // Mostra aviso discreto mas libera o app
            setLoading(false);
        }
    }, 5000);

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      checkAdmin(session?.user.id);
    }).catch(err => {
      console.error("Erro crítico ao conectar no Supabase:", err);
      setConnectionError(true);
      setLoading(false);
    }).finally(() => {
        clearTimeout(safetyTimer);
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      checkAdmin(session?.user.id);
    });

    return () => {
        subscription.unsubscribe();
        clearTimeout(safetyTimer);
    }
  }, []);

  const checkAdmin = async (userId?: string) => {
    if (!userId) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    try {
        const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
        
        setIsAdmin(data?.role === 'admin');
    } catch (err) {
        console.error("Erro ao verificar admin:", err);
    } finally {
        setLoading(false);
    }
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
          <h1 className="text-2xl font-bold text-white mb-2">Ambiente não configurado</h1>
          <p className="text-gray-400 mb-6 text-sm leading-relaxed">
            O site não consegue se conectar ao banco de dados porque as chaves de acesso não foram encontradas.
          </p>
          
          <div className="bg-black/50 rounded-lg p-5 text-left font-mono text-xs text-gray-300 border border-white/5 space-y-4 mb-6">
            <div>
              <p className="text-brand-purple font-bold mb-1 flex items-center gap-2">
                <Server size={12} /> Localhost (.env)
              </p>
              <div className="pl-4 opacity-70">
                VITE_SUPABASE_URL=...<br/>
                VITE_SUPABASE_ANON_KEY=...
              </div>
            </div>
            
            <div className="border-t border-white/10 pt-3">
              <p className="text-white font-bold mb-1 flex items-center gap-2">
                 ▲ Vercel / Deploy
              </p>
              <p className="opacity-70 mb-2">Vá em: <strong>Settings &gt; Environment Variables</strong></p>
              <div className="pl-4 opacity-70">
                Adicione as mesmas chaves do seu .env e faça um <strong>Redeploy</strong>.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-brand-purple gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-current"></div>
        <p className="text-gray-500 animate-pulse text-sm">Conectando ao servidor...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ session, isAdmin, refreshSession }}>
      <HashRouter>
        <ScrollToTop />
        <div className="min-h-screen bg-black text-gray-200 flex flex-col relative">
          
          {connectionError && (
              <div className="bg-red-900/30 text-red-200 text-xs text-center py-1 border-b border-red-500/20 flex items-center justify-center gap-2">
                  <WifiOff size={12} />
                  Modo Offline: Não foi possível conectar ao banco de dados. Verifique sua conexão ou chaves de API.
              </div>
          )}

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