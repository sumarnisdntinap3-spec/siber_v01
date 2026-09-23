/**
 * Data Migration Utility: Firestore to Supabase PostgreSQL
 * SIBER-PM (Sistem Informasi Bersama Supervisi Pembelajaran Mendalam)
 * Dinas Pendidikan, Kepemudaan dan Olahraga Kabupaten Magetan
 */

import {
  collection,
  getDocs,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db as firestoreDb } from './firebase';
import { supabase, SUPABASE_PROJECT_NAME, SUPABASE_PROJECT_ID } from './supabase';

/**
 * Safely converts Firestore timestamp or arbitrary date value to ISO string.
 */
function toIsoDate(val: any, fallback?: string): string {
  if (!val) return fallback || new Date().toISOString();
  if (typeof val === 'string') return val;
  if (val instanceof Date) return val.toISOString();
  if (typeof val.toDate === 'function') {
    try {
      return val.toDate().toISOString();
    } catch {
      // ignore
    }
  }
  if (val.seconds !== undefined) {
    try {
      return new Date(val.seconds * 1000).toISOString();
    } catch {
      // ignore
    }
  }
  return fallback || new Date().toISOString();
}

/**
 * Result metrics for a single collection migration.
 */
export interface CollectionMigrationResult {
  collectionName: string;
  targetTable: string;
  totalFetched: number;
  transferredCount: number;
  failedCount: number;
  skippedCount: number;
  status: 'success' | 'partial' | 'error' | 'empty';
  errorDetails?: string[];
  durationMs: number;
}

/**
 * Overall summary report for the entire migration process.
 */
export interface MigrationSummaryReport {
  timestamp: string;
  sourceFirestoreDb: string;
  targetSupabaseProject: string;
  targetSupabaseId: string;
  dryRun: boolean;
  totalCollections: number;
  totalFetched: number;
  totalTransferred: number;
  totalFailed: number;
  totalDurationMs: number;
  results: CollectionMigrationResult[];
}

export type MigrationProgressCallback = (
  currentCollection: string,
  progressPercentage: number,
  logMessage: string,
  stepResult?: CollectionMigrationResult
) => void;

/**
 * Configuration mapping for each entity from Firestore to Supabase.
 */
interface EntityMigrationConfig {
  name: string;
  firestoreCollectionNames: string[]; // Can check multiple aliases (e.g. ['schools', 'SatuanPendidikan'])
  supabaseTable: string;
  transform: (doc: QueryDocumentSnapshot<DocumentData>) => Record<string, any>;
}

