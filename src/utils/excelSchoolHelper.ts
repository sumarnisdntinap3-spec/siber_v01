import * as XLSX from 'xlsx';
import { School } from '../types';

export interface ParsedSchoolRow {
  rowNumber: number;
  npsn: string;
  name: string;
  level: string;
  statusSchool: string;
  address: string;
  subDistrict: string;
  city: string;
  principalName: string;
  phone: string;
  email: string;
  accreditation: string;
  supervisorName: string;
  status: 'NEW' | 'UPDATE' | 'INVALID';
  errors: string[];
  warnings: string[];
  original: any;
}

export interface ParseSchoolResult {
  totalRows: number;
  validRows: number;
  newCount: number;
  updateCount: number;
  invalidCount: number;
  rows: ParsedSchoolRow[];
  headersFound: string[];
}

/**
 * Normalizes input string
 */
const cleanStr = (val: any): string => {
  if (val === null || val === undefined) return '';
  return String(val).trim();
};

/**
 * Generate and download professional Excel template for uploading Satuan Pendidikan
 */
export const downloadSchoolExcelTemplate = () => {
  const headers = [
    'NPSN *',
    'Nama Satuan Pendidikan *',
    'Jenjang *',
    'Status Sekolah',
    'Alamat Sekolah *',
    'Kecamatan *',
    'Kabupaten / Kota *',
    'Nama Kepala Sekolah',
    'Nomor Telepon',
    'Email Sekolah',
    'Akreditasi',
    'Nama Pengawas Bina'
  ];

  const sampleRows = [
    {
      'NPSN *': '20501234',
      'Nama Satuan Pendidikan *': 'SD Negeri Tinap 3',
      'Jenjang *': 'SD',
      'Status Sekolah': 'Negeri',
      'Alamat Sekolah *': 'Jl. Raya Pendidikan No. 45, Desa Tinap',
      'Kecamatan *': 'Sukomoro',
      'Kabupaten / Kota *': 'Kabupaten Magetan',
      'Nama Kepala Sekolah': 'Hj. Sri Wahyuni, M.Pd.',
      'Nomor Telepon': '0351-891001',
      'Email Sekolah': 'sdntinap3@magetan.sch.id',
      'Akreditasi': 'A',
      'Nama Pengawas Bina': 'Drs. H. Bambang Sutrisno, M.Pd.'
    },
    {
      'NPSN *': '20501235',
      'Nama Satuan Pendidikan *': 'SD Negeri Tinap 1',
      'Jenjang *': 'SD',
      'Status Sekolah': 'Negeri',
      'Alamat Sekolah *': 'Jl. Pahlawan No. 12, Desa Tinap',
      'Kecamatan *': 'Sukomoro',
      'Kabupaten / Kota *': 'Kabupaten Magetan',
      'Nama Kepala Sekolah': 'Drs. Agus Priyanto, M.Pd.',
      'Nomor Telepon': '0351-891002',
      'Email Sekolah': 'sdntinap1@magetan.sch.id',
      'Akreditasi': 'A',
      'Nama Pengawas Bina': 'Drs. H. Bambang Sutrisno, M.Pd.'
    },
    {
      'NPSN *': '20509876',
      'Nama Satuan Pendidikan *': 'SMP Negeri 1 Sukamaju',
      'Jenjang *': 'SMP',
      'Status Sekolah': 'Negeri',
      'Alamat Sekolah *': 'Jl. Pemuda Bangsa No. 88',
      'Kecamatan *': 'Sukamaju',
      'Kabupaten / Kota *': 'Kabupaten Magetan',
      'Nama Kepala Sekolah': 'Budi Santoso, S.Pd., M.M.',
      'Nomor Telepon': '0351-892345',
      'Email Sekolah': 'smpn1sukamaju@magetan.sch.id',
      'Akreditasi': 'A',
      'Nama Pengawas Bina': 'Dr. Hj. Siti Rohmah, M.Pd.'
    },
    {
      'NPSN *': '20504421',
      'Nama Satuan Pendidikan *': 'TK Pembina Negeri Magetan',
      'Jenjang *': 'TK',
      'Status Sekolah': 'Negeri',
      'Alamat Sekolah *': 'Jl. Basuki Rahmat No. 10',
      'Kecamatan *': 'Magetan',
      'Kabupaten / Kota *': 'Kabupaten Magetan',
      'Nama Kepala Sekolah': 'Siti Maryam, S.Pd.AUD.',
      'Nomor Telepon': '0351-893321',
      'Email Sekolah': 'tkpembina@magetan.sch.id',
      'Akreditasi': 'A',
      'Nama Pengawas Bina': 'Dra. Endang Sulistyowati, M.Pd.'
    }
  ];

  const petunjukRows = [
    {
      'NOMOR': 1,
      'PANDUAN & ATURAN PENGISIAN': 'Jangan mengubah atau menghapus baris judul kolom (Header) pada baris pertama.'
    },
    {
      'NOMOR': 2,
      'PANDUAN & ATURAN PENGISIAN': 'Kolom bertanda asteris (*) WAJIB diisi (NPSN, Nama Satuan Pendidikan, Jenjang, Alamat, Kecamatan, Kabupaten/Kota).'
    },
    {
      'NOMOR': 3,
      'PANDUAN & ATURAN PENGISIAN': 'NPSN harus unik berupa angka (biasanya 8 digit). Format teks atau angka diterima.'
    },
    {
      'NOMOR': 4,
      'PANDUAN & ATURAN PENGISIAN': 'Pilihan Jenjang yang didukung: PAUD, TK, SD, SMP, SMA, SMK.'
    },
    {
      'NOMOR': 5,
      'PANDUAN & ATURAN PENGISIAN': 'Pilihan Akreditasi: A, B, C, atau Belum.'
    },
    {
      'NOMOR': 6,
      'PANDUAN & ATURAN PENGISIAN': 'Fitur Unggah Serentak ini otomatis melakukan Upsert: Jika NPSN sudah terdaftar di sistem, data sekolah tersebut akan diperbarui secara otomatis.'
    },
    {
      'NOMOR': 7,
      'PANDUAN & ATURAN PENGISIAN': 'Anda dapat menghapus baris contoh sebelum mengisi data sekolah resmi Anda.'
    }
  ];

  const referensiKecamatan = [
    { 'DAFTAR KECAMATAN (MAGETAN)': 'Sukomoro', 'JENJANG PENDIDIKAN': 'PAUD' },
    { 'DAFTAR KECAMATAN (MAGETAN)': 'Magetan', 'JENJANG PENDIDIKAN': 'TK' },
    { 'DAFTAR KECAMATAN (MAGETAN)': 'Panekan', 'JENJANG PENDIDIKAN': 'SD' },
    { 'DAFTAR KECAMATAN (MAGETAN)': 'Plaosan', 'JENJANG PENDIDIKAN': 'SMP' },
    { 'DAFTAR KECAMATAN (MAGETAN)': 'Bendo', 'JENJANG PENDIDIKAN': 'SMA' },
    { 'DAFTAR KECAMATAN (MAGETAN)': 'Maospati', 'JENJANG PENDIDIKAN': 'SMK' },
    { 'DAFTAR KECAMATAN (MAGETAN)': 'Kawedanan', 'JENJANG PENDIDIKAN': '' },
    { 'DAFTAR KECAMATAN (MAGETAN)': 'Karangrejo', 'JENJANG PENDIDIKAN': '' },
    { 'DAFTAR KECAMATAN (MAGETAN)': 'Lembeyan', 'JENJANG PENDIDIKAN': '' },
    { 'DAFTAR KECAMATAN (MAGETAN)': 'Parang', 'JENJANG PENDIDIKAN': '' },
    { 'DAFTAR KECAMATAN (MAGETAN)': 'Takeran', 'JENJANG PENDIDIKAN': '' },
    { 'DAFTAR KECAMATAN (MAGETAN)': 'Barat', 'JENJANG PENDIDIKAN': '' },
    { 'DAFTAR KECAMATAN (MAGETAN)': 'Poncol', 'JENJANG PENDIDIKAN': '' },
    { 'DAFTAR KECAMATAN (MAGETAN)': 'Ngariboyo', 'JENJANG PENDIDIKAN': '' },
    { 'DAFTAR KECAMATAN (MAGETAN)': 'Kartoharjo', 'JENJANG PENDIDIKAN': '' },
    { 'DAFTAR KECAMATAN (MAGETAN)': 'Nguntoronadi', 'JENJANG PENDIDIKAN': '' },
    { 'DAFTAR KECAMATAN (MAGETAN)': 'Sidorejo', 'JENJANG PENDIDIKAN': '' },
    { 'DAFTAR KECAMATAN (MAGETAN)': 'Karas', 'JENJANG PENDIDIKAN': '' }
  ];

  const wb = XLSX.utils.book_new();

  // Sheet 1: Data Satuan Pendidikan
  const wsData = XLSX.utils.json_to_sheet(sampleRows, { header: headers });
  wsData['!cols'] = [
    { wch: 14 }, // NPSN
    { wch: 32 }, // Nama Sekolah
    { wch: 12 }, // Jenjang
    { wch: 15 }, // Status
    { wch: 42 }, // Alamat
    { wch: 18 }, // Kecamatan
    { wch: 22 }, // Kab/Kota
    { wch: 28 }, // Kepala Sekolah
    { wch: 16 }, // No Telepon
    { wch: 28 }, // Email
    { wch: 12 }, // Akreditasi
    { wch: 32 }  // Pengawas Bina
  ];
  XLSX.utils.book_append_sheet(wb, wsData, 'Data_Satuan_Pendidikan');

  // Sheet 2: Petunjuk Pengisian
  const wsPetunjuk = XLSX.utils.json_to_sheet(petunjukRows);
  wsPetunjuk['!cols'] = [{ wch: 8 }, { wch: 95 }];
  XLSX.utils.book_append_sheet(wb, wsPetunjuk, 'Petunjuk_Pengisian');

  // Sheet 3: Referensi Wilayah & Jenjang
  const wsRef = XLSX.utils.json_to_sheet(referensiKecamatan);
  wsRef['!cols'] = [{ wch: 30 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, wsRef, 'Referensi');

  // Write file
  XLSX.writeFile(wb, 'Template_Unggah_Satuan_Pendidikan.xlsx');
};

/**
 * Parse Excel or CSV file into structured and validated school rows
 */
export const parseSchoolExcelFile = async (
  file: File,
  existingSchools: School[] = []
): Promise<ParseSchoolResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error('File Excel tidak memiliki lembar kerja (worksheet).');
        }

        // Use the first sheet or a sheet named 'Data_Satuan_Pendidikan'
        const targetSheetName =
          workbook.SheetNames.find((name) =>
            name.toLowerCase().includes('data') || name.toLowerCase().includes('sekolah')
          ) || workbook.SheetNames[0];

        const worksheet = workbook.Sheets[targetSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          throw new Error('Lembar kerja Excel kosong atau tidak memiliki baris data.');
        }

        const headersFound = Object.keys(rawJson[0] || {});

        // Map existing schools by NPSN for quick lookup
        const existingNpsnMap = new Map<string, School>();
        for (const s of existingSchools) {
          if (s.npsn) {
            existingNpsnMap.set(String(s.npsn).trim().toLowerCase(), s);
          }
        }

        const seenNpsnInFile = new Set<string>();
        const parsedRows: ParsedSchoolRow[] = [];

        let newCount = 0;
        let updateCount = 0;
        let invalidCount = 0;

        rawJson.forEach((row, index) => {
          const rowNum = index + 2; // +1 for 0-index, +1 for header row

          // Helper to find value from row with flexible header aliases
          const findValue = (...aliases: string[]): string => {
            for (const key of Object.keys(row)) {
              const cleanKey = key.toLowerCase().replace(/[\*\_\-\:\s]/g, '');
              for (const alias of aliases) {
                const cleanAlias = alias.toLowerCase().replace(/[\*\_\-\:\s]/g, '');
                if (cleanKey === cleanAlias || cleanKey.includes(cleanAlias)) {
                  return cleanStr(row[key]);
                }
              }
            }
            return '';
          };

          const npsn = findValue('npsn', 'nomorpokoksatuanpendidikan', 'nopokok');
          const name = findValue('namasatuanpendidikan', 'namasekolah', 'sekolah', 'nama');
          let level = findValue('jenjang', 'bentukpendidikan', 'tingkat', 'level').toUpperCase();
          const statusSchool = findValue('statusekolah', 'status', 'negeri/swasta') || 'Negeri';
          const address = findValue('alamatsekolah', 'alamat', 'jalan', 'lokasi');
          const subDistrict = findValue('kecamatan', 'subdistrict', 'kec') || 'Sukomoro';
          const city = findValue('kabupaten/kota', 'kabupaten', 'kota', 'city') || 'Kabupaten Magetan';
          const principalName = findValue('namakepalasekolah', 'kepalasekolah', 'namaks', 'ks', 'principal');
          const phone = findValue('nomortelepon', 'notelepon', 'telepon', 'notelp', 'telp', 'phone', 'kontak');
          const email = findValue('emailsekolah', 'email', 'e-mail');
          let accreditation = findValue('akreditasi', 'statusakreditasi', 'grade').toUpperCase();
          const supervisorName = findValue('namapengawasbina', 'pengawasbina', 'pengawas', 'supervisor');

          // Normalize level
          if (level.includes('SD')) level = 'SD';
          else if (level.includes('SMP')) level = 'SMP';
          else if (level.includes('SMA')) level = 'SMA';
          else if (level.includes('SMK')) level = 'SMK';
          else if (level.includes('TK')) level = 'TK';
          else if (level.includes('PAUD')) level = 'PAUD';
          else if (!level) level = 'SD';

          // Normalize accreditation
          if (!['A', 'B', 'C', 'BELUM'].includes(accreditation)) {
            if (accreditation.startsWith('A')) accreditation = 'A';
            else if (accreditation.startsWith('B')) accreditation = 'B';
            else if (accreditation.startsWith('C')) accreditation = 'C';
            else accreditation = 'Belum Terakreditasi';
          }

          const errors: string[] = [];
          const warnings: string[] = [];

          // Validation
          if (!npsn) {
            errors.push('NPSN tidak boleh kosong');
          } else if (npsn.length < 5) {
            warnings.push('NPSN kurang dari 8 karakter standar');
          }

          if (!name) {
            errors.push('Nama Satuan Pendidikan tidak boleh kosong');
          }

          if (!address) {
            warnings.push('Alamat sekolah kosong (akan menggunakan nilai default)');
          }

          if (npsn) {
            const lowerNpsn = npsn.toLowerCase();
            if (seenNpsnInFile.has(lowerNpsn)) {
              warnings.push(`NPSN "${npsn}" terulang lebih dari satu kali dalam file ini`);
            }
            seenNpsnInFile.add(lowerNpsn);
          }

          let status: 'NEW' | 'UPDATE' | 'INVALID' = 'NEW';

          if (errors.length > 0) {
            status = 'INVALID';
            invalidCount++;
          } else if (npsn && existingNpsnMap.has(npsn.toLowerCase())) {
            status = 'UPDATE';
            updateCount++;
          } else {
            status = 'NEW';
            newCount++;
          }

          parsedRows.push({
            rowNumber: rowNum,
            npsn,
            name,
            level,
            statusSchool,
            address: address || 'Magetan',
            subDistrict: subDistrict || 'Sukomoro',
            city: city || 'Kabupaten Magetan',
            principalName: principalName || '-',
            phone: phone || '-',
            email: email || '-',
            accreditation,
            supervisorName: supervisorName || '-',
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
        reject(new Error(err?.message || 'Gagal membaca berkas Excel. Pastikan format file valid.'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Terjadi kesalahan saat membaca file. Silakan coba lagi.'));
    };

    reader.readAsArrayBuffer(file);
  });
};
