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
  Users,
  Check,
  BookOpen,
  GraduationCap
} from 'lucide-react';
import { Modal } from './Modal';
import { Teacher, School } from '../../types';
import {
  downloadTeacherExcelTemplate,
  parseTeacherExcelFile,
  ParseTeacherResult,
  ParsedTeacherRow
} from '../../utils/excelTeacherHelper';
import { api } from '../../services/api';

interface UploadGuruExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingTeachers: Teacher[];
  schools: School[];
  onSuccess: (result: { total: number; added: number; updated: number }) => void;
}

export const UploadGuruExcelModal: React.FC<UploadGuruExcelModalProps> = ({
  isOpen,
  onClose,
  existingTeachers,
  schools,
  onSuccess
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseTeacherResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  // Filter & Search states
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

  const handleFile = async (file: File) => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!validExtensions.includes(fileExt)) {
      setParseError('Format berkas tidak didukung. Harap unggah file Excel (.xlsx, .xls) atau CSV.');
      return;
    }

    setSelectedFile(file);
    setParseError(null);
    setIsParsing(true);

    try {
      const result = await parseTeacherExcelFile(file, existingTeachers, schools);
      setParseResult(result);
    } catch (err: any) {
      setParseError(err.message || 'Terjadi kesalahan saat memproses berkas Excel data guru.');
      setParseResult(null);
    } finally {
      setIsParsing(false);
    }
  };

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

  const handleSubmit = async () => {
    if (!parseResult) return;

    const validRows = parseResult.rows.filter((r) => r.status !== 'INVALID');
    if (validRows.length === 0) {
      alert('Tidak ada baris data guru yang valid untuk diunggah.');
      return;
    }

    setIsSubmitting(true);
    try {
      const itemsToUpload = validRows.map((r) => ({
        nip: r.nip,
        name: r.name,
        teacherType: r.teacherType,
        subject: r.subject,
        classGrade: r.classGrade,
        schoolId: r.schoolId,
        schoolName: r.schoolName,
        gender: r.gender,
        employmentStatus: r.employmentStatus,
        rankGrade: r.rankGrade,
        position: r.position,
        phone: r.phone,
        email: r.email,
        nik: r.nik,
        nuptk: r.nuptk
      }));

      const res = await api.importTeachersBatch({
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
      console.error('Error batch uploading teachers:', err);
      alert(err.message || 'Gagal mengunggah data guru secara serentak.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered rows for preview
  const filteredRows = (parseResult?.rows || []).filter((r) => {
    if (previewFilter !== 'ALL' && r.status !== previewFilter) return false;
    if (!previewSearch) return true;
    const query = previewSearch.toLowerCase();
    return (
      r.name.toLowerCase().includes(query) ||
      r.nip.toLowerCase().includes(query) ||
      r.subject.toLowerCase().includes(query) ||
      r.schoolName.toLowerCase().includes(query)
    );
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Unggah Data Guru Secara Serentak (Excel)"
      maxWidth="6xl"
      id="modal-upload-guru-excel"
    >
      <div className="space-y-4">
        {/* Step 1: Success State */}
        {submitSuccess ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs">
              <Check className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Data Guru Berhasil Diunggah!
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Sebanyak <strong className="text-slate-800">{submitSuccess.total}</strong> data guru telah diproses ke dalam sistem supervisi dinas.
              </p>
            </div>

            <div className="flex justify-center gap-4 py-2">
              <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs">
                <span className="text-emerald-700 font-semibold">{submitSuccess.added} Guru Baru Ditambahkan</span>
              </div>
              <div className="px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-lg text-xs">
                <span className="text-indigo-700 font-semibold">{submitSuccess.updated} Guru Diperbarui</span>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 shadow-xs transition-colors"
              >
                Selesai & Tutup
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Header info & Template Download Shortcut */}
            <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-indigo-900">
              <div className="flex items-start gap-2.5">
                <Users className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Format Excel Standar Dinas Pendidikan:</span>
                  <p className="text-[11px] text-indigo-700">
                    Mendukung klasifikasi <strong>Guru Kelas</strong> dan <strong>Guru Mapel</strong> (PAI, PJOK, IPA, IPS, IPAS, Matematika, Pendidikan Pancasila, TIK, KKA, Bahasa Inggris, Bahasa Jawa, Muatan Lokal, BK).
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="btn-modal-download-teacher-template"
                onClick={downloadTeacherExcelTemplate}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 rounded-lg font-semibold shadow-2xs transition-colors shrink-0 text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Template Excel</span>
              </button>
            </div>

            {/* Drag and drop upload zone */}
            {!parseResult && (
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-50/50'
                    : 'border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-white'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFile(e.target.files[0]);
                    }
                  }}
                />

                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Pilih Berkas Excel Data Guru atau Seret ke Sini
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Format file didukung: .xlsx, .xls, .csv (Maksimal 5 MB)
                    </p>
                  </div>
                  <button
                    type="button"
                    className="mt-2 px-4 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
                  >
                    Jelajahi File
                  </button>
                </div>
              </div>
            )}

            {/* Parsing spinner */}
            {isParsing && (
              <div className="py-8 text-center space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
                <p className="text-xs font-medium text-slate-600">
                  Memvalidasi data guru dan memetakan mata pelajaran...
                </p>
              </div>
            )}

            {/* Error Message */}
            {parseError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">Gagal memproses berkas:</strong> {parseError}
                </div>
              </div>
            )}

            {/* Parse Result Summary & Table Preview */}
            {parseResult && (
              <div className="space-y-3">
                {/* File info bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span className="font-semibold text-slate-800">{selectedFile?.name}</span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      ({(Number(selectedFile?.size || 0) / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium underline"
                  >
                    Ganti Berkas Lain
                  </button>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewFilter('ALL')}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      previewFilter === 'ALL'
                        ? 'border-slate-800 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-bold opacity-70">Total Terbaca</div>
                    <div className="text-base font-bold">{parseResult.totalRows} Guru</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewFilter('NEW')}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      previewFilter === 'NEW'
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50 text-emerald-900'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-bold opacity-70">Guru Baru</div>
                    <div className="text-base font-bold">{parseResult.newCount}</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewFilter('UPDATE')}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      previewFilter === 'UPDATE'
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-indigo-200 bg-indigo-50/60 hover:bg-indigo-50 text-indigo-900'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-bold opacity-70">Data Diperbarui</div>
                    <div className="text-base font-bold">{parseResult.updateCount}</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewFilter('INVALID')}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      previewFilter === 'INVALID'
                        ? 'border-rose-600 bg-rose-600 text-white'
                        : 'border-rose-200 bg-rose-50/60 hover:bg-rose-50 text-rose-900'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-bold opacity-70">Perlu Perbaikan</div>
                    <div className="text-base font-bold">{parseResult.invalidCount}</div>
                  </button>
                </div>

                {/* Filter and Search toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="relative w-72">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Cari dalam pratinjau (nama, NIP, mapel)..."
                      value={previewSearch}
                      onChange={(e) => setPreviewSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={updateExisting}
                      onChange={(e) => setUpdateExisting(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span>Perbarui profil jika NIP/Nama sudah ada di sistem</span>
                  </label>
                </div>

                {/* Preview Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <div className="max-h-72 overflow-y-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 sticky top-0 z-10">
                        <tr>
                          <th className="px-3 py-2.5 w-12 text-center">No</th>
                          <th className="px-3 py-2.5">Status</th>
                          <th className="px-3 py-2.5">Nama & NIP</th>
                          <th className="px-3 py-2.5">Jenis & Tugas Mengajar</th>
                          <th className="px-3 py-2.5">Satuan Pendidikan</th>
                          <th className="px-3 py-2.5">Status Kepegawaian</th>
                          <th className="px-3 py-2.5">Catatan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredRows.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-xs">
                              Tidak ada data yang sesuai dengan filter pratinjau.
                            </td>
                          </tr>
                        ) : (
                          filteredRows.map((row) => (
                            <tr
                              key={row.rowNumber}
                              className={`hover:bg-slate-50/70 transition-colors ${
                                row.status === 'INVALID' ? 'bg-rose-50/30' : ''
                              }`}
                            >
                              <td className="px-3 py-2 font-mono text-[11px] text-slate-400 text-center">
                                {row.rowNumber}
                              </td>

                              <td className="px-3 py-2">
                                {row.status === 'NEW' && (
                                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                                    Baru
                                  </span>
                                )}
                                {row.status === 'UPDATE' && (
                                  <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-[10px]">
                                    Perbarui
                                  </span>
                                )}
                                {row.status === 'INVALID' && (
                                  <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px]">
                                    Bermasalah
                                  </span>
                                )}
                              </td>

                              <td className="px-3 py-2">
                                <div className="font-bold text-slate-900">{row.name}</div>
                                <div className="font-mono text-[10px] text-slate-400">
                                  NIP: {row.nip} • JK: {row.gender}
                                </div>
                              </td>

                              <td className="px-3 py-2">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                      row.teacherType === 'Guru Kelas'
                                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                                        : 'bg-cyan-50 text-cyan-800 border-cyan-200'
                                    }`}
                                  >
                                    {row.teacherType}
                                  </span>
                                  <span className="font-semibold text-slate-800">{row.subject}</span>
                                </div>
                              </td>

                              <td className="px-3 py-2 font-medium text-slate-700">
                                {row.schoolName}
                              </td>

                              <td className="px-3 py-2">
                                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[10px]">
                                  {row.employmentStatus}
                                </span>
                              </td>

                              <td className="px-3 py-2">
                                {row.errors.length > 0 && (
                                  <div className="text-[10px] text-rose-600 font-medium flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3 shrink-0" />
                                    <span>{row.errors.join(', ')}</span>
                                  </div>
                                )}
                                {row.warnings.length > 0 && row.errors.length === 0 && (
                                  <div className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3 shrink-0" />
                                    <span>{row.warnings.join(', ')}</span>
                                  </div>
                                )}
                                {row.errors.length === 0 && row.warnings.length === 0 && (
                                  <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                                    <span>Siap impor</span>
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

                {/* Bottom action buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Batal / Unggah Ulang
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      id="btn-confirm-upload-teachers"
                      disabled={isSubmitting || parseResult.validRows === 0}
                      onClick={handleSubmit}
                      className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Mengunggah Data Guru...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>
                            Impor {parseResult.validRows} Data Guru
                          </span>
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
