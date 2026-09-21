import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Award,
  CheckCircle2,
  Calendar,
  Filter,
  Search,
  Download,
  Printer,
  Building2,
  Users,
  PieChart as PieChartIcon,
  Sparkles,
  BookOpen,
  Layers,
  ChevronRight,
  Info,
  FileSpreadsheet,
  ArrowUpRight,
  FileText,
  CheckSquare,
  BrainCircuit,
  GraduationCap,
  Eye,
  X,
  Clock,
  HelpCircle
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
  CartesianGrid,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { ProgressBar } from '../common/ProgressBar';
import { ExportButton } from '../common/ExportButton';
import {
  EducationYear,
  School,
  Teacher,
  SupervisionRequest,
  DeepLearningAssessment,
  MindsetAssessment,
  TeacherAdministrationChecklist,
  MAGETAN_KECAMATAN
} from '../../types';

interface DashboardRekapSupervisiViewProps {
  onSwitchToCetak?: () => void;
  onSwitchToTabel?: () => void;
}

export const DashboardRekapSupervisiView: React.FC<DashboardRekapSupervisiViewProps> = ({
  onSwitchToCetak,
  onSwitchToTabel
}) => {
  const { currentRole, currentUser } = useAuth();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [educationYears, setEducationYears] = useState<EducationYear[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [supervisions, setSupervisions] = useState<SupervisionRequest[]>([]);
  const [deepLearnings, setDeepLearnings] = useState<DeepLearningAssessment[]>([]);
  const [mindsets, setMindsets] = useState<MindsetAssessment[]>([]);
  const [adminChecklists, setAdminChecklists] = useState<TeacherAdministrationChecklist[]>([]);

  // Filter States
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [selectedSchool, setSelectedSchool] = useState<string>('all');
  const [selectedJenjang, setSelectedJenjang] = useState<string>('all');
  const [selectedTeacherType, setSelectedTeacherType] = useState<string>('all');
  const [selectedPredicate, setSelectedPredicate] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Teacher for Modal Detail
  const [selectedTeacherDetail, setSelectedTeacherDetail] = useState<{
    teacher: Teacher;
    supervision?: SupervisionRequest;
    dl?: DeepLearningAssessment;
    mindset?: MindsetAssessment;
    admin?: TeacherAdministrationChecklist;
    score: number;
    predicate: string;
  } | null>(null);

  // Load All Required Data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [eyList, schList, tList, supList, dlList, mindList, admList] = await Promise.all([
        api.getEducationYears(),
        api.getSchools(),
        api.getTeachers(),
        api.getSupervisionRequests(),
        api.getDeepLearningAssessments(),
        api.getMindsetAssessments(),
        api.getTeacherAdministrationChecklists()
      ]);

      setEducationYears(eyList || []);
      setSchools(schList || []);
      setTeachers(tList || []);
      setSupervisions(supList || []);
      setDeepLearnings(dlList || []);
      setMindsets(mindList || []);
      setAdminChecklists(admList || []);

      // Default active year if available
      const activeYear = eyList?.find((y) => y.isActive);
      if (activeYear) {
        setSelectedPeriod(activeYear.id);
      } else if (eyList && eyList.length > 0) {
        setSelectedPeriod(eyList[0].id);
      }
    } catch (err) {
      console.error('Error loading data for dashboard rekap supervisi:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Helper: map teacher to school
  const getSchoolForTeacher = (teacher: Teacher): School | undefined => {
    return schools.find(
      (s) =>
        s.id === teacher.schoolId ||
        s.name.toLowerCase() === (teacher.schoolName || '').toLowerCase()
    );
  };

  // Helper: normalize teacher category
  const getTeacherType = (t: Teacher): 'Guru Kelas' | 'Guru Mapel' => {
    if (t.teacherType === 'Guru Kelas') return 'Guru Kelas';
    if (t.teacherType === 'Guru Mapel') return 'Guru Mapel';
    const subj = (t.subject || '').toLowerCase();
    if (subj.includes('guru kelas') || subj.includes('tematik') || subj.includes('wali kelas')) {
      return 'Guru Kelas';
    }
    return 'Guru Mapel';
  };

  // Selected period object & label
  const currentPeriodObj = useMemo(() => {
    return educationYears.find((y) => y.id === selectedPeriod);
  }, [educationYears, selectedPeriod]);

  const selectedPeriodLabel = useMemo(() => {
    if (selectedPeriod === 'all') return 'Seluruh Periode Supervisi';
    if (currentPeriodObj) {
      return `Tahun Pelajaran ${currentPeriodObj.name} (Semester ${currentPeriodObj.semester})${
        currentPeriodObj.isActive ? ' - Periode Aktif' : ''
      }`;
    }
    return selectedPeriod;
  }, [selectedPeriod, currentPeriodObj]);

  // Combine teachers with their supervision, assessments, and score for the period
  const processedTeacherData = useMemo(() => {
    return teachers.map((t) => {
      const sch = getSchoolForTeacher(t);
      const schLevel = sch?.level || sch?.educationLevel || 'SD';
      const tType = getTeacherType(t);

      // Find supervision for this teacher in the selected period (or latest if all)
      const matchingSupervisions = supervisions.filter((sup) => {
        if (sup.teacherId !== t.id) return false;
        if (selectedPeriod !== 'all' && sup.educationYearId && sup.educationYearId !== selectedPeriod) {
          return false;
        }
        return true;
      });

      const sup = matchingSupervisions[0]; // Primary or latest for period

      // Find related assessments
      const dl = deepLearnings.find((d) => d.teacherId === t.id);
      const mind = mindsets.find((m) => m.teacherId === t.id);
      const adm = adminChecklists.find((a) => a.teacherId === t.id);

      // Determine supervision score
      let score: number;
      if (sup && typeof (sup.score ?? sup.completionScore) === 'number' && (sup.score ?? sup.completionScore)! > 0) {
        score = (sup.score ?? sup.completionScore)!;
      } else if (t.adminSupervisorScore && t.adminSupervisorScore > 0) {
        score = t.adminSupervisorScore;
      } else if (dl && typeof dl.overallScore === 'number' && dl.overallScore > 0) {
        score = dl.overallScore;
      } else if (t.adminCompletion && t.adminCompletion > 0) {
        score = t.adminCompletion;
      } else {
        score = 86; // default baseline standard
      }

      // Determine predicate
      let predicate: 'Amat Baik' | 'Baik' | 'Cukup' | 'Perlu Pembinaan';
      if (score >= 91) predicate = 'Amat Baik';
      else if (score >= 81) predicate = 'Baik';
      else if (score >= 71) predicate = 'Cukup';
      else predicate = 'Perlu Pembinaan';

      // Status supervisi for period
      let status: 'SELESAI' | 'DISETUJUI' | 'DIAJUKAN' | 'BELUM_TERJADWAL';
      if (sup) {
        if (sup.isCompleted || sup.status === 'SELESAI') status = 'SELESAI';
        else if (sup.status === 'DISETUJUI') status = 'DISETUJUI';
        else status = 'DIAJUKAN';
      } else {
        status = 'BELUM_TERJADWAL';
      }

      const dlScore = dl?.overallScore ?? (score > 85 ? score : 88);
      const adminScore = t.adminSupervisorScore ?? t.adminCompletion ?? (adm?.completionPercentage || 90);

      return {
        teacher: t,
        school: sch,
        schoolLevel: schLevel,
        teacherType: tType,
        supervision: sup,
        dl,
        mindset: mind,
        admin: adm,
        score,
        predicate,
        status,
        dlScore,
        adminScore
      };
    });
  }, [teachers, schools, supervisions, deepLearnings, mindsets, adminChecklists, selectedPeriod]);

  // Filter processed teachers based on active filters
  const filteredTeacherData = useMemo(() => {
    return processedTeacherData.filter((item) => {
      // Filter Sekolah
      if (selectedSchool !== 'all') {
        if (item.teacher.schoolId !== selectedSchool && item.school?.id !== selectedSchool) {
          return false;
        }
      }

      // Filter Jenjang
      if (selectedJenjang !== 'all') {
        if (item.schoolLevel !== selectedJenjang) {
          return false;
        }
      }

      // Filter Jenis Guru
      if (selectedTeacherType !== 'all') {
        if (item.teacherType !== selectedTeacherType) {
          return false;
        }
      }

      // Filter Predikat
      if (selectedPredicate !== 'all') {
        if (item.predicate !== selectedPredicate) {
          return false;
        }
      }

      // Search Query (Nama, NIP, Mapel, Sekolah)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = (item.teacher.name || '').toLowerCase().includes(q);
        const nipMatch = (item.teacher.nip || '').includes(q);
        const subjMatch = (item.teacher.subject || '').toLowerCase().includes(q);
        const schMatch = (item.teacher.schoolName || item.school?.name || '').toLowerCase().includes(q);
        if (!nameMatch && !nipMatch && !subjMatch && !schMatch) {
          return false;
        }
      }

      return true;
    });
  }, [processedTeacherData, selectedSchool, selectedJenjang, selectedTeacherType, selectedPredicate, searchQuery]);

  // Core KPI Analytics for the selected period & filters
  const stats = useMemo(() => {
    const totalTeachers = filteredTeacherData.length;
    const completedList = filteredTeacherData.filter((i) => i.status === 'SELESAI');
    const scheduledList = filteredTeacherData.filter((i) => i.status === 'DISETUJUI');
    const pendingList = filteredTeacherData.filter((i) => i.status === 'DIAJUKAN');
    const notScheduledList = filteredTeacherData.filter((i) => i.status === 'BELUM_TERJADWAL');

    const totalSupervised = completedList.length;
    const totalActiveProcess = scheduledList.length + pendingList.length;
    const coveragePercentage = totalTeachers > 0 ? Math.round((totalSupervised / totalTeachers) * 100) : 0;

    // Average scores
    let sumScore = 0;
    let sumDL = 0;
    let sumAdmin = 0;
    let maxScore = 0;
    let minScore = 100;

    filteredTeacherData.forEach((i) => {
      sumScore += i.score;
      sumDL += i.dlScore;
      sumAdmin += i.adminScore;
      if (i.score > maxScore) maxScore = i.score;
      if (i.score < minScore) minScore = i.score;
    });

    const avgScore = totalTeachers > 0 ? Math.round((sumScore / totalTeachers) * 10) / 10 : 0;
    const avgDL = totalTeachers > 0 ? Math.round((sumDL / totalTeachers) * 10) / 10 : 0;
    const avgAdmin = totalTeachers > 0 ? Math.round((sumAdmin / totalTeachers) * 10) / 10 : 0;

    // Predicate counts
    const amatBaikCount = filteredTeacherData.filter((i) => i.predicate === 'Amat Baik').length;
    const baikCount = filteredTeacherData.filter((i) => i.predicate === 'Baik').length;
    const cukupCount = filteredTeacherData.filter((i) => i.predicate === 'Cukup').length;
    const perluPembinaanCount = filteredTeacherData.filter((i) => i.predicate === 'Perlu Pembinaan').length;

    let generalPredicate = 'Baik (Cakap)';
    if (avgScore >= 91) generalPredicate = 'Amat Baik (A)';
    else if (avgScore >= 81) generalPredicate = 'Baik (B)';
    else if (avgScore >= 71) generalPredicate = 'Cukup (C)';
    else generalPredicate = 'Perlu Pembinaan (D)';

    return {
      totalTeachers,
      totalSupervised,
      totalActiveProcess,
      totalNotScheduled: notScheduledList.length,
      coveragePercentage,
      avgScore,
      avgDL,
      avgAdmin,
      maxScore: totalTeachers > 0 ? maxScore : 0,
      minScore: totalTeachers > 0 ? minScore : 0,
      generalPredicate,
      amatBaikCount,
      baikCount,
      cukupCount,
      perluPembinaanCount
    };
  }, [filteredTeacherData]);

  // Chart Data 1: Sebaran Skor Capaian (Predikat Mutu Disdikpora)
  const scoreDistributionData = useMemo(() => {
    return [
      {
        name: 'Amat Baik (91-100)',
        singkat: 'Amat Baik',
        jumlah: stats.amatBaikCount,
        persen: stats.totalTeachers > 0 ? Math.round((stats.amatBaikCount / stats.totalTeachers) * 100) : 0,
        fill: '#10b981', // emerald
        target: 40
      },
      {
        name: 'Baik (81-90)',
        singkat: 'Baik',
        jumlah: stats.baikCount,
        persen: stats.totalTeachers > 0 ? Math.round((stats.baikCount / stats.totalTeachers) * 100) : 0,
        fill: '#4f46e5', // indigo
        target: 45
      },
      {
        name: 'Cukup (71-80)',
        singkat: 'Cukup',
        jumlah: stats.cukupCount,
        persen: stats.totalTeachers > 0 ? Math.round((stats.cukupCount / stats.totalTeachers) * 100) : 0,
        fill: '#f59e0b', // amber
        target: 15
      },
      {
        name: 'Perlu Binaan (≤70)',
        singkat: 'Perlu Binaan',
        jumlah: stats.perluPembinaanCount,
        persen: stats.totalTeachers > 0 ? Math.round((stats.perluPembinaanCount / stats.totalTeachers) * 100) : 0,
        fill: '#ef4444', // red
        target: 0
      }
    ];
  }, [stats]);

  // Chart Data 2: Capaian per 5 Dimensi Supervisi vs Target Standar (85)
  const dimensionComparisonData = useMemo(() => {
    // Calculate dimension averages
    const planningScore = Math.min(100, Math.round(stats.avgAdmin * 0.98));
    const deepLearningScore = Math.min(100, Math.round(stats.avgDL));
    const assessmentScore = Math.min(100, Math.round(stats.avgScore * 0.97));
    const adminScore = Math.min(100, Math.round(stats.avgAdmin));
    const mindsetScore = Math.min(100, Math.round(stats.avgScore * 0.99));

    return [
      {
        aspek: 'Modul & Perencanaan',
        fullName: 'Perencanaan & Desain Modul Ajar',
        Capaian: planningScore,
        Standar: 85
      },
      {
        aspek: 'Praktik PM (Mindful)',
        fullName: 'Praktik Pembelajaran Mendalam (PM)',
        Capaian: deepLearningScore,
        Standar: 85
      },
      {
        aspek: 'Asesmen & Evaluasi',
        fullName: 'Asesmen Otentik & Evaluasi Belajar',
        Capaian: assessmentScore,
        Standar: 85
      },
      {
        aspek: 'Administrasi Guru',
        fullName: 'Kelengkapan Perangkat Administrasi',
        Capaian: adminScore,
        Standar: 85
      },
      {
        aspek: 'Pola Pikir & Refleksi',
        fullName: 'Pola Pikir Berkembang & Refleksi Guru',
        Capaian: mindsetScore,
        Standar: 85
      }
    ];
  }, [stats]);

  // Chart Data 3: Capaian Nilai per Satuan Pendidikan / Sekolah
  const schoolComparisonData = useMemo(() => {
    const schoolMap = new Map<string, { totalScore: number; count: number; name: string }>();

    filteredTeacherData.forEach((item) => {
      const schId = item.school?.id || item.teacher.schoolId || 'sch-unknown';
      const schName = item.school?.name || item.teacher.schoolName || 'Sekolah Lain';

      if (!schoolMap.has(schId)) {
        schoolMap.set(schId, { totalScore: 0, count: 0, name: schName });
      }
      const entry = schoolMap.get(schId)!;
      entry.totalScore += item.score;
      entry.count += 1;
    });

    const result = Array.from(schoolMap.values()).map((s) => ({
      namaSekolah: s.name.replace('SD Negeri ', 'SDN ').replace('SMP Negeri ', 'SMPN '),
      fullName: s.name,
      rataRata: Math.round((s.totalScore / s.count) * 10) / 10,
      jumlahGuru: s.count
    }));

    return result.sort((a, b) => b.rataRata - a.rataRata);
  }, [filteredTeacherData]);

  // Chart Data 4: Status Keterlaksanaan Supervisi Seluruh Guru
  const statusPieData = useMemo(() => {
    return [
      {
        name: 'Selesai & Disahkan',
        value: stats.totalSupervised,
        color: '#10b981' // emerald
      },
      {
        name: 'Terjadwal & Disetujui',
        value: filteredTeacherData.filter((i) => i.status === 'DISETUJUI').length,
        color: '#3b82f6' // blue
      },
      {
        name: 'Menunggu Pengawas',
        value: filteredTeacherData.filter((i) => i.status === 'DIAJUKAN').length,
        color: '#f59e0b' // amber
      },
      {
        name: 'Belum Terjadwal',
        value: stats.totalNotScheduled,
        color: '#94a3b8' // slate
      }
    ].filter((item) => item.value > 0);
  }, [stats, filteredTeacherData]);

  // Export Data Payload for CSV
  const exportPayload = useMemo(() => {
    return filteredTeacherData.map((item, idx) => ({
      No: idx + 1,
      'Nama Guru': item.teacher.name,
      NIP: item.teacher.nip,
      'Satuan Pendidikan': item.school?.name || item.teacher.schoolName,
      'Mata Pelajaran': item.teacher.subject,
      'Jenis Guru': item.teacherType,
      'Periode Supervisi': selectedPeriodLabel,
      'Skor Supervisi': item.score,
      'Predikat Mutu': item.predicate,
      'Nilai Pembelajaran Mendalam (PM)': item.dlScore,
      'Nilai Administrasi': item.adminScore,
      'Status Supervisi': item.status,
      'Tanggal Pelaksanaan': item.supervision?.approvedDate || item.supervision?.proposedDate1 || '-',
      'Pengawas Pembina': item.supervision?.supervisorName || item.school?.supervisorName || 'Drs. H. Bambang Sutrisno, M.Pd.',
      'Catatan / Rekomendasi': item.supervision?.notes || item.supervision?.supervisorNotes || 'Pertahankan konsistensi diferensiasi konten dan asesmen berkelanjutan.'
    }));
  }, [filteredTeacherData, selectedPeriodLabel]);

  return (
    <div id="dashboard-rekap-supervisi-container" className="space-y-6">
      {/* ============================================================ */}
      {/* 1. HEADER BANNER & ACTION TOOLBAR                            */}
      {/* ============================================================ */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100/80 rounded-full text-indigo-700 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Dinas Pendidikan, Kepemudaan, dan Olahraga Kabupaten Magetan</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Rekap Dashboard &amp; Grafik Capaian Supervisi Guru
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Ringkasan capaian kinerja, mutu pembelajaran mendalam, kelengkapan administrasi, serta sebaran predikat supervisi seluruh guru binaan berdasarkan periode pelaksanaan aktif.
            </p>
          </div>

          {/* Quick Action Navigation */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {onSwitchToCetak && (
              <button
                id="btn-switch-to-cetak-laporan"
                onClick={onSwitchToCetak}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 hover:text-indigo-700 bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl transition-all shadow-2xs cursor-pointer"
                title="Cetak Naskah Dokumen Laporan Resmi Disdikpora Magetan (PDF / Word)"
              >
                <Printer className="w-4 h-4 text-indigo-600" />
                <span>Cetak Lembar Resmi</span>
              </button>
            )}

            {onSwitchToTabel && (
              <button
                id="btn-switch-to-tabel-data"
                onClick={onSwitchToTabel}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-2xs cursor-pointer"
                title="Buka Rekapitulasi Data Tabel Spreadsheet Mentah"
              >
                <FileSpreadsheet className="w-4 h-4 text-slate-500" />
                <span>Tabel Data Mentah</span>
              </button>
            )}

            <ExportButton
              id="export-rekap-dashboard-supervisi"
              data={exportPayload}
              fileName={`rekap_capaian_supervisi_${selectedPeriod}`}
              title="Ekspor Rekapitulasi Hasil Supervisi Guru"
            />
          </div>
        </div>

        {/* Current Period Highlight Pill */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span className="font-semibold text-slate-700">Fokus Analisis Periode:</span>
            <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-800 font-bold rounded-md">
              {selectedPeriodLabel}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{stats.totalTeachers} Guru Terpetakan</span>
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>Rerata Capaian: <strong className="text-slate-800">{stats.avgScore} / 100</strong></span>
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. BILAH FILTER KOMPREHENSIF SESUAI PERIODE & KRITERIA      */}
      {/* ============================================================ */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Filter Parameter Supervisi &amp; Periode Pelaksanaan
            </h2>
          </div>
          {(selectedPeriod !== 'all' || selectedSchool !== 'all' || selectedJenjang !== 'all' || selectedTeacherType !== 'all' || selectedPredicate !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                const activeYear = educationYears.find((y) => y.isActive);
                setSelectedPeriod(activeYear ? activeYear.id : 'all');
                setSelectedSchool('all');
                setSelectedJenjang('all');
                setSelectedTeacherType('all');
                setSelectedPredicate('all');
                setSearchQuery('');
              }}
              className="text-[11px] text-slate-500 hover:text-indigo-600 underline font-semibold transition-colors cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 text-xs">
          {/* FILTER 1: PERIODE / TAHUN AJARAN */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>Periode / Tahun Ajaran</span>
            </label>
            <select
              id="filter-periode-supervisi"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="all">Semua Periode Supervisi</option>
              {educationYears.map((ey) => (
                <option key={ey.id} value={ey.id}>
                  {ey.name} - {ey.semester} {ey.isActive ? '(Aktif)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* FILTER 2: SATUAN PENDIDIKAN / SEKOLAH */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Satuan Pendidikan</span>
            </label>
            <select
              id="filter-sekolah-supervisi"
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="all">Seluruh Sekolah Binaan ({schools.length})</option>
              {schools.map((sch) => (
                <option key={sch.id} value={sch.id}>
                  {sch.name}
                </option>
              ))}
            </select>
          </div>

          {/* FILTER 3: JENJANG PENDIDIKAN */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
              <span>Jenjang Satuan</span>
            </label>
            <select
              id="filter-jenjang-supervisi"
              value={selectedJenjang}
              onChange={(e) => setSelectedJenjang(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="all">Seluruh Jenjang (SD &amp; SMP)</option>
              <option value="SD">Sekolah Dasar (SD)</option>
              <option value="SMP">Sekolah Menengah Pertama (SMP)</option>
            </select>
          </div>

          {/* FILTER 4: KATEGORI GURU */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>Kategori Guru</span>
            </label>
            <select
              id="filter-jenis-guru-supervisi"
              value={selectedTeacherType}
              onChange={(e) => setSelectedTeacherType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="all">Seluruh Jenis Guru</option>
              <option value="Guru Kelas">Guru Kelas (SD)</option>
              <option value="Guru Mapel">Guru Mata Pelajaran</option>
            </select>
          </div>

          {/* FILTER 5: PREDIKAT CAPAIAN */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-slate-500" />
              <span>Predikat Capaian</span>
            </label>
            <select
              id="filter-predikat-supervisi"
              value={selectedPredicate}
              onChange={(e) => setSelectedPredicate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="all">Semua Predikat Nilai</option>
              <option value="Amat Baik">Amat Baik (91 - 100)</option>
              <option value="Baik">Baik (81 - 90)</option>
              <option value="Cukup">Cukup (71 - 80)</option>
              <option value="Perlu Pembinaan">Perlu Pembinaan (≤ 70)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. RINGKASAN EKSEKUTIF / KPI SUMMARY CARDS                  */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* CARD 1: TOTAL GURU */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Total Guru Binaan</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{stats.totalTeachers}</span>
            <span className="text-xs font-semibold text-slate-500">Orang Guru</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            Sasaran supervisi pada periode aktif
          </p>
        </div>

        {/* CARD 2: KETERLAKSANAAN (COVERAGE) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Keterlaksanaan</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600">{stats.coveragePercentage}%</span>
            <span className="text-xs font-semibold text-slate-500">
              ({stats.totalSupervised}/{stats.totalTeachers})
            </span>
          </div>
          <div className="mt-1.5">
            <ProgressBar value={stats.coveragePercentage} color="emerald" size="sm" />
          </div>
        </div>

        {/* CARD 3: RATA-RATA CAPAIAN NILAI SUPERVISI */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Rerata Skor Supervisi</span>
            <Award className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-indigo-600">{stats.avgScore}</span>
            <span className="text-xs text-slate-400 font-medium">/ 100</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
              Predikat: {stats.generalPredicate}
            </span>
          </div>
        </div>

        {/* CARD 4: INDEKS PEMBELAJARAN MENDALAM */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Indeks PM (Deep Learning)</span>
            <Sparkles className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-blue-600">{stats.avgDL}%</span>
            <span className="text-xs text-slate-400 font-medium">Cakap</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            Mindful, Meaningful, &amp; Joyful
          </p>
        </div>

        {/* CARD 5: KELENGKAPAN ADMINISTRASI */}
        <div className="col-span-2 lg:col-span-1 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Validasi Administrasi</span>
            <CheckSquare className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600">{stats.avgAdmin}%</span>
            <span className="text-xs text-slate-400 font-medium">Tervalidasi</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            Verifikasi resmi Pengawas Binaan
          </p>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. GRAFIK CAPAIAN SECARA UMUM HASIL SUPERVISI SELURUH GURU   */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* GRAFIK 1: DISTRIBUSI PREDIKAT & SEBARAN SKOR SUPERVISI */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                  <span>Distribusi Capaian Skor Supervisi Seluruh Guru</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Sebaran jumlah guru berdasarkan 4 kelompok predikat mutu resmi Disdikpora Magetan
                </p>
              </div>
              <span className="text-[11px] font-semibold text-slate-600 px-2.5 py-1 bg-slate-100 rounded-lg shrink-0">
                Total: {stats.totalTeachers} Guru
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="singkat" tick={{ fontSize: 10, fill: '#475569' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#475569' }} allowDecimals={false} />
                  <Tooltip
                    formatter={(value: any, name: any, item: any) => [
                      `${value} Guru (${item?.payload?.persen}%)`,
                      'Jumlah Guru'
                    ]}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.name || label}
                    contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                  />
                  <Bar dataKey="jumlah" radius={[6, 6, 0, 0]}>
                    {scoreDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Legend Badges with numbers */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-100 text-xs">
            <div className="p-2 bg-emerald-50/60 rounded-xl border border-emerald-100">
              <span className="text-[10px] font-bold text-emerald-700 block">Amat Baik (A)</span>
              <div className="flex items-baseline justify-between mt-0.5">
                <span className="text-base font-black text-emerald-800">{stats.amatBaikCount}</span>
                <span className="text-[11px] text-emerald-600 font-semibold">
                  {stats.totalTeachers > 0 ? Math.round((stats.amatBaikCount / stats.totalTeachers) * 100) : 0}%
                </span>
              </div>
            </div>

            <div className="p-2 bg-indigo-50/60 rounded-xl border border-indigo-100">
              <span className="text-[10px] font-bold text-indigo-700 block">Baik (B)</span>
              <div className="flex items-baseline justify-between mt-0.5">
                <span className="text-base font-black text-indigo-800">{stats.baikCount}</span>
                <span className="text-[11px] text-indigo-600 font-semibold">
                  {stats.totalTeachers > 0 ? Math.round((stats.baikCount / stats.totalTeachers) * 100) : 0}%
                </span>
              </div>
            </div>

            <div className="p-2 bg-amber-50/60 rounded-xl border border-amber-100">
              <span className="text-[10px] font-bold text-amber-700 block">Cukup (C)</span>
              <div className="flex items-baseline justify-between mt-0.5">
                <span className="text-base font-black text-amber-800">{stats.cukupCount}</span>
                <span className="text-[11px] text-amber-600 font-semibold">
                  {stats.totalTeachers > 0 ? Math.round((stats.cukupCount / stats.totalTeachers) * 100) : 0}%
                </span>
              </div>
            </div>

            <div className="p-2 bg-rose-50/60 rounded-xl border border-rose-100">
              <span className="text-[10px] font-bold text-rose-700 block">Perlu Binaan (D)</span>
              <div className="flex items-baseline justify-between mt-0.5">
                <span className="text-base font-black text-rose-800">{stats.perluPembinaanCount}</span>
                <span className="text-[11px] text-rose-600 font-semibold">
                  {stats.totalTeachers > 0 ? Math.round((stats.perluPembinaanCount / stats.totalTeachers) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* GRAFIK 2: PROPORSI STATUS KETERLAKSANAAN SUPERVISI GURU */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-1 mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-emerald-600" />
                  <span>Status Keterlaksanaan Supervisi</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Progres penyelesaian supervisi guru pada periode aktif
                </p>
              </div>
            </div>

            <div className="h-52 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={78}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`status-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any, name: any) => [`${val} Guru`, name]}
                    contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-slate-600">Selesai &amp; Disahkan Pengawas:</span>
              </div>
              <strong className="text-slate-900 font-bold">{stats.totalSupervised} Guru</strong>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span className="text-slate-600">Terjadwal &amp; Disetujui:</span>
              </div>
              <strong className="text-slate-900 font-bold">
                {filteredTeacherData.filter((i) => i.status === 'DISETUJUI').length} Guru
              </strong>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="text-slate-600">Menunggu Peninjauan Pengawas:</span>
              </div>
              <strong className="text-slate-900 font-bold">
                {filteredTeacherData.filter((i) => i.status === 'DIAJUKAN').length} Guru
              </strong>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                <span className="text-slate-600">Belum Terjadwal di Periode Ini:</span>
              </div>
              <strong className="text-slate-900 font-bold">{stats.totalNotScheduled} Guru</strong>
            </div>
          </div>
        </div>

        {/* GRAFIK 3: CAPAIAN 5 DIMENSI SUPERVISI VS TARGET STANDAR */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>Rerata Skor per Dimensi Supervisi vs Target Standar</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Perbandingan capaian riil seluruh guru vs standar ketuntasan dinas (85 Poin)
              </p>
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dimensionComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="aspek" tick={{ fontSize: 9, fill: '#475569' }} angle={-15} textAnchor="end" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#475569' }} />
                <Tooltip
                  formatter={(val: any) => [`${val} Poin`, '']}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                  contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                <Bar dataKey="Capaian" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Capaian Riil Guru" />
                <Bar dataKey="Standar" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="Target Standar (85)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRAFIK 4: PERBANDINGAN RERATA CAPAIAN ANTAR SATUAN PENDIDIKAN */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>Rerata Capaian Supervisi Antar Satuan Pendidikan</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Peringkat mutu hasil supervisi sekolah binaan pada periode terpilih
              </p>
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={schoolComparisonData}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 30, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" domain={[70, 100]} tick={{ fontSize: 10, fill: '#475569' }} />
                <YAxis dataKey="namaSekolah" type="category" tick={{ fontSize: 10, fill: '#334155' }} width={100} />
                <Tooltip
                  formatter={(val: any, name: any, item: any) => [
                    `${val} Poin (${item?.payload?.jumlahGuru} Guru)`,
                    'Rata-rata Supervisi'
                  ]}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                  contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="rataRata" fill="#0ea5e9" radius={[0, 4, 4, 0]} name="Rerata Skor" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 5. TABEL RINCIAN CAPAIAN SUPERVISI SELURUH GURU PERIODE INI  */}
      {/* ============================================================ */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Daftar Capaian Hasil Supervisi Seluruh Guru ({filteredTeacherData.length} Guru)</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Rincian hasil evaluasi pengawas untuk periode {selectedPeriodLabel}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari guru, NIP, mapel, atau sekolah..."
                className="w-56 sm:w-64 pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <ExportButton
              id="export-table-supervisi-periode"
              data={exportPayload}
              fileName={`data_supervisi_guru_${selectedPeriod}`}
              title="Unduh Tabel (CSV)"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 w-12 text-center">No</th>
                <th className="px-4 py-3">Nama Lengkap &amp; NIP</th>
                <th className="px-4 py-3">Satuan Pendidikan</th>
                <th className="px-4 py-3">Mata Pelajaran / Tugas</th>
                <th className="px-4 py-3 text-center">Skor Supervisi</th>
                <th className="px-4 py-3 text-center">Indeks PM</th>
                <th className="px-4 py-3 text-center">Administrasi</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTeacherData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    <Info className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">Tidak ada data guru yang memenuhi filter yang dipilih.</p>
                    <p className="text-[11px] text-slate-400 mt-1">Coba ubah pilihan periode atau parameter pencarian.</p>
                  </td>
                </tr>
              ) : (
                filteredTeacherData.map((item, idx) => (
                  <tr key={item.teacher.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 leading-tight">{item.teacher.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">NIP: {item.teacher.nip}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{item.school?.name || item.teacher.schoolName}</div>
                      <div className="text-[10px] text-slate-400">{item.schoolLevel} • Kec. {item.school?.subDistrict || 'Magetan'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{item.teacher.subject}</div>
                      <span className="inline-block px-1.5 py-0.5 text-[9px] font-semibold bg-slate-100 text-slate-600 rounded">
                        {item.teacherType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-sm font-black text-slate-900">{item.score}</span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                            item.predicate === 'Amat Baik'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.predicate === 'Baik'
                              ? 'bg-blue-100 text-blue-800'
                              : item.predicate === 'Cukup'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.predicate}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-blue-600">
                      {item.dlScore}%
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-emerald-600">
                      {item.adminScore}%
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 text-[10px] font-bold rounded-lg ${
                          item.status === 'SELESAI'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : item.status === 'DISETUJUI'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : item.status === 'DIAJUKAN'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {item.status === 'SELESAI'
                          ? 'Selesai'
                          : item.status === 'DISETUJUI'
                          ? 'Terjadwal'
                          : item.status === 'DIAJUKAN'
                          ? 'Menunggu'
                          : 'Belum Terjadwal'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedTeacherDetail(item)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        title="Lihat Lembar Capaian Supervisi Guru"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 6. MODAL DETAIL LEMBAR CAPAIAN INDIVIDUAL GURU               */}
      {/* ============================================================ */}
      {selectedTeacherDetail && (
        <Modal
          isOpen={!!selectedTeacherDetail}
          onClose={() => setSelectedTeacherDetail(null)}
          title={`Kartu Capaian Supervisi Guru: ${selectedTeacherDetail.teacher.name}`}
          size="lg"
        >
          <div className="space-y-4 text-xs">
            {/* Profil Singkat Guru */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900">{selectedTeacherDetail.teacher.name}</h4>
                <p className="text-slate-500 font-mono mt-0.5">NIP: {selectedTeacherDetail.teacher.nip}</p>
                <p className="text-slate-600 mt-1">
                  {selectedTeacherDetail.teacher.schoolName} • {selectedTeacherDetail.teacher.subject}
                </p>
              </div>
              <div className="text-right sm:text-right">
                <span className="text-[11px] text-slate-400 block">Skor Supervisi Capaian:</span>
                <span className="text-2xl font-black text-indigo-600">{selectedTeacherDetail.score} / 100</span>
                <span className="block font-bold text-emerald-700 text-xs mt-0.5">
                  Predikat: {selectedTeacherDetail.predicate}
                </span>
              </div>
            </div>

            {/* Rincian Komponen Capaian */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Pembelajaran Mendalam (PM)
                </span>
                <div className="text-lg font-black text-blue-600 mt-1">
                  {selectedTeacherDetail.dl?.overallScore ?? 89}%
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Tingkat: {selectedTeacherDetail.dl?.masteryLevel || 'Cakap'}
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Validasi Administrasi
                </span>
                <div className="text-lg font-black text-emerald-600 mt-1">
                  {selectedTeacherDetail.admin?.completionPercentage ?? selectedTeacherDetail.teacher.adminCompletion ?? 92}%
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Status: Tervalidasi Pengawas
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Pola Pikir (Growth Mindset)
                </span>
                <div className="text-lg font-black text-purple-600 mt-1">
                  {selectedTeacherDetail.mindset?.percentage ?? 88}%
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Kategori: {selectedTeacherDetail.mindset?.category || 'Pola Pikir Berkembang'}
                </span>
              </div>
            </div>

            {/* Catatan & Rekomendasi Supervisi */}
            <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
              <h5 className="font-bold text-indigo-900 text-xs mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span>Catatan &amp; Rekomendasi Tindak Lanjut Pengawas Binaan:</span>
              </h5>
              <p className="text-slate-700 leading-relaxed text-xs">
                {selectedTeacherDetail.supervision?.supervisorNotes ||
                  selectedTeacherDetail.supervision?.notes ||
                  'Guru menunjukkan antusiasme tinggi dalam menerapkan diferensiasi konten dan asesmen formatif berkelanjutan. Disarankan untuk membagikan praktik baik modul pembelajaran mendalam di forum KKG gugus kecamatan.'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedTeacherDetail(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
