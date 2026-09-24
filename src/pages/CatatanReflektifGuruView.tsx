import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Sparkles,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  MessageSquare,
  Printer,
  Edit3,
  Trash2,
  School,
  UserCheck,
  Award,
  ChevronRight,
  Send,
  CloudCheck,
  HelpCircle,
  TrendingUp,
  AlertCircle,
  Eye,
  RefreshCw,
  BookOpen,
  Calendar,
  Building2,
  FileCheck2,
  Sliders,
  Check,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ReflectiveNote, SupervisionRequest, School as SchoolType, Teacher } from '../types';
import { Modal } from '../components/common/Modal';

export const CatatanReflektifGuruView: React.FC = () => {
  const { currentUser, currentRole } = useAuth();

  const [notes, setNotes] = useState<ReflectiveNote[]>([]);
  const [supervisions, setSupervisions] = useState<SupervisionRequest[]>([]);
  const [schools, setSchools] = useState<SchoolType[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Teacher Create/Edit Modal
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form Fields
  const [selectedSupervisionId, setSelectedSupervisionId] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [grade, setGrade] = useState<string>('');
  const [topic, setTopic] = useState<string>('');
  const [supervisionDate, setSupervisionDate] = useState<string>('');
  const [whatWentWell, setWhatWentWell] = useState<string>('');
  const [challengesFaced, setChallengesFaced] = useState<string>('');
  const [studentResponse, setStudentResponse] = useState<string>('');
  const [actionPlanForNext, setActionPlanForNext] = useState<string>('');
  const [satisfactionScore, setSatisfactionScore] = useState<number>(85);
  const [supportNeeded, setSupportNeeded] = useState<string>('');

  // Supervisor Review Modal
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [reviewingNote, setReviewingNote] = useState<ReflectiveNote | null>(null);
  const [supervisorFeedbackText, setSupervisorFeedbackText] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);

  // Detail / Print Modal
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [activeDetailNote, setActiveDetailNote] = useState<ReflectiveNote | null>(null);

  const isGuru = currentRole === 'GURU';
  const isPengawas = currentRole === 'PENGAWAS';
  const isKS = currentRole === 'KEPALA_SEKOLAH';
  const isAdminDinas = currentRole === 'ADMIN_DINAS';

  const loadData = async () => {
    setIsLoading(true);
    try {
      const supervisorId = isPengawas ? currentUser?.id : undefined;
      const schoolId = isKS || isGuru ? currentUser?.schoolId : undefined;

      const [schList, tList] = await Promise.all([
        api.getSchools(supervisorId),
        api.getTeachers(schoolId, supervisorId)
      ]);

      setSchools(schList);
      setTeachers(tList);

      let teacherIdFilter: string | undefined = undefined;
      if (isGuru && currentUser) {
        const myTeacher = tList.find(
          (t) =>
            t.userId === currentUser.id ||
            t.nip === currentUser.nip ||
            t.email === currentUser.email
        );
        teacherIdFilter = myTeacher?.id || currentUser.id;
      }

      const [nList, sList] = await Promise.all([
        api.getReflectiveNotes({
          schoolId,
          supervisorId,
          teacherId: teacherIdFilter
        }),
        api.getSupervisionRequests({
          schoolId,
          supervisorId,
          teacherId: teacherIdFilter
        })
      ]);

      setNotes(nList);
      setSupervisions(sList);
    } catch (err: any) {
      console.error('Error loading reflective notes:', err);
      setNotification({
        type: 'error',
        text: 'Gagal memuat catatan refleksi guru: ' + (err?.message || 'Kesalahan jaringan')
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser, currentRole]);

  // Open create modal
  const handleOpenCreateModal = (supervision?: SupervisionRequest) => {
    setEditingNoteId(null);
    if (supervision) {
      setSelectedSupervisionId(supervision.id);
      setSubject(supervision.subject || '');
      setGrade(supervision.gradeClass || 'Kelas 4');
      setTopic(supervision.notes || 'Pembelajaran Tematik');
      setSupervisionDate(supervision.approvedDate || supervision.proposedDate1 || '');
    } else {
      setSelectedSupervisionId('');
      setSubject(currentUser?.position || 'Mata Pelajaran Umum');
      setGrade('Kelas 4');
      setTopic('');
      setSupervisionDate(new Date().toISOString().split('T')[0]);
    }
    setWhatWentWell('');
    setChallengesFaced('');
    setStudentResponse('');
    setActionPlanForNext('');
    setSatisfactionScore(85);
    setSupportNeeded('');
    setIsFormModalOpen(true);
  };

  // Open edit modal
  const handleOpenEditModal = (note: ReflectiveNote) => {
    setEditingNoteId(note.id);
    setSelectedSupervisionId(note.supervisionId || '');
    setSubject(note.subject);
    setGrade(note.grade || '');
    setTopic(note.topic || '');
    setSupervisionDate(note.supervisionDate || '');
    setWhatWentWell(note.whatWentWell || '');
    setChallengesFaced(note.challengesFaced || '');
    setStudentResponse(note.studentResponse || '');
    setActionPlanForNext(note.actionPlanForNext || '');
    setSatisfactionScore(note.satisfactionScore || 85);
    setSupportNeeded(note.supportNeeded || '');
    setIsFormModalOpen(true);
  };

  // Handle Supervision Select in Modal
  const handleSupervisionChange = (supId: string) => {
    setSelectedSupervisionId(supId);
    if (supId) {
      const found = supervisions.find((s) => s.id === supId);
      if (found) {
        setSubject(found.subject || subject);
        setGrade(found.gradeClass || grade);
        setSupervisionDate(found.approvedDate || found.proposedDate1 || supervisionDate);
        if (found.notes && !topic) {
          setTopic(found.notes);
        }
      }
    }
  };

  // Submit Reflection (Teacher)
  const handleSubmitReflection = async (status: 'DRAFT' | 'DIKIRIM') => {
    if (!whatWentWell.trim() || !challengesFaced.trim() || !actionPlanForNext.trim()) {
      alert('Mohon lengkapi poin refleksi keberhasilan, kendala, dan rencana perbaikan.');
      return;
    }

    setIsSubmitting(true);
    try {
      const currentTeacher = teachers.find(
        (t) =>
          t.userId === currentUser?.id ||
          t.nip === currentUser?.nip ||
          t.email === currentUser?.email
      );

      const payload: Partial<ReflectiveNote> = {
        supervisionId: selectedSupervisionId,
        teacherId: currentTeacher?.id || currentUser?.id || 't-1',
        teacherName: currentTeacher?.name || currentUser?.name || 'Guru Magetan',
        teacherNip: currentTeacher?.nip || currentUser?.nip || '',
        teacherEmail: currentTeacher?.email || currentUser?.email || '',
        schoolId: currentTeacher?.schoolId || currentUser?.schoolId || 'sch-1',
        schoolName: currentTeacher?.schoolName || currentUser?.schoolName || 'SD Negeri Magetan',
        subject,
        grade,
        topic: topic || 'Pembelajaran Tematik Mendalam',
        supervisionDate,
        reflectionDate: new Date().toISOString().split('T')[0],
        whatWentWell,
        challengesFaced,
        studentResponse,
        actionPlanForNext,
        satisfactionScore,
        supportNeeded,
        status
      };

      if (editingNoteId) {
        await api.updateReflectiveNote(editingNoteId, payload);
        setNotification({
          type: 'success',
          text: 'Catatan reflektif berhasil diperbarui dan disinkronkan ke Firebase Firestore.'
        });
      } else {
        await api.createReflectiveNote(payload);
        setNotification({
          type: 'success',
          text: 'Catatan reflektif berhasil disimpan ke Firestore dan pengawas telah menerima notifikasi.'
        });
      }

      setIsFormModalOpen(false);
      await loadData();
    } catch (err: any) {
      console.error('Error saving reflection:', err);
      setNotification({
        type: 'error',
        text: 'Gagal menyimpan refleksi: ' + (err?.message || 'Kesalahan jaringan')
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Supervisor Review Modal
  const handleOpenReviewModal = (note: ReflectiveNote) => {
    setReviewingNote(note);
    setSupervisorFeedbackText(note.supervisorFeedback || '');
    setIsReviewModalOpen(true);
  };

  // Submit Supervisor Review
  const handleSubmitSupervisorReview = async () => {
    if (!reviewingNote) return;
    if (!supervisorFeedbackText.trim()) {
      alert('Mohon tuliskan catatan umpan balik atau apresiasi bimbingan pengawas.');
      return;
    }

    setIsSubmittingReview(true);
    try {
      await api.updateReflectiveNote(reviewingNote.id, {
        supervisorFeedback: supervisorFeedbackText,
        supervisorFeedbackBy: currentUser?.name || 'Drs. H. Bambang Sutrisno, M.Pd.',
        status: 'DITINJAU_PENGAWAS'
      });

      setNotification({
        type: 'success',
        text: 'Umpan balik pengawas berhasil disimpan di Firestore dan guru telah diberitahu.'
      });
      setIsReviewModalOpen(false);
      await loadData();
    } catch (err: any) {
      console.error('Error saving supervisor feedback:', err);
      setNotification({
        type: 'error',
        text: 'Gagal menyimpan umpan balik: ' + (err?.message || 'Kesalahan jaringan')
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Delete Reflection
  const handleDeleteNote = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus catatan reflektif ini dari sistem dan Firestore?')) {
      return;
    }

    try {
      await api.deleteReflectiveNote(id);
      setNotification({
        type: 'success',
        text: 'Catatan reflektif berhasil dihapus dari Firestore.'
      });
      await loadData();
    } catch (err: any) {
      alert('Gagal menghapus: ' + err?.message);
    }
  };

  // Filtered Notes
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      if (selectedSchoolFilter && n.schoolId !== selectedSchoolFilter) return false;
      if (statusFilter !== 'ALL' && n.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = n.subject?.toLowerCase().includes(q) || false;
        const matchTopic = n.topic?.toLowerCase().includes(q) || false;
        const matchTeacher = n.teacherName?.toLowerCase().includes(q) || false;
        const matchSchool = n.schoolName?.toLowerCase().includes(q) || false;
        const matchSupervisor = n.supervisorName?.toLowerCase().includes(q) || false;
        return matchTitle || matchTopic || matchTeacher || matchSchool || matchSupervisor;
      }
      return true;
    });
  }, [notes, selectedSchoolFilter, statusFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = notes.length;
    const reviewed = notes.filter((n) => n.status === 'DITINJAU_PENGAWAS' || n.status === 'SELESAI').length;
    const waiting = notes.filter((n) => n.status === 'DIKIRIM').length;
    const avgScore = total > 0 ? Math.round(notes.reduce((sum, n) => sum + (n.satisfactionScore || 80), 0) / total) : 0;
    return { total, reviewed, waiting, avgScore };
  }, [notes]);

  const getScoreBadgeColor = (score: number) => {
    if (score >= 90) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (score >= 80) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    if (score >= 70) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-rose-50 text-rose-700 border-rose-200';
  };

  const getScorePredicate = (score: number) => {
    if (score >= 90) return 'Sangat Puas / Optimal';
    if (score >= 80) return 'Baik & Efektif';
    if (score >= 70) return 'Cukup Memuaskan';
    return 'Perlu Pembenahan';
  };

  const handlePrint = (note: ReflectiveNote) => {
    setActiveDetailNote(note);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl border shadow-xs transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : notification.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-indigo-50 border-indigo-200 text-indigo-900'
          }`}
        >
          <div className="flex items-center gap-3 text-xs font-semibold">
            {notification.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
            {notification.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
            {notification.type === 'info' && <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />}
            <span>{notification.text}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs text-slate-400 hover:text-slate-700 font-bold px-2 py-1"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-gradient-to-bl from-indigo-50 via-sky-50 to-transparent rounded-full -mr-20 -mt-20 pointer-events-none opacity-60" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <FileCheck2 className="w-3.5 h-3.5" />
                SIBER-PM Magetan
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Firebase Firestore Terhubung
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                Post-Supervision Reflection
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <span>Catatan Reflektif Guru</span>
              <span className="text-xs px-2.5 py-1 rounded-md bg-indigo-600 text-white font-medium">
                Mandiri &amp; Bimbingan
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Modul refleksi mandiri guru pasca pelaksanaan supervisi akademik pembelajaran mendalam. Seluruh catatan tersimpan aman secara terpusat di Google Cloud Firestore agar dapat ditinjau dan didampingi langsung oleh Pengawas Pembina.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={loadData}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              title="Perbarui Data dari Firestore"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            {isGuru && (
              <button
                id="btn-tulis-refleksi-baru"
                onClick={() => handleOpenCreateModal()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all hover:shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tulis Catatan Refleksi</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
            <span className="text-[11px] font-medium text-slate-500 block">Total Catatan Refleksi</span>
            <div className="text-lg font-bold text-slate-800 mt-0.5 flex items-center gap-1.5">
              <span>{stats.total}</span>
              <span className="text-[10px] font-normal text-slate-400">Dokumen</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/70">
            <span className="text-[11px] font-medium text-emerald-800 block">Telah Ditinjau Pengawas</span>
            <div className="text-lg font-bold text-emerald-700 mt-0.5 flex items-center gap-1.5">
              <span>{stats.reviewed}</span>
              <span className="text-[10px] font-semibold text-emerald-600">Selesai Review</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/70">
            <span className="text-[11px] font-medium text-amber-800 block">Menunggu Tanggapan</span>
            <div className="text-lg font-bold text-amber-700 mt-0.5 flex items-center gap-1.5">
              <span>{stats.waiting}</span>
              <span className="text-[10px] font-semibold text-amber-600">Pending</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200/70">
            <span className="text-[11px] font-medium text-indigo-800 block">Rata-rata Skor Kepuasan</span>
            <div className="text-lg font-bold text-indigo-700 mt-0.5 flex items-center gap-1.5">
              <span>{stats.avgScore}</span>
              <span className="text-[10px] font-semibold text-indigo-600">/ 100 Poin</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari guru, mata pelajaran, materi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          {!isGuru && schools.length > 0 && (
            <select
              value={selectedSchoolFilter}
              onChange={(e) => setSelectedSchoolFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="">Semua Sekolah Binaan</option>
              {schools.map((sch) => (
                <option key={sch.id} value={sch.id}>
                  {sch.name}
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-md transition-colors ${
                statusFilter === 'ALL' ? 'bg-white font-bold text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setStatusFilter('DITINJAU_PENGAWAS')}
              className={`px-3 py-1 rounded-md transition-colors ${
                statusFilter === 'DITINJAU_PENGAWAS' ? 'bg-white font-bold text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ditinjau
            </button>
            <button
              onClick={() => setStatusFilter('DIKIRIM')}
              className={`px-3 py-1 rounded-md transition-colors ${
                statusFilter === 'DIKIRIM' ? 'bg-white font-bold text-amber-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Menunggu Review
            </button>
          </div>
        </div>
      </div>

      {/* Main List of Reflections */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">Menghubungkan ke Cloud Firestore...</h3>
          <p className="text-xs text-slate-500 mt-1">Mengambil dokumen catatan reflektif guru terbaru</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Belum Ada Catatan Reflektif</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
            {isGuru
              ? 'Anda belum menuliskan catatan refleksi diri pasca supervisi. Klik tombol di bawah untuk membuat refleksi pembelajaran Anda.'
              : 'Belum ada guru yang mengirimkan catatan refleksi diri untuk kriteria pencarian ini.'}
          </p>
          {isGuru && (
            <button
              onClick={() => handleOpenCreateModal()}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tulis Catatan Refleksi Pertama Saya</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotes.map((note) => {
            const hasSupervisorFeedback = Boolean(note.supervisorFeedback && note.supervisorFeedback.trim().length > 0);
            return (
              <div
                key={note.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:border-indigo-300 transition-all"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                      {note.teacherName ? note.teacherName.charAt(0) : 'G'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900">{note.teacherName}</h3>
                        {note.teacherNip && (
                          <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                            NIP: {note.teacherNip}
                          </span>
                        )}
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {note.schoolName}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-600 mt-1 flex-wrap">
                        <span className="font-semibold text-indigo-700 bg-indigo-50/80 px-2 py-0.5 rounded">
                          {note.subject} ({note.grade})
                        </span>
                        <span className="text-slate-400">•</span>
                        <span>Materi: <strong className="text-slate-700">{note.topic || 'Umum'}</strong></span>
                        <span className="text-slate-400">•</span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Refleksi: {note.reflectionDate}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start shrink-0">
                    <div className={`px-2.5 py-1 rounded-lg border text-xs font-bold flex items-center gap-1.5 ${getScoreBadgeColor(note.satisfactionScore || 85)}`}>
                      <Award className="w-3.5 h-3.5" />
                      <span>Skor Diri: {note.satisfactionScore}/100</span>
                    </div>

                    {hasSupervisorFeedback ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Ditinjau Pengawas
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
                        <Clock className="w-3.5 h-3.5" />
                        Menunggu Ulasan
                      </span>
                    )}
                  </div>
                </div>

                {/* 4 Pillars Reflection Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-4">
                  {/* 1. What Went Well */}
                  <div className="p-3.5 rounded-xl bg-emerald-50/40 border border-emerald-100">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 mb-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>1. Hal yang Berjalan Baik (Keberhasilan KBM)</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                      {note.whatWentWell}
                    </p>
                  </div>

                  {/* 2. Challenges Faced */}
                  <div className="p-3.5 rounded-xl bg-rose-50/40 border border-rose-100">
                    <div className="flex items-center gap-2 text-xs font-bold text-rose-800 mb-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>2. Kendala &amp; Hal yang Belum Optimal</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                      {note.challengesFaced}
                    </p>
                  </div>

                  {/* 3. Student Response */}
                  <div className="p-3.5 rounded-xl bg-sky-50/40 border border-sky-100">
                    <div className="flex items-center gap-2 text-xs font-bold text-sky-800 mb-1.5">
                      <Sparkles className="w-4 h-4 text-sky-600 shrink-0" />
                      <span>3. Respon &amp; Keterlibatan Murid</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                      {note.studentResponse || 'Siswa aktif berpartisipasi dan memahami konsep dengan antusias.'}
                    </p>
                  </div>

                  {/* 4. Action Plan */}
                  <div className="p-3.5 rounded-xl bg-indigo-50/40 border border-indigo-100">
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-800 mb-1.5">
                      <TrendingUp className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>4. Rencana Perbaikan &amp; Tindak Lanjut</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                      {note.actionPlanForNext}
                    </p>
                  </div>
                </div>

                {/* Additional support needed if present */}
                {note.supportNeeded && (
                  <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-xs">
                    <span className="font-semibold text-slate-700">Dukungan / Fasilitasi yang Diharapkan dari Pengawas: </span>
                    <span className="text-slate-600">{note.supportNeeded}</span>
                  </div>
                )}

                {/* Supervisor Feedback Box */}
                {hasSupervisorFeedback ? (
                  <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-amber-50/80 to-amber-100/40 border border-amber-200/80">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                        <MessageSquare className="w-4 h-4 text-amber-600" />
                        <span>Tanggapan &amp; Bimbingan Pengawas ({note.supervisorFeedbackBy || note.supervisorName || 'Pengawas Pembina'})</span>
                      </div>
                      {note.supervisorFeedbackDate && (
                        <span className="text-[11px] text-amber-700/80 font-medium">
                          Ditinjau pada: {note.supervisorFeedbackDate}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-amber-950 leading-relaxed italic bg-white/70 p-3 rounded-lg border border-amber-200/60 whitespace-pre-line">
                      "{note.supervisorFeedback}"
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500 flex items-center justify-between">
                    <span>Pengawas belum memberikan ulasan atau tanggapan klinis untuk catatan ini.</span>
                    {isPengawas && (
                      <button
                        onClick={() => handleOpenReviewModal(note)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-md shadow-xs transition-colors cursor-pointer text-xs"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Beri Ulasan Pengawas</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Action buttons footer */}
                <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                      <CloudCheck className="w-3.5 h-3.5" />
                      Firestore ID: {note.id}
                    </span>
                    {note.supervisionDate && (
                      <span>• Supervisi: {note.supervisionDate}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePrint(note)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold transition-colors cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-500" />
                      <span>Cetak Lembar Refleksi</span>
                    </button>

                    {isPengawas && (
                      <button
                        onClick={() => handleOpenReviewModal(note)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{hasSupervisorFeedback ? 'Ubah Ulasan Pengawas' : 'Tinjau & Beri Masukan'}</span>
                      </button>
                    )}

                    {(isGuru || isAdminDinas) && (
                      <>
                        <button
                          onClick={() => handleOpenEditModal(note)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium transition-colors cursor-pointer"
                          title="Edit Refleksi"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 font-medium transition-colors cursor-pointer"
                          title="Hapus Dokumen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Teacher Fill/Edit Reflection */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingNoteId ? 'Edit Catatan Refleksi Diri Guru' : 'Tulis Catatan Refleksi Diri Pasca-Supervisi'}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-xl text-xs text-indigo-900 leading-relaxed">
            <span className="font-bold flex items-center gap-1.5 text-indigo-950 mb-1">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Panduan Refleksi Pembelajaran Berdampak (Kurikulum Merdeka)
            </span>
            Tuliskan pengalaman nyata Anda selama supervisi KBM. Refleksi ini akan tersimpan di <strong>Google Cloud Firestore</strong> dan langsung dibaca oleh Pengawas Pembina untuk bahan refleksi pasca-observasi (post-supervision conference).
          </div>

          {/* Sesi Supervisi Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pilih Sesi Supervisi Terkait:
              </label>
              <select
                value={selectedSupervisionId}
                onChange={(e) => handleSupervisionChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="">-- Supervisi Umum / Mandiri --</option>
                {supervisions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.subject} ({s.approvedDate || s.proposedDate1}) - Status: {s.status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mata Pelajaran &amp; Jenjang Kelas:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Misal: IPAS / Matematika"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/20"
                />
                <input
                  type="text"
                  placeholder="Misal: Kelas 4A"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Topik / Materi Pembelajaran yang Diajarkan:
              </label>
              <input
                type="text"
                placeholder="Contoh: Eksplorasi Wujud Zat dan Siklus Air"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal Supervisi / Observasi:
              </label>
              <input
                type="date"
                value={supervisionDate}
                onChange={(e) => setSupervisionDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* 4 Dimensi Refleksi Form */}
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-emerald-800 mb-1 flex items-center justify-between">
                <span>1. Apa yang sudah berjalan baik dan berhasil efektif selama pembelajaran? *</span>
                <span className="text-[10px] text-slate-400 font-normal">Kekuatan &amp; praktik baik</span>
              </label>
              <textarea
                rows={3}
                placeholder="Ceritakan metode apa yang berhasil, antusiasme siswa saat kegiatan, strategi diferensiasi, atau integrasi pembiasaan positif..."
                value={whatWentWell}
                onChange={(e) => setWhatWentWell(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-emerald-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-rose-800 mb-1 flex items-center justify-between">
                <span>2. Apa tantangan atau kendala yang dialami guru maupun murid? *</span>
                <span className="text-[10px] text-slate-400 font-normal">Hal yang belum optimal</span>
              </label>
              <textarea
                rows={3}
                placeholder="Misal manajemen waktu pada presentasi kelompok, murid yang pasif, kendala media/alat peraga, atau asesmen formatif yang kurang terukur..."
                value={challengesFaced}
                onChange={(e) => setChallengesFaced(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-rose-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-sky-800 mb-1 flex items-center justify-between">
                <span>3. Bagaimana respon keterlibatan dan pemahaman murid?</span>
                <span className="text-[10px] text-slate-400 font-normal">Dinamika kelas &amp; konsep</span>
              </label>
              <textarea
                rows={2}
                placeholder="Apakah murid menunjukkan rasa ingin tahu tinggi, berani bertanya, dan mampu menarik kesimpulan sendiri?"
                value={studentResponse}
                onChange={(e) => setStudentResponse(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-sky-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-indigo-800 mb-1 flex items-center justify-between">
                <span>4. Apa rencana perbaikan dan tindak lanjut konkret pada pertemuan berikutnya? *</span>
                <span className="text-[10px] text-slate-400 font-normal">Langkah perbaikan nyata</span>
              </label>
              <textarea
                rows={3}
                placeholder="Langkah spesifik apa yang akan Anda lakukan? (Contoh: Menyiapkan lembar aktivitas bertingkat, mengubah susunan kelompok, menggunakan timer visual, dll.)"
                value={actionPlanForNext}
                onChange={(e) => setActionPlanForNext(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-indigo-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Slider Kepuasan Diri Guru */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800">
                Skala Kepuasan Diri Guru terhadap Pelaksanaan KBM:
              </label>
              <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${getScoreBadgeColor(satisfactionScore)}`}>
                {satisfactionScore} / 100 ({getScorePredicate(satisfactionScore)})
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="100"
              step="1"
              value={satisfactionScore}
              onChange={(e) => setSatisfactionScore(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>50 (Perlu Pembenahan)</span>
              <span>75 (Cukup)</span>
              <span>90 (Baik Sekali)</span>
              <span>100 (Sangat Optimal)</span>
            </div>
          </div>

          {/* Bimbingan yang Diharapkan dari Pengawas */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Dukungan / Pendampingan yang Diharapkan dari Pengawas:
            </label>
            <input
              type="text"
              placeholder="Contoh: Mohon bimbingan dalam merancang rubrik asesmen formatif berjenjang (scaffolding)..."
              value={supportNeeded}
              onChange={(e) => setSupportNeeded(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              onClick={() => setIsFormModalOpen(false)}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={() => handleSubmitReflection('DRAFT')}
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
            >
              Simpan Sebagai Draf
            </button>
            <button
              id="btn-kirim-refleksi-ke-pengawas"
              onClick={() => handleSubmitReflection('DIKIRIM')}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Menyimpan ke Firestore...' : 'Simpan & Kirim ke Pengawas'}</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Supervisor Review & Feedback */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title="Tinjauan &amp; Umpan Balik Pengawas Sekolah"
        maxWidth="max-w-2xl"
      >
        {reviewingNote && (
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-950">
              <span className="font-bold block text-sm text-amber-900 mb-0.5">
                Refleksi Guru: {reviewingNote.teacherName} ({reviewingNote.schoolName})
              </span>
              <p className="text-[11px] text-amber-800">
                Mata Pelajaran: <strong>{reviewingNote.subject}</strong> • Materi: <strong>{reviewingNote.topic}</strong>
              </p>
            </div>

            {/* Quick summary of teacher reflection */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
              <div>
                <strong className="text-emerald-700 block">Kekuatan KBM (Refleksi Guru):</strong>
                <p className="text-slate-600 italic">"{reviewingNote.whatWentWell}"</p>
              </div>
              <div>
                <strong className="text-rose-700 block">Kendala / Tantangan:</strong>
                <p className="text-slate-600 italic">"{reviewingNote.challengesFaced}"</p>
              </div>
              <div>
                <strong className="text-indigo-700 block">Rencana Tindak Lanjut Guru:</strong>
                <p className="text-slate-600 italic">"{reviewingNote.actionPlanForNext}"</p>
              </div>
              {reviewingNote.supportNeeded && (
                <div>
                  <strong className="text-amber-800 block">Permintaan Bimbingan Pengawas:</strong>
                  <p className="text-slate-700 font-medium">"{reviewingNote.supportNeeded}"</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Catatan Umpan Balik, Apresiasi, &amp; Bimbingan Pengawas (Coaching):
              </label>
              <textarea
                rows={5}
                placeholder="Tuliskan apresiasi terhadap kejujuran refleksi guru, saran perbaikan konkret, serta kesepakatan bimbingan klinis selanjutnya..."
                value={supervisorFeedbackText}
                onChange={(e) => setSupervisorFeedbackText(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSubmitSupervisorReview}
                disabled={isSubmittingReview}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmittingReview ? 'Menyimpan...' : 'Simpan Ulasan ke Firestore'}</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Hidden Printable Sheet */}
      {activeDetailNote && (
        <div className="hidden print:block print:fixed print:inset-0 print:bg-white print:p-8 print:z-50 text-slate-900 font-sans">
          <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
            <h2 className="text-lg font-bold uppercase tracking-wider">Pemerintah Kabupaten Magetan</h2>
            <h3 className="text-base font-bold uppercase">Dinas Pendidikan, Kepemudaan dan Olahraga</h3>
            <p className="text-xs text-slate-600">Sistem Informasi Supervisi Akademik &amp; Pembelajaran Mendalam (SIBER-PM)</p>
            <h1 className="text-xl font-bold uppercase mt-3 tracking-wide">Lembar Catatan Refleksi Diri Guru Pasca-Supervisi</h1>
          </div>

          <table className="w-full text-xs mb-6 border-collapse">
            <tbody>
              <tr>
                <td className="w-40 py-1 font-bold">Nama Guru</td>
                <td className="py-1">: {activeDetailNote.teacherName}</td>
                <td className="w-36 py-1 font-bold">Nama Sekolah</td>
                <td className="py-1">: {activeDetailNote.schoolName}</td>
              </tr>
              <tr>
                <td className="py-1 font-bold">NIP Guru</td>
                <td className="py-1">: {activeDetailNote.teacherNip || '-'}</td>
                <td className="py-1 font-bold">Mata Pelajaran / Kelas</td>
                <td className="py-1">: {activeDetailNote.subject} ({activeDetailNote.grade})</td>
              </tr>
              <tr>
                <td className="py-1 font-bold">Pengawas Pembina</td>
                <td className="py-1">: {activeDetailNote.supervisorName || '-'}</td>
                <td className="py-1 font-bold">Tanggal Supervisi / Refleksi</td>
                <td className="py-1">: {activeDetailNote.supervisionDate || '-'} / {activeDetailNote.reflectionDate}</td>
              </tr>
              <tr>
                <td className="py-1 font-bold">Materi Pokok</td>
                <td colSpan={3} className="py-1">: {activeDetailNote.topic}</td>
              </tr>
            </tbody>
          </table>

          <div className="space-y-4 text-xs">
            <div className="border border-slate-300 p-3 rounded">
              <h4 className="font-bold text-slate-900 mb-1">1. Keberhasilan &amp; Hal yang Sudah Berjalan Baik:</h4>
              <p className="leading-relaxed whitespace-pre-line">{activeDetailNote.whatWentWell}</p>
            </div>

            <div className="border border-slate-300 p-3 rounded">
              <h4 className="font-bold text-slate-900 mb-1">2. Kendala / Hal yang Belum Optimal:</h4>
              <p className="leading-relaxed whitespace-pre-line">{activeDetailNote.challengesFaced}</p>
            </div>

            <div className="border border-slate-300 p-3 rounded">
              <h4 className="font-bold text-slate-900 mb-1">3. Respon dan Pemahaman Murid:</h4>
              <p className="leading-relaxed whitespace-pre-line">{activeDetailNote.studentResponse}</p>
            </div>

            <div className="border border-slate-300 p-3 rounded">
              <h4 className="font-bold text-slate-900 mb-1">4. Rencana Perbaikan &amp; Tindak Lanjut Guru:</h4>
              <p className="leading-relaxed whitespace-pre-line">{activeDetailNote.actionPlanForNext}</p>
            </div>

            {activeDetailNote.supervisorFeedback && (
              <div className="border border-amber-400 bg-amber-50/50 p-3 rounded">
                <h4 className="font-bold text-slate-900 mb-1">
                  Catatan Umpan Balik &amp; Rekomendasi Pengawas Sekolah:
                </h4>
                <p className="leading-relaxed italic whitespace-pre-line">{activeDetailNote.supervisorFeedback}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-8 mt-12 pt-8 text-xs text-center">
            <div>
              <p className="text-slate-600 mb-16">Guru Yang Bersangkutan,</p>
              <p className="font-bold underline">{activeDetailNote.teacherName}</p>
              <p className="text-slate-600">NIP. {activeDetailNote.teacherNip || '................................'}</p>
            </div>
            <div>
              <p className="text-slate-600 mb-16">Pengawas Pembina Sekolah,</p>
              <p className="font-bold underline">{activeDetailNote.supervisorFeedbackBy || activeDetailNote.supervisorName || 'Pengawas Pembina'}</p>
              <p className="text-slate-600">NIP. ................................</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