const ENTITY_CONFIGS: EntityMigrationConfig[] = [
  // 1. Pengaturan Aplikasi
  {
    name: 'Pengaturan Aplikasi',
    firestoreCollectionNames: ['appSettings', 'app_settings', 'settings'],
    supabaseTable: 'app_settings',
    transform: (doc) => {
      const d = doc.data();
      return {
        id: doc.id || 'app-settings-primary',
        app_name: d.appName || 'SIBER-PM',
        app_short_name: d.appShortName || 'SIBER-PM Magetan',
        agency_name: d.agencyName || 'Dinas Pendidikan, Kepemudaan dan Olahraga Kabupaten Magetan',
        app_subtitle: d.appSubtitle || 'Sistem Informasi Bersama Supervisi Pembelajaran Mendalam',
        tagline: d.tagline || 'Mewujudkan Pembelajaran Bermakna dan Menyenangkan di Seluruh Satuan Pendidikan',
        description: d.description || null,
        logo_type: d.logoType || 'preset',
        logo_preset: d.logoPreset || 'tut-wuri-handayani',
        logo_url: d.logoUrl || null,
        primary_color: d.primaryColor || 'indigo',
        template_preset: d.templatePreset || 'modern-corporate',
        sidebar_style: d.sidebarStyle || 'dark',
        card_radius: d.cardRadius || 'rounded',
        density: d.density || 'comfortable',
        font_family: d.fontFamily || 'jakarta',
        navbar_style: d.navbarStyle || 'glass',
        bg_pattern: d.bgPattern || 'dots',
        enable_announcement: d.enableAnnouncement !== undefined ? Boolean(d.enableAnnouncement) : true,
        announcement_text: d.announcementText || null,
        announcement_type: d.announcementType || 'info',
        footer_text: d.footerText || null,
        contact_email: d.contactEmail || 'dikpora@magetan.go.id',
        contact_phone: d.contactPhone || '0351-891000',
        version: d.version || '2.4.0',
        updated_at: toIsoDate(d.updatedAt),
        updated_by: d.updatedBy || 'Admin'
      };
    }
  },

  // 2. Tahun Ajaran / Periode Supervisi
  {
    name: 'Tahun Ajaran / Periode',
    firestoreCollectionNames: ['educationYears', 'education_years', 'periods'],
    supabaseTable: 'education_years',
    transform: (doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        name: d.name || d.year || '2026/2027',
        semester: d.semester || 'Ganjil',
        is_active: d.isActive !== undefined ? Boolean(d.isActive) : false,
        start_date: d.startDate || d.start_date || '2026-07-15',
        end_date: d.endDate || d.end_date || '2026-12-20',
        notes: d.notes || null,
        created_at: toIsoDate(d.createdAt)
      };
    }
  },

  // 3. Pengguna Sistem (Users)
  {
    name: 'Pengguna Sistem',
    firestoreCollectionNames: ['users', 'pengguna'],
    supabaseTable: 'users',
    transform: (doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        nip: d.nip || `NIP-${doc.id}`,
        name: d.name || 'Pengguna SIBER-PM',
        username: d.username || null,
        email: d.email || null,
        role: d.role || 'GURU',
        password: d.password || null,
        avatar_url: d.avatarUrl || d.avatar_url || null,
        school_id: d.schoolId || d.school_id || null,
        school_name: d.schoolName || d.school_name || null,
        assigned_school_ids: Array.isArray(d.assignedSchoolIds) ? d.assignedSchoolIds : [],
        phone: d.phone || null,
        position: d.position || null,
        status: d.status || 'Aktif',
        created_at: toIsoDate(d.createdAt),
        updated_at: toIsoDate(d.updatedAt)
      };
    }
  },

  // 4. Satuan Pendidikan (Schools)
  {
    name: 'Satuan Pendidikan (Sekolah)',
    firestoreCollectionNames: ['schools', 'sekolah'],
    supabaseTable: 'schools',
    transform: (doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        npsn: String(d.npsn || doc.id),
        name: d.name || 'Satuan Pendidikan',
        level: d.level || d.educationLevel || 'SD',
        address: d.address || '',
        sub_district: d.subDistrict || d.subdistrict || d.sub_district || 'Sukomoro',
        city: d.city || 'Kabupaten Magetan',
        postal_code: d.postalCode || d.postal_code || null,
        phone: d.phone || null,
        email: d.email || null,
        principal_id: d.principalId || d.principal_id || null,
        principal_name: d.principalName || d.principal_name || '-',
        supervisor_id: d.supervisorId || d.supervisor_id || null,
        supervisor_name: d.supervisorName || d.supervisor_name || '-',
        accreditation: d.accreditation || 'A',
        teacher_count: Number(d.teacherCount || d.totalTeachers || 0),
        status: d.status || 'active',
        created_at: toIsoDate(d.createdAt),
        updated_at: toIsoDate(d.updatedAt)
      };
    }
  },

  // 5. Pengawas Sekolah (Supervisors)
  {
    name: 'Pengawas Sekolah',
    firestoreCollectionNames: ['supervisors', 'pengawas'],
    supabaseTable: 'supervisors',
    transform: (doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        user_id: d.userId || d.user_id || null,
        nip: String(d.nip || doc.id),
        nik: d.nik || null,
        name: d.name || 'Pengawas Sekolah',
        email: d.email || null,
        phone: d.phone || null,
        gender: d.gender || 'L',
        rank_grade: d.rankGrade || d.rank_grade || 'Pembina Utama Muda / IV/c',
        levels: Array.isArray(d.levels) ? d.levels : ['SD'],
        level_summary: d.levelSummary || d.level_summary || 'SD',
        assigned_school_ids: Array.isArray(d.assignedSchoolIds) ? d.assignedSchoolIds : [],
        assigned_school_names: Array.isArray(d.assignedSchoolNames) ? d.assignedSchoolNames : [],
        wilayah_kecamatan: Array.isArray(d.wilayahKecamatan) ? d.wilayahKecamatan : [],
        kabupaten: d.kabupaten || 'Kabupaten Magetan',
        sk_number: d.skNumber || d.sk_number || null,
        sk_date: d.skDate || d.sk_date || null,
        status: d.status || 'Aktif',
        notes: d.notes || null,
        created_at: toIsoDate(d.createdAt),
        updated_at: toIsoDate(d.updatedAt)
      };
    }
  },

  // 6. Kepala Sekolah (Principals)
  {
    name: 'Kepala Sekolah',
    firestoreCollectionNames: ['principals', 'kepala_sekolah', 'kepsek'],
    supabaseTable: 'principals',
    transform: (doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        user_id: d.userId || d.user_id || null,
        nip: String(d.nip || doc.id),
        name: d.name || 'Kepala Sekolah',
        email: d.email || null,
        phone: d.phone || null,
        school_id: d.schoolId || d.school_id || null,
        school_name: d.schoolName || d.school_name || null,
        appointment_date: d.appointmentDate || d.appointment_date || null,
        sk_number: d.skNumber || d.sk_number || null,
        status: d.status || 'Aktif',
        created_at: toIsoDate(d.createdAt),
        updated_at: toIsoDate(d.updatedAt)
      };
    }
  },

  // 7. Guru / Tenaga Pendidik (Teachers)
  {
    name: 'Tenaga Pendidik (Guru)',
    firestoreCollectionNames: ['teachers', 'guru'],
    supabaseTable: 'teachers',
    transform: (doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        user_id: d.userId || d.user_id || null,
        nip: d.nip || null,
        nuptk: d.nuptk || null,
        nik: d.nik || null,
        name: d.name || 'Nama Guru',
        email: d.email || null,
        phone: d.phone || null,
        gender: d.gender === 'P' || d.gender === 'Perempuan' ? 'P' : 'L',
        school_id: d.schoolId || d.school_id || null,
        school_name: d.schoolName || d.school_name || null,
        subject: d.subject || null,
        teacher_type: d.teacherType || d.teacher_type || 'Guru Kelas',
        class_grade: d.classGrade || d.class_grade || null,
        employment_status: d.employmentStatus || d.employment_status || 'PNS',
        rank_grade: d.rankGrade || d.rank_grade || 'Penata Muda / III/a',
        teaching_hours: Number(d.teachingHours || 24),
        position: d.position || 'Guru Ahli Pertama',
        join_year: Number(d.joinYear || 2024),
        status: d.status || 'Aktif',
        avatar_url: d.avatarUrl || d.avatar_url || null,
        admin_completion: Number(d.adminCompletion || 0),
        admin_self_completion: Number(d.adminSelfCompletion || 0),
        admin_supervisor_score: Number(d.adminSupervisorScore || 0),
        admin_score: Number(d.adminScore || 0),
        admin_verified_by_supervisor: Boolean(d.adminVerifiedBySupervisor),
        admin_supervisor_status: d.adminSupervisorStatus || 'BELUM_DINILAI',
        admin_supervisor_evaluator_name: d.adminSupervisorEvaluatorName || null,
        admin_supervisor_notes: d.adminSupervisorNotes || null,
        module_status: d.moduleStatus || 'BELUM_UPLOAD',
        mindset_category: d.mindsetCategory || 'Pola Pikir Berkembang',
        supervision_status: d.supervisionStatus || 'Belum Supervisi',
        notes: d.notes || null,
        created_at: toIsoDate(d.createdAt),
        updated_at: toIsoDate(d.updatedAt)
      };
    }
  },

  // 8. Modul Ajar (Learning Modules / Lesson Plans)
  {
    name: 'Modul Ajar / Perangkat Pembelajaran',
    firestoreCollectionNames: ['learningModules', 'lessonPlans', 'learning_modules', 'modules'],
    supabaseTable: 'learning_modules',
    transform: (doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        education_year_id: d.educationYearId || d.education_year_id || 'ey-2026-1',
        education_year_name: d.educationYearName || d.education_year_name || null,
        teacher_id: d.teacherId || d.teacher_id || '',
        teacher_name: d.teacherName || d.teacher_name || '',
        school_id: d.schoolId || d.school_id || '',
        school_name: d.schoolName || d.school_name || '',
        subject: d.subject || 'Mata Pelajaran',
        grade_class: d.gradeClass || d.grade || null,
        semester: d.semester || 'Ganjil',
        title: d.title || 'Modul Ajar',
        description: d.description || null,
        file_name: d.fileName || d.file_name || 'modul-ajar.pdf',
        file_size: d.fileSize || d.file_size || null,
        file_type: d.fileType || d.file_type || 'pdf',
        file_url: d.fileUrl || d.file_url || null,
        version: Number(d.version || 1),
        status: d.status || 'DIUPLOAD',
        feedback: d.feedback || null,
        reviewed_by: d.reviewedBy || d.reviewed_by || null,
        reviewed_at: d.reviewedAt ? toIsoDate(d.reviewedAt) : null,
        uploaded_at: toIsoDate(d.uploadedAt || d.uploadDate || d.createdAt),
        history: Array.isArray(d.history) ? d.history : [],
        created_at: toIsoDate(d.createdAt),
        updated_at: toIsoDate(d.updatedAt)
      };
    }
  },

  // 9. Administrasi Guru (Teacher Administrations)
  {
    name: 'Checklist Administrasi Guru',
    firestoreCollectionNames: ['teacherAdministrations', 'teacher_administrations', 'administrations'],
    supabaseTable: 'teacher_administrations',
    transform: (doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        education_year_id: d.educationYearId || d.education_year_id || 'ey-2026-1',
        teacher_id: d.teacherId || d.teacher_id || '',
        teacher_name: d.teacherName || d.teacher_name || null,
        school_id: d.schoolId || d.school_id || '',
        school_name: d.schoolName || d.school_name || null,
        self_completion_percentage: Number(d.selfCompletionPercentage || 0),
        completion_percentage: Number(d.completionPercentage || 0),
        supervisor_score: Number(d.supervisorScore || 0),
        is_verified_by_supervisor: Boolean(d.isVerifiedBySupervisor),
        supervisor_status: d.supervisorStatus || 'BELUM_DINILAI',
        supervisor_notes: d.supervisorNotes || null,
        supervisor_evaluator_id: d.supervisorEvaluatorId || null,
        supervisor_evaluator_name: d.supervisorEvaluatorName || null,
        supervisor_evaluator_nip: d.supervisorEvaluatorNip || null,
        supervisor_evaluated_at: d.supervisorEvaluatedAt ? toIsoDate(d.supervisorEvaluatedAt) : null,
        items: Array.isArray(d.items) ? d.items : [],
        created_at: toIsoDate(d.createdAt),
        updated_at: toIsoDate(d.updatedAt)
      };
    }
  },

  // 10. Asesmen Pola Pikir (Mindset Assessments)
  {
    name: 'Pemetaan Pola Pikir (Mindset)',
    firestoreCollectionNames: ['mindsetAssessments', 'mindset_assessments', 'polaPikir'],
    supabaseTable: 'mindset_assessments',
    transform: (doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        education_year_id: d.educationYearId || d.education_year_id || 'ey-2026-1',
        teacher_id: d.teacherId || d.teacher_id || '',
        teacher_name: d.teacherName || d.teacher_name || '',
        school_id: d.schoolId || d.school_id || '',
        school_name: d.schoolName || d.school_name || '',
        evaluated_by_id: d.evaluatedById || null,
        evaluated_by_name: d.evaluatedByName || null,
        assessor_name: d.assessorName || null,
        assessor_role: d.assessorRole || null,
        assessment_date: d.assessmentDate || d.assessment_date || null,
        scores: d.scores || {},
        answers: Array.isArray(d.answers) ? d.answers : [],
        total_score: Number(d.totalScore || 0),
        max_score: Number(d.maxScore || 100),
        percentage: Number(d.percentage || 0),
        category: d.category || 'Pola Pikir Berkembang',
        principal_notes: d.principalNotes || null,
        recommendations: typeof d.recommendations === 'string'
          ? d.recommendations
          : JSON.stringify(d.recommendations || ''),
        created_at: toIsoDate(d.createdAt),
        updated_at: toIsoDate(d.updatedAt)
      };
    }
  },

  // 11. Asesmen Pembelajaran Mendalam (Deep Learning Assessments)
  {
    name: 'Asesmen Pembelajaran Mendalam',
    firestoreCollectionNames: ['deepLearningAssessments', 'deep_learning_assessments', 'deepLearning'],
    supabaseTable: 'deep_learning_assessments',
    transform: (doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        education_year_id: d.educationYearId || d.education_year_id || 'ey-2026-1',
        teacher_id: d.teacherId || d.teacher_id || '',
        teacher_name: d.teacherName || d.teacher_name || '',
        school_id: d.schoolId || d.school_id || '',
        school_name: d.schoolName || d.school_name || null,
        subject: d.subject || null,
        evaluated_by_id: d.evaluatedById || null,
        evaluated_by_name: d.evaluatedByName || null,
        assessor_name: d.assessorName || null,
        assessor_role: d.assessorRole || null,
        assessment_date: d.assessmentDate || null,
        aspect_scores: Array.isArray(d.aspectScores) ? d.aspectScores : [],
        overall_score: Number(d.overallScore || 0),
        overall_level: d.overallLevel || d.masteryLevel || 'Cakap',
        mastery_level: d.masteryLevel || 'Cakap',
        strength_points: d.strengthPoints || null,
        improvement_points: d.improvementPoints || null,
        notes: d.notes || null,
        created_at: toIsoDate(d.createdAt),
        updated_at: toIsoDate(d.updatedAt)
      };
    }
  },

  // 12. Supervisi Akademik (Supervision Requests)
  {
    name: 'Supervisi Akademik & Observasi',
    firestoreCollectionNames: ['supervisions', 'supervisionRequests', 'supervision_requests', 'supervisionSchedules'],
    supabaseTable: 'supervision_requests',
    transform: (doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        education_year_id: d.educationYearId || d.education_year_id || 'ey-2026-1',
        education_year_name: d.educationYearName || d.education_year_name || null,
        school_id: d.schoolId || d.school_id || '',
        school_name: d.schoolName || d.school_name || '',
        teacher_id: d.teacherId || d.teacher_id || '',
        teacher_name: d.teacherName || d.teacher_name || '',
        subject: d.subject || 'Mata Pelajaran',
        grade_class: d.gradeClass || d.grade || d.className || null,
        supervision_type: d.supervisionType || d.supervision_type || 'Supervisi Terencana',
        proposed_date1: d.proposedDate1 || d.date || d.supervisionDate || '2026-08-01',
        proposed_time1: d.proposedTime1 || d.time || d.timeStart || '08:00',
        proposed_date2: d.proposedDate2 || null,
        proposed_time2: d.proposedTime2 || null,
        approved_date: d.approvedDate || d.supervisionDate || null,
        approved_time: d.approvedTime || d.timeStart || null,
        location: d.location || null,
        notes: d.notes || null,
        supporting_doc_name: d.supportingDocName || null,
        status: d.status || 'DIAJUKAN',
        rejection_reason: d.rejectionReason || null,
        supervisor_id: d.supervisorId || d.supervisor_id || null,
        supervisor_name: d.supervisorName || d.supervisor_name || '',
        supervisor_notes: d.supervisorNotes || null,
        created_by_id: d.createdById || null,
        created_by_name: d.createdByName || null,
        submitted_at: toIsoDate(d.submittedAt || d.createdAt),
        reviewed_at: d.reviewedAt ? toIsoDate(d.reviewedAt) : null,
        reported_to_dinas_at: d.reportedToDinasAt ? toIsoDate(d.reportedToDinasAt) : null,
        is_completed: Boolean(d.isCompleted || d.status === 'SELESAI'),
        completion_score: d.completionScore !== undefined ? Number(d.completionScore) : (d.score !== undefined ? Number(d.score) : null),
        score: d.score !== undefined ? Number(d.score) : null,
        completion_notes: d.completionNotes || null,
        feedback: d.feedback || d.recommendation || null,
        created_at: toIsoDate(d.createdAt),
        updated_at: toIsoDate(d.updatedAt)
      };
    }
  },

  // 13. Audit Logs (Log Aktivitas)
  {
    name: 'Log Jejak Audit Aktivitas',
    firestoreCollectionNames: ['auditLogs', 'audit_logs', 'logs'],
    supabaseTable: 'audit_logs',
    transform: (doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        user_id: d.userId || d.user_id || 'system',
        user_name: d.userName || d.user_name || 'System',
        user_role: d.userRole || d.user_role || 'ADMIN_DINAS',
        module: d.module || 'Sistem',
        action: d.action || d.activity || 'Aktivitas',
        description: d.description || d.details || '',
        details: d.details || null,
        ip_address: d.ipAddress || d.ip_address || '127.0.0.1',
        user_agent: d.userAgent || null,
        timestamp: toIsoDate(d.timestamp || d.createdAt)
      };
    }
  }
];

