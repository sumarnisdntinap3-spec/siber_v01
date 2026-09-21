import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Upload,
  Link2,
  Info,
  FileText,
  CheckCircle2,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Search,
  Filter,
  Check,
  X,
  Calendar,
  ShieldCheck,
  Award,
  Sparkles,
  Clock,
  ArrowRight,
  UserCheck,
  FileCheck2,
  HelpCircle,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ProgressBar } from '../components/common/ProgressBar';
import { ExportButton } from '../components/common/ExportButton';
import { AdministrationItem, TeacherAdministrationChecklist, Teacher } from '../types';

export const AdministrasiView: React.FC = () => {
  const { currentUser, currentRole } = useAuth();

  const [adminItems, setAdminItems] = useState<AdministrationItem[]>([]);
  const [teacherChecklists, setTeacherChecklists] = useState<TeacherAdministrationChecklist[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [myChecklist, setMyChecklist] = useState<TeacherAdministrationChecklist | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'REVISION'>('ALL');

  // Modals
  const [isItemConfigModalOpen, setIsItemConfigModalOpen] = useState(false);
  const [isUploadProofModalOpen, setIsUploadProofModalOpen] = useState(false);
  const [isSupervisorEvalModalOpen, setIsSupervisorEvalModalOpen] = useState(false);
  const [isConfirmSelfModalOpen, setIsConfirmSelfModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>('');

  // Toast notification
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  // Form State for dynamic admin item (Admin Dinas)
  const [itemForm, setItemForm] = useState<Partial<AdministrationItem>>({
    code: '',
    name: '',
    description: '',
    isRequired: true,
    order: 1
  });

  // Proof upload form (Guru)
  const [proofForm, setProofForm] = useState({
    fileUrl: '',
    fileName: '',
    notes: ''
  });

  // Supervisor evaluation form
  const [supervisorForm, setSupervisorForm] = useState<{
    supervisorScore: number;
    supervisorNotes: string;
    supervisorStatus: 'DISETUJUI' | 'PERLU_PERBAIKAN';
    itemEvaluations: Record<string, {
      supervisorConfirmed: boolean;
      supervisorScore: number;
      supervisorStatus: 'SESUAI' | 'PERLU_PERBAIKAN' | 'BELUM_SESUAI';
      supervisorFeedback: string;
    }>;
  }>({
    supervisorScore: 90,
    supervisorNotes: '',
    supervisorStatus: 'DISETUJUI',
    itemEvaluations: {}
  });

  // Quick confirm form
  const [quickConfirmForm, setQuickConfirmForm] = useState({
    supervisorScore: 95,
    supervisorNotes: 'Hasil penilaian diri guru telah diverifikasi, dikonfirmasi, dan disahkan oleh Pengawas Sekolah sesuai standar mutu kurikulum.'
  });

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    try {
      const schoolFilter =
        currentRole === 'KEPALA_SEKOLAH' ? currentUser?.schoolId : selectedSchoolFilter || undefined;

      const [items, checklists, teachersList] = await Promise.all([
        api.getAdministrationItems(),
        api.getTeacherAdministrationChecklists({ schoolId: schoolFilter }),
        api.getTeachers(schoolFilter)
      ]);

      setAdminItems(items);
      setTeacherChecklists(checklists);
      setTeachers(teachersList);

      if (currentRole === 'GURU' && currentUser) {
        const myT = teachersList.find(
          (t) => t.userId === currentUser.id || t.email === currentUser.email
        );
        const activeT = myT || teachersList[0];
        setSelectedTeacher(activeT || null);

        if (activeT) {
          const myCh = await api.getTeacherChecklistByTeacherId(activeT.id);
          setMyChecklist(myCh);
        }
      } else if (teachersList.length > 0) {
        const currentSelected = selectedTeacher
          ? teachersList.find((t) => t.id === selectedTeacher.id) || teachersList[0]
          : teachersList[0];
        setSelectedTeacher(currentSelected);
        if (currentSelected) {
          const ch = await api.getTeacherChecklistByTeacherId(currentSelected.id);
          setMyChecklist(ch);
        }
      }
    } catch (err) {
      console.error('Error loading administration data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentRole, currentUser, selectedSchoolFilter]);

  // Handle Guru check/uncheck item
  const handleToggleItem = async (itemId: string, currentStatus: boolean) => {
    if (!selectedTeacher) return;
    try {
      const updated = await api.updateTeacherChecklistItem(selectedTeacher.id, itemId, {
        isCompleted: !currentStatus
      });
      setMyChecklist(updated);
      showToast(
        !currentStatus
          ? 'Dokumen ditandai telah tersedia (Penilaian Mandiri)'
          : 'Dokumen ditandai belum lengkap',
        'info'
      );
      loadData();
    } catch (err) {
      console.error('Error updating checklist item:', err);
      showToast('Gagal memperbarui status checklist', 'error');
    }
  };

  // Handle Save Proof (Guru - Google Drive link)
  const handleSaveProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher || !selectedItemId) return;
    if (!proofForm.fileUrl || !proofForm.fileUrl.trim()) {
      showToast('Mohon masukkan tautan Google Drive berkas', 'error');
      return;
    }
    let cleanUrl = proofForm.fileUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }
    try {
      const updated = await api.updateTeacherChecklistItem(selectedTeacher.id, selectedItemId, {
        isCompleted: true,
        fileUrl: cleanUrl,
        fileName: proofForm.fileName.trim() || 'Dokumen di Google Drive',
        notes: proofForm.notes
      });
      setMyChecklist(updated);
      setIsUploadProofModalOpen(false);
      setProofForm({ fileUrl: '', fileName: '', notes: '' });
      showToast('Tautan dokumen Drive berhasil disimpan untuk penilaian mandiri', 'success');
      loadData();
    } catch (err) {
      console.error('Error saving proof:', err);
      showToast('Gagal menyimpan tautan dokumen', 'error');
    }
  };

  // Save Config Item (Admin Dinas)
  const handleSaveItemConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAdministrationItem(itemForm);
      setIsItemConfigModalOpen(false);
      setItemForm({
        code: '',
        name: '',
        description: '',
        isRequired: true,
        order: adminItems.length + 1
      });
      showToast('Standar indikator administrasi berhasil ditambahkan', 'success');
      loadData();
    } catch (err) {
      console.error('Error saving admin item config:', err);
      showToast('Gagal menambahkan indikator', 'error');
    }
  };

  // Select teacher for inspection
  const handleInspectTeacher = async (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    try {
      const ch = await api.getTeacherChecklistByTeacherId(teacher.id);
      setMyChecklist(ch);
    } catch (err) {
      console.error('Error fetching teacher checklist:', err);
    }
  };

  // Open Quick Confirm Dialog (Pengawas)
  const handleOpenConfirmSelfAssessment = () => {
    if (!selectedTeacher || !myChecklist) return;
    const selfPercent = myChecklist.selfCompletionPercentage || 0;
    const defaultScore = selfPercent >= 90 ? 95 : selfPercent >= 80 ? 88 : Math.max(75, selfPercent);
    setQuickConfirmForm({
      supervisorScore: defaultScore,
      supervisorNotes: `Hasil penilaian diri guru (${selfPercent}% berkas) telah diperiksa, dikonfirmasi, dan disahkan oleh Pengawas Sekolah sesuai standar kurikulum.`
    });
    setIsConfirmSelfModalOpen(true);
  };

  // Submit Quick Confirm (Pengawas)
  const handleSubmitConfirmSelfAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher) return;
    try {
      const updated = await api.confirmTeacherSelfAssessment(selectedTeacher.id, {
        evaluatorName: currentUser?.name || 'Drs. Bambang Hidayat, M.Pd.',
        evaluatorId: currentUser?.id || 'sp-1',
        supervisorScore: quickConfirmForm.supervisorScore,
        supervisorNotes: quickConfirmForm.supervisorNotes
      });
      setMyChecklist(updated);
      setIsConfirmSelfModalOpen(false);
      showToast(
        `Penilaian diri ${selectedTeacher.name} berhasil dikonfirmasi! Nilai akhir resmi: ${quickConfirmForm.supervisorScore}/100`,
        'success'
      );
      loadData();
    } catch (err) {
      console.error('Error confirming self assessment:', err);
      showToast('Gagal mengonfirmasi penilaian diri', 'error');
    }
  };

  // Open Detailed Evaluation Modal (Pengawas)
  const handleOpenSupervisorEvaluationModal = () => {
    if (!selectedTeacher || !myChecklist) return;

    const selfPercent = myChecklist.selfCompletionPercentage || 0;
    const initialItemEvals: Record<string, any> = {};

    adminItems.forEach((item) => {
      const itemState = myChecklist.items?.find((i) => i.itemId === item.id);
      const isCompleted = itemState?.isCompleted || false;
      initialItemEvals[item.id] = {
        supervisorConfirmed: itemState?.supervisorConfirmed ?? isCompleted,
        supervisorScore: itemState?.supervisorScore ?? (isCompleted ? 95 : 0),
        supervisorStatus: itemState?.supervisorStatus || (isCompleted ? 'SESUAI' : 'BELUM_SESUAI'),
        supervisorFeedback: itemState?.supervisorFeedback || (isCompleted ? 'Sesuai standar kurikulum' : 'Belum dilengkapi guru')
      };
    });

    setSupervisorForm({
      supervisorScore: myChecklist.supervisorScore || (selfPercent >= 90 ? 95 : selfPercent >= 80 ? 88 : selfPercent),
      supervisorNotes: myChecklist.supervisorNotes || 'Perangkat pembelajaran dan administrasi lengkap, sistematis, dan kontekstual.',
      supervisorStatus: (myChecklist.supervisorStatus as any) || 'DISETUJUI',
      itemEvaluations: initialItemEvals
    });
    setIsSupervisorEvalModalOpen(true);
  };

  // Submit Detailed Evaluation (Pengawas)
  const handleSubmitSupervisorEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher) return;

    try {
      const itemEvalsArray = Object.keys(supervisorForm.itemEvaluations).map((itemId) => ({
        itemId,
        ...supervisorForm.itemEvaluations[itemId]
      }));

      const updated = await api.evaluateTeacherAdministration({
        teacherId: selectedTeacher.id,
        supervisorScore: supervisorForm.supervisorScore,
        supervisorNotes: supervisorForm.supervisorNotes,
        supervisorStatus: supervisorForm.supervisorStatus,
        evaluatorName: currentUser?.name || 'Drs. Bambang Hidayat, M.Pd.',
        evaluatorId: currentUser?.id || 'sp-1',
        itemEvaluations: itemEvalsArray
      });

      setMyChecklist(updated);
      setIsSupervisorEvalModalOpen(false);
      showToast(
        `Penilaian resmi berhasil disimpan. Nilai akhir administrasi: ${supervisorForm.supervisorScore}/100`,
        'success'
      );
      loadData();
    } catch (err) {
      console.error('Error submitting supervisor evaluation:', err);
      showToast('Gagal menyimpan evaluasi pengawas', 'error');
    }
  };

  // Quick inline item verify by Pengawas
  const handleQuickItemStatus = async (itemId: string, newStatus: 'SESUAI' | 'PERLU_PERBAIKAN') => {
    if (!selectedTeacher || !myChecklist) return;
    try {
      const currentItems = myChecklist.items || [];
      const updatedItemEvals = currentItems.map((item) => {
        if (item.itemId === itemId) {
          return {
            itemId: item.itemId,
            supervisorConfirmed: newStatus === 'SESUAI',
            supervisorScore: newStatus === 'SESUAI' ? 95 : 65,
            supervisorStatus: newStatus,
            supervisorFeedback: newStatus === 'SESUAI' ? 'Diverifikasi sesuai standar pengawas' : 'Perlu perbaikan kelengkapan'
          };
        }
        return {
          itemId: item.itemId,
          supervisorConfirmed: item.supervisorConfirmed ?? item.isCompleted,
          supervisorScore: item.supervisorScore ?? (item.isCompleted ? 95 : 0),
          supervisorStatus: item.supervisorStatus || (item.isCompleted ? 'SESUAI' : 'BELUM_SESUAI'),
          supervisorFeedback: item.supervisorFeedback || ''
        };
      });

      const sesuaiCount = updatedItemEvals.filter((i) => i.supervisorStatus === 'SESUAI').length;
      const totalCount = updatedItemEvals.length || 1;
      const autoScore = Math.round((sesuaiCount / totalCount) * 100);

      const updated = await api.evaluateTeacherAdministration({
        teacherId: selectedTeacher.id,
        supervisorScore: autoScore,
        supervisorNotes: myChecklist.supervisorNotes || 'Penilaian dokumen administrasi oleh Pengawas Sekolah.',
        supervisorStatus: autoScore >= 80 ? 'DISETUJUI' : 'PERLU_PERBAIKAN',
        evaluatorName: currentUser?.name || 'Drs. Bambang Hidayat, M.Pd.',
        evaluatorId: currentUser?.id || 'sp-1',
        itemEvaluations: updatedItemEvals
      });

      setMyChecklist(updated);
      showToast(
        `Item berhasil ditandai ${newStatus === 'SESUAI' ? 'Sesuai' : 'Perlu Perbaikan'} (Nilai: ${autoScore}/100)`,
        'info'
      );
      loadData();
    } catch (err) {
      console.error('Error updating item status:', err);
      showToast('Gagal mengubah status item', 'error');
    }
  };

  // Filter teachers for Pengawas list
  const filteredTeachers = teachers.filter((t) => {
    const matchSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.nip.includes(searchQuery);

    if (!matchSearch) return false;

    if (statusFilter === 'VERIFIED') {
      return !!t.adminVerifiedBySupervisor;
    } else if (statusFilter === 'PENDING') {
      return !t.adminVerifiedBySupervisor;
    } else if (statusFilter === 'REVISION') {
      return t.adminSupervisorStatus === 'PERLU_PERBAIKAN';
    }
    return true;
  });

  const isSupervisorRole = currentRole === 'PENGAWAS' || currentRole === 'ADMIN_DINAS';

  return (
    <div id="administrasi-view" className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border text-xs font-semibold transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-900 text-emerald-50 border-emerald-700'
              : toastMessage.type === 'info'
              ? 'bg-indigo-900 text-indigo-50 border-indigo-700'
              : 'bg-rose-900 text-rose-50 border-rose-700'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Instrumen Administrasi & Perangkat Pembelajaran
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Penilaian mandiri guru & verifikasi/penetapan nilai akhir resmi oleh Pengawas Sekolah
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ExportButton data={teacherChecklists} fileName="rekap_administrasi_guru" />
          {currentRole === 'ADMIN_DINAS' && (
            <button
              onClick={() => {
                setItemForm({
                  code: `ADM-${adminItems.length + 1}`,
                  name: '',
                  description: '',
                  isRequired: true,
                  order: adminItems.length + 1
                });
                setIsItemConfigModalOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Indikator</span>
            </button>
          )}
        </div>
      </div>

      {/* Mandatory Official Rule Banner */}
      <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-950">
        <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold text-amber-900 block mb-0.5">
            Ketentuan Penilaian Akhir Administrasi & Perangkat Pembelajaran:
          </strong>
          <span>
            Guru melakukan <strong>penilaian mandiri (self-assessment)</strong> dengan melengkapi dan mengunggah dokumen ajar. Adapun <strong>nilai akhir resmi yang digunakan</strong> dalam sistem, rapor kinerja, dan dashboard adalah hasil penilaian serta pengesahan dari <strong>Pengawas Sekolah</strong>.
          </span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* VIEW FOR GURU: Self-Assessment & Supervisor Feedback */}
      {/* ========================================================= */}
      {currentRole === 'GURU' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Interactive Checklist Items */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Daftar Penilaian Diri Dokumen Administrasi
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Centang item yang telah diselesaikan dan lampirkan berkas bukti pendukung
                </p>
              </div>
              <div className="text-right">
                <span className="px-2.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-[10px] uppercase tracking-wider border border-indigo-200">
                  Penilaian Diri: {myChecklist?.selfCompletionPercentage || 0}%
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {adminItems.map((item, idx) => {
                const itemState = myChecklist?.items?.find((i) => i.itemId === item.id);
                const isChecked = itemState?.isCompleted || false;
                const isSupervisorConfirmed = itemState?.supervisorConfirmed;
                const supervisorStatus = itemState?.supervisorStatus;

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isChecked
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggleItem(item.id, isChecked)}
                          className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${
                            isChecked
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'bg-white border-slate-300 hover:border-slate-400'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              {idx + 1}. {item.name}
                            </span>
                            {item.isRequired && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-50 text-rose-600 font-bold uppercase tracking-wider border border-rose-200">
                                Wajib
                              </span>
                            )}
                            {/* Supervisor Status Badge */}
                            {supervisorStatus === 'SESUAI' ? (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold uppercase tracking-wider border border-emerald-200 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-emerald-700" />
                                <span>Disahkan Pengawas</span>
                              </span>
                            ) : supervisorStatus === 'PERLU_PERBAIKAN' ? (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold uppercase tracking-wider border border-amber-200 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 text-amber-700" />
                                <span>Perlu Perbaikan</span>
                              </span>
                            ) : null}
                          </div>
                          <p className="text-xs text-slate-500">{item.description}</p>

                          {/* Google Drive / Uploaded File Link */}
                          {itemState?.fileUrl ? (
                            <a
                              href={itemState.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 mt-1.5 text-[11px] font-semibold text-blue-700 hover:text-blue-900 hover:underline bg-blue-50/90 px-2.5 py-1 rounded-md w-fit border border-blue-200 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                              <span>{itemState.fileName || 'Buka di Google Drive'}</span>
                            </a>
                          ) : itemState?.fileName ? (
                            <div className="flex items-center gap-2 mt-1.5 text-[11px] text-emerald-700 bg-emerald-100/60 px-2.5 py-1 rounded-md w-fit">
                              <FileText className="w-3.5 h-3.5" />
                              <span className="font-medium">{itemState.fileName}</span>
                            </div>
                          ) : null}

                          {/* Supervisor Feedback if any */}
                          {itemState?.supervisorFeedback && (
                            <div className="mt-2 text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-200 text-slate-700 flex items-start gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold text-slate-800">Catatan Pengawas: </span>
                                <span>{itemState.supervisorFeedback}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedItemId(item.id);
                          setProofForm({
                            fileUrl: itemState?.fileUrl || '',
                            fileName: itemState?.fileName || `${item.name} (Google Drive)`,
                            notes: itemState?.notes || ''
                          });
                          setIsUploadProofModalOpen(true);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg border border-slate-200 transition-colors shrink-0 flex items-center gap-1.5"
                      >
                        <Link2 className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{itemState?.fileUrl || itemState?.fileName ? 'Ubah Link Drive' : 'Tautkan Link Drive'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right 1 Col: Summary & Official Final Score */}
          <div className="space-y-6">
            {/* Official Supervisor Assessment Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Nilai Akhir Administrasi
                </h3>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  Resmi Pengawas
                </span>
              </div>

              {myChecklist?.isVerifiedBySupervisor ? (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900">Nilai Akhir Pengawas</span>
                    <span className="text-2xl font-black text-emerald-700">
                      {myChecklist.completionPercentage}
                      <span className="text-xs font-normal text-emerald-600"> / 100</span>
                    </span>
                  </div>
                  <ProgressBar value={myChecklist.completionPercentage} showValue={false} size="md" />

                  <div className="text-[11px] text-emerald-800 space-y-1 pt-2 border-t border-emerald-200/60">
                    <p className="flex items-center gap-1.5 font-bold">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Disahkan oleh Pengawas Sekolah:</span>
                    </p>
                    <p className="font-semibold">{myChecklist.supervisorEvaluatorName || 'Drs. Bambang Hidayat, M.Pd.'}</p>
                    <p className="text-emerald-600 text-[10px]">
                      Tanggal Pengesahan: {myChecklist.supervisorEvaluatedAt || '15 Agustus 2026'}
                    </p>
                  </div>

                  {myChecklist.supervisorNotes && (
                    <div className="p-2.5 bg-white/80 rounded-lg border border-emerald-200 text-xs text-slate-700 mt-2">
                      <p className="font-bold text-emerald-900 text-[11px] mb-0.5">Catatan Pembinaan:</p>
                      <p className="italic text-[11px]">"{myChecklist.supervisorNotes}"</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-900">
                    <Clock className="w-4 h-4 text-amber-700" />
                    <span>Menunggu Verifikasi Pengawas</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-800">
                    Dokumen penilaian mandiri Anda telah tersimpan. Pengawas Sekolah akan memverifikasi berkas dan menetapkan nilai akhir resmi.
                  </p>
                </div>
              )}

              {/* Self Assessment Score */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
                  Hasil Penilaian Mandiri Guru
                </p>
                <p className="text-3xl font-black text-slate-900 mt-1">
                  {myChecklist?.selfCompletionPercentage || 0}%
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {myChecklist?.items?.filter((i) => i.isCompleted).length || 0} dari {adminItems.length} dokumen diunggah
                </p>
                <div className="mt-3">
                  <ProgressBar value={myChecklist?.selfCompletionPercentage || 0} size="sm" showValue={false} />
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span>Total Indikator:</span>
                  <strong className="text-slate-900">{adminItems.length} Dokumen</strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span>Telah Dilengkapi Guru:</span>
                  <strong className="text-emerald-600">
                    {myChecklist?.items?.filter((i) => i.isCompleted).length || 0} Dokumen
                  </strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span>Belum Dilengkapi:</span>
                  <strong className="text-rose-600">
                    {adminItems.length - (myChecklist?.items?.filter((i) => i.isCompleted).length || 0)} Dokumen
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW FOR PENGAWAS / ADMIN DINAS / KEPALA SEKOLAH: Evaluation & Inspection */}
      {/* ========================================================================= */}
      {currentRole !== 'GURU' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 1 Col: List of Teachers & Filter Tabs */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Daftar Guru Terbina</h3>
              <p className="text-xs text-slate-500 mt-0.5">Pilih guru untuk menilai dan mengesahkan administrasi</p>
            </div>

            {/* School filter if Pengawas/Admin */}
            {currentRole !== 'KEPALA_SEKOLAH' && (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Filter Sekolah Binaan
                </label>
                <select
                  value={selectedSchoolFilter}
                  onChange={(e) => setSelectedSchoolFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                >
                  <option value="">Semua Sekolah Binaan</option>
                  <option value="sch-1">SD Negeri Tinap 3</option>
                  <option value="sch-2">SD Negeri Tinap 1</option>
                  <option value="sch-3">SMP Negeri 1 Sukamaju</option>
                </select>
              </div>
            )}

            {/* Status Filter Tabs for Pengawas */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`py-1 rounded font-bold transition-all text-center ${
                  statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Semua ({teachers.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('PENDING')}
                className={`py-1 rounded font-bold transition-all text-center ${
                  statusFilter === 'PENDING'
                    ? 'bg-white text-amber-800 shadow-xs'
                    : 'text-slate-500 hover:text-amber-800'
                }`}
              >
                Belum Dinilai ({teachers.filter((t) => !t.adminVerifiedBySupervisor).length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('VERIFIED')}
                className={`py-1 rounded font-bold transition-all text-center ${
                  statusFilter === 'VERIFIED'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-500 hover:text-emerald-800'
                }`}
              >
                Disahkan ({teachers.filter((t) => t.adminVerifiedBySupervisor).length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('REVISION')}
                className={`py-1 rounded font-bold transition-all text-center ${
                  statusFilter === 'REVISION'
                    ? 'bg-white text-rose-800 shadow-xs'
                    : 'text-slate-500 hover:text-rose-800'
                }`}
              >
                Perlu Revisi ({teachers.filter((t) => t.adminSupervisorStatus === 'PERLU_PERBAIKAN').length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari nama guru atau mata pelajaran..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Teachers Scrollable List */}
            <div className="max-h-[520px] overflow-y-auto space-y-2 pr-1">
              {filteredTeachers.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Tidak ada guru yang sesuai kriteria filter.
                </div>
              ) : (
                filteredTeachers.map((t) => {
                  const isSelected = selectedTeacher?.id === t.id;
                  const isVerified = t.adminVerifiedBySupervisor;
                  const selfComp = t.adminSelfCompletion ?? t.adminCompletion ?? 0;
                  const officialScore = t.adminSupervisorScore ?? t.adminScore ?? (isVerified ? t.adminCompletion : null);

                  return (
                    <div
                      key={t.id}
                      onClick={() => handleInspectTeacher(t)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50/70 border-indigo-400 shadow-xs'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{t.name}</h4>
                          <p className="text-[10px] font-mono text-slate-500">NIP: {t.nip}</p>
                          <p className="text-[11px] text-slate-600 truncate mt-0.5">
                            {t.schoolName} • {t.subject}
                          </p>

                          <div className="flex items-center gap-1.5 mt-2">
                            {isVerified ? (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 flex items-center gap-0.5">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                <span>Disahkan: {officialScore}/100</span>
                              </span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 font-bold border border-amber-200 flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5 text-amber-600" />
                                <span>Butuh Konfirmasi</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Penilaian Diri</span>
                          <span className="text-xs font-black text-slate-900">{selfComp}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right 2 Cols: Supervisor Evaluation & Detailed Inspection Panel */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
            {selectedTeacher ? (
              <>
                {/* Teacher Header & Dual-Score Comparison Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {selectedTeacher.schoolName}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-semibold text-slate-600">{selectedTeacher.subject}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">
                      {selectedTeacher.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">
                      NIP: {selectedTeacher.nip} • Pangkat/Gol: {selectedTeacher.rankGrade}
                    </p>
                  </div>

                  {/* Dual Score KPI Highlights */}
                  <div className="flex items-center gap-3">
                    {/* Self Assessment Box */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center min-w-[110px]">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                        Penilaian Diri
                      </span>
                      <span className="text-xl font-black text-slate-800">
                        {myChecklist?.selfCompletionPercentage ?? selectedTeacher.adminSelfCompletion ?? 0}%
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {myChecklist?.items?.filter((i) => i.isCompleted).length || 0} berkas
                      </span>
                    </div>

                    {/* Supervisor Official Score Box (The Authority!) */}
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-300 text-center min-w-[130px] shadow-xs">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-800 block">
                        Nilai Resmi Pengawas
                      </span>
                      <span className="text-xl font-black text-emerald-700">
                        {myChecklist?.isVerifiedBySupervisor
                          ? `${myChecklist.completionPercentage}/100`
                          : 'Belum Disahkan'}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-semibold block">
                        {myChecklist?.isVerifiedBySupervisor
                          ? myChecklist.completionPercentage >= 90
                            ? 'Amat Baik'
                            : 'Baik'
                          : 'Perlu Verifikasi'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Supervisor Action Toolbar (Only for Pengawas & Admin) */}
                {isSupervisorRole && (
                  <div className="p-4 bg-gradient-to-r from-indigo-50/90 to-blue-50/70 rounded-xl border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        <span>Aksi Pengesahan & Penilaian Pengawas:</span>
                      </p>
                      <p className="text-[11px] text-indigo-700">
                        Konfirmasi hasil penilaian mandiri guru atau lakukan penilaian berkas per butir indikator.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleOpenConfirmSelfAssessment}
                        className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-white hover:bg-emerald-50 rounded-lg border border-emerald-300 shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>⚡ Konfirmasi Penilaian Diri</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleOpenSupervisorEvaluationModal}
                        className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <FileCheck2 className="w-3.5 h-3.5" />
                        <span>📝 Beri / Ubah Nilai Pengawas</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Supervisor Official Validation Status Box */}
                {myChecklist?.isVerifiedBySupervisor && (
                  <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 flex items-start justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <strong className="text-emerald-900 font-bold">
                          Status: Telah Disahkan oleh Pengawas Sekolah
                        </strong>
                        <span className="px-2 py-0.2 rounded bg-emerald-200/80 text-emerald-900 font-black text-[10px] uppercase">
                          Nilai: {myChecklist.completionPercentage}/100
                        </span>
                      </div>
                      <p className="text-slate-600">
                        Evaluator: <strong className="text-slate-800">{myChecklist.supervisorEvaluatorName || 'Drs. Bambang Hidayat, M.Pd.'}</strong> • Tanggal: {myChecklist.supervisorEvaluatedAt || '2026-08-15'}
                      </p>
                      {myChecklist.supervisorNotes && (
                        <p className="text-slate-700 italic mt-1 bg-white/70 p-2 rounded-lg border border-emerald-100">
                          "{myChecklist.supervisorNotes}"
                        </p>
                      )}
                    </div>

                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md shrink-0">
                      Rujukan Resmi Sistem
                    </span>
                  </div>
                )}

                {/* Dual-Perspective Items Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Rincian 17 Dokumen Administrasi & Status Verifikasi
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      {myChecklist?.items?.filter((i) => i.isCompleted).length || 0} Tersedia •{' '}
                      {myChecklist?.items?.filter((i) => i.supervisorConfirmed || i.supervisorStatus === 'SESUAI').length || 0} Disetujui Pengawas
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {adminItems.map((item, idx) => {
                      const itemState = myChecklist?.items?.find((i) => i.itemId === item.id);
                      const isCompleted = itemState?.isCompleted || false;
                      const supervisorStatus = itemState?.supervisorStatus;
                      const supervisorFeedback = itemState?.supervisorFeedback;

                      return (
                        <div
                          key={item.id}
                          className={`p-3.5 rounded-xl border transition-all ${
                            supervisorStatus === 'SESUAI'
                              ? 'bg-emerald-50/30 border-emerald-200'
                              : supervisorStatus === 'PERLU_PERBAIKAN'
                              ? 'bg-amber-50/40 border-amber-200'
                              : isCompleted
                              ? 'bg-slate-50/80 border-slate-200'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            {/* Left: Document details & Self Assessment state */}
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900">
                                  {idx + 1}. {item.name}
                                </span>
                                {item.isRequired && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-50 text-rose-600 font-bold uppercase tracking-wider border border-rose-200">
                                    Wajib
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500">{item.description}</p>

                              {/* Guru's uploaded file proof */}
                              <div className="flex flex-wrap items-center gap-2 pt-1">
                                {isCompleted ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                                    <FileText className="w-3 h-3" />
                                    <span>{itemState?.fileName || 'Dokumen_Tersedia.pdf'}</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                                    <X className="w-3 h-3" />
                                    <span>Belum Diunggah Guru</span>
                                  </span>
                                )}

                                {itemState?.notes && (
                                  <span className="text-[11px] text-slate-500 italic">
                                    (Catatan Guru: {itemState.notes})
                                  </span>
                                )}
                              </div>

                              {/* Supervisor Feedback if present */}
                              {supervisorFeedback && (
                                <p className="text-[11px] text-indigo-900 bg-indigo-50/80 p-1.5 rounded-md border border-indigo-100 mt-1">
                                  <strong>Catatan Pengawas:</strong> {supervisorFeedback}
                                </p>
                              )}
                            </div>

                            {/* Right: Supervisor Confirmation & Quick Action */}
                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                              {/* Current status badge */}
                              {supervisorStatus === 'SESUAI' ? (
                                <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider border border-emerald-300 flex items-center gap-1">
                                  <Check className="w-3 h-3 text-emerald-700 stroke-[3]" />
                                  <span>Sesuai Standar</span>
                                </span>
                              ) : supervisorStatus === 'PERLU_PERBAIKAN' ? (
                                <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider border border-amber-300 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3 text-amber-700" />
                                  <span>Perlu Revisi</span>
                                </span>
                              ) : isCompleted ? (
                                <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider border border-slate-300">
                                  Menunggu Nilai
                                </span>
                              ) : null}

                              {/* Inline Supervisor Quick Actions */}
                              {isSupervisorRole && (
                                <div className="flex items-center gap-1 ml-1">
                                  <button
                                    type="button"
                                    title="Sahkan & Nyatakan Sesuai"
                                    onClick={() => handleQuickItemStatus(item.id, 'SESUAI')}
                                    className={`p-1.5 rounded-lg border transition-colors ${
                                      supervisorStatus === 'SESUAI'
                                        ? 'bg-emerald-600 text-white border-emerald-600'
                                        : 'bg-white hover:bg-emerald-50 text-slate-600 border-slate-200'
                                    }`}
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    title="Tandai Perlu Perbaikan"
                                    onClick={() => handleQuickItemStatus(item.id, 'PERLU_PERBAIKAN')}
                                    className={`p-1.5 rounded-lg border transition-colors ${
                                      supervisorStatus === 'PERLU_PERBAIKAN'
                                        ? 'bg-amber-600 text-white border-amber-600'
                                        : 'bg-white hover:bg-amber-50 text-slate-600 border-slate-200'
                                    }`}
                                  >
                                    <AlertCircle className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="py-16 text-center text-slate-400 text-xs">
                Pilih guru dari daftar di sebelah kiri untuk melihat rincian administrasi.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODALS */}
      {/* ========================================================= */}

      {/* 1. Modal Quick Confirm Self-Assessment (Pengawas) */}
      <Modal
        isOpen={isConfirmSelfModalOpen}
        onClose={() => setIsConfirmSelfModalOpen(false)}
        title="Konfirmasi Hasil Penilaian Diri Guru"
        subtitle={`Pengesahan berkas administrasi: ${selectedTeacher?.name}`}
      >
        <form onSubmit={handleSubmitConfirmSelfAssessment} className="space-y-4">
          <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-950 space-y-2">
            <p className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-700" />
              <span>Ringkasan Hasil Penilaian Mandiri Guru:</span>
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div>
                <span>Guru:</span>
                <strong className="block text-slate-900">{selectedTeacher?.name}</strong>
              </div>
              <div>
                <span>Sekolah:</span>
                <strong className="block text-slate-900">{selectedTeacher?.schoolName}</strong>
              </div>
              <div>
                <span>Kelengkapan Berkas Guru:</span>
                <strong className="block text-emerald-700">
                  {myChecklist?.selfCompletionPercentage || 0}% (
                  {myChecklist?.items?.filter((i) => i.isCompleted).length || 0} dari {adminItems.length} dokumen)
                </strong>
              </div>
              <div>
                <span>Pengawas Evaluator:</span>
                <strong className="block text-slate-900">{currentUser?.name || 'Drs. Bambang Hidayat, M.Pd.'}</strong>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tetapkan Nilai Akhir Resmi Pengawas (0 - 100) *
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                max="100"
                required
                value={quickConfirmForm.supervisorScore}
                onChange={(e) =>
                  setQuickConfirmForm({ ...quickConfirmForm, supervisorScore: Number(e.target.value) })
                }
                className="w-28 px-3 py-2 text-sm font-bold bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              />
              <span className="text-xs text-slate-500">
                Predikat:{' '}
                <strong className="text-emerald-700">
                  {quickConfirmForm.supervisorScore >= 90
                    ? 'Amat Baik (Sangat Memuaskan)'
                    : quickConfirmForm.supervisorScore >= 80
                    ? 'Baik (Memenuhi Standar)'
                    : 'Cukup'}
                </strong>
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Nilai ini akan disahkan sebagai nilai akhir resmi yang dipakai di seluruh dashboard kinerja guru.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Catatan & Rekomendasi Pembinaan Pengawas *
            </label>
            <textarea
              rows={3}
              required
              value={quickConfirmForm.supervisorNotes}
              onChange={(e) =>
                setQuickConfirmForm({ ...quickConfirmForm, supervisorNotes: e.target.value })
              }
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsConfirmSelfModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Sahkan Nilai Akhir Pengawas</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* 2. Modal Detailed Supervisor Evaluation */}
      <Modal
        isOpen={isSupervisorEvalModalOpen}
        onClose={() => setIsSupervisorEvalModalOpen(false)}
        title="Penilaian & Verifikasi Rinci Administrasi Guru"
        subtitle={`Evaluator: ${currentUser?.name || 'Drs. Bambang Hidayat, M.Pd.'} • Guru: ${selectedTeacher?.name}`}
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmitSupervisorEvaluation} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nilai Akhir Resmi Administrasi (0 - 100) *
              </label>
              <input
                type="number"
                min="0"
                max="100"
                required
                value={supervisorForm.supervisorScore}
                onChange={(e) =>
                  setSupervisorForm({ ...supervisorForm, supervisorScore: Number(e.target.value) })
                }
                className="w-full px-3 py-2 text-sm font-bold bg-white border border-slate-300 rounded-lg text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Status Pengesahan Pengawas *
              </label>
              <select
                value={supervisorForm.supervisorStatus}
                onChange={(e) =>
                  setSupervisorForm({
                    ...supervisorForm,
                    supervisorStatus: e.target.value as 'DISETUJUI' | 'PERLU_PERBAIKAN'
                  })
                }
                className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-300 rounded-lg text-slate-900"
              >
                <option value="DISETUJUI">DISETUJUI (Memenuhi Standar)</option>
                <option value="PERLU_PERBAIKAN">PERLU PERBAIKAN (Ada Catatan Revisi)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Catatan & Masukan Pembinaan Umum *
            </label>
            <textarea
              rows={2}
              required
              value={supervisorForm.supervisorNotes}
              onChange={(e) => setSupervisorForm({ ...supervisorForm, supervisorNotes: e.target.value })}
              placeholder="Berikan arahan untuk pengembangan modul dan pembelajaran..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
            />
          </div>

          {/* Individual Items Scoring Accordion / List */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Verifikasi Status per Indikator Dokumen:
            </label>
            <div className="max-h-[300px] overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
              {adminItems.map((item, idx) => {
                const currentItemEval = supervisorForm.itemEvaluations[item.id] || {
                  supervisorConfirmed: true,
                  supervisorScore: 95,
                  supervisorStatus: 'SESUAI',
                  supervisorFeedback: ''
                };

                return (
                  <div key={item.id} className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900">
                            {idx + 1}. {item.name}
                          </span>
                          {(() => {
                            const rawItem = myChecklist?.items?.find((i) => i.itemId === item.id);
                            return rawItem?.fileUrl ? (
                              <a
                                href={rawItem.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 font-semibold shrink-0 transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Link Drive</span>
                              </a>
                            ) : null;
                          })()}
                        </div>
                        <span className="text-[10px] text-slate-500">{item.description}</span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={currentItemEval.supervisorStatus}
                          onChange={(e) => {
                            const newStatus = e.target.value as 'SESUAI' | 'PERLU_PERBAIKAN' | 'BELUM_SESUAI';
                            setSupervisorForm({
                              ...supervisorForm,
                              itemEvaluations: {
                                ...supervisorForm.itemEvaluations,
                                [item.id]: {
                                  ...currentItemEval,
                                  supervisorStatus: newStatus,
                                  supervisorConfirmed: newStatus === 'SESUAI'
                                }
                              }
                            });
                          }}
                          className={`px-2 py-1 text-xs font-bold rounded-lg border ${
                            currentItemEval.supervisorStatus === 'SESUAI'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : currentItemEval.supervisorStatus === 'PERLU_PERBAIKAN'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-rose-50 text-rose-800 border-rose-300'
                          }`}
                        >
                          <option value="SESUAI">Sesuai</option>
                          <option value="PERLU_PERBAIKAN">Perlu Perbaikan</option>
                          <option value="BELUM_SESUAI">Belum Sesuai</option>
                        </select>
                      </div>
                    </div>

                    <input
                      type="text"
                      placeholder="Catatan perbaikan khusus item ini (opsional)..."
                      value={currentItemEval.supervisorFeedback || ''}
                      onChange={(e) => {
                        setSupervisorForm({
                          ...supervisorForm,
                          itemEvaluations: {
                            ...supervisorForm.itemEvaluations,
                            [item.id]: {
                              ...currentItemEval,
                              supervisorFeedback: e.target.value
                            }
                          }
                        });
                      }}
                      className="w-full px-2.5 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded-md"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsSupervisorEvalModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Simpan & Sahkan Nilai Akhir</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* 3. Modal Tautkan Bukti Dokumen Administrasi (Guru - Drive Link) */}
      <Modal
        isOpen={isUploadProofModalOpen}
        onClose={() => setIsUploadProofModalOpen(false)}
        title="Tautkan Dokumen Bukti Administrasi (Google Drive)"
        subtitle="Input link tautan dokumen file dari Google Drive tanpa perlu mengunggah berkas utuh"
      >
        <form onSubmit={handleSaveProof} className="space-y-4">
          <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-blue-900">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Ketentuan Tautan Dokumen Guru:</p>
              <p className="text-[11px] leading-relaxed text-blue-800">
                Sesuai kebijakan penyederhanaan sistem, guru <strong>tidak perlu mengunggah file utuh</strong> (PDF/DOCX/XLSX). Cukup simpan berkas di Google Drive Anda dan cantumkan link tautannya di bawah. Pastikan akses tautan diatur ke <em>"Siapa saja yang memiliki link dapat melihat"</em>.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Link Tautan Google Drive *</span>
              <span className="text-[10px] text-blue-600 font-normal">Wajib dapat diakses</span>
            </label>
            <div className="relative">
              <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="url"
                required
                value={proofForm.fileUrl}
                onChange={(e) => setProofForm({ ...proofForm, fileUrl: e.target.value })}
                placeholder="https://drive.google.com/file/d/... atau https://docs.google.com/..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Dokumen / Keterangan Berkas *</label>
            <input
              type="text"
              required
              value={proofForm.fileName}
              onChange={(e) => setProofForm({ ...proofForm, fileName: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              placeholder="Contoh: Kalender Pendidikan 2025/2026 (Google Drive)"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Tambahan Guru</label>
            <textarea
              rows={2}
              value={proofForm.notes}
              onChange={(e) => setProofForm({ ...proofForm, notes: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              placeholder="Contoh: Dokumen telah diselaraskan dengan Fase B Kurikulum Merdeka"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsUploadProofModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs flex items-center gap-1.5"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Simpan Tautan Drive</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* 4. Modal Tambah Indikator Administrasi (Admin Dinas) */}
      <Modal
        isOpen={isItemConfigModalOpen}
        onClose={() => setIsItemConfigModalOpen(false)}
        title="Tambah Standar Indikator Administrasi"
      >
        <form onSubmit={handleSaveItemConfig} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kode Item *</label>
              <input
                type="text"
                required
                value={itemForm.code || ''}
                onChange={(e) => setItemForm({ ...itemForm, code: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Urutan</label>
              <input
                type="number"
                value={itemForm.order || 1}
                onChange={(e) => setItemForm({ ...itemForm, order: parseInt(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Indikator *</label>
            <input
              type="text"
              required
              value={itemForm.name || ''}
              onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              placeholder="Contoh: Modul Projek Penguatan Profil Pelajar Pancasila"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Penjelasan</label>
            <textarea
              rows={2}
              value={itemForm.description || ''}
              onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              placeholder="Rincian berkas yang wajib diunggah oleh guru..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsItemConfigModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
            >
              Simpan Indikator
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
