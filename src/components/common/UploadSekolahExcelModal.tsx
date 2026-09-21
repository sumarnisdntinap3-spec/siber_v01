import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  School as SchoolIcon,
  Check,
  FileText
} from 'lucide-react';
import { Modal } from './Modal';
import { School, Supervisor } from '../../types';
import {
  downloadSchoolExcelTemplate,
  parseSchoolExcelFile,
  ParseSchoolResult,
  ParsedSchoolRow
} from '../../utils/excelSchoolHelper';
import { api } from '../../services/api';

interface UploadSekolahExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingSchools: School[];
  supervisors?: Supervisor[];
  onSuccess: (result: { total: number; added: number; updated: number }) => void;
}

export const UploadSekolahExcelModal: React.FC<UploadSekolahExcelModalProps> = ({
  isOpen,
  onClose,
  existingSchools,
  onSuccess
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseSchoolResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  // Filter & Search states for preview
  const [previewFilter, setPreviewFilter] = useState<'ALL' | 'NEW' | 'UPDATE' | 'INVALID'>('ALL');
  const [previewSearch, setPreviewSearch] = useState('');
  const [updateExisting, setUpdateExisting] = useState(true);

  // Submit states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<{
    total: number;
    added: number;
    updated: number;
  } | null>(null);

  // Reset state when closing or starting over
  const handleReset = () => {
    setSelectedFile(null);
    setParseResult(null);
    setParseError(null);
    setPreviewFilter('ALL');
    setPreviewSearch('');
    setIsSubmitting(false);
    setSubmitSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  // Process file
  const handleFile = async (file: File) => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!validExtensions.includes(fileExt)) {
      setParseError('Format file tidak didukung. Harap unggah file Excel (.xlsx, .xls) atau CSV.');
      return;
    }

    setSelectedFile(file);
    setParseError(null);
    setIsParsing(true);

    try {
      const result = await parseSchoolExcelFile(file, existingSchools);
      setParseResult(result);
    } catch (err: any) {
      setParseError(err.message || 'Terjadi kesalahan saat memproses berkas Excel.');
      setParseResult(null);
    } finally {
      setIsParsing(false);
    }
  };

  // Drag & drop handlers
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Filtered rows for preview
  const getFilteredRows = (): ParsedSchoolRow[] => {
    if (!parseResult) return [];
    return parseResult.rows.filter((r) => {
      // Tab filter
      if (previewFilter === 'NEW' && r.status !== 'NEW') return false;
      if (previewFilter === 'UPDATE' && r.status !== 'UPDATE') return false;
      if (previewFilter === 'INVALID' && r.status !== 'INVALID') return false;

      // Text search
      if (previewSearch.trim()) {
        const query = previewSearch.toLowerCase();
        const matchNpsn = r.npsn.toLowerCase().includes(query);
        const matchName = r.name.toLowerCase().includes(query);
        const matchAddress = r.address.toLowerCase().includes(query);
        const matchSub = r.subDistrict.toLowerCase().includes(query);
        const matchKs = r.principalName.toLowerCase().includes(query);
        return matchNpsn || matchName || matchAddress || matchSub || matchKs;
      }

      return true;
    });
  };

  // Save to backend
  const handleSubmit = async () => {
    if (!parseResult) return;

    // Filter rows to submit
    const validRows = parseResult.rows.filter((r) => {
      if (r.status === 'INVALID') return false;
      if (r.status === 'UPDATE' && !updateExisting) return false;
      return true;
    });

    if (validRows.length === 0) {
      setParseError('Tidak ada data satuan pendidikan valid yang siap diunggah.');
      return;
    }

    setIsSubmitting(true);
    setParseError(null);

    try {
      const itemsToUpload = validRows.map((r) => ({
        npsn: r.npsn,
        name: r.name,
        level: r.level as any,
        address: r.address,
        subDistrict: r.subDistrict,
        city: r.city,
        principalName: r.principalName !== '-' ? r.principalName : '',
        phone: r.phone !== '-' ? r.phone : '',
        email: r.email !== '-' ? r.email : '',
        accreditation: r.accreditation,
        supervisorName: r.supervisorName !== '-' ? r.supervisorName : '',
        status: 'active'
      }));

      const res = await api.importSchoolsBatch({
        items: itemsToUpload,
        updateExisting
      });

      setSubmitSuccess({
        total: res.total,
        added: res.added,
        updated: res.updated
      });

      onSuccess({
        total: res.total,
        added: res.added,
        updated: res.updated
      });
    } catch (err: any) {
      console.error('Error batch uploading schools:', err);
      setParseError(err.message || 'Gagal menyimpan data ke sistem. Silakan coba beberapa saat lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRows = getFilteredRows();
  const validCandidatesCount = parseResult
    ? parseResult.rows.filter((r) => r.status !== 'INVALID' && (updateExisting || r.status !== 'UPDATE')).length
    : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Unggah Data Satuan Pendidikan Secara Serentak"
      subtitle="Import dan sinkronisasi data sekolah massal menggunakan format berkas Microsoft Excel (.xlsx / .xls) atau CSV"
      maxWidth="5xl"
      id="modal-upload-satuan-pendidikan"
    >
      <div className="space-y-5">
        {/* SUCCESS VIEW */}
        {submitSuccess ? (
          <div className="text-center py-8 px-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in-50">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Data Satuan Pendidikan Berhasil Diunggah!
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto mb-6">
              Seluruh data sekolah yang diunggah telah berhasil diverifikasi dan disimpan ke database sistem supervisi dinas pendidikan.
            </p>

            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto mb-6">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Total Diproses</span>
                <span className="text-xl font-bold text-slate-900">{submitSuccess.total}</span>
              </div>
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-[11px] font-bold text-emerald-700 uppercase block">Sekolah Baru</span>
                <span className="text-xl font-bold text-emerald-700">{submitSuccess.added}</span>
              </div>
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl">
                <span className="text-[11px] font-bold text-blue-700 uppercase block">Diperbarui</span>
                <span className="text-xl font-bold text-blue-700">{submitSuccess.updated}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors inline-flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Unggah File Lainnya</span>
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors inline-flex items-center gap-2"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Selesai & Lihat Data Sekolah</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* STEP 1: TEMPLATE DOWNLOAD BANNER */}
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>File Template Excel Satuan Pendidikan</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                      Resmi Kemdikbud / Dinas
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Gunakan format template ini untuk mengisi data NPSN, nama sekolah, jenjang, alamat, kepala sekolah, dan pengawas secara serentak.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={downloadSchoolExcelTemplate}
                id="btn-download-excel-template-inside-modal"
                className="px-3.5 py-2 text-xs font-bold text-emerald-800 bg-white hover:bg-emerald-100/70 border border-emerald-300 rounded-lg shadow-2xs hover:shadow-xs transition-all inline-flex items-center gap-2 shrink-0"
              >
                <Download className="w-3.5 h-3.5 text-emerald-700" />
                <span>Unduh Template Excel (.xlsx)</span>
              </button>
            </div>

            {/* ERROR ALERT */}
            {parseError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-rose-800 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <div className="flex-1">
                  <span className="font-bold">Perhatian:</span> {parseError}
                </div>
              </div>
            )}

            {/* STEP 2: DROP ZONE / FILE SELECTOR (IF NO FILE YET) */}
            {!parseResult && (
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 sm:p-10 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-50/60 scale-[0.99]'
                    : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/70 bg-white'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFile(e.target.files[0]);
                    }
                  }}
                />

                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs">
                  {isParsing ? (
                    <RefreshCw className="w-7 h-7 animate-spin text-indigo-600" />
                  ) : (
                    <Upload className="w-7 h-7 text-indigo-600" />
                  )}
                </div>

                <h4 className="text-sm font-bold text-slate-800 mb-1">
                  {isParsing
                    ? 'Sedang Membaca & Memvalidasi File Excel...'
                    : 'Tarik & Letakkan File Excel di Sini, atau Klik untuk Memilih'}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-3">
                  Format yang didukung: <span className="font-semibold text-slate-700">.xlsx, .xls, .csv</span> (Maksimal 10 MB atau 1.000 baris sekolah)
                </p>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Sistem otomatis mencocokkan kolom NPSN, Nama Sekolah, Jenjang, dll.</span>
                </div>
              </div>
            )}

            {/* STEP 3: PREVIEW & VALIDATION (IF FILE PARSED) */}
            {parseResult && (
              <div className="space-y-4">
                {/* File Header Bar */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{selectedFile?.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          ({((selectedFile?.size || 0) / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {parseResult.totalRows} baris terdeteksi • {parseResult.validRows} siap diimpor
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors inline-flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Ganti File</span>
                    </button>
                  </div>
                </div>

                {/* KPI Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPreviewFilter('ALL')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      previewFilter === 'ALL'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 block">
                      Total Baris
                    </span>
                    <span className="text-lg font-bold">{parseResult.totalRows}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewFilter('NEW')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      previewFilter === 'NEW'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-emerald-50/70 border-emerald-200 text-emerald-800 hover:bg-emerald-100/70'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 block">
                      Sekolah Baru
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-bold">{parseResult.newCount}</span>
                      <span className="text-[10px] opacity-80">(Belum Terdaftar)</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewFilter('UPDATE')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      previewFilter === 'UPDATE'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-blue-50/70 border-blue-200 text-blue-800 hover:bg-blue-100/70'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 block">
                      Pembaruan (Upsert)
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-bold">{parseResult.updateCount}</span>
                      <span className="text-[10px] opacity-80">(NPSN Terdaftar)</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewFilter('INVALID')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      previewFilter === 'INVALID'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-rose-50/70 border-rose-200 text-rose-800 hover:bg-rose-100/70'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 block">
                      Tidak Lengkap
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-bold">{parseResult.invalidCount}</span>
                      {parseResult.invalidCount > 0 && (
                        <span className="text-[10px] opacity-80">(Dilewati)</span>
                      )}
                    </div>
                  </button>
                </div>

                {/* Filter and Option Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Saring nama sekolah, NPSN, atau kecamatan..."
                      value={previewSearch}
                      onChange={(e) => setPreviewSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors">
                    <input
                      type="checkbox"
                      checked={updateExisting}
                      onChange={(e) => setUpdateExisting(e.target.checked)}
                      className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="font-medium">
                      Perbarui otomatis jika NPSN sudah ada di sistem ({parseResult.updateCount} data)
                    </span>
                  </label>
                </div>

                {/* PREVIEW TABLE */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <div className="max-h-72 overflow-y-auto overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider sticky top-0 z-10 border-b border-slate-200">
                        <tr>
                          <th className="px-3.5 py-2.5 w-12">No</th>
                          <th className="px-3.5 py-2.5">Status</th>
                          <th className="px-3.5 py-2.5">NPSN</th>
                          <th className="px-3.5 py-2.5">Nama Satuan Pendidikan</th>
                          <th className="px-3.5 py-2.5">Jenjang</th>
                          <th className="px-3.5 py-2.5">Kecamatan</th>
                          <th className="px-3.5 py-2.5">Kepala Sekolah</th>
                          <th className="px-3.5 py-2.5">Catatan Validasi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {filteredRows.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                              Tidak ada data yang cocok dengan kriteria filter saat ini.
                            </td>
                          </tr>
                        ) : (
                          filteredRows.map((row, idx) => (
                            <tr
                              key={idx}
                              className={`transition-colors ${
                                row.status === 'INVALID'
                                  ? 'bg-rose-50/50'
                                  : row.status === 'UPDATE'
                                  ? 'hover:bg-blue-50/40'
                                  : 'hover:bg-emerald-50/40'
                              }`}
                            >
                              <td className="px-3.5 py-2.5 font-mono text-[11px] text-slate-400">
                                {row.rowNumber}
                              </td>

                              <td className="px-3.5 py-2.5 whitespace-nowrap">
                                {row.status === 'NEW' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    Baru
                                  </span>
                                )}
                                {row.status === 'UPDATE' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                    Update
                                  </span>
                                )}
                                {row.status === 'INVALID' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                    <AlertCircle className="w-2.5 h-2.5" />
                                    Tidak Valid
                                  </span>
                                )}
                              </td>

                              <td className="px-3.5 py-2.5 font-mono font-bold text-slate-800">
                                {row.npsn || <span className="text-rose-500 italic">Kosong</span>}
                              </td>

                              <td className="px-3.5 py-2.5 font-semibold text-slate-900">
                                {row.name || <span className="text-rose-500 italic">Kosong</span>}
                              </td>

                              <td className="px-3.5 py-2.5">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  {row.level}
                                </span>
                              </td>

                              <td className="px-3.5 py-2.5 text-slate-700">
                                {row.subDistrict}
                              </td>

                              <td className="px-3.5 py-2.5 text-slate-700">
                                {row.principalName || '-'}
                              </td>

                              <td className="px-3.5 py-2.5">
                                {row.errors.length > 0 ? (
                                  <div className="text-[11px] text-rose-600 font-medium">
                                    {row.errors.join(', ')}
                                  </div>
                                ) : row.warnings.length > 0 ? (
                                  <div className="text-[11px] text-amber-600 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3 shrink-0" />
                                    <span>{row.warnings[0]}</span>
                                  </div>
                                ) : (
                                  <div className="text-[11px] text-emerald-600 flex items-center gap-1">
                                    <Check className="w-3 h-3 text-emerald-500" />
                                    <span>Siap disimpan</span>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* MODAL FOOTER ACTIONS */}
                <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100">
                  <div className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">{validCandidatesCount}</span> satuan pendidikan siap diunggah ke sistem.
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                      disabled={isSubmitting}
                    >
                      Batal
                    </button>

                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={validCandidatesCount === 0 || isSubmitting}
                      className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors inline-flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Menyimpan ke Sistem...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Unggah & Simpan {validCandidatesCount} Sekolah</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};