/**
 * Migrates a single entity configuration from Firestore to Supabase.
 */
export async function migrateEntity(
  config: EntityMigrationConfig,
  dryRun = false,
  onProgress?: (message: string) => void
): Promise<CollectionMigrationResult> {
  const startTime = Date.now();
  const errorDetails: string[] = [];

  const result: CollectionMigrationResult = {
    collectionName: config.name,
    targetTable: config.supabaseTable,
    totalFetched: 0,
    transferredCount: 0,
    failedCount: 0,
    skippedCount: 0,
    status: 'empty',
    durationMs: 0
  };

  onProgress?.(`Memeriksa data Firestore untuk [${config.name}]...`);

  // Try finding data across aliases
  let foundDocs: QueryDocumentSnapshot<DocumentData>[] = [];
  let sourceCollectionUsed = '';

  for (const colName of config.firestoreCollectionNames) {
    try {
      const colRef = collection(firestoreDb, colName);
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        foundDocs = snap.docs;
        sourceCollectionUsed = colName;
        break;
      }
    } catch {
      // Continue to next alias
    }
  }

  result.totalFetched = foundDocs.length;

  if (foundDocs.length === 0) {
    onProgress?.(`Tidak ditemukan dokumen di koleksi Firestore (${config.firestoreCollectionNames.join(', ')}). Melewati.`);
    result.status = 'empty';
    result.durationMs = Date.now() - startTime;
    return result;
  }

  onProgress?.(`Ditemukan ${foundDocs.length} record pada koleksi "${sourceCollectionUsed}". Mulai transformasi...`);

  const recordsToInsert: Record<string, any>[] = [];

  for (const doc of foundDocs) {
    try {
      const mapped = config.transform(doc);
      if (mapped) {
        recordsToInsert.push(mapped);
      }
    } catch (err: any) {
      errorDetails.push(`Doc ${doc.id}: ${err.message || 'Transform error'}`);
      result.failedCount++;
    }
  }

  if (dryRun) {
    onProgress?.(`[DRY RUN] ${recordsToInsert.length} data siap dimasukkan ke tabel "${config.supabaseTable}".`);
    result.transferredCount = recordsToInsert.length;
    result.status = 'success';
    result.durationMs = Date.now() - startTime;
    return result;
  }

  // Batch Upsert into Supabase (batches of 50 to avoid payload caps)
  const batchSize = 50;
  for (let i = 0; i < recordsToInsert.length; i += batchSize) {
    const chunk = recordsToInsert.slice(i, i + batchSize);
    try {
      const { error } = await supabase
        .from(config.supabaseTable)
        .upsert(chunk, { onConflict: 'id' });

      if (error) {
        errorDetails.push(`Batch ${i + 1}-${i + chunk.length}: ${error.message}`);
        result.failedCount += chunk.length;
        onProgress?.(`⚠️ Gagal menyimpan batch pada tabel ${config.supabaseTable}: ${error.message}`);
      } else {
        result.transferredCount += chunk.length;
        onProgress?.(`Berhasil mentransfer ${result.transferredCount}/${recordsToInsert.length} ke "${config.supabaseTable}"...`);
      }
    } catch (err: any) {
      errorDetails.push(`Batch ${i + 1}: ${err.message}`);
      result.failedCount += chunk.length;
    }
  }

  result.durationMs = Date.now() - startTime;
  if (result.failedCount === 0 && result.transferredCount > 0) {
    result.status = 'success';
  } else if (result.transferredCount > 0 && result.failedCount > 0) {
    result.status = 'partial';
  } else if (result.failedCount > 0) {
    result.status = 'error';
  } else {
    result.status = 'empty';
  }

  if (errorDetails.length > 0) {
    result.errorDetails = errorDetails;
  }

  return result;
}

