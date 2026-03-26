import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isProd = import.meta.env.PROD;
const useMockAuth = import.meta.env.VITE_USE_MOCK_AUTH === 'true';

// Check if credentials are set and not placeholders
const isValidConfig = 
  !useMockAuth &&
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project-id') && 
  supabaseAnonKey !== 'your-anon-key-here';

if (!isValidConfig) {
  if (isProd && !useMockAuth) {
    console.error(
      '[Kreavia.ai] CRITICAL: Supabase credentials missing or invalid in production.\n' +
      'Authentication will FAIL. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your hosting dashboard.'
    );
  } else {
    console.warn(
      `[Kreavia.ai] ${useMockAuth ? 'Mock auth enabled via VITE_USE_MOCK_AUTH.' : 'Supabase credentials not configured.'} Running in mock mode.\n` +
      'Update your .env file with real Supabase credentials to enable production auth.'
    );
  }
}

export const supabase = isValidConfig
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

console.log(`[Kreavia.ai] Supabase Initialized. Mock Mode: ${!supabase}`);
if (!supabase) {
  console.warn("MOCK MODE ACTIVE: To disable, set VITE_USE_MOCK_AUTH=false in .env and RESTART YOUR TERMINAL (Ctrl+C, then npm run dev).");
}

export const isMockMode = !supabase;


