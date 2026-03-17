import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const useMockAuth = import.meta.env.VITE_USE_MOCK_AUTH === 'true';

// Check if credentials are set and not placeholders
const isValidConfig = 
  !useMockAuth &&
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project-id') && 
  supabaseAnonKey !== 'your-anon-key-here';

if (!isValidConfig) {
  console.warn(
    `[Kreavia.ai] ${useMockAuth ? 'Mock auth enabled via VITE_USE_MOCK_AUTH.' : 'Supabase credentials not configured.'} Running in mock mode.\n` +
    'Update your .env file with real Supabase credentials to enable production auth.'
  );
}

export const supabase = isValidConfig
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isMockMode = !supabase;


