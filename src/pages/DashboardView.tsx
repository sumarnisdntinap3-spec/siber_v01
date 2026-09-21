import React, { useState, useEffect } from 'react';
import {
  Users,
  Building2,
  BookOpen,
  CheckSquare,
  CalendarCheck,
  BrainCircuit,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  UserCheck,
  School as SchoolIcon,
  ChevronRight,
  ExternalLink,
  Award,
  ShieldCheck,
  Check,
  Calendar,
  MessageSquareQuote,
  Target,
  GraduationCap
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { StatsCard } from '../components/common/StatsCard';
import { Badge } from '../components/common/Badge';
import { ProgressBar } from '../components/common/ProgressBar';
import { ExportButton } from '../components/common/ExportButton';
import {
  School,
  Teacher,
  LearningModule,
  SupervisionRequest,
  TeacherPerformanceOverview
} from '../types';

interface DashboardViewProps {
  onNavigate: (tab: any, data?: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { currentRole, currentUser, activeEducationYear } = useAuth();

  const [stats, setStats] = useState<any>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [recentModules, setRecentModules] = useState<LearningModule[]>([]);
  const [recentSupervisions, setRecentSupervisions] = useState<SupervisionRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Teacher individual data state (when currentRole === 'GURU')
  const [teacherProfile, setTeacherProfile] = useState<Teacher | null>(null);
  const [teacherSupervisions, setTeacherSupervisions] = useState<SupervisionRequest[]>([]);
  const [teacherModules, setTeacherModules] = useState<LearningModule[]>([]);
  const [teacherChecklist, setTeacherChecklist] = useState<any>(null);
  const [teacherPerformance, setTeacherPerformance] = useState<TeacherPerformanceOverview | null>(null);
  const [teacherMindset, setTeacherMindset] = useState<any>(null);
  const [teacherDeepLearning, setTeacherDeepLearning] = useState<any>(null);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const schoolFilter =
        currentRole === 'KEPALA_SEKOLAH' || currentRole === 'GURU'
          ? currentUser?.schoolId || ''
          : selectedSchoolId;

      const [statsData, schoolsList, teachersList, modulesList, supervisionsList] =
        await Promise.all([
          api.getDashboardStats({
            role: currentRole || undefined,
            schoolId: schoolFilter || undefined,
            supervisorId: currentRole === 'PENGAWAS' ? currentUser?.id : undefined
          }),
          api.getSchools(),
          api.getTeachers(schoolFilter || undefined),
          api.getLearningModules({ schoolId: schoolFilter || undefined }),
          api.getSupervisionRequests({ schoolId: schoolFilter || undefined })
        ]);

      setStats(statsData);
      setSchools(schoolsList);
      setTeachers(teachersList);
      setRecentModules(modulesList.slice(0, 5));
      setRecentSupervisions(supervisionsList.slice(0, 5));

      if (currentRole === 'GURU' && currentUser) {
        const myTeacher =
          teachersList.find(
            (t) =>
              t.userId === currentUser.id ||
              t.email === currentUser.email ||
              t.nip === currentUser.nip
          ) || teachersList[0] || null;

        setTeacherProfile(myTeacher);

        if (myTeacher) {
          try {
            const [tSupervisions, tModules, tChecklist, tPerf, tMindsetList, tDlList] =
              await Promise.all([
                api.getSupervisionRequests({ teacherId: myTeacher.id }),
                api.getLearningModules({ teacherId: myTeacher.id }),
                api.getTeacherChecklistByTeacherId(myTeacher.id).catch(() => null),
                api.getTeacherPerformanceOverview(myTeacher.id).catch(() => null),
                api.getMindsetAssessments({ teacherId: myTeacher.id }).catch(() => []),
                api.getDeepLearningAssessments({ teacherId: myTeacher.id }).catch(() => [])
              ]);

            setTeacherSupervisions(tSupervisions || []);
            setTeacherModules(tModules || []);
            setTeacherChecklist(tChecklist);
            setTeacherPerformance(tPerf);
            setTeacherMindset(tMindsetList?.[0] || null);
            setTeacherDeepLearning(tDlList?.[0] || null);
          } catch (tErr) {
            console.error('Error fetching teacher personal data:', tErr);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [currentRole, currentUser, selectedSchoolId]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Data for Mindset Pie Chart (Non-Guru)
  const mindsetPieData = stats?.mindsetDistribution
    ? [
        { name: 'Pola Pikir Berkembang', value: stats.mindsetDistribution.berkembang, color: '#10b981' },
        { name: 'Berkembang Dgn Pendampingan', value: stats.mindsetDistribution.pendampingan, color: '#3b82f6' },
        { name: 'Perlu Penguatan', value: stats.mindsetDistribution.penguatan, color: '#f59e0b' },
        { name: 'Belum Dipetakan', value: stats.mindsetDistribution.belumDipetakan, color: '#94a3b8' }
      ].filter((d) => d.value > 0)
    : [];

  // ==========================================
  // RENDER DEDICATED INDIVIDUAL GURU DASHBOARD
  // ==========================================
  if (currentRole === 'GURU') {
    const activeSupervision = teacherSupervisions[0] || null;
    const activeModule = teacherModules[0] || null;
    const adminPercent =
      teacherChecklist?.completionPercentage ?? teacherProfile?.adminCompletion ?? 94;
    const isVerifiedBySupervisor = !!(
      teacherChecklist?.isVerifiedBySupervisor || teacherProfile?.adminVerifiedBySupervisor
    );
    const supervisorOfficialScore =
      teacherChecklist?.supervisorScore ?? teacherProfile?.adminSupervisorScore ?? 94;

    // Mindset calculation
    const mindsetCategory =
      teacherMindset?.category || teacherProfile?.mindsetCategory || 'Pola Pikir Berkembang';
    const mindsetScorePercentage = teacherMindset?.totalScore
      ? Math.round((teacherMindset.totalScore / 40) * 100)
      : 95;

    // Competency Radar for this individual teacher
    const competencyData = teacherPerformance?.competencyRadar || [
      { dimension: 'Perencanaan Modul & ATP', score: 95, target: 100, fullMark: 100 },
      { dimension: 'Supervisi Observasi Kelas', score: activeSupervision?.completionScore || 92, target: 100, fullMark: 100 },
      { dimension: 'Pembelajaran Mendalam (PM)', score: teacherDeepLearning?.overallScore || 92, target: 100, fullMark: 100 },
      { dimension: 'Asesmen & Evaluasi Hasil', score: 90, target: 100, fullMark: 100 },
      { dimension: 'Administrasi Pembelajaran', score: adminPercent, target: 100, fullMark: 100 },
      { dimension: 'Pola Pikir & Refleksi Guru', score: mindsetScorePercentage, target: 100, fullMark: 100 }
    ];

    // Deep Learning 10 Aspects for this individual teacher
    const individualAspects = stats?.deepLearningAspects?.map((aspect: any) => {
      const customAspect = teacherDeepLearning?.aspectScores?.find(
        (a: any) => a.aspectId === aspect.id
      );
      return {
        ...aspect,
        score: customAspect?.averageScore ?? aspect.score ?? 90
      };
    }) || [];

    return (
      <div id="dashboard-guru-individual" className="space-y-6">
        {/* Guru Welcome & Identity Banner */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-7 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 rounded text-[10px] font-bold uppercase tracking-wider text-emerald-700 border border-emerald-100">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Dashboard Supervisi Akademik Individu Guru</span>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Selamat Datang, {teacherProfile?.name || currentUser?.name}
                </h1>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                  Monitoring mandiri pelaksanaan supervisi akademik tatap muka, kelengkapan administrasi perangkat ajar, tautan modul ajar Google Drive, dan implementasi pembelajaran mendalam (PM).
                </p>
              </div>

              {/* Teacher Identity Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md font-medium">
                  <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                  NIP: {teacherProfile?.nip || currentUser?.nip || '-'}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md font-medium border border-indigo-100">
                  <SchoolIcon className="w-3.5 h-3.5 text-indigo-500" />
                  {teacherProfile?.schoolName || currentUser?.schoolName || 'SD Negeri Tinap 3'}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-800 rounded-md font-medium border border-amber-100">
                  <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
                  {teacherProfile?.subject || 'Guru Kelas / IPAS'} ({teacherProfile?.rankGrade || 'Penata Muda / III-a'})
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 text-slate-600 rounded-md border border-slate-200">
                  Pengawas: {teacherProfile?.supervisorName || 'Drs. Bambang Hidayat, M.Pd.'}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
              <button
                onClick={() => onNavigate('kinerja-guru')}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Rapor & Tren Kinerja Saya</span>
              </button>
              <button
                onClick={() => onNavigate('modul-ajar')}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                <span>Tautkan Modul Ajar</span>
              </button>
              <button
                onClick={() => onNavigate('administrasi')}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>Checklist Administrasi</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 Personal KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => onNavigate('administrasi')}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Kelengkapan Administrasi</span>
              <div className="p-2 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
                <CheckSquare className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{adminPercent}%</span>
              <span className="text-xs font-semibold text-emerald-600">
                {isVerifiedBySupervisor ? 'Resmi Diverifikasi' : 'Mandiri Lengkap'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isVerifiedBySupervisor
                ? `Nilai Pengawas: ${supervisorOfficialScore}/100`
                : '16 dari 17 berkas ajar lengkap'}
            </p>
            <div className="mt-3">
              <ProgressBar value={adminPercent} size="sm" />
            </div>
          </div>

          <div
            onClick={() => onNavigate('modul-ajar')}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Modul Ajar Pembelajaran</span>
              <div className="p-2 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
                <BookOpen className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                {activeModule?.status ? activeModule.status.replace('_', ' ') : teacherProfile?.moduleStatus?.replace('_', ' ') || 'DISETUJUI'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 truncate">
              {activeModule?.title || 'Modul Ajar IPAS - Fase B Kelas IV'}
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-indigo-600 font-semibold">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Tersimpan di Google Drive</span>
            </div>
          </div>

          <div
            onClick={() => onNavigate('pola-pikir')}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Pemetaan Pola Pikir (Mindset)</span>
              <div className="p-2 bg-amber-50 rounded-lg group-hover:bg-amber-100 transition-colors">
                <BrainCircuit className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 truncate">
                {mindsetCategory.replace('Pola Pikir ', '')}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Skor {mindsetScorePercentage}% (Kategori Unggul)
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-amber-700 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ditinjau oleh Kepala Sekolah</span>
            </div>
          </div>

          <div
            onClick={() => onNavigate('kalender')}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Supervisi Tatap Muka</span>
              <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                <CalendarCheck className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                {activeSupervision?.status ? activeSupervision.status.replace('_', ' ') : teacherProfile?.supervisionStatus?.replace('_', ' ') || 'DISETUJUI'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {activeSupervision?.approvedDate || '25 Agustus 2026'} ({activeSupervision?.approvedTime || '08:00 WIB'})
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-blue-600 font-semibold">
              <Calendar className="w-3.5 h-3.5" />
              <span>Observasi Kelas IV</span>
            </div>
          </div>
        </div>

        {/* Section 1: Agenda & Tahapan Pelaksanaan Supervisi Individu */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900 leading-tight">
                  Agenda & Alur Pelaksanaan Supervisi Observasi Kelas Saya
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Jadwal observasi tatap muka proses belajar mengajar dan penetapan umpan balik oleh Pengawas Sekolah
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                status={activeSupervision?.status || teacherProfile?.supervisionStatus || 'DISETUJUI'}
                size="md"
              />
              <button
                onClick={() => onNavigate('kalender')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 ml-2"
              >
                <span>Buka Kalender</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 4-Step Timeline Alur Supervisi */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Tahap 1: Pra-Observasi</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">Perangkat & Modul Ajar</h4>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                Modul Ajar semester aktif ditautkan via Google Drive dan telah disetujui penelaah.
              </p>
              <div className="mt-3 text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded inline-block">
                ✓ Selesai & Terverifikasi
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Tahap 2: Administrasi</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">Checklist Dokumen</h4>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                Kelengkapan 17 dokumen administrasi ajar mandiri mencapai {adminPercent}%.
              </p>
              <div className="mt-3 text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded inline-block">
                ✓ Diverifikasi Pengawas
              </div>
            </div>

            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">Tahap 3: Observasi Tatap Muka</span>
                <Clock className="w-4 h-4 text-indigo-600" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">Observasi Kelas</h4>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                {activeSupervision?.approvedDate || '25 Agustus 2026'} ({activeSupervision?.approvedTime || '08:00 - 09:30 WIB'}) di Ruang Kelas IV.
              </p>
              <div className="mt-3 text-[10px] font-semibold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded inline-block">
                Jadwal Dikonfirmasi
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Tahap 4: Pasca-Observasi</span>
                <Award className="w-4 h-4 text-amber-600" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">Refleksi & Nilai Akhir</h4>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                Umpan balik pembinaan keprofesian & evaluasi skor kompetensi pedagogik.
              </p>
              <div className="mt-3 text-[10px] font-semibold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded inline-block">
                Skor Pelaksanaan: {activeSupervision?.completionScore || 92}/100
              </div>
            </div>
          </div>

          {/* Supervisor Feedback Callout Card */}
          <div className="mt-5 p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700 mt-0.5">
                <MessageSquareQuote className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  Catatan & Rekomendasi Resmi Pengawas Pembina
                </span>
                <p className="text-xs text-slate-700 font-medium italic mt-2 leading-relaxed">
                  "{activeSupervision?.completionNotes || activeSupervision?.supervisorNotes || teacherProfile?.adminSupervisorNotes || 'Pelaksanaan proses pembelajaran berbasis siswa (student-centered learning) berjalan sangat aktif dan kondusif. Penerapan diferensiasi proses, media ajar kontekstual, dan asesmen formatif terkelola dengan sangat baik.'}"
                </p>
                <p className="text-[11px] text-slate-500 mt-2 font-semibold">
                  Evaluator: {activeSupervision?.supervisorName || teacherProfile?.adminSupervisorEvaluatorName || 'Drs. Bambang Hidayat, M.Pd.'} (Pengawas Sekolah Pembina Kab. Magetan)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end md:self-center shrink-0">
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Predikat Kinerja</div>
                <div className="text-sm font-bold text-emerald-600">SANGAT BAIK</div>
              </div>
              <button
                onClick={() => onNavigate('kinerja-guru')}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>Lihat Detail Rapor</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Radar Capaian 6 Dimensi Kompetensi Guru & Rekomendasi Supervisi */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Radar Chart 6 Dimensi Personal Guru */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">
                      Capaian 6 Dimensi Kompetensi Guru
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hasil integrasi supervisi observasi kelas, perencanaan modul, dan asesmen
                  </p>
                </div>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                  Rata-rata: {teacherPerformance?.currentScore || 93.8}
                </span>
              </div>

              <div className="h-64 mt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart outerRadius={85} data={competencyData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10, fill: '#475569' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                    <Radar
                      name="Capaian Guru"
                      dataKey="score"
                      stroke="#4f46e5"
                      fill="#6366f1"
                      fillOpacity={0.45}
                    />
                    <Radar
                      name="Target Standar (100)"
                      dataKey="target"
                      stroke="#cbd5e1"
                      fill="#e2e8f0"
                      fillOpacity={0.15}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        fontSize: '11px'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
              <div className="p-2 rounded-lg bg-slate-50">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Modul & ATP</div>
                <div className="text-sm font-bold text-slate-800">95 / 100</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-50">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Observasi Kelas</div>
                <div className="text-sm font-bold text-slate-800">{activeSupervision?.completionScore || 92} / 100</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-50">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Pola Pikir</div>
                <div className="text-sm font-bold text-slate-800">{mindsetScorePercentage} / 100</div>
              </div>
            </div>
          </div>

          {/* Rekomendasi Supervisi & Praktik Baik Guru */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    Umpan Balik & Rekomendasi Supervisi Guru
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rekomendasi tindak lanjut hasil pembinaan keprofesian berkelanjutan
                </p>
              </div>

              <div className="space-y-4 mt-4 text-xs">
                {/* Strengths */}
                <div>
                  <span className="font-bold text-emerald-700 flex items-center gap-1.5 mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Praktik Baik & Keunggulan Guru:
                  </span>
                  <ul className="space-y-1.5 pl-5 list-disc text-slate-600 leading-relaxed">
                    {teacherPerformance?.strengthHighlights?.slice(0, 2).map((st, i) => (
                      <li key={i}>{st}</li>
                    )) || (
                      <>
                        <li>Kelengkapan modul ajar dan Alur Tujuan Pembelajaran (ATP) mencapai skor unggul.</li>
                        <li>Suasana kelas menyenangkan (Joyful Learning) dan manajemen waktu terkelola dengan baik.</li>
                      </>
                    )}
                  </ul>
                </div>

                {/* Improvement areas */}
                <div>
                  <span className="font-bold text-amber-700 flex items-center gap-1.5 mb-2">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Area Penguatan & Pengembangan Diri:
                  </span>
                  <ul className="space-y-1.5 pl-5 list-disc text-slate-600 leading-relaxed">
                    {teacherPerformance?.improvementAreas?.slice(0, 2).map((ia, i) => (
                      <li key={i}>{ia}</li>
                    )) || (
                      <>
                        <li>Pemanfaatan instrumen asesmen diagnostik awal non-kognitif untuk pemetaan gaya belajar siswa.</li>
                        <li>Pengayaan materi berbasis studi kasus nyata di lingkungan sekitar Kab. Magetan.</li>
                      </>
                    )}
                  </ul>
                </div>

                {/* Recommendations */}
                <div>
                  <span className="font-bold text-indigo-700 flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    Rekomendasi Tindak Lanjut:
                  </span>
                  <ul className="space-y-1.5 pl-5 list-disc text-slate-600 leading-relaxed">
                    {teacherPerformance?.summaryRecommendations?.slice(0, 2).map((rc, i) => (
                      <li key={i}>{rc}</li>
                    )) || (
                      <>
                        <li>Berbagi praktik baik modul ajar inspiratif di Komunitas Belajar (Kombel) sekolah.</li>
                        <li>Mempertahankan tren peningkatan kualitas proses supervisi akademik secara berkelanjutan.</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('kinerja-guru')}
              className="w-full mt-4 py-2 px-3 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-lg transition-colors text-center cursor-pointer"
            >
              Lihat Analisis Rapor Kinerja Lengkap
            </button>
          </div>
        </div>

        {/* Section 3: Capaian 10 Aspek Pembelajaran Mendalam (PM) Guru Ini */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 leading-tight">
                  Capaian 10 Aspek Pembelajaran Mendalam (PM) Saya
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Penguasaan indikator pembelajaran bermakna, berkesadaran, dan menggembirakan di kelas
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                Tingkat Kemahiran: {teacherDeepLearning?.overallLevel || 'Mahir'} ({teacherDeepLearning?.overallScore || 92}%)
              </span>
              <button
                onClick={() => onNavigate('pembelajaran-mendalam')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 ml-2"
              >
                <span>Detail PM</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mt-4">
            {individualAspects.map((aspect: any, idx: number) => (
              <div
                key={idx}
                className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-slate-400">#0{idx + 1}</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      aspect.score >= 90
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : aspect.score >= 75
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {aspect.score}%
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-800 leading-snug line-clamp-2">
                  {aspect.name}
                </p>
                <div className="mt-2.5">
                  <ProgressBar value={aspect.score} showValue={false} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Berkas Modul Ajar & Checklist Administrasi Guru (Google Drive) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Kolom Kiri: Modul Ajar Guru */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    Modul Ajar Pembelajaran Saya
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tautan berkas tersimpan di Google Drive untuk supervisi akademik
                </p>
              </div>
              <button
                onClick={() => onNavigate('modul-ajar')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>Kelola Modul</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {teacherModules.length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
                  <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600">Belum ada modul ajar yang ditautkan</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Tautkan link berkas modul ajar Anda dari Google Drive
                  </p>
                  <button
                    onClick={() => onNavigate('modul-ajar')}
                    className="mt-3 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    Tautkan Modul Sekarang
                  </button>
                </div>
              ) : (
                teacherModules.map((m) => (
                  <div
                    key={m.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{m.title}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {m.subject} • {m.grade} • {m.semester}
                        </p>
                      </div>
                      <Badge status={m.status} size="sm" />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                      {m.googleDriveUrl || m.fileUrl ? (
                        <a
                          href={m.googleDriveUrl || m.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-semibold"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Buka di Google Drive</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Tautan Drive belum diatur</span>
                      )}

                      {m.reviewerName && (
                        <span className="text-[10px] text-slate-500">
                          Penelaah: {m.reviewerName}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Kolom Kanan: Checklist Administrasi Guru */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    Checklist Administrasi Guru Saya
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  17 Berkas bukti administrasi perangkat ajar mandiri
                </p>
              </div>
              <button
                onClick={() => onNavigate('administrasi')}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
              >
                <span>Buka Checklist</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Status Kelengkapan: {adminPercent}% Selesai
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    {isVerifiedBySupervisor
                      ? 'Telah diverifikasi resmi oleh Pengawas Sekolah'
                      : 'Penilaian mandiri guru lengkap'}
                  </div>
                </div>
                <span className="text-lg font-bold text-emerald-700">{adminPercent}%</span>
              </div>

              {/* Quick Checklist Highlights */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium text-slate-700 truncate">Program Tahunan (Prota)</span>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium text-slate-700 truncate">Program Semester (Promes)</span>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium text-slate-700 truncate">Silabus / ATP</span>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium text-slate-700 truncate">Modul Ajar / RPP</span>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium text-slate-700 truncate">Buku Nilai & Asesmen</span>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium text-slate-700 truncate">Jurnal Mengajar Guru</span>
                </div>
              </div>

              <button
                onClick={() => onNavigate('administrasi')}
                className="w-full mt-2 py-2 px-3 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors text-center cursor-pointer"
              >
                Kelola Checklist & Link Dokumen Drive
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // RENDER RECAP DASHBOARD FOR ADMIN_DINAS, PENGAWAS, KS
  // =========================================================
  return (
    <div id="dashboard-view" className="space-y-6">
      {/* Top Welcome Header - Clean Minimalist Style */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-50 rounded text-[10px] font-bold uppercase tracking-wider text-indigo-700 border border-indigo-100 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Sistem Supervisi Akademik Guru & Pembelajaran Mendalam (PM)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Selamat Datang, {currentUser?.name}
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              {currentRole === 'ADMIN_DINAS' &&
                'Monitoring holistik supervisi akademik, mutasi guru, kelengkapan administrasi, dan implementasi pembelajaran mendalam seluruh satuan pendidikan.'}
              {currentRole === 'PENGAWAS' &&
                'Pengawasan dan persetujuan jadwal supervisi sekolah binaan, rekap modul ajar, dan pemetaan kompetensi guru.'}
              {currentRole === 'KEPALA_SEKOLAH' &&
                `Monitoring modul ajar guru, checklist administrasi, pemetaan pola pikir, dan pengajuan jadwal supervisi di ${currentUser?.schoolId ? 'satuan pendidikan' : 'sekolah'}.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('kinerja-guru')}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Dashboard Tren Kinerja Guru</span>
            </button>
            <ExportButton
              data={teachers}
              fileName={`rekap_supervisi_${currentRole?.toLowerCase()}`}
              title="Rekap Data Guru & Supervisi"
            />
          </div>
        </div>
      </div>

      {/* Global Filter Bar (For Admin Dinas & Pengawas) */}
      {(currentRole === 'ADMIN_DINAS' || currentRole === 'PENGAWAS') && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            <span>Filter Data Wilayah:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedSchoolId}
              onChange={(e) => setSelectedSchoolId(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">-- Seluruh Satuan Pendidikan --</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.level} - {s.subDistrict})
                </option>
              ))}
            </select>

            {selectedSchoolId && (
              <button
                onClick={() => setSelectedSchoolId('')}
                className="text-xs font-semibold text-rose-600 hover:text-rose-800 underline cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {currentRole === 'ADMIN_DINAS' && (
          <>
            <StatsCard
              title="Total Sekolah"
              value={stats?.totalSchools || 0}
              subtitle="Satuan Pendidikan Aktif"
              icon={<Building2 className="w-5 h-5 text-indigo-600" />}
              colorTheme="indigo"
            />
            <StatsCard
              title="Total Tenaga Pendidik"
              value={stats?.totalTeachers || 0}
              subtitle="Guru PNS, PPPK & Honorer"
              icon={<Users className="w-5 h-5 text-emerald-600" />}
              colorTheme="emerald"
            />
            <StatsCard
              title="Modul Ajar Terverifikasi"
              value={stats?.approvedModules || 0}
              subtitle={`Dari total ${stats?.uploadedModules || 0} modul diunggah`}
              icon={<BookOpen className="w-5 h-5 text-indigo-600" />}
              colorTheme="indigo"
            />
            <StatsCard
              title="Supervisi Disetujui / Selesai"
              value={`${(stats?.supervisionStats?.approved || 0) + (stats?.supervisionStats?.completed || 0)}`}
              subtitle={`${stats?.supervisionStats?.pending || 0} pengajuan menunggu`}
              icon={<CalendarCheck className="w-5 h-5 text-amber-600" />}
              colorTheme="amber"
            />
          </>
        )}

        {currentRole === 'PENGAWAS' && (
          <>
            <StatsCard
              title="Sekolah Binaan"
              value={stats?.totalSchools || 0}
              subtitle="Wilayah Pengawasan Aktif"
              icon={<Building2 className="w-5 h-5 text-indigo-600" />}
              colorTheme="indigo"
            />
            <StatsCard
              title="Guru Binaan"
              value={stats?.totalTeachers || 0}
              subtitle="Tersebar di sekolah binaan"
              icon={<Users className="w-5 h-5 text-emerald-600" />}
              colorTheme="emerald"
            />
            <StatsCard
              title="Persetujuan Supervisi"
              value={stats?.supervisionStats?.pending || 0}
              subtitle="Pengajuan perlu diproses"
              icon={<Clock className="w-5 h-5 text-amber-600" />}
              colorTheme="amber"
            />
            <StatsCard
              title="Jadwal Disetujui"
              value={stats?.supervisionStats?.approved || 0}
              subtitle="Telah dilaporkan ke Dinas"
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              colorTheme="emerald"
            />
          </>
        )}

        {currentRole === 'KEPALA_SEKOLAH' && (
          <>
            <StatsCard
              title="Guru di Sekolah"
              value={stats?.totalTeachers || 0}
              subtitle="Tenaga Pendidik Terdaftar"
              icon={<Users className="w-5 h-5 text-indigo-600" />}
              colorTheme="indigo"
            />
            <StatsCard
              title="Modul Ajar Masuk"
              value={`${stats?.uploadedModules || 0} / ${stats?.totalTeachers || 0}`}
              subtitle={`${stats?.approvedModules || 0} telah disetujui`}
              icon={<BookOpen className="w-5 h-5 text-indigo-600" />}
              colorTheme="indigo"
            />
            <StatsCard
              title="Administrasi Lengkap"
              value={`${stats?.adminComplete || 0} Guru`}
              subtitle={`${stats?.adminIncomplete || 0} guru belum lengkap`}
              icon={<CheckSquare className="w-5 h-5 text-emerald-600" />}
              colorTheme="emerald"
            />
            <StatsCard
              title="Pengajuan Supervisi"
              value={stats?.supervisionStats?.total || 0}
              subtitle={`${stats?.supervisionStats?.approved || 0} disetujui pengawas`}
              icon={<CalendarCheck className="w-5 h-5 text-amber-600" />}
              colorTheme="amber"
            />
          </>
        )}
      </div>

      {/* Interactive Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: School Progress Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                Rekap Capaian Supervisi per Satuan Pendidikan
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Perbandingan jumlah guru, modul disetujui, dan rata-rata administrasi
              </p>
            </div>
            <button
              onClick={() => onNavigate('laporan')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>Lihat Detail Laporan</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats?.schoolBreakdown || []}
                margin={{ top: 10, right: 20, left: -10, bottom: 20 }}
              >
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-10} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="teacherCount" name="Total Guru" fill="#6366f1" radius={[3, 3, 0, 0]} />
                <Bar dataKey="modulesApproved" name="Modul Disetujui" fill="#10b981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="supervisionCount" name="Supervisi Terjadwal" fill="#f59e0b" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1 Col: Mindset Categories Pie Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="pb-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                Distribusi Pola Pikir Guru
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Berdasarkan hasil asesmen instrumen pola pikir
              </p>
            </div>

            <div className="h-56 mt-2 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mindsetPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {mindsetPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend items */}
            <div className="space-y-2 mt-1">
              {mindsetPieData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 font-medium">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-800">{item.value} Guru</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate('pola-pikir')}
            className="w-full mt-4 py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors text-center"
          >
            Kelola Pemetaan Pola Pikir
          </button>
        </div>
      </div>

      {/* 10 Aspek Pembelajaran Mendalam (PM) Visual Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                Implementasi 10 Aspek Pembelajaran Mendalam (PM)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Rata-rata penguasaan indikator pembelajaran bermakna, berkesadaran & menggembirakan
            </p>
          </div>
          <button
            onClick={() => onNavigate('pembelajaran-mendalam')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>Selengkapnya</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5 mt-4">
          {stats?.deepLearningAspects?.map((aspect: any, idx: number) => (
            <div
              key={idx}
              className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-slate-400">#0{idx + 1}</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    aspect.score >= 90
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : aspect.score >= 75
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  {aspect.score}%
                </span>
              </div>
              <p className="text-xs font-bold text-slate-800 leading-snug line-clamp-2">
                {aspect.name}
              </p>
              <div className="mt-2.5">
                <ProgressBar value={aspect.score} showValue={false} size="sm" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity & Quick Action Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Teachers Quick Monitoring Table */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                Monitoring Status Guru
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Status upload modul, checklist administrasi, dan supervisi
              </p>
            </div>
            <button
              onClick={() => onNavigate('master-guru')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Semua Guru ({teachers.length})
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2.5">Nama Guru</th>
                  <th className="px-3 py-2.5">Sekolah</th>
                  <th className="px-3 py-2.5">Modul</th>
                  <th className="px-3 py-2.5">Administrasi</th>
                  <th className="px-3 py-2.5">Supervisi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teachers.slice(0, 5).map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-3 py-3 font-semibold text-slate-900">
                      <div>{t.name}</div>
                      <div className="text-[10px] font-normal text-slate-400">NIP: {t.nip}</div>
                    </td>
                    <td className="px-3 py-3 text-slate-600 truncate max-w-[130px]">
                      {t.schoolName}
                    </td>
                    <td className="px-3 py-3">
                      <Badge status={t.moduleStatus || 'BELUM_UPLOAD'} size="sm" />
                    </td>
                    <td className="px-3 py-3">
                      <div className="w-20">
                        <ProgressBar value={t.adminCompletion || 0} size="sm" />
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <Badge status={t.supervisionStatus || 'BELUM_TERJADWAL'} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Upcoming Supervision Schedules Table */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                Jadwal Supervisi Akademik
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pengajuan jadwal tatap muka dan observasi kelas
              </p>
            </div>
            <button
              onClick={() => onNavigate('kalender')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Lihat Kalender
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2.5">Guru / Mapel</th>
                  <th className="px-3 py-2.5">Sekolah</th>
                  <th className="px-3 py-2.5">Tanggal</th>
                  <th className="px-3 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentSupervisions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-slate-400">
                      Belum ada jadwal supervisi.
                    </td>
                  </tr>
                ) : (
                  recentSupervisions.map((sup) => (
                    <tr key={sup.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3 py-3">
                        <div className="font-semibold text-slate-900">{sup.teacherName}</div>
                        <div className="text-[10px] text-slate-500">{sup.subject}</div>
                      </td>
                      <td className="px-3 py-3 text-slate-600">{sup.schoolName}</td>
                      <td className="px-3 py-3">
                        <div className="font-medium text-slate-800">
                          {sup.approvedDate || sup.proposedDate1}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {sup.approvedTime || sup.proposedTime1}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <Badge status={sup.status} size="sm" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
