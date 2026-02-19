import { createClient } from '@supabase/supabase-js';

// --- CONFIGURAÇÃO ---
// NÃO coloque chaves hardcoded aqui para produção. Use arquivos .env ou variáveis de ambiente da Vercel.
// O cliente lerá automaticamente import.meta.env.VITE_SUPABASE_URL
// --------------------

// Helper to access environment variables safely across different bundlers
const getEnv = (key: string) => {
  // Vite (Standard for this project)
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
     // @ts-ignore
    return import.meta.env[key];
  }
  // Fallback for other environments
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return '';
};

const url = getEnv('VITE_SUPABASE_URL');
const key = getEnv('VITE_SUPABASE_ANON_KEY');

// Check if configured
export const isSupabaseConfigured = !!url && !!key;

const validUrl = isSupabaseConfigured ? url : 'https://placeholder.supabase.co';
const validKey = isSupabaseConfigured ? key : 'placeholder-key';

export const supabase = createClient(validUrl, validKey);