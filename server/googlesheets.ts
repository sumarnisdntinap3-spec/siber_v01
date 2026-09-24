import * as XLSX from 'xlsx';

export interface GoogleSheetsConfig {
  webhookUrl: string;
  spreadsheetUrl: string;
  autoSync: boolean;
  lastSync: string | null;
  lastSyncStatus: string | null;
}

export let currentGoogleSheetsConfig: GoogleSheetsConfig = {
  webhookUrl: '',
  spreadsheetUrl: '',
  autoSync: false,
  lastSync: null,
  lastSyncStatus: null
};

export function updateGoogleSheetsConfig(patch: Partial<GoogleSheetsConfig>): GoogleSheetsConfig {
  currentGoogleSheetsConfig = {
    ...currentGoogleSheetsConfig,
    ...patch
  };
  return currentGoogleSheetsConfig;
}

/**
 * Generates ready-to-use Google Apps Script code for Google Sheets.
 * Users copy this into Extensions > Apps Script and deploy as Web App.
 */
export function getGoogleAppsScriptTemplate(): string {
  return `/**
 * SIBER-PM Magetan - Google Apps Script Webhook Receiver
 * Script untuk menerima dan menyinkronkan database SIBER-PM langsung ke Google Sheet.
 *
 * CARA MENGGUNAKAN:
 * 1. Buka Google Spreadsheet baru di https://sheets.new
 * 2. Klik menu 'Ekstensi' > 'Apps Script'
 * 3. Hapus kode bawaan dan tempel kode ini seluruhnya
 * 4. Klik 'Terapkan' (Deploy) > 'Penerapan baru' (New deployment)
 * 5. Pilih jenis: 'Aplikasi Web' (Web app)
 * 6. Setel 'Akses': 'Siapa saja' (Anyone)
 * 7. Klik 'Terapkan' dan salin URL Aplikasi Web (URL Webhook)
 * 8. Tempelkan URL tersebut ke menu Pengaturan Aplikasi > Database di SIBER-PM.
 */

function doPost(e) {
  try {
    var rawData = e.postData ? e.postData.contents : '';
    if (!rawData) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Empty payload' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var data = JSON.parse(rawData);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Sinkronkan Sheet Sekolah
    if (data.schools && data.schools.length > 0) {
      writeSheetData(ss, 'DATA_SEKOLAH', [
        ['ID', 'NPSN', 'Nama Sekolah', 'Alamat', 'Kecamatan', 'Kepala Sekolah', 'Pengawas Pembina', 'Status', 'Jumlah Guru']
      ], data.schools.map(function(s) {
        return [s.id, s.npsn, s.name, s.address, s.subDistrict, s.principalName, s.supervisorName, s.status, s.teacherCount || 0];
      }));
    }

    // 2. Sinkronkan Sheet Guru
    if (data.teachers && data.teachers.length > 0) {
      writeSheetData(ss, 'DATA_GURU', [
        ['ID', 'NIP', 'Nama Lengkap', 'Satuan Pendidikan', 'Status Pegawai', 'Golongan', 'Jabatan', 'Mata Pelajaran', 'Email', 'No HP']
      ], data.teachers.map(function(t) {
        return [t.id, t.nip, t.name, t.schoolName, t.employmentStatus, t.rankGrade, t.position, t.subject, t.email, t.phone];
      }));
    }

    // 3. Sinkronkan Sheet Pengawas
    if (data.supervisors && data.supervisors.length > 0) {
      writeSheetData(ss, 'DATA_PENGAWAS', [
        ['ID', 'NIP', 'Nama Pengawas', 'Jenjang Binaan', 'Wilayah Binaan', 'Email', 'No HP', 'No SK Penugasan']
      ], data.supervisors.map(function(sp) {
        return [
          sp.id,
          sp.nip,
          sp.name,
          (sp.levels || []).join(', '),
          (sp.wilayahKecamatan || []).join(', '),
          sp.email,
          sp.phone,
          sp.skNumber || '-'
        ];
      }));
    }

    // 4. Sinkronkan Jadwal & Nilai Supervisi
    if (data.supervisions && data.supervisions.length > 0) {
      writeSheetData(ss, 'REKAP_SUPERVISI', [
        ['ID Supervisi', 'Nama Guru', 'Nama Sekolah', 'Pengawas Pembina', 'Tanggal', 'Mata Pelajaran', 'Status', 'Nilai Akhir', 'Catatan']
      ], data.supervisions.map(function(sv) {
        return [sv.id, sv.teacherName, sv.schoolName, sv.supervisorName, sv.date, sv.subject, sv.status, sv.finalScore || sv.score || 0, sv.notes || '-'];
      }));
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Data SIBER-PM berhasil disinkronkan ke Google Sheet'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function writeSheetData(ss, sheetName, headers, rows) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  sheet.clear();
  
  var allData = headers.concat(rows);
  sheet.getRange(1, 1, allData.length, allData[0].length).setValues(allData);

  // Format header row
  var headerRange = sheet.getRange(1, 1, 1, allData[0].length);
  headerRange.setBackground('#10b981');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, allData[0].length);
}

function doGet() {
  return ContentService.createTextOutput('Webhook SIBER-PM Google Apps Script Aktif').setMimeType(ContentService.MimeType.TEXT);
}
`;
}

