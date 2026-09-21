import {
  User,
  School,
  Teacher,
  Principal,
  Supervisor,
  EducationYear,
  TeacherMutation,
  LearningModule,
  AdministrationItem,
  TeacherAdministrationRecord,
  MindsetInstrument,
  MindsetAssessment,
  DeepLearningAspect,
  DeepLearningAssessment,
  SupervisionRequest,
  NotificationItem,
  AuditLog,
  AppSettings
} from '../../src/types/index.js';

// Global in-memory persistence store with default seeds
export class DatabaseStore {
  users: User[] = [];
  schools: School[] = [];
  teachers: Teacher[] = [];
  principals: Principal[] = [];
  supervisors: Supervisor[] = [];
  educationYears: EducationYear[] = [];
  mutations: TeacherMutation[] = [];
  modules: LearningModule[] = [];
  adminItems: AdministrationItem[] = [];
  teacherAdminRecords: TeacherAdministrationRecord[] = [];
  mindsetInstruments: MindsetInstrument[] = [];
  mindsetAssessments: MindsetAssessment[] = [];
  deepLearningAspects: DeepLearningAspect[] = [];
  deepLearningAssessments: DeepLearningAssessment[] = [];
  supervisionRequests: SupervisionRequest[] = [];
  notifications: NotificationItem[] = [];
  auditLogs: AuditLog[] = [];
  appSettings: AppSettings = {
    id: 'app-settings-default',
    appName: 'SIBER-PM',
    appShortName: 'PM',
    agencyName: 'Dinas Pendidikan',
    appSubtitle: 'Supervisi Akademik & Pembelajaran Mendalam',
    tagline: 'Sistem Informasi Supervisi Akademik & Pembelajaran Mendalam Terintegrasi',
    description: 'Platform digital terpadu supervisi akademik, kurikulum merdeka, pemetaan growth mindset, dan 10 aspek pembelajaran mendalam (SIBER-PM).',
    logoType: 'preset',
    logoPreset: 'tut-wuri-handayani',
    logoUrl: '/tut-wuri-handayani.svg',
    primaryColor: 'indigo',
    templatePreset: 'modern-corporate',
    sidebarStyle: 'light',
    cardRadius: 'rounded',
    density: 'comfortable',
    fontFamily: 'jakarta',
    navbarStyle: 'white',
    bgPattern: 'none',
    enableAnnouncement: true,
    announcementText: 'Periode Supervisi Akademik & Pembelajaran Mendalam Semester Aktif Sedang Berlangsung',
    announcementType: 'info',
    footerText: 'Dinas Pendidikan • Sistem Informasi Pengawasan dan Supervisi Akademik',
    contactEmail: 'dinas@pendidikan.go.id',
    contactPhone: '081234567890',
    version: 'v2.5.0',
    updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    updatedBy: 'Didik Setiawan, S.E'
  };

  constructor() {
    this.seedInitialData();
  }

