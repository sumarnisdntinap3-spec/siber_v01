import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  FileText,
  UserCheck,
  Calendar,
  Building2,
  Award,
  Check,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ExportButton } from '../components/common/ExportButton';
import { SupervisionRequest, Teacher, School } from '../types';

export const SupervisiView: React.FC = () => {
  const { currentUser, currentRole, activeEducationYear } = useAuth();

  const [supervisions, setSupervisions] = useState<SupervisionRequest[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schools, setSchools] = useState<School[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);

  const [selectedSupervision, setSelectedSupervision] = useState<SupervisionRequest | null>(null);

  // Create Form State (Kepala Sekolah)
  const [targetTeacherId, setTargetTeacherId] = useState('');
  const [supervisionType, setSupervisionType] = useState<'KLINIS' | 'TERENCANA' | 'PEMBELAJARAN_MENDALAM'>(
    'PEMBELAJARAN_MENDALAM'
  );
  const [proposedDate1, setProposedDate1] = useState('2026-08-25');
  const [proposedTime1, setProposedTime1] = useState('08:00 - 09:30 WIB');
  const [proposedDate2, setProposedDate2] = useState('2026-08-27');
  const [proposedTime2, setProposedTime2] = useState('09:45 - 11:15 WIB');
  const [notes, setNotes] = useState('Supervisi fokus implementasi aspek interaktif & diferensiasi PM.');

  // Approval Form State (Pengawas)
  const [approvalAction, setApprovalAction] = useState<'DISETUJUI' | 'DITOLAK' | 'PERLU_REVISI'>('DISETUJUI');
  const [selectedApprovedDate, setSelectedApprovedDate] = useState('');
  const [selectedApprovedTime, setSelectedApprovedTime] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');

  // Score Input State (Pengawas / Kepala Sekolah)
  const [completionScore, setCompletionScore] = useState<number>(92);
  const [finalFeedback, setFinalFeedback] = useState('Praktik pembelajaran sangat baik.');

  const loadData = async () => {
    try {
      const schoolFilter =
        currentRole === 'KEPALA_SEKOLAH' || currentRole === 'GURU'
          ? currentUser?.schoolId
          : undefined;

      const supervisorFilter = currentRole === 'PENGAWAS' ? currentUser?.id : undefined;

      const [tList, schList] = await Promise.all([
        api.getTeachers(schoolFilter),
        api.getSchools()
      ]);

      const myTeacher =
        currentRole === 'GURU' && currentUser
          ? tList.find(
              (t) =>
                t.userId === currentUser.id ||
                t.email === currentUser.email ||
                t.nip === currentUser.nip
            )
          : undefined;

      const teacherFilter = currentRole === 'GURU' ? (myTeacher?.id || currentUser?.id) : undefined;

      const sList = await api.getSupervisionRequests({
        schoolId: schoolFilter,
        supervisorId: supervisorFilter,
        teacherId: teacherFilter
      });

      setSupervisions(sList);
      setTeachers(tList);
      setSchools(schList);
    } catch (err) {
      console.error('Error loading supervisions:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentRole, currentUser]);

  const handleCreateSupervision = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = teachers.find((tc) => tc.id === targetTeacherId);
    if (!t || !currentUser) return;

    try {
      await api.createSupervisionRequest({
        teacherId: t.id,
        teacherName: t.name,
        schoolId: t.schoolId,
        schoolName: t.schoolName,
        subject: t.subject,
        grade: 'Fase B / Kelas IV',
        supervisionType,
        proposedDate1,
        proposedTime1,
        proposedDate2,
        proposedTime2,
        notes,
        status: 'DIAJUKAN',
        educationYearId: activeEducationYear?.id || 'ey-2026-1'
      });

      setIsCreateModalOpen(false);
      loadData();
      alert('Jadwal Supervisi Akademik berhasil diajukan ke Pengawas Pembina.');
    } catch (err) {
      console.error('Error creating supervision:', err);
    }
  };

  const handleProcessApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupervision || !currentUser) return;

    try {
      await api.approveSupervisionRequest(selectedSupervision.id, {
        status: approvalAction,
        approvedDate: approvalAction === 'DISETUJUI' ? selectedApprovedDate || selectedSupervision.proposedDate1 : undefined,
        approvedTime: approvalAction === 'DISETUJUI' ? selectedApprovedTime || selectedSupervision.proposedTime1 : undefined,
        rejectionReason: approvalAction !== 'DISETUJUI' ? approvalNotes : undefined,
        notes: approvalNotes,
        supervisorId: currentUser.id,
        supervisorName: currentUser.name
      });

      setIsApprovalModalOpen(false);
      loadData();
      alert(`Status pengajuan supervisi berhasil diperbarui menjadi ${approvalAction}.`);
    } catch (err) {
      console.error('Error approving supervision:', err);
    }
  };

  const handleSaveScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupervision) return;

    try {
      await api.completeSupervision(selectedSupervision.id, {
        score: completionScore,
        feedback: finalFeedback
      });

      setIsScoreModalOpen(false);
      loadData();
      alert('Nilai dan evaluasi pelaksanaan supervisi berhasil disimpan.');
    } catch (err) {
      console.error('Error completing supervision:', err);
    }
  };

  const filteredSupervisions = supervisions.filter((s) => {
    const matchQ =
      s.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.schoolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSt = selectedStatusFilter ? s.status === selectedStatusFilter : true;
    return matchQ && matchSt;
  });

  return (
    <div id="supervisi-view" className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Alur Pengajuan & Persetujuan Supervisi Akademik
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Siklus perencanaan jadwal observasi kelas, persetujuan Pengawas Bina, notifikasi dinas, dan penginputan nilai tindak lanjut pasca-supervisi.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ExportButton data={supervisions} fileName="rekap_jadwal_supervisi" />
          {(currentRole === 'KEPALA_SEKOLAH' || currentRole === 'ADMIN_DINAS') && (
            <button
              onClick={() => {
                setTargetTeacherId(teachers[0]?.id || '');
                setIsCreateModalOpen(true);
              }}
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Ajukan Jadwal Supervisi Guru</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Pengajuan</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{supervisions.length}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Semua status usulan</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Menunggu Persetujuan</p>
          <h3 className="text-2xl font-bold text-amber-600 mt-1">
            {supervisions.filter((s) => s.status === 'DIAJUKAN').length}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Antrean telaah pengawas</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Jadwal Disetujui</p>
          <h3 className="text-2xl font-bold text-indigo-600 mt-1">
            {supervisions.filter((s) => s.status === 'DISETUJUI').length}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Siap dilaksanakan</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Selesai Dilaksanakan</p>
          <h3 className="text-2xl font-bold text-emerald-600 mt-1">
            {supervisions.filter((s) => s.status === 'SELESAI').length}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Telah dinilai & dievaluasi</p>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari guru, mata pelajaran, sekolah..."
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
              <option value="">Semua Status Supervisi</option>
              <option value="DIAJUKAN">Menunggu Persetujuan</option>
              <option value="DISETUJUI">Jadwal Disetujui</option>
              <option value="SELESAI">Selesai Dilaksanakan</option>
              <option value="DITOLAK">Ditolak</option>
            </select>
          </div>

          <div className="text-xs text-slate-500">
            Menampilkan <strong className="text-slate-900">{filteredSupervisions.length}</strong> jadwal
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Nama Guru & Mapel</th>
                <th className="px-4 py-3">Satuan Pendidikan</th>
                <th className="px-4 py-3">Jenis Supervisi</th>
                <th className="px-4 py-3">Jadwal Fix / Usulan</th>
                <th className="px-4 py-3">Pengawas Bina</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSupervisions.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-slate-900">{s.teacherName}</div>
                    <div className="text-[10px] text-slate-500">
                      {s.subject} ({s.grade})
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">{s.schoolName}</td>
                  <td className="px-4 py-3.5">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                      {s.supervisionType.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    {s.approvedDate ? (
                      <div className="font-bold text-emerald-800">
                        {s.approvedDate} ({s.approvedTime})
                      </div>
                    ) : (
                      <div className="text-slate-600">
                        <div>1: {s.proposedDate1} ({s.proposedTime1})</div>
                        <div className="text-[10px] text-slate-400">2: {s.proposedDate2}</div>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-slate-700 font-medium">{s.supervisorName || '-'}</td>
                  <td className="px-4 py-3.5">
                    <Badge status={s.status} size="sm" />
                    {s.score && (
                      <div className="text-[10px] text-emerald-700 font-bold mt-1">
                        Nilai Capaian: {s.score}/100
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Pengawas approval button */}
                      {(currentRole === 'PENGAWAS' || currentRole === 'ADMIN_DINAS') &&
                        s.status === 'DIAJUKAN' && (
                          <button
                            onClick={() => {
                              setSelectedSupervision(s);
                              setApprovalAction('DISETUJUI');
                              setSelectedApprovedDate(s.proposedDate1);
                              setSelectedApprovedTime(s.proposedTime1);
                              setApprovalNotes('Jadwal disetujui, mohon siapkan modul ajar dan instrumen PM.');
                              setIsApprovalModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-xs transition-colors"
                          >
                            Proses Persetujuan
                          </button>
                        )}

                      {/* Input score button if approved */}
                      {(currentRole === 'PENGAWAS' ||
                        currentRole === 'KEPALA_SEKOLAH' ||
                        currentRole === 'ADMIN_DINAS') &&
                        s.status === 'DISETUJUI' && (
                          <button
                            onClick={() => {
                              setSelectedSupervision(s);
                              setCompletionScore(92);
                              setFinalFeedback(
                                'Praktik pembelajaran mendalam berjalan sangat baik, keterlibatan aktif siswa tinggi.'
                              );
                              setIsScoreModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
                          >
                            Input Nilai Supervisi
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Ajukan Supervisi (Kepala Sekolah) */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Pengajuan Jadwal Supervisi Akademik"
        subtitle="Diajukan kepada Pengawas Pembina Sekolah"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateSupervision} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Pilih Guru yang Disupervisi *
            </label>
            <select
              required
              value={targetTeacherId}
              onChange={(e) => setTargetTeacherId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
            >
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} (NIP: {t.nip}) - {t.subject}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Jenis Supervisi Akademik *
            </label>
            <select
              value={supervisionType}
              onChange={(e) => setSupervisionType(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
            >
              <option value="PEMBELAJARAN_MENDALAM">Supervisi Pembelajaran Mendalam (PM)</option>
              <option value="KLINIS">Supervisi Klinis (Pendampingan Intensif)</option>
              <option value="TERENCANA">Supervisi Terencana / Rutin</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Opsi Tanggal Usulan 1 *
              </label>
              <input
                type="date"
                required
                value={proposedDate1}
                onChange={(e) => setProposedDate1(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Waktu Pelaksanaan 1
              </label>
              <input
                type="text"
                value={proposedTime1}
                onChange={(e) => setProposedTime1(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                placeholder="08:00 - 09:30 WIB"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Opsi Tanggal Alternatif 2 *
              </label>
              <input
                type="date"
                required
                value={proposedDate2}
                onChange={(e) => setProposedDate2(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Waktu Alternatif 2
              </label>
              <input
                type="text"
                value={proposedTime2}
                onChange={(e) => setProposedTime2(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                placeholder="09:45 - 11:15 WIB"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Catatan Fokus Supervisi
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              placeholder="Catatan untuk Pengawas..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs"
            >
              Kirim Pengajuan Jadwal
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Persetujuan (Pengawas) */}
      <Modal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        title="Proses Persetujuan Jadwal Supervisi"
        subtitle={`Pengajuan untuk ${selectedSupervision?.teacherName}`}
        maxWidth="lg"
      >
        <form onSubmit={handleProcessApproval} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Keputusan Pengawas *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setApprovalAction('DISETUJUI')}
                className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${
                  approvalAction === 'DISETUJUI'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                Setujui Jadwal
              </button>
              <button
                type="button"
                onClick={() => setApprovalAction('PERLU_REVISI')}
                className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${
                  approvalAction === 'PERLU_REVISI'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                Minta Revisi
              </button>
              <button
                type="button"
                onClick={() => setApprovalAction('DITOLAK')}
                className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${
                  approvalAction === 'DITOLAK'
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                Tolak
              </button>
            </div>
          </div>

          {approvalAction === 'DISETUJUI' && (
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-3">
              <p className="text-xs font-bold text-emerald-900">
                Pilih Tanggal Pelaksanaan Disetujui:
              </p>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-slate-800 font-medium cursor-pointer">
                  <input
                    type="radio"
                    name="selectedDate"
                    checked={selectedApprovedDate === selectedSupervision?.proposedDate1}
                    onChange={() => {
                      setSelectedApprovedDate(selectedSupervision?.proposedDate1 || '');
                      setSelectedApprovedTime(selectedSupervision?.proposedTime1 || '');
                    }}
                  />
                  <span>
                    Opsi 1: <strong>{selectedSupervision?.proposedDate1}</strong> ({selectedSupervision?.proposedTime1})
                  </span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-800 font-medium cursor-pointer">
                  <input
                    type="radio"
                    name="selectedDate"
                    checked={selectedApprovedDate === selectedSupervision?.proposedDate2}
                    onChange={() => {
                      setSelectedApprovedDate(selectedSupervision?.proposedDate2 || '');
                      setSelectedApprovedTime(selectedSupervision?.proposedTime2 || '');
                    }}
                  />
                  <span>
                    Opsi 2: <strong>{selectedSupervision?.proposedDate2}</strong> ({selectedSupervision?.proposedTime2})
                  </span>
                </label>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Catatan / Instruksi Pengawas
            </label>
            <textarea
              rows={3}
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              placeholder="Catatan persiapan observasi kelas..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsApprovalModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
            >
              Simpan Keputusan Pengawas
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Input Nilai Pelaksanaan Supervisi */}
      <Modal
        isOpen={isScoreModalOpen}
        onClose={() => setIsScoreModalOpen(false)}
        title="Input Nilai & Hasil Supervisi Akademik"
        subtitle={`Guru: ${selectedSupervision?.teacherName}`}
      >
        <form onSubmit={handleSaveScore} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Skor Nilai Hasil Supervisi (0 - 100) *
            </label>
            <input
              type="number"
              min="0"
              max="100"
              required
              value={completionScore}
              onChange={(e) => setCompletionScore(parseInt(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Evaluasi & Catatan Umpan Balik
            </label>
            <textarea
              rows={3}
              required
              value={finalFeedback}
              onChange={(e) => setFinalFeedback(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              placeholder="Catatan hasil tatap muka..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsScoreModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
            >
              Simpan Hasil Pelaksanaan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
