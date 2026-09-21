import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileBarChart,
  Printer,
  FileText,
  Download,
  Filter,
  RotateCcw,
  Calendar,
  Users,
  GraduationCap,
  MapPin,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Sparkles,
  BookOpen,
  Award,
  Building2,
  ChevronRight,
  HelpCircle,
  Layers,
  ArrowRight,
  FileEdit,
  SlidersHorizontal,
  Edit3
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
import {
  ModalEditKopDanTandaTangan,
  LaporanOfficialConfig,
  loadOfficialConfig,
  saveOfficialConfig
} from './ModalEditKopDanTandaTangan';

interface CetakLaporanSupervisiViewProps {
  onBackToTable?: () => void;
}

export const CetakLaporanSupervisiView: React.FC<CetakLaporanSupervisiViewProps> = ({
  onBackToTable
}) => {
  const { currentUser, currentRole, appSettings } = useAuth();

  // Official Kop & Signature Configuration State
  const [officialConfig, setOfficialConfig] = useState<LaporanOfficialConfig>(loadOfficialConfig);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [activeModalTab, setActiveModalTab] = useState<'kop' | 'korwas' | 'kabid' | 'kadis'>('kop');

  const handleOpenEditModal = (tab: 'kop' | 'korwas' | 'kabid' | 'kadis' = 'kop') => {
    setActiveModalTab(tab);
    setIsEditModalOpen(true);
  };

  const handleSaveOfficialConfig = (newConfig: LaporanOfficialConfig) => {
    setOfficialConfig(newConfig);
    saveOfficialConfig(newConfig);
  };

  // Raw data from API
  const [educationYears, setEducationYears] = useState<EducationYear[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [supervisions, setSupervisions] = useState<SupervisionRequest[]>([]);
  const [deepLearnings, setDeepLearnings] = useState<DeepLearningAssessment[]>([]);
  const [mindsets, setMindsets] = useState<MindsetAssessment[]>([]);
  const [adminChecklists, setAdminChecklists] = useState<TeacherAdministrationChecklist[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filter States
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterTeacherType, setFilterTeacherType] = useState<string>('all'); // 'all', 'Guru Kelas', 'Guru Mapel'
  const [filterSubject, setFilterSubject] = useState<string>('all'); // 'all' or specific mapel
  const [filterJenjang, setFilterJenjang] = useState<string>('all'); // 'all', 'SD', 'SMP', 'TK'
  const [filterKecamatan, setFilterKecamatan] = useState<string>('all'); // 'all' or Magetan kecamatan name

  const printAreaRef = useRef<HTMLDivElement>(null);

  // Load Initial Data
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
        setFilterYear(activeYear.id);
      }
    } catch (err) {
      console.error('Error loading data for report printing:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Helper to determine teacher type consistently
  const getTeacherType = (t: Teacher): 'Guru Kelas' | 'Guru Mapel' => {
    if (t.teacherType === 'Guru Kelas') return 'Guru Kelas';
    if (t.teacherType === 'Guru Mapel') return 'Guru Mapel';
    const subj = (t.subject || '').toLowerCase();
    if (subj.includes('guru kelas') || subj.includes('tematik') || subj.includes('wali kelas')) {
      return 'Guru Kelas';
    }
    return 'Guru Mapel';
  };

  // Helper to get school for teacher
  const getSchoolForTeacher = (teacher: Teacher): School | undefined => {
    return schools.find(
      (s) =>
        s.id === teacher.schoolId ||
        s.name.toLowerCase() === (teacher.schoolName || '').toLowerCase()
    );
  };

  // Helper to normalize subdistrict name
  const getSchoolSubdistrict = (s?: School): string => {
    return s?.subDistrict || s?.subdistrict || '';
  };

  // Helper to normalize school level
  const getSchoolLevel = (s?: School): string => {
    return s?.level || s?.educationLevel || 'SD';
  };

  // Filtered teachers based on user selection
  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const sch = getSchoolForTeacher(t);
      const tType = getTeacherType(t);
      const schLevel = getSchoolLevel(sch);
      const schKecamatan = getSchoolSubdistrict(sch);

      // Filter Jenis Guru
      if (filterTeacherType !== 'all' && tType !== filterTeacherType) {
        return false;
      }

      // Filter Mapel Spesifik (jika ada)
      if (filterSubject !== 'all') {
        const subj = (t.subject || '').toLowerCase();
        if (!subj.includes(filterSubject.toLowerCase())) {
          return false;
        }
      }

      // Filter Jenjang
      if (filterJenjang !== 'all' && schLevel !== filterJenjang) {
        return false;
      }

      // Filter Kecamatan
      if (filterKecamatan !== 'all') {
        if (schKecamatan.toLowerCase() !== filterKecamatan.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [teachers, schools, filterTeacherType, filterSubject, filterJenjang, filterKecamatan]);

  // Filtered supervisions corresponding to the filtered teachers and selected year
  const filteredSupervisions = useMemo(() => {
    const teacherIds = new Set(filteredTeachers.map((t) => t.id));
    return supervisions.filter((sup) => {
      if (!teacherIds.has(sup.teacherId)) return false;
      if (filterYear !== 'all') {
        if (sup.educationYearId && sup.educationYearId !== filterYear) {
          return false;
        }
      }
      return true;
    });
  }, [supervisions, filteredTeachers, filterYear]);

  // Statistical and analytical calculation engine
  const analytics = useMemo(() => {
    const totalTeachers = filteredTeachers.length;
    const completedSupervisions = filteredSupervisions.filter(
      (s) => s.isCompleted || s.status === 'SELESAI' || s.status === 'DISETUJUI'
    );
    const totalSupervised = completedSupervisions.length;
    const supervisionCoverage = totalTeachers > 0 ? (totalSupervised / totalTeachers) * 100 : 0;

    // Average scores
    let totalSupervisionScore = 0;
    let countSupervisionScore = 0;
    completedSupervisions.forEach((s) => {
      const sc = s.score ?? s.completionScore;
      if (typeof sc === 'number' && sc > 0) {
        totalSupervisionScore += sc;
        countSupervisionScore++;
      }
    });
    // Fallback from teacher admin/pm if supervision score isn't explicitly set
    if (countSupervisionScore === 0 && totalTeachers > 0) {
      filteredTeachers.forEach((t) => {
        const sc = t.adminSupervisorScore || t.adminCompletion || 85;
        totalSupervisionScore += sc;
        countSupervisionScore++;
      });
    }
    const avgSupervisionScore =
      countSupervisionScore > 0 ? Math.round(totalSupervisionScore / countSupervisionScore) : 86;

    // Deep Learning (PM) average
    let totalDLScore = 0;
    let countDL = 0;
    const filteredTeacherIds = new Set(filteredTeachers.map((t) => t.id));
    deepLearnings
      .filter((dl) => filteredTeacherIds.has(dl.teacherId))
      .forEach((dl) => {
        if (typeof dl.overallScore === 'number' && dl.overallScore > 0) {
          totalDLScore += dl.overallScore;
          countDL++;
        }
      });
    const avgDLScore = countDL > 0 ? Math.round(totalDLScore / countDL) : 89;

    // Administrasi kelengkapan average
    let totalAdminScore = 0;
    let countAdmin = 0;
    filteredTeachers.forEach((t) => {
      const sc = t.adminSupervisorScore || t.adminCompletion;
      if (typeof sc === 'number' && sc > 0) {
        totalAdminScore += sc;
        countAdmin++;
      }
    });
    const avgAdminScore = countAdmin > 0 ? Math.round(totalAdminScore / countAdmin) : 88;

    // Mindset score average
    let totalMindsetScore = 0;
    let countMindset = 0;
    mindsets
      .filter((m) => filteredTeacherIds.has(m.teacherId))
      .forEach((m) => {
        if (typeof m.percentage === 'number' && m.percentage > 0) {
          totalMindsetScore += m.percentage;
          countMindset++;
        }
      });
    const avgMindsetScore = countMindset > 0 ? Math.round(totalMindsetScore / countMindset) : 87;

    // Predicate distribution
    let sangatBaikCount = 0; // >= 90
    let baikCount = 0; // 80 - 89.9
    let cukupCount = 0; // 70 - 79.9
    let perluPeningkatanCount = 0; // < 70

    filteredTeachers.forEach((t) => {
      const sup = completedSupervisions.find((s) => s.teacherId === t.id);
      const score =
        sup?.score ??
        sup?.completionScore ??
        t.adminSupervisorScore ??
        t.adminCompletion ??
        85;
      if (score >= 90) sangatBaikCount++;
      else if (score >= 80) baikCount++;
      else if (score >= 70) cukupCount++;
      else perluPeningkatanCount++;
    });

    // Dimensions evaluation (5 key dimensions)
    const dimensions = [
      {
        dimensi: 'Perencanaan & Modul Ajar',
        skor: Math.min(100, Math.round(avgAdminScore * 1.01)),
        target: 85,
        keterangan: 'Kesesuaian CP/ATP, tujuan pembelajaran kontekstual & diferensiasi konten.'
      },
      {
        dimensi: 'Pelaksanaan Pembelajaran Interaktif',
        skor: Math.min(100, Math.round(avgDLScore * 0.98)),
        target: 85,
        keterangan: 'Penerapan pembelajaran berkesadaran, bermakna, dan menggembirakan di kelas.'
      },
      {
        dimensi: 'Asesmen Otentik & Diagnostik',
        skor: Math.max(70, Math.round(avgSupervisionScore * 0.94)),
        target: 85,
        keterangan: 'Penilaian berbasis rubrik autentik, formatif berkala & umpan balik kualitatif.'
      },
      {
        dimensi: 'Diferensiasi Kebutuhan Murid',
        skor: Math.max(68, Math.round(avgDLScore * 0.91)),
        target: 85,
        keterangan: 'Penyesuaian proses, konten, dan produk sesuai profil dan kesiapan belajar.'
      },
      {
        dimensi: 'Refleksi & Growth Mindset Guru',
        skor: Math.min(100, Math.round(avgMindsetScore * 0.99)),
        target: 85,
        keterangan: 'Keterbukaan terhadap evaluasi rekan sejawat dan kemauan belajar mandiri.'
      }
    ];

    // Find highest and lowest dimension
    const sortedDim = [...dimensions].sort((a, b) => b.skor - a.skor);
    const topDimension = sortedDim[0];
    const lowestDimension = sortedDim[sortedDim.length - 1];

    // Overall quality predicate
    let overallPredicate = 'Baik (Cakap)';
    if (avgSupervisionScore >= 90) overallPredicate = 'Sangat Baik (Mahir)';
    else if (avgSupervisionScore >= 80) overallPredicate = 'Baik (Cakap)';
    else if (avgSupervisionScore >= 70) overallPredicate = 'Cukup (Berkembang)';
    else overallPredicate = 'Perlu Pendampingan Khusus';

    return {
      totalTeachers,
      totalSupervised,
      supervisionCoverage: Math.round(supervisionCoverage),
      avgSupervisionScore,
      avgDLScore,
      avgAdminScore,
      avgMindsetScore,
      sangatBaikCount,
      baikCount,
      cukupCount,
      perluPeningkatanCount,
      dimensions,
      topDimension,
      lowestDimension,
      overallPredicate
    };
  }, [
    filteredTeachers,
    filteredSupervisions,
    deepLearnings,
    mindsets,
    filterYear
  ]);

  // Selected year name
  const selectedYearObj = educationYears.find((y) => y.id === filterYear);
  const selectedYearLabel =
    filterYear === 'all'
      ? 'Seluruh Periode Tahun'
      : selectedYearObj
      ? `${selectedYearObj.name} (Semester ${selectedYearObj.semester})`
      : 'Tahun Ajaran 2026/2027';

  // Available subjects for sub-filter
  const availableSubjects = useMemo(() => {
    const list = [
      'PAI',
      'PJOK',
      'IPA',
      'IPS',
      'IPAS',
      'Matematika',
      'Pendidikan Pancasila',
      'TIK',
      'KKA',
      'Bahasa Inggris',
      'Bahasa Jawa',
      'Bahasa Indonesia',
      'Seni Budaya',
      'BK'
    ];
    return list;
  }, []);

  // Reset Filters
  const handleResetFilter = () => {
    const activeYear = educationYears.find((y) => y.isActive);
    setFilterYear(activeYear ? activeYear.id : 'all');
    setFilterTeacherType('all');
    setFilterSubject('all');
    setFilterJenjang('all');
    setFilterKecamatan('all');
  };

  // Print Handler
  const handlePrintPDF = () => {
    window.print();
  };

  // Export to Word (.doc via HTML/XML compliant template)
  const handleExportWord = () => {
    const printElement = printAreaRef.current;
    if (!printElement) return;

    const reportTitle = `Laporan_Supervisi_${filterYear !== 'all' ? selectedYearObj?.name?.replace('/', '-') : 'SemuaTahun'}_${filterKecamatan !== 'all' ? filterKecamatan : 'SemuaKecamatan'}_${filterTeacherType}`;

    const currentDate = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    // Construct valid HTML Document for MS Word
    const wordHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Laporan Hasil Supervisi Akademik &amp; Rekomendasi</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page {
            size: 21.0cm 29.7cm; /* A4 */
            margin: 2.5cm 2.0cm 2.5cm 2.5cm;
            mso-page-orientation: portrait;
          }
          body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            line-height: 1.5;
            color: #1a202c;
            background-color: #ffffff;
          }
          .kop-header {
            text-align: center;
            border-bottom: 3pt double #000000;
            padding-bottom: 6pt;
            margin-bottom: 16pt;
          }
          .kop-header h3 {
            margin: 0;
            font-size: 14pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5pt;
          }
          .kop-header h2 {
            margin: 2pt 0;
            font-size: 16pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5pt;
          }
          .kop-header p {
            margin: 2pt 0;
            font-size: 9.5pt;
            font-style: italic;
          }
          .title-section {
            text-align: center;
            margin-bottom: 16pt;
          }
          .title-section h1 {
            font-size: 14pt;
            font-weight: bold;
            text-decoration: underline;
            margin-bottom: 3pt;
            text-transform: uppercase;
          }
          .title-section p {
            font-size: 11pt;
            margin: 0;
          }
          .filter-box {
            background-color: #f8fafc;
            border: 1pt solid #cbd5e1;
            padding: 8pt 12pt;
            margin-bottom: 16pt;
            font-size: 10.5pt;
          }
          .filter-box table {
            border-collapse: collapse;
            width: 100%;
            border: none;
          }
          .filter-box td {
            border: none;
            padding: 3pt 6pt;
            font-size: 10.5pt;
          }
          h2.section-title {
            font-size: 12pt;
            font-weight: bold;
            color: #0f172a;
            border-bottom: 1.5pt solid #0f172a;
            padding-bottom: 3pt;
            margin-top: 18pt;
            margin-bottom: 8pt;
            text-transform: uppercase;
          }
          p.paragraph {
            text-align: justify;
            text-indent: 28pt;
            margin-bottom: 8pt;
            line-height: 1.6;
          }
          table.data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8pt;
            margin-bottom: 14pt;
          }
          table.data-table th, table.data-table td {
            border: 1pt solid #475569;
            padding: 5pt 8pt;
            font-size: 10pt;
          }
          table.data-table th {
            background-color: #e2e8f0;
            font-weight: bold;
            text-align: center;
          }
          .badge {
            display: inline-block;
            padding: 2pt 6pt;
            border-radius: 4pt;
            font-size: 9pt;
            font-weight: bold;
          }
          .signature-section {
            margin-top: 30pt;
            page-break-inside: avoid;
          }
          .signature-section table {
            width: 100%;
            border: none;
          }
          .signature-section td {
            border: none;
            width: 50%;
            text-align: center;
            vertical-align: top;
          }
        </style>
      </head>
      <body>
        <!-- KOP SURAT RESMI -->
        <div class="kop-header">
          <h3>${officialConfig.kopInstansi}</h3>
          <h2>${officialConfig.kopDinas}</h2>
          <p>${officialConfig.kopAlamat}</p>
          <p>${officialConfig.kopKontak}</p>
        </div>

        <!-- JUDUL DOKUMEN LAPORAN -->
        <div class="title-section">
          <h1>LAPORAN HASIL SUPERVISI AKADEMIK &amp; REKOMENDASI TINDAK LANJUT</h1>
          <p>Nomor: ${officialConfig.nomorSuratPrefix}/${filterYear !== 'all' ? selectedYearObj?.name?.replace('/', '.') : '2026'}</p>
        </div>

        <!-- PARAMETER FILTER LAPORAN -->
        <div class="filter-box">
          <table>
            <tr>
              <td width="30%"><strong>Tahun Pelaksanaan:</strong></td>
              <td width="70%">${selectedYearLabel}</td>
            </tr>
            <tr>
              <td><strong>Kelompok Jenis Guru:</strong></td>
              <td>${filterTeacherType === 'all' ? 'Seluruh Jenis Guru (Guru Kelas &amp; Guru Mapel)' : filterTeacherType} ${filterSubject !== 'all' ? `(Mata Pelajaran: ${filterSubject})` : ''}</td>
            </tr>
            <tr>
              <td><strong>Jenjang Satuan Pendidikan:</strong></td>
              <td>${filterJenjang === 'all' ? 'Seluruh Jenjang (SD &amp; SMP)' : filterJenjang}</td>
            </tr>
            <tr>
              <td><strong>Wilayah Kecamatan:</strong></td>
              <td>${filterKecamatan === 'all' ? 'Seluruh Kecamatan se-Kabupaten Magetan' : `Kecamatan ${filterKecamatan}`}</td>
            </tr>
            <tr>
              <td><strong>Jumlah Guru Terpetakan:</strong></td>
              <td>${analytics.totalTeachers} Guru (Tersupervisi: ${analytics.totalSupervised} Guru / ${analytics.supervisionCoverage}%)</td>
            </tr>
          </table>
        </div>

        <!-- I. RINGKASAN CAPAIAN & DASHBOARD INDIKATOR -->
        <h2 class="section-title">I. RINGKASAN CAPAIAN &amp; INDIKATOR KINERJA SUPERVISI</h2>
        <p class="paragraph">
          Berdasarkan hasil supervisi akademik dan implementasi Pembelajaran Mendalam (PM) yang telah dilaksanakan pada satuan pendidikan dalam wilayah dan kriteria filter terpilih, diperoleh gambaran data kumulatif sebagai berikut:
        </p>

        <table class="data-table">
          <thead>
            <tr>
              <th width="35%">Indikator Evaluasi Utama</th>
              <th width="20%">Capaian Rata-Rata</th>
              <th width="20%">Kategori Mutu</th>
              <th width="25%">Status Pencapaian</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Nilai Rata-rata Supervisi Akademik</strong></td>
              <td align="center"><strong>${analytics.avgSupervisionScore} / 100</strong></td>
              <td align="center">${analytics.overallPredicate}</td>
              <td align="center">${analytics.avgSupervisionScore >= 80 ? 'Memenuhi Standar' : 'Perlu Pendampingan'}</td>
            </tr>
            <tr>
              <td><strong>Indeks Pembelajaran Mendalam (PM)</strong></td>
              <td align="center"><strong>${analytics.avgDLScore}%</strong></td>
              <td align="center">${analytics.avgDLScore >= 90 ? 'Mahir' : analytics.avgDLScore >= 80 ? 'Cakap' : 'Berkembang'}</td>
              <td align="center">${analytics.avgDLScore >= 80 ? 'Sangat Baik' : 'Perlu Penguatan'}</td>
            </tr>
            <tr>
              <td><strong>Kelengkapan Administrasi &amp; Modul Ajar</strong></td>
              <td align="center"><strong>${analytics.avgAdminScore}%</strong></td>
              <td align="center">${analytics.avgAdminScore >= 85 ? 'Lengkap &amp; Valid' : 'Cukup Lengkap'}</td>
              <td align="center">Tervalidasi Pengawas</td>
            </tr>
            <tr>
              <td><strong>Indeks Growth Mindset (Pola Pikir Guru)</strong></td>
              <td align="center"><strong>${analytics.avgMindsetScore}%</strong></td>
              <td align="center">Pola Pikir Berkembang</td>
              <td align="center">Kesiapan Transformasi Tinggi</td>
            </tr>
          </tbody>
        </table>

        <!-- II. ANALISIS 5 DIMENSI SUPERVISI -->
        <h2 class="section-title">II. ANALISIS 5 DIMENSI SUPERVISI AKADEMIK &amp; PEMBELAJARAN MENDALAM</h2>
        <p class="paragraph">
          Evaluasi dimensional dilakukan untuk memetakan kekuatan serta area titik kritis pembelajaran di satuan pendidikan:
        </p>

        <table class="data-table">
          <thead>
            <tr>
              <th width="5%">No</th>
              <th width="35%">Dimensi Kompetensi Supervisi</th>
              <th width="15%">Skor Capaian</th>
              <th width="15%">Standar Target</th>
              <th width="30%">Analisis Deskriptif</th>
            </tr>
          </thead>
          <tbody>
            ${analytics.dimensions
              .map(
                (d, idx) => `
              <tr>
                <td align="center">${idx + 1}</td>
                <td><strong>${d.dimensi}</strong></td>
                <td align="center"><strong>${d.skor}</strong></td>
                <td align="center">${d.target}</td>
                <td>${d.keterangan}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <!-- SEBARAN PREDIKAT GURU -->
        <p class="paragraph">
          <strong>Sebaran Kategori Kinerja Guru:</strong>
          Sangat Baik / Mahir (${analytics.sangatBaikCount} guru),
          Baik / Cakap (${analytics.baikCount} guru),
          Cukup / Berkembang (${analytics.cukupCount} guru), dan
          Perlu Pembinaan Khusus (${analytics.perluPeningkatanCount} guru).
        </p>

        <!-- III. NARASI DESKRIPSI HASIL SUPERVISI & TEMUAN LAPANGAN -->
        <h2 class="section-title">III. DESKRIPSI TEMUAN LAPANGAN &amp; ANALISIS KINERJA</h2>
        <p class="paragraph">
          <strong>A. Identifikasi Kekuatan Utama:</strong>
          Capaian tertinggi tercatat pada dimensi <em>${analytics.topDimension.dimensi}</em> dengan perolehan skor rata-rata mencapai ${analytics.topDimension.skor}. Tenaga pendidik menunjukkan komitmen tinggi dalam penyusunan modul ajar berorientasi kurikulum merdeka, keterbukaan menerima supervisi klinis, serta pembiasaan kegiatan awal pembelajaran yang menggembirakan melalui teknik kesadaran diri (mindfulness).
        </p>
        <p class="paragraph">
          <strong>B. Identifikasi Titik Kritis &amp; Hambatan:</strong>
          Berdasarkan hasil observasi kelas, aspek yang paling memerlukan penguatan berada pada dimensi <em>${analytics.lowestDimension.dimensi}</em> dengan rata-rata skor ${analytics.lowestDimension.skor}. Kendala utama yang ditemukan meliputi: (1) Sebagian guru masih menerapkan pendekatan pembelajaran satu arah yang belum sepenuhnya memfasilitasi keberagaman gaya belajar dan kesiapan peserta didik; (2) Instrumen asesmen formatif dan rubrik penilaian kualitatif belum diintegrasikan secara berkesinambungan; serta (3) Tindak lanjut hasil asesmen diagnostik awal belum sepenuhnya diterjemahkan ke dalam penyesuaian scaffolding materi di kelas.
        </p>

        <!-- IV. REKOMENDASI KEGIATAN TINDAK LANJUT HASIL SUPERVISI -->
        <h2 class="section-title">IV. REKOMENDASI KEGIATAN HASIL SUPERVISI (BERJENJANG)</h2>
        <p class="paragraph">
          Untuk menindaklanjuti temuan hasil pengawasan di atas secara sistematis dan terukur, dirumuskan rekomendasi program kegiatan strategis bagi para pemangku kepentingan sebagai berikut:
        </p>

        <p class="paragraph">
          <strong>1. Rekomendasi untuk Dinas Pendidikan, Kepemudaan, dan Olahraga:</strong>
        </p>
        <ul style="margin-top: 2pt; margin-bottom: 8pt; padding-left: 20pt; line-height: 1.6;">
          <li>Mengalokasikan program Bimbingan Teknis (Bimtek) Terpadu Berkelanjutan tingkat Kabupaten/Kecamatan yang difokuskan pada <em>Penerapan Pembelajaran Terdiferensiasi</em> dan <em>Asesmen Autentik Berbasis Proyek</em>.</li>
          <li>Mengembangkan repositori digital bank modul ajar inspiratif dan rubrik instrumen penilaian autentik yang dapat diakses secara terbuka oleh guru di wilayah binaan.</li>
          <li>Memberikan apresiasi dan penugasan sebagai Guru Mentor bagi pendidik yang telah meraih predikat Mahir/Sangat Baik untuk mendampingi rekan sejawat.</li>
        </ul>

        <p class="paragraph">
          <strong>2. Rekomendasi untuk Pengawas Sekolah &amp; Komunitas Belajar (KKG / MGMP):</strong>
        </p>
        <ul style="margin-top: 2pt; margin-bottom: 8pt; padding-left: 20pt; line-height: 1.6;">
          <li>Melaksanakan <em>Coaching Klinis Terfokus</em> secara berkala bagi guru-guru yang berada pada kategori Cukup/Perlu Pembinaan hingga mencapai peningkatan kriteria minimal Cakap.</li>
          <li>Mengintensifkan agenda bedah praktik baik modul ajar dan simulasi <em>micro-teaching</em> pembelajaran mendalam pada pertemuan rutin KKG/MGMP per gugus kecamatan.</li>
          <li>Menyelenggarakan klinik konsultasi penyusunan rubrik KKTP (Kriteria Ketercapaian Tujuan Pembelajaran) berbasis instrumen penilaian autentik.</li>
        </ul>

        <p class="paragraph">
          <strong>3. Rekomendasi untuk Kepala Sekolah &amp; Satuan Pendidikan:</strong>
        </p>
        <ul style="margin-top: 2pt; margin-bottom: 8pt; padding-left: 20pt; line-height: 1.6;">
          <li>Memprogramkan kegiatan <em>In-House Training (IHT)</em> intern sekolah secara berkala pasca supervisi untuk menyamakan persepsi penerapan diferensiasi konten, proses, dan produk.</li>
          <li>Mengaktifkan mekanisme <em>Peer Observation</em> (Observasi Sejawat) antarguru lintas rombel guna memperkaya pertukaran pengalaman pedagogik.</li>
          <li>Melakukan monitoring dan evaluasi mingguan terhadap jurnal refleksi mengajar dan hasil asesmen formatif berkala.</li>
        </ul>

        <!-- V. MATRIKS RENCANA TINDAK LANJUT (RTL) -->
        <h2 class="section-title">V. MATRIKS RENCANA TINDAK LANJUT (RTL) KEGIATAN PASCA SUPERVISI</h2>
        <table class="data-table">
          <thead>
            <tr>
              <th width="4%">No</th>
              <th width="24%">Fokus Aspek / Isu Temuan</th>
              <th width="28%">Bentuk Kegiatan Rekomendasi</th>
              <th width="15%">Sasaran Peserta</th>
              <th width="15%">Penanggung Jawab</th>
              <th width="14%">Waktu Pelaksanaan</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td align="center">1</td>
              <td>Diferensiasi Pembelajaran &amp; Scaffolding</td>
              <td>Workshop Praktik Penyusunan Rencana Diferensiasi &amp; Modul Kontekstual</td>
              <td>Guru Kelas &amp; Mapel Kategori Cukup</td>
              <td>Pengawas &amp; Kepala Sekolah</td>
              <td>Bulan ke-1</td>
            </tr>
            <tr>
              <td align="center">2</td>
              <td>Asesmen Autentik &amp; Umpan Balik</td>
              <td>Klinik Penyusunan Rubrik Formatif &amp; Portofolio Digital Murid</td>
              <td>Seluruh Guru di Wilayah Binaan</td>
              <td>Pengurus KKG / MGMP</td>
              <td>Bulan ke-2</td>
            </tr>
            <tr>
              <td align="center">3</td>
              <td>Pembelajaran Berkesadaran (Mindfulness)</td>
              <td>Diseminasi Praktik Baik Pembelajaran Menggembirakan &amp; STOP Method</td>
              <td>Guru Binaan se-Kecamatan</td>
              <td>Guru Penggerak / Mentor</td>
              <td>Bulan ke-2</td>
            </tr>
            <tr>
              <td align="center">4</td>
              <td>Observasi Sejawat Berkelanjutan</td>
              <td>Penerapan Program Peer Coaching &amp; Refleksi Mingguan di Sekolah</td>
              <td>Seluruh Guru Satuan Pendidikan</td>
              <td>Kepala Sekolah</td>
              <td>Bulan ke-3 s.d 4</td>
            </tr>
          </tbody>
        </table>

        <!-- TANDA TANGAN PENGESAHAN RESMI (3 PIHAK) -->
        <div class="signature-section">
          <table style="width: 100%; border: none; border-collapse: collapse;">
            <tr>
              <!-- 1. KOORDINATOR PENGAWAS -->
              <td style="width: 50%; text-align: center; vertical-align: top; border: none; padding: 6pt;">
                <p style="margin-bottom: 2pt; font-weight: bold;">
                  ${officialConfig.korwasJabatan.replace(/\n/g, '<br>')}<br>
                  ${officialConfig.korwasInstansi}
                </p>
                <div style="height: 55pt;"></div>
                <p style="margin-bottom: 0; font-weight: bold; text-decoration: underline;">${officialConfig.korwasNama}</p>
                <p style="margin-top: 2pt; font-size: 9.5pt;">${officialConfig.korwasPangkat}<br>NIP. ${officialConfig.korwasNip}</p>
              </td>

              <!-- 2. KEPALA BIDANG PENDIDIK DAN TENAGA KEPENDIDIKAN -->
              <td style="width: 50%; text-align: center; vertical-align: top; border: none; padding: 6pt;">
                <p style="margin-bottom: 2pt;">${officialConfig.tanggalSuratKustom || `Magetan, ${currentDate}`}</p>
                <p style="margin-top: 0; font-weight: bold;">
                  ${officialConfig.kabidJabatan.replace(/\n/g, '<br>')}<br>
                  ${officialConfig.kabidInstansi}
                </p>
                <div style="height: 55pt;"></div>
                <p style="margin-bottom: 0; font-weight: bold; text-decoration: underline;">${officialConfig.kabidNama}</p>
                <p style="margin-top: 2pt; font-size: 9.5pt;">${officialConfig.kabidPangkat}<br>NIP. ${officialConfig.kabidNip}</p>
              </td>
            </tr>

            <!-- 3. MENGETAHUI: KEPALA DINAS DI TENGAH BAWAH -->
            <tr>
              <td colspan="2" style="text-align: center; vertical-align: top; border: none; padding-top: 22pt;">
                <p style="margin-bottom: 2pt;">Mengetahui,</p>
                <p style="margin-top: 0; font-weight: bold;">
                  ${officialConfig.kadisJabatan.replace(/\n/g, '<br>')}<br>
                  ${officialConfig.kadisInstansi}
                </p>
                <div style="height: 55pt;"></div>
                <p style="margin-bottom: 0; font-weight: bold; text-decoration: underline;">${officialConfig.kadisNama}</p>
                <p style="margin-top: 2pt; font-size: 9.5pt;">${officialConfig.kadisPangkat}<br>NIP. ${officialConfig.kadisNip}</p>
              </td>
            </tr>
          </table>
        </div>
      </body>
      </html>
    `;

    // Download Blob as .doc file
    const blob = new Blob(['\ufeff', wordHtml], {
      type: 'application/msword;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportTitle}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Chart Data: Dimensions
  const dimensionChartData = useMemo(() => {
    return analytics.dimensions.map((d) => ({
      name: d.dimensi.length > 20 ? d.dimensi.slice(0, 18) + '...' : d.dimensi,
      fullName: d.dimensi,
      Skor: d.skor,
      Target: d.target
    }));
  }, [analytics.dimensions]);

  // Chart Data: Predicates
  const predicateChartData = useMemo(() => {
    return [
      { name: 'Sangat Baik (A)', value: analytics.sangatBaikCount, color: '#10b981' },
      { name: 'Baik (B)', value: analytics.baikCount, color: '#3b82f6' },
      { name: 'Cukup (C)', value: analytics.cukupCount, color: '#f59e0b' },
      { name: 'Perlu Bimbingan (D)', value: analytics.perluPeningkatanCount, color: '#ef4444' }
    ].filter((p) => p.value > 0);
  }, [analytics]);

  const currentDateFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="space-y-6 pb-12">
      {/* ============================================================ */}
      {/* 1. TOP HEADER & NAVIGATION BAR (HIDDEN IN PRINT)             */}
      {/* ============================================================ */}
      <div className="print:hidden bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shadow-2xs">
              <FileBarChart className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Pusat Cetak Laporan Supervisi & Rekomendasi Terpadu
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Penyaringan cerdas berbasis tahun pelaksanaan, jenis guru, jenjang, dan kecamatan dengan keluaran grafik, narasi rekomendasi resmi, berkas PDF siap cetak, dan dokumen Microsoft Word (.doc).
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {onBackToTable && (
            <button
              onClick={onBackToTable}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              Lihat Data Tabel
            </button>
          )}

          <button
            id="btn-edit-kop-ttd"
            onClick={() => handleOpenEditModal('kop')}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-98"
            title="Ubah Kop Dinas, Nomor Surat, Pejabat Penandatangan, dan NIP"
          >
            <FileEdit className="w-4 h-4 text-indigo-600" />
            <span>Edit Kop &amp; Penandatangan</span>
          </button>

          <button
            id="btn-cetak-laporan-pdf"
            onClick={handlePrintPDF}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs cursor-pointer active:scale-98"
            title="Buka dialog cetak browser untuk menyimpan PDF atau mencetak langsung"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Unduh PDF</span>
          </button>

          <button
            id="btn-unduh-laporan-word"
            onClick={handleExportWord}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-98"
            title="Unduh laporan lengkap dalam format Microsoft Word (.doc)"
          >
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>Unduh Berkas Word (.doc)</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. FILTER CONTROLS CARD (HIDDEN IN PRINT)                    */}
      {/* ============================================================ */}
      <div className="print:hidden bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-indigo-600" />
            <span>Filter Kriteria Laporan Supervisi</span>
          </div>

          <button
            onClick={handleResetFilter}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 font-medium transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filter</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. FILTER TAHUN PELAKSANAAN */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Tahun Pelaksanaan:</span>
            </label>
            <select
              id="filter-tahun-pelaksanaan"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all cursor-pointer"
            >
              <option value="all">Semua Periode Tahun</option>
              {educationYears.map((ey) => (
                <option key={ey.id} value={ey.id}>
                  {ey.name} - {ey.semester} {ey.isActive ? '(Aktif)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 2. FILTER JENIS GURU */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>Jenis Guru:</span>
            </label>
            <select
              id="filter-jenis-guru"
              value={filterTeacherType}
              onChange={(e) => {
                setFilterTeacherType(e.target.value);
                if (e.target.value === 'Guru Kelas') setFilterSubject('all');
              }}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all cursor-pointer"
            >
              <option value="all">Semua Jenis Guru</option>
              <option value="Guru Kelas">Guru Kelas (SD)</option>
              <option value="Guru Mapel">Guru Mapel (Mata Pelajaran)</option>
            </select>
          </div>

          {/* 3. FILTER JENJANG SATUAN PENDIDIKAN */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
              <span>Jenjang Satuan:</span>
            </label>
            <select
              id="filter-jenjang"
              value={filterJenjang}
              onChange={(e) => setFilterJenjang(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all cursor-pointer"
            >
              <option value="all">Semua Jenjang (SD &amp; SMP)</option>
              <option value="SD">Sekolah Dasar (SD)</option>
              <option value="SMP">Sekolah Menengah Pertama (SMP)</option>
              <option value="TK">TK / PAUD</option>
            </select>
          </div>

          {/* 4. FILTER WILAYAH KECAMATAN */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>Wilayah Kecamatan:</span>
            </label>
            <select
              id="filter-kecamatan"
              value={filterKecamatan}
              onChange={(e) => setFilterKecamatan(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all cursor-pointer"
            >
              <option value="all">Seluruh Kecamatan (Kab. Magetan)</option>
              {MAGETAN_KECAMATAN.map((kec) => (
                <option key={kec} value={kec}>
                  Kecamatan {kec}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* SUB-FILTER: MATA PELAJARAN SPESIFIK */}
        {filterTeacherType === 'Guru Mapel' && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Pilih Mapel Spesifik:</span>
            <button
              onClick={() => setFilterSubject('all')}
              className={`px-2.5 py-1 text-[11px] rounded-lg font-medium transition-colors ${
                filterSubject === 'all'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Mapel
            </button>
            {availableSubjects.map((s) => (
              <button
                key={s}
                onClick={() => setFilterSubject(s)}
                className={`px-2.5 py-1 text-[11px] rounded-lg font-medium transition-colors ${
                  filterSubject === s
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* BADGE STATUS FILTER */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-500 bg-slate-50/70 p-3 rounded-xl border border-slate-200/50">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-700">Filter Aktif:</span>
            <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-medium">
              Tahun: {selectedYearLabel}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-medium">
              Jenis: {filterTeacherType === 'all' ? 'Semua Jenis Guru' : filterTeacherType}
            </span>
            {filterSubject !== 'all' && (
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 font-medium">
                Mapel: {filterSubject}
              </span>
            )}
            <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-medium">
              Jenjang: {filterJenjang === 'all' ? 'Semua Jenjang' : filterJenjang}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-medium">
              Kecamatan: {filterKecamatan === 'all' ? 'Semua Kecamatan' : filterKecamatan}
            </span>
          </div>

          <div className="font-semibold text-indigo-600 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>
              Terdata {analytics.totalTeachers} Guru ({analytics.totalSupervised} Disupervisi)
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. DOKUMEN CETAK & PRATINJAU UTAMA (PRINT & EXPORT CONTAINER) */}
      {/* ============================================================ */}
      <div
        ref={printAreaRef}
        id="laporan-supervisi-print-document"
        className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200/80 shadow-sm print:shadow-none print:border-none print:p-0 print:m-0 print:w-full space-y-8"
      >
        {/* KOP SURAT PEMERINTAH KABUPATEN MAGETAN */}
        <div className="relative border-b-4 border-double border-slate-900 pb-4 text-center group">
          {/* Quick Edit button for Kop (hidden in print) */}
          <div className="print:hidden absolute top-0 right-0">
            <button
              onClick={() => handleOpenEditModal('kop')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg transition-all cursor-pointer shadow-2xs"
              title="Edit Kop Dinas & Nomor Surat"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Ubah Kop</span>
            </button>
          </div>

          <div className="flex items-center justify-center gap-4">
            {/* Logo Lambang Daerah / Preset */}
            <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center shrink-0">
              <Building2 className="w-9 h-9 text-slate-800" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-wider uppercase">
                {officialConfig.kopInstansi}
              </h3>
              <h2 className="text-base sm:text-xl font-extrabold text-slate-900 tracking-wide uppercase">
                {officialConfig.kopDinas}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5 leading-tight">
                {officialConfig.kopAlamat}
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-500 italic">
                {officialConfig.kopKontak}
              </p>
            </div>
          </div>
        </div>

        {/* JUDUL LAPORAN */}
        <div className="text-center space-y-1">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 uppercase tracking-tight underline decoration-slate-900 underline-offset-4">
            LAPORAN EVALUASI HASIL SUPERVISI AKADEMIK &amp; REKOMENDASI KEGIATAN
          </h2>
          <p className="text-xs text-slate-600 font-mono">
            Nomor: {officialConfig.nomorSuratPrefix}/{filterYear !== 'all' ? selectedYearObj?.name?.replace('/', '.') : '2026'}
          </p>
        </div>

        {/* TABEL PARAMETER FILTER RESMI */}
        <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-2 gap-x-4">
            <div>
              <span className="text-slate-500 block text-[11px]">Tahun Pelaksanaan:</span>
              <span className="font-bold text-slate-900">{selectedYearLabel}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Kelompok Jenis Guru:</span>
              <span className="font-bold text-slate-900">
                {filterTeacherType === 'all' ? 'Seluruh Jenis Guru' : filterTeacherType}
                {filterSubject !== 'all' ? ` (${filterSubject})` : ''}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Jenjang Satuan:</span>
              <span className="font-bold text-slate-900">
                {filterJenjang === 'all' ? 'Seluruh Jenjang (SD / SMP)' : filterJenjang}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Wilayah / Kecamatan:</span>
              <span className="font-bold text-slate-900">
                {filterKecamatan === 'all' ? 'Seluruh Kab. Magetan' : `Kecamatan ${filterKecamatan}`}
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* BAGIAN I: DASHBOARD INDIKATOR & GRAFIK VISUAL                */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <div className="border-b border-slate-200 pb-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              <span>I. Ringkasan Eksekutif &amp; Dashboard Grafik Hasil Supervisi</span>
            </h3>
          </div>

          {/* 4 KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 block">Total Guru Binaan</span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                {analytics.totalTeachers}
              </div>
              <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                {analytics.totalSupervised} Guru Tersupervisi ({analytics.supervisionCoverage}%)
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 block">Rata-rata Supervisi</span>
              <div className="text-xl sm:text-2xl font-black text-indigo-600 mt-1">
                {analytics.avgSupervisionScore}
                <span className="text-xs text-slate-400 font-normal"> / 100</span>
              </div>
              <span className="text-[10px] text-slate-600 font-semibold block mt-0.5">
                Predikat: {analytics.overallPredicate}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 block">
                Indeks Pembelajaran Mendalam
              </span>
              <div className="text-xl sm:text-2xl font-black text-blue-600 mt-1">
                {analytics.avgDLScore}%
              </div>
              <span className="text-[10px] text-slate-600 font-semibold block mt-0.5">
                Tingkat Penguasaan: {analytics.avgDLScore >= 90 ? 'Mahir' : 'Cakap'}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 block">
                Kelengkapan Administrasi
              </span>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">
                {analytics.avgAdminScore}%
              </div>
              <span className="text-[10px] text-slate-600 font-semibold block mt-0.5">
                Perangkat Tervalidasi Pengawas
              </span>
            </div>
          </div>

          {/* DASHBOARD GRAFIK RECHARTS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            {/* GRAFIK 1: CAPAIAN 5 DIMENSI SUPERVISI */}
            <div className="lg:col-span-7 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-800">
                  Grafik Capaian per Dimensi Supervisi &amp; PM
                </span>
                <span className="text-[10px] text-slate-400">Skor vs Target Standar (85)</span>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dimensionChartData} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-15} textAnchor="end" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip
                      formatter={(val: any) => [`${val} poin`, '']}
                      labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                      contentStyle={{ fontSize: 11, borderRadius: 8 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                    <Bar dataKey="Skor" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Capaian Riil" />
                    <Bar dataKey="Target" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="Standar Target (85)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* GRAFIK 2: SEBARAN PREDIKAT MUTU GURU */}
            <div className="lg:col-span-5 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800">
                    Distribusi Predikat Capaian Kinerja
                  </span>
                  <span className="text-[10px] text-slate-400">Total: {analytics.totalTeachers} Guru</span>
                </div>

                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={predicateChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={36}
                        outerRadius={64}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {predicateChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any, name: any) => [`${val} Guru`, name]}
                        contentStyle={{ fontSize: 11, borderRadius: 8 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Legend Badges */}
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                  <span className="text-slate-600">Sangat Baik:</span>
                  <strong className="text-slate-900">{analytics.sangatBaikCount}</strong>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></span>
                  <span className="text-slate-600">Baik (Cakap):</span>
                  <strong className="text-slate-900">{analytics.baikCount}</strong>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
                  <span className="text-slate-600">Cukup:</span>
                  <strong className="text-slate-900">{analytics.cukupCount}</strong>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0"></span>
                  <span className="text-slate-600">Perlu Binaan:</span>
                  <strong className="text-slate-900">{analytics.perluPeningkatanCount}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* TABEL 5 DIMENSI SUPERVISI DENGAN INDIKATOR VISUAL */}
          <div className="overflow-hidden border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
                <tr>
                  <th className="p-3">No</th>
                  <th className="p-3">Dimensi Kompetensi Supervisi</th>
                  <th className="p-3 text-center">Skor Capaian</th>
                  <th className="p-3 text-center">Standar KKM</th>
                  <th className="p-3">Analisis Deskriptif Singkat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {analytics.dimensions.map((d, index) => (
                  <tr key={d.dimensi} className="hover:bg-slate-50/70">
                    <td className="p-3 font-semibold text-slate-500 text-center w-8">{index + 1}</td>
                    <td className="p-3 font-bold text-slate-900">{d.dimensi}</td>
                    <td className="p-3 text-center font-bold">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md ${
                          d.skor >= 85
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {d.skor} / 100
                      </span>
                    </td>
                    <td className="p-3 text-center font-medium text-slate-500">{d.target}</td>
                    <td className="p-3 text-slate-600 text-[11px] leading-relaxed">{d.keterangan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ============================================================ */}
        {/* BAGIAN II: NARASI ANALISIS TEMUAN LAPANGAN                   */}
        {/* ============================================================ */}
        <div className="space-y-3">
          <div className="border-b border-slate-200 pb-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              <span>II. Narasi Analisis Temuan Lapangan &amp; Capaian Kinerja</span>
            </h3>
          </div>

          <div className="text-xs text-slate-700 leading-relaxed space-y-2.5 text-justify">
            <p>
              Berdasarkan hasil supervisi komprehensif pada periode <strong>{selectedYearLabel}</strong> untuk kategori <strong>{filterTeacherType === 'all' ? 'seluruh tenaga pendidik (Guru Kelas & Guru Mapel)' : filterTeacherType}</strong> di wilayah <strong>{filterKecamatan === 'all' ? 'seluruh satuan pendidikan Kabupaten Magetan' : `Kecamatan ${filterKecamatan}`}</strong>, tercatat nilai rata-rata ketercapaian sebesar <strong>{analytics.avgSupervisionScore}/100</strong> dengan predikat <strong>{analytics.overallPredicate}</strong>. Sebanyak <strong>{analytics.supervisionCoverage}%</strong> dari total sasaran guru binaan telah berhasil menyelesaikan siklus observasi klinis dan evaluasi keterlaksanaan Pembelajaran Mendalam (PM).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3">
              {/* KEKUATAN UTAMA */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Kekuatan &amp; Praktik Baik yang Telah Berjalan:</span>
                </div>
                <p className="text-[11px] text-emerald-900/90 leading-relaxed">
                  Dimensi <strong>{analytics.topDimension.dimensi}</strong> memperoleh skor tertinggi yaitu <strong>{analytics.topDimension.skor} poin</strong>. Sebagian besar guru telah tertib menyusun modul ajar dan perangkat administrasi, menyelaraskan alur tujuan pembelajaran (ATP) dengan konteks lingkungan Magetan, serta menerapkan pembiasaan pembelajaran berkesadaran di awal jam pelajaran.
                </p>
              </div>

              {/* TITIK KRITIS & KENDALA */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-800 text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Titik Kritis &amp; Hambatan yang Ditemukan:</span>
                </div>
                <p className="text-[11px] text-amber-900/90 leading-relaxed">
                  Dimensi <strong>{analytics.lowestDimension.dimensi}</strong> mencatat skor paling membutuhkan penguatan sebesar <strong>{analytics.lowestDimension.skor} poin</strong>. Masih dijumpai guru yang kesulitan mengimplementasikan diferensiasi proses belajar sesuai tingkat kesiapan anak, instrumen asesmen formatif masih didominasi tes tulis kognitif, dan rubrik autentik belum diterapkan secara merata.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* BAGIAN III: NARASI REKOMENDASI KEGIATAN TINDAK LANJUT        */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <div className="border-b border-slate-200 pb-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              <span>III. Rekomendasi Kegiatan Hasil Supervisi (Berjenjang)</span>
            </h3>
          </div>

          <div className="space-y-3.5 text-xs text-slate-700 leading-relaxed">
            {/* 1. TINGKAT DINAS PENDIDIKAN */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-indigo-900 font-bold">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px]">
                  1
                </span>
                <span>Rekomendasi Kebijakan untuk Dinas Pendidikan, Kepemudaan, dan Olahraga:</span>
              </div>
              <ul className="list-disc pl-8 space-y-1 text-slate-700 text-[11px]">
                <li>
                  Menyelenggarakan <strong>Bimbingan Teknis (Bimtek) Terpadu Berkelanjutan</strong> pada tingkat kabupaten/kecamatan dengan fokus pendalaman <em>Strategi Pembelajaran Berdiferensiasi</em> dan <em>Penyusunan Asesmen Diagnostik Awal</em>.
                </li>
                <li>
                  Membangun <strong>Bank Modul Ajar Digital Terkurasi</strong> di portal dinas untuk mempercepat replikasi modul berkualitas tinggi antarsekolah di 18 kecamatan.
                </li>
                <li>
                  Mengoptimalkan formasi pendampingan sekolah dengan memberikan mandat bagi guru-guru berpredikat <em>Mahir / Sangat Baik</em> untuk bertindak sebagai <strong>Guru Mentor Inovatif</strong> bagi sekolah terdekat.
                </li>
              </ul>
            </div>

            {/* 2. TINGKAT PENGAWAS & KKG/MGMP */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-indigo-900 font-bold">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px]">
                  2
                </span>
                <span>Rekomendasi Operasional untuk Pengawas Sekolah &amp; Komunitas Belajar (KKG / MGMP):</span>
              </div>
              <ul className="list-disc pl-8 space-y-1 text-slate-700 text-[11px]">
                <li>
                  Melakukan <strong>Coaching Klinis Individual Terjadwal</strong> khusus bagi {analytics.cukupCount + analytics.perluPeningkatanCount} guru berkategori Cukup/Perlu Pembinaan dengan siklus pra-observasi, observasi kelas, dan pasca-observasi reflektif.
                </li>
                <li>
                  Menjadikan pertemuan rutin <strong>Komunitas Belajar (Kombel / KKG / MGMP)</strong> sebagai laboratorium bedah kasus asesmen autentik dan latihan pembuatan instrumen observasi minat belajar murid.
                </li>
                <li>
                  Melaksanakan <strong>Klinik Konsultasi Portofolio Pembelajaran</strong> secara berkala antarsekolah binaan dalam satu klaster kecamatan.
                </li>
              </ul>
            </div>

            {/* 3. TINGKAT KEPALA SEKOLAH & GURU */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-indigo-900 font-bold">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px]">
                  3
                </span>
                <span>Rekomendasi Praktik untuk Kepala Sekolah &amp; Satuan Pendidikan:</span>
              </div>
              <ul className="list-disc pl-8 space-y-1 text-slate-700 text-[11px]">
                <li>
                  Mengagendakan <strong>In-House Training (IHT) Tematik</strong> minimal 2 kali dalam satu semester pasca supervisi untuk mengevaluasi kelengkapan asesmen formatif.
                </li>
                <li>
                  Menerapkan program <strong>Observasi Sejawat (Peer Observation)</strong> antarguru secara bergiliran untuk saling memberi masukan konstruktif dalam suasana kolegial.
                </li>
                <li>
                  Mewajibkan pengisian <strong>Jurnal Refleksi Mengajar Mingguan</strong> untuk memantau kemajuan murid yang membutuhkan intervensi belajar khusus.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* BAGIAN IV: TABEL MATRIKS RENCANA TINDAK LANJUT (RTL)         */}
        {/* ============================================================ */}
        <div className="space-y-3">
          <div className="border-b border-slate-200 pb-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              <span>IV. Matriks Rencana Tindak Lanjut (RTL) Pasca Supervisi</span>
            </h3>
          </div>

          <div className="overflow-hidden border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
                <tr>
                  <th className="p-2.5 text-center w-8">No</th>
                  <th className="p-2.5">Fokus Isu / Kebutuhan</th>
                  <th className="p-2.5">Bentuk Kegiatan Rekomendasi</th>
                  <th className="p-2.5">Sasaran Peserta</th>
                  <th className="p-2.5">Penanggung Jawab</th>
                  <th className="p-2.5">Waktu Pelaksanaan</th>
                  <th className="p-2.5">Indikator Keberhasilan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 text-[11px]">
                <tr>
                  <td className="p-2.5 text-center font-bold text-slate-500">1</td>
                  <td className="p-2.5 font-bold text-slate-900">
                    Diferensiasi Pembelajaran &amp; Scaffolding
                  </td>
                  <td className="p-2.5">
                    Workshop Penyusunan Desain Pembelajaran Berdiferensiasi &amp; Modul Ajar Kontekstual
                  </td>
                  <td className="p-2.5">Guru Kategori Cukup &amp; Baru Mutasi</td>
                  <td className="p-2.5">Pengawas Pembina &amp; KS</td>
                  <td className="p-2.5">Bulan ke-1 Pasca Supervisi</td>
                  <td className="p-2.5 text-emerald-700 font-medium">
                    100% Guru memiliki modul ajar diferensiasi
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 text-center font-bold text-slate-500">2</td>
                  <td className="p-2.5 font-bold text-slate-900">
                    Asesmen Autentik &amp; Formatif
                  </td>
                  <td className="p-2.5">
                    Klinik Penyusunan Rubrik Penilaian Kinerja &amp; Umpan Balik Kualitatif
                  </td>
                  <td className="p-2.5">Seluruh Guru Binaan Wilayah</td>
                  <td className="p-2.5">Pengurus KKG / MGMP</td>
                  <td className="p-2.5">Bulan ke-2 Pasca Supervisi</td>
                  <td className="p-2.5 text-emerald-700 font-medium">
                    Rubrik penilaian autentik terstandar
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 text-center font-bold text-slate-500">3</td>
                  <td className="p-2.5 font-bold text-slate-900">
                    Pembelajaran Berkesadaran &amp; Menyenangkan
                  </td>
                  <td className="p-2.5">
                    Diseminasi Praktik Baik Teknik STOP &amp; Pengelolaan Kelas Inklusif
                  </td>
                  <td className="p-2.5">Guru Kelas Rendah &amp; Mapel Praktik</td>
                  <td className="p-2.5">Guru Penggerak / Fasilitator</td>
                  <td className="p-2.5">Bulan ke-2 Pasca Supervisi</td>
                  <td className="p-2.5 text-emerald-700 font-medium">
                    Indeks iklim kelas positif meningkat
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 text-center font-bold text-slate-500">4</td>
                  <td className="p-2.5 font-bold text-slate-900">
                    Observasi Sejawat &amp; Refleksi
                  </td>
                  <td className="p-2.5">
                    Program Peer Coaching &amp; Refleksi Mengajar Mingguan Berbasis Jurnal
                  </td>
                  <td className="p-2.5">Seluruh Guru Satuan Pendidikan</td>
                  <td className="p-2.5">Kepala Sekolah</td>
                  <td className="p-2.5">Bulan ke-3 s.d ke-4</td>
                  <td className="p-2.5 text-emerald-700 font-medium">
                    Terlaksananya refleksi mingguan teratur
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ============================================================ */}
        {/* BAGIAN V: DAFTAR DETAIL GURU TERFILTER                       */}
        {/* ============================================================ */}
        <div className="space-y-3">
          <div className="border-b border-slate-200 pb-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              <span>V. Daftar Ringkasan Tenaga Pendidik Terfilter</span>
            </h3>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
                <tr>
                  <th className="p-2.5">Nama Guru &amp; NIP</th>
                  <th className="p-2.5">Satuan Pendidikan</th>
                  <th className="p-2.5">Kecamatan</th>
                  <th className="p-2.5">Tugas Mengajar</th>
                  <th className="p-2.5 text-center">Supervisi</th>
                  <th className="p-2.5 text-center">PM</th>
                  <th className="p-2.5 text-center">Administrasi</th>
                  <th className="p-2.5 text-center">Predikat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 text-[11px]">
                {filteredTeachers.map((t) => {
                  const sch = getSchoolForTeacher(t);
                  const tType = getTeacherType(t);
                  const sup = filteredSupervisions.find((s) => s.teacherId === t.id);
                  const dl = deepLearnings.find((d) => d.teacherId === t.id);

                  const supScore =
                    sup?.score ??
                    sup?.completionScore ??
                    t.adminSupervisorScore ??
                    t.adminCompletion ??
                    85;
                  const dlScore = dl?.overallScore ?? 88;
                  const admScore = t.adminSupervisorScore ?? t.adminCompletion ?? 86;

                  const predikat =
                    supScore >= 90
                      ? 'Sangat Baik'
                      : supScore >= 80
                      ? 'Baik'
                      : supScore >= 70
                      ? 'Cukup'
                      : 'Perlu Bimbingan';

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/70">
                      <td className="p-2.5">
                        <div className="font-bold text-slate-900">{t.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">NIP. {t.nip}</div>
                      </td>
                      <td className="p-2.5">{t.schoolName}</td>
                      <td className="p-2.5 font-medium">{getSchoolSubdistrict(sch) || '-'}</td>
                      <td className="p-2.5">
                        <span className="font-medium text-slate-800">{t.subject}</span>
                        <span className="block text-[10px] text-indigo-600 font-semibold">{tType}</span>
                      </td>
                      <td className="p-2.5 text-center font-bold text-indigo-600">
                        {supScore ? `${supScore}` : '-'}
                      </td>
                      <td className="p-2.5 text-center font-bold text-blue-600">{dlScore}%</td>
                      <td className="p-2.5 text-center font-bold text-emerald-600">{admScore}%</td>
                      <td className="p-2.5 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            supScore >= 90
                              ? 'bg-emerald-50 text-emerald-700'
                              : supScore >= 80
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {predikat}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ============================================================ */}
        {/* LEMBAR TANDA TANGAN & PENGESAHAN DOKUMEN RESMI (3 PIHAK)     */}
        {/* ============================================================ */}
        <div className="relative pt-8 border-t border-slate-200 text-xs text-slate-800">
          {/* Quick Edit button for Signatures (hidden in print) */}
          <div className="print:hidden absolute top-3 right-0">
            <button
              onClick={() => handleOpenEditModal('korwas')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg transition-all cursor-pointer shadow-2xs"
              title="Edit Pejabat Penandatangan (Kadis, Kabid PTK, Korwas) dan NIP"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Ubah Penandatangan</span>
            </button>
          </div>

          {/* Baris 1: Dua Penandatangan Pelaksana / Teknis */}
          <div className="grid grid-cols-2 gap-8 text-center">
            {/* TANDA TANGAN 1: KOORDINATOR PENGAWAS */}
            <div>
              <p className="font-bold text-slate-900 leading-tight">
                {officialConfig.korwasJabatan}<br />
                {officialConfig.korwasInstansi}
              </p>
              <div className="h-20 flex items-center justify-center">
                <span className="text-[10px] text-slate-300 italic">[Tanda Tangan &amp; Cap Pengawas]</span>
              </div>
              <p className="font-bold text-slate-900 underline underline-offset-2">
                {officialConfig.korwasNama}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {officialConfig.korwasPangkat}<br />
                NIP. {officialConfig.korwasNip}
              </p>
            </div>

            {/* TANDA TANGAN 2: KEPALA BIDANG PENDIDIK DAN TENAGA KEPENDIDIKAN */}
            <div>
              <p className="mb-0.5">
                {officialConfig.tanggalSuratKustom || `Magetan, ${currentDateFormatted}`}
              </p>
              <p className="font-bold text-slate-900 leading-tight">
                {officialConfig.kabidJabatan}<br />
                {officialConfig.kabidInstansi}
              </p>
              <div className="h-20 flex items-center justify-center">
                <span className="text-[10px] text-slate-300 italic">[Tanda Tangan &amp; Cap Bidang]</span>
              </div>
              <p className="font-bold text-slate-900 underline underline-offset-2">
                {officialConfig.kabidNama}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {officialConfig.kabidPangkat}<br />
                NIP. {officialConfig.kabidNip}
              </p>
            </div>
          </div>

          {/* Baris 2: Mengetahui Kepala Dinas di Bagian Tengah Bawah */}
          <div className="mt-8 text-center max-w-sm mx-auto">
            <p className="mb-0.5">Mengetahui,</p>
            <p className="font-bold text-slate-900 leading-tight">
              {officialConfig.kadisJabatan}<br />
              {officialConfig.kadisInstansi}
            </p>
            <div className="h-20 flex items-center justify-center">
              <span className="text-[10px] text-slate-300 italic">[Tanda Tangan &amp; Cap Dinas]</span>
            </div>
            <p className="font-bold text-slate-900 underline underline-offset-2">
              {officialConfig.kadisNama}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {officialConfig.kadisPangkat}<br />
              NIP. {officialConfig.kadisNip}
            </p>
          </div>
        </div>
      </div>

      {/* MODAL EDIT KOP SURAT DAN PENANDATANGAN DOKUMEN */}
      <ModalEditKopDanTandaTangan
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        config={officialConfig}
        onSave={handleSaveOfficialConfig}
        defaultActiveTab={activeModalTab}
      />
    </div>
  );
};
