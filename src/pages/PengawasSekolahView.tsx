import React, { useState, useEffect, useMemo } from 'react';
import {
  Award,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Building2,
  MapPin,
  School as SchoolIcon,
  Phone,
  Mail,
  FileText,
  KeyRound,
  Eye,
  Filter,
  Check,
  RotateCcw,
  Sparkles,
  Info,
  Download,
  Printer,
  ChevronRight,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';
import { ExportButton } from '../components/common/ExportButton';
import { Supervisor, School, MAGETAN_KECAMATAN, MagetanKecamatan, EducationLevelType } from '../types';

export const PengawasSekolahView: React.FC = () => {
  const { currentRole, currentUser, appSettings, hasPermission } = useAuth();

  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('ALL');
  const [selectedKecamatanFilter, setSelectedKecamatanFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const [selectedSupervisor, setSelectedSupervisor] = useState<Supervisor | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    nip: string;
    name: string;
    email: string;
    phone: string;
    gender: 'L' | 'P';
    rankGrade: string;
    levels: ('TK' | 'SD' | 'SMP')[];
    wilayahKecamatan: string[];
    specialization: string;
    skNumber: string;
    skDate: string;
    assignedSchoolIds: string[];
    status: 'active' | 'nonactive';
    notes: string;
  }>({
    nip: '',
    name: '',
    email: '',
    phone: '',
    gender: 'L',
    rankGrade: 'Pembina Tingkat I / IV/b',
    levels: ['SD'],
    wilayahKecamatan: ['Sukomoro'],
    specialization: 'Supervisi Mutu & Pembelajaran Mendalam',
    skNumber: '800/142/403.101/2026',
    skDate: '2026-01-05',
    assignedSchoolIds: [],
    status: 'active',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [spList, schList] = await Promise.all([
        api.getSupervisors(),
        api.getSchools()
      ]);
      setSupervisors(spList);
      setSchools(schList);
    } catch (err) {
      console.error('Error loading supervisor data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Quick stats calculation
  const stats = useMemo(() => {
    const total = supervisors.length;
    const active = supervisors.filter((s) => s.status === 'active' || s.status === 'Aktif').length;
    const tkCount = supervisors.filter((s) => s.levels?.includes('TK')).length;
    const sdCount = supervisors.filter((s) => s.levels?.includes('SD')).length;
    const smpCount = supervisors.filter((s) => s.levels?.includes('SMP')).length;

    // Unique subdistricts covered
    const coveredKecamatan = new Set<string>();
    supervisors.forEach((s) => {
      s.wilayahKecamatan?.forEach((k) => coveredKecamatan.add(k));
    });

    const totalAssignedSchools = supervisors.reduce((acc, curr) => acc + (curr.assignedSchoolIds?.length || 0), 0);

    return {
      total,
      active,
      tkCount,
      sdCount,
      smpCount,
      coveredKecamatanCount: coveredKecamatan.size,
      totalAssignedSchools
    };
  }, [supervisors]);

  // Filtered Supervisors
  const filteredSupervisors = useMemo(() => {
    return supervisors.filter((sp) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !searchQuery ||
        sp.name?.toLowerCase().includes(q) ||
        sp.nip?.includes(q) ||
        sp.email?.toLowerCase().includes(q) ||
        sp.phone?.includes(q) ||
        sp.wilayahKecamatan?.some((k) => k.toLowerCase().includes(q)) ||
        sp.assignedSchoolNames?.some((s) => s.toLowerCase().includes(q));

      const matchLevel =
        selectedLevelFilter === 'ALL' ||
        sp.levels?.includes(selectedLevelFilter as any);

      const matchKecamatan =
        selectedKecamatanFilter === 'ALL' ||
        sp.wilayahKecamatan?.includes(selectedKecamatanFilter);

      const isAktif = sp.status === 'active' || sp.status === 'Aktif';
      const matchStatus =
        selectedStatusFilter === 'ALL' ||
        (selectedStatusFilter === 'active' && isAktif) ||
        (selectedStatusFilter === 'nonactive' && !isAktif);

      return matchSearch && matchLevel && matchKecamatan && matchStatus;
    });
  }, [supervisors, searchQuery, selectedLevelFilter, selectedKecamatanFilter, selectedStatusFilter]);

  // Open Form for Adding
  const handleOpenAdd = () => {
    setSelectedSupervisor(null);
    setFormData({
      nip: '',
      name: '',
      email: '',
      phone: '',
      gender: 'L',
      rankGrade: 'Pembina Tingkat I / IV/b',
      levels: ['SD'],
      wilayahKecamatan: ['Sukomoro', 'Magetan'],
      specialization: 'Supervisi Mutu Pembelajaran & Kurikulum Merdeka',
      skNumber: `800/${Math.floor(100 + Math.random() * 899)}/403.101/2026`,
      skDate: new Date().toISOString().split('T')[0],
      assignedSchoolIds: [],
      status: 'active',
      notes: ''
    });
    setIsFormModalOpen(true);
  };

  // Open Form for Editing
  const handleOpenEdit = (sp: Supervisor) => {
    setSelectedSupervisor(sp);
    const lvls = Array.isArray(sp.levels)
      ? (sp.levels as ('TK' | 'SD' | 'SMP')[])
      : sp.levels
      ? [sp.levels as any]
      : ['SD'];
    const kecs = Array.isArray(sp.wilayahKecamatan)
      ? sp.wilayahKecamatan
      : sp.wilayahKecamatan
      ? [sp.wilayahKecamatan]
      : [];

    setFormData({
      nip: sp.nip || '',
      name: sp.name || '',
      email: sp.email || '',
      phone: sp.phone || '',
      gender: (sp.gender as any) || 'L',
      rankGrade: sp.rankGrade || 'Pembina Tingkat I / IV/b',
      levels: lvls,
      wilayahKecamatan: kecs,
      specialization: sp.specialization || 'Supervisi Mutu Pembelajaran',
      skNumber: sp.skNumber || '',
      skDate: sp.skDate || '',
      assignedSchoolIds: sp.assignedSchoolIds || [],
      status: sp.status === 'active' || sp.status === 'Aktif' ? 'active' : 'nonactive',
      notes: sp.notes || ''
    });
    setIsFormModalOpen(true);
  };

  // Save Supervisor (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.nip) {
      alert('Nama dan NIP pengawas wajib diisi!');
      return;
    }
    if (formData.levels.length === 0) {
      alert('Harap pilih setidaknya satu jenjang pembinaan (TK / SD / SMP)!');
      return;
    }
    if (formData.wilayahKecamatan.length === 0) {
      alert('Harap pilih setidaknya satu kecamatan wilayah kepengawasan di Magetan!');
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedSupervisor) {
        await api.updateSupervisor(selectedSupervisor.id, formData);
        setSuccessMessage(`Data Pengawas ${formData.name} berhasil diperbarui.`);
      } else {
        await api.createSupervisor(formData);
        setSuccessMessage(`Pengawas baru ${formData.name} berhasil ditambahkan.`);
      }
      setIsFormModalOpen(false);
      await loadData();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(`Gagal menyimpan data pengawas: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Supervisor
  const handleDeleteConfirm = async () => {
    if (!selectedSupervisor) return;
    setIsSubmitting(true);
    try {
      await api.deleteSupervisor(selectedSupervisor.id);
      setIsDeleteModalOpen(false);
      setSelectedSupervisor(null);
      setSuccessMessage('Data pengawas berhasil dihapus dari sistem.');
      await loadData();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(`Gagal menghapus pengawas: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset Password
  const handleResetPassword = async () => {
    if (!selectedSupervisor) return;
    try {
      await api.resetPassword(
        selectedSupervisor.userId || selectedSupervisor.id,
        currentUser?.name || 'Admin Dinas',
        currentUser?.id || 'u-dinas'
      );
      alert(`Kata sandi akun pengawas ${selectedSupervisor.name} berhasil direset ke sandi default.`);
      setIsResetPasswordModalOpen(false);
    } catch (err: any) {
      alert(`Gagal mereset kata sandi: ${err.message || err}`);
    }
  };

  // Toggle Level in Form
  const toggleLevel = (lvl: 'TK' | 'SD' | 'SMP') => {
    if (formData.levels.includes(lvl)) {
      if (formData.levels.length === 1) return; // minimal 1
      setFormData({ ...formData, levels: formData.levels.filter((l) => l !== lvl) });
    } else {
      setFormData({ ...formData, levels: [...formData.levels, lvl] });
    }
  };

  // Toggle Kecamatan in Form
  const toggleKecamatan = (kec: string) => {
    if (formData.wilayahKecamatan.includes(kec)) {
      setFormData({
        ...formData,
        wilayahKecamatan: formData.wilayahKecamatan.filter((k) => k !== kec)
      });
    } else {
      setFormData({
        ...formData,
        wilayahKecamatan: [...formData.wilayahKecamatan, kec]
      });
    }
  };

  // Select all 18 Kecamatan
  const selectAllKecamatan = () => {
    setFormData({
      ...formData,
      wilayahKecamatan: [...MAGETAN_KECAMATAN]
    });
  };

  // Clear all Kecamatan
  const clearAllKecamatan = () => {
    setFormData({
      ...formData,
      wilayahKecamatan: []
    });
  };

  // Toggle School Assignment
  const toggleSchool = (schoolId: string) => {
    if (formData.assignedSchoolIds.includes(schoolId)) {
      setFormData({
        ...formData,
        assignedSchoolIds: formData.assignedSchoolIds.filter((id) => id !== schoolId)
      });
    } else {
      setFormData({
        ...formData,
        assignedSchoolIds: [...formData.assignedSchoolIds, schoolId]
      });
    }
  };

  return (
    <div id="pengawas-sekolah-view" className="space-y-6 pb-12">
      {/* Notification Toast */}
      {successMessage && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between text-xs font-semibold animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-white/80 hover:text-white">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner & Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  Manajemen Pengawas Sekolah
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Dinas Pendidikan Kab. Magetan
                  </span>
                </h1>
                <p className="text-xs text-slate-500">
                  Kelola data pengawas satuan pendidikan jenjang <strong>TK, SD, SMP</strong> dan penetapan wilayah kepengawasan <strong>18 Kecamatan se-Kabupaten Magetan</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <ExportButton
              data={filteredSupervisors.map((s) => ({
                NIP: s.nip,
                'Nama Pengawas': s.name,
                'Pangkat/Gol': s.rankGrade || '-',
                'Jenjang Pembinaan': s.levels?.join(', ') || '-',
                'Wilayah Kecamatan Magetan': s.wilayahKecamatan?.join(', ') || '-',
                'Total Sekolah Binaan': s.assignedSchoolIds?.length || 0,
                'Daftar Sekolah': s.assignedSchoolNames?.join(', ') || '-',
                Email: s.email,
                Telepon: s.phone,
                Status: s.status === 'active' || s.status === 'Aktif' ? 'Aktif' : 'Nonaktif'
              }))}
              fileName="data_pengawas_sekolah_magetan"
            />

            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Cetak Rekap Wilayah</span>
            </button>

            {hasPermission('MANAGE_SUPERVISOR') && (
              <button
                id="btn-tambah-pengawas"
                onClick={handleOpenAdd}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-all hover:scale-102"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Pengawas Baru</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Pengawas</p>
            <p className="text-xl font-extrabold text-slate-900 mt-1">{stats.total} <span className="text-xs font-medium text-slate-500">Orang</span></p>
            <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">● {stats.active} Aktif Bertugas</p>
          </div>

          <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-100">
            <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Jenjang TK / PAUD</p>
            <p className="text-xl font-extrabold text-purple-900 mt-1">{stats.tkCount} <span className="text-xs font-medium text-purple-700">Pengawas</span></p>
            <p className="text-[10px] text-purple-700 font-semibold mt-0.5">Pendidikan Usia Dini</p>
          </div>

          <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100">
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Jenjang SD</p>
            <p className="text-xl font-extrabold text-blue-900 mt-1">{stats.sdCount} <span className="text-xs font-medium text-blue-700">Pengawas</span></p>
            <p className="text-[10px] text-blue-700 font-semibold mt-0.5">Sekolah Dasar</p>
          </div>

          <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Jenjang SMP</p>
            <p className="text-xl font-extrabold text-emerald-900 mt-1">{stats.smpCount} <span className="text-xs font-medium text-emerald-700">Pengawas</span></p>
            <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">Sekolah Menengah</p>
          </div>

          <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-100">
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Kecamatan Terbina</p>
            <p className="text-xl font-extrabold text-amber-900 mt-1">{stats.coveredKecamatanCount} / 18</p>
            <p className="text-[10px] text-amber-800 font-semibold mt-0.5">Wilayah Kab. Magetan</p>
          </div>

          <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100">
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Sekolah Binaan</p>
            <p className="text-xl font-extrabold text-indigo-900 mt-1">{stats.totalAssignedSchools} <span className="text-xs font-medium text-indigo-700">Satuan</span></p>
            <p className="text-[10px] text-indigo-700 font-semibold mt-0.5">Total Sekolah Binaan</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari nama pengawas, NIP, kecamatan Magetan, sekolah..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Jenjang Filter */}
            <select
              value={selectedLevelFilter}
              onChange={(e) => setSelectedLevelFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">Semua Jenjang</option>
              <option value="TK">Jenjang TK</option>
              <option value="SD">Jenjang SD</option>
              <option value="SMP">Jenjang SMP</option>
            </select>

            {/* Kecamatan Filter */}
            <select
              value={selectedKecamatanFilter}
              onChange={(e) => setSelectedKecamatanFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">Semua Kecamatan (18)</option>
              {MAGETAN_KECAMATAN.map((kec) => (
                <option key={kec} value={kec}>
                  Kec. {kec}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="nonactive">Nonaktif</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200/80 shrink-0">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                viewMode === 'cards'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kartu Wilayah
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tabel Master
            </button>
          </div>
        </div>

        {/* Active Filter Tags */}
        {(selectedLevelFilter !== 'ALL' || selectedKecamatanFilter !== 'ALL' || selectedStatusFilter !== 'ALL' || searchQuery) && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Filter Aktif:</span>
            {searchQuery && (
              <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium">
                Pencarian: "{searchQuery}"
              </span>
            )}
            {selectedLevelFilter !== 'ALL' && (
              <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-medium">
                Jenjang: {selectedLevelFilter}
              </span>
            )}
            {selectedKecamatanFilter !== 'ALL' && (
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
                Kecamatan: {selectedKecamatanFilter}
              </span>
            )}
            {selectedStatusFilter !== 'ALL' && (
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                Status: {selectedStatusFilter === 'active' ? 'Aktif' : 'Nonaktif'}
              </span>
            )}
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedLevelFilter('ALL');
                setSelectedKecamatanFilter('ALL');
                setSelectedStatusFilter('ALL');
              }}
              className="text-[11px] font-semibold text-rose-600 hover:underline ml-1"
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-600">Memuat data pengawas sekolah...</p>
        </div>
      ) : filteredSupervisors.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">Tidak ada data pengawas ditemukan</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Tidak ditemukan pengawas dengan kriteria pencarian yang Anda tentukan. Coba ubah kata kunci atau tambah pengawas baru.
          </p>
          {hasPermission('MANAGE_SUPERVISOR') && (
            <button
              onClick={handleOpenAdd}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Pengawas Baru</span>
            </button>
          )}
        </div>
      ) : viewMode === 'cards' ? (
        /* CARD GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSupervisors.map((sp) => {
            const isAktif = sp.status === 'active' || sp.status === 'Aktif';
            return (
              <div
                key={sp.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-5 space-y-4">
                  {/* Top: Header Card */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white font-extrabold text-base flex items-center justify-center shadow-xs shrink-0">
                        {sp.name ? sp.name.charAt(0) : 'P'}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">
                          {sp.name}
                        </h3>
                        <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                          NIP: {sp.nip || '-'}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {sp.rankGrade || 'Pembina Tingkat I / IV/b'}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isAktif
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {isAktif ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>

                  {/* Jenjang Badges */}
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Jenjang Pembinaan
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {sp.levels && sp.levels.length > 0 ? (
                        sp.levels.map((lvl) => (
                          <span
                            key={lvl}
                            className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                              lvl === 'TK'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : lvl === 'SD'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            Jenjang {lvl}
                          </span>
                        ))
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px]">
                          Belum Ditentukan
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Wilayah Kecamatan Magetan */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-indigo-600" />
                        <span>Wilayah Kepengawasan Magetan</span>
                      </p>
                      <span className="text-[10px] font-bold text-slate-400">
                        {sp.wilayahKecamatan?.length || 0} Kecamatan
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {sp.wilayahKecamatan && sp.wilayahKecamatan.length > 0 ? (
                        sp.wilayahKecamatan.slice(0, 4).map((kec) => (
                          <span
                            key={kec}
                            className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200"
                          >
                            Kec. {kec}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Belum ada kecamatan terpilih</span>
                      )}
                      {sp.wilayahKecamatan && sp.wilayahKecamatan.length > 4 && (
                        <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                          +{sp.wilayahKecamatan.length - 4} lainnya
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Sekolah Binaan List */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <SchoolIcon className="w-3 h-3 text-emerald-600" />
                        <span>Sekolah Binaan</span>
                      </p>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                        {sp.assignedSchoolIds?.length || 0} Sekolah
                      </span>
                    </div>

                    <div className="space-y-1">
                      {sp.assignedSchoolNames && sp.assignedSchoolNames.length > 0 ? (
                        sp.assignedSchoolNames.slice(0, 2).map((schName, i) => (
                          <div
                            key={i}
                            className="text-xs font-semibold text-slate-800 truncate flex items-center gap-1.5"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            <span className="truncate">{schName}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">Belum ada sekolah yang ditugaskan</p>
                      )}
                      {sp.assignedSchoolNames && sp.assignedSchoolNames.length > 2 && (
                        <p className="text-[10px] font-bold text-indigo-600 pl-3">
                          + {sp.assignedSchoolNames.length - 2} sekolah binaan lainnya
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                    {sp.email && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{sp.email}</span>
                      </div>
                    )}
                    {sp.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{sp.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setSelectedSupervisor(sp);
                      setIsDetailModalOpen(true);
                    }}
                    className="flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-900 px-2.5 py-1.5 rounded-md hover:bg-indigo-50 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Rincian & SK</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {hasPermission('MANAGE_SUPERVISOR') && (
                      <>
                        <button
                          onClick={() => handleOpenEdit(sp)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit Data Pengawas"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSupervisor(sp);
                            setIsResetPasswordModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Reset Password Akun"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSupervisor(sp);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus Pengawas"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5">Nama & NIP Pengawas</th>
                  <th className="px-4 py-3.5">Jenjang</th>
                  <th className="px-4 py-3.5">Wilayah Kecamatan (Magetan)</th>
                  <th className="px-4 py-3.5">Pangkat / Golongan</th>
                  <th className="px-4 py-3.5">Sekolah Binaan</th>
                  <th className="px-4 py-3.5">Kontak</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSupervisors.map((sp) => {
                  const isAktif = sp.status === 'active' || sp.status === 'Aktif';
                  return (
                    <tr key={sp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                            {sp.name ? sp.name.charAt(0) : 'P'}
                          </div>
                          <div>
                            <div>{sp.name}</div>
                            <div className="text-[10px] font-mono text-slate-400 font-normal">NIP: {sp.nip}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {sp.levels?.map((lvl) => (
                            <span
                              key={lvl}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                lvl === 'TK'
                                  ? 'bg-purple-50 text-purple-700'
                                  : lvl === 'SD'
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {lvl}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="max-w-xs flex flex-wrap gap-1">
                          {sp.wilayahKecamatan && sp.wilayahKecamatan.length > 0 ? (
                            sp.wilayahKecamatan.map((kec) => (
                              <span
                                key={kec}
                                className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]"
                              >
                                {kec}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-slate-700 font-medium">
                        {sp.rankGrade || '-'}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-[11px]">
                          {sp.assignedSchoolIds?.length || 0} Sekolah
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-slate-500">
                        <div>{sp.phone || '-'}</div>
                        <div className="text-[10px] text-slate-400">{sp.email || '-'}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isAktif
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isAktif ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedSupervisor(sp);
                              setIsDetailModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                            title="Detail"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {hasPermission('MANAGE_SUPERVISOR') && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(sp)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedSupervisor(sp);
                                  setIsResetPasswordModalOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded"
                                title="Reset Password"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedSupervisor(sp);
                                  setIsDeleteModalOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                                title="Hapus"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: TAMBAH / EDIT PENGAWAS */}
      {/* ============================================================ */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={selectedSupervisor ? 'Edit Data Pengawas Sekolah' : 'Tambah Pengawas Sekolah Baru'}
        maxWidth="3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION 1: Identitas Pokok */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-100">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              <span>1. Identitas Pokok Pengawas</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap & Gelar *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Drs. H. Bambang Sutrisno, M.Pd."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  NIP (18 Digit) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="196803151992031004"
                  value={formData.nip}
                  onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jenis Kelamin
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                >
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pangkat & Golongan
                </label>
                <select
                  value={formData.rankGrade}
                  onChange={(e) => setFormData({ ...formData, rankGrade: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                >
                  <option value="Pembina / IV/a">Pembina / IV/a</option>
                  <option value="Pembina Tingkat I / IV/b">Pembina Tingkat I / IV/b</option>
                  <option value="Pembina Utama Muda / IV/c">Pembina Utama Muda / IV/c</option>
                  <option value="Pembina Utama Madya / IV/d">Pembina Utama Madya / IV/d</option>
                  <option value="Pembina Utama / IV/e">Pembina Utama / IV/e</option>
                  <option value="Penata Tingkat I / III/d">Penata Tingkat I / III/d</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Kedinasan / Aktif
                </label>
                <input
                  type="email"
                  placeholder="pengawas@pendidikan.magetan.go.id"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  No. Telepon / WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="081234567890"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Jenjang Kepengawasan (TK - SD - SMP) */}
          <div className="space-y-3 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>2. Jenjang Kepengawasan (TK - SD - SMP) *</span>
              </h4>
              <span className="text-[10px] text-indigo-700 font-semibold">
                Dapat memilih satu atau beberapa jenjang
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* TK */}
              <button
                type="button"
                onClick={() => toggleLevel('TK')}
                className={`p-3 rounded-xl border flex flex-col items-center text-center gap-1.5 transition-all ${
                  formData.levels.includes('TK')
                    ? 'bg-purple-600 text-white border-purple-700 shadow-xs font-bold'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300'
                }`}
              >
                <div className="flex items-center gap-1">
                  {formData.levels.includes('TK') && <Check className="w-3.5 h-3.5" />}
                  <span className="text-sm font-bold">Jenjang TK</span>
                </div>
                <span className={`text-[10px] ${formData.levels.includes('TK') ? 'text-purple-100' : 'text-slate-400'}`}>
                  Taman Kanak-Kanak / PAUD
                </span>
              </button>

              {/* SD */}
              <button
                type="button"
                onClick={() => toggleLevel('SD')}
                className={`p-3 rounded-xl border flex flex-col items-center text-center gap-1.5 transition-all ${
                  formData.levels.includes('SD')
                    ? 'bg-blue-600 text-white border-blue-700 shadow-xs font-bold'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center gap-1">
                  {formData.levels.includes('SD') && <Check className="w-3.5 h-3.5" />}
                  <span className="text-sm font-bold">Jenjang SD</span>
                </div>
                <span className={`text-[10px] ${formData.levels.includes('SD') ? 'text-blue-100' : 'text-slate-400'}`}>
                  Sekolah Dasar (Kelas 1-6)
                </span>
              </button>

              {/* SMP */}
              <button
                type="button"
                onClick={() => toggleLevel('SMP')}
                className={`p-3 rounded-xl border flex flex-col items-center text-center gap-1.5 transition-all ${
                  formData.levels.includes('SMP')
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs font-bold'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center gap-1">
                  {formData.levels.includes('SMP') && <Check className="w-3.5 h-3.5" />}
                  <span className="text-sm font-bold">Jenjang SMP</span>
                </div>
                <span className={`text-[10px] ${formData.levels.includes('SMP') ? 'text-emerald-100' : 'text-slate-400'}`}>
                  Sekolah Menengah Pertama
                </span>
              </button>
            </div>
          </div>

          {/* SECTION 3: Wilayah Kepengawasan (18 Kecamatan se-Kabupaten Magetan) */}
          <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  <span>3. Wilayah Kepengawasan (Kecamatan se-Kabupaten Magetan) *</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Pilih satu atau beberapa kecamatan binaan ({formData.wilayahKecamatan.length} dari 18 Kecamatan terpilih)
                </p>
              </div>

              {/* Quick actions for subdistricts */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={selectAllKecamatan}
                  className="px-2.5 py-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-200 transition-colors"
                >
                  Pilih Semua (18)
                </button>
                <button
                  type="button"
                  onClick={clearAllKecamatan}
                  className="px-2.5 py-1 text-[10px] font-bold text-slate-600 bg-white hover:bg-slate-100 rounded border border-slate-200 transition-colors"
                >
                  Kosongkan
                </button>
              </div>
            </div>

            {/* Grid 18 Kecamatan */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-2">
              {MAGETAN_KECAMATAN.map((kec) => {
                const isSelected = formData.wilayahKecamatan.includes(kec);
                return (
                  <button
                    type="button"
                    key={kec}
                    onClick={() => toggleKecamatan(kec)}
                    className={`p-2 rounded-lg text-xs font-medium border flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-700 font-bold shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <span className="truncate">{kec}</span>
                    {isSelected && <Check className="w-3 h-3 shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 4: Satuan Pendidikan Binaan */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <SchoolIcon className="w-4 h-4 text-emerald-600" />
                <span>4. Satuan Pendidikan Binaan (Opsional)</span>
              </h4>
              <span className="text-[10px] text-slate-500 font-semibold">
                {formData.assignedSchoolIds.length} Sekolah Ditugaskan
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50 space-y-1">
              {schools.length === 0 ? (
                <p className="text-xs text-slate-400 p-2 text-center">Belum ada data sekolah di database</p>
              ) : (
                schools.map((sch) => {
                  const isChecked = formData.assignedSchoolIds.includes(sch.id);
                  return (
                    <label
                      key={sch.id}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                          : 'bg-white border border-slate-100 text-slate-700 hover:bg-slate-100/80'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSchool(sch.id)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">{sch.name}</p>
                          <p className="text-[10px] text-slate-400">
                            NPSN: {sch.npsn} • Kec. {sch.subDistrict || '-'} ({sch.level})
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {sch.level}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* SECTION 5: SK & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nomor SK Penugasan
              </label>
              <input
                type="text"
                placeholder="800/142/403.101/2026"
                value={formData.skNumber}
                onChange={(e) => setFormData({ ...formData, skNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal Penetapan SK
              </label>
              <input
                type="date"
                value={formData.skDate}
                onChange={(e) => setFormData({ ...formData, skDate: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Status Keaktifan
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
              >
                <option value="active">Aktif Bertugas</option>
                <option value="nonactive">Nonaktif / Cuti</option>
              </select>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsFormModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Menyimpan...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{selectedSupervisor ? 'Simpan Perubahan' : 'Simpan Data Pengawas'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* ============================================================ */}
      {/* MODAL: DETAIL / SK PENUGASAN PENGAWAS */}
      {/* ============================================================ */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Rincian Profil & Wilayah Kepengawasan"
        maxWidth="2xl"
      >
        {selectedSupervisor && (
          <div className="space-y-5">
            {/* Header info */}
            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-extrabold text-lg flex items-center justify-center shrink-0">
                {selectedSupervisor.name?.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-slate-900">{selectedSupervisor.name}</h3>
                <p className="text-xs font-mono text-slate-500">NIP: {selectedSupervisor.nip}</p>
                <p className="text-xs text-slate-600 mt-0.5">{selectedSupervisor.rankGrade || '-'}</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                {selectedSupervisor.status === 'active' || selectedSupervisor.status === 'Aktif' ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>

            {/* Jenjang & Wilayah */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jenjang Binaan</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedSupervisor.levels?.map((lvl) => (
                    <span
                      key={lvl}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"
                    >
                      Jenjang {lvl}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Surat Keputusan (SK)</p>
                <p className="text-xs font-mono font-bold text-slate-800">
                  {selectedSupervisor.skNumber || '800/142/403.101/2026'}
                </p>
                <p className="text-[11px] text-slate-500">
                  Tanggal: {selectedSupervisor.skDate || '2026-01-05'}
                </p>
              </div>
            </div>

            {/* Wilayah Kecamatan */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-indigo-600" />
                <span>Wilayah Kepengawasan (Kecamatan di Kab. Magetan):</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {selectedSupervisor.wilayahKecamatan?.map((kec) => (
                  <span
                    key={kec}
                    className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200"
                  >
                    Kecamatan {kec}
                  </span>
                ))}
              </div>
            </div>

            {/* Sekolah Binaan */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <SchoolIcon className="w-4 h-4 text-emerald-600" />
                <span>Daftar Satuan Pendidikan Binaan:</span>
              </p>
              {selectedSupervisor.assignedSchoolNames && selectedSupervisor.assignedSchoolNames.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedSupervisor.assignedSchoolNames.map((sch, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-100 text-xs font-semibold flex items-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      <span>{sch}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Belum ada sekolah yang ditugaskan secara spesifik</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Tutup
              </button>
              {hasPermission('MANAGE_SUPERVISOR') && (
                <button
                  type="button"
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    handleOpenEdit(selectedSupervisor);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Pengawas</span>
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ============================================================ */}
      {/* MODAL: CETAK REKAP PENGAWAS */}
      {/* ============================================================ */}
      <Modal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="Cetak Rekap Wilayah Kepengawasan Magetan"
        maxWidth="2xl"
      >
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="text-center font-bold uppercase tracking-wider text-slate-900">
              PEMERINTAH KABUPATEN MAGETAN<br />
              DINAS PENDIDIKAN KEPEMUDAAN DAN OLAHRAGA<br />
              <span className="text-[11px] font-normal text-slate-600">
                Jl. Mayjen Sukowati No. 34 Magetan, Jawa Timur (Kode Pos 63314)
              </span>
            </div>
            <div className="h-0.5 bg-slate-800 my-2" />
            <p className="font-bold text-center text-slate-900">
              REKAPITULASI PENETAPAN WILAYAH KEPENGAWASAN SEKOLAH (TK-SD-SMP)
            </p>
          </div>

          <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[10px]">
                <tr>
                  <th className="p-2">No</th>
                  <th className="p-2">Nama Pengawas</th>
                  <th className="p-2">Jenjang</th>
                  <th className="p-2">Wilayah Kecamatan Magetan</th>
                  <th className="p-2">Sekolah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {supervisors.map((sp, idx) => (
                  <tr key={sp.id}>
                    <td className="p-2 font-mono text-center">{idx + 1}</td>
                    <td className="p-2 font-bold text-slate-900">{sp.name}</td>
                    <td className="p-2 font-semibold text-indigo-700">{sp.levels?.join(', ')}</td>
                    <td className="p-2 text-slate-600">{sp.wilayahKecamatan?.join(', ') || '-'}</td>
                    <td className="p-2 text-slate-600">{sp.assignedSchoolIds?.length || 0} Satuan</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsPrintModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={() => {
                window.print();
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Sekarang</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* ============================================================ */}
      {/* MODAL: RESET PASSWORD */}
      {/* ============================================================ */}
      <Modal
        isOpen={isResetPasswordModalOpen}
        onClose={() => setIsResetPasswordModalOpen(false)}
        title="Reset Kata Sandi Akun Pengawas"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Apakah Anda yakin ingin mereset kata sandi login untuk akun pengawas{' '}
            <strong className="text-slate-900">{selectedSupervisor?.name}</strong>?
          </p>
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800">
            Kata sandi akan direset ke password default sistem (<strong>pengawas</strong>).
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsResetPasswordModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleResetPassword}
              className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg"
            >
              Reset Kata Sandi
            </button>
          </div>
        </div>
      </Modal>

      {/* ============================================================ */}
      {/* MODAL: HAPUS PENGAWAS */}
      {/* ============================================================ */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Hapus Data Pengawas Sekolah"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Apakah Anda yakin ingin menghapus data pengawas{' '}
            <strong className="text-slate-900">{selectedSupervisor?.name}</strong> (NIP: {selectedSupervisor?.nip})?
          </p>
          <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-xs text-rose-800">
            Peringatan: Seluruh penugasan sekolah binaan dan wilayah kepengawasan pengawas ini akan dilepaskan secara otomatis.
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleDeleteConfirm}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
            >
              {isSubmitting ? 'Menghapus...' : 'Ya, Hapus Pengawas'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
