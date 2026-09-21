import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Award,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Search,
  Filter,
  ArrowRight,
  BookOpen,
  Edit2,
  ChevronRight,
  Printer,
  Calendar,
  User,
  Building2,
  ShieldCheck,
  Info,
  Layers,
  FileCheck
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip
} from 'recharts';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ProgressBar } from '../components/common/ProgressBar';
import { ExportButton } from '../components/common/ExportButton';
import { TeacherMindsetAssessment, Teacher } from '../types';

export const PolaPikirView: React.FC = () => {
  const { currentUser, currentRole } = useAuth();

  const [assessments, setAssessments] = useState<TeacherMindsetAssessment[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<TeacherMindsetAssessment | null>(null);
  const [myTeacherAssessment, setMyTeacherAssessment] = useState<TeacherMindsetAssessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');

  // Assessment Form Modal (for Principals/Supervisors/Dinas)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [targetTeacherId, setTargetTeacherId] = useState('');

  const [scores, setScores] = useState({
    opennessToChange: 4,
    resilience: 4,
    feedbackAcceptance: 4,
    continuousLearning: 4,
    beliefInStudents: 4
  });
  const [recommendations, setRecommendations] = useState('');
  const [principalNotes, setPrincipalNotes] = useState('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const isTeacher = currentRole === 'GURU';
      const schoolFilter =
        currentRole === 'KEPALA_SEKOLAH' || isTeacher
          ? currentUser?.schoolId
          : undefined;

      const [aList, tList] = await Promise.all([
        api.getMindsetAssessments({
          schoolId: schoolFilter,
          teacherId: isTeacher ? (currentUser?.id || currentUser?.nip) : undefined
        }),
        api.getTeachers(schoolFilter)
      ]);

      setAssessments(aList);
      setTeachers(tList);

      if (isTeacher && currentUser) {
        // Match the teacher's profile accurately
        const myT = tList.find(
          (t) =>
            t.userId === currentUser.id ||
            t.nip === currentUser.nip ||
            t.email === currentUser.email
        );

        // Find assessment specifically for this teacher
        let myAssess = aList.find(
          (a) =>
            a.teacherId === myT?.id ||
            a.teacherId === currentUser.id ||
            (myT?.name && a.teacherName?.toLowerCase().includes(myT.name.toLowerCase()))
        );

        // Fallback search in raw list if not found yet
        if (!myAssess && aList.length > 0) {
          myAssess = aList.find(
            (a) =>
              a.teacherName?.toLowerCase().includes(currentUser.name.toLowerCase()) ||
              (a.schoolId === currentUser.schoolId && aList.length === 1)
          );
        }

        setMyTeacherAssessment(myAssess || null);
        setSelectedAssessment(myAssess || null);
      } else if (aList.length > 0) {
        setSelectedAssessment(aList[0]);
      }
    } catch (err) {
      console.error('Error loading mindset data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentRole, currentUser]);

  // Live calculation of score & category for modal
  const totalScore =
    scores.opennessToChange +
    scores.resilience +
    scores.feedbackAcceptance +
    scores.continuousLearning +
    scores.beliefInStudents;
  const percentage = Math.round((totalScore / 20) * 100);

  const getCalculatedCategory = (pct: number) => {
    if (pct >= 85) return 'Pola Pikir Berkembang';
    if (pct >= 65) return 'Pola Pikir Berkembang dengan Pendampingan';
    return 'Pola Pikir Perlu Penguatan';
  };

  const handleSaveAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentRole === 'GURU') {
      alert('Akses dibatasi. Guru tidak memiliki kewenangan menginput penilaian.');
      return;
    }

    const t = teachers.find((tc) => tc.id === targetTeacherId);
    if (!t || !currentUser) return;

    try {
      await api.createMindsetAssessment({
        teacherId: t.id,
        teacherName: t.name,
        schoolId: t.schoolId,
        schoolName: t.schoolName,
        assessorName: currentUser.name,
        assessorRole: currentRole || 'KEPALA_SEKOLAH',
        assessmentDate: new Date().toISOString().split('T')[0],
        scores,
        recommendations:
          recommendations ||
          `Diberikan penugasan sebagai fasilitator berbagi praktik baik pembelajaran mendalam di tingkat sekolah.`,
        principalNotes:
          principalNotes || `Telah diobservasi dan menunjukkan komitmen belajar luar biasa.`
      });

      setIsFormModalOpen(false);
      loadData();
      alert('Asesmen Pemetaan Pola Pikir Guru berhasil disimpan!');
    } catch (err) {
      console.error('Error saving mindset assessment:', err);
    }
  };

  const getRadarData = (assess: TeacherMindsetAssessment | null) => {
    if (!assess) return [];
    const sc = assess.scores || {
      opennessToChange: 4,
      resilience: 4,
      feedbackAcceptance: 4,
      continuousLearning: 4,
      beliefInStudents: 4
    };

    return [
      { subject: 'Keterbukaan Perubahan', score: (sc.opennessToChange || 4) * 25, fullMark: 100 },
      { subject: 'Resiliensi & Daya Juang', score: (sc.resilience || 4) * 25, fullMark: 100 },
      { subject: 'Penerimaan Umpan Balik', score: (sc.feedbackAcceptance || 4) * 25, fullMark: 100 },
      { subject: 'Belajar Berkelanjutan', score: (sc.continuousLearning || 4) * 25, fullMark: 100 },
      { subject: 'Keyakinan Potensi Murid', score: (sc.beliefInStudents || 4) * 25, fullMark: 100 }
    ];
  };

  const handlePrint = () => {
    window.print();
  };

  // ==========================================
  // RENDER VIEW KHUSUS AKUN GURU (PERSONAL)
  // ==========================================
  if (currentRole === 'GURU') {
    const assess = myTeacherAssessment;
    const radarData = getRadarData(assess);
    const teacherScores = assess?.scores || {
      opennessToChange: 4,
      resilience: 4,
      feedbackAcceptance: 4,
      continuousLearning: 4,
      beliefInStudents: 4
    };

    const dimensionDetails = [
      {
        id: 1,
        title: '1. Keterbukaan Terhadap Perubahan & Inovasi',
        score: teacherScores.opennessToChange,
        maxScore: 4,
        pct: (teacherScores.opennessToChange / 4) * 100,
        desc: 'Antusias mencoba pendekatan pembelajaran inovatif, pemanfaatan media digital, dan implementasi kurikulum terkini.',
        note: 'Aktif merancang modul ajar berdiferensiasi dan terbuka terhadap paradigma pembelajaran aktif.'
      },
      {
        id: 2,
        title: '2. Resiliensi & Kegigihan Menghadapi Kendala Belajar',
        score: teacherScores.resilience,
        maxScore: 4,
        pct: (teacherScores.resilience / 4) * 100,
        desc: 'Memandang kesulitan atau kesalahan siswa sebagai bahan refleksi berharga untuk perbaikan berkelanjutan.',
        note: 'Sabar mendampingi siswa dengan beragam kecepatan belajar dan gigih mencari solusi alternatif.'
      },
      {
        id: 3,
        title: '3. Penerimaan Umpan Balik (Feedback) Supervisi',
        score: teacherScores.feedbackAcceptance,
        maxScore: 4,
        pct: (teacherScores.feedbackAcceptance / 4) * 100,
        desc: 'Terbuka menerima masukan dari Kepala Sekolah/Pengawas dan proaktif menindaklanjuti rekomendasi supervisi.',
        note: 'Selalu menanggapi catatan hasil observasi kelas dengan positif dan mengimplementasikan perbaikan.'
      },
      {
        id: 4,
        title: '4. Belajar Mandiri & Pengembangan Keprofesian (PKB)',
        score: teacherScores.continuousLearning,
        maxScore: 4,
        pct: (teacherScores.continuousLearning / 4) * 100,
        desc: 'Komitmen tinggi meningkatkan wawasan keilmuan melalui pelatihan mandiri, webinar, dan Komunitas Belajar (Kombel).',
        note: 'Konsisten berbagi praktik baik dalam forum kombel sekolah dan gugus.'
      },
      {
        id: 5,
        title: '5. Keyakinan Terhadap Potensi Berkembangnya Seluruh Siswa',
        score: teacherScores.beliefInStudents,
        maxScore: 4,
        pct: (teacherScores.beliefInStudents / 4) * 100,
        desc: 'Meyakini bahwa setiap anak memiliki potensi bertumbuh melalui motivasi, pendampingan, dan apresiasi yang tepat.',
        note: 'Memberikan apresiasi spesifik terhadap proses belajar dan usaha keras peserta didik.'
      }
    ];

    return (
      <div id="pola-pikir-guru-view" className="space-y-6">
        {/* Header Banner Guru */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Hasil Penilaian Pola Pikir (Growth Mindset) Saya
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Lembar profil kompetensi pola pikir adaptif pendidik yang diobservasi dan dinilai oleh Kepala Sekolah / Pengawas Pembina.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {assess && (
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors shadow-2xs"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Cetak / Ekspor Lembar Hasil</span>
              </button>
            )}
          </div>
        </div>

        {assess ? (
          <>
            {/* Hero Result Card */}
            <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-indigo-900/40 relative overflow-hidden">
              <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                {/* Col 1 & 2: Main Info & Category */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold border border-white/10">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Status Capaian Pola Pikir Pendidik</span>
                  </div>

                  <div>
                    <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                      {assess.category}
                    </h3>
                    <p className="text-slate-300 text-xs mt-1.5 leading-relaxed">
                      Berdasarkan instrumen supervisi klinis dan observasi komitmen belajar berkelanjutan di satuan pendidikan <strong>{assess.schoolName}</strong>.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Nama Guru</p>
                      <p className="text-xs font-bold text-white mt-0.5 truncate">{currentUser?.name}</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Penilai (Asesor)</p>
                      <p className="text-xs font-bold text-white mt-0.5 truncate">{assess.assessorName}</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/10 col-span-2 sm:col-span-1">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Tanggal Asesmen</p>
                      <p className="text-xs font-bold text-white mt-0.5">{assess.assessmentDate}</p>
                    </div>
                  </div>
                </div>

                {/* Col 3: Score Highlight Badge */}
                <div className="flex flex-col items-center justify-center p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 text-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">
                    Total Capaian Asesmen
                  </span>
                  <div className="text-4xl sm:text-5xl font-black text-white my-2">
                    {assess.percentage}%
                  </div>
                  <div className="px-3 py-1 bg-indigo-500/30 rounded-full text-xs font-semibold text-indigo-100 border border-indigo-400/30">
                    Skor: {assess.totalScore} dari 20 Poin Maksimal
                  </div>
                </div>
              </div>
            </div>

            {/* Content Breakdown: 5 Dimensions & Radar Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: 5 Indicators Breakdown */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Rincian Capaian 5 Dimensi Pola Pikir (Growth Mindset)
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Skala Penilaian: 1 (Kurang), 2 (Cukup), 3 (Baik), 4 (Sangat Baik)
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100">
                      5 / 5 Dimensi Terpetakan
                    </span>
                  </div>

                  <div className="space-y-4">
                    {dimensionDetails.map((dim) => (
                      <div
                        key={dim.id}
                        className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 hover:border-indigo-200 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="text-xs font-bold text-slate-900">{dim.title}</h4>
                          <span className="text-xs font-extrabold text-indigo-700 shrink-0">
                            {dim.score} / {dim.maxScore} ({dim.pct}%)
                          </span>
                        </div>

                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mb-2">
                          <div
                            className={`h-full rounded-full ${
                              dim.pct >= 85
                                ? 'bg-emerald-600'
                                : dim.pct >= 65
                                ? 'bg-indigo-600'
                                : 'bg-amber-600'
                            }`}
                            style={{ width: `${dim.pct}%` }}
                          />
                        </div>

                        <p className="text-[11px] text-slate-500 leading-relaxed">{dim.desc}</p>

                        <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-start gap-1.5 text-[11px] text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>
                            <strong>Catatan Observasi:</strong> {dim.note}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations and Principal Notes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Rekomendasi */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900 pb-2 border-b border-slate-100">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span>Rekomendasi Tindak Lanjut:</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed pt-1">
                      {assess.recommendations}
                    </p>
                  </div>

                  {/* Catatan KS */}
                  <div className="bg-indigo-50/70 p-5 rounded-xl border border-indigo-100 shadow-xs space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-950 pb-2 border-b border-indigo-200/60">
                      <CheckCircle2 className="w-4 h-4 text-indigo-700" />
                      <span>Catatan Khusus Kepala Sekolah:</span>
                    </div>
                    <p className="text-xs text-indigo-900 leading-relaxed italic pt-1">
                      "{assess.principalNotes || 'Pertahankan keteladanan mengajar dan kepemimpinan pembelajaran yang berpihak pada murid.'}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Right 1 Col: Radar Chart & Kategori Reference */}
              <div className="space-y-4">
                {/* Radar Chart */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <div className="pb-3 border-b border-slate-100 mb-3">
                    <h3 className="text-sm font-bold text-slate-900">Grafik Radar Pola Pikir</h3>
                    <p className="text-[11px] text-slate-500">Visualisasi keseimbangan 5 dimensi</p>
                  </div>

                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: '#64748b' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                        <Radar
                          name="Capaian Guru"
                          dataKey="score"
                          stroke="#4f46e5"
                          fill="#4f46e5"
                          fillOpacity={0.3}
                        />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Kategori Guide Reference */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Pedoman Kategori Pemetaan
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-950">
                      <p className="font-bold text-[11px]">1. Pola Pikir Berkembang (85 - 100%)</p>
                      <p className="text-[10px] text-emerald-800 mt-0.5 leading-snug">
                        Mandiri, adaptif, konsisten berefleksi, dan siap menjadi penggerak kombel.
                      </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-950">
                      <p className="font-bold text-[11px]">2. Dgn Pendampingan (65 - 84%)</p>
                      <p className="text-[10px] text-indigo-800 mt-0.5 leading-snug">
                        Menunjukkan adaptasi aktif namun memerlukan bimbingan teknis berkala.
                      </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-100 text-amber-950">
                      <p className="font-bold text-[11px]">3. Perlu Penguatan (&lt; 65%)</p>
                      <p className="text-[10px] text-amber-800 mt-0.5 leading-snug">
                        Membutuhkan coaching intensif dari Kepala Sekolah dan Pengawas.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Empty State Guru */
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 border border-indigo-100">
              <BrainCircuit className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Penilaian Pola Pikir Belum Tersedia
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1.5 leading-relaxed">
              Kepala Sekolah atau Pengawas Pembina belum menginput hasil pemetaan pola pikir untuk akun Anda pada periode tahun ajaran aktif ini. Hasil asesmen akan otomatis muncul di halaman ini setelah proses observasi supervisi diselesaikan.
            </p>
          </div>
        )}
      </div>
    );
  }

  // =========================================================
  // RENDER VIEW UNTUK KEPALA SEKOLAH, PENGAWAS, & ADMIN DINAS
  // =========================================================
  const filteredAssessments = assessments.filter((a) => {
    const matchQ =
      a.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.schoolName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategoryFilter ? a.category === selectedCategoryFilter : true;
    return matchQ && matchCat;
  });

  const radarData = getRadarData(selectedAssessment);

  return (
    <div id="pola-pikir-view" className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Instrumen Pemetaan Pola Pikir Guru (Growth Mindset)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Evaluasi 5 dimensi pola pikir adaptif pendidik dalam menyikapi kurikulum baru, resiliensi pembelajaran, penerimaan umpan balik, dan keyakinan potensi siswa.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ExportButton data={assessments} fileName="rekap_pola_pikir_guru" />
          {(currentRole === 'KEPALA_SEKOLAH' ||
            currentRole === 'PENGAWAS' ||
            currentRole === 'ADMIN_DINAS') && (
            <button
              onClick={() => {
                setTargetTeacherId(teachers[0]?.id || '');
                setScores({
                  opennessToChange: 4,
                  resilience: 4,
                  feedbackAcceptance: 4,
                  continuousLearning: 4,
                  beliefInStudents: 4
                });
                setRecommendations(
                  'Direkomendasikan memimpin komunitas belajar (Kombel) internal sekolah dalam modul inovatif PM.'
                );
                setPrincipalNotes('Menunjukkan antusiasme tinggi dalam implementasi kurikulum terkini.');
                setIsFormModalOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-xs transition-colors cursor-pointer"
            >
              <Award className="w-4 h-4" />
              <span>Input Asesmen Pola Pikir</span>
            </button>
          )}
        </div>
      </div>

      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Pola Pikir Berkembang
          </p>
          <h3 className="text-2xl font-bold text-emerald-600 mt-1">
            {
              assessments.filter(
                (a) => a.category.includes('Berkembang') && !a.category.includes('Pendampingan')
              ).length
            }{' '}
            Guru
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Kategori mandiri & unggul (85-100%)</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Dgn Pendampingan
          </p>
          <h3 className="text-2xl font-bold text-indigo-600 mt-1">
            {assessments.filter((a) => a.category.includes('Pendampingan')).length} Guru
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Kategori adaptasi aktif (65-84%)</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Perlu Penguatan
          </p>
          <h3 className="text-2xl font-bold text-amber-600 mt-1">
            {assessments.filter((a) => a.category.includes('Penguatan')).length} Guru
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Membutuhkan coaching intensif (&lt;65%)</p>
        </div>
      </div>

      {/* Content Layout: Table & Radar Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Table list */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari nama guru / sekolah..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Semua Kategori</option>
                <option value="Pola Pikir Berkembang">Pola Pikir Berkembang</option>
                <option value="Pola Pikir Berkembang dengan Pendampingan">Dgn Pendampingan</option>
                <option value="Pola Pikir Perlu Penguatan">Perlu Penguatan</option>
              </select>
            </div>

            <div className="text-xs text-slate-500">
              Total <strong className="text-slate-900">{filteredAssessments.length}</strong> guru terpetakan
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Nama Guru</th>
                  <th className="px-4 py-3">Satuan Pendidikan</th>
                  <th className="px-4 py-3">Skor & Persentase</th>
                  <th className="px-4 py-3">Kategori Pemetaan</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAssessments.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => setSelectedAssessment(a)}
                    className={`cursor-pointer transition-colors ${
                      selectedAssessment?.id === a.id ? 'bg-indigo-50/70' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="px-4 py-3.5 font-bold text-slate-900">
                      <div>{a.teacherName}</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        Penilai: {a.assessorName} ({a.assessmentDate})
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">{a.schoolName}</td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{a.percentage}%</div>
                      <div className="text-[10px] text-slate-400">Total Skor: {a.totalScore} / 20</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge status={a.category} size="sm" />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <ChevronRight className="w-4 h-4 text-slate-400 inline" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Radar Chart & Recommendations Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-5">
          <div>
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Profil Radar Pola Pikir</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedAssessment?.teacherName || 'Pilih Guru'}
                </p>
              </div>
              {selectedAssessment && <Badge status={selectedAssessment.category} size="sm" />}
            </div>

            {selectedAssessment ? (
              <>
                <div className="h-60 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: '#64748b' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                      <Radar
                        name="Capaian"
                        dataKey="score"
                        stroke="#4f46e5"
                        fill="#4f46e5"
                        fillOpacity={0.25}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3 mt-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                    <p className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Rekomendasi Tindak Lanjut:</span>
                    </p>
                    <p className="text-slate-600 leading-relaxed">{selectedAssessment.recommendations}</p>
                  </div>

                  <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-200 space-y-1">
                    <p className="font-bold text-indigo-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-700" />
                      <span>Catatan Khusus Kepala Sekolah:</span>
                    </p>
                    <p className="text-indigo-800 leading-relaxed italic">
                      "{selectedAssessment.principalNotes || 'Terus pertahankan dedikasi dan budaya reflektif.'}"
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-16 text-center text-xs text-slate-400">
                Pilih salah satu guru pada tabel untuk menampilkan grafik radar kompetensi pola pikir.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Input Asesmen Pola Pikir (Hanya untuk KS, Pengawas, Dinas) */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title="Formulir Asesmen Pemetaan Pola Pikir Guru"
        subtitle="Skala Penilaian 1 (Kurang) s/d 4 (Sangat Baik)"
        maxWidth="xl"
      >
        <form onSubmit={handleSaveAssessment} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Pilih Guru yang Dinilai *
            </label>
            <select
              required
              value={targetTeacherId}
              onChange={(e) => setTargetTeacherId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
            >
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.subject} - {t.schoolName})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100">
            {/* 1. Keterbukaan */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-800">
                  1. Keterbukaan terhadap perubahan kurikulum & inovasi
                </label>
                <span className="font-bold text-blue-600 text-xs">{scores.opennessToChange} / 4</span>
              </div>
              <input
                type="range"
                min="1"
                max="4"
                value={scores.opennessToChange}
                onChange={(e) => setScores({ ...scores, opennessToChange: parseInt(e.target.value) })}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            {/* 2. Resiliensi */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-800">
                  2. Resiliensi & kegigihan menghadapi kendala belajar siswa
                </label>
                <span className="font-bold text-blue-600 text-xs">{scores.resilience} / 4</span>
              </div>
              <input
                type="range"
                min="1"
                max="4"
                value={scores.resilience}
                onChange={(e) => setScores({ ...scores, resilience: parseInt(e.target.value) })}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            {/* 3. Penerimaan Umpan Balik */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-800">
                  3. Kemauan menerima umpan balik (feedback) supervisi
                </label>
                <span className="font-bold text-blue-600 text-xs">{scores.feedbackAcceptance} / 4</span>
              </div>
              <input
                type="range"
                min="1"
                max="4"
                value={scores.feedbackAcceptance}
                onChange={(e) => setScores({ ...scores, feedbackAcceptance: parseInt(e.target.value) })}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            {/* 4. Pembelajaran Mandiri */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-800">
                  4. Komitmen belajar mandiri & pengembangan keprofesian (PKB)
                </label>
                <span className="font-bold text-blue-600 text-xs">{scores.continuousLearning} / 4</span>
              </div>
              <input
                type="range"
                min="1"
                max="4"
                value={scores.continuousLearning}
                onChange={(e) => setScores({ ...scores, continuousLearning: parseInt(e.target.value) })}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            {/* 5. Keyakinan Potensi */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-800">
                  5. Kepercayaan terhadap potensi berkembangnya seluruh peserta didik
                </label>
                <span className="font-bold text-blue-600 text-xs">{scores.beliefInStudents} / 4</span>
              </div>
              <input
                type="range"
                min="1"
                max="4"
                value={scores.beliefInStudents}
                onChange={(e) => setScores({ ...scores, beliefInStudents: parseInt(e.target.value) })}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Live Preview of Calculated Grade */}
          <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-200 flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-800 font-bold">Kategori Otomatis Terhitung:</p>
              <p className="text-sm font-extrabold text-blue-950 mt-0.5">
                {getCalculatedCategory(percentage)}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xl font-black text-blue-700">{percentage}%</span>
              <span className="text-xs text-blue-600 block">({totalScore} / 20)</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Rekomendasi Tindak Lanjut</label>
            <textarea
              rows={2}
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              placeholder="Rekomendasi tindak lanjut pengembangan kompetensi guru..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Kepala Sekolah</label>
            <textarea
              rows={2}
              value={principalNotes}
              onChange={(e) => setPrincipalNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              placeholder="Catatan hasil observasi harian..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsFormModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer"
            >
              Simpan Hasil Asesmen
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
