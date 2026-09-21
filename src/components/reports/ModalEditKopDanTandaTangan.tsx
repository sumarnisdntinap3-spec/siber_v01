import React, { useState } from 'react';
import {
  X,
  Building2,
  UserCheck,
  Award,
  Save,
  RotateCcw,
  FileEdit,
  CheckCircle2,
  Calendar,
  FileText
} from 'lucide-react';

export interface LaporanOfficialConfig {
  // Kop Dinas
  kopInstansi: string;
  kopDinas: string;
  kopAlamat: string;
  kopKontak: string;
  nomorSuratPrefix: string;
  tanggalSuratKustom: string; // Jika kosong, gunakan tanggal otomatis

  // Penandatangan 1: Koordinator Pengawas
  korwasJabatan: string;
  korwasInstansi: string;
  korwasNama: string;
  korwasNip: string;
  korwasPangkat: string;

  // Penandatangan 2: Kepala Bidang PTK
  kabidJabatan: string;
  kabidInstansi: string;
  kabidNama: string;
  kabidNip: string;
  kabidPangkat: string;

  // Penandatangan 3: Mengetahui - Kepala Dinas
  kadisJabatan: string;
  kadisInstansi: string;
  kadisNama: string;
  kadisNip: string;
  kadisPangkat: string;
}

export const DEFAULT_LAPORAN_OFFICIAL_CONFIG: LaporanOfficialConfig = {
  kopInstansi: 'PEMERINTAH KABUPATEN MAGETAN',
  kopDinas: 'DINAS PENDIDIKAN, KEPEMUDAAN, DAN OLAHRAGA',
  kopAlamat: 'Jalan Mayjen Sungkono No. 12, Telp. (0351) 891001, Fax. (0351) 891002, Magetan 63311',
  kopKontak: 'Laman: dinaspendidikan.magetan.go.id • Pos-el: disdikpora@magetan.go.id',
  nomorSuratPrefix: '005/SUP-PM/DISDIK',
  tanggalSuratKustom: '',

  korwasJabatan: 'Koordinator Pengawas Sekolah',
  korwasInstansi: 'Kabupaten Magetan',
  korwasNama: 'Drs. H. BAMBANG SUTRISNO, M.Pd.',
  korwasNip: '19680315 199203 1 004',
  korwasPangkat: 'Pembina Utama Muda / IV/c',

  kabidJabatan: 'Kepala Bidang Pendidik dan Tenaga Kependidikan',
  kabidInstansi: 'Dinas Pendidikan, Kepemudaan, dan Olahraga Kabupaten Magetan',
  kabidNama: 'SUGIANTO, S.Pd., M.Pd.',
  kabidNip: '19740510 199803 1 007',
  kabidPangkat: 'Pembina Tk. I / IV/b',

  kadisJabatan: 'Kepala Dinas Pendidikan, Kepemudaan, dan Olahraga',
  kadisInstansi: 'Kabupaten Magetan',
  kadisNama: 'Drs. H. SUWATA, M.Si.',
  kadisNip: '19680514 199303 1 005',
  kadisPangkat: 'Pembina Utama Muda / IV/c'
};

const STORAGE_KEY = 'si_supervisi_laporan_official_config_v1';

export function loadOfficialConfig(): LaporanOfficialConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_LAPORAN_OFFICIAL_CONFIG, ...parsed };
    }
  } catch (err) {
    console.warn('Gagal memuat konfigurasi kop & tanda tangan dari localStorage:', err);
  }
  return DEFAULT_LAPORAN_OFFICIAL_CONFIG;
}

export function saveOfficialConfig(config: LaporanOfficialConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.warn('Gagal menyimpan konfigurasi kop & tanda tangan ke localStorage:', err);
  }
}

interface ModalEditKopDanTandaTanganProps {
  isOpen: boolean;
  onClose: () => void;
  config: LaporanOfficialConfig;
  onSave: (newConfig: LaporanOfficialConfig) => void;
  defaultActiveTab?: 'kop' | 'korwas' | 'kabid' | 'kadis';
}

