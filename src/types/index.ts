export type UserRole = 'ADMIN_DINAS' | 'PENGAWAS' | 'KEPALA_SEKOLAH' | 'GURU';

export interface User {
  id: string;
  name: string;
  username?: string;
  nip: string;
  email: string;
  role: UserRole;
  password?: string;
  avatarUrl?: string;
  schoolId?: string;
  schoolName?: string;
  assignedSchoolIds?: string[];
  phone?: string;
  position?: string;
  status?: string;
  createdAt?: string;
}

export interface EducationYear {
  id: string;
  year?: string;
  name?: string;
  semester: 'Ganjil' | 'Genap' | '1' | '2' | string;
  isActive: boolean;
  startDate: string;
  endDate: string;
  notes?: string;
}

export interface School {
  id: string;
  npsn: string;
  name: string;
  address: string;
  subdistrict?: string;
  subDistrict?: string;
  city: string;
  postalCode?: string;
  phone: string;
  email?: string;
  principalId?: string;
  principalName?: string;
  supervisorId?: string;
  supervisorName?: string;
  accreditation?: 'A' | 'B' | 'C' | 'Belum Terakreditasi' | string;
  totalTeachers?: number;
  teacherCount?: number;
  totalStudents?: number;
  educationLevel?: 'SD' | 'SMP' | 'SMA' | 'SMK' | string;
  level?: 'SD' | 'SMP' | 'SMA' | 'SMK' | string;
  status?: string;
  latitude?: number;
  longitude?: number;
}

export interface Teacher {
  id: string;
  userId?: string;
  nip: string;
  nuptk?: string;
  nik?: string;
  name: string;
  email: string;
  phone: string;
  gender: 'Laki-laki' | 'Perempuan' | 'L' | 'P' | string;
  schoolId: string;
  schoolName: string;
  subject: string;
  teacherType?: 'Guru Kelas' | 'Guru Mapel' | string;
  classGrade?: string;
  employmentStatus: 'PNS' | 'PPPK' | 'GTT' | 'Honor Daerah' | string;
  rankGrade: string;
  educationLevel?: string;
  teachingHours?: number;
  position?: string;
  joinYear?: number;
  status: 'Aktif' | 'Cuti' | 'Mutasi' | 'Pensiun' | 'active' | string;
  avatarUrl?: string;
  adminCompletion?: number; // Nilai akhir kelengkapan administrasi (menggunakan nilai dari pengawas sekolah)
  adminSelfCompletion?: number; // Persentase kelengkapan penilaian diri guru
  adminSupervisorScore?: number; // Nilai hasil evaluasi pengawas sekolah (0-100)
  adminScore?: number; // Nilai akhir resmi yang digunakan (dari pengawas sekolah)
  adminVerifiedBySupervisor?: boolean; // Status verifikasi dan pengesahan pengawas
  adminSupervisorStatus?: 'BELUM_DINILAI' | 'DIVERIFIKASI' | 'PERLU_PERBAIKAN' | 'DISETUJUI' | string;
  adminSupervisorEvaluatorName?: string;
  adminSupervisorEvaluatedAt?: string;
  adminSupervisorNotes?: string;
  moduleStatus?: string;
  mindsetCategory?: string;
  supervisionStatus?: string;
  notes?: string;
}

export interface Principal {
  id: string;
  userId?: string;
  nip: string;
  name: string;
  email: string;
  phone: string;
  schoolId: string;
  schoolName: string;
  appointmentDate?: string;
  skNumber?: string;
  status: 'Aktif' | 'Nonaktif' | 'active' | string;
}

export type EducationLevelType = 'TK' | 'SD' | 'SMP';

export const MAGETAN_KECAMATAN = [
  'Barat',
  'Bendo',
  'Karangrejo',
  'Karas',
  'Kartoharjo',
  'Kawedanan',
  'Lembeyan',
  'Magetan',
  'Maospati',
  'Ngariboyo',
  'Nguntoronadi',
  'Panekan',
  'Parang',
  'Plaosan',
  'Poncol',
  'Sidorejo',
  'Sukomoro',
  'Takeran'
] as const;

export type MagetanKecamatan = (typeof MAGETAN_KECAMATAN)[number];

