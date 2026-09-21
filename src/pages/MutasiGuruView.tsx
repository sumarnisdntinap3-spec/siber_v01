import React, { useState, useEffect } from 'react';
import {
  ArrowLeftRight,
  Building2,
  Users,
  Calendar,
  FileText,
  CheckCircle2,
  Clock,
  Search,
  Plus,
  ShieldAlert,
  History
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';
import { ExportButton } from '../components/common/ExportButton';
import { Teacher, School, TeacherMutation } from '../types';

export const MutasiGuruView: React.FC = () => {
  const { currentUser, currentRole, hasPermission } = useAuth();

  const [mutations, setMutations] = useState<TeacherMutation[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schools, setSchools] = useState<School[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [targetSchoolId, setTargetSchoolId] = useState('');
  const [mutationDate, setMutationDate] = useState(new Date().toISOString().split('T')[0]);
  const [skNumber, setSkNumber] = useState('800/124/403.101/2026');
  const [reason, setReason] = useState('Pemerataan & Kebutuhan Guru Mata Pelajaran');
  const [notes, setNotes] = useState('Ditetapkan berdasarkan SK Kepala Dinas Pendidikan');

  const loadData = async () => {
    try {
      const [mList, tList, sList] = await Promise.all([
        api.getMutations(),
        api.getTeachers(),
        api.getSchools()
      ]);
      setMutations(mList);
      setTeachers(tList);
      setSchools(sList);
    } catch (err) {
      console.error('Error loading mutation data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId);

  const handleSubmitMutation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher || !targetSchoolId) {
      alert('Mohon pilih guru dan sekolah tujuan mutasi.');
      return;
    }

    if (selectedTeacher.schoolId === targetSchoolId) {
      alert('Sekolah tujuan mutasi tidak boleh sama dengan sekolah asal guru saat ini.');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.processMutation({
        teacherId: selectedTeacher.id,
        fromSchoolId: selectedTeacher.schoolId,
        toSchoolId: targetSchoolId,
        mutationDate,
        skNumber,
        reason,
        notes,
        processedByUserId: currentUser?.id || 'u-dinas'
      });

      setIsModalOpen(false);
      setSelectedTeacherId('');
      setTargetSchoolId('');
      loadData();
      alert('Proses mutasi guru berhasil dieksekusi dan dicatat dalam riwayat kepegawaian.');
    } catch (err) {
      console.error('Error executing mutation:', err);
      alert('Gagal memproses mutasi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMutations = mutations.filter(
    (m) =>
      m.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.fromSchoolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.toSchoolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.skNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="mutasi-guru-view" className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Layanan Mutasi Guru Antar Satuan Pendidikan
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Pencatatan resmi perpindahan tugas guru. Sistem secara otomatis memperbarui keterhubungan sekolah, menjaga rekam jejak supervisi masa lalu, dan mendistribusikan notifikasi ke Kepala Sekolah asal & tujuan.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ExportButton data={mutations} fileName="rekap_riwayat_mutasi_guru" />
          {hasPermission('MUTATE_TEACHER') && (
            <button
              onClick={() => {
                setSelectedTeacherId(teachers[0]?.id || '');
                setTargetSchoolId(schools[1]?.id || '');
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Proses Mutasi Guru</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Mutasi Tercatat</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{mutations.length} Transaksi</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Sepanjang periode pelaksanaan aktif</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sekolah Asal Terlibat</p>
          <h3 className="text-2xl font-bold text-indigo-600 mt-1">
            {new Set(mutations.map((m) => m.fromSchoolId)).size} Sekolah
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Pelepasan tenaga pendidik</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sekolah Tujuan Penugasan</p>
          <h3 className="text-2xl font-bold text-emerald-600 mt-1">
            {new Set(mutations.map((m) => m.toSchoolId)).size} Sekolah
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Penerima penugasan baru</p>
        </div>
      </div>

      {/* History Table & Search */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-80">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari guru, nomor SK, atau sekolah..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="text-xs text-slate-500">
            Menampilkan <strong className="text-slate-900">{filteredMutations.length}</strong> data riwayat
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Tanggal & No. SK</th>
                <th className="px-4 py-3">Nama Guru & NIP</th>
                <th className="px-4 py-3">Sekolah Asal (Lama)</th>
                <th className="px-4 py-3">Sekolah Tujuan (Baru)</th>
                <th className="px-4 py-3">Alasan Mutasi</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMutations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Belum ada riwayat mutasi guru yang sesuai kriteria.
                  </td>
                </tr>
              ) : (
                filteredMutations.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{m.mutationDate}</div>
                      <div className="text-[10px] text-slate-500 font-mono">SK: {m.skNumber}</div>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900">
                      <div>{m.teacherName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">NIP: {m.nip}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-xs font-medium">
                        {m.fromSchoolName}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
                        {m.toSchoolName}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 max-w-xs">
                      <div>{m.reason}</div>
                      {m.notes && <div className="text-[10px] text-slate-400">{m.notes}</div>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Selesai
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Input Mutasi */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Formulir Penetapan Mutasi Guru"
        subtitle="Dinas Pendidikan & Kebudayaan"
        maxWidth="xl"
      >
        <form onSubmit={handleSubmitMutation} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Pilih Tenaga Pendidik / Guru *
            </label>
            <select
              required
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
            >
              <option value="">-- Pilih Guru yang akan Dimutasi --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} (NIP: {t.nip}) - Asal: {t.schoolName}
                </option>
              ))}
            </select>
          </div>

          {selectedTeacher && (
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1 text-xs text-blue-900">
              <p className="font-bold">Informasi Guru Terpilih:</p>
              <p>Mata Pelajaran: {selectedTeacher.subject} | Status: {selectedTeacher.employmentStatus}</p>
              <p>
                Sekolah Asal Saat Ini:{' '}
                <strong className="text-blue-800 underline">{selectedTeacher.schoolName}</strong>
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Satuan Pendidikan Tujuan Penugasan *
            </label>
            <select
              required
              value={targetSchoolId}
              onChange={(e) => setTargetSchoolId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
            >
              <option value="">-- Pilih Sekolah Tujuan Baru --</option>
              {schools
                .filter((s) => s.id !== selectedTeacher?.schoolId)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.level} - Kec. {s.subDistrict})
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nomor Surat Keputusan (SK) *
              </label>
              <input
                type="text"
                required
                value={skNumber}
                onChange={(e) => setSkNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono"
                placeholder="800/xxx/403.101/2026"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal Berlaku Efektif *
              </label>
              <input
                type="date"
                required
                value={mutationDate}
                onChange={(e) => setMutationDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Alasan Mutasi *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
            >
              <option value="Pemerataan & Kebutuhan Guru Mata Pelajaran">
                Pemerataan & Kebutuhan Guru Mata Pelajaran
              </option>
              <option value="Rotasi Berkala / Penyegaran Satuan Pendidikan">
                Rotasi Berkala / Penyegaran Satuan Pendidikan
              </option>
              <option value="Permohonan Mutasi Mandiri Guru">
                Permohonan Mutasi Mandiri Guru
              </option>
              <option value="Promosi & Penugasan Khusus">
                Promosi & Penugasan Khusus
              </option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Catatan / Arahan Dinas
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              placeholder="Catatan tambahan untuk Kepala Sekolah asal dan baru..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Memproses...' : 'Tetapkan & Eksekusi Mutasi'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