  seedInitialData() {
    // 1. Education Years
    this.educationYears = [
      {
        id: 'ey-2026-1',
        name: '2026/2027',
        semester: 'Ganjil',
        startDate: '2026-07-15',
        endDate: '2026-12-20',
        isActive: true,
        notes: 'Tahun Ajaran Aktif - Implementasi Kurikulum Merdeka & PM'
      },
      {
        id: 'ey-2025-2',
        name: '2025/2026',
        semester: 'Genap',
        startDate: '2026-01-05',
        endDate: '2026-06-25',
        isActive: false,
        notes: 'Tahun Ajaran Sebelumnya'
      }
    ];

    // 2. Schools
    this.schools = [
      {
        id: 'sch-1',
        npsn: '20501234',
        name: 'SD Negeri Tinap 3',
        level: 'SD',
        address: 'Jl. Raya Pendidikan No. 45, Desa Tinap',
        subDistrict: 'Sukomoro',
        city: 'Kabupaten Magetan',
        principalId: 'p-1',
        principalName: 'Hj. Sri Wahyuni, M.Pd.',
        supervisorId: 'sp-1',
        supervisorName: 'Drs. H. Bambang Sutrisno, M.Pd.',
        status: 'active',
        teacherCount: 4,
        phone: '0351-891001'
      },
      {
        id: 'sch-2',
        npsn: '20501235',
        name: 'SD Negeri Tinap 1',
        level: 'SD',
        address: 'Jl. Pahlawan No. 12, Desa Tinap',
        subDistrict: 'Sukomoro',
        city: 'Kabupaten Magetan',
        principalId: 'p-2',
        principalName: 'Drs. Agus Priyanto, M.Pd.',
        supervisorId: 'sp-1',
        supervisorName: 'Drs. H. Bambang Sutrisno, M.Pd.',
        status: 'active',
        teacherCount: 3,
        phone: '0351-891002'
      },
      {
        id: 'sch-3',
        npsn: '20509876',
        name: 'SMP Negeri 1 Sukamaju',
        level: 'SMP',
        address: 'Jl. Pemuda Bangsa No. 88',
        subDistrict: 'Sukamaju',
        city: 'Kabupaten Magetan',
        principalId: 'p-3',
        principalName: 'Budi Santoso, S.Pd., M.M.',
        supervisorId: 'sp-2',
        supervisorName: 'Dr. Hj. Siti Rohmah, M.Pd.',
        status: 'active',
        teacherCount: 3,
        phone: '0351-892345'
      }
    ];

    // 3. Users
    this.users = [
      // Admin Dinas (Username: admin123, Password: admin123)
      {
        id: 'u-dinas',
        username: 'admin123',
        name: 'Didik Setiawan, S.E',
        email: 'dinas@pendidikan.go.id',
        role: 'ADMIN_DINAS',
        nip: '197405121998031002',
        password: 'admin123',
        phone: '081234567890',
        status: 'active',
        createdAt: '2026-01-01'
      },
      // Pengawas 1 & 2
      {
        id: 'u-pengawas-1',
        username: 'pengawas_bambang',
        name: 'Drs. H. Bambang Sutrisno, M.Pd.',
        email: 'bambang.pengawas@pendidikan.go.id',
        role: 'PENGAWAS',
        nip: '196803151992031004',
        phone: '081234567891',
        assignedSchoolIds: ['sch-1', 'sch-2'],
        status: 'active',
        createdAt: '2026-01-01'
      },
      {
        id: 'u-pengawas-2',
        username: 'pengawas_siti',
        name: 'Dr. Hj. Siti Rohmah, M.Pd.',
        email: 'siti.rohmah@pendidikan.go.id',
        role: 'PENGAWAS',
        nip: '197109201996032001',
        phone: '081234567892',
        assignedSchoolIds: ['sch-3'],
        status: 'active',
        createdAt: '2026-01-01'
      },
      {
        id: 'u-pengawas-3',
        username: 'pengawas_endang',
        name: 'Dra. Endang Sulistyowati, M.Pd.',
        email: 'endang.pengawas@pendidikan.go.id',
        role: 'PENGAWAS',
        nip: '197608122002122003',
        phone: '081234567896',
        assignedSchoolIds: [],
        status: 'active',
        createdAt: '2026-01-01'
      },
      // Kepala Sekolah
      {
        id: 'u-ks-1',
        username: 'ks_tinap3',
        name: 'Hj. Sri Wahyuni, M.Pd.',
        email: 'sri.wahyuni@sdntinap3.sch.id',
        role: 'KEPALA_SEKOLAH',
        nip: '197508141999032003',
        schoolId: 'sch-1',
        phone: '081234567893',
        status: 'active',
        createdAt: '2026-01-01'
      },
      {
        id: 'u-ks-2',
        username: 'ks_tinap1',
        name: 'Drs. Agus Priyanto, M.Pd.',
        email: 'agus.priyanto@sdntinap1.sch.id',
        role: 'KEPALA_SEKOLAH',
        nip: '197211051997021001',
        schoolId: 'sch-2',
        phone: '081234567894',
        status: 'active',
        createdAt: '2026-01-01'
      },
      {
        id: 'u-ks-3',
        username: 'ks_smpn1',
        name: 'Budi Santoso, S.Pd., M.M.',
        email: 'budi.santoso@smpn1sukamaju.sch.id',
        role: 'KEPALA_SEKOLAH',
        nip: '197802102003121005',
        schoolId: 'sch-3',
        phone: '081234567895',
        status: 'active',
        createdAt: '2026-01-01'
      },
      // Guru-guru
      {
        id: 'u-guru-1',
        username: 'sumarni_guru',
        name: 'Sumarni, S.Pd.SD.',
        email: 'sumarni.sdntinap3@gmail.com',
        role: 'GURU',
        nip: '198504152009022007',
        schoolId: 'sch-1',
        phone: '081398765432',
        status: 'active',
        createdAt: '2026-01-01'
      },
      {
        id: 'u-guru-2',
        username: 'anwar_guru',
        name: 'Anwar Fauzi, S.Pd.',
        email: 'anwar.fauzi@sdntinap3.sch.id',
        role: 'GURU',
        nip: '198810232015031002',
        schoolId: 'sch-1',
        phone: '081398765433',
        status: 'active',
        createdAt: '2026-01-01'
      },
      {
        id: 'u-guru-3',
        username: 'dewi_guru',
        name: 'Dewi Anggraini, S.Pd.',
        email: 'dewi.anggraini@sdntinap3.sch.id',
        role: 'GURU',
        nip: '199203112019022004',
        schoolId: 'sch-1',
        phone: '081398765434',
        status: 'active',
        createdAt: '2026-01-01'
      },
      {
        id: 'u-guru-4',
        username: 'eko_guru',
        name: 'Eko Prasetyo, S.Pd.Jas.',
        email: 'eko.prasetyo@sdntinap3.sch.id',
        role: 'GURU',
        nip: '199006182014021003',
        schoolId: 'sch-1',
        phone: '081398765435',
        status: 'active',
        createdAt: '2026-01-01'
      },
      {
        id: 'u-guru-5',
        username: 'ratna_guru',
        name: 'Ratna Sari, S.Pd.',
        email: 'ratna.sari@sdntinap1.sch.id',
        role: 'GURU',
        nip: '198701022011012005',
        schoolId: 'sch-2',
        phone: '081398765436',
        status: 'active',
        createdAt: '2026-01-01'
      },
      {
        id: 'u-guru-6',
        username: 'hadi_guru',
        name: 'Hadi Gunawan, S.Pd.',
        email: 'hadi.gunawan@sdntinap1.sch.id',
        role: 'GURU',
        nip: '198409192008011003',
        schoolId: 'sch-2',
        phone: '081398765437',
        status: 'active',
        createdAt: '2026-01-01'
      },
      {
        id: 'u-guru-7',
        username: 'nurul_guru',
        name: 'Nurul Hidayati, S.Pd.I.',
        email: 'nurul.hidayati@sdntinap1.sch.id',
        role: 'GURU',
        nip: '199305142020122011',
        schoolId: 'sch-2',
        phone: '081398765438',
        status: 'active',
        createdAt: '2026-01-01'
      },
      {
        id: 'u-guru-8',
        username: 'rizky_guru',
        name: 'Rizky Ramadhan, M.Pd.',
        email: 'rizky.ramadhan@smpn1sukamaju.sch.id',
        role: 'GURU',
        nip: '198612142010011008',
        schoolId: 'sch-3',
        phone: '081398765439',
        status: 'active',
        createdAt: '2026-01-01'
      },
      {
        id: 'u-guru-9',
        username: 'fitri_guru',
        name: 'Fitri Handayani, S.Pd.',
        email: 'fitri.handayani@smpn1sukamaju.sch.id',
        role: 'GURU',
        nip: '199107252018012006',
        schoolId: 'sch-3',
        phone: '081398765440',
        status: 'active',
        createdAt: '2026-01-01'
      },
      {
        id: 'u-guru-10',
        username: 'yusuf_guru',
        name: 'Yusuf Arifin, S.Kom., Gr.',
        email: 'yusuf.arifin@smpn1sukamaju.sch.id',
        role: 'GURU',
        nip: '199508302022031004',
        schoolId: 'sch-3',
        phone: '081398765441',
        status: 'active',
        createdAt: '2026-01-01'
      }
    ];

    // 4. Supervisors & Principals details
    this.supervisors = [
      {
        id: 'sp-1',
        userId: 'u-pengawas-1',
        nip: '196803151992031004',
        nik: '3520011503680001',
        name: 'Drs. H. Bambang Sutrisno, M.Pd.',
        email: 'bambang.pengawas@pendidikan.go.id',
        phone: '081234567891',
        gender: 'L',
        rankGrade: 'Pembina Utama Muda / IV/c',
        levels: ['SD'],
        levelSummary: 'SD',
        wilayahKecamatan: ['Sukomoro', 'Magetan', 'Ngariboyo'],
        kabupaten: 'Kabupaten Magetan',
        specialization: 'Supervisi Mutu Pembelajaran SD & Kurikulum Merdeka',
        skNumber: '800/142/403.101/2026',
        skDate: '2026-01-05',
        assignedSchoolIds: ['sch-1', 'sch-2'],
        assignedSchoolNames: ['SD Negeri Tinap 3', 'SD Negeri Tinap 1'],
        status: 'active',
        createdAt: '2026-01-01'
      },
      {
        id: 'sp-2',
        userId: 'u-pengawas-2',
        nip: '197109201996032001',
        nik: '3520022009710002',
        name: 'Dr. Hj. Siti Rohmah, M.Pd.',
        email: 'siti.rohmah@pendidikan.go.id',
        phone: '081234567892',
        gender: 'P',
        rankGrade: 'Pembina Utama Madya / IV/d',
        levels: ['SMP'],
        levelSummary: 'SMP',
        wilayahKecamatan: ['Maospati', 'Barat', 'Karangrejo', 'Karas'],
        kabupaten: 'Kabupaten Magetan',
        specialization: 'Supervisi Manajerial & Pembelajaran Mendalam SMP',
        skNumber: '800/143/403.101/2026',
        skDate: '2026-01-05',
        assignedSchoolIds: ['sch-3'],
        assignedSchoolNames: ['SMP Negeri 1 Sukamaju'],
        status: 'active',
        createdAt: '2026-01-01'
      },
      {
        id: 'sp-3',
        userId: 'u-pengawas-3',
        nip: '197608122002122003',
        nik: '3520031208760003',
        name: 'Dra. Endang Sulistyowati, M.Pd.',
        email: 'endang.pengawas@pendidikan.go.id',
        phone: '081234567896',
        gender: 'P',
        rankGrade: 'Pembina Tingkat I / IV/b',
        levels: ['TK', 'SD'],
        levelSummary: 'TK, SD',
        wilayahKecamatan: ['Plaosan', 'Panekan', 'Sidorejo', 'Poncol'],
        kabupaten: 'Kabupaten Magetan',
        specialization: 'Supervisi PAUD/TK & Transisi PAUD-SD Menyenangkan',
        skNumber: '800/144/403.101/2026',
        skDate: '2026-01-05',
        assignedSchoolIds: [],
        assignedSchoolNames: [],
        status: 'active',
        createdAt: '2026-01-01'
      }
    ];

    this.principals = [
      {
        id: 'p-1',
        userId: 'u-ks-1',
        nip: '197508141999032003',
        name: 'Hj. Sri Wahyuni, M.Pd.',
        email: 'sri.wahyuni@sdntinap3.sch.id',
        phone: '081234567893',
        schoolId: 'sch-1',
        schoolName: 'SD Negeri Tinap 3',
        status: 'active'
      },
      {
        id: 'p-2',
        userId: 'u-ks-2',
        nip: '197211051997021001',
        name: 'Drs. Agus Priyanto, M.Pd.',
        email: 'agus.priyanto@sdntinap1.sch.id',
        phone: '081234567894',
        schoolId: 'sch-2',
        schoolName: 'SD Negeri Tinap 1',
        status: 'active'
      },
      {
        id: 'p-3',
        userId: 'u-ks-3',
        nip: '197802102003121005',
        name: 'Budi Santoso, S.Pd., M.M.',
        email: 'budi.santoso@smpn1sukamaju.sch.id',
        phone: '081234567895',
        schoolId: 'sch-3',
        schoolName: 'SMP Negeri 1 Sukamaju',
        status: 'active'
      }
    ];

    // 5. Teachers
    this.teachers = [
      {
        id: 't-1',
        userId: 'u-guru-1',
        nip: '198504152009022007',
        nik: '3520015504850001',
        name: 'Sumarni, S.Pd.SD.',
        gender: 'P',
        subject: 'Guru Kelas IV (Tematik / IPAS)',
        rankGrade: 'Penata Tk. I / III/d',
        position: 'Guru Ahli Muda',
        employmentStatus: 'PNS',
        email: 'sumarni.sdntinap3@gmail.com',
        phone: '081398765432',
        schoolId: 'sch-1',
        schoolName: 'SD Negeri Tinap 3',
        joinYear: 2012,
        status: 'active',
        moduleStatus: 'DISETUJUI',
        adminCompletion: 95, // Nilai akhir resmi yang digunakan (dari penilaian pengawas)
        adminSelfCompletion: 94, // Hasil penilaian diri guru
        adminSupervisorScore: 95, // Nilai evaluasi pengawas
        adminScore: 95, // Nilai akhir resmi
        adminVerifiedBySupervisor: true,
        adminSupervisorStatus: 'DISETUJUI',
        adminSupervisorEvaluatorName: 'Drs. Bambang Hidayat, M.Pd.',
        adminSupervisorEvaluatedAt: '2026-08-15',
        adminSupervisorNotes: 'Seluruh perangkat ajar lengkap, kontekstual, dan asesmen selaras dengan prinsip Pembelajaran Mendalam (Deep Learning).',
        mindsetCategory: 'Pola Pikir Berkembang',
        supervisionStatus: 'DISETUJUI'
      },
      {
        id: 't-2',
        userId: 'u-guru-2',
        nip: '198810232015031002',
        nik: '3520012310880002',
        name: 'Anwar Fauzi, S.Pd.',
        gender: 'L',
        subject: 'Matematika',
        rankGrade: 'Penata / III/c',
        position: 'Guru Ahli Muda',
        employmentStatus: 'PNS',
        email: 'anwar.fauzi@sdntinap3.sch.id',
        phone: '081398765433',
        schoolId: 'sch-1',
        schoolName: 'SD Negeri Tinap 3',
        joinYear: 2015,
        status: 'active',
        moduleStatus: 'DIPERIKSA',
        adminCompletion: 82, // Menunggu konfirmasi pengawas
        adminSelfCompletion: 82,
        adminSupervisorScore: undefined,
        adminScore: undefined,
        adminVerifiedBySupervisor: false,
        adminSupervisorStatus: 'BELUM_DINILAI',
        mindsetCategory: 'Pola Pikir Berkembang',
        supervisionStatus: 'DIAJUKAN'
      },
      {
        id: 't-3',
        userId: 'u-guru-3',
        nip: '199203112019022004',
        nik: '3520015103920003',
        name: 'Dewi Anggraini, S.Pd.',
        gender: 'P',
        subject: 'Bahasa Indonesia',
        rankGrade: 'Penata Muda Tk. I / III/b',
        position: 'Guru Ahli Pertama',
        employmentStatus: 'PPPK',
        email: 'dewi.anggraini@sdntinap3.sch.id',
        phone: '081398765434',
        schoolId: 'sch-1',
        schoolName: 'SD Negeri Tinap 3',
        joinYear: 2019,
        status: 'active',
        moduleStatus: 'PERLU_REVISI',
        adminCompletion: 74, // Nilai pengawas
        adminSelfCompletion: 70,
        adminSupervisorScore: 74,
        adminScore: 74,
        adminVerifiedBySupervisor: true,
        adminSupervisorStatus: 'PERLU_PERBAIKAN',
        adminSupervisorEvaluatorName: 'Drs. Bambang Hidayat, M.Pd.',
        adminSupervisorEvaluatedAt: '2026-08-10',
        adminSupervisorNotes: 'Perlu penguatan instrumen asesmen formatif dan penyempurnaan alur KKTP.',
        mindsetCategory: 'Pola Pikir Berkembang dengan Pendampingan',
        supervisionStatus: 'PERLU_REVISI'
      },
      {
        id: 't-4',
        userId: 'u-guru-4',
        nip: '199006182014021003',
        nik: '3520011806900004',
        name: 'Eko Prasetyo, S.Pd.Jas.',
        gender: 'L',
        subject: 'PJOK',
        rankGrade: 'Penata / III/c',
        position: 'Guru Ahli Muda',
        employmentStatus: 'PNS',
        email: 'eko.prasetyo@sdntinap3.sch.id',
        phone: '081398765435',
        schoolId: 'sch-1',
        schoolName: 'SD Negeri Tinap 3',
        joinYear: 2017,
        status: 'active',
        moduleStatus: 'DIUPLOAD',
        adminCompletion: 88,
        mindsetCategory: 'Pola Pikir Berkembang',
        supervisionStatus: 'BELUM_TERJADWAL'
      },
      {
        id: 't-5',
        userId: 'u-guru-5',
        nip: '198701022011012005',
        nik: '3520014201870005',
        name: 'Ratna Sari, S.Pd.',
        gender: 'P',
        subject: 'Guru Kelas V',
        rankGrade: 'Penata Tk. I / III/d',
        position: 'Guru Ahli Muda',
        employmentStatus: 'PNS',
        email: 'ratna.sari@sdntinap1.sch.id',
        phone: '081398765436',
        schoolId: 'sch-2',
        schoolName: 'SD Negeri Tinap 1',
        joinYear: 2014,
        status: 'active',
        moduleStatus: 'DISETUJUI',
        adminCompletion: 94,
        mindsetCategory: 'Pola Pikir Berkembang',
        supervisionStatus: 'DISETUJUI'
      },
      {
        id: 't-6',
        userId: 'u-guru-6',
        nip: '198409192008011003',
        nik: '3520011909840006',
        name: 'Hadi Gunawan, S.Pd.',
        gender: 'L',
        subject: 'Pendidikan Pancasila',
        rankGrade: 'Pembina / IV/a',
        position: 'Guru Ahli Madya',
        employmentStatus: 'PNS',
        email: 'hadi.gunawan@sdntinap1.sch.id',
        phone: '081398765437',
        schoolId: 'sch-2',
        schoolName: 'SD Negeri Tinap 1',
        joinYear: 2010,
        status: 'active',
        moduleStatus: 'DISETUJUI',
        adminCompletion: 100,
        mindsetCategory: 'Pola Pikir Berkembang',
        supervisionStatus: 'SELESAI'
      },
      {
        id: 't-7',
        userId: 'u-guru-7',
        nip: '199305142020122011',
        nik: '3520015405930007',
        name: 'Nurul Hidayati, S.Pd.I.',
        gender: 'P',
        subject: 'Pendidikan Agama Islam',
        rankGrade: 'Penata Muda / III/a',
        position: 'Guru Ahli Pertama',
        employmentStatus: 'PPPK',
        email: 'nurul.hidayati@sdntinap1.sch.id',
        phone: '081398765438',
        schoolId: 'sch-2',
        schoolName: 'SD Negeri Tinap 1',
        joinYear: 2021,
        status: 'active',
        moduleStatus: 'DRAFT',
        adminCompletion: 58,
        mindsetCategory: 'Pola Pikir Perlu Penguatan',
        supervisionStatus: 'BELUM_TERJADWAL'
      },
      {
        id: 't-8',
        userId: 'u-guru-8',
        nip: '198612142010011008',
        nik: '3520011412860008',
        name: 'Rizky Ramadhan, M.Pd.',
        gender: 'L',
        subject: 'IPA Terpadu',
        rankGrade: 'Penata Tk. I / III/d',
        position: 'Guru Ahli Muda',
        employmentStatus: 'PNS',
        email: 'rizky.ramadhan@smpn1sukamaju.sch.id',
        phone: '081398765439',
        schoolId: 'sch-3',
        schoolName: 'SMP Negeri 1 Sukamaju',
        joinYear: 2013,
        status: 'active',
        moduleStatus: 'DISETUJUI',
        adminCompletion: 100,
        mindsetCategory: 'Pola Pikir Berkembang',
        supervisionStatus: 'DISETUJUI'
      },
      {
        id: 't-9',
        userId: 'u-guru-9',
        nip: '199107252018012006',
        nik: '3520016507910009',
        name: 'Fitri Handayani, S.Pd.',
        gender: 'P',
        subject: 'Bahasa Inggris',
        rankGrade: 'Penata Muda Tk. I / III/b',
        position: 'Guru Ahli Pertama',
        employmentStatus: 'PNS',
        email: 'fitri.handayani@smpn1sukamaju.sch.id',
        phone: '081398765440',
        schoolId: 'sch-3',
        schoolName: 'SMP Negeri 1 Sukamaju',
        joinYear: 2018,
        status: 'active',
        moduleStatus: 'DIUPLOAD',
        adminCompletion: 76,
        mindsetCategory: 'Pola Pikir Berkembang dengan Pendampingan',
        supervisionStatus: 'DIAJUKAN'
      },
      {
        id: 't-10',
        userId: 'u-guru-10',
        nip: '199508302022031004',
        nik: '3520013008950010',
        name: 'Yusuf Arifin, S.Kom., Gr.',
        gender: 'L',
        subject: 'Informatika',
        rankGrade: 'Penata Muda / III/a',
        position: 'Guru Ahli Pertama',
        employmentStatus: 'GTT',
        email: 'yusuf.arifin@smpn1sukamaju.sch.id',
        phone: '081398765441',
        schoolId: 'sch-3',
        schoolName: 'SMP Negeri 1 Sukamaju',
        joinYear: 2022,
        status: 'active',
        moduleStatus: 'DRAFT',
        adminCompletion: 52,
        mindsetCategory: 'Pola Pikir Perlu Penguatan',
        supervisionStatus: 'BELUM_TERJADWAL'
      }
    ];

    // 6. Dynamic Administration Checklist Items
    this.adminItems = [
      { id: 'adm-1', name: 'Capaian Pembelajaran (CP)', description: 'Dokumen CP sesuai Fase dan Mapel Kurikulum Merdeka', isRequired: true, order: 1 },
      { id: 'adm-2', name: 'Tujuan Pembelajaran (TP)', description: 'Rumusan tujuan pembelajaran turunan dari CP', isRequired: true, order: 2 },
      { id: 'adm-3', name: 'Alur Tujuan Pembelajaran (ATP)', description: 'Struktur alur logis pencapaian TP sepanjang fase', isRequired: true, order: 3 },
      { id: 'adm-4', name: 'Modul Ajar / RPP Mendalam', description: 'Rancangan pelaksanaan pembelajaran mendalam lengkap dengan diferensiasi', isRequired: true, order: 4 },
      { id: 'adm-5', name: 'Program Tahunan (Prota)', description: 'Distribusi alokasi waktu satu tahun ajaran', isRequired: true, order: 5 },
      { id: 'adm-6', name: 'Program Semester (Promes)', description: 'Rincian mingguan pelaksanaan materi per semester', isRequired: true, order: 6 },
      { id: 'adm-7', name: 'Kalender Pendidikan Sekolah', description: 'Kaldik yang disesuaikan dengan agenda satuan pendidikan', isRequired: true, order: 7 },
      { id: 'adm-8', name: 'Jadwal Pembelajaran / Tatap Muka', description: 'Jadwal mengajar resmi dari kepala sekolah', isRequired: true, order: 8 },
      { id: 'adm-9', name: 'Instrumen Asesmen Awal (Diagnostik)', description: 'Pemetaan gaya belajar dan kesiapan awal murid', isRequired: true, order: 9 },
      { id: 'adm-10', name: 'Instrumen Asesmen Formatif & Sumatif', description: 'Kisi-kisi dan butir soal/tugas asesmen', isRequired: true, order: 10 },
      { id: 'adm-11', name: 'Rubrik Penilaian Autentik', description: 'Kriteria penskoran berbasis performa dan portofolio', isRequired: true, order: 11 },
      { id: 'adm-12', name: 'Bahan Ajar & Modul Bacaan', description: 'Materi kontekstual yang disiapkan untuk murid', isRequired: false, order: 12 },
      { id: 'adm-13', name: 'Media Pembelajaran Digital/Konkret', description: 'Alat peraga, tayangan multimedia interaktif', isRequired: false, order: 13 },
      { id: 'adm-14', name: 'Lembar Kerja Peserta Didik (LKPD)', description: 'Panduan aktivitas belajar berpusat pada siswa', isRequired: true, order: 14 },
      { id: 'adm-15', name: 'Dokumen Refleksi Pembelajaran Guru & Murid', description: 'Jurnal refleksi berkala proses belajar mengajar', isRequired: true, order: 15 },
      { id: 'adm-16', name: 'Dokumen Program Remedial & Pengayaan', description: 'Perencanaan dan bukti pelaksanaan penguatan hasil belajar', isRequired: true, order: 16 },
      { id: 'adm-17', name: 'Dokumentasi & Portofolio Hasil Karya Siswa', description: 'Foto/video kegiatan belajar aktif & karya terbaik', isRequired: false, order: 17 }
    ];

    // Seed teacher admin records for Sumarni (t-1)
    const activeYearId = 'ey-2026-1';
    this.adminItems.forEach((item, index) => {
      this.teacherAdminRecords.push({
        id: `tar-t1-${item.id}`,
        educationYearId: activeYearId,
        teacherId: 't-1',
        schoolId: 'sch-1',
        itemId: item.id,
        itemName: item.name,
        isAvailable: index !== 16, // available except last
        fileName: index < 16 ? `${item.name.replace(/[^a-zA-Z0-9]/g, '_')}_Sumarni.pdf` : undefined,
        notes: index < 16 ? 'Dokumen telah diselaraskan dengan fase B IPAS' : 'Belum diunggah',
        status: index < 16 ? 'DISETUJUI' : 'BELUM_LENGKAP',
        verifiedBy: 'Drs. Bambang Hidayat, M.Pd.',
        verifiedAt: '2026-08-15',
        supervisorConfirmed: index < 16,
        supervisorScore: index < 16 ? (index === 0 ? 98 : index === 3 ? 96 : 95) : 0,
        supervisorStatus: index < 16 ? 'SESUAI' : 'BELUM_SESUAI',
        supervisorFeedback: index < 16 ? 'Dokumen telah diperiksa dan dinyatakan memenuhi standar mutu kurikulum.' : 'Belum diunggah oleh guru.',
        supervisorEvaluatedBy: 'Drs. Bambang Hidayat, M.Pd.',
        supervisorEvaluatedAt: '2026-08-15',
        updatedAt: '2026-08-15'
      });
    });

    // Seed teacher admin records for Anwar Fauzi (t-2) - Menunggu Konfirmasi Pengawas
    this.adminItems.forEach((item, index) => {
      this.teacherAdminRecords.push({
        id: `tar-t2-${item.id}`,
        educationYearId: activeYearId,
        teacherId: 't-2',
        schoolId: 'sch-1',
        itemId: item.id,
        itemName: item.name,
        isAvailable: index < 14,
        fileName: index < 14 ? `${item.name.replace(/[^a-zA-Z0-9]/g, '_')}_Anwar.pdf` : undefined,
        notes: index < 14 ? 'Perangkat ajar Matematika Fase B & C siap diverifikasi pengawas' : 'Sedang penyusunan',
        status: index < 14 ? 'LENGKAP' : 'BELUM_LENGKAP',
        supervisorConfirmed: false, // Menunggu konfirmasi pengawas
        supervisorStatus: undefined,
        supervisorFeedback: undefined,
        updatedAt: '2026-08-20'
      });
    });

    // Seed teacher admin records for Dewi Anggraini (t-3) - Perlu Perbaikan
    this.adminItems.forEach((item, index) => {
      const isNeedsRevision = index === 3 || index === 6; // Modul ajar & KKTP
      this.teacherAdminRecords.push({
        id: `tar-t3-${item.id}`,
        educationYearId: activeYearId,
        teacherId: 't-3',
        schoolId: 'sch-1',
        itemId: item.id,
        itemName: item.name,
        isAvailable: index < 12,
        fileName: index < 12 ? `${item.name.replace(/[^a-zA-Z0-9]/g, '_')}_Dewi.pdf` : undefined,
        notes: index < 12 ? 'Dokumen ajar Bahasa Indonesia Fase B' : 'Belum selesai',
        status: isNeedsRevision ? 'PERLU_REVISI' : index < 12 ? 'LENGKAP' : 'BELUM_LENGKAP',
        verifiedBy: 'Drs. Bambang Hidayat, M.Pd.',
        verifiedAt: '2026-08-10',
        supervisorConfirmed: index < 12 && !isNeedsRevision,
        supervisorScore: isNeedsRevision ? 68 : index < 12 ? 80 : 0,
        supervisorStatus: isNeedsRevision ? 'PERLU_PERBAIKAN' : index < 12 ? 'SESUAI' : 'BELUM_SESUAI',
        supervisorFeedback: isNeedsRevision
          ? 'Perlu melengkapi langkah diferensiasi konten serta kriteria interval ketuntasan KKTP.'
          : index < 12
          ? 'Sesuai dengan standar.'
          : 'Belum diunggah.',
        supervisorEvaluatedBy: 'Drs. Bambang Hidayat, M.Pd.',
        supervisorEvaluatedAt: '2026-08-10',
        updatedAt: '2026-08-10'
      });
    });

    // 7. Modul Ajar (Learning Modules - Link Google Drive)
    this.modules = [
      {
        id: 'mod-1',
        educationYearId: 'ey-2026-1',
        educationYearName: '2026/2027 (Ganjil)',
        teacherId: 't-1',
        teacherName: 'Sumarni, S.Pd.SD.',
        schoolId: 'sch-1',
        schoolName: 'SD Negeri Tinap 3',
        subject: 'IPAS (Ilmu Pengetahuan Alam & Sosial)',
        gradeClass: 'Fase B / Kelas 4',
        semester: '1',
        title: 'Modul Pembelajaran Mendalam: Siklus Hidup Hewan & Pelestarian Alam',
        description: 'Modul ajar mengintegrasikan inkuiri kontekstual, observasi lapangan sekitar sekolah, dan diferensiasi konten/proses.',
        fileUrl: 'https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs/edit?usp=sharing',
        fileName: 'Modul Ajar IPAS Fase B - Sumarni (Google Drive)',
        fileSize: 'Tautan Google Drive',
        fileType: 'link_drive',
        version: 2,
        status: 'DISETUJUI',
        feedback: 'Modul ajar sangat lengkap, diferensiasi dan rubrik penilaian autentik dirancang dengan sangat baik.',
        reviewedBy: 'Hj. Sri Wahyuni, M.Pd.',
        reviewedAt: '2026-08-05',
        uploadedAt: '2026-07-28',
        updatedAt: '2026-08-05',
        history: [
          {
            version: 1,
            fileName: 'Modul Ajar IPAS Fase B v1 (Google Drive)',
            uploadedAt: '2026-07-25',
            status: 'PERLU_REVISI',
            feedback: 'Tolong pertegas asesmen diagnostik di awal topik.'
          },
          {
            version: 2,
            fileName: 'Modul Ajar IPAS Fase B - Sumarni (Google Drive)',
            uploadedAt: '2026-07-28',
            status: 'DISETUJUI',
            feedback: 'Modul ajar sangat lengkap, diferensiasi dan rubrik penilaian autentik dirancang dengan sangat baik.'
          }
        ]
      },
      {
        id: 'mod-2',
        educationYearId: 'ey-2026-1',
        educationYearName: '2026/2027 (Ganjil)',
        teacherId: 't-2',
        teacherName: 'Anwar Fauzi, S.Pd.',
        schoolId: 'sch-1',
        schoolName: 'SD Negeri Tinap 3',
        subject: 'Matematika',
        gradeClass: 'Fase B / Kelas 4',
        semester: '1',
        title: 'Pecahan Senilai dan Operasi Hitung Berbasis Masalah Nyata',
        description: 'Rancangan pembelajaran kontekstual berbasis manipulatif konkret dan simulasi pembagian makanan tradisional.',
        fileUrl: 'https://docs.google.com/document/d/1jYF47aVdE83Pkn12_9K0vYdD_pecahan_senilai/edit?usp=sharing',
        fileName: 'Modul Matematika Pecahan Senilai - Anwar (Google Drive)',
        fileSize: 'Tautan Google Drive',
        fileType: 'link_drive',
        version: 1,
        status: 'DIPERIKSA',
        uploadedAt: '2026-08-10',
        updatedAt: '2026-08-10'
      },
      {
        id: 'mod-3',
        educationYearId: 'ey-2026-1',
        educationYearName: '2026/2027 (Ganjil)',
        teacherId: 't-3',
        teacherName: 'Dewi Anggraini, S.Pd.',
        schoolId: 'sch-1',
        schoolName: 'SD Negeri Tinap 3',
        subject: 'Bahasa Indonesia',
        gradeClass: 'Fase C / Kelas 5',
        semester: '1',
        title: 'Teks Eksplanasi: Memahami Fenomena Cuaca dan Iklim',
        description: 'Eksplorasi membaca kritis dan menyusun teks eksplanasi ilmiah sederhana.',
        fileUrl: 'https://docs.google.com/document/d/1k9B87FzL01_dewi_teks_eksplanasi/edit?usp=sharing',
        fileName: 'Modul Bahasa Indonesia Kelas 5 - Dewi (Google Drive)',
        fileSize: 'Tautan Google Drive',
        fileType: 'link_drive',
        version: 1,
        status: 'PERLU_REVISI',
        feedback: 'Mohon lengkapi rubrik penilaian presentasi kelompok dan lampiran lembar aktivitas murid.',
        reviewedBy: 'Hj. Sri Wahyuni, M.Pd.',
        reviewedAt: '2026-08-12',
        uploadedAt: '2026-08-08',
        updatedAt: '2026-08-12'
      },
      {
        id: 'mod-5',
        educationYearId: 'ey-2026-1',
        educationYearName: '2026/2027 (Ganjil)',
        teacherId: 't-5',
        teacherName: 'Ratna Sari, S.Pd.',
        schoolId: 'sch-2',
        schoolName: 'SD Negeri Tinap 1',
        subject: 'Guru Kelas V',
        gradeClass: 'Fase C / Kelas 5',
        semester: '1',
        title: 'Harmoni dalam Ekosistem dan Tanggung Jawab Lingkungan',
        description: 'Integrasi proyek pembelajaran mendalam aksi nyata penyelamatan lingkungan sekolah.',
        fileUrl: 'https://docs.google.com/document/d/1rTN892bV_ratna_ekosistem_v/edit?usp=sharing',
        fileName: 'Modul Ekosistem Lingkungan - Ratna Sari (Google Drive)',
        fileSize: 'Tautan Google Drive',
        fileType: 'link_drive',
        version: 1,
        status: 'DISETUJUI',
        reviewedBy: 'Drs. Agus Priyanto, M.Pd.',
        reviewedAt: '2026-08-02',
        uploadedAt: '2026-07-29',
        updatedAt: '2026-08-02'
      },
      {
        id: 'mod-8',
        educationYearId: 'ey-2026-1',
        educationYearName: '2026/2027 (Ganjil)',
        teacherId: 't-8',
        teacherName: 'Rizky Ramadhan, M.Pd.',
        schoolId: 'sch-3',
        schoolName: 'SMP Negeri 1 Sukamaju',
        subject: 'IPA Terpadu',
        gradeClass: 'Fase D / Kelas 8',
        semester: '1',
        title: 'Sistem Pencernaan Manusia dan Nutrisi Sehat Generasi Z',
        description: 'Pembelajaran berbasis inkuiri laboratorium dan audit bekal makanan sehat murid.',
        fileUrl: 'https://docs.google.com/document/d/1rzK9038v_rizky_pencernaan_smp/edit?usp=sharing',
        fileName: 'Modul IPA Pencernaan - Rizky Ramadhan (Google Drive)',
        fileSize: 'Tautan Google Drive',
        fileType: 'link_drive',
        version: 1,
        status: 'DISETUJUI',
        reviewedBy: 'Budi Santoso, S.Pd., M.M.',
        reviewedAt: '2026-08-04',
        uploadedAt: '2026-08-01',
        updatedAt: '2026-08-04'
      }
    ];

    // 8. Mindset Instruments
    this.mindsetInstruments = [
      {
        id: 'mi-1',
        indicator: 'Keyakinan terhadap Potensi Belajar Seluruh Murid',
        statement: 'Guru meyakini bahwa kecerdasan dan kemampuan setiap siswa dapat terus bertumbuh melalui usaha, strategi belajar, dan umpan balik yang tepat.',
        weight: 20,
        category: 'Kepercayaan Diri & Potensi'
      },
      {
        id: 'mi-2',
        indicator: 'Penerimaan terhadap Tantangan & Perubahan Kurikulum',
        statement: 'Guru antusias mencoba metode inovatif, memanfaatkan media digital, dan memandang perubahan kurikulum sebagai peluang mengembangkan kompetensi profesional.',
        weight: 20,
        category: 'Adaptabilitas'
      },
      {
        id: 'mi-3',
        indicator: 'Sikap terhadap Kesalahan & Kegagalan Belajar',
        statement: 'Guru memandang kesalahan siswa maupun kendala mengajarnya sendiri sebagai bahan refleksi berharga untuk perbaikan, bukan sebagai vonis ketidakmampuan.',
        weight: 20,
        category: 'Reflektif & Resiliensi'
      },
      {
        id: 'mi-4',
        indicator: 'Keterbukaan terhadap Umpan Balik & Kolaborasi',
        statement: 'Guru aktif berdiskusi dalam komunitas belajar (Kombel), meminta saran dari rekan sejawat/kepala sekolah, dan mengimplementasikan masukan tersebut.',
        weight: 20,
        category: 'Kolaborasi & Pembelajar Sepanjang Hayat'
      },
      {
        id: 'mi-5',
        indicator: 'Fokus pada Usaha, Proses, dan Strategi Belajar',
        statement: 'Guru memberikan apresiasi spesifik pada proses berpikir, ketekunan, dan strategi siswa daripada sekadar memuji hasil akhir nilai angka.',
        weight: 20,
        category: 'Apresiasi & Penilaian'
      }
    ];

    // Seed Mindset Assessments
    this.mindsetAssessments = [
      {
        id: 'ma-1',
        educationYearId: 'ey-2026-1',
        teacherId: 't-1',
        teacherName: 'Sumarni, S.Pd.SD.',
        schoolId: 'sch-1',
        schoolName: 'SD Negeri Tinap 3',
        evaluatedById: 'u-ks-1',
        evaluatedByName: 'Hj. Sri Wahyuni, M.Pd.',
        evaluatedAt: '2026-08-10',
        answers: [
          { instrumentId: 'mi-1', statement: this.mindsetInstruments[0].statement, score: 4, maxScore: 4, notes: 'Sangat konsisten memfasilitasi murid yang lambat belajar dengan penuh kesabaran.' },
          { instrumentId: 'mi-2', statement: this.mindsetInstruments[1].statement, score: 4, maxScore: 4, notes: 'Aktif memanfaatkan media interaktif dan modul ajar terdiferensiasi.' },
          { instrumentId: 'mi-3', statement: this.mindsetInstruments[2].statement, score: 3, maxScore: 4, notes: 'Selalu membuat catatan refleksi mingguan di akhir pembelajaran.' },
          { instrumentId: 'mi-4', statement: this.mindsetInstruments[3].statement, score: 4, maxScore: 4, notes: 'Menjadi penggerak komunitas praktisi guru di gugus sekolah.' },
          { instrumentId: 'mi-5', statement: this.mindsetInstruments[4].statement, score: 4, maxScore: 4, notes: 'Umpan balik formatif sangat mendalam dan memotivasi anak.' }
        ],
        totalScore: 19,
        maxScore: 20,
        percentage: 95,
        category: 'Pola Pikir Berkembang',
        principalNotes: 'Ibu Sumarni menunjukkan keteladanan yang sangat tinggi dalam kepemimpinan pembelajaran. Pola pikir bertumbuh sangat terinternalisasi.',
        recommendations: [
          'Diberdayakan menjadi guru model dan narasumber berbagi praktik baik di forum KKG Gugus.',
          'Didorong untuk membimbing guru junior dalam penyusunan modul ajar mendalam.'
        ]
      },
      {
        id: 'ma-2',
        educationYearId: 'ey-2026-1',
        teacherId: 't-3',
        teacherName: 'Dewi Anggraini, S.Pd.',
        schoolId: 'sch-1',
        schoolName: 'SD Negeri Tinap 3',
        evaluatedById: 'u-ks-1',
        evaluatedByName: 'Hj. Sri Wahyuni, M.Pd.',
        evaluatedAt: '2026-08-11',
        answers: [
          { instrumentId: 'mi-1', statement: this.mindsetInstruments[0].statement, score: 3, maxScore: 4, notes: 'Mulai memahami diferensiasi namun masih membutuhkan pendampingan teknis.' },
          { instrumentId: 'mi-2', statement: this.mindsetInstruments[1].statement, score: 3, maxScore: 4, notes: 'Cukup antusias namun kadang cemas dengan beban administrasi.' },
          { instrumentId: 'mi-3', statement: this.mindsetInstruments[2].statement, score: 2, maxScore: 4, notes: 'Masih perlu penguatan dalam mengolah kesalahan siswa menjadi topik diskusi terbuka.' },
          { instrumentId: 'mi-4', statement: this.mindsetInstruments[3].statement, score: 3, maxScore: 4, notes: 'Terbuka menerima masukan supervisi klinis.' },
          { instrumentId: 'mi-5', statement: this.mindsetInstruments[4].statement, score: 3, maxScore: 4, notes: 'Pemberian apresiasi sudah baik.' }
        ],
        totalScore: 14,
        maxScore: 20,
        percentage: 70,
        category: 'Pola Pikir Berkembang dengan Pendampingan',
        principalNotes: 'Ibu Dewi memiliki potensi besar, perlu pendampingan berkelanjutan melalui coaching dan supervisi klinis berkala.',
        recommendations: [
          'Ikut serta dalam sesi coaching bersama Kepala Sekolah dan Guru Senior.',
          'Fokus penguatan pada instrumen rubrik penilaian proses dan manajemen kelas aktif.'
        ]
      }
    ];

    // 9. Deep Learning (Pembelajaran Mendalam) Aspects & Assessments
    this.deepLearningAspects = [
      {
        id: 'pm-1',
        name: 'Pembelajaran Berkesadaran (Mindful Learning)',
        description: 'Menciptakan ruang belajar di mana siswa hadir utuh, fokus, dan sadar akan tujuan serta makna apa yang dipelajari.',
        indicators: [
          { id: 'pmi-1-1', name: 'Kehadiran Penuh & Kesiapan Emosional Siswa', criteria: 'Aktivitas awal membangkitkan kesadaran dan ketenangan belajar.' },
          { id: 'pmi-1-2', name: 'Penjelasan Tujuan Belajar yang Jelas & Relevan', criteria: 'Siswa memahami mengapa materi ini penting bagi kehidupan mereka.' }
        ]
      },
      {
        id: 'pm-2',
        name: 'Pembelajaran Bermakna (Meaningful Learning)',
        description: 'Menghubungkan konsep baru dengan pengetahuan awal siswa dan pengalaman dunia nyata secara mendalam.',
        indicators: [
          { id: 'pmi-2-1', name: 'Koneksi Konseptual & Kontekstual', criteria: 'Menyajikan analogi, studi kasus nyata, atau masalah otentik lingkungan.' },
          { id: 'pmi-2-2', name: 'Kedalaman Pemahaman (Beyond Rote Learning)', criteria: 'Mendorong siswa menjelaskan konsep dengan kata-kata sendiri.' }
        ]
      },
      {
        id: 'pm-3',
        name: 'Pembelajaran Menggembirakan (Joyful Learning)',
        description: 'Suasana kelas yang aman secara psikologis, interaktif, penuh eksplorasi, dan memicu rasa ingin tahu alami.',
        indicators: [
          { id: 'pmi-3-1', name: 'Variasi Metode Aktif & Menyenangkan', criteria: 'Penggunaan simulasi, permainan edukatif, debat santai, atau eksperimen.' },
          { id: 'pmi-3-2', name: 'Iklim Kelas Positif & Inklusif', criteria: 'Tidak ada perundungan atau cemoohan saat ada siswa yang keliru.' }
        ]
      },
      {
        id: 'pm-4',
        name: 'Pemahaman Konsep Esensial',
        description: 'Penguasaan struktur inti keilmuan bukan sekadar menghafal fakta parsial.',
        indicators: [
          { id: 'pmi-4-1', name: 'Penguasaan Big Ideas & Core Concepts', criteria: 'Siswa dapat membuat peta konsep atau inferensi antar-topik.' }
        ]
      },
      {
        id: 'pm-5',
        name: 'Keterlibatan Aktif Siswa (Student Agency)',
        description: 'Siswa memiliki suara (voice), pilihan (choice), dan kepemilikan (ownership) dalam proses belajarnya.',
        indicators: [
          { id: 'pmi-5-1', name: 'Aktivitas Berpusat pada Murid (Student-Centered)', criteria: 'Guru bertindak sebagai fasilitator, siswa aktif mengeksplorasi.' }
        ]
      },
      {
        id: 'pm-6',
        name: 'Refleksi Berkelanjutan',
        description: 'Membiasakan proses metakognisi agar siswa memonitor cara belajar mereka sendiri.',
        indicators: [
          { id: 'pmi-6-1', name: 'Aktivitas Refleksi di Akhir Sesi', criteria: 'Pertanyaan pemantik metakognitif (apa yang dipahami, apa yang masih membingungkan).' }
        ]
      },
      {
        id: 'pm-7',
        name: 'Kolaborasi dan Komunikasi Efektif',
        description: 'Kerja tim yang saling memberdayakan dan kemampuan menyampaikan argumen secara santun.',
        indicators: [
          { id: 'pmi-7-1', name: 'Dinamika Kelompok Gotong Royong', criteria: 'Peran anggota kelompok jelas dan saling mendukung.' }
        ]
      },
      {
        id: 'pm-8',
        name: 'Kontekstualisasi & Relevansi Lokal',
        description: 'Pemanfaatan kearifan lokal dan isu lingkungan sekitar sebagai laboratorium belajar.',
        indicators: [
          { id: 'pmi-8-1', name: 'Integrasi Potensi Daerah', criteria: 'Mengkaitkan materi dengan potensi pertanian, sejarah, atau budaya Magetan.' }
        ]
      },
      {
        id: 'pm-9',
        name: 'Asesmen Autentik & Umpan Balik Kualitatif',
        description: 'Penilaian yang mengukur keterampilan nyata dan memberikan masukan konstruktif langsung.',
        indicators: [
          { id: 'pmi-9-1', name: 'Penilaian Berbasis Kinerja / Portofolio', criteria: 'Menggunakan rubrik yang transparan dan dipahami murid.' }
        ]
      },
      {
        id: 'pm-10',
        name: 'Tindak Lanjut & Diferensiasi Pembelajaran',
        description: 'Penyesuaian kecepatan dan strategi belajar berdasarkan profil dan kebutuhan masing-masing siswa.',
        indicators: [
          { id: 'pmi-10-1', name: 'Rencana Perbaikan & Pengayaan Terarah', criteria: 'Guru menyediakan scaffolding sesuai tingkat kesiapan anak.' }
        ]
      }
    ];

    // Seed Deep Learning Assessments
    this.deepLearningAssessments = [
      {
        id: 'dla-1',
        educationYearId: 'ey-2026-1',
        teacherId: 't-1',
        teacherName: 'Sumarni, S.Pd.SD.',
        schoolId: 'sch-1',
        subject: 'IPAS (Fase B)',
        evaluatedById: 'u-ks-1',
        evaluatedByName: 'Hj. Sri Wahyuni, M.Pd.',
        aspectScores: [
          { aspectId: 'pm-1', aspectName: 'Pembelajaran Berkesadaran', averageScore: 95, notes: 'Sangat baik dalam teknik STOP dan pemusatan perhatian di awal jam.' },
          { aspectId: 'pm-2', aspectName: 'Pembelajaran Bermakna', averageScore: 92, notes: 'Koneksi dengan siklus hidup kupu-kupu di taman sekolah sangat otentik.' },
          { aspectId: 'pm-3', aspectName: 'Pembelajaran Menggembirakan', averageScore: 96, notes: 'Anak-anak sangat antusias dan gembira selama investigasi kelompok.' },
          { aspectId: 'pm-4', aspectName: 'Pemahaman Konsep Esensial', averageScore: 90, notes: 'Penguasaan konsep metamorfosis sangat mendalam.' },
          { aspectId: 'pm-5', aspectName: 'Keterlibatan Aktif Siswa', averageScore: 94, notes: '90% durasi diisi oleh keaktifan dialog dan karya murid.' },
          { aspectId: 'pm-6', aspectName: 'Refleksi Berkelanjutan', averageScore: 88, notes: 'Jurnal refleksi diisi dengan jujur oleh seluruh murid.' },
          { aspectId: 'pm-7', aspectName: 'Kolaborasi & Komunikasi', averageScore: 92, notes: 'Presentasi poster kelompok berlangsung hidup dan saling apresiasi.' },
          { aspectId: 'pm-8', aspectName: 'Kontekstualisasi & Kearifan Lokal', averageScore: 95, notes: 'Mengaitkan dengan lingkungan agraris lokal Sukomoro.' },
          { aspectId: 'pm-9', aspectName: 'Asesmen Autentik', averageScore: 90, notes: 'Rubrik penilaian poster & penjelasan lisan sangat terstruktur.' },
          { aspectId: 'pm-10', aspectName: 'Tindak Lanjut & Diferensiasi', averageScore: 88, notes: 'Siswa yang belum lancar membaca dibantu media gambar bersuara.' }
        ],
        overallScore: 92,
        overallLevel: 'Mahir',
        notes: 'Implementasi Pembelajaran Mendalam (PM) sangat menginspirasi. Menjadi rujukan terbaik untuk kelas lain.',
        createdAt: '2026-08-14'
      }
    ];

    // 10. Supervision Requests & Schedules
    this.supervisionRequests = [
      {
        id: 'sup-1',
        educationYearId: 'ey-2026-1',
        educationYearName: '2026/2027 (Ganjil)',
        schoolId: 'sch-1',
        schoolName: 'SD Negeri Tinap 3',
        teacherId: 't-1',
        teacherName: 'Sumarni, S.Pd.SD.',
        subject: 'IPAS (Fase B / Kelas 4)',
        gradeClass: 'Kelas 4A',
        supervisionType: 'Supervisi Tematik Pembelajaran Mendalam',
        proposedDate1: '2026-08-25',
        proposedTime1: '08:00 - 09:30',
        proposedDate2: '2026-08-27',
        proposedTime2: '08:00 - 09:30',
        approvedDate: '2026-08-25',
        approvedTime: '08:00 - 09:30',
        location: 'Ruang Kelas 4A SDN Tinap 3',
        notes: 'Fokus supervisi pada observasi integrasi Pembelajaran Berkesadaran dan diferensiasi konten.',
        supportingDocName: 'Modul_Ajar_IPAS_FaseB_Sumarni.pdf',
        status: 'DISETUJUI',
        supervisorId: 'sp-1',
        supervisorName: 'Drs. H. Bambang Sutrisno, M.Pd.',
        supervisorNotes: 'Jadwal disetujui pada alternatif 1. Dokumen modul ajar sudah saya pelajari dan sangat baik.',
        createdById: 'u-ks-1',
        createdByName: 'Hj. Sri Wahyuni, M.Pd.',
        submittedAt: '2026-08-12 09:00',
        reviewedAt: '2026-08-13 14:20',
        reportedToDinasAt: '2026-08-13 14:20'
      },
      {
        id: 'sup-2',
        educationYearId: 'ey-2026-1',
        educationYearName: '2026/2027 (Ganjil)',
        schoolId: 'sch-1',
        schoolName: 'SD Negeri Tinap 3',
        teacherId: 't-2',
        teacherName: 'Anwar Fauzi, S.Pd.',
        subject: 'Matematika (Kelas 4)',
        gradeClass: 'Kelas 4B',
        supervisionType: 'Supervisi Klinis',
        proposedDate1: '2026-08-28',
        proposedTime1: '09:45 - 11:15',
        proposedDate2: '2026-08-29',
        proposedTime2: '08:00 - 09:30',
        location: 'Ruang Kelas 4B SDN Tinap 3',
        notes: 'Supervisi pendalaman konsep pecahan dengan alat peraga benda konkret.',
        status: 'DIAJUKAN',
        supervisorId: 'sp-1',
        supervisorName: 'Drs. H. Bambang Sutrisno, M.Pd.',
        createdById: 'u-ks-1',
        createdByName: 'Hj. Sri Wahyuni, M.Pd.',
        submittedAt: '2026-08-18 11:30'
      },
      {
        id: 'sup-3',
        educationYearId: 'ey-2026-1',
        educationYearName: '2026/2027 (Ganjil)',
        schoolId: 'sch-1',
        schoolName: 'SD Negeri Tinap 3',
        teacherId: 't-3',
        teacherName: 'Dewi Anggraini, S.Pd.',
        subject: 'Bahasa Indonesia (Kelas 5)',
        gradeClass: 'Kelas 5',
        supervisionType: 'Supervisi Terencana',
        proposedDate1: '2026-09-02',
        proposedTime1: '08:00 - 09:30',
        location: 'Ruang Kelas 5 SDN Tinap 3',
        notes: 'Observasi literasi membaca dan menyusun teks eksplanasi.',
        status: 'PERLU_REVISI',
        rejectionReason: 'Mohon ajukan alternatif tanggal lain karena pada tanggal 2 September bertepatan dengan Rapat Koordinasi MKPS di Dinas.',
        supervisorId: 'sp-1',
        supervisorName: 'Drs. H. Bambang Sutrisno, M.Pd.',
        createdById: 'u-ks-1',
        createdByName: 'Hj. Sri Wahyuni, M.Pd.',
        submittedAt: '2026-08-15 10:00',
        reviewedAt: '2026-08-16 16:45'
      },
      {
        id: 'sup-5',
        educationYearId: 'ey-2026-1',
        educationYearName: '2026/2027 (Ganjil)',
        schoolId: 'sch-2',
        schoolName: 'SD Negeri Tinap 1',
        teacherId: 't-5',
        teacherName: 'Ratna Sari, S.Pd.',
        subject: 'Guru Kelas V (IPA/IPS)',
        gradeClass: 'Kelas 5',
        supervisionType: 'Supervisi Tematik Pembelajaran Mendalam',
        proposedDate1: '2026-08-26',
        proposedTime1: '08:00 - 09:30',
        approvedDate: '2026-08-26',
        approvedTime: '08:00 - 09:30',
        location: 'Ruang Kelas 5 SDN Tinap 1',
        notes: 'Penerapan proyek belajar ramah lingkungan.',
        status: 'DISETUJUI',
        supervisorId: 'sp-1',
        supervisorName: 'Drs. H. Bambang Sutrisno, M.Pd.',
        supervisorNotes: 'Disetujui. Siapkan lembar observasi siswa.',
        createdById: 'u-ks-2',
        createdByName: 'Drs. Agus Priyanto, M.Pd.',
        submittedAt: '2026-08-10 08:30',
        reviewedAt: '2026-08-11 11:00',
        reportedToDinasAt: '2026-08-11 11:00'
      },
      {
        id: 'sup-6',
        educationYearId: 'ey-2026-1',
        educationYearName: '2026/2027 (Ganjil)',
        schoolId: 'sch-2',
        schoolName: 'SD Negeri Tinap 1',
        teacherId: 't-6',
        teacherName: 'Hadi Gunawan, S.Pd.',
        subject: 'Pendidikan Pancasila',
        gradeClass: 'Kelas 6',
        supervisionType: 'Supervisi Terencana',
        proposedDate1: '2026-08-08',
        proposedTime1: '08:00 - 09:30',
        approvedDate: '2026-08-08',
        approvedTime: '08:00 - 09:30',
        location: 'Ruang Kelas 6 SDN Tinap 1',
        notes: 'Supervisi tatap muka awal semester.',
        status: 'DISETUJUI',
        supervisorId: 'sp-1',
        supervisorName: 'Drs. H. Bambang Sutrisno, M.Pd.',
        createdById: 'u-ks-2',
        createdByName: 'Drs. Agus Priyanto, M.Pd.',
        submittedAt: '2026-08-01 09:00',
        reviewedAt: '2026-08-02 10:00',
        reportedToDinasAt: '2026-08-02 10:00',
        isCompleted: true,
        completionScore: 95,
        completionNotes: 'Pelaksanaan supervisi berjalan sangat lancar. Guru menguasai kelas dan materi Pancasila dengan sangat interaktif.'
      },
      {
        id: 'sup-8',
        educationYearId: 'ey-2026-1',
        educationYearName: '2026/2027 (Ganjil)',
        schoolId: 'sch-3',
        schoolName: 'SMP Negeri 1 Sukamaju',
        teacherId: 't-8',
        teacherName: 'Rizky Ramadhan, M.Pd.',
        subject: 'IPA Terpadu (Kelas 8)',
        gradeClass: 'Kelas 8B',
        supervisionType: 'Supervisi Tematik Pembelajaran Mendalam',
        proposedDate1: '2026-08-30',
        proposedTime1: '10:00 - 11:30',
        approvedDate: '2026-08-30',
        approvedTime: '10:00 - 11:30',
        location: 'Laboratorium IPA SMPN 1 Sukamaju',
        notes: 'Praktikum uji zat makanan dengan pendekatan kontekstual dan refleksi.',
        status: 'DISETUJUI',
        supervisorId: 'sp-2',
        supervisorName: 'Dr. Hj. Siti Rohmah, M.Pd.',
        supervisorNotes: 'Disetujui. Saya akan hadir langsung ke Lab IPA.',
        createdById: 'u-ks-3',
        createdByName: 'Budi Santoso, S.Pd., M.M.',
        submittedAt: '2026-08-14 13:00',
        reviewedAt: '2026-08-15 09:15',
        reportedToDinasAt: '2026-08-15 09:15'
      }
    ];

    // 11. Teacher Mutations History
    this.mutations = [
      {
        id: 'mut-1',
        teacherId: 't-1',
        teacherName: 'Sumarni, S.Pd.SD.',
        teacherNip: '198504152009022007',
        fromSchoolId: 'sch-2',
        fromSchoolName: 'SD Negeri Tinap 1',
        toSchoolId: 'sch-1',
        toSchoolName: 'SD Negeri Tinap 3',
        mutationDate: '2022-07-01',
        skNumber: '824/SK-MUT/DISDIK/2022',
        reason: 'Pemerataan Tenaga Pendidik Unggulan & Guru Penggerak di Kecamatan Sukomoro',
        notes: 'Tugas tambahan sebagai Koordinator Kurikulum Sekolah',
        createdBy: 'Admin Dinas Pendidikan',
        createdAt: '2022-07-01'
      },
      {
        id: 'mut-2',
        teacherId: 't-4',
        teacherName: 'Eko Prasetyo, S.Pd.Jas.',
        teacherNip: '199006182014021003',
        fromSchoolId: 'sch-3',
        fromSchoolName: 'SMP Negeri 1 Sukamaju',
        toSchoolId: 'sch-1',
        toSchoolName: 'SD Negeri Tinap 3',
        mutationDate: '2024-01-02',
        skNumber: '824/SK-MUT/DISDIK/2024',
        reason: 'Penyesuaian kebutuhan formasi guru PJOK tingkat dasar',
        notes: 'Mutasi disetujui Kepala Dinas',
        createdBy: 'Admin Dinas Pendidikan',
        createdAt: '2024-01-02'
      }
    ];

    // 12. Notifications
    this.notifications = [
      {
        id: 'notif-1',
        userId: 'u-guru-1',
        title: 'Jadwal Supervisi Disetujui',
        message: 'Pengawas Drs. H. Bambang Sutrisno, M.Pd. telah menyetujui jadwal supervisi Anda pada tanggal 25 Agustus 2026 (08:00 WIB).',
        type: 'success',
        link: '/jadwal-supervisi',
        isRead: false,
        createdAt: '2026-08-13 14:21'
      },
      {
        id: 'notif-2',
        userId: 'u-guru-1',
        title: 'Modul Ajar Terverifikasi',
        message: 'Modul Ajar IPAS Fase B Anda telah disetujui oleh Kepala Sekolah.',
        type: 'success',
        link: '/modul-ajar',
        isRead: true,
        createdAt: '2026-08-05 10:15'
      },
      {
        id: 'notif-3',
        userId: 'u-ks-1',
        title: 'Pemberitahuan Persetujuan Supervisi',
        message: 'Pengajuan supervisi untuk Ibu Sumarni telah disetujui oleh Pengawas Bina.',
        type: 'info',
        link: '/kalender-supervisi',
        isRead: false,
        createdAt: '2026-08-13 14:20'
      },
      {
        id: 'notif-4',
        userId: 'u-pengawas-1',
        title: 'Pengajuan Jadwal Supervisi Baru',
        message: 'SD Negeri Tinap 3 mengajukan jadwal supervisi untuk Anwar Fauzi, S.Pd. (Matematika).',
        type: 'warning',
        link: '/persetujuan-supervisi',
        isRead: false,
        createdAt: '2026-08-18 11:30'
      },
      {
        id: 'notif-5',
        userId: 'u-dinas',
        title: 'Laporan Jadwal Supervisi Masuk',
        message: 'Terdapat jadwal supervisi baru yang telah disetujui Pengawas untuk SD Negeri Tinap 3 dan SD Negeri Tinap 1.',
        type: 'info',
        link: '/kalender-dinas',
        isRead: false,
        createdAt: '2026-08-13 14:22'
      }
    ];

    // 13. Audit Logs
    this.auditLogs = [
      {
        id: 'log-1',
        userId: 'u-dinas',
        userName: 'Didik Setiawan, S.E',
        userRole: 'ADMIN_DINAS',
        activity: 'Aktivasi Tahun Pelaksanaan',
        details: 'Menetapkan Tahun Ajaran 2026/2027 Ganjil sebagai periode supervisi aktif.',
        ipAddress: '192.168.1.10',
        timestamp: '2026-07-15 08:30:12'
      },
      {
        id: 'log-2',
        userId: 'u-guru-1',
        userName: 'Sumarni, S.Pd.SD.',
        userRole: 'GURU',
        activity: 'Upload Modul Ajar Revisi',
        details: 'Mengunggah versi 2 Modul Ajar IPAS Fase B Siklus Hidup Hewan.',
        ipAddress: '192.168.1.45',
        timestamp: '2026-07-28 10:14:05'
      },
      {
        id: 'log-3',
        userId: 'u-ks-1',
        userName: 'Hj. Sri Wahyuni, M.Pd.',
        userRole: 'KEPALA_SEKOLAH',
        activity: 'Verifikasi Modul Ajar',
        details: 'Menyetujui Modul Ajar IPAS Fase B milik Sumarni, S.Pd.SD.',
        ipAddress: '192.168.1.18',
        timestamp: '2026-08-05 10:15:22'
      },
      {
        id: 'log-4',
        userId: 'u-ks-1',
        userName: 'Hj. Sri Wahyuni, M.Pd.',
        userRole: 'KEPALA_SEKOLAH',
        activity: 'Pemetaan Pola Pikir Guru',
        details: 'Menyelesaikan instrumen penilaian pola pikir untuk Sumarni, S.Pd.SD. (Skor 95% - Pola Pikir Berkembang).',
        ipAddress: '192.168.1.18',
        timestamp: '2026-08-10 14:02:11'
      },
      {
        id: 'log-5',
        userId: 'u-ks-1',
        userName: 'Hj. Sri Wahyuni, M.Pd.',
        userRole: 'KEPALA_SEKOLAH',
        activity: 'Pengajuan Jadwal Supervisi',
        details: 'Mengajukan jadwal supervisi untuk Sumarni, S.Pd.SD. ke Pengawas Bina.',
        ipAddress: '192.168.1.18',
        timestamp: '2026-08-12 09:00:30'
      },
      {
        id: 'log-6',
        userId: 'u-pengawas-1',
        userName: 'Drs. H. Bambang Sutrisno, M.Pd.',
        userRole: 'PENGAWAS',
        activity: 'Persetujuan Jadwal Supervisi',
        details: 'Menyetujui jadwal supervisi Sumarni, S.Pd.SD. untuk tanggal 25 Agustus 2026.',
        ipAddress: '192.168.1.22',
        timestamp: '2026-08-13 14:20:00'
      },
      {
        id: 'log-7',
        userId: 'u-ks-1',
        userName: 'Hj. Sri Wahyuni, M.Pd.',
        userRole: 'KEPALA_SEKOLAH',
        activity: 'Asesmen Pembelajaran Mendalam',
        details: 'Menyelesaikan evaluasi 10 aspek Pembelajaran Mendalam untuk Sumarni, S.Pd.SD. (Kategori: Mahir, Skor 92).',
        ipAddress: '192.168.1.18',
        timestamp: '2026-08-14 11:25:40'
      }
    ];
  }

  // Audit helper
  addAuditLog(userId: string, userName: string, userRole: any, activity: string, details: string, ipAddress = '127.0.0.1') {
    this.auditLogs.unshift({
      id: `log-${Date.now()}`,
      userId,
      userName,
      userRole,
      activity,
      details,
      ipAddress,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19)
    });
  }

  // Notification helper
  addNotification(userId: string, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error', link?: string) {
    this.notifications.unshift({
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId,
      title,
      message,
      type,
      link,
      isRead: false,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    });
  }
}

export const db = new DatabaseStore();
