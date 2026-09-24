import { createClient } from '@supabase/supabase-js';

// ============================================================================
// PASTE YOUR SUPABASE CREDENTIALS HERE
// Replace the values below with your own Supabase project URL and public key.
// ============================================================================
const SUPABASE_URL = "https://unpfcenkfphywxmtjftg.supabase.co/rest/v1/"; // {{SUPABASE_URL}}
const SUPABASE_PUBLIC_KEY = "sb_publishable_5PFwi4AqLsNsxWect4VUtg_ZSt03WSW"; // {{SUPABASE_KEY}}
// ============================================================================

// Normalize URL (strip trailing /rest/v1/ if present, fallback safely if placeholder)
const cleanUrl = (SUPABASE_URL && !SUPABASE_URL.includes('{{'))
  ? SUPABASE_URL.replace(/\/rest\/v1\/?$/, '')
  : 'https://unpfcenkfphywxmtjftg.supabase.co';

const cleanKey = (SUPABASE_PUBLIC_KEY && !SUPABASE_PUBLIC_KEY.includes('{{'))
  ? SUPABASE_PUBLIC_KEY
  : 'sb_publishable_5PFwi4AqLsNsxWect4VUtg_ZSt03WSW';

// Export one Supabase client
export const supabase = createClient(cleanUrl, cleanKey);

export { SUPABASE_URL, SUPABASE_PUBLIC_KEY };
export default supabase;
