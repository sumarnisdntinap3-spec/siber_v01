import * as XLSX from 'xlsx';
import { Teacher, School } from '../types';
import { GURU_MAPEL_LIST, detectTeacherType, normalizeSubjectName } from '../constants/teacherData';

export interface ParsedTeacherRow {
  rowNumber: number;
  nip: string;
  name: string;
  teacherType: 'Guru Kelas' | 'Guru Mapel';
  subject: string;
  classGrade?: string;
  schoolId: string;
  schoolName: string;
  gender: 'L' | 'P';
  employmentStatus: string;
  rankGrade: string;
  position: string;
  phone: string;
  email: string;
  nik: string;
  nuptk: string;
  status: 'NEW' | 'UPDATE' | 'INVALID';
  errors: string[];
  warnings: string[];
  original: any;
}

export interface ParseTeacherResult {
  totalRows: number;
  validRows: number;
  newCount: number;
  updateCount: number;
  invalidCount: number;
  rows: ParsedTeacherRow[];
  headersFound: string[];
}

const cleanStr = (val: any): string => {
  if (val === null || val === undefined) return '';
  return String(val).trim();
};

/**
 * Generate and trigger download for Teacher Excel Template
 */
export const downloadTeacherExcelTemplate = () => {
  const headers = [
    'NIP *',
    'Nama Lengkap & Gelar *',
    'Jenis Guru *',
    'Mata Pelajaran / Tugas *',
    'NPSN / Nama Satuan Pendidikan *',
    'Jenis Kelamin',
    'Status Kepegawaian',
    'Pangkat / Golongan',
    'Jabatan',
    'Nomor Telepon / WhatsApp',
    'Email',
    'NIK',
    'NUPTK'
  ];

  const sampleRows = [
    {
      'NIP *': '198504152010012023',
      'Nama Lengkap & Gelar *': 'Sumarni, S.Pd.SD.',
      'Jenis Guru *': 'Guru Kelas',
      'Mata Pelajaran / Tugas *': 'Guru Kelas IV',
      'NPSN / Nama Satuan Pendidikan *': '20501234',
      'Jenis Kelamin': 'P',
      'Status Kepegawaian': 'PNS',
      'Pangkat / Golongan': 'Penata Tingkat I / III/d',
      'Jabatan': 'Guru Ahli Muda',
      'Nomor Telepon / WhatsApp': '081234567890',
      'Email': 'sumarni.sdntinap3@gmail.com',
      'NIK': '3520016504850001',
      'NUPTK': '4147763665300052'
    },
    {
      'NIP *': '198902102015021004',
      'Nama Lengkap & Gelar *': 'Ahmad Fauzi, S.Pd.I.',
      'Jenis Guru *': 'Guru Mapel',
      'Mata Pelajaran / Tugas *': 'PAI',
      'NPSN / Nama Satuan Pendidikan *': '20501234',
      'Jenis Kelamin': 'L',
      'Status Kepegawaian': 'PPPK',
      'Pangkat / Golongan': 'Ahli Pertama / IX',
      'Jabatan': 'Guru Ahli Pertama',
      'Nomor Telepon / WhatsApp': '081234567891',
      'Email': 'ahmad.fauzi@sekolah.belajar.id',
      'NIK': '3520011002890002',
      'NUPTK': '5248767666200043'
    },
    {
      'NIP *': '199108172019031008',
      'Nama Lengkap & Gelar *': 'Bagus Wahyudi, S.Pd.',
      'Jenis Guru *': 'Guru Mapel',
      'Mata Pelajaran / Tugas *': 'PJOK',
      'NPSN / Nama Satuan Pendidikan *': '20501234',
      'Jenis Kelamin': 'L',
      'Status Kepegawaian': 'PNS',
      'Pangkat / Golongan': 'Penata Muda / III/a',
      'Jabatan': 'Guru Ahli Pertama',
      'Nomor Telepon / WhatsApp': '081234567892',
      'Email': 'bagus.wahyudi@sekolah.belajar.id',
      'NIK': '3520011708910003',
      'NUPTK': '6349769667100034'
    },
    {
      'NIP *': '198711202011012019',
      'Nama Lengkap & Gelar *': 'Rina Anggraeni, M.Pd.',
      'Jenis Guru *': 'Guru Mapel',
      'Mata Pelajaran / Tugas *': 'IPAS',
      'NPSN / Nama Satuan Pendidikan *': 'SD Negeri Tinap 3',
      'Jenis Kelamin': 'P',
      'Status Kepegawaian': 'PNS',
      'Pangkat / Golongan': 'Penata / III/c',
      'Jabatan': 'Guru Ahli Muda',
      'Nomor Telepon / WhatsApp': '081234567893',
      'Email': 'rina.anggraeni@sekolah.belajar.id',
      'NIK': '3520016011870004',
      'NUPTK': '7450765666300025'
    },
    {
      'NIP *': '198305042008011009',
      'Nama Lengkap & Gelar *': 'Drs. Hendro Wibowo',
      'Jenis Guru *': 'Guru Mapel',
      'Mata Pelajaran / Tugas *': 'Matematika',
      'NPSN / Nama Satuan Pendidikan *': '20509876',
      'Jenis Kelamin': 'L',
      'Status Kepegawaian': 'PNS',
      'Pangkat / Golongan': 'Pembina / IV/a',
      'Jabatan': 'Guru Ahli Madya',
      'Nomor Telepon / WhatsApp': '081234567894',
      'Email': 'hendro.wibowo@sekolah.belajar.id',
      'NIK': '3520020405830005',
      'NUPTK': '8551761664100016'
    },
    {
      'NIP *': '199203152020122018',
      'Nama Lengkap & Gelar *': 'Dewi Sartika, S.Pd.',
      'Jenis Guru *': 'Guru Mapel',
      'Mata Pelajaran / Tugas *': 'Pendidikan Pancasila',
      'NPSN / Nama Satuan Pendidikan *': '20509876',
      'Jenis Kelamin': 'P',
      'Status Kepegawaian': 'PPPK',
      'Pangkat / Golongan': 'Ahli Pertama / IX',
      'Jabatan': 'Guru Ahli Pertama',
      'Nomor Telepon / WhatsApp': '081234567895',
      'Email': 'dewi.sartika@sekolah.belajar.id',
      'NIK': '3520025503920006',
      'NUPTK': '9652770668200027'
    },
    {
      'NIP *': '199406212022031005',
      'Nama Lengkap & Gelar *': 'Rizky Pratama, S.Kom.',
      'Jenis Guru *': 'Guru Mapel',
      'Mata Pelajaran / Tugas *': 'TIK',
      'NPSN / Nama Satuan Pendidikan *': '20509876',
      'Jenis Kelamin': 'L',
      'Status Kepegawaian': 'PPPK',
      'Pangkat / Golongan': 'Ahli Pertama / IX',
      'Jabatan': 'Guru Ahli Pertama',
      'Nomor Telepon / WhatsApp': '081234567896',
      'Email': 'rizky.pratama@sekolah.belajar.id',
      'NIK': '3520022106940007',
      'NUPTK': '1753772669100038'
    },
    {
      'NIP *': '199512102023011002',
      'Nama Lengkap & Gelar *': 'Fajar Nugroho, S.Pd.',
      'Jenis Guru *': 'Guru Mapel',
      'Mata Pelajaran / Tugas *': 'KKA',
      'NPSN / Nama Satuan Pendidikan *': '20509876',
      'Jenis Kelamin': 'L',
      'Status Kepegawaian': 'GTT',
      'Pangkat / Golongan': 'Non ASN',
      'Jabatan': 'Guru Koding & KA',
      'Nomor Telepon / WhatsApp': '081234567897',
      'Email': 'fajar.nugroho@sekolah.belajar.id',
      'NIK': '3520021012950008',
      'NUPTK': '2854773670100049'
    },
    {
      'NIP *': '199009182016022007',
      'Nama Lengkap & Gelar *': 'Siti Nurhaliza, S.Pd.',
      'Jenis Guru *': 'Guru Mapel',
      'Mata Pelajaran / Tugas *': 'Bahasa Inggris',
      'NPSN / Nama Satuan Pendidikan *': 'SMP Negeri 1 Sukamaju',
      'Jenis Kelamin': 'P',
      'Status Kepegawaian': 'PNS',
      'Pangkat / Golongan': 'Penata Muda Tingkat I / III/b',
      'Jabatan': 'Guru Ahli Pertama',
      'Nomor Telepon / WhatsApp': '081234567898',
      'Email': 'siti.nurhaliza@sekolah.belajar.id',
      'NIK': '3520025809900009',
      'NUPTK': '3955768667200050'
    },
    {
      'NIP *': '198607142009022011',
      'Nama Lengkap & Gelar *': 'Tri Astuti, S.Pd.',
      'Jenis Guru *': 'Guru Mapel',
      'Mata Pelajaran / Tugas *': 'Bahasa Jawa',
      'NPSN / Nama Satuan Pendidikan *': '20501235',
      'Jenis Kelamin': 'P',
      'Status Kepegawaian': 'PNS',
      'Pangkat / Golongan': 'Penata Tingkat I / III/d',
      'Jabatan': 'Guru Ahli Muda',
      'Nomor Telepon / WhatsApp': '081234567899',
      'Email': 'tri.astuti@sekolah.belajar.id',
      'NIK': '3520015407860010',
      'NUPTK': '4056764665200061'
    },
    {
      'NIP *': '199304082021021003',
      'Nama Lengkap & Gelar *': 'Eko Prasetyo, S.Sos.',
      'Jenis Guru *': 'Guru Mapel',
      'Mata Pelajaran / Tugas *': 'IPS',
      'NPSN / Nama Satuan Pendidikan *': '20509876',
      'Jenis Kelamin': 'L',
      'Status Kepegawaian': 'PPPK',
      'Pangkat / Golongan': 'Ahli Pertama / IX',
      'Jabatan': 'Guru Ahli Pertama',
      'Nomor Telepon / WhatsApp': '081234567800',
      'Email': 'eko.prasetyo@sekolah.belajar.id',
      'NIK': '3520020804930011',
      'NUPTK': '5157771668100072'
    },
    {
      'NIP *': '199201052020012015',
      'Nama Lengkap & Gelar *': 'Lestari Handayani, S.Si.',
      'Jenis Guru *': 'Guru Mapel',
      'Mata Pelajaran / Tugas *': 'IPA',
      'NPSN / Nama Satuan Pendidikan *': '20509876',
      'Jenis Kelamin': 'P',
      'Status Kepegawaian': 'PNS',
      'Pangkat / Golongan': 'Penata Muda / III/a',
      'Jabatan': 'Guru Ahli Pertama',
      'Nomor Telepon / WhatsApp': '081234567801',
      'Email': 'lestari.handayani@sekolah.belajar.id',
      'NIK': '3520024501920012',
      'NUPTK': '6258770668200083'
    },
    {
      'NIP *': '199105122019022014',
      'Nama Lengkap & Gelar *': 'Novi Rahmawati, S.Psi.',
      'Jenis Guru *': 'Guru Mapel',
      'Mata Pelajaran / Tugas *': 'BK',
      'NPSN / Nama Satuan Pendidikan *': '20509876',
      'Jenis Kelamin': 'P',
      'Status Kepegawaian': 'PNS',
      'Pangkat / Golongan': 'Penata Muda Tingkat I / III/b',
      'Jabatan': 'Guru Bimbingan Konseling',
      'Nomor Telepon / WhatsApp': '081234567802',
      'Email': 'novi.rahmawati@sekolah.belajar.id',
      'NIK': '3520025205910013',
      'NUPTK': '7359769667200094'
    },
    {
      'NIP *': '-',
      'Nama Lengkap & Gelar *': 'Wahyu Hidayat, S.Sn.',
      'Jenis Guru *': 'Guru Mapel',
      'Mata Pelajaran / Tugas *': 'Muatan Lokal',
      'NPSN / Nama Satuan Pendidikan *': '20501235',
      'Jenis Kelamin': 'L',
      'Status Kepegawaian': 'Honor Daerah',
      'Pangkat / Golongan': 'Non ASN',
      'Jabatan': 'Guru Mulok Seni Tradisi',
      'Nomor Telepon / WhatsApp': '081234567803',
      'Email': 'wahyu.hidayat@gmail.com',
      'NIK': '3520011508960014',
      'NUPTK': '-'
    }
  ];

  const wb = XLSX.utils.book_new();

  // 1. Data Sheet
  const wsData = XLSX.utils.json_to_sheet(sampleRows, { header: headers });
  wsData['!cols'] = [
    { wch: 22 }, // NIP
    { wch: 28 }, // Nama
    { wch: 15 }, // Jenis Guru
    { wch: 25 }, // Mapel / Tugas
    { wch: 30 }, // Sekolah / NPSN
    { wch: 14 }, // Gender
    { wch: 18 }, // Status
    { wch: 28 }, // Pangkat
    { wch: 24 }, // Jabatan
    { wch: 22 }, // HP
    { wch: 32 }, // Email
    { wch: 20 }, // NIK
    { wch: 20 }  // NUPTK
  ];
  XLSX.utils.book_append_sheet(wb, wsData, 'Data_Guru');

  // 2. Reference & Guide Sheet
  const refRows = [
    { Kategori: 'PETUNJUK UMUM', Keterangan: 'Tanda bintang (*) menandakan kolom wajib diisi.' },
    { Kategori: 'PETUNJUK NIP', Keterangan: 'Isi dengan 18 digit NIP resmi. Jika belum memiliki NIP (Non-ASN), isi dengan tanda strip (-).' },
    { Kategori: 'JENIS GURU', Keterangan: 'Pilih: "Guru Kelas" atau "Guru Mapel".' },
    { Kategori: 'DAFTAR GURU KELAS', Keterangan: 'Jika Jenis Guru = Guru Kelas, isi tugas dengan: Guru Kelas I, Guru Kelas II, Guru Kelas III, Guru Kelas IV, Guru Kelas V, atau Guru Kelas VI.' },
    { Kategori: 'DAFTAR GURU MAPEL', Keterangan: 'Jika Jenis Guru = Guru Mapel, pilih salah satu mapel resmi: PAI, PJOK, IPA, IPS, IPAS, Matematika, Pendidikan Pancasila, TIK, KKA, Bahasa Inggris, Bahasa Jawa, Muatan Lokal, BK, Bahasa Indonesia, atau Seni Budaya.' },
    { Kategori: 'SEKOLAH', Keterangan: 'Dapat diisi 8 digit NPSN (disarankan) atau Nama Satuan Pendidikan sesuai data di sistem.' },
    { Kategori: 'STATUS KEPEGAWAIAN', Keterangan: 'Pilihan: PNS, PPPK, GTT, atau Honor Daerah.' },
    { Kategori: 'JENIS KELAMIN', Keterangan: 'L (Laki-laki) atau P (Perempuan).' }
  ];
  const wsRef = XLSX.utils.json_to_sheet(refRows);
  wsRef['!cols'] = [{ wch: 25 }, { wch: 95 }];
  XLSX.utils.book_append_sheet(wb, wsRef, 'Petunjuk_Referensi');

  XLSX.writeFile(wb, 'Template_Unggah_Data_Guru.xlsx');
};

