import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Mail, Lock, User } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username, avatar_url: `https://ui-avatars.com/api/?name=${username}&background=6d28d9&color=fff` }
          }
        });
        if (error) throw error;
        alert("Conta criada! Verifique seu email ou faça login.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md bg-brand-surface border border-white/10 rounded-2xl p-8 shadow-2xl">
        <h2 className="text-3xl font-bold text-center mb-2 text-white">{isLogin ? 'Bem-vindo de volta' : 'Criar Conta'}</h2>
        <p className="text-center text-gray-500 mb-8 text-sm">Acesse a melhor plataforma de animes.</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-500" size={18} />
              <input
                type="text"
                placeholder="Nome de usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black/50 border border-brand-border focus:border-brand-purple rounded-lg py-2.5 pl-10 pr-4 text-white outline-none transition-colors"
                required
              />
            </div>
          )}
          
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-gray-500" size={18} />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/50 border border-brand-border focus:border-brand-purple rounded-lg py-2.5 pl-10 pr-4 text-white outline-none transition-colors"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-500" size={18} />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/50 border border-brand-border focus:border-brand-purple rounded-lg py-2.5 pl-10 pr-4 text-white outline-none transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-purple hover:bg-brand-deep text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-brand-purple/20 mt-4 disabled:opacity-50"
          >
            {loading ? 'Processando...' : (isLogin ? 'Entrar' : 'Registrar')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-gray-400 hover:text-white text-sm hover:underline"
          >
            {isLogin ? 'Não tem uma conta? Crie agora.' : 'Já tem uma conta? Faça login.'}
          </button>
        </div>
      </div>
    </div>
  );
};