/**
 * Builds multi-sheet Excel (.xlsx) file buffer compatible with Google Sheets
 */
export function buildGoogleSheetsWorkbook(data: {
  schools: any[];
  teachers: any[];
  supervisors: any[];
  supervisions: any[];
}): Buffer {
  const wb = XLSX.utils.book_new();

  // 1. DATA SEKOLAH
  const schoolRows = (data.schools || []).map((s, idx) => ({
    No: idx + 1,
    NPSN: s.npsn || '',
    'Nama Sekolah': s.name || '',
    Alamat: s.address || '',
    Kecamatan: s.subDistrict || '',
    'Kabupaten/Kota': s.city || 'Kabupaten Magetan',
    'Kepala Sekolah': s.principalName || '',
    'Pengawas Pembina': s.supervisorName || '',
    Akreditasi: s.accreditation || 'A',
    Status: s.status === 'active' ? 'Aktif' : 'Nonaktif',
    'Jumlah Guru': s.teacherCount || 0
  }));
  const wsSchools = XLSX.utils.json_to_sheet(schoolRows);
  XLSX.utils.book_append_sheet(wb, wsSchools, 'DATA_SEKOLAH');

  // 2. DATA GURU
  const teacherRows = (data.teachers || []).map((t, idx) => ({
    No: idx + 1,
    NIP: t.nip || '',
    'Nama Lengkap & Gelar': t.name || '',
    'Satuan Pendidikan': t.schoolName || '',
    'Status Pegawai': t.employmentStatus || 'PNS',
    'Pangkat / Golongan': t.rankGrade || '',
    Jabatan: t.position || 'Guru Kelas',
    'Mata Pelajaran': t.subject || 'Tematik',
    'Pendidikan Terakhir': t.educationLevel || 'S1',
    Email: t.email || '',
    'Nomor HP / WhatsApp': t.phone || ''
  }));
  const wsTeachers = XLSX.utils.json_to_sheet(teacherRows);
  XLSX.utils.book_append_sheet(wb, wsTeachers, 'DATA_GURU');

  // 3. DATA PENGAWAS
  const supervisorRows = (data.supervisors || []).map((sp, idx) => ({
    No: idx + 1,
    NIP: sp.nip || '',
    'Nama Pengawas': sp.name || '',
    'Pangkat / Golongan': sp.rankGrade || '',
    'Jenjang Binaan': (sp.levels || []).join(', '),
    'Wilayah Kecamatan (Magetan)': (sp.wilayahKecamatan || []).join(', '),
    'Jumlah Sekolah Binaan': (sp.assignedSchoolIds || []).length,
    'Sekolah Binaan': (sp.assignedSchoolNames || []).join('; '),
    'No SK Penugasan': sp.skNumber || '',
    Email: sp.email || '',
    'Nomor WhatsApp': sp.phone || ''
  }));
  const wsSupervisors = XLSX.utils.json_to_sheet(supervisorRows);
  XLSX.utils.book_append_sheet(wb, wsSupervisors, 'DATA_PENGAWAS');

  // 4. DATA SUPERVISI
  const supervisionRows = (data.supervisions || []).map((sv, idx) => ({
    No: idx + 1,
    'ID Supervisi': sv.id,
    'Nama Guru': sv.teacherName || '',
    'Satuan Pendidikan': sv.schoolName || '',
    'Pengawas Pembina': sv.supervisorName || '',
    Tanggal: sv.date || '',
    Waktu: sv.time || '',
    'Mata Pelajaran': sv.subject || '',
    Status: sv.status || '',
    'Nilai Supervisi': sv.finalScore || sv.score || 0,
    Catatan: sv.notes || '-'
  }));
  const wsSupervisions = XLSX.utils.json_to_sheet(supervisionRows);
  XLSX.utils.book_append_sheet(wb, wsSupervisions, 'REKAP_SUPERVISI');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return buf;
}

/**
 * Send full sync payload to Google Sheets Webhook
 */
export async function sendToGoogleSheetsWebhook(
  webhookUrl: string,
  payload: {
    schools: any[];
    teachers: any[];
    supervisors: any[];
    supervisions: any[];
    reflectiveNotes?: any[];
  }
): Promise<{ success: boolean; message: string }> {
  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    return { success: false, message: 'URL Webhook Google Sheets belum diatur atau tidak valid.' };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, message: `Koneksi Webhook gagal (${res.status}): ${errText}` };
    }

    currentGoogleSheetsConfig.lastSync = new Date().toISOString();
    currentGoogleSheetsConfig.lastSyncStatus = 'Berhasil';

    return {
      success: true,
      message: 'Sinkronisasi ke Google Sheet berhasil dikirim via Webhook.'
    };
  } catch (err: any) {
    currentGoogleSheetsConfig.lastSync = new Date().toISOString();
    currentGoogleSheetsConfig.lastSyncStatus = `Gagal: ${err.message}`;
    return {
      success: false,
      message: `Gagal mengirim ke Google Sheets Webhook: ${err.message}`
    };
  }
}
