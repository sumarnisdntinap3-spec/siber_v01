import { createClient } from '@supabase/supabase-js';

// Replace these variables whenever you want to connect to a different Supabase project
const SUPABASE_URL = "https://unpfcenkfphywxmtjftg.supabase.co/rest/v1/";
const SUPABASE_PUBLIC_KEY = "sb_publishable_5PFwi4AqLsNsxWect4VUtg_ZSt03WSW";

// Automatically normalize base URL if "/rest/v1/" is provided
const normalizedUrl = SUPABASE_URL.replace(/\/rest\/v1\/?$/, '');

export const supabase = createClient(normalizedUrl || SUPABASE_URL, SUPABASE_PUBLIC_KEY);

export { SUPABASE_URL, SUPABASE_PUBLIC_KEY };
export default supabase;
