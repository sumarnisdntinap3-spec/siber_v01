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

/**
 * Dynamically tests if a table exists in Supabase.
 */
export async function isTableReady(tableName: string): Promise<boolean> {
  try {
    const { error } = await supabaseServer.from(tableName).select('id', { head: true, count: 'exact' });
    if (!error) return true;
    if (error.code === 'PGRST205' || error.message?.includes('schema cache') || error.message?.includes('does not exist')) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Syncs user record to Supabase users table.
 */
export async function syncUserToSupabase(user: any): Promise<boolean> {
  if (!user || !user.id) return false;
  try {
    const cleanNip = user.nip && user.nip !== '-' ? String(user.nip).trim() : `NIP-${user.id}`;
    const payload = {
      id: user.id,
      nip: cleanNip,
      name: user.name || 'Pengguna',
      username: user.username || user.email || user.id,
      email: user.email || null,
      role: user.role || 'GURU',
      password: user.password || null,
      school_id: user.schoolId || null,
      school_name: user.schoolName || null,
      phone: user.phone || null,
      status: user.status === 'active' || user.status === 'Aktif' ? 'Aktif' : 'Nonaktif',
      updated_at: new Date().toISOString()
    };

    const { error } = await supabaseServer.from('users').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn(`⚠️ Supabase syncUser error (${user.name}):`, error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn(`⚠️ Error syncing user ${user.id} to Supabase:`, err.message);
    return false;
  }
}

/**
 * Delete user from Supabase users table.
 */
export async function deleteUserFromSupabase(userId: string): Promise<boolean> {
  if (!userId) return false;
  try {
    const { error } = await supabaseServer.from('users').delete().eq('id', userId);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Sync school record to Supabase schools table.
 */
export async function syncSchoolToSupabase(school: any): Promise<boolean> {
  if (!school || !school.id) return false;
  try {
    const cleanNpsn = school.npsn ? String(school.npsn).trim() : `NPSN-${school.id.replace(/\D/g, '') || Date.now()}`;
    const payload = {
      id: school.id,
      npsn: cleanNpsn,
      name: school.name || 'Satuan Pendidikan',
      level: ['TK', 'SD', 'SMP', 'SMA', 'SMK'].includes(school.level) ? school.level : 'SD',
      address: school.address || '',
      sub_district: school.subDistrict || school.subdistrict || 'Sukomoro',
      city: school.city || 'Kabupaten Magetan',
      principal_name: school.principalName || school.principal_name || '-',
      supervisor_id: school.supervisorId || school.supervisor_id || null,
      supervisor_name: school.supervisorName || school.supervisor_name || '-',
      accreditation: school.accreditation || 'A',
      teacher_count: Number(school.teacherCount || school.teacher_count || 0),
      status: school.status || 'active',
      phone: school.phone || '',
      updated_at: new Date().toISOString()
    };

    const { error } = await supabaseServer.from('schools').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn(`⚠️ Supabase syncSchool error (${school.name}):`, error.message);
      return false;
    }
    console.log(`✅ Synced school "${school.name}" to Supabase`);
    return true;
  } catch (err: any) {
    console.warn(`⚠️ Error syncing school ${school.id} to Supabase:`, err.message);
    return false;
  }
}

/**
 * Delete school from Supabase schools table.
 */
export async function deleteSchoolFromSupabase(id: string): Promise<boolean> {
  if (!id) return false;
  try {
    const { error } = await supabaseServer.from('schools').delete().eq('id', id);
    if (error) {
      console.warn(`⚠️ Supabase deleteSchool error (${id}):`, error.message);
      return false;
    }
    console.log(`✅ Deleted school "${id}" from Supabase`);
    return true;
  } catch (err: any) {
    console.warn(`⚠️ Error deleting school ${id} from Supabase:`, err.message);
    return false;
  }
}

/**
 * Sync teacher record to Supabase teachers table.
 */
export async function syncTeacherToSupabase(teacher: any, user?: any): Promise<boolean> {
  if (!teacher || !teacher.id) return false;
  try {
    // 1. If user object is provided, ensure user is synced to 'users' table first
    if (user) {
      await syncUserToSupabase(user);
    }

    const cleanNip = teacher.nip && teacher.nip !== '-' ? String(teacher.nip).trim() : null;
    const gender = teacher.gender === 'P' || teacher.gender === 'Perempuan' ? 'P' : 'L';
    const teacherType = teacher.teacherType === 'Guru Mapel' ? 'Guru Mapel' : 'Guru Kelas';

    const payload = {
      id: teacher.id,
      user_id: teacher.userId || user?.id || null,
      nip: cleanNip,
      nik: teacher.nik ? String(teacher.nik) : null,
      nuptk: teacher.nuptk ? String(teacher.nuptk) : null,
      name: teacher.name || 'Guru',
      gender: gender,
      subject: teacher.subject || 'Guru Kelas',
      teacher_type: teacherType,
      class_grade: teacher.classGrade || null,
      rank_grade: teacher.rankGrade || 'Penata Muda / III/a',
      position: teacher.position || 'Guru Ahli Pertama',
      employment_status: teacher.employmentStatus || 'PNS',
      email: teacher.email || null,
      phone: teacher.phone || null,
      school_id: teacher.schoolId || null,
      school_name: teacher.schoolName || '-',
      join_year: Number(teacher.joinYear) || new Date().getFullYear(),
      status: teacher.status === 'active' || teacher.status === 'Aktif' ? 'Aktif' : 'Nonaktif',
      admin_completion: Number(teacher.adminCompletion || 0),
      admin_self_completion: Number(teacher.adminSelfCompletion || 0),
      admin_supervisor_score: teacher.adminSupervisorScore !== undefined ? Number(teacher.adminSupervisorScore) : 0,
      admin_score: teacher.adminScore !== undefined ? Number(teacher.adminScore) : 0,
      admin_verified_by_supervisor: Boolean(teacher.adminVerifiedBySupervisor),
      admin_supervisor_status: teacher.adminSupervisorStatus || 'BELUM_DINILAI',
      module_status: teacher.moduleStatus || 'BELUM_UPLOAD',
      mindset_category: teacher.mindsetCategory || 'Pola Pikir Berkembang',
      supervision_status: teacher.supervisionStatus || 'Belum Supervisi',
      updated_at: new Date().toISOString()
    };

    const { error } = await supabaseServer.from('teachers').upsert(payload, { onConflict: 'id' });
    if (error) {
      // If foreign key constraint on school_id or user_id failed, try fallback without school_id / user_id
      if (error.code === '23503') {
        console.warn(`⚠️ Foreign key constraint on teacher (${teacher.name}), retrying with detached school/user:`, error.message);
        const detachedPayload = { ...payload, school_id: null, user_id: null };
        const retryResult = await supabaseServer.from('teachers').upsert(detachedPayload, { onConflict: 'id' });
        if (!retryResult.error) {
          console.log(`✅ Synced teacher "${teacher.name}" to Supabase (detached FK fallback)`);
          return true;
        }
      }
      console.warn(`⚠️ Supabase syncTeacher error (${teacher.name}):`, error.message);
      return false;
    }
    console.log(`✅ Synced teacher "${teacher.name}" to Supabase`);
    return true;
  } catch (err: any) {
    console.warn(`⚠️ Error syncing teacher ${teacher.id} to Supabase:`, err.message);
    return false;
  }
}

/**
 * Delete teacher from Supabase teachers table.
 */
export async function deleteTeacherFromSupabase(teacherId: string, userId?: string): Promise<boolean> {
  if (!teacherId) return false;
  try {
    const { error } = await supabaseServer.from('teachers').delete().eq('id', teacherId);
    if (error) {
      console.warn(`⚠️ Supabase deleteTeacher error (${teacherId}):`, error.message);
      return false;
    }
    if (userId) {
      await deleteUserFromSupabase(userId);
    }
    console.log(`✅ Deleted teacher "${teacherId}" from Supabase`);
    return true;
  } catch (err: any) {
    console.warn(`⚠️ Error deleting teacher ${teacherId} from Supabase:`, err.message);
    return false;
  }
}

/**
 * Sync supervisor record to Supabase supervisors table.
 */
export async function syncSupervisorToSupabase(supervisor: any, user?: any): Promise<boolean> {
  if (!supervisor || !supervisor.id) return false;
  try {
    // 1. If user object is provided, ensure user is synced to 'users' table first
    if (user) {
      await syncUserToSupabase(user);
    }

    const cleanNip = supervisor.nip ? String(supervisor.nip).trim() : `SP-${supervisor.id}`;
    const levelArray = Array.isArray(supervisor.levels) && supervisor.levels.length > 0
      ? supervisor.levels
      : (supervisor.levels ? [supervisor.levels] : ['SD']);

    const kecamatanArray = Array.isArray(supervisor.wilayahKecamatan)
      ? supervisor.wilayahKecamatan
      : (supervisor.wilayahKecamatan ? [supervisor.wilayahKecamatan] : ['Sukomoro']);

    const schoolIds = Array.isArray(supervisor.assignedSchoolIds) ? supervisor.assignedSchoolIds : [];
    const schoolNames = Array.isArray(supervisor.assignedSchoolNames) ? supervisor.assignedSchoolNames : [];

    const gender = supervisor.gender === 'P' || supervisor.gender === 'Perempuan' ? 'P' : 'L';

    // Format valid date string for sk_date or null
    let skDateVal: string | null = null;
    if (supervisor.skDate) {
      const parsed = new Date(supervisor.skDate);
      if (!isNaN(parsed.getTime())) {
        skDateVal = parsed.toISOString().split('T')[0];
      }
    }

    const payload = {
      id: supervisor.id,
      user_id: supervisor.userId || user?.id || null,
      nip: cleanNip,
      nik: supervisor.nik ? String(supervisor.nik) : null,
      name: supervisor.name || 'Pengawas Sekolah',
      email: supervisor.email || null,
      phone: supervisor.phone || null,
      gender: gender,
      rank_grade: supervisor.rankGrade || 'Pembina Tingkat I / IV/b',
      levels: levelArray,
      level_summary: levelArray.join(', '),
      assigned_school_ids: schoolIds,
      assigned_school_names: schoolNames,
      wilayah_kecamatan: kecamatanArray,
      kabupaten: supervisor.kabupaten || 'Kabupaten Magetan',
      sk_number: supervisor.skNumber || null,
      sk_date: skDateVal,
      status: supervisor.status === 'active' || supervisor.status === 'Aktif' ? 'Aktif' : 'Nonaktif',
      notes: supervisor.notes || null,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabaseServer.from('supervisors').upsert(payload, { onConflict: 'id' });
    if (error) {
      // If foreign key constraint on user_id failed, retry with user_id: null
      if (error.code === '23503') {
        const retryResult = await supabaseServer.from('supervisors').upsert({ ...payload, user_id: null }, { onConflict: 'id' });
        if (!retryResult.error) {
          console.log(`✅ Synced supervisor "${supervisor.name}" to Supabase (detached user_id fallback)`);
          return true;
        }
      }
      console.warn(`⚠️ Supabase syncSupervisor error (${supervisor.name}):`, error.message);
      return false;
    }
    console.log(`✅ Synced supervisor "${supervisor.name}" to Supabase`);
    return true;
  } catch (err: any) {
    console.warn(`⚠️ Error syncing supervisor ${supervisor.id} to Supabase:`, err.message);
    return false;
  }
}

/**
 * Delete supervisor from Supabase supervisors table.
 */
export async function deleteSupervisorFromSupabase(supervisorId: string, userId?: string): Promise<boolean> {
  if (!supervisorId) return false;
  try {
    const { error } = await supabaseServer.from('supervisors').delete().eq('id', supervisorId);
    if (error) {
      console.warn(`⚠️ Supabase deleteSupervisor error (${supervisorId}):`, error.message);
      return false;
    }
    if (userId) {
      await deleteUserFromSupabase(userId);
    }
    console.log(`✅ Deleted supervisor "${supervisorId}" from Supabase`);
    return true;
  } catch (err: any) {
    console.warn(`⚠️ Error deleting supervisor ${supervisorId} from Supabase:`, err.message);
    return false;
  }
}

/**
 * Get live record counts from Supabase to verify connection and synchronization.
 */
export async function getSupabaseMasterDataCounts(): Promise<{
  connected: boolean;
  counts: {
    schools: number;
    teachers: number;
    supervisors: number;
    users: number;
  };
  error?: string;
}> {
  try {
    const [schoolsRes, teachersRes, supervisorsRes, usersRes] = await Promise.all([
      supabaseServer.from('schools').select('*', { count: 'exact', head: true }),
      supabaseServer.from('teachers').select('*', { count: 'exact', head: true }),
      supabaseServer.from('supervisors').select('*', { count: 'exact', head: true }),
      supabaseServer.from('users').select('*', { count: 'exact', head: true })
    ]);

    return {
      connected: !schoolsRes.error && !teachersRes.error,
      counts: {
        schools: schoolsRes.count || 0,
        teachers: teachersRes.count || 0,
        supervisors: supervisorsRes.count || 0,
        users: usersRes.count || 0
      }
    };
  } catch (err: any) {
    return {
      connected: false,
      counts: { schools: 0, teachers: 0, supervisors: 0, users: 0 },
      error: err.message
    };
  }
}