/**
 * Parses teacher excel file and validates each row
 */
export const parseTeacherExcelFile = async (
  file: File,
  existingTeachers: Teacher[],
  schools: School[]
): Promise<ParseTeacherResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        if (!workbook.SheetNames.length) {
          throw new Error('Berkas Excel kosong atau tidak memiliki lembar kerja.');
        }

        // Pick data sheet
        const sheetName = workbook.SheetNames.includes('Data_Guru')
          ? 'Data_Guru'
          : workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (rawRows.length === 0) {
          throw new Error('Tidak ditemukan data guru pada lembar kerja Excel.');
        }

        const headersFound = Object.keys(rawRows[0] || {});

        // Pre-index existing teachers by NIP and by Name+School
        const existingByNip = new Map<string, Teacher>();
        const existingByNameSchool = new Map<string, Teacher>();

        for (const t of existingTeachers) {
          if (t.nip && t.nip !== '-' && t.nip.trim().length > 4) {
            existingByNip.set(t.nip.trim(), t);
          }
          const key = `${t.name.toLowerCase().trim()}_${t.schoolId}`;
          existingByNameSchool.set(key, t);
        }

        // Pre-index schools by NPSN and by normalized Name
        const schoolByNpsn = new Map<string, School>();
        const schoolByName = new Map<string, School>();

        for (const s of schools) {
          if (s.npsn) {
            schoolByNpsn.set(s.npsn.trim(), s);
          }
          schoolByName.set(s.name.toLowerCase().trim(), s);
        }

        const parsedRows: ParsedTeacherRow[] = [];
        let newCount = 0;
        let updateCount = 0;
        let invalidCount = 0;

        rawRows.forEach((row, index) => {
          const rowNumber = index + 2; // header is row 1
          const errors: string[] = [];
          const warnings: string[] = [];

          // Helper to get field with alternative header names
          const getField = (aliases: string[]): string => {
            for (const key of Object.keys(row)) {
              const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
              for (const alias of aliases) {
                if (cleanKey.includes(alias.toLowerCase().replace(/[^a-z0-9]/g, ''))) {
                  return cleanStr(row[key]);
                }
              }
            }
            return '';
          };

          const nip = getField(['nip', 'nomorindukpegawai']);
          const name = getField(['namalengkap', 'nama', 'guru']);
          const rawTeacherType = getField(['jenisguru', 'tipeguru', 'kategori']);
          const rawSubject = getField(['matapelajaran', 'mapel', 'tugas', 'mata']);
          const schoolIdentifier = getField(['npsn', 'sekolah', 'satuanpendidikan', 'unitkerja']);
          const genderRaw = getField(['jeniskelamin', 'gender', 'jk']);
          const employmentStatus = getField(['statuskepegawaian', 'statuspegawai', 'kepegawaian']) || 'PNS';
          const rankGrade = getField(['pangkat', 'golongan', 'pangkatgolongan']) || 'Penata Muda / III/a';
          const position = getField(['jabatan', 'fungsional']) || 'Guru Ahli Pertama';
          const phone = getField(['telepon', 'whatsapp', 'nohp', 'hp', 'kontak']);
          const email = getField(['email', 'surel']);
          const nik = getField(['nik', 'nomorindukkependudukan']);
          const nuptk = getField(['nuptk']);

          // 1. Validation: Name is required
          if (!name) {
            errors.push('Nama guru wajib diisi');
          }

          // 2. Match School
          let matchedSchool: School | undefined;
          if (schoolIdentifier) {
            // Check if numeric NPSN
            const cleanId = schoolIdentifier.replace(/[^0-9]/g, '');
            if (cleanId.length >= 7 && schoolByNpsn.has(cleanId)) {
              matchedSchool = schoolByNpsn.get(cleanId);
            } else if (schoolByNpsn.has(schoolIdentifier)) {
              matchedSchool = schoolByNpsn.get(schoolIdentifier);
            } else {
              // Try exact or fuzzy match
              const lowerSchoolName = schoolIdentifier.toLowerCase().trim();
              if (schoolByName.has(lowerSchoolName)) {
                matchedSchool = schoolByName.get(lowerSchoolName);
              } else {
                // Partial match
                matchedSchool = schools.find(
                  (s) =>
                    s.name.toLowerCase().includes(lowerSchoolName) ||
                    lowerSchoolName.includes(s.name.toLowerCase())
                );
              }
            }
          }

          if (!matchedSchool) {
            if (schools.length > 0) {
              matchedSchool = schools[0];
              warnings.push(
                schoolIdentifier
                  ? `Sekolah "${schoolIdentifier}" tidak ditemukan, dialihkan ke "${matchedSchool.name}"`
                  : `Kolom sekolah kosong, dialihkan ke "${matchedSchool.name}"`
              );
            } else {
              errors.push('Satuan pendidikan tidak valid dan tidak ada sekolah terdaftar di sistem');
            }
          }

          // 3. Normalization of Teacher Type & Subject
          const { normalized: normalizedSubject, type: detectedType } = normalizeSubjectName(rawSubject);
          let teacherType: 'Guru Kelas' | 'Guru Mapel' =
            rawTeacherType === 'Guru Kelas' || rawTeacherType === 'Guru Mapel'
              ? rawTeacherType
              : detectedType;

          let subject = rawSubject || normalizedSubject;
          if (!subject) {
            subject = teacherType === 'Guru Kelas' ? 'Guru Kelas' : 'PAI';
            warnings.push(`Mata pelajaran/tugas tidak diisi, diset default ke "${subject}"`);
          }

          // 4. Gender
          const genderClean = genderRaw.toUpperCase();
          const gender: 'L' | 'P' = genderClean.startsWith('P') || genderClean.includes('WANITA') || genderClean.includes('PEREMPUAN') ? 'P' : 'L';

          // 5. Existing check (NIP or Name+School)
          let existingTeacher: Teacher | undefined;
          if (nip && nip !== '-' && nip.length > 4) {
            existingTeacher = existingByNip.get(nip);
          }
          if (!existingTeacher && matchedSchool) {
            const key = `${name.toLowerCase().trim()}_${matchedSchool.id}`;
            existingTeacher = existingByNameSchool.get(key);
          }

          let status: 'NEW' | 'UPDATE' | 'INVALID' = 'NEW';
          if (errors.length > 0) {
            status = 'INVALID';
            invalidCount++;
          } else if (existingTeacher) {
            status = 'UPDATE';
            updateCount++;
          } else {
            status = 'NEW';
            newCount++;
          }

          parsedRows.push({
            rowNumber,
            nip: nip || '-',
            name,
            teacherType,
            subject,
            classGrade: teacherType === 'Guru Kelas' ? subject : undefined,
            schoolId: matchedSchool?.id || '',
            schoolName: matchedSchool?.name || '',
            gender,
            employmentStatus,
            rankGrade,
            position,
            phone,
            email,
            nik,
            nuptk,
            status,
            errors,
            warnings,
            original: row
          });
        });

        resolve({
          totalRows: parsedRows.length,
          validRows: parsedRows.length - invalidCount,
          newCount,
          updateCount,
          invalidCount,
          rows: parsedRows,
          headersFound
        });
      } catch (err: any) {
        reject(err);
      }
    };

    reader.onerror = () => {
      reject(new Error('Gagal membaca berkas Excel.'));
    };

    reader.readAsArrayBuffer(file);
  });
};
