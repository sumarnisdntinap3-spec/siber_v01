import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageSquareQuote,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  Sparkles,
  School,
  UserCheck,
  Send,
  Calendar,
  Building2,
  RefreshCw,
  Award,
  ChevronRight,
  BookOpen,
  FileCheck2,
  Edit3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { SupervisionRequest, School as SchoolType, Teacher } from '../types';
import { Modal } from '../components/common/Modal';

export const KomentarSupervisiView: React.FC = () => {
  const { currentUser, currentRole } = useAuth();

  const [supervisions, setSupervisions] = useState<SupervisionRequest[]>([]);
  const [schools, setSchools] = useState<SchoolType[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<string | null>(null);

  // Filters
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'HAS_FEEDBACK' | 'NO_FEEDBACK'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Supervisor modal state
  const [isCommentModalOpen, setIsCommentModalOpen] = useState<boolean>(false);
  const [selectedSupervision, setSelectedSupervision] = useState<SupervisionRequest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Feedback form fields
  const [completionScore, setCompletionScore] = useState<number>(90);
  const [category, setCategory] = useState<string>('Amat Baik');
  const [strengths, setStrengths] = useState<string>('');
  const [improvements, setImprovements] = useState<string>('');
  const [actionPlan, setActionPlan] = useState<string>('');
  const [generalNotes, setGeneralNotes] = useState<string>('');

  // Teacher reflection modal state
  const [isTeacherResponseModalOpen, setIsTeacherResponseModalOpen] = useState<boolean>(false);
  const [teacherResponseNotes, setTeacherResponseNotes] = useState<string>('');
  const [isSubmittingResponse, setIsSubmittingResponse] = useState<boolean>(false);

  // Detail / Print Modal
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [detailItem, setDetailItem] = useState<SupervisionRequest | null>(null);

  const isPengawas = currentRole === 'PENGAWAS';
  const isGuru = currentRole === 'GURU';
  const isKS = currentRole === 'KEPALA_SEKOLAH';

  // Load data with strict supervisor and school filtering
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

      const sList = await api.getSupervisionRequests({
        schoolId,
        supervisorId,
        teacherId: teacherIdFilter
      });

      setSupervisions(sList);
    } catch (err) {
      console.error('Error loading supervision comments data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentRole, currentUser]);

  // Quick phrase suggestions for Pengawas
  const insertQuickText = (field: 'strengths' | 'improvements' | 'actionPlan', text: string) => {
    if (field === 'strengths') {
      setStrengths((prev) => (prev ? `${prev} ${text}` : text));
    } else if (field === 'improvements') {
      setImprovements((prev) => (prev ? `${prev} ${text}` : text));
    } else if (field === 'actionPlan') {
      setActionPlan((prev) => (prev ? `${prev} ${text}` : text));
    }
  };

  // Open modal to enter/edit supervisor feedback
  const handleOpenCommentModal = (sup: SupervisionRequest) => {
    setSelectedSupervision(sup);
    const scoreVal = sup.completionScore || sup.score || 90;
    setCompletionScore(scoreVal);

    if (scoreVal >= 91) setCategory('Amat Baik');
    else if (scoreVal >= 81) setCategory('Baik');
    else if (scoreVal >= 71) setCategory('Cukup');
    else setCategory('Perlu Bimbingan');

    setStrengths(sup.supervisorFeedback?.strengths || '');
    setImprovements(sup.supervisorFeedback?.improvements || '');
    setActionPlan(sup.supervisorFeedback?.actionPlan || '');
    setGeneralNotes(sup.supervisorFeedback?.generalNotes || sup.completionNotes || sup.feedback || '');
    setIsCommentModalOpen(true);
  };

  // Save supervisor feedback
  const handleSaveFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupervision) return;
    setIsSubmitting(true);
    try {
      await api.saveSupervisionFeedback(selectedSupervision.id, {
        completionScore,
        category,
        strengths,
        improvements,
        actionPlan,
        generalNotes,
        supervisorId: currentUser?.id,
        supervisorName: currentUser?.name || 'Pengawas Pembina',
        supervisorNip: currentUser?.nip || ''
      });

      setNotification(`Catatan dan saran masukan untuk guru ${selectedSupervision.teacherName} berhasil disimpan dan dikirimkan.`);
      setIsCommentModalOpen(false);
      await loadData();
    } catch (err: any) {
      console.error('Error saving supervision feedback:', err);
      alert(err.message || 'Gagal menyimpan komentar supervisi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open modal to submit teacher reflection
  const handleOpenTeacherResponseModal = (sup: SupervisionRequest) => {
    setSelectedSupervision(sup);
    setTeacherResponseNotes(sup.teacherResponse?.notes || '');
    setIsTeacherResponseModalOpen(true);
  };

  // Save teacher reflection response
  const handleSaveTeacherResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupervision) return;
    setIsSubmittingResponse(true);
    try {
      await api.saveTeacherSupervisionResponse(selectedSupervision.id, {
        notes: teacherResponseNotes,
        teacherId: currentUser?.id,
        teacherName: currentUser?.name
      });

      setNotification('Tanggapan refleksi Anda atas saran pengawas berhasil dikirimkan.');
      setIsTeacherResponseModalOpen(false);
      await loadData();
    } catch (err: any) {
      console.error('Error saving teacher response:', err);
      alert(err.message || 'Gagal mengirimkan refleksi.');
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  // Filtered supervisions
  const filteredSupervisions = useMemo(() => {
    return supervisions.filter((s) => {
      // School filter
      if (selectedSchoolFilter && s.schoolId !== selectedSchoolFilter) {
        return false;
      }
      // Status filter
      const hasFeedback = Boolean(s.supervisorFeedback?.strengths || s.supervisorFeedback?.improvements || s.completionNotes);
      if (statusFilter === 'HAS_FEEDBACK' && !hasFeedback) return false;
      if (statusFilter === 'NO_FEEDBACK' && hasFeedback) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = s.teacherName?.toLowerCase().includes(q);
        const matchSchool = s.schoolName?.toLowerCase().includes(q);
        const matchSubject = s.subject?.toLowerCase().includes(q);
        const matchType = s.supervisionType?.toLowerCase().includes(q);
        if (!matchName && !matchSchool && !matchSubject && !matchType) return false;
      }

      return true;
    });
  }, [supervisions, selectedSchoolFilter, statusFilter, searchQuery]);

  // Metrics
  const totalCount = supervisions.length;
  const withFeedbackCount = supervisions.filter((s) => Boolean(s.supervisorFeedback?.strengths || s.supervisorFeedback?.improvements || s.completionNotes)).length;
  const pendingCount = totalCount - withFeedbackCount;
  const avgScore = totalCount > 0
    ? Math.round(
        supervisions.reduce((acc, cur) => acc + (cur.completionScore || cur.score || 0), 0) /
        (supervisions.filter((s) => s.completionScore || s.score).length || 1)
      )
    : 0;

  // Print view handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs font-semibold text-emerald-900">{notification}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold px-2 py-1 rounded"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-indigo-100 text-[11px] font-semibold">
              <MessageSquareQuote className="w-3.5 h-3.5 text-amber-300" />
              <span>
                {isPengawas
                  ? 'Wilayah Sekolah Binaan Pengawas'
                  : isGuru
                  ? 'Record Masukan & Rekomendasi Supervisi'
                  : 'Rekapitulasi Catatan Supervisi Akademik'}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              {isPengawas
                ? 'Entri Komentar & Saran Masukan Hasil Supervisi'
                : isGuru
                ? 'Record Catatan & Saran Masukan Pengawas'
                : 'Umpan Balik & Rekomendasi Supervisi Guru'}
            </h1>
            <p className="text-xs text-indigo-100/90 leading-relaxed">
              {isPengawas
                ? 'Pengawas dapat mengentri apresiasi praktik baik, catatan perbaikan pedagogik, dan rencana tindak lanjut supervisi yang langsung terekam pada akun guru bersangkutan.'
                : isGuru
                ? 'Arsip komprehensif hasil evaluasi, apresiasi kelebihan mengajar, serta saran perbaikan dan tindak lanjut dari Pengawas Pembina Sekolah.'
                : 'Pemantauan hasil catatan observasi, masukan pengembangan, dan rekomendasi tindak lanjut antara pengawas sekolah dan para guru.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/15"
              title="Perbarui Data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Muat Ulang</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              {isGuru ? 'Total Supervisi Saya' : 'Total Supervisi Binaan'}
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{totalCount}</span>
            <span className="text-[11px] text-slate-400">kegiatan</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Sudah Diberi Catatan</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700">{withFeedbackCount}</span>
            <span className="text-[11px] text-slate-400">tercatat</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              {isPengawas ? 'Menunggu Catatan Pengawas' : 'Menunggu Umpan Balik'}
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-700">{pendingCount}</span>
            <span className="text-[11px] text-slate-400">guru</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Rata-rata Skor Supervisi</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-700">{avgScore > 0 ? avgScore : '-'}</span>
            <span className="text-[11px] text-slate-400">/ 100</span>
          </div>
        </div>
      </div>

      {/* Control Filter Bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* School filter (for Pengawas: strictly bounded to binaan) */}
          {!isGuru && (
            <div className="relative min-w-[200px]">
              <select
                id="filter-school-komentar"
                value={selectedSchoolFilter}
                onChange={(e) => setSelectedSchoolFilter(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Semua Sekolah Binaan ({schools.length})</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status filter tabs */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Semua ({supervisions.length})
            </button>
            <button
              onClick={() => setStatusFilter('HAS_FEEDBACK')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                statusFilter === 'HAS_FEEDBACK' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Ada Catatan ({withFeedbackCount})
            </button>
            <button
              onClick={() => setStatusFilter('NO_FEEDBACK')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                statusFilter === 'NO_FEEDBACK' ? 'bg-white text-amber-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Belum ({pendingCount})
            </button>
          </div>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari guru, mapel, atau sekolah..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Memuat data supervisi dan catatan pengawas...</p>
        </div>
      ) : filteredSupervisions.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-3">
          <MessageSquareQuote className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">Tidak Ada Data Supervisi Sesuai Kriteria</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {isPengawas
              ? 'Belum ada jadwal supervisi untuk sekolah binaan atau filter pencarian tidak menemukan hasil.'
              : isGuru
              ? 'Belum ada record supervisi yang tercatat untuk akun Anda.'
              : 'Tidak ada data supervisi yang ditemukan.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSupervisions.map((sup) => {
            const hasFeedback = Boolean(sup.supervisorFeedback?.strengths || sup.supervisorFeedback?.improvements || sup.completionNotes);
            const score = sup.completionScore || sup.score;

            return (
              <div
                key={sup.id}
                className="bg-white rounded-xl border border-slate-200 hover:border-indigo-200 shadow-2xs hover:shadow-xs transition-all overflow-hidden"
              >
                {/* Header item bar */}
                <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                      {sup.teacherName?.slice(0, 2).toUpperCase() || 'GU'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{sup.teacherName}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {sup.supervisionType.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          {sup.schoolName}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-slate-400" />
                          {sup.subject} ({sup.gradeClass || 'Kelas 4'})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Status badge */}
                    {hasFeedback ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Catatan Lengkap</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Menunggu Catatan</span>
                      </span>
                    )}

                    {/* Score badge */}
                    {score && (
                      <div className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-blue-600" />
                        <span>Skor: {score}/100</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-4 sm:p-5 space-y-4">
                  {/* Meta details */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Tanggal Supervisi:</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {sup.approvedDate || sup.proposedDate1 || '-'} ({sup.approvedTime || sup.proposedTime1 || '08:00 - 09:30'})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Pengawas Pembina:</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                        {sup.supervisorFeedback?.supervisorName || sup.supervisorName || 'Drs. H. Bambang Sutrisno, M.Pd.'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Kategori Mutu:</span>
                      <span className="font-semibold text-emerald-800 flex items-center gap-1 mt-0.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        {sup.supervisorFeedback?.category || (score && score >= 90 ? 'Amat Baik' : 'Baik')}
                      </span>
                    </div>
                  </div>

                  {/* Feedback Blocks if present */}
                  {hasFeedback ? (
                    <div className="space-y-3">
                      {/* 1. Kekuatan & Praktik Baik */}
                      {sup.supervisorFeedback?.strengths && (
                        <div className="p-3.5 rounded-lg bg-emerald-50/70 border border-emerald-200/80">
                          <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs mb-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Apresiasi Praktik Baik &amp; Kekuatan Guru:</span>
                          </div>
                          <p className="text-xs text-slate-800 leading-relaxed pl-5">
                            {sup.supervisorFeedback.strengths}
                          </p>
                        </div>
                      )}

                      {/* 2. Saran Masukan & Perbaikan */}
                      {sup.supervisorFeedback?.improvements && (
                        <div className="p-3.5 rounded-lg bg-amber-50/70 border border-amber-200/80">
                          <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs mb-1">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>Saran Masukan &amp; Hal yang Perlu Ditingkatkan:</span>
                          </div>
                          <p className="text-xs text-slate-800 leading-relaxed pl-5">
                            {sup.supervisorFeedback.improvements}
                          </p>
                        </div>
                      )}

                      {/* 3. Rencana Tindak Lanjut */}
                      {sup.supervisorFeedback?.actionPlan && (
                        <div className="p-3.5 rounded-lg bg-blue-50/70 border border-blue-200/80">
                          <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs mb-1">
                            <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>Rekomendasi Rencana Tindak Lanjut (RTL):</span>
                          </div>
                          <p className="text-xs text-slate-800 leading-relaxed pl-5">
                            {sup.supervisorFeedback.actionPlan}
                          </p>
                        </div>
                      )}

                      {/* General / completion notes */}
                      {(sup.supervisorFeedback?.generalNotes || sup.completionNotes) && (
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
                          <span className="font-bold text-slate-900 block mb-0.5">Ringkasan Catatan Umum:</span>
                          <span>{sup.supervisorFeedback?.generalNotes || sup.completionNotes}</span>
                        </div>
                      )}

                      {/* Teacher's response if any */}
                      {sup.teacherResponse?.notes && (
                        <div className="p-3 rounded-lg bg-purple-50/80 border border-purple-200 text-xs">
                          <div className="flex items-center justify-between text-purple-900 font-bold mb-1">
                            <span>Tanggapan &amp; Komitmen Refleksi Guru:</span>
                            <span className="text-[10px] text-purple-600 font-normal">
                              {sup.teacherResponse.submittedAt}
                            </span>
                          </div>
                          <p className="text-slate-800 italic">"{sup.teacherResponse.notes}"</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg bg-amber-50/50 border border-amber-200 border-dashed text-center">
                      <p className="text-xs text-amber-800 font-medium">
                        {isPengawas
                          ? 'Belum ada catatan atau saran masukan yang dientrikan untuk guru ini. Silakan klik tombol "Entri Komentar Supervisi" di bawah.'
                          : 'Pengawas Pembina belum mengentrikan catatan atau saran masukan untuk sesi supervisi ini.'}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons Footer */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                    <div className="text-[11px] text-slate-400">
                      ID Supervisi: <span className="font-mono">{sup.id}</span>
                      {sup.supervisorFeedback?.submittedAt && (
                        <span className="ml-2">• Terakhir diperbarui: {sup.supervisorFeedback.submittedAt}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Teacher action: Tanggapan refleksi */}
                      {isGuru && (
                        <button
                          id={`btn-guru-response-${sup.id}`}
                          onClick={() => handleOpenTeacherResponseModal(sup)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>{sup.teacherResponse?.notes ? 'Ubah Refleksi Saya' : 'Beri Refleksi / Tanggapan'}</span>
                        </button>
                      )}

                      {/* Detail / Cetak Lembar */}
                      <button
                        onClick={() => {
                          setDetailItem(sup);
                          setIsDetailModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-500" />
                        <span>Cetak Lembar Hasil</span>
                      </button>

                      {/* Supervisor action: Entri / Edit Komentar */}
                      {isPengawas && (
                        <button
                          id={`btn-entri-komentar-${sup.id}`}
                          onClick={() => handleOpenCommentModal(sup)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
                        >
                          <MessageSquareQuote className="w-3.5 h-3.5" />
                          <span>{hasFeedback ? 'Edit Catatan & Masukan' : 'Entri Komentar Supervisi'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Entri / Edit Komentar Supervisi (Khusus Pengawas) */}
      <Modal
        isOpen={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        title="Entri Komentar & Rekomendasi Supervisi"
        subtitle={`Guru: ${selectedSupervision?.teacherName} (${selectedSupervision?.schoolName})`}
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveFeedback} className="space-y-4">
          {/* Guru & School Summary Box */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Guru:</span>
              <span className="font-bold text-slate-900">{selectedSupervision?.teacherName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Mata Pelajaran:</span>
              <span className="font-semibold text-slate-800">{selectedSupervision?.subject}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Satuan Pendidikan:</span>
              <span className="font-semibold text-slate-800">{selectedSupervision?.schoolName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Tanggal Observasi:</span>
              <span className="font-semibold text-slate-800">
                {selectedSupervision?.approvedDate || selectedSupervision?.proposedDate1 || '-'}
              </span>
            </div>
          </div>

          {/* Skor & Predikat */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
            <div>
              <label className="block text-xs font-bold text-indigo-950 mb-1">
                Skor Nilai Hasil Supervisi (0 - 100) *
              </label>
              <input
                type="number"
                min="0"
                max="100"
                required
                value={completionScore}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setCompletionScore(val);
                  if (val >= 91) setCategory('Amat Baik');
                  else if (val >= 81) setCategory('Baik');
                  else if (val >= 71) setCategory('Cukup');
                  else setCategory('Perlu Bimbingan');
                }}
                className="w-full px-3 py-1.5 text-sm font-bold bg-white border border-indigo-200 rounded-lg text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-indigo-950 mb-1">
                Kategori Mutu Capaian
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-indigo-200 rounded-lg text-slate-800"
              >
                <option value="Amat Baik">Amat Baik (91 - 100)</option>
                <option value="Baik">Baik (81 - 90)</option>
                <option value="Cukup">Cukup (71 - 80)</option>
                <option value="Perlu Bimbingan">Perlu Bimbingan (&lt; 71)</option>
              </select>
            </div>
          </div>

          {/* 1. Kekuatan & Praktik Baik */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>1. Apresiasi Praktik Baik &amp; Kekuatan Guru *</span>
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => insertQuickText('strengths', 'Penguasaan materi sangat baik dan siswa terlibat aktif.')}
                  className="px-2 py-0.5 text-[10px] bg-emerald-50 text-emerald-700 rounded hover:bg-emerald-100"
                >
                  + Keterlibatan Siswa
                </button>
                <button
                  type="button"
                  onClick={() => insertQuickText('strengths', 'Penerapan Pembelajaran Berkesadaran (mindful learning) berjalan sangat natural.')}
                  className="px-2 py-0.5 text-[10px] bg-emerald-50 text-emerald-700 rounded hover:bg-emerald-100"
                >
                  + Mindful Learning
                </button>
              </div>
            </div>
            <textarea
              rows={3}
              required
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg placeholder:text-slate-400"
              placeholder="Tuliskan hal-hal positif dan kekuatan mengajar yang diobservasi dari guru..."
            />
          </div>

          {/* 2. Saran Masukan & Perbaikan */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>2. Saran Masukan &amp; Area Perbaikan *</span>
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => insertQuickText('improvements', 'Penguatan diferensiasi proses bagi murid yang membutuhkan scaffolding.')}
                  className="px-2 py-0.5 text-[10px] bg-amber-50 text-amber-800 rounded hover:bg-amber-100"
                >
                  + Diferensiasi
                </button>
                <button
                  type="button"
                  onClick={() => insertQuickText('improvements', 'Optimalisasi media digital dan alat peraga nyata.')}
                  className="px-2 py-0.5 text-[10px] bg-amber-50 text-amber-800 rounded hover:bg-amber-100"
                >
                  + Media Belajar
                </button>
              </div>
            </div>
            <textarea
              rows={3}
              required
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg placeholder:text-slate-400"
              placeholder="Tuliskan catatan pedagogik, aspek yang perlu ditingkatkan, atau koreksi konstruktif..."
            />
          </div>

          {/* 3. Rencana Tindak Lanjut */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>3. Rekomendasi Rencana Tindak Lanjut (RTL)</span>
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => insertQuickText('actionPlan', 'Menyusun instrumen asesmen formatif bertingkat pada siklus berikutnya.')}
                  className="px-2 py-0.5 text-[10px] bg-blue-50 text-blue-800 rounded hover:bg-blue-100"
                >
                  + RTL Asesmen
                </button>
                <button
                  type="button"
                  onClick={() => insertQuickText('actionPlan', 'Berbagi praktik baik melalui forum KKG Gugus Sukomoro.')}
                  className="px-2 py-0.5 text-[10px] bg-blue-50 text-blue-800 rounded hover:bg-blue-100"
                >
                  + Forum KKG
                </button>
              </div>
            </div>
            <textarea
              rows={2}
              value={actionPlan}
              onChange={(e) => setActionPlan(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg placeholder:text-slate-400"
              placeholder="Langkah konkret tindak lanjut yang disepakati bersama guru..."
            />
          </div>

          {/* 4. Catatan Umum Ringkasan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Ringkasan Evaluasi Supervisi
            </label>
            <input
              type="text"
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg placeholder:text-slate-400"
              placeholder="Ringkasan akhir supervisi..."
            />
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCommentModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan & Teruskan Catatan ke Guru'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Tanggapan & Refleksi Guru */}
      <Modal
        isOpen={isTeacherResponseModalOpen}
        onClose={() => setIsTeacherResponseModalOpen(false)}
        title="Refleksi & Tanggapan Balik Guru"
        subtitle={`Atas Catatan Supervisi dari ${selectedSupervision?.supervisorFeedback?.supervisorName || 'Pengawas Pembina'}`}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveTeacherResponse} className="space-y-4">
          <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl text-xs space-y-1">
            <span className="font-bold text-purple-900 block">Komitmen Perbaikan Diri:</span>
            <p className="text-slate-700 leading-relaxed">
              Tuliskan komitmen tindak lanjut, langkah persiapan, atau refleksi pribadi Anda berdasarkan catatan saran masukan yang telah diberikan oleh Pengawas Pembina.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Catatan Refleksi &amp; Komitmen Tindak Lanjut *
            </label>
            <textarea
              rows={4}
              required
              value={teacherResponseNotes}
              onChange={(e) => setTeacherResponseNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg placeholder:text-slate-400"
              placeholder="Contoh: Terima kasih atas saran Bapak Pengawas. Pada pembelajaran berikutnya, saya akan menyiapkan lembar aktivitas berjenjang untuk memfasilitasi kebutuhan diferensiasi murid..."
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsTeacherResponseModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmittingResponse}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmittingResponse ? 'Mengirim...' : 'Kirim Tanggapan Refleksi'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Detail / Lembar Hasil Cetak */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Lembar Rekomendasi & Catatan Hasil Supervisi"
        subtitle={`Satuan Pendidikan: ${detailItem?.schoolName}`}
        maxWidth="2xl"
      >
        {detailItem && (
          <div className="space-y-4 print:p-0">
            {/* Header Cetak Resmi */}
            <div className="text-center border-b-2 border-slate-900 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Pemerintah Kabupaten Magetan - Dinas Pendidikan, Kepemudaan dan Olahraga
              </h2>
              <h3 className="text-base font-extrabold uppercase text-slate-900 mt-0.5">
                Lembar Rekomendasi &amp; Umpan Balik Supervisi Akademik
              </h3>
              <p className="text-[11px] text-slate-600">
                Tahun Ajaran {detailItem.educationYearName || '2026/2027'} • Sistem SIBER-PM Magetan
              </p>
            </div>

            {/* Identitas Data */}
            <div className="grid grid-cols-2 gap-2 text-xs p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-500">Nama Guru:</span>
                <span className="font-bold text-slate-900 block">{detailItem.teacherName}</span>
              </div>
              <div>
                <span className="text-slate-500">Satuan Pendidikan:</span>
                <span className="font-bold text-slate-900 block">{detailItem.schoolName}</span>
              </div>
              <div>
                <span className="text-slate-500">Mata Pelajaran:</span>
                <span className="font-semibold text-slate-800 block">{detailItem.subject}</span>
              </div>
              <div>
                <span className="text-slate-500">Tanggal Supervisi:</span>
                <span className="font-semibold text-slate-800 block">
                  {detailItem.approvedDate || detailItem.proposedDate1}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Pengawas Pembina:</span>
                <span className="font-semibold text-slate-800 block">
                  {detailItem.supervisorFeedback?.supervisorName || detailItem.supervisorName || 'Pengawas'}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Skor / Capaian Mutu:</span>
                <span className="font-bold text-emerald-800 block">
                  {detailItem.completionScore || detailItem.score || '-'} / 100 ({detailItem.supervisorFeedback?.category || 'Baik'})
                </span>
              </div>
            </div>

            {/* Rekomendasi Pengawas */}
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">A. Kekuatan &amp; Praktik Baik yang Diapresiasi:</span>
                <p className="text-slate-800 leading-relaxed">
                  {detailItem.supervisorFeedback?.strengths || detailItem.feedback || 'Praktik pembelajaran berjalan dengan baik dan lancar.'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">B. Catatan Saran Masukan &amp; Area Perbaikan:</span>
                <p className="text-slate-800 leading-relaxed">
                  {detailItem.supervisorFeedback?.improvements || detailItem.completionNotes || 'Terus tingkatkan inovasi dan keterlibatan aktif siswa.'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">C. Rencana Tindak Lanjut (RTL) yang Disepakati:</span>
                <p className="text-slate-800 leading-relaxed">
                  {detailItem.supervisorFeedback?.actionPlan || 'Implementasi perbaikan pada perencanaan pembelajaran berikutnya.'}
                </p>
              </div>

              {detailItem.teacherResponse?.notes && (
                <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-200">
                  <span className="font-bold text-purple-950 block mb-1">D. Tanggapan &amp; Komitmen Refleksi Guru:</span>
                  <p className="text-slate-800 italic leading-relaxed">"{detailItem.teacherResponse.notes}"</p>
                </div>
              )}
            </div>

            {/* Signature Area */}
            <div className="grid grid-cols-2 pt-6 text-center text-xs">
              <div>
                <p className="text-slate-500">Guru yang Disupervisi,</p>
                <div className="h-16" />
                <p className="font-bold text-slate-900 underline">{detailItem.teacherName}</p>
              </div>
              <div>
                <p className="text-slate-500">Pengawas Pembina,</p>
                <div className="h-16" />
                <p className="font-bold text-slate-900 underline">
                  {detailItem.supervisorFeedback?.supervisorName || detailItem.supervisorName || 'Pengawas Sekolah'}
                </p>
                <p className="text-[10px] text-slate-500">
                  NIP. {detailItem.supervisorFeedback?.supervisorNip || '196803151992031004'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 print:hidden">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Lembar Rekomendasi</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default KomentarSupervisiView;
