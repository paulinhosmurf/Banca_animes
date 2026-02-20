import { createClient } from '@supabase/supabase-js';

// --- CONFIGURAÇÃO ---
// IMPORTANTE: O Vite substitui estaticamente import.meta.env.VITE_...
// Acesso dinâmico como import.meta.env[key] NÃO funciona em produção na Vercel.

const sanitize = (value: string | undefined) => {
  if (!value) return '';
  return value.replace(/^"|"$/g, '').replace(/^'|'$/g, '').trim();
};

let rawUrl = '';
let rawKey = '';

try {
  // Acessamos DIRETAMENTE para garantir que o Vite inclua no build
  // Envolvemos em try/catch caso import.meta.env não esteja definido (runtime crash fix)
  // Isso previne o erro "Cannot read properties of undefined" e permite que o App mostre a tela de erro amigável
  
  // @ts-ignore
  rawUrl = import.meta.env.VITE_SUPABASE_URL;
  // @ts-ignore
  rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
} catch (e) {
  console.warn("Falha ao ler variáveis de ambiente via import.meta.env (Provavelmente ambiente mal configurado ou build incompleto)");
}

const url = sanitize(rawUrl);
const key = sanitize(rawKey);

// Debug no console para ajudar (não expõe a chave inteira)
console.log("[Supabase Config] Raw URL defined:", !!rawUrl);
console.log("[Supabase Config] Raw Key defined:", !!rawKey);

// Check if configured
// Validamos também se a URL parece real (começa com http)
export const isSupabaseConfigured = !!url && !!key && url.startsWith('http');

export const getDebugInfo = () => ({
  urlLength: url ? url.length : 0,
  keyLength: key ? key.length : 0,
  urlStart: url ? url.substring(0, 8) + '...' : 'N/A',
  hasHttps: url ? url.startsWith('https://') : false
});

if (!isSupabaseConfigured) {
  console.warn("⚠️ SUPABASE NÃO CONFIGURADO: Variáveis ausentes ou inválidas.");
} else {
  console.log("✅ Supabase configurado.");
}

const validUrl = isSupabaseConfigured ? url : 'https://placeholder.supabase.co';
const validKey = isSupabaseConfigured ? key : 'placeholder-key';

export const supabase = createClient(validUrl, validKey);