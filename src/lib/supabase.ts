import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Project Credentials provided by user
export const SUPABASE_PROJECT_NAME = 'siber-dikpora-2026';
export const SUPABASE_PROJECT_ID = 'unpfcenkfphywxmtjftg';

// Default Supabase URL & Anon Key with fallback to provided credentials
const rawUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://unpfcenkfphywxmtjftg.supabase.co';

// Normalize URL in case user provided REST endpoint URL (e.g. ending in /rest/v1 or /rest/v1/)
export const SUPABASE_URL = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVucGZjZW5rZnBoeXd4bXRqZnRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMDExMzgsImV4cCI6MjEwNTY3NzEzOH0.iSd6YOjC8ggfIFbmJ41RrEv8XMzeEIaCeHjZkA92BuM';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// Create single Supabase client instance for frontend
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

export interface SupabaseHealthResult {
  connected: boolean;
  message: string;
  projectId: string;
  projectName: string;
  url: string;
  hasTables: boolean;
  missingTables: string[];
}

/**
 * Checks connection health with the Supabase project.
 */
export async function checkSupabaseHealth(): Promise<SupabaseHealthResult> {
  const result: SupabaseHealthResult = {
    connected: false,
    message: '',
    projectId: SUPABASE_PROJECT_ID,
    projectName: SUPABASE_PROJECT_NAME,
    url: SUPABASE_URL,
    hasTables: false,
    missingTables: []
  };

  try {
    // 1. Check basic Auth endpoint reachability
    const res = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      headers: {
        apikey: SUPABASE_ANON_KEY
      }
    });

    if (!res.ok) {
      result.message = `Gagal terhubung ke Supabase API Gateway (Status: ${res.status})`;
      return result;
    }

    result.connected = true;

    // 2. Check essential tables (schools, teachers, supervisors, etc.)
    const tablesToCheck = ['schools', 'teachers', 'supervisors', 'education_years', 'supervisions'];
    const missing: string[] = [];

    for (const table of tablesToCheck) {
      try {
        const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
        if (error && (error.code === 'PGRST205' || error.message?.includes('schema cache') || error.message?.includes('does not exist'))) {
          missing.push(table);
        }
      } catch {
        missing.push(table);
      }
    }

    result.missingTables = missing;
    result.hasTables = missing.length === 0;

    if (missing.length > 0) {
      result.message = `Terhubung ke Supabase (${SUPABASE_PROJECT_ID}), namun tabel [${missing.join(', ')}] belum dibuat. Silakan jalankan script SQL migrasi di Supabase SQL Editor.`;
    } else {
      result.message = `Koneksi ke Supabase (${SUPABASE_PROJECT_NAME}) berhasil dan seluruh tabel database siap digunakan.`;
    }

    return result;
  } catch (err: any) {
    result.message = `Gagal menghubungkan ke Supabase: ${err.message || 'Network error'}`;
    return result;
  }
}
