import React, { useState, useEffect } from 'react';
import {
  User,
  Building2,
  Mail,
  Phone,
  BookOpen,
  Award,
  Calendar,
  CheckCircle2,
  FileText,
  Clock,
  ArrowRightLeft,
  BrainCircuit,
  Sparkles,
  ExternalLink,
  Link2
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';
import { ProgressBar } from '../components/common/ProgressBar';
import { Teacher, LearningModule, SupervisionRequest, TeacherMutation } from '../types';

export const ProfilGuruView: React.FC = () => {
  const { currentUser, currentRole } = useAuth();

  const [activeTab, setActiveTab] = useState<'info' | 'modul' | 'supervisi' | 'mutasi'>('info');
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [supervisions, setSupervisions] = useState<SupervisionRequest[]>([]);
  const [mutations, setMutations] = useState<TeacherMutation[]>([]);

  const loadProfile = async () => {
    try {
      const teachers = await api.getTeachers();
      let targetTeacher: Teacher | undefined;

      if (currentRole === 'GURU' && currentUser) {
        targetTeacher = teachers.find(
          (t) => t.userId === currentUser.id || t.email === currentUser.email
        );
      }

      if (!targetTeacher) {
        targetTeacher = teachers[0];
      }

      setTeacher(targetTeacher || null);

      if (targetTeacher) {
        const [mods, sups, muts] = await Promise.all([
          api.getLearningModules({ teacherId: targetTeacher.id }),
          api.getSupervisionRequests({ teacherId: targetTeacher.id }),
          api.getMutations()
        ]);
        setModules(mods);
        setSupervisions(sups);
        setMutations(muts.filter((m) => m.teacherId === targetTeacher?.id));
      }
    } catch (err) {
      console.error('Error loading teacher profile:', err);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [currentUser, currentRole]);

  if (!teacher) {
    return (
      <div className="p-12 text-center text-slate-500">
        Memuat profil data guru...
      </div>
    );
  }

  return (
    <div id="profil-guru-view" className="space-y-6">
      {/* Profile Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-7 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-xs ring-2 ring-indigo-50">
            {teacher.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{teacher.name}</h2>
              <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200">
                {teacher.employmentStatus}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              NIP: {teacher.nip} • NUPTK: {teacher.nuptk || '-'}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-600">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {teacher.schoolName}
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                {teacher.subject}
              </span>
              <span className="flex items-center gap-1 font-semibold text-slate-700">
                Gol: {teacher.rankGrade} ({teacher.teachingHours} Jam/Minggu)
              </span>
            </div>
          </div>
        </div>

        <div className="flex md:flex-col items-center md:items-end gap-3 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
          <div className="text-left md:text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400">Kelengkapan Administrasi</span>
            <div className="text-2xl font-bold text-emerald-600 mt-0.5">
              {teacher.adminCompletion || 94}%
            </div>
          </div>
          <div className="w-32">
            <ProgressBar value={teacher.adminCompletion || 94} showValue={false} size="sm" />
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('info')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
            activeTab === 'info'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Informasi & Biodata
        </button>
        <button
          onClick={() => setActiveTab('modul')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
            activeTab === 'modul'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Modul Ajar ({modules.length})
        </button>
        <button
          onClick={() => setActiveTab('supervisi')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
            activeTab === 'supervisi'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Riwayat Supervisi ({supervisions.length})
        </button>
        <button
          onClick={() => setActiveTab('mutasi')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
            activeTab === 'mutasi'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Riwayat Penugasan & Mutasi ({mutations.length})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-100">
              Data Kepegawaian & Kualifikasi
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-400">Pendidikan Terakhir:</span>
                <span className="font-semibold text-slate-800">{teacher.educationLevel || 'S1 Pendidikan'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-400">Pangkat / Golongan:</span>
                <span className="font-semibold text-slate-800">{teacher.rankGrade}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-400">Status Sertifikasi Guru:</span>
                <span className="font-semibold text-emerald-700">Sudah Bersertifikasi Pendidik</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-400">Beban Mengajar:</span>
                <span className="font-semibold text-slate-800">{teacher.teachingHours} Jam Pelajaran (JP)</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-100">
              Kontak & Penugasan Satuan Pendidikan
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-400">Email Resmi:</span>
                <span className="font-semibold text-slate-800">{teacher.email || 'guru@kemdikbud.go.id'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-400">Nomor Telepon:</span>
                <span className="font-semibold text-slate-800">{teacher.phone || '0812-3456-7890'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-400">Sekolah Induk:</span>
                <span className="font-semibold text-slate-800">{teacher.schoolName}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'modul' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Daftar Tautan Modul Ajar (Google Drive)
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">{modules.length} Dokumen Ditautkan</span>
          </div>
          {modules.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">Belum ada modul ajar yang ditautkan.</p>
          ) : (
            <div className="space-y-3">
              {modules.map((m) => (
                <div key={m.id} className="p-3.5 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{m.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {m.subject} • {m.grade} • Ditautkan: {m.uploadDate}
                    </p>
                    {m.fileUrl && (
                      <div className="mt-1.5">
                        <a
                          href={m.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 hover:text-blue-900 hover:underline bg-blue-50 px-2 py-0.5 rounded border border-blue-200 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>{m.fileName || 'Buka di Google Drive'}</span>
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge status={m.status} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'supervisi' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-100">
            Riwayat Pelaksanaan Supervisi Akademik
          </h3>
          {supervisions.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">Belum ada jadwal supervisi tercatat.</p>
          ) : (
            <div className="space-y-3">
              {supervisions.map((s) => (
                <div key={s.id} className="p-3.5 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{s.subject} ({s.grade})</h4>
                    <p className="text-[11px] text-slate-500">
                      Tanggal: {s.approvedDate || s.proposedDate1} • Pengawas: {s.supervisorName || '-'}
                    </p>
                    {s.feedback && (
                      <p className="text-xs text-slate-600 mt-1 italic">"{s.feedback}"</p>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge status={s.status} size="sm" />
                    {s.score && (
                      <div className="text-sm font-bold text-emerald-600 mt-1">{s.score}/100</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'mutasi' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-100">
            Riwayat Surat Keputusan (SK) & Mutasi Antar Sekolah
          </h3>
          {mutations.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">Belum ada riwayat mutasi sekolah.</p>
          ) : (
            <div className="space-y-3">
              {mutations.map((mut) => (
                <div key={mut.id} className="p-3.5 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      {mut.fromSchoolName} ➔ {mut.toSchoolName}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      No. SK: {mut.skNumber} • TMT: {mut.effectiveDate}
                    </p>
                  </div>
                  <Badge status={mut.status} size="sm" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
