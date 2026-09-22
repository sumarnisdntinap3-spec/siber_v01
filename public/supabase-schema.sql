-- ====================================================================
-- SIBER-PM: SUPABASE POSTGRESQL DATABASE SCHEMA & MIGRATION SCRIPT
-- Sistem Informasi Bersama Supervisi Pembelajaran Mendalam
-- Dinas Pendidikan, Kepemudaan dan Olahraga Kabupaten Magetan
--
-- Project Name: siber-dikpora-2026
-- Project ID  : unpfcenkfphywxmtjftg
-- ====================================================================
-- PETUNJUK PENERAPAN:
-- 1. Buka Supabase Dashboard: https://supabase.com/dashboard/project/unpfcenkfphywxmtjftg
-- 2. Klik menu "SQL Editor" pada bilah samping kiri
-- 3. Klik "New query", salin dan tempelkan (paste) seluruh skrip di bawah ini
-- 4. Klik tombol "Run" (atau Ctrl+Enter / Cmd+Enter)
-- ====================================================================

-- Aktifkan ekstensi yang diperlukan
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- FUNGSI PEMBANTU: AUTO-UPDATE TIMESTAMP updated_at
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- 1. TABEL PENGGUNA SISTEM (USERS)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  nip TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  username TEXT,
  email TEXT,
  role TEXT NOT NULL CHECK (role IN ('ADMIN_DINAS', 'PENGAWAS', 'KEPALA_SEKOLAH', 'GURU')),
  password TEXT,
  avatar_url TEXT,
  school_id TEXT,
  school_name TEXT,
  assigned_school_ids TEXT[] DEFAULT '{}',
  phone TEXT,
  position TEXT,
  status TEXT DEFAULT 'Aktif',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 2. TABEL PERIODE / TAHUN AJARAN (EDUCATION YEARS)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.education_years (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL, -- Contoh: "2026/2027"
  semester TEXT NOT NULL CHECK (semester IN ('Ganjil', 'Genap', '1', '2')),
  is_active BOOLEAN DEFAULT false,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 3. TABEL SATUAN PENDIDIKAN / SEKOLAH (SCHOOLS)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.schools (
  id TEXT PRIMARY KEY,
  npsn TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  level TEXT DEFAULT 'SD' CHECK (level IN ('TK', 'SD', 'SMP', 'SMA', 'SMK')),
  address TEXT,
  sub_district TEXT NOT NULL DEFAULT 'Sukomoro',
  city TEXT DEFAULT 'Kabupaten Magetan',
  postal_code TEXT,
  phone TEXT,
  email TEXT,
  principal_id TEXT,
  principal_name TEXT DEFAULT '-',
  supervisor_id TEXT,
  supervisor_name TEXT DEFAULT '-',
  accreditation TEXT DEFAULT 'A',
  teacher_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 4. TABEL PENGAWAS SEKOLAH (SUPERVISORS)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.supervisors (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  nip TEXT UNIQUE NOT NULL,
  nik TEXT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  gender TEXT DEFAULT 'L' CHECK (gender IN ('L', 'P')),
  rank_grade TEXT DEFAULT 'Pembina Utama Muda / IV/c',
  levels TEXT[] DEFAULT ARRAY['SD'],
  level_summary TEXT DEFAULT 'SD',
  assigned_school_ids TEXT[] DEFAULT '{}',
  assigned_school_names TEXT[] DEFAULT '{}',
  wilayah_kecamatan TEXT[] DEFAULT '{}',
  kabupaten TEXT DEFAULT 'Kabupaten Magetan',
  sk_number TEXT,
  sk_date DATE,
  status TEXT DEFAULT 'Aktif',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 5. TABEL KEPALA SEKOLAH (PRINCIPALS)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.principals (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  nip TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  school_id TEXT REFERENCES public.schools(id) ON DELETE SET NULL,
  school_name TEXT,
  appointment_date DATE,
  sk_number TEXT,
  status TEXT DEFAULT 'Aktif',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 6. TABEL TENAGA PENDIDIK / GURU (TEACHERS)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.teachers (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  nip TEXT UNIQUE,
  nuptk TEXT,
  nik TEXT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  gender TEXT DEFAULT 'L' CHECK (gender IN ('L', 'P', 'Laki-laki', 'Perempuan')),
  school_id TEXT REFERENCES public.schools(id) ON DELETE SET NULL,
  school_name TEXT,
  subject TEXT,
  teacher_type TEXT DEFAULT 'Guru Kelas' CHECK (teacher_type IN ('Guru Kelas', 'Guru Mapel')),
  class_grade TEXT,
  employment_status TEXT DEFAULT 'PNS' CHECK (employment_status IN ('PNS', 'PPPK', 'GTT', 'Honor Daerah')),
  rank_grade TEXT DEFAULT 'Penata Muda / III/a',
  teaching_hours INTEGER DEFAULT 24,
  position TEXT DEFAULT 'Guru Ahli Pertama',
  join_year INTEGER DEFAULT 2024,
  status TEXT DEFAULT 'Aktif',
  avatar_url TEXT,
  admin_completion INTEGER DEFAULT 0,
  admin_self_completion INTEGER DEFAULT 0,
  admin_supervisor_score INTEGER DEFAULT 0,
  admin_score INTEGER DEFAULT 0,
  admin_verified_by_supervisor BOOLEAN DEFAULT false,
  admin_supervisor_status TEXT DEFAULT 'BELUM_DINILAI',
  admin_supervisor_evaluator_name TEXT,
  admin_supervisor_evaluated_at TIMESTAMPTZ,
  admin_supervisor_notes TEXT,
  module_status TEXT DEFAULT 'BELUM_UPLOAD',
  mindset_category TEXT DEFAULT 'Pola Pikir Berkembang',
  supervision_status TEXT DEFAULT 'Belum Supervisi',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 7. TABEL MUTASI GURU (TEACHER MUTATIONS)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.teacher_mutations (
  id TEXT PRIMARY KEY,
  teacher_id TEXT REFERENCES public.teachers(id) ON DELETE CASCADE,
  teacher_name TEXT NOT NULL,
  teacher_nip TEXT,
  from_school_id TEXT REFERENCES public.schools(id) ON DELETE SET NULL,
  from_school_name TEXT NOT NULL,
  to_school_id TEXT REFERENCES public.schools(id) ON DELETE SET NULL,
  to_school_name TEXT NOT NULL,
  mutation_date DATE NOT NULL,
  effective_date DATE,
  sk_number TEXT NOT NULL,
  reason TEXT NOT NULL,
  notes TEXT,
  created_by TEXT,
  status TEXT DEFAULT 'Selesai',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 8. TABEL MODUL AJAR & PERANGKAT PEMBELAJARAN (LEARNING MODULES)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.learning_modules (
  id TEXT PRIMARY KEY,
  education_year_id TEXT REFERENCES public.education_years(id) ON DELETE CASCADE,
  education_year_name TEXT,
  teacher_id TEXT REFERENCES public.teachers(id) ON DELETE CASCADE,
  teacher_name TEXT NOT NULL,
  school_id TEXT REFERENCES public.schools(id) ON DELETE CASCADE,
  school_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  grade_class TEXT,
  semester TEXT DEFAULT 'Ganjil',
  title TEXT NOT NULL,
  description TEXT,
  file_name TEXT NOT NULL,
  file_size TEXT,
  file_type TEXT DEFAULT 'pdf',
  file_url TEXT,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'DIUPLOAD' CHECK (status IN ('DRAFT', 'DIUPLOAD', 'DIPERIKSA', 'PERLU_REVISI', 'DISETUJUI', 'BELUM_UPLOAD')),
  feedback TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  uploaded_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 9. TABEL MASTER BUTIR ADMINISTRASI GURU (ADMINISTRATION ITEMS)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.administration_items (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_required BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 10. TABEL CHECKLIST ADMINISTRASI GURU (TEACHER ADMINISTRATIONS)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.teacher_administrations (
  id TEXT PRIMARY KEY,
  education_year_id TEXT REFERENCES public.education_years(id) ON DELETE CASCADE,
  teacher_id TEXT REFERENCES public.teachers(id) ON DELETE CASCADE,
  teacher_name TEXT,
  school_id TEXT REFERENCES public.schools(id) ON DELETE CASCADE,
  school_name TEXT,
  self_completion_percentage INTEGER DEFAULT 0,
  completion_percentage INTEGER DEFAULT 0,
  supervisor_score INTEGER DEFAULT 0,
  is_verified_by_supervisor BOOLEAN DEFAULT false,
  supervisor_status TEXT DEFAULT 'BELUM_DINILAI',
  supervisor_notes TEXT,
  supervisor_evaluator_id TEXT,
  supervisor_evaluator_name TEXT,
  supervisor_evaluator_nip TEXT,
  supervisor_evaluated_at TIMESTAMPTZ,
  items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 11. TABEL INSTRUMEN POLA PIKIR BERKEMBANG (MINDSET INSTRUMENTS)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.mindset_instruments (
  id TEXT PRIMARY KEY,
  indicator TEXT NOT NULL,
  statement TEXT NOT NULL,
  weight NUMERIC(4, 2) DEFAULT 1.0,
  category TEXT DEFAULT 'Pola Pikir Berkembang',
  display_order INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 12. TABEL ASESMEN POLA PIKIR GURU (MINDSET ASSESSMENTS)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.mindset_assessments (
  id TEXT PRIMARY KEY,
  education_year_id TEXT REFERENCES public.education_years(id) ON DELETE CASCADE,
  teacher_id TEXT REFERENCES public.teachers(id) ON DELETE CASCADE,
  teacher_name TEXT NOT NULL,
  school_id TEXT REFERENCES public.schools(id) ON DELETE CASCADE,
  school_name TEXT NOT NULL,
  evaluated_by_id TEXT,
  evaluated_by_name TEXT,
  assessor_name TEXT,
  assessor_role TEXT,
  assessment_date DATE DEFAULT CURRENT_DATE,
  scores JSONB DEFAULT '{}'::jsonb,
  answers JSONB DEFAULT '[]'::jsonb,
  total_score NUMERIC(5, 2) DEFAULT 0,
  max_score NUMERIC(5, 2) DEFAULT 100,
  percentage NUMERIC(5, 2) DEFAULT 0,
  category TEXT DEFAULT 'Pola Pikir Berkembang',
  principal_notes TEXT,
  recommendations TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 13. TABEL ASPEK PEMBELAJARAN MENDALAM (DEEP LEARNING ASPECTS)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.deep_learning_aspects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  indicators JSONB DEFAULT '[]'::jsonb,
  display_order INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 14. TABEL ASESMEN PEMBELAJARAN MENDALAM (DEEP LEARNING ASSESSMENTS)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.deep_learning_assessments (
  id TEXT PRIMARY KEY,
  education_year_id TEXT REFERENCES public.education_years(id) ON DELETE CASCADE,
  teacher_id TEXT REFERENCES public.teachers(id) ON DELETE CASCADE,
  teacher_name TEXT NOT NULL,
  school_id TEXT REFERENCES public.schools(id) ON DELETE CASCADE,
  school_name TEXT,
  subject TEXT,
  evaluated_by_id TEXT,
  evaluated_by_name TEXT,
  assessor_name TEXT,
  assessor_role TEXT,
  assessment_date DATE DEFAULT CURRENT_DATE,
  aspect_scores JSONB DEFAULT '[]'::jsonb,
  overall_score NUMERIC(5, 2) DEFAULT 0,
  overall_level TEXT DEFAULT 'Cakap',
  mastery_level TEXT DEFAULT 'Cakap',
  strength_points TEXT,
  improvement_points TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 15. TABEL SUPERVISI AKADEMIK (SUPERVISION REQUESTS & SCHEDULES)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.supervision_requests (
  id TEXT PRIMARY KEY,
  education_year_id TEXT REFERENCES public.education_years(id) ON DELETE CASCADE,
  education_year_name TEXT,
  school_id TEXT REFERENCES public.schools(id) ON DELETE CASCADE,
  school_name TEXT NOT NULL,
  teacher_id TEXT REFERENCES public.teachers(id) ON DELETE CASCADE,
  teacher_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  grade_class TEXT,
  supervision_type TEXT DEFAULT 'Supervisi Terencana',
  proposed_date1 DATE NOT NULL,
  proposed_time1 TIME NOT NULL,
  proposed_date2 DATE,
  proposed_time2 TIME,
  approved_date DATE,
  approved_time TIME,
  location TEXT,
  notes TEXT,
  supporting_doc_name TEXT,
  status TEXT DEFAULT 'DIAJUKAN' CHECK (status IN ('DIAJUKAN', 'DIPERIKSA_PENGAWAS', 'DISETUJUI', 'DITOLAK', 'PERLU_REVISI', 'DILAPORKAN_DINAS', 'SELESAI')),
  rejection_reason TEXT,
  supervisor_id TEXT REFERENCES public.supervisors(id) ON DELETE SET NULL,
  supervisor_name TEXT,
  supervisor_notes TEXT,
  created_by_id TEXT,
  created_by_name TEXT,
  submitted_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  reviewed_at TIMESTAMPTZ,
  reported_to_dinas_at TIMESTAMPTZ,
  is_completed BOOLEAN DEFAULT false,
  completion_score NUMERIC(5, 2),
  score NUMERIC(5, 2),
  completion_notes TEXT,
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Alias tabel supervisi bila ada query langsung ke "supervisions"
CREATE OR REPLACE VIEW public.supervisions AS 
  SELECT 
    id,
    teacher_id,
    teacher_name,
    school_id,
    school_name,
    supervisor_id,
    supervisor_name,
    subject,
    grade_class AS class_name,
    COALESCE(approved_date, proposed_date1) AS supervision_date,
    COALESCE(approved_time, proposed_time1) AS time_start,
    status,
    COALESCE(completion_score, score) AS score,
    feedback AS recommendation,
    notes,
    created_at,
    updated_at
  FROM public.supervision_requests;

-- ====================================================================
-- 16. TABEL NOTIFIKASI PENGGUNA (NOTIFICATIONS)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 17. TABEL LOG AUDIT AKTIVITAS SISTEM (AUDIT LOGS)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  module TEXT DEFAULT 'Sistem',
  action TEXT NOT NULL,
  description TEXT,
  details TEXT,
  ip_address TEXT DEFAULT '127.0.0.1',
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 18. TABEL PENGATURAN APLIKASI (APP SETTINGS)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.app_settings (
  id TEXT PRIMARY KEY DEFAULT 'app-settings-primary',
  app_name TEXT DEFAULT 'SIBER-PM',
  app_short_name TEXT DEFAULT 'SIBER-PM Magetan',
  agency_name TEXT DEFAULT 'Dinas Pendidikan, Kepemudaan dan Olahraga Kabupaten Magetan',
  app_subtitle TEXT DEFAULT 'Sistem Informasi Bersama Supervisi Pembelajaran Mendalam',
  tagline TEXT DEFAULT 'Mewujudkan Pembelajaran Bermakna dan Menyenangkan di Seluruh Satuan Pendidikan',
  description TEXT,
  logo_type TEXT DEFAULT 'preset',
  logo_preset TEXT DEFAULT 'tut-wuri-handayani',
  logo_url TEXT,
  primary_color TEXT DEFAULT 'indigo',
  template_preset TEXT DEFAULT 'modern-corporate',
  sidebar_style TEXT DEFAULT 'dark',
  card_radius TEXT DEFAULT 'rounded',
  density TEXT DEFAULT 'comfortable',
  font_family TEXT DEFAULT 'jakarta',
  navbar_style TEXT DEFAULT 'glass',
  bg_pattern TEXT DEFAULT 'dots',
  enable_announcement BOOLEAN DEFAULT true,
  announcement_text TEXT DEFAULT 'Selamat datang di Aplikasi SIBER-PM Dinas Pendidikan, Kepemudaan dan Olahraga Kabupaten Magetan.',
  announcement_type TEXT DEFAULT 'info',
  footer_text TEXT DEFAULT '© 2026 Dinas Pendidikan, Kepemudaan dan Olahraga Kabupaten Magetan. All rights reserved.',
  contact_email TEXT DEFAULT 'dikpora@magetan.go.id',
  contact_phone TEXT DEFAULT '0351-891000',
  version TEXT DEFAULT '2.4.0',
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_by TEXT DEFAULT 'Admin Dinas'
);

-- ====================================================================
-- INDEKS PERFORMA QUERY (INDEXES)
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_users_nip ON public.users(nip);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_schools_npsn ON public.schools(npsn);
CREATE INDEX IF NOT EXISTS idx_schools_supervisor ON public.schools(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_schools_subdistrict ON public.schools(sub_district);
CREATE INDEX IF NOT EXISTS idx_teachers_nip ON public.teachers(nip);
CREATE INDEX IF NOT EXISTS idx_teachers_school ON public.teachers(school_id);
CREATE INDEX IF NOT EXISTS idx_supervisors_nip ON public.supervisors(nip);
CREATE INDEX IF NOT EXISTS idx_modules_teacher ON public.learning_modules(teacher_id);
CREATE INDEX IF NOT EXISTS idx_modules_school ON public.learning_modules(school_id);
CREATE INDEX IF NOT EXISTS idx_modules_status ON public.learning_modules(status);
CREATE INDEX IF NOT EXISTS idx_admin_teacher ON public.teacher_administrations(teacher_id);
CREATE INDEX IF NOT EXISTS idx_supervisions_teacher ON public.supervision_requests(teacher_id);
CREATE INDEX IF NOT EXISTS idx_supervisions_school ON public.supervision_requests(school_id);
CREATE INDEX IF NOT EXISTS idx_supervisions_supervisor ON public.supervision_requests(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_supervisions_status ON public.supervision_requests(status);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON public.audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);

-- ====================================================================
-- TRIGGER OTOMATISASI UPDATED_AT
-- ====================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_schools_updated_at') THEN
    CREATE TRIGGER trg_schools_updated_at BEFORE UPDATE ON public.schools FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_teachers_updated_at') THEN
    CREATE TRIGGER trg_teachers_updated_at BEFORE UPDATE ON public.teachers FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_supervisors_updated_at') THEN
    CREATE TRIGGER trg_supervisors_updated_at BEFORE UPDATE ON public.supervisors FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_modules_updated_at') THEN
    CREATE TRIGGER trg_modules_updated_at BEFORE UPDATE ON public.learning_modules FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_supervisions_updated_at') THEN
    CREATE TRIGGER trg_supervisions_updated_at BEFORE UPDATE ON public.supervision_requests FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supervisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.principals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_mutations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.administration_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_administrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mindset_instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mindset_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deep_learning_aspects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deep_learning_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supervision_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Buat kebijakan akses terbuka untuk koneksi aplikasi anon & authenticated
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Allow all for users" ON public.users;
  CREATE POLICY "Allow all for users" ON public.users FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Allow all for education_years" ON public.education_years;
  CREATE POLICY "Allow all for education_years" ON public.education_years FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Allow all for schools" ON public.schools;
  CREATE POLICY "Allow all for schools" ON public.schools FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Allow all for supervisors" ON public.supervisors;
  CREATE POLICY "Allow all for supervisors" ON public.supervisors FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Allow all for principals" ON public.principals;
  CREATE POLICY "Allow all for principals" ON public.principals FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Allow all for teachers" ON public.teachers;
  CREATE POLICY "Allow all for teachers" ON public.teachers FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Allow all for teacher_mutations" ON public.teacher_mutations;
  CREATE POLICY "Allow all for teacher_mutations" ON public.teacher_mutations FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Allow all for learning_modules" ON public.learning_modules;
  CREATE POLICY "Allow all for learning_modules" ON public.learning_modules FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Allow all for administration_items" ON public.administration_items;
  CREATE POLICY "Allow all for administration_items" ON public.administration_items FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Allow all for teacher_administrations" ON public.teacher_administrations;
  CREATE POLICY "Allow all for teacher_administrations" ON public.teacher_administrations FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Allow all for mindset_instruments" ON public.mindset_instruments;
  CREATE POLICY "Allow all for mindset_instruments" ON public.mindset_instruments FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Allow all for mindset_assessments" ON public.mindset_assessments;
  CREATE POLICY "Allow all for mindset_assessments" ON public.mindset_assessments FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Allow all for deep_learning_aspects" ON public.deep_learning_aspects;
  CREATE POLICY "Allow all for deep_learning_aspects" ON public.deep_learning_aspects FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Allow all for deep_learning_assessments" ON public.deep_learning_assessments;
  CREATE POLICY "Allow all for deep_learning_assessments" ON public.deep_learning_assessments FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Allow all for supervision_requests" ON public.supervision_requests;
  CREATE POLICY "Allow all for supervision_requests" ON public.supervision_requests FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Allow all for notifications" ON public.notifications;
  CREATE POLICY "Allow all for notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Allow all for audit_logs" ON public.audit_logs;
  CREATE POLICY "Allow all for audit_logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Allow all for app_settings" ON public.app_settings;
  CREATE POLICY "Allow all for app_settings" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);
END $$;

-- ====================================================================
-- SEED DATA AWAL (INITIAL SEED DATA)
-- ====================================================================

-- 1. Pengaturan Aplikasi
INSERT INTO public.app_settings (id, app_name, app_short_name, agency_name, app_subtitle)
VALUES (
  'app-settings-primary',
  'SIBER-PM',
  'SIBER-PM Magetan',
  'Dinas Pendidikan, Kepemudaan dan Olahraga Kabupaten Magetan',
  'Sistem Informasi Bersama Supervisi Pembelajaran Mendalam'
) ON CONFLICT (id) DO NOTHING;

-- 2. Periode Pendidikan Aktif
INSERT INTO public.education_years (id, name, semester, is_active, start_date, end_date, notes)
VALUES
  ('ey-2026-1', '2026/2027', 'Ganjil', true, '2026-07-15', '2026-12-20', 'Tahun Pelajaran Berjalan - Implementasi Kurikulum Merdeka & Supervisi PM'),
  ('ey-2025-2', '2025/2026', 'Genap', false, '2026-01-05', '2026-06-20', 'Tahun Pelajaran Sebelumnya')
ON CONFLICT (id) DO NOTHING;

-- 3. Data Pengguna Utama (Admin Dinas, Pengawas, Kepala Sekolah, Guru)
INSERT INTO public.users (id, nip, name, username, email, role, phone, position)
VALUES
  ('u-dinas', '197503121998031002', 'Didik Setiawan, S.E', 'admin_dinas', 'didik.dinas@magetan.go.id', 'ADMIN_DINAS', '081234567890', 'Staf Seksi Kurikulum & Ketenagaan'),
  ('u-pengawas-1', '196805121993031005', 'Drs. H. Bambang Sutrisno, M.Pd.', 'pengawas_bambang', 'bambang.pengawas@magetan.go.id', 'PENGAWAS', '081234567891', 'Pengawas Sekolah Ahli Madya'),
  ('u-kepsek-1', '197008141995122001', 'Hj. Sri Wahyuni, M.Pd.', 'kepsek_tinap3', 'sri.wahyuni@magetan.go.id', 'KEPALA_SEKOLAH', '081234567893', 'Kepala SDN Tinap 3'),
  ('u-guru-1', '198802102014021003', 'Anwar Fauzi, S.Pd.', 'guru_anwar', 'anwar.fauzi@magetan.go.id', 'GURU', '081234567894', 'Guru Kelas V')
ON CONFLICT (id) DO NOTHING;

-- 4. Satuan Pendidikan (Schools)
INSERT INTO public.schools (id, npsn, name, level, address, sub_district, city, principal_name, supervisor_name, status, teacher_count)
VALUES
  ('sch-1', '20501234', 'SD Negeri Tinap 3', 'SD', 'Jl. Raya Pendidikan No. 45, Desa Tinap', 'Sukomoro', 'Kabupaten Magetan', 'Hj. Sri Wahyuni, M.Pd.', 'Drs. H. Bambang Sutrisno, M.Pd.', 'active', 4),
  ('sch-2', '20501235', 'SD Negeri Tinap 1', 'SD', 'Jl. Pahlawan No. 12, Desa Tinap', 'Sukomoro', 'Kabupaten Magetan', 'Drs. Agus Priyanto, M.Pd.', 'Drs. H. Bambang Sutrisno, M.Pd.', 'active', 3),
  ('sch-3', '20509876', 'SMP Negeri 1 Sukamaju', 'SMP', 'Jl. Pemuda Bangsa No. 88', 'Sukamaju', 'Kabupaten Magetan', 'Budi Santoso, S.Pd., M.M.', 'Dr. Hj. Siti Rohmah, M.Pd.', 'active', 3)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  npsn = EXCLUDED.npsn;

-- 5. Pengawas Sekolah (Supervisors)
INSERT INTO public.supervisors (id, user_id, nip, name, email, phone, gender, rank_grade, levels, assigned_school_ids, assigned_school_names, wilayah_kecamatan)
VALUES
  ('sp-1', 'u-pengawas-1', '196805121993031005', 'Drs. H. Bambang Sutrisno, M.Pd.', 'bambang.pengawas@magetan.go.id', '081234567891', 'L', 'Pembina Utama Muda / IV/c', ARRAY['SD'], ARRAY['sch-1', 'sch-2'], ARRAY['SD Negeri Tinap 3', 'SD Negeri Tinap 1'], ARRAY['Sukomoro'])
ON CONFLICT (id) DO NOTHING;

-- 6. Guru (Teachers)
INSERT INTO public.teachers (id, user_id, nip, name, email, phone, gender, school_id, school_name, subject, teacher_type, class_grade, employment_status, rank_grade)
VALUES
  ('tch-1', 'u-guru-1', '198802102014021003', 'Anwar Fauzi, S.Pd.', 'anwar.fauzi@magetan.go.id', '081234567894', 'L', 'sch-1', 'SD Negeri Tinap 3', 'Guru Kelas 5', 'Guru Kelas', 'Kelas 5', 'PNS', 'Penata Muda / III/a'),
  ('tch-2', NULL, '199204152019032014', 'Dewi Lestari, S.Pd.', 'dewi.lestari@magetan.go.id', '081234567895', 'P', 'sch-1', 'SD Negeri Tinap 3', 'Pendidikan Agama Islam', 'Guru Mapel', 'Semua Kelas', 'PPPK', 'Ahli Pertama / IX'),
  ('tch-3', NULL, '198506222010012019', 'Rina Kusuma, S.Pd.', 'rina.kusuma@magetan.go.id', '081234567896', 'P', 'sch-2', 'SD Negeri Tinap 1', 'Guru Kelas 3', 'Guru Kelas', 'Kelas 3', 'PNS', 'Penata / III/c')
ON CONFLICT (id) DO NOTHING;

-- 7. Master Butir Administrasi Guru
INSERT INTO public.administration_items (id, code, name, description, is_required, display_order)
VALUES
  ('adm-1', 'ADM-01', 'Kalender Pendidikan', 'Kalender pendidikan tahun ajaran berjalan', true, 1),
  ('adm-2', 'ADM-02', 'Capaian Pembelajaran (CP)', 'Dokumen capaian pembelajaran mata pelajaran', true, 2),
  ('adm-3', 'ADM-03', 'Alur Tujuan Pembelajaran (ATP)', 'Alur tujuan pembelajaran yang telah dipetakan', true, 3),
  ('adm-4', 'ADM-04', 'Modul Ajar / Rencana Pelaksanaan Pembelajaran (RPP)', 'Modul ajar lengkap dengan diferensiasi dan PM', true, 4),
  ('adm-5', 'ADM-05', 'Program Tahunan (Prota)', 'Distribusi alokasi waktu tahunan', true, 5),
  ('adm-6', 'ADM-06', 'Program Semester (Promes)', 'Pemetaan materi dan asesmen per semester', true, 6),
  ('adm-7', 'ADM-07', 'Kriteria Ketercapaian Tujuan Pembelajaran (KKTP)', 'Rubrik dan interval ketercapaian tujuan pembelajaran', true, 7),
  ('adm-8', 'ADM-08', 'Jurnal / Agenda Harian Mengajar', 'Catatan pelaksanaan proses kegiatan pembelajaran harian', true, 8),
  ('adm-9', 'ADM-09', 'Daftar Nilai & Asesmen (Formatif & Sumatif)', 'Dokumentasi nilai asesmen formatif dan sumatif murid', true, 9),
  ('adm-10', 'ADM-10', 'Buku Presensi / Absensi Murid', 'Rekapitulasi kehadiran peserta didik harian', true, 10)
ON CONFLICT (id) DO NOTHING;

-- 8. Master Aspek Pembelajaran Mendalam (Deep Learning)
INSERT INTO public.deep_learning_aspects (id, name, description, display_order)
VALUES
  ('dl-1', 'Mindful Learning (Pembelajaran Sadar & Penuh Perhatian)', 'Murid aktif menyadari makna materi, fokus, dan terlibat secara kognitif', 1),
  ('dl-2', 'Meaningful Learning (Pembelajaran Bermakna & Kontekstual)', 'Materi dikaitkan langsung dengan konteks kehidupan nyata, lingkungan murid, dan pemecahan masalah', 2),
  ('dl-3', 'Joyful Learning (Pembelajaran Menyenangkan & Menggembirakan)', 'Suasana kelas interaktif, aman, positif, menumbuhkan rasa ingin tahu dan kegembiraan belajar', 3)
ON CONFLICT (id) DO NOTHING;
