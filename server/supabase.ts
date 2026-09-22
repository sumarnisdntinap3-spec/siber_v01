import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://unpfcenkfphywxmtjftg.supabase.co';

export const SUPABASE_URL = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');

export const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVucGZjZW5rZnBoeXd4bXRqZnRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMDExMzgsImV4cCI6MjEwNTY3NzEzOH0.iSd6YOjC8ggfIFbmJ41RrEv8XMzeEIaCeHjZkA92BuM';

export const SUPABASE_PROJECT_ID = 'unpfcenkfphywxmtjftg';
export const SUPABASE_PROJECT_NAME = 'siber-dikpora-2026';

export const supabaseServer: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

let tablesChecked = false;
let hasSchoolsTable = false;

/**
 * Checks if the schools table exists in Supabase.
 */
export async function checkSupabaseTables(): Promise<boolean> {
  if (tablesChecked) return hasSchoolsTable;
  try {
    const { error } = await supabaseServer.from('schools').select('id', { head: true, count: 'exact' });
    if (!error) {
      hasSchoolsTable = true;
      console.log('✅ Supabase connected: public.schools table is active.');
    } else {
      hasSchoolsTable = false;
      console.log('ℹ️ Supabase connected, but public.schools table not created yet (Run supabase-schema.sql to create tables).');
    }
  } catch (err: any) {
    hasSchoolsTable = false;
    console.warn('⚠️ Supabase connection check failed:', err.message);
  }
  tablesChecked = true;
  return hasSchoolsTable;
}

/**
 * Sync school record to Supabase.
 */
export async function syncSchoolToSupabase(school: any) {
  try {
    const tableReady = await checkSupabaseTables();
    if (!tableReady) return;

    const payload = {
      id: school.id,
      npsn: school.npsn,
      name: school.name,
      level: school.level || 'SD',
      address: school.address || '',
      sub_district: school.subDistrict || school.subdistrict || '',
      city: school.city || 'Kabupaten Magetan',
      principal_name: school.principalName || '',
      supervisor_id: school.supervisorId || null,
      supervisor_name: school.supervisorName || '',
      status: school.status || 'active',
      phone: school.phone || '',
      updated_at: new Date().toISOString()
    };

    const { error } = await supabaseServer.from('schools').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('⚠️ Supabase syncSchool error:', error.message);
    } else {
      console.log(`✅ Synced school "${school.name}" to Supabase`);
    }
  } catch (err: any) {
    console.warn('⚠️ Error syncing school to Supabase:', err.message);
  }
}

/**
 * Delete school from Supabase.
 */
export async function deleteSchoolFromSupabase(id: string) {
  try {
    const tableReady = await checkSupabaseTables();
    if (!tableReady) return;

    const { error } = await supabaseServer.from('schools').delete().eq('id', id);
    if (error) {
      console.warn('⚠️ Supabase deleteSchool error:', error.message);
    } else {
      console.log(`✅ Deleted school "${id}" from Supabase`);
    }
  } catch (err: any) {
    console.warn('⚠️ Error deleting school from Supabase:', err.message);
  }
}

/**
 * Sync teacher record to Supabase.
 */
export async function syncTeacherToSupabase(teacher: any) {
  try {
    const { error } = await supabaseServer.from('teachers').upsert({
      id: teacher.id,
      nip: teacher.nip,
      name: teacher.name,
      gender: teacher.gender,
      subject: teacher.subject,
      school_id: teacher.schoolId,
      school_name: teacher.schoolName,
      status: teacher.status || 'active',
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
    if (error && error.code !== 'PGRST205') {
      console.warn('⚠️ Supabase syncTeacher error:', error.message);
    }
  } catch (err: any) {
    // Ignore schema cache errors
  }
}
