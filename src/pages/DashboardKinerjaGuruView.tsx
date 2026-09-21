import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
  BrainCircuit,
  Sparkles,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Printer,
  Download,
  Building2,
  User,
  GraduationCap,
  FileSpreadsheet,
  Layers,
  BarChart3,
  Calendar,
  Clock,
  HelpCircle,
  FileText,
  RefreshCw,
  Eye,
  CheckSquare
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  CartesianGrid
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ProgressBar } from '../components/common/ProgressBar';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import {
  Teacher,
  School,
  TeacherPerformanceOverview,
  TeacherPeriodTrend,
  TrendDirection
} from '../types';

interface DashboardKinerjaGuruViewProps {
  onNavigate?: (tab: string, data?: any) => void;
  selectedTeacherId?: string;
}

export const DashboardKinerjaGuruView: React.FC<DashboardKinerjaGuruViewProps> = ({
  onNavigate,
  selectedTeacherId: initialTeacherId
}) => {
  const { currentRole, currentUser } = useAuth();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [allOverviews, setAllOverviews] = useState<TeacherPerformanceOverview[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedOverview, setSelectedOverview] = useState<TeacherPerformanceOverview | null>(null);

  // Filters for Admin / Pengawas / KS
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('ALL');
  const [selectedTrendFilter, setSelectedTrendFilter] = useState<string>('ALL');
  const [selectedPredicateFilter, setSelectedPredicateFilter] = useState<string>('ALL');

  // Selected period for deep dive
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');

  // Print modal
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [overviewsData, schoolsList] = await Promise.all([
        api.getAllTeacherPerformanceTrends({
          schoolId: currentRole === 'KEPALA_SEKOLAH' ? currentUser?.schoolId : undefined,
          supervisorId: currentRole === 'PENGAWAS' ? currentUser?.id : undefined
        }),
        api.getSchools()
      ]);

      setAllOverviews(overviewsData);
      setSchools(schoolsList);

      // Determine default selected teacher
      if (currentRole === 'GURU' && currentUser) {
        const myOverview = overviewsData.find(
          (o) => o.teacher.userId === currentUser.id || o.teacher.email === currentUser.email || o.teacher.nip === currentUser.nip
        );
        setSelectedOverview(myOverview || overviewsData[0] || null);
      } else if (initialTeacherId) {
        const target = overviewsData.find((o) => o.teacher.id === initialTeacherId);
        setSelectedOverview(target || overviewsData[0] || null);
      } else if (overviewsData.length > 0 && !selectedOverview) {
        setSelectedOverview(overviewsData[0]);
      }
    } catch (err) {
      console.error('Error loading teacher performance trends:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentRole, currentUser, initialTeacherId]);

  // Set default period when selectedOverview changes
  useEffect(() => {
    if (selectedOverview && selectedOverview.historyPeriods?.length > 0) {
      const cur = selectedOverview.historyPeriods.find((p) => p.isCurrentPeriod) || selectedOverview.historyPeriods[selectedOverview.historyPeriods.length - 1];
      setSelectedPeriodId(cur.periodId);
    }
  }, [selectedOverview]);

  // Filtered teachers list for selection
  const filteredOverviews = useMemo(() => {
    return allOverviews.filter((o) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !searchQuery ||
        o.teacher.name.toLowerCase().includes(q) ||
        o.teacher.nip.includes(q) ||
        o.teacher.subject.toLowerCase().includes(q) ||
        o.teacher.schoolName.toLowerCase().includes(q);

      const matchSchool =
        selectedSchoolId === 'ALL' || o.teacher.schoolId === selectedSchoolId;

      const matchTrend =
        selectedTrendFilter === 'ALL' || o.overallTrend === selectedTrendFilter;

      const matchPredicate =
        selectedPredicateFilter === 'ALL' || o.currentPredicate === selectedPredicateFilter;

      return matchSearch && matchSchool && matchTrend && matchPredicate;
    });
  }, [allOverviews, searchQuery, selectedSchoolId, selectedTrendFilter, selectedPredicateFilter]);

  // Aggregate stats across filtered teachers
  const summaryStats = useMemo(() => {
    if (allOverviews.length === 0) {
      return { total: 0, peningkat: 0, stabil: 0, penurunan: 0, avgScore: 0, amatBaik: 0 };
    }
    const total = allOverviews.length;
    const peningkat = allOverviews.filter((o) => o.overallTrend === 'PENINGKATAN').length;
    const stabil = allOverviews.filter((o) => o.overallTrend === 'STABIL').length;
    const penurunan = allOverviews.filter((o) => o.overallTrend === 'PENURUNAN').length;
    const amatBaik = allOverviews.filter((o) => o.currentPredicate === 'Amat Baik').length;
    const sumScore = allOverviews.reduce((acc, o) => acc + o.currentScore, 0);
    const avgScore = Math.round((sumScore / total) * 10) / 10;

    return { total, peningkat, stabil, penurunan, avgScore, amatBaik };
  }, [allOverviews]);

  const activePeriodData = useMemo(() => {
    if (!selectedOverview) return null;
    return (
      selectedOverview.historyPeriods.find((p) => p.periodId === selectedPeriodId) ||
      selectedOverview.historyPeriods[selectedOverview.historyPeriods.length - 1]
    );
  }, [selectedOverview, selectedPeriodId]);

  const getTrendBadge = (trend: TrendDirection, deltaScore: number, deltaPct: number) => {
    if (trend === 'PENINGKATAN') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          <span>Meningkat (+{deltaScore > 0 ? deltaScore : 0} poin / +{deltaPct > 0 ? deltaPct : 0}%)</span>
        </span>
      );
    }
    if (trend === 'PENURUNAN') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
          <span>Menurun ({deltaScore} poin / {deltaPct}%)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
        <Minus className="w-3.5 h-3.5 text-slate-500" />
        <span>Stabil (Konstan)</span>
      </span>
    );
  };

  const getPredicateBadge = (predicate: string) => {
    switch (predicate) {
      case 'Amat Baik':
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-extrabold bg-emerald-600 text-white shadow-xs">
            Predikat: Amat Baik (A)
          </span>
        );
      case 'Baik':
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-extrabold bg-blue-600 text-white shadow-xs">
            Predikat: Baik (B)
          </span>
        );
      case 'Cukup':
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-extrabold bg-amber-500 text-white shadow-xs">
            Predikat: Cukup (C)
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-extrabold bg-rose-600 text-white shadow-xs">
            Predikat: Perlu Bimbingan (D)
          </span>
        );
    }
  };

  const handleExportCSV = () => {
    if (!allOverviews || allOverviews.length === 0) return;
    const headers = [
      'NIP',
      'Nama Guru',
      'Satuan Pendidikan',
      'Mata Pelajaran',
      'Skor Saat Ini',
      'Skor Sebelumnya',
      'Selisih Poin',
      'Selisih %',
      'Tren Data',
      'Predikat Kinerja'
    ];

    const rows = allOverviews.map((o) => [
      `"${o.teacher.nip}"`,
      `"${o.teacher.name}"`,
      `"${o.teacher.schoolName}"`,
      `"${o.teacher.subject}"`,
      o.currentScore,
      o.previousScore,
      o.overallDelta,
      `${o.overallDeltaPercentage}%`,
      `"${o.overallTrend}"`,
      `"${o.currentPredicate}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rekap_tren_kinerja_guru_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-500 space-y-3">
        <RefreshCw className="w-8 h-8 mx-auto text-indigo-600 animate-spin" />
        <p className="text-sm font-semibold">Memuat data analisis tren kinerja guru...</p>
      </div>
    );
  }

  return (
    <div id="dashboard-kinerja-guru-view" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                Dashboard Kinerja & Tren Guru Per Periode
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Pemantauan progres hasil supervisi akademik, kelengkapan modul & perangkat pembelajaran tiap semester
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak Rapor Kinerja</span>
          </button>
          {currentRole !== 'GURU' && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor Data Tren (CSV)</span>
            </button>
          )}
        </div>
      </div>

      {/* Aggregate Overview Bar (for Admin / Pengawas / Kepala Sekolah) */}
      {currentRole !== 'GURU' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
            <span className="text-[10px] font-bold uppercase text-slate-400">Total Tenaga Pendidik</span>
            <div className="text-xl font-black text-slate-900 mt-1">{summaryStats.total} Guru</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Terdata aktif</p>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 shadow-xs">
            <span className="text-[10px] font-bold uppercase text-emerald-700">Tren Mengalami Peningkatan</span>
            <div className="text-xl font-black text-emerald-800 mt-1 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>{summaryStats.peningkat} Guru</span>
            </div>
            <p className="text-[10px] text-emerald-600 mt-0.5">
              {summaryStats.total > 0 ? Math.round((summaryStats.peningkat / summaryStats.total) * 100) : 0}% dari total guru
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 shadow-xs">
            <span className="text-[10px] font-bold uppercase text-slate-500">Tren Stabil / Tetap</span>
            <div className="text-xl font-black text-slate-800 mt-1 flex items-center gap-1.5">
              <Minus className="w-4 h-4 text-slate-500" />
              <span>{summaryStats.stabil} Guru</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Performa terjaga</p>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 shadow-xs">
            <span className="text-[10px] font-bold uppercase text-rose-700">Perlu Pembinaan (Menurun)</span>
            <div className="text-xl font-black text-rose-800 mt-1 flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-rose-600" />
              <span>{summaryStats.penurunan} Guru</span>
            </div>
            <p className="text-[10px] text-rose-600 mt-0.5">Prioritas pendampingan</p>
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 shadow-xs">
            <span className="text-[10px] font-bold uppercase text-indigo-700">Rata-Rata Nilai Kinerja</span>
            <div className="text-xl font-black text-indigo-900 mt-1">{summaryStats.avgScore} / 100</div>
            <p className="text-[10px] text-indigo-600 mt-0.5">Semester berjalan</p>
          </div>

          <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 shadow-xs">
            <span className="text-[10px] font-bold uppercase text-purple-700">Predikat Amat Baik (A)</span>
            <div className="text-xl font-black text-purple-900 mt-1">{summaryStats.amatBaik} Guru</div>
            <p className="text-[10px] text-purple-600 mt-0.5">Memenuhi standar tinggi</p>
          </div>
        </div>
      )}

      {/* Main Grid: Left Selector Sidebar & Right Deep Dive Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Teacher Selector (for Admin, Pengawas, KS) */}
        {currentRole !== 'GURU' && (
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-indigo-600" />
                  <span>Pilih Tenaga Pendidik</span>
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {filteredOverviews.length} Guru
                </span>
              </div>

              {/* Search bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari nama, NIP, mapel..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Filter Row */}
              <div className="grid grid-cols-2 gap-2">
                {currentRole === 'ADMIN_DINAS' && (
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Sekolah</label>
                    <select
                      value={selectedSchoolId}
                      onChange={(e) => setSelectedSchoolId(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                    >
                      <option value="ALL">Semua Sekolah</option>
                      {schools.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.level})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Status Tren</label>
                  <select
                    value={selectedTrendFilter}
                    onChange={(e) => setSelectedTrendFilter(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                  >
                    <option value="ALL">Semua Tren</option>
                    <option value="PENINGKATAN">↗️ Peningkatan</option>
                    <option value="STABIL">➡️ Stabil</option>
                    <option value="PENURUNAN">↘️ Penurunan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Predikat</label>
                  <select
                    value={selectedPredicateFilter}
                    onChange={(e) => setSelectedPredicateFilter(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                  >
                    <option value="ALL">Semua</option>
                    <option value="Amat Baik">Amat Baik</option>
                    <option value="Baik">Baik</option>
                    <option value="Cukup">Cukup</option>
                  </select>
                </div>
              </div>

              {/* Teachers List Scrollable */}
              <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto pr-1">
                {filteredOverviews.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Tidak ada data guru yang sesuai filter.
                  </div>
                ) : (
                  filteredOverviews.map((o) => {
                    const isSelected = selectedOverview?.teacher.id === o.teacher.id;
                    return (
                      <div
                        key={o.teacher.id}
                        onClick={() => setSelectedOverview(o)}
                        className={`p-3 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-indigo-50/80 border border-indigo-300 shadow-xs'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {o.teacher.name}
                            </p>
                            <p className="text-[10px] font-mono text-slate-500">
                              NIP: {o.teacher.nip}
                            </p>
                            <p className="text-[10px] text-slate-600 truncate mt-0.5">
                              {o.teacher.schoolName} • {o.teacher.subject}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-black text-slate-900 block">
                              {o.currentScore}
                            </span>
                            {o.overallTrend === 'PENINGKATAN' ? (
                              <span className="text-[10px] font-bold text-emerald-600 flex items-center justify-end gap-0.5">
                                <TrendingUp className="w-3 h-3" />
                                +{o.overallDelta}
                              </span>
                            ) : o.overallTrend === 'PENURUNAN' ? (
                              <span className="text-[10px] font-bold text-rose-600 flex items-center justify-end gap-0.5">
                                <TrendingDown className="w-3 h-3" />
                                {o.overallDelta}
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-400">
                                0.0
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* RIGHT COLUMN: Teacher Performance Dashboard & Multi-Period Trends */}
        <div className={`${currentRole === 'GURU' ? 'lg:col-span-12' : 'lg:col-span-8'} space-y-6`}>
          {selectedOverview ? (
            <>
              {/* Teacher Identity & Big Score Banner */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 pb-5 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-xs">
                      {selectedOverview.teacher.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900">
                          {selectedOverview.teacher.name}
                        </h2>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {selectedOverview.teacher.employmentStatus || 'PNS'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        NIP: {selectedOverview.teacher.nip}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-600">
                        <span className="flex items-center gap-1 font-medium">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {selectedOverview.teacher.schoolName}
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                          {selectedOverview.teacher.subject}
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          {selectedOverview.teacher.rankGrade}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 self-stretch md:self-auto">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Skor Komprehensif (Aktif)
                      </span>
                      <div className="text-2xl sm:text-3xl font-black text-indigo-700 mt-0.5">
                        {selectedOverview.currentScore}
                        <span className="text-xs font-semibold text-slate-400"> /100</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {getPredicateBadge(selectedOverview.currentPredicate)}
                      <div>
                        {getTrendBadge(
                          selectedOverview.overallTrend,
                          selectedOverview.overallDelta,
                          selectedOverview.overallDeltaPercentage
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick 4 Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Supervisi Akademik</span>
                      <CalendarCheck className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-xl font-bold text-slate-900 mt-1.5">
                      {activePeriodData?.supervisionScore || 0}
                      <span className="text-xs text-slate-400 font-normal"> /100</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">Observasi & refleksi kelas</p>
                    <div className="mt-2">
                      <ProgressBar value={activePeriodData?.supervisionScore || 0} showValue={false} size="sm" />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Perangkat Pembelajaran</span>
                      <BookOpen className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="text-xl font-bold text-slate-900 mt-1.5">
                      {activePeriodData?.perangkatScore || 0}
                      <span className="text-xs text-slate-400 font-normal"> /100</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">Modul ajar & 16 dokumen</p>
                    <div className="mt-2">
                      <ProgressBar value={activePeriodData?.perangkatScore || 0} showValue={false} size="sm" />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Pembelajaran Mendalam (PM)</span>
                      <Sparkles className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="text-xl font-bold text-slate-900 mt-1.5">
                      {activePeriodData?.deepLearningScore || 0}
                      <span className="text-xs text-slate-400 font-normal"> /100</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">Mindful, Meaningful, Joyful</p>
                    <div className="mt-2">
                      <ProgressBar value={activePeriodData?.deepLearningScore || 0} showValue={false} size="sm" />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Pola Pikir (Mindset)</span>
                      <BrainCircuit className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="text-xl font-bold text-slate-900 mt-1.5">
                      {activePeriodData?.mindsetScore || 0}
                      <span className="text-xs text-slate-400 font-normal"> /100</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">Pola Pikir Berkembang</p>
                    <div className="mt-2">
                      <ProgressBar value={activePeriodData?.mindsetScore || 0} showValue={false} size="sm" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual Multi-Period Trend Chart */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">
                      Grafik Tren Perkembangan Kinerja Antar Periode
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Visualisasi dinamika peningkatan/penurunan skor supervisi dan perangkat pembelajaran
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      5 Periode Terpantau
                    </span>
                  </div>
                </div>

                <div className="h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={selectedOverview.historyPeriods}
                      margin={{ top: 10, right: 20, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorOverall" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="periodLabel"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={{ stroke: '#cbd5e1' }}
                      />
                      <YAxis
                        domain={[60, 100]}
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={{ stroke: '#cbd5e1' }}
                      />
                      <Tooltip
                        formatter={(value: any, name: string) => [`${value} Poin`, name]}
                        labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Area
                        type="monotone"
                        dataKey="overallScore"
                        name="Nilai Komprehensif"
                        stroke="#4f46e5"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorOverall)"
                      />
                      <Line
                        type="monotone"
                        dataKey="supervisionScore"
                        name="Supervisi Akademik"
                        stroke="#10b981"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                      />
                      <Line
                        type="monotone"
                        dataKey="perangkatScore"
                        name="Perangkat Pembelajaran"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                      />
                      <Line
                        type="monotone"
                        dataKey="deepLearningScore"
                        name="Pembelajaran Mendalam"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Radar Chart & Aspect Matrix */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Competency Dimensions Radar */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
                  <div className="pb-3 border-b border-slate-100">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Radar 6 Dimensi Kompetensi Guru
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Perbandingan capaian guru vs target standar dinas (90-95)
                    </p>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart
                        cx="50%"
                        cy="50%"
                        outerRadius="75%"
                        data={selectedOverview.competencyRadar}
                      >
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10, fill: '#475569' }} />
                        <PolarRadiusAxis angle={30} domain={[60, 100]} stroke="#cbd5e1" tick={{ fontSize: 9 }} />
                        <Radar
                          name="Capaian Guru"
                          dataKey="score"
                          stroke="#4f46e5"
                          fill="#4f46e5"
                          fillOpacity={0.4}
                        />
                        <Radar
                          name="Target Standar"
                          dataKey="target"
                          stroke="#10b981"
                          fill="#10b981"
                          fillOpacity={0.15}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Right: Dimension Rubric Scores for selected period */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Rincian Aspek Periode Terpilih
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Pilih semester untuk melihat rincian asesmen
                      </p>
                    </div>
                    <select
                      value={selectedPeriodId}
                      onChange={(e) => setSelectedPeriodId(e.target.value)}
                      className="px-2.5 py-1 text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                    >
                      {selectedOverview.historyPeriods.map((p) => (
                        <option key={p.periodId} value={p.periodId}>
                          {p.periodLabel}
                        </option>
                      ))}
                    </select>
                  </div>

                  {activePeriodData && (
                    <div className="space-y-3 text-xs">
                      <div>
                        <div className="flex justify-between font-bold text-slate-700 mb-1">
                          <span>Perencanaan Modul & ATP</span>
                          <span className="text-indigo-600">{activePeriodData.perangkatAspects.modulAjar}%</span>
                        </div>
                        <ProgressBar value={activePeriodData.perangkatAspects.modulAjar} showValue={false} size="sm" />
                      </div>

                      <div>
                        <div className="flex justify-between font-bold text-slate-700 mb-1">
                          <span>Observasi & Pelaksanaan Kelas</span>
                          <span className="text-emerald-600">{activePeriodData.supervisionAspects.pelaksanaan}%</span>
                        </div>
                        <ProgressBar value={activePeriodData.supervisionAspects.pelaksanaan} showValue={false} size="sm" />
                      </div>

                      <div>
                        <div className="flex justify-between font-bold text-slate-700 mb-1">
                          <span>Pembelajaran Mendalam (Deep Learning)</span>
                          <span className="text-amber-600">{activePeriodData.deepLearningScore}%</span>
                        </div>
                        <ProgressBar value={activePeriodData.deepLearningScore} showValue={false} size="sm" />
                      </div>

                      <div>
                        <div className="flex justify-between font-bold text-slate-700 mb-1">
                          <span>Asesmen & Evaluasi Berkelanjutan</span>
                          <span className="text-blue-600">{activePeriodData.supervisionAspects.asesmen}%</span>
                        </div>
                        <ProgressBar value={activePeriodData.supervisionAspects.asesmen} showValue={false} size="sm" />
                      </div>

                      <div>
                        <div className="flex justify-between font-bold text-slate-700 mb-1">
                          <span>Kelengkapan Dokumen Administrasi (16 Berkas)</span>
                          <span className="text-purple-600">{activePeriodData.perangkatAspects.dokumenAdministrasi}%</span>
                        </div>
                        <ProgressBar value={activePeriodData.perangkatAspects.dokumenAdministrasi} showValue={false} size="sm" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Historical Comparison Table */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">
                      Riwayat & Komparasi Antar Periode Pelaksanaan
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Catatan berkala nilai supervisi akademik dan modul pembelajaran
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-3">Periode / Semester</th>
                        <th className="px-3 py-3 text-center">Supervisi</th>
                        <th className="px-3 py-3 text-center">Perangkat</th>
                        <th className="px-3 py-3 text-center">Deep Learning</th>
                        <th className="px-3 py-3 text-center">Nilai Akhir</th>
                        <th className="px-3 py-3">Predikat</th>
                        <th className="px-3 py-3">Tren & Delta</th>
                        <th className="px-3 py-3">Evaluator</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedOverview.historyPeriods.map((period) => (
                        <tr
                          key={period.periodId}
                          onClick={() => setSelectedPeriodId(period.periodId)}
                          className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                            selectedPeriodId === period.periodId ? 'bg-indigo-50/40 font-semibold' : ''
                          }`}
                        >
                          <td className="px-3 py-3.5">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{period.periodLabel}</span>
                              {period.isCurrentPeriod && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold">
                                  Aktif
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-normal">
                              Tgl: {period.evaluatedDate}
                            </div>
                          </td>
                          <td className="px-3 py-3.5 text-center font-mono font-bold text-emerald-700">
                            {period.supervisionScore}
                          </td>
                          <td className="px-3 py-3.5 text-center font-mono font-bold text-blue-700">
                            {period.perangkatScore}
                          </td>
                          <td className="px-3 py-3.5 text-center font-mono font-bold text-amber-700">
                            {period.deepLearningScore}
                          </td>
                          <td className="px-3 py-3.5 text-center">
                            <span className="text-xs font-black text-indigo-700 font-mono">
                              {period.overallScore}
                            </span>
                          </td>
                          <td className="px-3 py-3.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                period.predicate === 'Amat Baik'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : period.predicate === 'Baik'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {period.predicate}
                            </span>
                          </td>
                          <td className="px-3 py-3.5">
                            {getTrendBadge(period.trend, period.deltaScore, period.deltaPercentage)}
                          </td>
                          <td className="px-3 py-3.5">
                            <div className="font-medium text-slate-800 text-[11px]">{period.evaluatorName}</div>
                            <div className="text-[10px] text-slate-400">{period.evaluatorRole}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pembinaan & Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Kekuatan Utama Tenaga Pendidik</span>
                  </h3>
                  <ul className="space-y-2 text-xs text-slate-600">
                    {selectedOverview.strengthHighlights.map((st, i) => (
                      <li key={i} className="flex items-start gap-2 p-2 rounded-lg bg-emerald-50/60 border border-emerald-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                        <span className="leading-relaxed">{st}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>Rekomendasi Tindak Lanjut Pembinaan</span>
                  </h3>
                  <ul className="space-y-2 text-xs text-slate-600">
                    {selectedOverview.summaryRecommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 p-2 rounded-lg bg-indigo-50/60 border border-indigo-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                        <span className="leading-relaxed">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
              Silakan pilih tenaga pendidik di sisi kiri untuk melihat tren performa.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Cetak Rapor Tren Kinerja Guru */}
      <Modal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="Lembar Evaluasi & Rekapitulasi Tren Kinerja Guru"
        maxWidth="3xl"
      >
        {selectedOverview && (
          <div className="space-y-6 print:m-0 text-slate-800">
            {/* Official Letterhead (Kop Surat Dinas) */}
            <div className="text-center pb-4 border-b-2 border-slate-800 space-y-1">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Pemerintah Kabupaten Magetan • Dinas Pendidikan
              </p>
              <h2 className="text-base font-black uppercase text-slate-900">
                Lembar Hasil Pemantauan & Tren Kinerja Guru
              </h2>
              <p className="text-xs text-slate-600">
                Sistem Informasi Terpadu Supervisi Akademik & Perangkat Pembelajaran
              </p>
            </div>

            {/* Biodata Table */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-500 block">Nama Tenaga Pendidik:</span>
                <span className="font-bold text-slate-900 text-sm">{selectedOverview.teacher.name}</span>
              </div>
              <div>
                <span className="text-slate-500 block">NIP (Nomor Induk Pegawai):</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{selectedOverview.teacher.nip}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Satuan Pendidikan:</span>
                <span className="font-bold text-slate-800">{selectedOverview.teacher.schoolName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Mata Pelajaran / Tugas:</span>
                <span className="font-bold text-slate-800">{selectedOverview.teacher.subject}</span>
              </div>
            </div>

            {/* Score Summary Box */}
            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-indigo-900 block">
                  Capaian Akhir Semester Berjalan (2026/2027 Ganjil):
                </span>
                <span className="text-xs text-indigo-700">
                  Tren Perkembangan: <strong className="font-extrabold">{selectedOverview.overallTrend}</strong> ({selectedOverview.overallDelta > 0 ? `+${selectedOverview.overallDelta}` : selectedOverview.overallDelta} poin / {selectedOverview.overallDeltaPercentage}%)
                </span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-indigo-900">
                  {selectedOverview.currentScore} / 100
                </div>
                <span className="text-xs font-extrabold text-indigo-800 bg-white px-2 py-0.5 rounded border border-indigo-300">
                  Predikat: {selectedOverview.currentPredicate}
                </span>
              </div>
            </div>

            {/* Table of Periods */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Rekapitulasi Perkembangan 5 Periode Terakhir:
              </h4>
              <table className="w-full text-xs text-left border border-slate-200">
                <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-2 border-r border-b border-slate-200">Periode</th>
                    <th className="p-2 border-r border-b border-slate-200 text-center">Supervisi</th>
                    <th className="p-2 border-r border-b border-slate-200 text-center">Perangkat</th>
                    <th className="p-2 border-r border-b border-slate-200 text-center">Deep Learning</th>
                    <th className="p-2 border-r border-b border-slate-200 text-center">Nilai Akhir</th>
                    <th className="p-2 border-r border-b border-slate-200">Predikat</th>
                    <th className="p-2 border-b border-slate-200">Tren</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {selectedOverview.historyPeriods.map((p) => (
                    <tr key={p.periodId}>
                      <td className="p-2 border-r border-slate-200 font-semibold">{p.periodLabel}</td>
                      <td className="p-2 border-r border-slate-200 text-center font-mono">{p.supervisionScore}</td>
                      <td className="p-2 border-r border-slate-200 text-center font-mono">{p.perangkatScore}</td>
                      <td className="p-2 border-r border-slate-200 text-center font-mono">{p.deepLearningScore}</td>
                      <td className="p-2 border-r border-slate-200 text-center font-mono font-bold text-indigo-700">
                        {p.overallScore}
                      </td>
                      <td className="p-2 border-r border-slate-200">{p.predicate}</td>
                      <td className="p-2 font-semibold text-[11px]">{p.trend}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Signature Section */}
            <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 text-xs">
              <div className="text-center">
                <p className="text-slate-500">Mengetahui,</p>
                <p className="font-bold text-slate-800">Kepala Satuan Pendidikan</p>
                <div className="h-16" />
                <p className="font-bold text-slate-900 underline">Drs. H. Sukamto, M.Pd.</p>
                <p className="text-[10px] text-slate-500 font-mono">NIP: 196803121992031004</p>
              </div>

              <div className="text-center">
                <p className="text-slate-500">Magetan, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p className="font-bold text-slate-800">Pengawas Sekolah Pembina</p>
                <div className="h-16" />
                <p className="font-bold text-slate-900 underline">Drs. Bambang Hidayat, M.Pd.</p>
                <p className="text-[10px] text-slate-500 font-mono">NIP: 197008151995031002</p>
              </div>
            </div>

            {/* Print Action Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 print:hidden">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Lembar Dokumen</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