export interface Supervisor {
  id: string;
  userId?: string;
  nip: string;
  nik?: string;
  name: string;
  email: string;
  phone: string;
  gender?: 'L' | 'P' | string;
  rankGrade?: string; // Pangkat / Golongan (contoh: Pembina Utama Muda / IV/c)
  levels?: ('TK' | 'SD' | 'SMP')[] | string[];
  levelSummary?: string;
  wilayahKecamatan?: string[]; // Daftar kecamatan binaan di Magetan
  kabupaten?: string; // default: 'Kabupaten Magetan'
  specialization?: string;
  skNumber?: string;
  skDate?: string;
  assignedSchools?: {
    schoolId: string;
    schoolName: string;
  }[];
  assignedSchoolIds?: string[];
  assignedSchoolNames?: string[];
  totalAssignedSchools?: number;
  status: 'Aktif' | 'Nonaktif' | 'active' | string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeacherMutation {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherNip: string;
  fromSchoolId: string;
  fromSchoolName: string;
  toSchoolId: string;
  toSchoolName: string;
  mutationDate: string;
  skNumber: string;
  reason: string;
  notes?: string;
  createdBy?: string;
  createdAt?: string;
  effectiveDate?: string;
  status?: string;
}

export type ModuleStatus = 'DRAFT' | 'DIUPLOAD' | 'DIPERIKSA' | 'PERLU_REVISI' | 'DISETUJUI' | 'BELUM_UPLOAD' | string;

export interface LearningModule {
  id: string;
  educationYearId: string;
  educationYearName?: string;
  teacherId: string;
  teacherName: string;
  schoolId: string;
  schoolName: string;
  subject: string;
  gradeClass?: string;
  grade?: string;
  semester: '1' | '2' | 'Ganjil' | 'Genap' | string;
  title: string;
  description: string;
  fileName: string;
  fileSize?: string;
  fileType?: 'pdf' | 'docx' | 'doc' | string;
  fileUrl?: string;
  version?: number;
  status: ModuleStatus;
  feedback?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  uploadedAt: string;
  uploadDate?: string;
  updatedAt?: string;
  history?: {
    version: number;
    fileName: string;
    uploadedAt: string;
    status: ModuleStatus;
    feedback?: string;
  }[];
}

export interface AdministrationItem {
  id: string;
  code?: string;
  name: string;
  description: string;
  isRequired: boolean;
  order: number;
}

export interface TeacherAdministrationRecord {
  id: string;
  educationYearId: string;
  teacherId: string;
  schoolId: string;
  itemId: string;
  itemName: string;
  isAvailable: boolean;
  isCompleted?: boolean;
  fileName?: string;
  fileUrl?: string;
  notes?: string;
  status?: 'LENGKAP' | 'BELUM_LENGKAP' | 'PERLU_REVISI' | 'DISETUJUI' | string;
  verifiedBy?: string;
  verifiedAt?: string;
  // Pengawas assessment & confirmation fields
  supervisorConfirmed?: boolean;
  supervisorScore?: number; // Nilai pengawas untuk item (0-100)
  supervisorStatus?: 'SESUAI' | 'PERLU_PERBAIKAN' | 'BELUM_SESUAI';
  supervisorFeedback?: string;
  supervisorEvaluatedBy?: string;
  supervisorEvaluatedAt?: string;
  updatedAt?: string;
}

export interface TeacherAdministrationChecklist {
  id: string;
  teacherId: string;
  teacherName?: string;
  schoolId: string;
  schoolName?: string;
  selfCompletionPercentage: number; // Persentase kelengkapan hasil penilaian mandiri guru
  completionPercentage: number; // Nilai akhir administrasi guru yang digunakan dalam sistem (dari penilaian pengawas)
  supervisorScore?: number; // Nilai resmi hasil evaluasi pengawas sekolah (0-100)
  isVerifiedBySupervisor?: boolean; // Apakah telah diverifikasi & disahkan oleh pengawas
  supervisorStatus?: 'BELUM_DINILAI' | 'DIVERIFIKASI' | 'PERLU_PERBAIKAN' | 'DISETUJUI' | string;
  supervisorNotes?: string;
  supervisorEvaluatorId?: string;
  supervisorEvaluatorName?: string;
  supervisorEvaluatorNip?: string;
  supervisorEvaluatedAt?: string;
  items: {
    itemId: string;
    itemName: string;
    isRequired?: boolean;
    order?: number;
    isCompleted: boolean; // Hasil penilaian diri guru
    fileName?: string;
    fileUrl?: string;
    notes?: string;
    // Penilaian & konfirmasi pengawas per item:
    supervisorConfirmed?: boolean;
    supervisorScore?: number;
    supervisorStatus?: 'SESUAI' | 'PERLU_PERBAIKAN' | 'BELUM_SESUAI';
    supervisorFeedback?: string;
  }[];
  updatedAt?: string;
}

export interface MindsetInstrument {
  id: string;
  indicator: string;
  statement: string;
  weight: number;
  category: string;
}

export interface TeacherMindsetAssessment {
  id: string;
  educationYearId?: string;
  teacherId: string;
  teacherName: string;
  schoolId: string;
  schoolName: string;
  assessorName: string;
  assessorRole?: string;
  assessmentDate: string;
  scores: {
    opennessToChange: number;
    resilience: number;
    feedbackAcceptance: number;
    continuousLearning: number;
    beliefInStudents: number;
  };
  totalScore: number;
  percentage: number;
  category: 'Pola Pikir Berkembang' | 'Pola Pikir Berkembang dengan Pendampingan' | 'Pola Pikir Perlu Penguatan' | string;
  recommendations: string;
  principalNotes?: string;
}

export interface MindsetAssessment {
  id: string;
  educationYearId?: string;
  teacherId: string;
  teacherName: string;
  schoolId: string;
  schoolName: string;
  evaluatedById?: string;
  evaluatedByName?: string;
  assessorName?: string;
  assessorRole?: string;
  assessmentDate?: string;
  evaluatedAt?: string;
  scores?: {
    opennessToChange: number;
    resilience: number;
    feedbackAcceptance: number;
    continuousLearning: number;
    beliefInStudents: number;
  };
  answers?: {
    instrumentId: string;
    statement: string;
    score: number;
    maxScore: number;
    notes?: string;
  }[];
  totalScore: number;
  maxScore?: number;
  percentage: number;
  category: 'Pola Pikir Berkembang' | 'Pola Pikir Berkembang dengan Pendampingan' | 'Pola Pikir Perlu Penguatan' | string;
  principalNotes?: string;
  recommendations: string | string[];
}

export interface DeepLearningAspect {
  id: string;
  name: string;
  description: string;
  indicators?: {
    id: string;
    name: string;
    criteria: string;
  }[];
}

export interface DeepLearningAssessment {
  id: string;
  educationYearId?: string;
  teacherId: string;
  teacherName: string;
  schoolId: string;
  schoolName?: string;
  subject?: string;
  evaluatedById?: string;
  evaluatedByName?: string;
  assessorName?: string;
  assessorRole?: string;
  assessmentDate?: string;
  aspectScores: {
    aspectId: string;
    aspectName: string;
    score?: number;
    averageScore?: number;
    notes?: string;
  }[];
  overallScore: number;
  overallLevel?: 'Mulai Terlihat' | 'Berkembang' | 'Cakap' | 'Mahir' | string;
  masteryLevel?: 'Mulai Terlihat' | 'Berkembang' | 'Cakap' | 'Mahir' | string;
  strengthPoints?: string;
  improvementPoints?: string;
  notes?: string;
  createdAt?: string;
}

export type SupervisionStatus = 'DIAJUKAN' | 'DIPERIKSA_PENGAWAS' | 'DISETUJUI' | 'DITOLAK' | 'PERLU_REVISI' | 'DILAPORKAN_DINAS' | 'SELESAI' | string;

export interface SupervisionRequest {
  id: string;
  educationYearId: string;
  educationYearName?: string;
  schoolId: string;
  schoolName: string;
  teacherId: string;
  teacherName: string;
  subject: string;
  gradeClass?: string;
  grade?: string;
  supervisionType: 'Supervisi Klinis' | 'Supervisi Terencana' | 'Supervisi Tematik Pembelajaran Mendalam' | 'KLINIS' | 'TERENCANA' | 'PEMBELAJARAN_MENDALAM' | string;
  proposedDate1: string;
  proposedTime1: string;
  proposedDate2?: string;
  proposedTime2?: string;
  approvedDate?: string;
  approvedTime?: string;
  location?: string;
  notes?: string;
  supportingDocName?: string;
  status: SupervisionStatus;
  rejectionReason?: string;
  supervisorId?: string;
  supervisorName?: string;
  supervisorNotes?: string;
  createdById?: string;
  createdByName?: string;
  submittedAt?: string;
  reviewedAt?: string;
  reportedToDinasAt?: string;
  isCompleted?: boolean;
  completionScore?: number;
  score?: number;
  completionNotes?: string;
  feedback?: string;
  supervisorFeedback?: SupervisorFeedback;
  teacherResponse?: TeacherFeedbackResponse;
}

export interface SupervisorFeedback {
  strengths?: string;
  improvements?: string;
  actionPlan?: string;
  generalNotes?: string;
  category?: 'Amat Baik' | 'Baik' | 'Cukup' | 'Perlu Bimbingan' | string;
  submittedAt?: string;
  supervisorName?: string;
  supervisorNip?: string;
}

export interface TeacherFeedbackResponse {
  notes?: string;
  submittedAt?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  module?: string;
  action?: string;
  description?: string;
  activity?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export type PresetLogoIcon = 'tut-wuri-handayani' | 'sparkles' | 'graduation-cap' | 'building' | 'shield' | 'book' | 'award';
export type ThemeColorKey = 'indigo' | 'blue' | 'emerald' | 'purple' | 'amber' | 'rose' | 'teal';
export type TemplatePresetKey =
  | 'modern-corporate'
  | 'classic-emerald'
  | 'ocean-gov'
  | 'royal-purple'
  | 'sunset-amber'
  | 'slate-minimal'
  | 'cyber-teal';
export type SidebarStyleKey = 'dark' | 'light' | 'colored' | 'glass';
export type CardRadiusKey = 'none' | 'subtle' | 'rounded' | 'soft';
export type DensityModeKey = 'compact' | 'comfortable' | 'spacious';
export type FontFamilyKey = 'jakarta' | 'inter' | 'poppins' | 'slate';
export type NavbarStyleKey = 'glass' | 'white' | 'colored' | 'dark';
export type BgPatternKey = 'none' | 'dots' | 'mesh' | 'grid' | 'waves';

export interface AppSettings {
  id: string;
  appName: string;
  appShortName: string;
  agencyName: string;
  appSubtitle: string;
  tagline?: string;
  description?: string;
  logoType: 'preset' | 'custom';
  logoPreset: PresetLogoIcon;
  logoUrl?: string;
  primaryColor: ThemeColorKey;
  templatePreset?: TemplatePresetKey;
  sidebarStyle?: SidebarStyleKey;
  cardRadius?: CardRadiusKey;
  density?: DensityModeKey;
  fontFamily?: FontFamilyKey;
  navbarStyle?: NavbarStyleKey;
  bgPattern?: BgPatternKey;
  enableAnnouncement?: boolean;
  announcementText?: string;
  announcementType?: 'info' | 'warning' | 'success' | 'urgent';
  footerText?: string;
  contactEmail?: string;
  contactPhone?: string;
  version?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export type TrendDirection = 'PENINGKATAN' | 'STABIL' | 'PENURUNAN';

export interface TeacherPeriodTrend {
  periodId: string;
  periodName: string; // e.g. "2024/2025"
  semester: 'Ganjil' | 'Genap';
  periodLabel: string; // e.g. "Ganjil 2024/2025"
  supervisionScore: number; // Skor Observasi & Supervisi Akademik (0-100)
  perangkatScore: number; // Skor Perangkat Pembelajaran & Modul Ajar (0-100)
  deepLearningScore: number; // Skor Pembelajaran Mendalam (0-100)
  mindsetScore: number; // Skor Pola Pikir (0-100)
  overallScore: number; // Nilai Komprehensif (0-100)
  predicate: 'Amat Baik' | 'Baik' | 'Cukup' | 'Perlu Bimbingan';
  trend: TrendDirection;
  deltaScore: number; // Selisih poin dari periode sebelumnya
  deltaPercentage: number; // Selisih persen dari periode sebelumnya
  isCurrentPeriod?: boolean;
  evaluatedDate?: string;
  evaluatorName?: string;
  evaluatorRole?: string;
  supervisionAspects: {
    perencanaan: number;
    pelaksanaan: number;
    asesmen: number;
    manajemenKelas: number;
  };
  perangkatAspects: {
    modulAjar: number;
    dokumenAdministrasi: number;
    kktpDanAsesmen: number;
    programTahunanSemester: number;
  };
  catatanPembinaan?: string;
  rekomendasi?: string[];
  moduleUploadCount?: number;
  adminDocumentCount?: number;
}

export interface TeacherPerformanceOverview {
  teacher: Teacher;
  currentScore: number;
  previousScore: number;
  overallDelta: number;
  overallDeltaPercentage: number;
  overallTrend: TrendDirection;
  currentPredicate: string;
  historyPeriods: TeacherPeriodTrend[];
  competencyRadar: {
    dimension: string;
    score: number;
    target: number;
    fullMark: number;
  }[];
  strengthHighlights: string[];
  improvementAreas: string[];
  summaryRecommendations: string[];
}
