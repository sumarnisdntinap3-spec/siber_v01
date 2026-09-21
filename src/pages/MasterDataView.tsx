import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Award,
  Calendar,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  KeyRound,
  Eye,
  School as SchoolIcon,
  ShieldCheck,
  AlertTriangle,
  Upload,
  Download,
  FileSpreadsheet,
  Layers,
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ExportButton } from '../components/common/ExportButton';
import { UploadSekolahExcelModal } from '../components/common/UploadSekolahExcelModal';
import { downloadSchoolExcelTemplate } from '../utils/excelSchoolHelper';
import { UploadGuruExcelModal } from '../components/common/UploadGuruExcelModal';
import { downloadTeacherExcelTemplate } from '../utils/excelTeacherHelper';
import {
  GURU_MAPEL_LIST,
  CLASS_GRADES,
  detectTeacherType,
  TEACHER_TYPES
} from '../constants/teacherData';
import { School, Teacher, Supervisor, Principal, EducationYear } from '../types';

interface MasterDataViewProps {
  initialTab?: 'sekolah' | 'guru' | 'pengawas' | 'kepala-sekolah' | 'tahun';
}

export const MasterDataView: React.FC<MasterDataViewProps> = ({ initialTab = 'sekolah' }) => {
  const { currentRole, currentUser, activeEducationYear, setActiveEducationYearById, hasPermission } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<'sekolah' | 'guru' | 'pengawas' | 'kepala-sekolah' | 'tahun'>(
    initialTab
  );

  useEffect(() => {
    if (initialTab) {
      setActiveSubTab(initialTab);
    }
  }, [initialTab]);

  const [schools, setSchools] = useState<School[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [principals, setPrincipals] = useState<Principal[]>([]);
  const [educationYears, setEducationYears] = useState<EducationYear[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState('');
  const [selectedTeacherTypeFilter, setSelectedTeacherTypeFilter] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('');

  // Modals
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const [isDeleteSchoolModalOpen, setIsDeleteSchoolModalOpen] = useState(false);
  const [isDeletingSchool, setIsDeletingSchool] = useState(false);
  const [schoolToDelete, setSchoolToDelete] = useState<School | null>(null);
  const [isUploadExcelModalOpen, setIsUploadExcelModalOpen] = useState(false);
  const [isUploadGuruModalOpen, setIsUploadGuruModalOpen] = useState(false);
  const [uploadNotification, setUploadNotification] = useState<string | null>(null);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [isDeleteTeacherModalOpen, setIsDeleteTeacherModalOpen] = useState(false);
  const [isDeletingTeacher, setIsDeletingTeacher] = useState(false);
  const [isYearModalOpen, setIsYearModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);

  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Form States
  const [schoolForm, setSchoolForm] = useState<Partial<School>>({
    npsn: '',
    name: '',
    level: 'SD',
    address: '',
    subDistrict: 'Sukomoro',
    city: 'Kabupaten Magetan',
    principalName: '',
    supervisorId: '',
    phone: ''
  });

  const [teacherForm, setTeacherForm] = useState<Partial<Teacher>>({
    nip: '',
    name: '',
    gender: 'L',
    subject: '',
    rankGrade: 'Penata Muda / III/a',
    position: 'Guru Ahli Pertama',
    employmentStatus: 'PNS',
    email: '',
    phone: '',
    schoolId: '',
    joinYear: 2024
  });

  const [yearForm, setYearForm] = useState<Partial<EducationYear>>({
    name: '2026/2027',
    semester: 'Ganjil',
    startDate: '2026-07-15',
    endDate: '2026-12-20',
    isActive: true,
    notes: ''
  });

  const loadData = async () => {
    try {
      const [sList, tList, spList, pList, eyList] = await Promise.all([
        api.getSchools(),
        api.getTeachers(),
        api.getSupervisors(),
        api.getPrincipals(),
        api.getEducationYears()
      ]);
      setSchools(sList);
      setTeachers(tList);
      setSupervisors(spList);
      setPrincipals(pList);
      setEducationYears(eyList);
    } catch (err) {
      console.error('Error loading master data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save School
  const handleSaveSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedItem?.id) {
        await api.updateSchool(selectedItem.id, schoolForm);
      } else {
        await api.createSchool(schoolForm);
      }
      setIsSchoolModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Error saving school:', err);
    }
  };

  // Delete School
  const handleDeleteSchool = async () => {
    if (!schoolToDelete?.id) return;
    setIsDeletingSchool(true);
    try {
      await api.deleteSchool(schoolToDelete.id);
      setUploadNotification(`Satuan pendidikan "${schoolToDelete.name}" (NPSN: ${schoolToDelete.npsn}) berhasil dihapus.`);
      setIsDeleteSchoolModalOpen(false);
      setSchoolToDelete(null);
      await loadData();
    } catch (err: any) {
      console.error('Error deleting school:', err);
      alert(err.message || 'Gagal menghapus data satuan pendidikan.');
    } finally {
      setIsDeletingSchool(false);
    }
  };

  // Save Teacher
  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const type = teacherForm.teacherType || detectTeacherType(teacherForm.subject);
      const subjectToSave =
        type === 'Guru Kelas'
          ? (teacherForm.classGrade ? `Guru ${teacherForm.classGrade}` : teacherForm.subject || 'Guru Kelas')
          : (teacherForm.subject || 'PAI');

      const payload = {
        ...teacherForm,
        teacherType: type,
        subject: subjectToSave
      };

      if (selectedItem?.id) {
        await api.updateTeacher(selectedItem.id, payload);
        setUploadNotification(`Data guru "${payload.name}" berhasil diperbarui.`);
      } else {
        await api.createTeacher(payload);
        setUploadNotification(`Guru baru "${payload.name}" berhasil didaftarkan.`);
      }
      setIsTeacherModalOpen(false);
      loadData();
    } catch (err: any) {
      console.error('Error saving teacher:', err);
      alert(err.message || 'Gagal menyimpan data guru.');
    }
  };

  // Delete Teacher
  const handleDeleteTeacher = async () => {
    if (!selectedItem?.id) return;
    setIsDeletingTeacher(true);
    try {
      await api.deleteTeacher(selectedItem.id);
      setUploadNotification(`Data guru "${selectedItem.name}" berhasil dihapus.`);
      setIsDeleteTeacherModalOpen(false);
      setSelectedItem(null);
      await loadData();
    } catch (err) {
      console.error('Error deleting teacher:', err);
      alert('Gagal menghapus data guru.');
    } finally {
      setIsDeletingTeacher(false);
    }
  };

  // Save Education Year
  const handleSaveYear = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createEducationYear(yearForm);
      setIsYearModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Error saving education year:', err);
    }
  };

  // Reset Password
  const handleResetPassword = async () => {
    if (!selectedItem) return;
    try {
      await api.resetPassword(selectedItem.userId || selectedItem.id, currentUser?.name || 'Admin', currentUser?.id || 'u-dinas');
      alert(`Kata sandi akun ${selectedItem.name} berhasil direset.`);
      setIsResetPasswordModalOpen(false);
    } catch (err) {
      console.error('Error resetting password:', err);
    }
  };

  // Filtered lists
  const filteredSchools = schools.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.npsn.includes(searchQuery) ||
      s.principalName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTeachers = teachers.filter((t) => {
    const query = searchQuery.toLowerCase();
    const matchSearch =
      t.name.toLowerCase().includes(query) ||
      t.nip.includes(query) ||
      t.subject.toLowerCase().includes(query) ||
      t.schoolName.toLowerCase().includes(query);
    const matchSchool = selectedSchoolFilter ? t.schoolId === selectedSchoolFilter : true;

    // Type filter
    const tType = t.teacherType || detectTeacherType(t.subject);
    const matchType = selectedTeacherTypeFilter ? tType === selectedTeacherTypeFilter : true;

    // Subject filter
    const matchSubject = selectedSubjectFilter
      ? t.subject.toLowerCase().includes(selectedSubjectFilter.toLowerCase())
      : true;

    return matchSearch && matchSchool && matchType && matchSubject;
  });

  return (
    <div id="master-data-view" className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Pengelolaan Master Data Pendidikan
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Kelola data satuan pendidikan, data guru, pengawas bina, kepala sekolah, dan tahun pelaksanaan
          </p>
        </div>

        {/* Sub-tab switcher */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveSubTab('sekolah')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeSubTab === 'sekolah' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Sekolah ({schools.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('guru')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeSubTab === 'guru' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Guru ({teachers.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('pengawas')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeSubTab === 'pengawas' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Pengawas</span>
          </button>
          <button
            onClick={() => setActiveSubTab('tahun')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeSubTab === 'tahun' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Tahun Pelaksanaan</span>
          </button>
        </div>
      </div>

      {/* 1. TAB SEKOLAH */}
      {activeSubTab === 'sekolah' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Notification Banner */}
          {uploadNotification && (
            <div className="mx-4 sm:mx-5 mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium">{uploadNotification}</span>
              </div>
              <button
                type="button"
                onClick={() => setUploadNotification(null)}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 px-2 py-0.5 rounded hover:bg-emerald-100 transition-colors"
              >
                Tutup
              </button>
            </div>
          )}

          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-80">
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari nama sekolah / NPSN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ExportButton data={schools} fileName="data_satuan_pendidikan" />

              {/* Download Excel Template Button */}
              <button
                id="btn-download-school-template"
                type="button"
                onClick={downloadSchoolExcelTemplate}
                title="Unduh berkas template Excel resmi untuk pengisian data sekolah secara massal"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-300 rounded-md shadow-2xs transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Template Excel</span>
              </button>

              {/* Upload Excel Button */}
              {hasPermission('MANAGE_SCHOOL') && (
                <button
                  id="btn-upload-school-excel"
                  type="button"
                  onClick={() => setIsUploadExcelModalOpen(true)}
                  title="Unggah data satuan pendidikan secara serentak dari file Excel (.xlsx / .csv)"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-xs transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Unggah Serentak (Excel)</span>
                </button>
              )}

              {hasPermission('MANAGE_SCHOOL') && (
                <button
                  id="btn-add-school"
                  onClick={() => {
                    setSelectedItem(null);
                    setSchoolForm({
                      npsn: '',
                      name: '',
                      level: 'SD',
                      address: '',
                      subDistrict: 'Sukomoro',
                      city: 'Kabupaten Magetan',
                      principalName: '',
                      supervisorId: supervisors[0]?.id || '',
                      phone: ''
                    });
                    setIsSchoolModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Sekolah</span>
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">NPSN & Jenjang</th>
                  <th className="px-4 py-3">Nama Satuan Pendidikan</th>
                  <th className="px-4 py-3">Alamat & Kecamatan</th>
                  <th className="px-4 py-3">Kepala Sekolah</th>
                  <th className="px-4 py-3">Pengawas Bina</th>
                  <th className="px-4 py-3">Guru Aktif</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSchools.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-slate-900">
                      <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 mr-2 font-mono text-[10px]">
                        {s.level}
                      </span>
                      <span>{s.npsn}</span>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900">{s.name}</td>
                    <td className="px-4 py-3.5 text-slate-500">
                      <div>{s.address}</div>
                      <div className="text-[10px] text-slate-400">Kec. {s.subDistrict}, {s.city}</div>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-800">{s.principalName || '-'}</td>
                    <td className="px-4 py-3.5 text-slate-700">{s.supervisorName || '-'}</td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[11px]">
                        {s.teacherCount || 0} Guru
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {hasPermission('MANAGE_SCHOOL') && (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            id={`btn-edit-school-${s.id}`}
                            onClick={() => {
                              setSelectedItem(s);
                              setSchoolForm(s);
                              setIsSchoolModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            title="Edit Data Satuan Pendidikan"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`btn-delete-school-${s.id}`}
                            onClick={() => {
                              setSchoolToDelete(s);
                              setIsDeleteSchoolModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Hapus Satuan Pendidikan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. TAB GURU */}
      {activeSubTab === 'guru' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <div className="relative w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari nama, NIP, mapel..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <select
                value={selectedSchoolFilter}
                onChange={(e) => setSelectedSchoolFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 max-w-[180px]"
              >
                <option value="">Semua Sekolah</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedTeacherTypeFilter}
                onChange={(e) => setSelectedTeacherTypeFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Semua Jenis Guru</option>
                <option value="Guru Kelas">Guru Kelas</option>
                <option value="Guru Mapel">Guru Mapel</option>
              </select>

              <select
                value={selectedSubjectFilter}
                onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 max-w-[170px]"
              >
                <option value="">Semua Mata Pelajaran</option>
                {GURU_MAPEL_LIST.map((m) => (
                  <option key={m.code} value={m.name}>
                    {m.name} ({m.fullName})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                id="btn-download-teacher-template"
                onClick={downloadTeacherExcelTemplate}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-colors"
                title="Unduh template format Excel pengisian data guru"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Template Excel</span>
              </button>

              {hasPermission('MANAGE_TEACHER') && (
                <button
                  type="button"
                  id="btn-upload-teachers-excel"
                  onClick={() => setIsUploadGuruModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
                  title="Unggah berkas Excel data guru secara serentak"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Unggah Serentak (Excel)</span>
                </button>
              )}

              <ExportButton data={filteredTeachers} fileName="data_guru_supervisi" />

              {hasPermission('MANAGE_TEACHER') && (
                <button
                  id="btn-add-teacher"
                  onClick={() => {
                    setSelectedItem(null);
                    setTeacherForm({
                      nip: '',
                      nik: '',
                      nuptk: '',
                      name: '',
                      gender: 'L',
                      teacherType: 'Guru Kelas',
                      subject: 'Guru Kelas IV',
                      classGrade: 'Kelas 4',
                      rankGrade: 'Penata Muda / III/a',
                      position: 'Guru Ahli Pertama',
                      employmentStatus: 'PNS',
                      email: '',
                      phone: '',
                      schoolId: schools[0]?.id || '',
                      joinYear: 2024
                    });
                    setIsTeacherModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Guru Baru</span>
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Nama Lengkap & NIP</th>
                  <th className="px-4 py-3">Jenis & Tugas Mengajar</th>
                  <th className="px-4 py-3">Satuan Pendidikan</th>
                  <th className="px-4 py-3">Pangkat / Golongan</th>
                  <th className="px-4 py-3">Status Pegawai</th>
                  <th className="px-4 py-3">Kontak & Email</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTeachers.map((t) => {
                  const tType = t.teacherType || detectTeacherType(t.subject);
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        <div>{t.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          NIP: {t.nip} • {t.gender === 'P' ? 'Perempuan' : 'Laki-laki'}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                              tType === 'Guru Kelas'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-cyan-50 text-cyan-800 border-cyan-200'
                            }`}
                          >
                            {tType}
                          </span>
                          <span className="font-semibold text-slate-800">{t.subject}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">{t.schoolName}</td>
                      <td className="px-4 py-3.5 text-slate-600">
                        <div>{t.rankGrade}</div>
                        <div className="text-[10px] text-slate-400">{t.position}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[11px]">
                          {t.employmentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">
                        <div>{t.email}</div>
                        <div className="text-[10px] text-slate-400">{t.phone}</div>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {hasPermission('MANAGE_TEACHER') && (
                            <>
                              <button
                                onClick={() => {
                                  const detected = t.teacherType || detectTeacherType(t.subject);
                                  setSelectedItem(t);
                                  setTeacherForm({
                                    ...t,
                                    teacherType: detected,
                                    classGrade: detected === 'Guru Kelas' ? t.classGrade || t.subject : undefined
                                  });
                                  setIsTeacherModalOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                title="Edit Guru"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedItem(t);
                                  setIsResetPasswordModalOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                                title="Reset Password Default"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>
                              <button
                                id={`btn-delete-teacher-${t.id}`}
                                onClick={() => {
                                  setSelectedItem(t);
                                  setIsDeleteTeacherModalOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                title="Hapus Data Guru"
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

      {/* 3. TAB PENGAWAS */}
      {activeSubTab === 'pengawas' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Daftar Pengawas Sekolah & Wilayah Kepengawasan Magetan
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pengawas pembina satuan pendidikan jenjang TK, SD, dan SMP di 18 Kecamatan se-Kabupaten Magetan
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ExportButton data={supervisors} fileName="data_pengawas_sekolah" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {supervisors.map((sp) => (
              <div key={sp.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{sp.name}</h4>
                    <p className="text-xs text-slate-500 font-mono">NIP: {sp.nip}</p>
                    <p className="text-xs text-slate-500">{sp.email} • {sp.phone}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Aktif
                  </span>
                </div>

                {/* Jenjang */}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Jenjang Binaan:</p>
                  <div className="flex flex-wrap gap-1">
                    {sp.levels?.map((lvl) => (
                      <span
                        key={lvl}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          lvl === 'TK'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : lvl === 'SD'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        Jenjang {lvl}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Wilayah Kecamatan */}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Wilayah Kecamatan (Magetan):</p>
                  <div className="flex flex-wrap gap-1">
                    {sp.wilayahKecamatan?.map((kec) => (
                      <span
                        key={kec}
                        className="px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 text-[10px] font-medium"
                      >
                        Kec. {kec}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <p className="text-xs font-bold text-slate-700 mb-1.5">Satuan Pendidikan Binaan:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {sp.assignedSchoolNames && sp.assignedSchoolNames.length > 0 ? (
                      sp.assignedSchoolNames.map((schName, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-medium"
                        >
                          {schName}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">Belum ada sekolah khusus</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. TAB TAHUN PELAKSANAAN */}
      {activeSubTab === 'tahun' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Periode / Tahun Pelaksanaan Supervisi
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Hanya satu tahun ajaran yang dapat ditetapkan sebagai tahun aktif
              </p>
            </div>
            {hasPermission('MANAGE_EDUCATION_YEAR') && (
              <button
                onClick={() => {
                  setYearForm({
                    name: '2026/2027',
                    semester: 'Ganjil',
                    startDate: '2026-07-15',
                    endDate: '2026-12-20',
                    isActive: false,
                    notes: ''
                  });
                  setIsYearModalOpen(true);
                }}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Tahun Pelaksanaan</span>
              </button>
            )}
          </div>

          <div className="p-5 divide-y divide-slate-100">
            {educationYears.map((yr) => (
              <div key={yr.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h4 className="text-sm font-bold text-slate-900">
                      Tahun Ajaran {yr.name} ({yr.semester})
                    </h4>
                    {yr.isActive ? (
                      <span className="px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200">
                        Aktif Saat Ini
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded bg-slate-100 text-slate-600 text-xs">
                        Arsip / Nonaktif
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Periode: {yr.startDate} s/d {yr.endDate} • {yr.notes || 'Pelaksanaan Supervisi & PM'}
                  </p>
                </div>

                {!yr.isActive && hasPermission('MANAGE_EDUCATION_YEAR') && (
                  <button
                    onClick={async () => {
                      await setActiveEducationYearById(yr.id);
                      loadData();
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-colors"
                  >
                    Aktifkan Periode Ini
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Tambah/Edit Sekolah */}
      <Modal
        isOpen={isSchoolModalOpen}
        onClose={() => setIsSchoolModalOpen(false)}
        title={selectedItem ? 'Edit Satuan Pendidikan' : 'Tambah Satuan Pendidikan Baru'}
      >
        <form onSubmit={handleSaveSchool} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">NPSN Sekolah *</label>
              <input
                type="text"
                required
                value={schoolForm.npsn || ''}
                onChange={(e) => setSchoolForm({ ...schoolForm, npsn: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                placeholder="2050xxxx"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Jenjang *</label>
              <select
                value={schoolForm.level || 'SD'}
                onChange={(e) => setSchoolForm({ ...schoolForm, level: e.target.value as any })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              >
                <option value="SD">SD (Sekolah Dasar)</option>
                <option value="SMP">SMP (Sekolah Menengah Pertama)</option>
                <option value="SMA">SMA (Sekolah Menengah Atas)</option>
                <option value="SMK">SMK (Sekolah Menengah Kejuruan)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Satuan Pendidikan *</label>
            <input
              type="text"
              required
              value={schoolForm.name || ''}
              onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              placeholder="Contoh: SD Negeri Tinap 3"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Lengkap *</label>
            <input
              type="text"
              required
              value={schoolForm.address || ''}
              onChange={(e) => setSchoolForm({ ...schoolForm, address: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              placeholder="Jl. Raya Desa Tinap No. 45"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kecamatan *</label>
              <input
                type="text"
                required
                value={schoolForm.subDistrict || ''}
                onChange={(e) => setSchoolForm({ ...schoolForm, subDistrict: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                placeholder="Sukomoro"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Pengawas Bina</label>
              <select
                value={schoolForm.supervisorId || ''}
                onChange={(e) => setSchoolForm({ ...schoolForm, supervisorId: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              >
                <option value="">-- Pilih Pengawas --</option>
                {supervisors.map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {sp.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Kepala Sekolah</label>
            <input
              type="text"
              value={schoolForm.principalName || ''}
              onChange={(e) => setSchoolForm({ ...schoolForm, principalName: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              placeholder="Hj. Sri Wahyuni, M.Pd."
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            {selectedItem?.id && hasPermission('MANAGE_SCHOOL') ? (
              <button
                type="button"
                id="btn-modal-delete-school"
                onClick={() => {
                  setSchoolToDelete(selectedItem);
                  setIsSchoolModalOpen(false);
                  setIsDeleteSchoolModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                title="Hapus Satuan Pendidikan Ini"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Sekolah</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsSchoolModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
              >
                Simpan Data Sekolah
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal Tambah/Edit Guru */}
      <Modal
        isOpen={isTeacherModalOpen}
        onClose={() => setIsTeacherModalOpen(false)}
        title={selectedItem ? 'Edit Data Tenaga Pendidik' : 'Tambah Tenaga Pendidik Baru'}
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveTeacher} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">NIP (Nomor Induk Pegawai) *</label>
            <input
              type="text"
              required
              value={teacherForm.nip || ''}
              onChange={(e) => setTeacherForm({ ...teacherForm, nip: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono"
              placeholder="19850415..."
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap & Gelar *</label>
              <input
                type="text"
                required
                value={teacherForm.name || ''}
                onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                placeholder="Sumarni, S.Pd.SD."
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Kelamin</label>
              <select
                value={teacherForm.gender || 'L'}
                onChange={(e) => setTeacherForm({ ...teacherForm, gender: e.target.value as any })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              >
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Penugasan Sekolah *</label>
              <select
                required
                value={teacherForm.schoolId || ''}
                onChange={(e) => setTeacherForm({ ...teacherForm, schoolId: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              >
                <option value="">-- Pilih Sekolah --</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">NUPTK / NIK (Opsional)</label>
              <input
                type="text"
                value={teacherForm.nuptk || teacherForm.nik || ''}
                onChange={(e) => setTeacherForm({ ...teacherForm, nuptk: e.target.value, nik: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono"
                placeholder="NUPTK atau NIK"
              />
            </div>
          </div>

          {/* Jenis Guru & Tugas Mengajar */}
          <div className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-800">
                Jenis Guru Berdasarkan Tugas Mengajar *
              </label>
              <div className="inline-flex bg-slate-200/80 p-0.5 rounded-lg text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    const currentGrade = teacherForm.classGrade || 'Kelas 4';
                    setTeacherForm({
                      ...teacherForm,
                      teacherType: 'Guru Kelas',
                      classGrade: currentGrade,
                      subject: `Guru ${currentGrade}`
                    });
                  }}
                  className={`px-3 py-1 rounded-md transition-all ${
                    (teacherForm.teacherType || 'Guru Kelas') === 'Guru Kelas'
                      ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Guru Kelas
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const defaultMapel = GURU_MAPEL_LIST[0]?.name || 'PAI';
                    setTeacherForm({
                      ...teacherForm,
                      teacherType: 'Guru Mapel',
                      subject:
                        teacherForm.subject &&
                        !teacherForm.subject.startsWith('Guru Kelas') &&
                        teacherForm.subject !== 'Guru Kelas'
                          ? teacherForm.subject
                          : defaultMapel
                    });
                  }}
                  className={`px-3 py-1 rounded-md transition-all ${
                    teacherForm.teacherType === 'Guru Mapel'
                      ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Guru Mapel
                </button>
              </div>
            </div>

            {(teacherForm.teacherType || 'Guru Kelas') === 'Guru Kelas' ? (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Tingkat Kelas Diampu *
                  </label>
                  <select
                    value={teacherForm.classGrade || 'Kelas 4'}
                    onChange={(e) => {
                      const cg = e.target.value;
                      setTeacherForm({
                        ...teacherForm,
                        classGrade: cg,
                        subject: `Guru ${cg}`
                      });
                    }}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-medium text-slate-800"
                  >
                    {CLASS_GRADES.map((cg) => (
                      <option key={cg} value={cg}>
                        {cg}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Nama / Keterangan Tugas Mengajar
                  </label>
                  <input
                    type="text"
                    required
                    value={teacherForm.subject || ''}
                    onChange={(e) => setTeacherForm({ ...teacherForm, subject: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-medium"
                    placeholder="Contoh: Guru Kelas IV"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Pilihan Mata Pelajaran Resmi *
                  </label>
                  <select
                    value={teacherForm.subject || 'PAI'}
                    onChange={(e) => setTeacherForm({ ...teacherForm, subject: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-medium text-slate-800"
                  >
                    {GURU_MAPEL_LIST.map((m) => (
                      <option key={m.code} value={m.name}>
                        {m.name} — {m.fullName}
                      </option>
                    ))}
                    <option value="Lainnya">Lainnya (Tulis Manual)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Nama / Keterangan Tugas Mapel *
                  </label>
                  <input
                    type="text"
                    required
                    value={teacherForm.subject || ''}
                    onChange={(e) => setTeacherForm({ ...teacherForm, subject: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-medium"
                    placeholder="Contoh: PAI / PJOK / Matematika"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status Kepegawaian</label>
              <select
                value={teacherForm.employmentStatus || 'PNS'}
                onChange={(e) => setTeacherForm({ ...teacherForm, employmentStatus: e.target.value as any })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              >
                <option value="PNS">PNS</option>
                <option value="PPPK">PPPK</option>
                <option value="GTT">GTT</option>
                <option value="Honor">Honor Sekolah</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Pangkat / Golongan</label>
              <input
                type="text"
                value={teacherForm.rankGrade || ''}
                onChange={(e) => setTeacherForm({ ...teacherForm, rankGrade: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                placeholder="Penata Tk. I / III/d"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Jabatan Fungsional</label>
              <input
                type="text"
                value={teacherForm.position || ''}
                onChange={(e) => setTeacherForm({ ...teacherForm, position: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                placeholder="Guru Ahli Muda"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Aktif *</label>
              <input
                type="email"
                required
                value={teacherForm.email || ''}
                onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                placeholder="nama.guru@gmail.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">No. WhatsApp / HP</label>
              <input
                type="text"
                value={teacherForm.phone || ''}
                onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                placeholder="0813xxxxxxxx"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsTeacherModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
            >
              Simpan Data Guru
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Reset Password */}
      <Modal
        isOpen={isResetPasswordModalOpen}
        onClose={() => setIsResetPasswordModalOpen(false)}
        title="Konfirmasi Reset Password Akun"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Apakah Anda yakin ingin mereset kata sandi akun untuk guru{' '}
            <strong className="text-slate-900">{selectedItem?.name}</strong> (NIP: {selectedItem?.nip})?
          </p>
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800">
            Kata sandi akan diatur ulang ke default sistem dan notifikasi perubahan akan dikirimkan langsung ke akun guru yang bersangkutan.
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
              className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs"
            >
              Reset Kata Sandi
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Hapus Data Guru */}
      <Modal
        isOpen={isDeleteTeacherModalOpen}
        onClose={() => {
          if (!isDeletingTeacher) {
            setIsDeleteTeacherModalOpen(false);
            setSelectedItem(null);
          }
        }}
        title="Konfirmasi Hapus Data Guru"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-rose-900">Perhatian: Tindakan ini permanen!</p>
              <p className="text-rose-700 leading-relaxed">
                Menghapus data guru akan menghapus profil kepegawaian dan menonaktifkan akun login terkait dari sistem supervisi.
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Nama Lengkap:</span>
              <span className="font-bold text-slate-900">{selectedItem?.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">NIP:</span>
              <span className="font-mono text-slate-800">{selectedItem?.nip}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Satuan Pendidikan:</span>
              <span className="font-medium text-slate-800">{selectedItem?.schoolName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Mata Pelajaran / Tugas:</span>
              <span className="font-medium text-slate-800">{selectedItem?.subject}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Status Kepegawaian:</span>
              <span className="font-semibold text-slate-800">{selectedItem?.employmentStatus}</span>
            </div>
          </div>

          <p className="text-xs text-slate-600">
            Apakah Anda yakin ingin menghapus data guru <strong className="text-slate-900">{selectedItem?.name}</strong> dari sistem?
          </p>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              disabled={isDeletingTeacher}
              onClick={() => {
                setIsDeleteTeacherModalOpen(false);
                setSelectedItem(null);
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              id="btn-confirm-delete-teacher"
              disabled={isDeletingTeacher}
              onClick={handleDeleteTeacher}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isDeletingTeacher ? 'Menghapus...' : 'Ya, Hapus Data Guru'}</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Hapus Satuan Pendidikan */}
      <Modal
        isOpen={isDeleteSchoolModalOpen}
        onClose={() => {
          if (!isDeletingSchool) {
            setIsDeleteSchoolModalOpen(false);
            setSchoolToDelete(null);
          }
        }}
        title="Konfirmasi Hapus Satuan Pendidikan"
        id="modal-delete-school"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-rose-900">Perhatian: Tindakan ini permanen!</p>
              <p className="text-rose-700 leading-relaxed">
                Menghapus satuan pendidikan akan menghapus entitas sekolah dari database dinas dan memutuskan penugasan sekolah binaan pengawas terkait.
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Nama Satuan Pendidikan:</span>
              <span className="font-bold text-slate-900">{schoolToDelete?.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">NPSN:</span>
              <span className="font-mono font-semibold text-slate-800">{schoolToDelete?.npsn}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Jenjang:</span>
              <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-[10px]">
                {schoolToDelete?.level}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Wilayah / Kecamatan:</span>
              <span className="text-slate-800 font-medium">Kec. {schoolToDelete?.subDistrict}, {schoolToDelete?.city}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Kepala Sekolah:</span>
              <span className="text-slate-800 font-medium">{schoolToDelete?.principalName || '-'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Pengawas Bina:</span>
              <span className="text-slate-800 font-medium">{schoolToDelete?.supervisorName || '-'}</span>
            </div>
          </div>

          <p className="text-xs text-slate-600">
            Apakah Anda yakin ingin menghapus data satuan pendidikan <strong className="text-slate-900">{schoolToDelete?.name}</strong> dari sistem supervisi?
          </p>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              disabled={isDeletingSchool}
              onClick={() => {
                setIsDeleteSchoolModalOpen(false);
                setSchoolToDelete(null);
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              id="btn-confirm-delete-school"
              disabled={isDeletingSchool}
              onClick={handleDeleteSchool}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isDeletingSchool ? 'Menghapus...' : 'Ya, Hapus Satuan Pendidikan'}</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Tambah Tahun Pelaksanaan */}
      <Modal
        isOpen={isYearModalOpen}
        onClose={() => setIsYearModalOpen(false)}
        title="Tambah Tahun Pelaksanaan Supervisi"
      >
        <form onSubmit={handleSaveYear} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Tahun *</label>
              <input
                type="text"
                required
                value={yearForm.name || ''}
                onChange={(e) => setYearForm({ ...yearForm, name: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                placeholder="2026/2027"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Semester *</label>
              <select
                value={yearForm.semester || 'Ganjil'}
                onChange={(e) => setYearForm({ ...yearForm, semester: e.target.value as any })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              >
                <option value="Ganjil">Ganjil</option>
                <option value="Genap">Genap</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Mulai</label>
              <input
                type="date"
                required
                value={yearForm.startDate || ''}
                onChange={(e) => setYearForm({ ...yearForm, startDate: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Selesai</label>
              <input
                type="date"
                required
                value={yearForm.endDate || ''}
                onChange={(e) => setYearForm({ ...yearForm, endDate: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Keterangan / Agenda</label>
            <textarea
              rows={2}
              value={yearForm.notes || ''}
              onChange={(e) => setYearForm({ ...yearForm, notes: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              placeholder="Fokus pada akselerasi Pembelajaran Mendalam & Supervisi Klinis"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsYearModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
            >
              Simpan Periode Baru
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL UNGGAH DATA SATUAN PENDIDIKAN SECARA SERENTAK */}
      <UploadSekolahExcelModal
        isOpen={isUploadExcelModalOpen}
        onClose={() => setIsUploadExcelModalOpen(false)}
        existingSchools={schools}
        supervisors={supervisors}
        onSuccess={(result) => {
          loadData();
          setUploadNotification(
            `Unggah serentak berhasil: ${result.total} data satuan pendidikan diproses (${result.added} sekolah baru ditambahkan, ${result.updated} data diperbarui).`
          );
          setTimeout(() => {
            setUploadNotification(null);
          }, 8000);
        }}
      />

      {/* MODAL UNGGAH DATA GURU SECARA SERENTAK */}
      <UploadGuruExcelModal
        isOpen={isUploadGuruModalOpen}
        onClose={() => setIsUploadGuruModalOpen(false)}
        existingSchools={schools}
        existingTeachers={teachers}
        onSuccess={(result) => {
          loadData();
          setUploadNotification(
            `Unggah serentak data guru berhasil: Total ${result.total} data guru diproses (${result.added} guru baru ditambahkan, ${result.updated} data guru diperbarui).`
          );
          setTimeout(() => {
            setUploadNotification(null);
          }, 8000);
        }}
      />
    </div>
  );
};
