import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Link2,
  ExternalLink,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  Plus,
  Search,
  MessageSquare,
  FileCheck,
  Send,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ExportButton } from '../components/common/ExportButton';
import { LearningModule, Teacher } from '../types';

export const ModulAjarView: React.FC = () => {
  const { currentUser, currentRole, activeEducationYear } = useAuth();

  const [modules, setModules] = useState<LearningModule[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState('');

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const [selectedModule, setSelectedModule] = useState<LearningModule | null>(null);

  // Link / Upload Form (Google Drive Link)
  const [uploadForm, setUploadForm] = useState({
    title: '',
    subject: 'IPAS',
    grade: 'Fase B / Kelas IV',
    semester: 'Ganjil',
    description: '',
    driveUrl: '',
    fileName: ''
  });

  // Review Form
  const [reviewStatus, setReviewStatus] = useState<'DISETUJUI' | 'PERLU_REVISI'>('DISETUJUI');
  const [reviewNotes, setReviewNotes] = useState('');

  const loadData = async () => {
    try {
      const schoolFilter =
        currentRole === 'KEPALA_SEKOLAH' || currentRole === 'GURU'
          ? currentUser?.schoolId
          : undefined;

      const teacherFilter = currentRole === 'GURU' ? currentUser?.id : undefined;

      const [mList, tList] = await Promise.all([
        api.getLearningModules({
          schoolId: schoolFilter,
          teacherId: teacherFilter
        }),
        api.getTeachers(schoolFilter)
      ]);

      setModules(mList);
      setTeachers(tList);
    } catch (err) {
      console.error('Error loading modules:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentRole, currentUser]);

  const handleSaveUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!uploadForm.driveUrl || !uploadForm.driveUrl.trim()) {
      alert('Mohon masukkan link tautan dokumen Google Drive.');
      return;
    }

    try {
      const myTeacher = teachers.find(
        (t) => t.userId === currentUser.id || t.email === currentUser.email
      );

      let cleanDriveUrl = uploadForm.driveUrl.trim();
      if (!cleanDriveUrl.startsWith('http://') && !cleanDriveUrl.startsWith('https://')) {
        cleanDriveUrl = `https://${cleanDriveUrl}`;
      }

      await api.createLearningModule({
        teacherId: myTeacher?.id || 't-1',
        teacherName: currentUser.name,
        schoolId: currentUser.schoolId || 'sch-1',
        schoolName: myTeacher?.schoolName || 'SD Negeri Tinap 3',
        title: uploadForm.title,
        subject: uploadForm.subject,
        grade: uploadForm.grade,
        semester: uploadForm.semester,
        fileUrl: cleanDriveUrl,
        fileName: uploadForm.fileName.trim() || `${uploadForm.title} (Google Drive)`,
        fileSize: 'Tautan Google Drive',
        fileType: 'link_drive',
        description: uploadForm.description
      });

      setIsUploadModalOpen(false);
      setUploadForm({
        title: '',
        subject: 'IPAS',
        grade: 'Fase B / Kelas IV',
        semester: 'Ganjil',
        description: '',
        driveUrl: '',
        fileName: ''
      });
      loadData();
      alert('Tautan Modul Ajar di Google Drive berhasil disimpan dan diajukan untuk verifikasi.');
    } catch (err) {
      console.error('Error saving module:', err);
    }
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModule || !currentUser) return;

    try {
      await api.reviewLearningModule(selectedModule.id, {
        status: reviewStatus,
        feedback: reviewNotes,
        reviewerName: currentUser.name,
        reviewerRole: currentRole || 'KEPALA_SEKOLAH'
      });

      setIsReviewModalOpen(false);
      setReviewNotes('');
      loadData();
      alert(`Modul ajar telah berstatus ${reviewStatus === 'DISETUJUI' ? 'Disetujui' : 'Perlu Revisi'}.`);
    } catch (err) {
      console.error('Error saving review:', err);
    }
  };

  const filteredModules = modules.filter((m) => {
    const matchQuery =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = selectedStatusFilter ? m.status === selectedStatusFilter : true;
    return matchQuery && matchStatus;
  });

  return (
    <div id="modul-ajar-view" className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Repositori & Verifikasi Modul Ajar Pembelajaran Mendalam
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Pusat penautan dan verifikasi perangkat ajar berbasis prinsip Pembelajaran Mendalam (PM) melalui tautan Google Drive. Dilengkapi riwayat versi, catatan revisi, dan validasi Kepala Sekolah / Pengawas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ExportButton data={modules} fileName="rekap_modul_ajar" />
          {currentRole === 'GURU' && (
            <button
              onClick={() => {
                setUploadForm({
                  title: 'Modul Ajar IPAS - Ekosistem dan Rantai Makanan',
                  subject: 'IPAS',
                  grade: 'Fase B / Kelas IV',
                  semester: 'Ganjil',
                  description: 'Mengintegrasikan aspek pembelajaran mendalam dengan pendekatan inkuiri kontekstual dan refleksi terbimbing.',
                  driveUrl: 'https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs/edit?usp=sharing',
                  fileName: 'Modul Ajar IPAS Kelas IV (Google Drive)'
                });
                setIsUploadModalOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-xs transition-colors"
            >
              <Link2 className="w-4 h-4" />
              <span>Tautkan Modul Ajar (Link Drive)</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Modul Masuk</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{modules.length}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Semua status berkas</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Telah Disetujui</p>
          <h3 className="text-2xl font-bold text-emerald-600 mt-1">
            {modules.filter((m) => m.status === 'DISETUJUI').length}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Siap diimplementasikan</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Menunggu Verifikasi</p>
          <h3 className="text-2xl font-bold text-indigo-600 mt-1">
            {modules.filter((m) => m.status === 'DIAJUKAN' || m.status === 'DIPERIKSA').length}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Dalam antrean telaah</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Perlu Revisi</p>
          <h3 className="text-2xl font-bold text-amber-600 mt-1">
            {modules.filter((m) => m.status === 'PERLU_REVISI').length}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Membutuhkan perbaikan</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari judul modul, guru, mapel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Semua Status</option>
              <option value="DISETUJUI">Disetujui</option>
              <option value="DIAJUKAN">Diajukan</option>
              <option value="PERLU_REVISI">Perlu Revisi</option>
            </select>
          </div>

          <div className="text-xs text-slate-500">
            Ditemukan <strong className="text-slate-900">{filteredModules.length}</strong> modul ajar
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Modul Ajar & Tautan Drive</th>
                <th className="px-4 py-3">Penyusun / Guru</th>
                <th className="px-4 py-3">Mata Pelajaran & Jenjang</th>
                <th className="px-4 py-3">Versi & Tanggal</th>
                <th className="px-4 py-3">Status Verifikasi</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredModules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Tidak ditemukan dokumen modul ajar.
                  </td>
                </tr>
              ) : (
                filteredModules.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900 leading-snug">{m.title}</div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {m.fileUrl ? (
                          <a
                            href={m.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-900 hover:underline bg-blue-50/90 px-2 py-0.5 rounded border border-blue-200 text-[11px] transition-colors"
                          >
                            <ExternalLink className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[240px]">{m.fileName || 'Buka di Google Drive'}</span>
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-500 text-[11px]">
                            <FileText className="w-3 h-3" />
                            <span>{m.fileName}</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-900">{m.teacherName}</div>
                      <div className="text-[10px] text-slate-500">{m.schoolName}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-slate-800">{m.subject}</div>
                      <div className="text-[10px] text-slate-500">
                        {m.grade} • Semester {m.semester}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">
                        v{m.version}.0
                      </span>
                      <div className="text-[10px] text-slate-400 mt-1">{m.uploadDate}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge status={m.status} size="sm" />
                      {m.feedback && (
                        <div className="text-[10px] text-slate-500 mt-1 line-clamp-1 italic max-w-xs">
                          "{m.feedback}"
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {m.fileUrl && (
                          <a
                            href={m.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors inline-flex items-center"
                            title="Buka Dokumen di Google Drive"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}

                        <button
                          onClick={() => {
                            setSelectedModule(m);
                            setIsPreviewModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          title="Lihat Detail Modul"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {(currentRole === 'KEPALA_SEKOLAH' ||
                          currentRole === 'PENGAWAS' ||
                          currentRole === 'ADMIN_DINAS') && (
                          <button
                            onClick={() => {
                              setSelectedModule(m);
                              setReviewStatus(m.status === 'DISETUJUI' ? 'DISETUJUI' : 'DISETUJUI');
                              setReviewNotes(m.feedback || '');
                              setIsReviewModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                            title="Telaah / Verifikasi Modul"
                          >
                            <FileCheck className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tautkan Modul (Guru) */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Tautkan Modul Ajar (Google Drive / Cloud Link)"
        subtitle="Input link tautan dokumen file yang disimpan di Google Drive untuk disupervisi"
        maxWidth="xl"
      >
        <form onSubmit={handleSaveUpload} className="space-y-4">
          <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-blue-900">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Ketentuan Pengajuan Dokumen Modul Ajar Guru:</p>
              <p className="text-[11px] leading-relaxed text-blue-800">
                Sesuai kebijakan penyederhanaan sistem, guru <strong>tidak perlu mengunggah file utuh</strong> berupa PDF atau DOCX. Cukup simpan dokumen modul ajar Anda di Google Drive dan cantumkan link tautannya pada kolom berikut.
              </p>
              <div className="text-[10px] text-blue-800 bg-white/70 p-2 rounded border border-blue-100 mt-1">
                <strong>Cara berbagi di Google Drive:</strong> Klik tombol <em>Bagikan (Share)</em> &rarr; Ubah Akses Umum menjadi <em>"Siapa saja yang memiliki link dapat melihat" (Anyone with the link can view)</em> &rarr; Salin link lalu tempelkan di bawah.
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Judul / Topik Modul Ajar *
            </label>
            <input
              type="text"
              required
              value={uploadForm.title}
              onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              placeholder="Contoh: Modul Ajar IPAS - Rantai Makanan & Jaring-Jaring Makanan"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mata Pelajaran *</label>
              <input
                type="text"
                required
                value={uploadForm.subject}
                onChange={(e) => setUploadForm({ ...uploadForm, subject: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Fase / Kelas *</label>
              <input
                type="text"
                required
                value={uploadForm.grade}
                onChange={(e) => setUploadForm({ ...uploadForm, grade: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Semester *</label>
              <select
                value={uploadForm.semester}
                onChange={(e) => setUploadForm({ ...uploadForm, semester: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              >
                <option value="Ganjil">Ganjil</option>
                <option value="Genap">Genap</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Link Tautan Dokumen Google Drive *</span>
              <span className="text-[10px] text-blue-600 font-normal">Wajib dapat diakses</span>
            </label>
            <div className="relative">
              <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="url"
                required
                value={uploadForm.driveUrl}
                onChange={(e) => setUploadForm({ ...uploadForm, driveUrl: e.target.value })}
                placeholder="https://drive.google.com/file/d/... atau https://docs.google.com/document/d/..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Keterangan / Nama Dokumen di Drive (Opsional)
            </label>
            <input
              type="text"
              value={uploadForm.fileName}
              onChange={(e) => setUploadForm({ ...uploadForm, fileName: e.target.value })}
              placeholder="Contoh: Modul Ajar IPAS Kelas IV - Fase B (Google Drive)"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Deskripsi & Catatan Pembelajaran Mendalam
            </label>
            <textarea
              rows={3}
              value={uploadForm.description}
              onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              placeholder="Jelaskan bagaimana modul ini mengintegrasikan aspek pembelajaran mendalam, diferensiasi konten, atau asesmen autentik..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs flex items-center gap-1.5"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Simpan & Ajukan Tautan Modul</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Preview Detail Modul */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title="Detail Dokumen Modul Ajar"
        subtitle={selectedModule?.title}
        maxWidth="xl"
      >
        {selectedModule && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block">Guru Penyusun:</span>
                <span className="font-bold text-slate-900">{selectedModule.teacherName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Satuan Pendidikan:</span>
                <span className="font-bold text-slate-900">{selectedModule.schoolName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Mata Pelajaran & Fase:</span>
                <span className="font-bold text-slate-900">
                  {selectedModule.subject} ({selectedModule.grade})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Status Dokumen:</span>
                <Badge status={selectedModule.status} size="sm" className="mt-0.5" />
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-800 mb-1">Deskripsi & Pendekatan:</h4>
              <p className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200 leading-relaxed">
                {selectedModule.description || 'Tidak ada deskripsi tambahan.'}
              </p>
            </div>

            {selectedModule.feedback && (
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs space-y-1">
                <p className="font-bold text-blue-900 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-700" />
                  <span>Catatan Reviewer ({selectedModule.reviewedBy || 'Kepala Sekolah'}):</span>
                </p>
                <p className="text-blue-800 leading-relaxed italic">"{selectedModule.feedback}"</p>
              </div>
            )}

            <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg shrink-0">
                  <ExternalLink className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 truncate">
                    {selectedModule.fileName || 'Dokumen Modul Ajar (Google Drive)'}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono truncate max-w-sm">
                    {selectedModule.fileUrl || 'Tautan Google Drive tersimpan'}
                  </p>
                </div>
              </div>
              {selectedModule.fileUrl ? (
                <a
                  href={selectedModule.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition-colors shrink-0 flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka di Google Drive</span>
                </a>
              ) : (
                <span className="text-xs text-slate-400 italic">Tautan tidak tersedia</span>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Telaah / Review (Kepala Sekolah & Pengawas) */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title="Verifikasi & Telaah Modul Ajar"
        subtitle={`Dokumen oleh ${selectedModule?.teacherName}`}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveReview} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Keputusan Telaah *</label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  reviewStatus === 'DISETUJUI'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="reviewStatus"
                  value="DISETUJUI"
                  checked={reviewStatus === 'DISETUJUI'}
                  onChange={() => setReviewStatus('DISETUJUI')}
                  className="text-emerald-600"
                />
                <div>
                  <p className="text-xs">Setujui Modul</p>
                  <p className="text-[10px] font-normal text-slate-500">Memenuhi standar PM</p>
                </div>
              </label>

              <label
                className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  reviewStatus === 'PERLU_REVISI'
                    ? 'bg-amber-50 border-amber-500 text-amber-900 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="reviewStatus"
                  value="PERLU_REVISI"
                  checked={reviewStatus === 'PERLU_REVISI'}
                  onChange={() => setReviewStatus('PERLU_REVISI')}
                  className="text-amber-600"
                />
                <div>
                  <p className="text-xs">Minta Revisi</p>
                  <p className="text-[10px] font-normal text-slate-500">Perlu penyesuaian</p>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Catatan & Masukan Perbaikan (Feedback) *
            </label>
            <textarea
              rows={4}
              required
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              placeholder="Berikan catatan konstruktif mengenai penyelarasan tujuan pembelajaran, diferensiasi konten, atau rubrik refleksi PM..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsReviewModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
            >
              Simpan Keputusan Telaah
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
