import React, { useState, useEffect } from 'react';
import {
  FileBarChart,
  BarChart3,
  Download,
  Printer,
  FileSpreadsheet,
  Building2,
  Users,
  BookOpen,
  Calendar,
  Sparkles,
  BrainCircuit,
  CheckSquare,
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ExportButton } from '../components/common/ExportButton';
import { Badge } from '../components/common/Badge';
import { CetakLaporanSupervisiView } from '../components/reports/CetakLaporanSupervisiView';
import { DashboardRekapSupervisiView } from '../components/reports/DashboardRekapSupervisiView';

interface LaporanViewProps {
  initialMode?: 'dashboard' | 'cetak' | 'tabel';
}

export const LaporanView: React.FC<LaporanViewProps> = ({ initialMode = 'dashboard' }) => {
  const { currentRole, currentUser } = useAuth();

  const [viewMode, setViewMode] = useState<'dashboard' | 'cetak' | 'tabel'>(initialMode);
  const [activeReportTab, setActiveReportTab] = useState<
    'guru' | 'modul' | 'administrasi' | 'pola-pikir' | 'pm' | 'supervisi' | 'mutasi'
  >('guru');

  const [teachers, setTeachers] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [checklists, setChecklists] = useState<any[]>([]);
  const [mindsets, setMindsets] = useState<any[]>([]);
  const [deepLearnings, setDeepLearnings] = useState<any[]>([]);
  const [supervisions, setSupervisions] = useState<any[]>([]);
  const [mutations, setMutations] = useState<any[]>([]);

  const loadAllData = async () => {
    try {
      const [t, m, c, mind, dl, sup, mut] = await Promise.all([
        api.getTeachers(),
        api.getLearningModules(),
        api.getTeacherAdministrationChecklists(),
        api.getMindsetAssessments(),
        api.getDeepLearningAssessments(),
        api.getSupervisionRequests(),
        api.getMutations()
      ]);
      setTeachers(t);
      setModules(m);
      setChecklists(c);
      setMindsets(mind);
      setDeepLearnings(dl);
      setSupervisions(sup);
      setMutations(mut);
    } catch (err) {
      console.error('Error loading report data:', err);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  return (
    <div id="laporan-view" className="space-y-6">
      {/* Top View Mode Switcher (Print-Hidden) */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            id="tab-dashboard-rekap-supervisi"
            onClick={() => setViewMode('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              viewMode === 'dashboard'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileBarChart className="w-4 h-4 text-indigo-600" />
            <span>Rekap Dashboard &amp; Grafik Capaian</span>
          </button>

          <button
            id="tab-cetak-laporan-supervisi"
            onClick={() => setViewMode('cetak')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              viewMode === 'cetak'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Printer className="w-4 h-4 text-indigo-600" />
            <span>Cetak Lembar Resmi (PDF &amp; Word)</span>
          </button>

          <button
            id="tab-tabel-rekapitulasi-data"
            onClick={() => setViewMode('tabel')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              viewMode === 'tabel'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-500" />
            <span>Tabel Mentah (CSV / Spreadsheet)</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium px-3">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Sistem Pelaporan Terverifikasi Disdikpora</span>
        </div>
      </div>

      {/* VIEW MODE 1: REKAP DASHBOARD & GRAFIK CAPAIAN SESUAI PERIODE */}
      {viewMode === 'dashboard' && (
        <DashboardRekapSupervisiView
          onSwitchToCetak={() => setViewMode('cetak')}
          onSwitchToTabel={() => setViewMode('tabel')}
        />
      )}

      {/* VIEW MODE 2: CETAK LAPORAN SUPERVISI & REKOMENDASI (RESMI) */}
      {viewMode === 'cetak' && (
        <CetakLaporanSupervisiView onBackToTable={() => setViewMode('dashboard')} />
      )}

      {/* VIEW MODE 3: TABEL REKAPITULASI DATA MENTAH */}
      {viewMode === 'tabel' && (
        <div className="space-y-6">
          {/* Top Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <FileBarChart className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Pusat Rekapitulasi Data Tabel &amp; Ekspor CSV
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                Unduh berkas data mentah dalam format CSV / spreadsheet untuk kebutuhan analisis dan pengarsipan data.
              </p>
            </div>

            {/* Global Export Trigger */}
            <div className="flex items-center gap-3">
              <ExportButton
                data={
                  activeReportTab === 'guru'
                    ? teachers
                    : activeReportTab === 'modul'
                    ? modules
                    : activeReportTab === 'administrasi'
                    ? checklists
                    : activeReportTab === 'pola-pikir'
                    ? mindsets
                    : activeReportTab === 'pm'
                    ? deepLearnings
                    : activeReportTab === 'supervisi'
                    ? supervisions
                    : mutations
                }
                fileName={`laporan_${activeReportTab}_supervisi`}
              />
            </div>
          </div>

      {/* Report Module Selector Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200">
        <button
          onClick={() => setActiveReportTab('guru')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
            activeReportTab === 'guru' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Rekap Guru & Kepegawaian</span>
        </button>

        <button
          onClick={() => setActiveReportTab('modul')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
            activeReportTab === 'modul' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Rekap Modul Ajar</span>
        </button>

        <button
          onClick={() => setActiveReportTab('administrasi')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
            activeReportTab === 'administrasi'
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Kelengkapan Administrasi</span>
        </button>

        <button
          onClick={() => setActiveReportTab('pola-pikir')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
            activeReportTab === 'pola-pikir'
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BrainCircuit className="w-3.5 h-3.5" />
          <span>Pemetaan Pola Pikir</span>
        </button>

        <button
          onClick={() => setActiveReportTab('pm')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
            activeReportTab === 'pm' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Asesmen PM</span>
        </button>

        <button
          onClick={() => setActiveReportTab('supervisi')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
            activeReportTab === 'supervisi'
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Jadwal & Hasil Supervisi</span>
        </button>
      </div>

      {/* Table Data Preview */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 capitalize">
            Tabel Data Laporan: {activeReportTab.replace('-', ' ')}
          </h3>
          <span className="text-[11px] text-slate-400">Pratinjau Data Lengkap</span>
        </div>

        <div className="overflow-x-auto max-h-[500px]">
          {activeReportTab === 'guru' && (
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="px-4 py-3">Nama Lengkap & NIP</th>
                  <th className="px-4 py-3">Satuan Pendidikan</th>
                  <th className="px-4 py-3">Mata Pelajaran</th>
                  <th className="px-4 py-3">Pangkat / Golongan</th>
                  <th className="px-4 py-3">Status Pegawai</th>
                  <th className="px-4 py-3">Kelengkapan Adm</th>
                  <th className="px-4 py-3">Status Modul</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teachers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-bold text-slate-900">
                      <div>{t.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">NIP: {t.nip}</div>
                    </td>
                    <td className="px-4 py-3">{t.schoolName}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{t.subject}</td>
                    <td className="px-4 py-3">{t.rankGrade}</td>
                    <td className="px-4 py-3">{t.employmentStatus}</td>
                    <td className="px-4 py-3 font-bold text-emerald-600">{t.adminCompletion || 0}%</td>
                    <td className="px-4 py-3">
                      <Badge status={t.moduleStatus || 'BELUM_UPLOAD'} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReportTab === 'modul' && (
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="px-4 py-3">Judul Modul Ajar</th>
                  <th className="px-4 py-3">Penyusun / Guru</th>
                  <th className="px-4 py-3">Sekolah</th>
                  <th className="px-4 py-3">Mata Pelajaran & Jenjang</th>
                  <th className="px-4 py-3">Tanggal Unggah</th>
                  <th className="px-4 py-3">Status Verifikasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {modules.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-bold text-slate-900">{m.title}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{m.teacherName}</td>
                    <td className="px-4 py-3">{m.schoolName}</td>
                    <td className="px-4 py-3">
                      {m.subject} ({m.grade})
                    </td>
                    <td className="px-4 py-3">{m.uploadDate}</td>
                    <td className="px-4 py-3">
                      <Badge status={m.status} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReportTab === 'pola-pikir' && (
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="px-4 py-3">Nama Guru</th>
                  <th className="px-4 py-3">Satuan Pendidikan</th>
                  <th className="px-4 py-3">Skor Total</th>
                  <th className="px-4 py-3">Persentase</th>
                  <th className="px-4 py-3">Kategori Pola Pikir</th>
                  <th className="px-4 py-3">Rekomendasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mindsets.map((mind) => (
                  <tr key={mind.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-bold text-slate-900">{mind.teacherName}</td>
                    <td className="px-4 py-3">{mind.schoolName}</td>
                    <td className="px-4 py-3">{mind.totalScore} / 20</td>
                    <td className="px-4 py-3 font-bold text-blue-600">{mind.percentage}%</td>
                    <td className="px-4 py-3">
                      <Badge status={mind.category} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                      {mind.recommendations}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReportTab === 'pm' && (
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="px-4 py-3">Nama Guru</th>
                  <th className="px-4 py-3">Satuan Pendidikan</th>
                  <th className="px-4 py-3">Nilai Asesmen PM</th>
                  <th className="px-4 py-3">Tingkat Penguasaan</th>
                  <th className="px-4 py-3">Kekuatan Praktik</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deepLearnings.map((dl) => (
                  <tr key={dl.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-bold text-slate-900">{dl.teacherName}</td>
                    <td className="px-4 py-3">{dl.schoolName}</td>
                    <td className="px-4 py-3 font-extrabold text-indigo-600">{dl.overallScore}%</td>
                    <td className="px-4 py-3">
                      <Badge status={dl.masteryLevel} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                      {dl.strengthPoints}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReportTab === 'supervisi' && (
            <div>
              <div className="p-3 bg-indigo-50/70 border-b border-indigo-100 flex items-center justify-between gap-3 text-xs text-indigo-900">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    Tersedia <strong>Rekap Dashboard &amp; Grafik Capaian Supervisi</strong> komprehensif dengan filter per periode dan satuan pendidikan.
                  </span>
                </div>
                <button
                  onClick={() => setViewMode('dashboard')}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-colors shrink-0 cursor-pointer shadow-2xs"
                >
                  Buka Dashboard &amp; Grafik
                </button>
              </div>

              <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="px-4 py-3">Nama Guru & Mapel</th>
                  <th className="px-4 py-3">Satuan Pendidikan</th>
                  <th className="px-4 py-3">Tanggal Pelaksanaan</th>
                  <th className="px-4 py-3">Pengawas Bina</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Nilai Capaian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {supervisions.map((sup) => (
                  <tr key={sup.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-bold text-slate-900">
                      <div>{sup.teacherName}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{sup.subject}</div>
                    </td>
                    <td className="px-4 py-3">{sup.schoolName}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {sup.approvedDate || sup.proposedDate1}
                    </td>
                    <td className="px-4 py-3">{sup.supervisorName || '-'}</td>
                    <td className="px-4 py-3">
                      <Badge status={sup.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 font-extrabold text-emerald-600">
                      {sup.score ? `${sup.score}/100` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>
        </div>
      )}
    </div>
  );
};
