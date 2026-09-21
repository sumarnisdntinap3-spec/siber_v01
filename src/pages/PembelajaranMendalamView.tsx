import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Award,
  CheckCircle2,
  TrendingUp,
  Search,
  BookOpen,
  Eye,
  Sliders,
  ChevronRight,
  HelpCircle,
  Printer,
  Calendar,
  User,
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
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis
} from 'recharts';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ProgressBar } from '../components/common/ProgressBar';
import { ExportButton } from '../components/common/ExportButton';
import { DeepLearningAssessment, DeepLearningAspect, Teacher } from '../types';

export const PembelajaranMendalamView: React.FC = () => {
  const { currentUser, currentRole } = useAuth();

  const [aspects, setAspects] = useState<DeepLearningAspect[]>([]);
  const [assessments, setAssessments] = useState<DeepLearningAssessment[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<DeepLearningAssessment | null>(null);
  const [myAssessment, setMyAssessment] = useState<DeepLearningAssessment | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [targetTeacherId, setTargetTeacherId] = useState('');

  // Assessment Rubric Scores (1-4 scale)
  const [aspectScores, setAspectScores] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
  const [strengthPoints, setStrengthPoints] = useState('');
  const [improvementPoints, setImprovementPoints] = useState('');

  const loadData = async () => {
    try {
      const isTeacher = currentRole === 'GURU';
      const schoolFilter =
        currentRole === 'KEPALA_SEKOLAH' || isTeacher
          ? currentUser?.schoolId
          : undefined;

      const [aspList, aList, tList] = await Promise.all([
        api.getDeepLearningAspects(),
        api.getDeepLearningAssessments({
          schoolId: schoolFilter,
          teacherId: isTeacher ? (currentUser?.id || currentUser?.nip) : undefined
        }),
        api.getTeachers(schoolFilter)
      ]);

      setAspects(aspList);
      setAssessments(aList);
      setTeachers(tList);

      // Initialize default scores
      const initialMap: Record<string, number> = {};
      aspList.forEach((a) => {
        initialMap[a.id] = 4;
      });
      setAspectScores(initialMap);

      if (isTeacher && currentUser) {
        const myT = tList.find(
          (t) =>
            t.userId === currentUser.id ||
            t.nip === currentUser.nip ||
            t.email === currentUser.email
        );
        let myA = aList.find(
          (a) =>
            a.teacherId === myT?.id ||
            a.teacherId === currentUser.id ||
            (myT?.name && a.teacherName?.toLowerCase().includes(myT.name.toLowerCase()))
        );

        if (!myA && aList.length > 0) {
          myA = aList[0];
        }

        setMyAssessment(myA || null);
        setSelectedAssessment(myA || null);
      } else if (aList.length > 0) {
        setSelectedAssessment(aList[0]);
      }
    } catch (err) {
      console.error('Error loading deep learning data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentRole, currentUser]);

  // Overall calculations
  const aspectValues = Object.values(aspectScores) as number[];
  const totalScore = aspectValues.reduce((a, b) => a + (Number(b) || 0), 0);
  const maxPossible = (aspects.length || 10) * 4;
  const overallPercentage = Math.round((Number(totalScore) / Number(maxPossible)) * 100);

  const getMasteryCategory = (pct: number) => {
    if (pct >= 85) return 'Mahir';
    if (pct >= 70) return 'Cakap';
    if (pct >= 55) return 'Berkembang';
    return 'Mulai Terlihat';
  };

  const handleSaveAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentRole === 'GURU') {
      alert('Akses dibatasi. Guru tidak dapat menginput penilaian orang lain.');
      return;
    }

    const t = teachers.find((tc) => tc.id === targetTeacherId);
    if (!t || !currentUser) return;

    try {
      const rubricScores = aspects.map((a) => ({
        aspectId: a.id,
        aspectName: a.name,
        score: aspectScores[a.id] || 4,
        notes: ''
      }));

      await api.createDeepLearningAssessment({
        teacherId: t.id,
        teacherName: t.name,
        schoolId: t.schoolId,
        schoolName: t.schoolName,
        assessorName: currentUser.name,
        assessorRole: currentRole || 'KEPALA_SEKOLAH',
        assessmentDate: new Date().toISOString().split('T')[0],
        aspectScores: rubricScores,
        strengthPoints:
          strengthPoints ||
          'Kemampuan membangun atmosfer kelas yang ceria, interaktif, dan berkesadaran tinggi.',
        improvementPoints:
          improvementPoints ||
          'Penguatan asesmen diri (self-assessment) dan integrasi portofolio digital murid.',
        overallScore: overallPercentage,
        masteryLevel: getMasteryCategory(overallPercentage)
      });

      setIsFormModalOpen(false);
      loadData();
      alert('Hasil Asesmen Pembelajaran Mendalam (PM) berhasil disimpan.');
    } catch (err) {
      console.error('Error saving PM assessment:', err);
    }
  };

  const radarData = selectedAssessment
    ? selectedAssessment.aspectScores.map((a) => ({
        aspect: a.aspectName.split(' ')[0] + ' ' + (a.aspectName.split(' ')[1] || ''),
        score: a.score * 25,
        fullMark: 100
      }))
    : [];

  const handlePrint = () => {
    window.print();
  };

  // ==========================================
  // RENDER PERSONAL VIEW UNTUK AKUN GURU
  // ==========================================
  if (currentRole === 'GURU') {
    const assess = myAssessment;
    const teacherRadarData = assess
      ? assess.aspectScores.map((a) => ({
          aspect: a.aspectName.split(' ')[0] + ' ' + (a.aspectName.split(' ')[1] || ''),
          score: a.score * 25,
          fullMark: 100
        }))
      : [];

    return (
      <div id="pm-guru-view" className="space-y-6">
        {/* Header Guru */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Hasil Evaluasi 10 Aspek Pembelajaran Mendalam (PM) Saya
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Hasil observasi pelaksanaan pembelajaran bermakna, berkesadaran, dan menggembirakan sesuai standar Kurikulum Nasional.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {assess && (
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors shadow-2xs"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Cetak Lembar Asesmen</span>
              </button>
            )}
          </div>
        </div>

        {/* 10 Aspek Overview Pill Header */}
        <div className="bg-slate-900 text-white rounded-xl p-5 shadow-xs space-y-3 border border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold tracking-tight text-slate-100">
              Pilar Standar 10 Aspek Pembelajaran Mendalam
            </h3>
            <span className="px-2 py-0.5 rounded bg-white/10 text-slate-300 text-[10px] font-semibold">
              Kurikulum Nasional
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
            {aspects.map((asp, i) => (
              <div key={asp.id} className="p-2 bg-slate-800/80 rounded-lg border border-slate-700/60">
                <span className="text-[9px] font-bold text-indigo-400 block">Aspek #{i + 1}</span>
                <p className="text-[11px] font-medium text-slate-200 leading-tight mt-0.5">{asp.name}</p>
              </div>
            ))}
          </div>
        </div>

        {assess ? (
          <>
            {/* Hero Result Banner */}
            <div className="bg-linear-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-indigo-900/40 relative overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                <div className="lg:col-span-2 space-y-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold">
                    <Award className="w-3.5 h-3.5 text-amber-300" />
                    Tingkat Penguasaan Pembelajaran Mendalam
                  </span>

                  <div>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                      Tingkat: {assess.masteryLevel}
                    </h3>
                    <p className="text-slate-300 text-xs mt-1">
                      Dinilai oleh <strong>{assess.assessorName}</strong> pada tanggal {assess.assessmentDate} di {assess.schoolName}.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 text-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">
                    Skor Capaian PM
                  </span>
                  <div className="text-4xl sm:text-5xl font-black text-white my-2">
                    {assess.overallScore}%
                  </div>
                  <div className="w-32">
                    <ProgressBar value={assess.overallScore} showValue={false} size="sm" />
                  </div>
                </div>
              </div>
            </div>

            {/* Rubric Breakdown & Radar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: 10 Aspects Rubric */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 mb-4">
                    Rincian Penilaian Rubrik 10 Aspek Pembelajaran Mendalam
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {assess.aspectScores.map((asp, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-200 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span className="text-xs font-bold text-slate-800 leading-snug">
                            {idx + 1}. {asp.aspectName}
                          </span>
                          <span className="text-xs font-black text-indigo-600 shrink-0">
                            {asp.score} / 4
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full"
                            style={{ width: `${(asp.score / 4) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strengths & Improvement */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-emerald-50/80 p-5 rounded-xl border border-emerald-200 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-950 pb-2 border-b border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      <span>Kekuatan Praktik Pembelajaran:</span>
                    </div>
                    <p className="text-xs text-emerald-900 leading-relaxed pt-1">
                      {assess.strengthPoints}
                    </p>
                  </div>

                  <div className="bg-amber-50/80 p-5 rounded-xl border border-amber-200 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-950 pb-2 border-b border-amber-200">
                      <TrendingUp className="w-4 h-4 text-amber-700" />
                      <span>Rekomendasi Area Penguatan:</span>
                    </div>
                    <p className="text-xs text-amber-900 leading-relaxed pt-1">
                      {assess.improvementPoints}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right 1 Col: Radar Chart */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs h-fit space-y-3">
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Diagram Radar 10 Aspek</h3>
                  <p className="text-[11px] text-slate-500">Visualisasi profil penguasaan pedagogik PM</p>
                </div>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={teacherRadarData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="aspect" tick={{ fontSize: 9, fill: '#475569' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
                      <Radar
                        name="Skor Aspek"
                        dataKey="score"
                        stroke="#4f46e5"
                        fill="#4f46e5"
                        fillOpacity={0.25}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 border border-indigo-100">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Hasil Asesmen Pembelajaran Mendalam Belum Diinput
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1.5 leading-relaxed">
              Kepala Sekolah atau Pengawas Pembina belum melakukan asesmen rubrik 10 aspek PM untuk akun Anda pada semester ini.
            </p>
          </div>
        )}
      </div>
    );
  }

  // =========================================================
  // RENDER SUPERVISOR / PRINCIPAL / DINAS VIEW
  // =========================================================
  const filteredAssessments = assessments.filter(
    (a) =>
      a.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.schoolName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="pembelajaran-mendalam-view" className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Implementasi & Evaluasi 10 Aspek Pembelajaran Mendalam (PM)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Asesmen mutu praktik pembelajaran berkesadaran, bermakna, dan menggembirakan dengan instrumen rubrik penguasaan komprehensif.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ExportButton data={assessments} fileName="rekap_pembelajaran_mendalam" />
          {(currentRole === 'KEPALA_SEKOLAH' || currentRole === 'PENGAWAS' || currentRole === 'ADMIN_DINAS') && (
            <button
              onClick={() => {
                setTargetTeacherId(teachers[0]?.id || '');
                setIsFormModalOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-xs transition-colors cursor-pointer"
            >
              <Award className="w-4 h-4" />
              <span>Input Asesmen PM Guru</span>
            </button>
          )}
        </div>
      </div>

      {/* 10 Aspek Overview Grid Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-5 shadow-xs space-y-4 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold tracking-tight">
              Pilar Standar 10 Aspek Pembelajaran Mendalam
            </h3>
            <p className="text-[11px] text-slate-400">
              Kerangka acuan observasi kelas dan supervisi akademik terintegrasi
            </p>
          </div>
          <span className="px-2.5 py-0.5 rounded bg-white/10 text-slate-200 text-[11px] font-semibold border border-white/15">
            Kurikulum Nasional / PM
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
          {aspects.map((asp, i) => (
            <div key={asp.id} className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700/60">
              <span className="text-[10px] font-bold text-indigo-400 block">Aspek #{i + 1}</span>
              <p className="text-xs font-semibold text-slate-100 mt-0.5 leading-snug">{asp.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Table of Teachers Assessments */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div className="relative w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari guru atau sekolah..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="text-xs text-slate-500">
              Menampilkan <strong className="text-slate-900">{filteredAssessments.length}</strong> guru terasesmen
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Nama Guru</th>
                  <th className="px-4 py-3">Satuan Pendidikan</th>
                  <th className="px-4 py-3">Skor Capaian PM</th>
                  <th className="px-4 py-3">Tingkat Penguasaan</th>
                  <th className="px-4 py-3 text-right">Detail</th>
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
                        Asesor: {a.assessorName} ({a.assessmentDate})
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">{a.schoolName}</td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">
                      <div className="text-xs">{a.overallScore}%</div>
                      <div className="w-20 mt-1">
                        <ProgressBar value={a.overallScore} showValue={false} size="sm" />
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge status={a.masteryLevel} size="sm" />
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

        {/* Right 1 Col: Radar Chart & Strengths / Improvement feedback */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-5">
          <div>
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Diagram Radar PM</h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedAssessment?.teacherName || 'Pilih Guru'}</p>
              </div>
              {selectedAssessment && <Badge status={selectedAssessment.masteryLevel} size="sm" />}
            </div>

            {selectedAssessment ? (
              <>
                <div className="h-64 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="aspect" tick={{ fontSize: 9, fill: '#475569' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
                      <Radar
                        name="Skor Aspek"
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
                  <div className="p-3 bg-emerald-50/70 rounded-lg border border-emerald-200 space-y-1">
                    <p className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Kekuatan Praktik Pembelajaran:</span>
                    </p>
                    <p className="text-emerald-800 leading-relaxed">{selectedAssessment.strengthPoints}</p>
                  </div>

                  <div className="p-3 bg-amber-50/70 rounded-lg border border-amber-200 space-y-1">
                    <p className="font-bold text-amber-900 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-amber-700" />
                      <span>Rekomendasi Area Pengembangan:</span>
                    </p>
                    <p className="text-amber-800 leading-relaxed">{selectedAssessment.improvementPoints}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-16 text-center text-xs text-slate-400">
                Pilih guru pada tabel untuk menampilkan grafik 10 aspek pembelajaran mendalam.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Input Asesmen PM */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title="Instrumen Penilaian 10 Aspek Pembelajaran Mendalam"
        subtitle="Rubrik Observasi Kelas Standar Kurikulum Nasional"
        maxWidth="xl"
      >
        <form onSubmit={handleSaveAssessment} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Pilih Guru yang Diobservasi *
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
            <h4 className="text-xs font-bold text-slate-900">
              Skoring 10 Aspek Pembelajaran Mendalam (Skala 1 - 4)
            </h4>

            {aspects.map((asp, idx) => (
              <div key={asp.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-800">
                    {idx + 1}. {asp.name}
                  </span>
                  <span className="text-xs font-bold text-indigo-600">
                    {aspectScores[asp.id] || 4} / 4
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="4"
                  value={aspectScores[asp.id] || 4}
                  onChange={(e) =>
                    setAspectScores({
                      ...aspectScores,
                      [asp.id]: parseInt(e.target.value)
                    })
                  }
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            ))}
          </div>

          {/* Live Calculated */}
          <div className="p-3.5 bg-indigo-50 rounded-xl border border-indigo-200 flex items-center justify-between">
            <div>
              <p className="text-xs text-indigo-800 font-bold">Tingkat Penguasaan Terhitung:</p>
              <p className="text-sm font-extrabold text-indigo-950 mt-0.5">
                {getMasteryCategory(overallPercentage)}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xl font-black text-indigo-700">{overallPercentage}%</span>
              <span className="text-xs text-indigo-600 block">({totalScore} / {maxPossible})</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Kekuatan Praktik Pembelajaran
            </label>
            <textarea
              rows={2}
              value={strengthPoints}
              onChange={(e) => setStrengthPoints(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              placeholder="Catat kekuatan pembelajaran yang diobservasi..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Rekomendasi Area Pengembangan
            </label>
            <textarea
              rows={2}
              value={improvementPoints}
              onChange={(e) => setImprovementPoints(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              placeholder="Rekomendasi perbaikan untuk guru..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 sticky bottom-0 bg-white">
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
              Simpan Hasil Asesmen PM
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