/**
 * Main migration coordinator: migrates all Firestore collections to Supabase.
 */
export async function migrateAllFromFirestoreToSupabase(
  dryRun = false,
  onProgress?: MigrationProgressCallback
): Promise<MigrationSummaryReport> {
  const globalStartTime = Date.now();
  const results: CollectionMigrationResult[] = [];

  const totalConfigs = ENTITY_CONFIGS.length;
  let totalFetchedAll = 0;
  let totalTransferredAll = 0;
  let totalFailedAll = 0;

  for (let i = 0; i < totalConfigs; i++) {
    const config = ENTITY_CONFIGS[i];
    const progressPercent = Math.round((i / totalConfigs) * 100);

    onProgress?.(
      config.name,
      progressPercent,
      `Memproses entitas ${i + 1}/${totalConfigs}: ${config.name}...`
    );

    const stepResult = await migrateEntity(config, dryRun, (msg) => {
      onProgress?.(config.name, progressPercent, msg);
    });

    results.push(stepResult);
    totalFetchedAll += stepResult.totalFetched;
    totalTransferredAll += stepResult.transferredCount;
    totalFailedAll += stepResult.failedCount;

    onProgress?.(
      config.name,
      Math.round(((i + 1) / totalConfigs) * 100),
      `Selesai memproses ${config.name} (${stepResult.transferredCount} berhasil, ${stepResult.failedCount} gagal)`,
      stepResult
    );
  }

  const report: MigrationSummaryReport = {
    timestamp: new Date().toISOString(),
    sourceFirestoreDb: 'ai-studio-sibersupervisiin-e85c9c5d-7154-4dfc-b7cd-825c1e32ea17',
    targetSupabaseProject: SUPABASE_PROJECT_NAME,
    targetSupabaseId: SUPABASE_PROJECT_ID,
    dryRun,
    totalCollections: totalConfigs,
    totalFetched: totalFetchedAll,
    totalTransferred: totalTransferredAll,
    totalFailed: totalFailedAll,
    totalDurationMs: Date.now() - globalStartTime,
    results
  };

  return report;
}
