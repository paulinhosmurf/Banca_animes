import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, LogOut, Shield } from 'lucide-react';
import { AuthContext } from '../App';
import { supabase } from '../services/supabase';

export const Navbar: React.FC = () => {
  const { session, isAdmin } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/5 h-16 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-full flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-purple to-brand-deep flex items-center justify-center shadow-lg shadow-brand-purple/20 group-hover:shadow-brand-purple/40 transition-all">
            <span className="text-white font-bold text-lg">B</span>
          </div>
          <span className="text-white font-bold text-xl tracking-tight hidden sm:block">
            Banca<span className="text-brand-light">Animes</span>
          </span>
        </Link>

        {/* Search & Actions */}
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center bg-brand-surface border border-brand-border rounded-full px-3 py-1.5 focus-within:border-brand-purple transition-colors">
            <Search size={16} className="text-gray-500 mr-2" />
            <input 
              type="text" 
              placeholder="Buscar animes..." 
              className="bg-transparent border-none outline-none text-sm text-white placeholder-gray-600 w-48"
            />
          </div>

          <div className="flex items-center gap-4">
            {isAdmin && (
              <Link to="/admin" className="text-gray-400 hover:text-brand-light transition-colors" title="Admin Dashboard">
                <Shield size={20} />
              </Link>
            )}

            {session ? (
              <div className="flex items-center gap-4">
                <Link to="/profile" className="flex items-center gap-2 group" title="Meu Perfil">
                    <div className="w-8 h-8 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center overflow-hidden group-hover:border-brand-purple transition-colors">
                    {session.user.user_metadata.avatar_url ? (
                        <img src={session.user.user_metadata.avatar_url} alt="User" className="w-full h-full object-cover" />
                    ) : (
                        <User size={16} className="text-brand-purple" />
                    )}
                    </div>
                </Link>
                <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 transition-colors" title="Sair">
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <Link 
                to="/auth" 
                className="bg-brand-purple hover:bg-brand-deep text-white px-5 py-2 rounded-full text-sm font-medium transition-all shadow-lg shadow-brand-purple/20 hover:shadow-brand-purple/40"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};