export const ModalEditKopDanTandaTangan: React.FC<ModalEditKopDanTandaTanganProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
  defaultActiveTab = 'kop'
}) => {
  const [formData, setFormData] = useState<LaporanOfficialConfig>(config);
  const [activeTab, setActiveTab] = useState<'kop' | 'korwas' | 'kabid' | 'kadis'>(defaultActiveTab);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<boolean>(false);

  // Sync state when modal opens or config updates
  React.useEffect(() => {
    setFormData(config);
    if (defaultActiveTab) {
      setActiveTab(defaultActiveTab);
    }
  }, [config, defaultActiveTab, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field: keyof LaporanOfficialConfig, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleResetToDefault = () => {
    if (window.confirm('Kembalikan semua teks Kop dan data Penandatangan ke standar resmi Disdikpora Magetan?')) {
      setFormData(DEFAULT_LAPORAN_OFFICIAL_CONFIG);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    saveOfficialConfig(formData);
    setSaveSuccessNotice(true);
    setTimeout(() => {
      setSaveSuccessNotice(false);
      onClose();
    }, 600);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
              <FileEdit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Pengaturan Kop Dinas &amp; Penandatangan Laporan
              </h2>
              <p className="text-xs text-slate-500">
                Sesuaikan kop surat dinas, nama &amp; NIP Kepala Dinas, Kabid PTK, dan Koordinator Pengawas.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="Tutup dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TAB NAVIGATOR */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50/50 overflow-x-auto gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('kop')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'kop'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4 text-indigo-500" />
            <span>Kop Dinas &amp; Nomor</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('korwas')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'korwas'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4 text-blue-500" />
            <span>1. Koordinator Pengawas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('kabid')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'kabid'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-4 h-4 text-emerald-500" />
            <span>2. Kabid PTK Disdikpora</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('kadis')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'kadis'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-4 h-4 text-amber-500" />
            <span>3. Mengetahui: Kepala Dinas</span>
          </button>
        </div>

        {/* MODAL BODY FORM */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 max-h-[62vh] overflow-y-auto space-y-5">
            {/* ============================================================ */}
            {/* TAB 1: KOP SURAT DINAS                                       */}
            {/* ============================================================ */}
            {activeTab === 'kop' && (
              <div className="space-y-4">
                <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-100 text-xs text-indigo-900 leading-relaxed">
                  <strong>Informasi Kop Resmi:</strong> Teks kop surat berikut akan tercetak pada bagian kepala lembaran laporan PDF resmi dan diekspor ke berkas Microsoft Word.
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Instansi Induk / Pemerintah Daerah
                  </label>
                  <input
                    type="text"
                    value={formData.kopInstansi}
                    onChange={(e) => handleChange('kopInstansi', e.target.value)}
                    placeholder="Contoh: PEMERINTAH KABUPATEN MAGETAN"
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Dinas / Satuan Kerja
                  </label>
                  <input
                    type="text"
                    value={formData.kopDinas}
                    onChange={(e) => handleChange('kopDinas', e.target.value)}
                    placeholder="Contoh: DINAS PENDIDIKAN, KEPEMUDAAN, DAN OLAHRAGA"
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Alamat Kantor, No. Telepon &amp; Faksimile
                  </label>
                  <input
                    type="text"
                    value={formData.kopAlamat}
                    onChange={(e) => handleChange('kopAlamat', e.target.value)}
                    placeholder="Contoh: Jalan Mayjen Sungkono No. 12, Telp. (0351) 891001, Fax. (0351) 891002, Magetan 63311"
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Laman Web &amp; Pos-el (Email)
                  </label>
                  <input
                    type="text"
                    value={formData.kopKontak}
                    onChange={(e) => handleChange('kopKontak', e.target.value)}
                    placeholder="Contoh: Laman: dinaspendidikan.magetan.go.id • Pos-el: disdikpora@magetan.go.id"
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Prefix Kode / Nomor Dokumen Surat
                    </label>
                    <input
                      type="text"
                      value={formData.nomorSuratPrefix}
                      onChange={(e) => handleChange('nomorSuratPrefix', e.target.value)}
                      placeholder="Contoh: 005/SUP-PM/DISDIK"
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-mono font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Tahun ajaran akan ditambahkan secara otomatis pada akhir nomor surat.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Kustomisasi Tempat &amp; Tanggal Surat (Opsional)
                    </label>
                    <input
                      type="text"
                      value={formData.tanggalSuratKustom}
                      onChange={(e) => handleChange('tanggalSuratKustom', e.target.value)}
                      placeholder="Kosongkan untuk otomatis tanggal saat ini"
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Contoh kustom: "Magetan, 15 September 2026".
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* TAB 2: KOORDINATOR PENGAWAS                                  */}
            {/* ============================================================ */}
            {activeTab === 'korwas' && (
              <div className="space-y-4">
                <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-100 text-xs text-blue-900 leading-relaxed">
                  <strong>Penandatangan 1:</strong> Koordinator Pengawas Sekolah (Korwas) menandatangani di kolom kiri lembar pengesahan supervisi.
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Lengkap &amp; Gelar Koordinator Pengawas
                  </label>
                  <input
                    type="text"
                    value={formData.korwasNama}
                    onChange={(e) => handleChange('korwasNama', e.target.value)}
                    placeholder="Contoh: Drs. H. BAMBANG SUTRISNO, M.Pd."
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nomor Induk Pegawai (NIP) Korwas
                    </label>
                    <input
                      type="text"
                      value={formData.korwasNip}
                      onChange={(e) => handleChange('korwasNip', e.target.value)}
                      placeholder="Contoh: 19680315 199203 1 004"
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-mono font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Pangkat &amp; Golongan Ruang
                    </label>
                    <input
                      type="text"
                      value={formData.korwasPangkat}
                      onChange={(e) => handleChange('korwasPangkat', e.target.value)}
                      placeholder="Contoh: Pembina Utama Muda / IV/c"
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nomenklatur Jabatan
                    </label>
                    <input
                      type="text"
                      value={formData.korwasJabatan}
                      onChange={(e) => handleChange('korwasJabatan', e.target.value)}
                      placeholder="Contoh: Koordinator Pengawas Sekolah"
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Wilayah / Satuan Kerja
                    </label>
                    <input
                      type="text"
                      value={formData.korwasInstansi}
                      onChange={(e) => handleChange('korwasInstansi', e.target.value)}
                      placeholder="Contoh: Kabupaten Magetan"
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* TAB 3: KEPALA BIDANG PTK DISDIKPORA                          */}
            {/* ============================================================ */}
            {activeTab === 'kabid' && (
              <div className="space-y-4">
                <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100 text-xs text-emerald-900 leading-relaxed">
                  <strong>Penandatangan 2:</strong> Kepala Bidang Pendidik dan Tenaga Kependidikan (PTK) Dinas Pendidikan, Kepemudaan, dan Olahraga Kabupaten Magetan menandatangani di kolom kanan lembar pengesahan supervisi.
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Lengkap &amp; Gelar Kepala Bidang PTK
                  </label>
                  <input
                    type="text"
                    value={formData.kabidNama}
                    onChange={(e) => handleChange('kabidNama', e.target.value)}
                    placeholder="Contoh: SUGIANTO, S.Pd., M.Pd."
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nomor Induk Pegawai (NIP) Kabid PTK
                    </label>
                    <input
                      type="text"
                      value={formData.kabidNip}
                      onChange={(e) => handleChange('kabidNip', e.target.value)}
                      placeholder="Contoh: 19740510 199803 1 007"
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-mono font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Pangkat &amp; Golongan Ruang
                    </label>
                    <input
                      type="text"
                      value={formData.kabidPangkat}
                      onChange={(e) => handleChange('kabidPangkat', e.target.value)}
                      placeholder="Contoh: Pembina Tk. I / IV/b"
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nomenklatur Jabatan Bidang
                    </label>
                    <input
                      type="text"
                      value={formData.kabidJabatan}
                      onChange={(e) => handleChange('kabidJabatan', e.target.value)}
                      placeholder="Contoh: Kepala Bidang Pendidik dan Tenaga Kependidikan"
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Instansi / Dinas
                    </label>
                    <input
                      type="text"
                      value={formData.kabidInstansi}
                      onChange={(e) => handleChange('kabidInstansi', e.target.value)}
                      placeholder="Contoh: Dinas Pendidikan, Kepemudaan, dan Olahraga Kabupaten Magetan"
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* TAB 4: KEPALA DINAS (MENGETAHUI)                             */}
            {/* ============================================================ */}
            {activeTab === 'kadis' && (
              <div className="space-y-4">
                <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-100 text-xs text-amber-900 leading-relaxed">
                  <strong>Penandatangan 3 (Mengetahui):</strong> Kepala Dinas Pendidikan, Kepemudaan, dan Olahraga Kabupaten Magetan menandatangani di kolom tengah bawah lembar pengesahan.
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Lengkap &amp; Gelar Kepala Dinas
                  </label>
                  <input
                    type="text"
                    value={formData.kadisNama}
                    onChange={(e) => handleChange('kadisNama', e.target.value)}
                    placeholder="Contoh: Drs. H. SUWATA, M.Si."
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nomor Induk Pegawai (NIP) Kepala Dinas
                    </label>
                    <input
                      type="text"
                      value={formData.kadisNip}
                      onChange={(e) => handleChange('kadisNip', e.target.value)}
                      placeholder="Contoh: 19680514 199303 1 005"
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-mono font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Pangkat &amp; Golongan Ruang
                    </label>
                    <input
                      type="text"
                      value={formData.kadisPangkat}
                      onChange={(e) => handleChange('kadisPangkat', e.target.value)}
                      placeholder="Contoh: Pembina Utama Muda / IV/c"
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nomenklatur Jabatan
                    </label>
                    <input
                      type="text"
                      value={formData.kadisJabatan}
                      onChange={(e) => handleChange('kadisJabatan', e.target.value)}
                      placeholder="Contoh: Kepala Dinas Pendidikan, Kepemudaan, dan Olahraga"
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Daerah / Kabupaten
                    </label>
                    <input
                      type="text"
                      value={formData.kadisInstansi}
                      onChange={(e) => handleChange('kadisInstansi', e.target.value)}
                      placeholder="Contoh: Kabupaten Magetan"
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* MODAL FOOTER */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50/80">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold px-3 py-2 rounded-xl hover:bg-slate-200/50 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Standar Resmi</span>
            </button>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                Batal
              </button>

              <button
                type="submit"
                id="btn-simpan-pengaturan-kop-ttd"
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                {saveSuccessNotice ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Tersimpan!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Perubahan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
