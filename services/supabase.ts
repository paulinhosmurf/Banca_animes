import { createClient } from '@supabase/supabase-js';

// --- CONFIGURAÇÃO ---
// NÃO coloque chaves hardcoded aqui para produção. Use arquivos .env ou variáveis de ambiente da Vercel.
// O cliente lerá automaticamente import.meta.env.VITE_SUPABASE_URL
// --------------------

// Helper to access environment variables safely across different bundlers
const getEnv = (key: string) => {
  let value = '';
  
  // Vite (Standard for this project)
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
     // @ts-ignore
    value = import.meta.env[key];
  }
  // Fallback for other environments
  else if (typeof process !== 'undefined' && process.env && process.env[key]) {
    value = process.env[key];
  }

  // SANITIZAÇÃO CRÍTICA: Remove aspas extras que podem vir da Vercel ou .env incorreto
  if (value && typeof value === 'string') {
    value = value.replace(/^"|"$/g, '').replace(/^'|'$/g, '').trim();
  }

  return value;
};

const url = getEnv('VITE_SUPABASE_URL');
const key = getEnv('VITE_SUPABASE_ANON_KEY');

// Check if configured
// Validamos também se a URL parece real (começa com http) para evitar crashes
export const isSupabaseConfigured = !!url && !!key && url.startsWith('http');

if (!isSupabaseConfigured) {
  console.warn("⚠️ SUPABASE NÃO CONFIGURADO: Variáveis ausentes ou inválidas.");
  console.log("URL Recebida:", url ? "Definida (Oculta)" : "Vazia");
  console.log("Key Recebida:", key ? "Definida (Oculta)" : "Vazia");
} else {
  console.log("✅ Supabase configurado e sanitizado.");
}

const validUrl = isSupabaseConfigured ? url : 'https://placeholder.supabase.co';
const validKey = isSupabaseConfigured ? key : 'placeholder-key';

export const supabase = createClient(validUrl, validKey);