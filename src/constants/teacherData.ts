export interface SubjectOption {
  code: string;
  name: string;
  fullName: string;
  category: 'Wajib' | 'Muatan Lokal' | 'Peminatan' | 'Layanan';
  color: string;
}

export const TEACHER_TYPES = ['Guru Kelas', 'Guru Mapel'] as const;
export type TeacherType = (typeof TEACHER_TYPES)[number];

// Mata Pelajaran resmi sesuai permintaan dinas
export const GURU_MAPEL_LIST: SubjectOption[] = [
  {
    code: 'PAI',
    name: 'PAI',
    fullName: 'Pendidikan Agama Islam & Budi Pekerti',
    category: 'Wajib',
    color: 'emerald'
  },
  {
    code: 'PJOK',
    name: 'PJOK',
    fullName: 'Pendidikan Jasmani, Olahraga, dan Kesehatan',
    category: 'Wajib',
    color: 'orange'
  },
  {
    code: 'IPA',
    name: 'IPA',
    fullName: 'Ilmu Pengetahuan Alam',
    category: 'Wajib',
    color: 'cyan'
  },
  {
    code: 'IPS',
    name: 'IPS',
    fullName: 'Ilmu Pengetahuan Sosial',
    category: 'Wajib',
    color: 'amber'
  },
  {
    code: 'IPAS',
    name: 'IPAS',
    fullName: 'Ilmu Pengetahuan Alam dan Sosial (IPAS)',
    category: 'Wajib',
    color: 'teal'
  },
  {
    code: 'Matematika',
    name: 'Matematika',
    fullName: 'Matematika',
    category: 'Wajib',
    color: 'blue'
  },
  {
    code: 'Pendidikan Pancasila',
    name: 'Pendidikan Pancasila',
    fullName: 'Pendidikan Pancasila / PPKn',
    category: 'Wajib',
    color: 'red'
  },
  {
    code: 'TIK',
    name: 'TIK',
    fullName: 'Teknologi Informasi dan Komunikasi / Informatika',
    category: 'Wajib',
    color: 'indigo'
  },
  {
    code: 'KKA',
    name: 'KKA',
    fullName: 'Koding & Kecerdasan Artifisial / Keterampilan Kerja',
    category: 'Peminatan',
    color: 'violet'
  },
  {
    code: 'Bahasa Inggris',
    name: 'Bahasa Inggris',
    fullName: 'Bahasa Inggris',
    category: 'Wajib',
    color: 'purple'
  },
  {
    code: 'Bahasa Jawa',
    name: 'Bahasa Jawa',
    fullName: 'Bahasa Jawa (Mulok Daerah)',
    category: 'Muatan Lokal',
    color: 'amber'
  },
  {
    code: 'Muatan Lokal',
    name: 'Muatan Lokal',
    fullName: 'Muatan Lokal Potensi Daerah',
    category: 'Muatan Lokal',
    color: 'lime'
  },
  {
    code: 'BK',
    name: 'BK',
    fullName: 'Bimbingan dan Konseling (Konselor Sekolah)',
    category: 'Layanan',
    color: 'pink'
  },
  {
    code: 'Bahasa Indonesia',
    name: 'Bahasa Indonesia',
    fullName: 'Bahasa Indonesia',
    category: 'Wajib',
    color: 'rose'
  },
  {
    code: 'Seni Budaya',
    name: 'Seni Budaya',
    fullName: 'Seni Budaya dan Prakarya (SBdP)',
    category: 'Wajib',
    color: 'fuchsia'
  }
];

export const CLASS_GRADES = [
  'Kelas 1',
  'Kelas 2',
  'Kelas 3',
  'Kelas 4',
  'Kelas 5',
  'Kelas 6',
  'Kelas 7',
  'Kelas 8',
  'Kelas 9',
  'Kelompok A (PAUD/TK)',
  'Kelompok B (PAUD/TK)'
] as const;

/**
 * Determine teacher type from subject string if teacherType is not explicitly set
 */
export function detectTeacherType(subjectStr?: string, explicitType?: string): 'Guru Kelas' | 'Guru Mapel' {
  if (explicitType === 'Guru Kelas' || explicitType === 'Guru Mapel') {
    return explicitType;
  }
  if (!subjectStr) return 'Guru Kelas';

  const lower = subjectStr.toLowerCase().trim();
  if (lower.includes('kelas') || lower.includes('tematik') || lower === 'guru kelas' || lower.startsWith('wali')) {
    return 'Guru Kelas';
  }

  // Check mapel codes
  for (const m of GURU_MAPEL_LIST) {
    if (lower === m.code.toLowerCase() || lower.includes(m.name.toLowerCase())) {
      return 'Guru Mapel';
    }
  }

  return 'Guru Mapel';
}

/**
 * Normalizes subject name to standard mapel option if matched
 */
export function normalizeSubjectName(val: string): { normalized: string; type: 'Guru Kelas' | 'Guru Mapel' } {
  if (!val || typeof val !== 'string') {
    return { normalized: 'Guru Kelas', type: 'Guru Kelas' };
  }

  const clean = val.trim();
  const lower = clean.toLowerCase();

  if (lower.includes('kelas') || lower === 'guru kelas' || lower.includes('tematik')) {
    return { normalized: clean, type: 'Guru Kelas' };
  }

  // Check mapel matches
  for (const m of GURU_MAPEL_LIST) {
    if (lower === m.code.toLowerCase() || lower === m.fullName.toLowerCase()) {
      return { normalized: m.name, type: 'Guru Mapel' };
    }
  }

  // Specific common aliases
  if (lower.includes('agama') || lower.includes('islam') || lower === 'pai') {
    return { normalized: 'PAI', type: 'Guru Mapel' };
  }
  if (lower.includes('olahraga') || lower.includes('penjas') || lower === 'pjok') {
    return { normalized: 'PJOK', type: 'Guru Mapel' };
  }
  if (lower.includes('pancasila') || lower.includes('ppkn') || lower.includes('pkn')) {
    return { normalized: 'Pendidikan Pancasila', type: 'Guru Mapel' };
  }
  if (lower.includes('informatika') || lower.includes('komputer') || lower === 'tik') {
    return { normalized: 'TIK', type: 'Guru Mapel' };
  }
  if (lower.includes('koding') || lower.includes('ai') || lower === 'kka') {
    return { normalized: 'KKA', type: 'Guru Mapel' };
  }
  if (lower.includes('konseling') || lower === 'bk') {
    return { normalized: 'BK', type: 'Guru Mapel' };
  }
  if (lower.includes('jawa')) {
    return { normalized: 'Bahasa Jawa', type: 'Guru Mapel' };
  }
  if (lower.includes('inggris')) {
    return { normalized: 'Bahasa Inggris', type: 'Guru Mapel' };
  }
  if (lower.includes('mulok') || lower.includes('muatan lokal')) {
    return { normalized: 'Muatan Lokal', type: 'Guru Mapel' };
  }

  return { normalized: clean, type: 'Guru Mapel' };
}
