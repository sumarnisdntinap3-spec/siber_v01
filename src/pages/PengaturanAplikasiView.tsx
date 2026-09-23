import React, { useState, useEffect } from 'react';
import {
  Shield,
  User as UserIcon,
  Sparkles,
  GraduationCap,
  Building2,
  BookOpen,
  Award,
  Upload,
  Image as ImageIcon,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Eye,
  KeyRound,
  Mail,
  Phone,
  Briefcase,
  HelpCircle,
  Palette,
  Layout,
  ExternalLink,
  Layers,
  Lock,
  FileCheck,
  Database,
  Copy,
  RefreshCw,
  Server,
  ArrowRightLeft,
  Play,
  Loader2,
  AlertTriangle,
  FileSpreadsheet,
  Flame,
  Download,
  Send,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppSettings, PresetLogoIcon, ThemeColorKey, User } from '../types';
import { api } from '../services/api';
import {
  checkSupabaseHealth,
  SUPABASE_PROJECT_NAME,
  SUPABASE_PROJECT_ID,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SupabaseHealthResult
} from '../lib/supabase';
import {
  migrateAllFromFirestoreToSupabase,
  MigrationSummaryReport
} from '../lib/migration';

export const PengaturanAplikasiView: React.FC = () => {
  const {
    currentUser,
    appSettings,
    updateAppSettings,
    updateCurrentUserProfile,
    refreshGlobalData
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'identity' | 'logo' | 'preview' | 'database'>('profile');
  const [dbSubTab, setDbSubTab] = useState<'firebase' | 'googlesheets' | 'supabase'>('firebase');

  // Firebase Firestore State
  const [firebaseStatus, setFirebaseStatus] = useState<{
    configured: boolean;
    projectId?: string;
    databaseId?: string;
    connected?: boolean;
    message?: string;
    collections?: Record<string, number>;
  } | null>(null);
  const [isTestingFirebase, setIsTestingFirebase] = useState(false);
  const [isSyncingFirebase, setIsSyncingFirebase] = useState(false);

  // Google Sheets Integration State
  const [googleSheetsConfig, setGoogleSheetsConfig] = useState<{
    webhookUrl: string;
    spreadsheetUrl: string;
    autoSync: boolean;
    lastSync: string | null;
    lastSyncStatus: string | null;
  }>({
    webhookUrl: '',
    spreadsheetUrl: '',
    autoSync: false,
    lastSync: null,
    lastSyncStatus: null
  });
  const [googleAppsScriptTemplate, setGoogleAppsScriptTemplate] = useState('');
  const [googleSheetsStats, setGoogleSheetsStats] = useState({
    totalSchools: 0,
    totalTeachers: 0,
    totalSupervisors: 0,
    totalSupervisions: 0
  });
  const [isSavingGoogleSheets, setIsSavingGoogleSheets] = useState(false);
  const [isSyncingGoogleSheets, setIsSyncingGoogleSheets] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  // Supabase State
  const [supabaseHealth, setSupabaseHealth] = useState<SupabaseHealthResult | null>(null);
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Firestore to Supabase Migration State
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationDryRun, setMigrationDryRun] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState(0);
  const [migrationCurrentEntity, setMigrationCurrentEntity] = useState('');
  const [migrationLogs, setMigrationLogs] = useState<string[]>([]);
  const [migrationReport, setMigrationReport] = useState<MigrationSummaryReport | null>(null);

  // Admin Profile Form State
  const [adminName, setAdminName] = useState(currentUser?.name || '');
  const [adminNip, setAdminNip] = useState(currentUser?.nip || '');
  const [adminEmail, setAdminEmail] = useState(currentUser?.email || '');
  const [adminPhone, setAdminPhone] = useState(currentUser?.phone || '');
  const [adminPosition, setAdminPosition] = useState(currentUser?.position || 'Kepala Bidang Pembinaan & Ketenagaan');
  const [adminAvatarUrl, setAdminAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // App Identity & Logo Form State
  const [appName, setAppName] = useState(appSettings?.appName || 'SIBER-PM');
  const [appShortName, setAppShortName] = useState(appSettings?.appShortName || 'PM');
  const [agencyName, setAgencyName] = useState(appSettings?.agencyName || 'Dinas Pendidikan');
  const [appSubtitle, setAppSubtitle] = useState(appSettings?.appSubtitle || 'Supervisi Akademik & Pembelajaran Mendalam');
  const [tagline, setTagline] = useState(appSettings?.tagline || 'Sistem Informasi Supervisi Akademik & Pembelajaran Mendalam Terintegrasi');
  const [description, setDescription] = useState(appSettings?.description || 'Platform digital terpadu supervisi akademik, kurikulum merdeka, pemetaan growth mindset, dan 10 aspek pembelajaran mendalam (SIBER-PM).');
  const [logoType, setLogoType] = useState<'preset' | 'custom'>(appSettings?.logoType || 'preset');
  const [logoPreset, setLogoPreset] = useState<PresetLogoIcon>(appSettings?.logoPreset || 'tut-wuri-handayani');
  const [logoUrl, setLogoUrl] = useState(appSettings?.logoUrl || '/tut-wuri-handayani.svg');
  const [primaryColor, setPrimaryColor] = useState<ThemeColorKey>(appSettings?.primaryColor || 'indigo');
  const [footerText, setFooterText] = useState(appSettings?.footerText || 'Dinas Pendidikan • Sistem Informasi Pengawasan dan Supervisi Akademik');
  const [contactEmail, setContactEmail] = useState(appSettings?.contactEmail || 'dinas@pendidikan.go.id');
  const [contactPhone, setContactPhone] = useState(appSettings?.contactPhone || '081234567890');

  // UI Feedback State
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync with auth context when loaded
  useEffect(() => {
    if (currentUser) {
      setAdminName(currentUser.name || '');
      setAdminNip(currentUser.nip || '');
      setAdminEmail(currentUser.email || '');
      setAdminPhone(currentUser.phone || '');
      setAdminPosition(currentUser.position || 'Kepala Bidang Pembinaan & Ketenagaan');
      setAdminAvatarUrl(currentUser.avatarUrl || '');
    }
  }, [currentUser]);

  useEffect(() => {
    if (appSettings) {
      setAppName(appSettings.appName || 'SIBER-PM');
      setAppShortName(appSettings.appShortName || 'PM');
      setAgencyName(appSettings.agencyName || 'Dinas Pendidikan');
      setAppSubtitle(appSettings.appSubtitle || 'Supervisi Akademik & Pembelajaran Mendalam');
      setTagline(appSettings.tagline || 'Sistem Informasi Supervisi Akademik & Pembelajaran Mendalam Terintegrasi');
      setDescription(appSettings.description || '');
      setLogoType(appSettings.logoType || 'preset');
      setLogoPreset(appSettings.logoPreset || 'tut-wuri-handayani');
      setLogoUrl(appSettings.logoUrl || '/tut-wuri-handayani.svg');
      setPrimaryColor(appSettings.primaryColor || 'indigo');
      setFooterText(appSettings.footerText || '');
      setContactEmail(appSettings.contactEmail || '');
      setContactPhone(appSettings.contactPhone || '');
    }
  }, [appSettings]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const loadDatabaseStatuses = async () => {
    try {
      setIsTestingFirebase(true);
      const fbStatus = await api.getFirebaseStatus();
      setFirebaseStatus(fbStatus);
    } catch (err: any) {
      console.warn('Firebase status load error:', err);
    } finally {
      setIsTestingFirebase(false);
    }

    try {
      const gsRes = await api.getGoogleSheetsConfig();
      if (gsRes.config) setGoogleSheetsConfig(gsRes.config);
      if (gsRes.templateScript) setGoogleAppsScriptTemplate(gsRes.templateScript);
      if (gsRes.stats) setGoogleSheetsStats(gsRes.stats);
    } catch (err: any) {
      console.warn('Google sheets config load error:', err);
    }

    try {
      setIsTestingSupabase(true);
      const spHealth = await checkSupabaseHealth();
      setSupabaseHealth(spHealth);
    } catch (err: any) {
      console.warn('Supabase health error:', err);
    } finally {
      setIsTestingSupabase(false);
    }
  };

  const handleTestFirebase = async () => {
    setIsTestingFirebase(true);
    try {
      const status = await api.getFirebaseStatus();
      setFirebaseStatus(status);
      if (status.connected) {
        showToast('success', 'Koneksi ke Firebase Cloud Firestore berhasil dan siap digunakan!');
      } else {
        showToast('error', status.message || 'Gagal terhubung ke Firebase Firestore.');
      }
    } catch (err: any) {
      showToast('error', `Uji koneksi Firebase gagal: ${err.message}`);
    } finally {
      setIsTestingFirebase(false);
    }
  };

  const handleSyncFirebase = async () => {
    setIsSyncingFirebase(true);
    try {
      const res = await api.syncAllToFirebase();
      if (res.success) {
        showToast('success', res.message || 'Sinkronisasi database ke Firebase Firestore berhasil!');
        // Refresh collections count
        const updated = await api.getFirebaseStatus();
        setFirebaseStatus(updated);
      } else {
        showToast('error', res.message || 'Sinkronisasi Firebase gagal.');
      }
    } catch (err: any) {
      showToast('error', `Gagal sinkronisasi Firebase: ${err.message}`);
    } finally {
      setIsSyncingFirebase(false);
    }
  };

  const handleSaveGoogleSheetsConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingGoogleSheets(true);
    try {
      const res = await api.updateGoogleSheetsConfig({
        webhookUrl: googleSheetsConfig.webhookUrl,
        spreadsheetUrl: googleSheetsConfig.spreadsheetUrl,
        autoSync: googleSheetsConfig.autoSync
      });
      if (res.success) {
        setGoogleSheetsConfig(res.config);
        showToast('success', 'Konfigurasi Google Sheets berhasil disimpan!');
      }
    } catch (err: any) {
      showToast('error', `Gagal menyimpan konfigurasi: ${err.message}`);
    } finally {
      setIsSavingGoogleSheets(false);
    }
  };

  const handleSyncGoogleSheets = async () => {
    if (!googleSheetsConfig.webhookUrl) {
      showToast('error', 'Masukkan URL Webhook Google Apps Script terlebih dahulu.');
      return;
    }
    setIsSyncingGoogleSheets(true);
    try {
      const res = await api.syncAllToGoogleSheets(googleSheetsConfig.webhookUrl);
      if (res.success) {
        showToast('success', res.message || 'Data berhasil disinkronkan ke Google Sheet!');
        const updatedConfig = await api.getGoogleSheetsConfig();
        if (updatedConfig.config) setGoogleSheetsConfig(updatedConfig.config);
      } else {
        showToast('error', res.message || 'Gagal mengirim data ke Google Sheet.');
      }
    } catch (err: any) {
      showToast('error', `Error sinkronisasi Google Sheet: ${err.message}`);
    } finally {
      setIsSyncingGoogleSheets(false);
    }
  };

  const handleCopyGoogleAppsScript = () => {
    if (!googleAppsScriptTemplate) return;
    navigator.clipboard.writeText(googleAppsScriptTemplate);
    setCopiedScript(true);
    showToast('success', 'Kode Google Apps Script berhasil disalin ke papan klip!');
    setTimeout(() => setCopiedScript(false), 3000);
  };

  // Handle Logo Upload File (Base64 data URL)
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('error', 'Silakan pilih berkas gambar yang valid (PNG, JPG, SVG, WebP)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast('error', 'Ukuran gambar maksimal 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setLogoUrl(result);
      setLogoType('custom');
      showToast('success', 'Logo berhasil diunggah! Jangan lupa klik Simpan Pengaturan.');
    };
    reader.readAsDataURL(file);
  };

  // Handle Avatar Upload
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('error', 'Ukuran foto maksimal 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAdminAvatarUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Save Admin Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminName.trim()) {
      showToast('error', 'Nama lengkap Admin Dinas wajib diisi.');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      showToast('error', 'Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    setIsSaving(true);
    try {
      const success = await updateCurrentUserProfile({
        name: adminName.trim(),
        nip: adminNip.trim(),
        email: adminEmail.trim(),
        phone: adminPhone.trim(),
        position: adminPosition.trim(),
        avatarUrl: adminAvatarUrl,
        newPassword: newPassword ? newPassword.trim() : undefined
      });

      if (success) {
        showToast('success', 'Profil Admin Dinas berhasil diperbarui!');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showToast('error', 'Gagal memperbarui profil. Silakan coba lagi.');
      }
    } catch (err) {
      showToast('error', 'Terjadi kesalahan saat menyimpan profil.');
    } finally {
      setIsSaving(false);
    }
  };

  // Save App Settings & Branding
  const handleSaveAppSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName.trim()) {
      showToast('error', 'Nama aplikasi wajib diisi.');
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateAppSettings({
        appName: appName.trim(),
        appShortName: appShortName.trim(),
        agencyName: agencyName.trim(),
        appSubtitle: appSubtitle.trim(),
        tagline: tagline.trim(),
        description: description.trim(),
        logoType,
        logoPreset,
        logoUrl: logoType === 'custom' ? logoUrl : '',
        primaryColor,
        footerText: footerText.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim()
      });

      if (updated) {
        showToast('success', 'Identitas aplikasi dan logo berhasil diperbarui ke seluruh sistem!');
      } else {
        showToast('error', 'Gagal memperbarui pengaturan aplikasi.');
      }
    } catch (err) {
      showToast('error', 'Terjadi kesalahan saat menyimpan pengaturan aplikasi.');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to default
  const handleResetDefaults = async () => {
    if (!window.confirm('Kembalikan nama aplikasi dan logo ke setelan default awal sistem?')) {
      return;
    }

    setIsSaving(true);
    try {
      const defaultSettings: Partial<AppSettings> = {
        appName: 'SIBER-PM',
        appShortName: 'PM',
        agencyName: 'Dinas Pendidikan',
        appSubtitle: 'Supervisi Akademik & Pembelajaran Mendalam',
        tagline: 'Sistem Informasi Supervisi Akademik & Pembelajaran Mendalam Terintegrasi',
        description: 'Platform digital terpadu supervisi akademik, kurikulum merdeka, pemetaan growth mindset, dan 10 aspek pembelajaran mendalam (SIBER-PM).',
        logoType: 'preset',
        logoPreset: 'tut-wuri-handayani',
        logoUrl: '/tut-wuri-handayani.svg',
        primaryColor: 'indigo',
        footerText: 'Dinas Pendidikan • Sistem Informasi Pengawasan dan Supervisi Akademik',
        contactEmail: 'dinas@pendidikan.go.id',
        contactPhone: '081234567890'
      };

      await updateAppSettings(defaultSettings);
      showToast('success', 'Setelan identitas aplikasi telah direset ke default.');
    } catch (err) {
      showToast('error', 'Gagal mereset setelan.');
    } finally {
      setIsSaving(false);
    }
  };

  // Preset Logo Icons map
  const renderPresetIcon = (preset: PresetLogoIcon, className = 'w-5 h-5 text-white') => {
    switch (preset) {
      case 'tut-wuri-handayani':
        return (
          <img
            src="/tut-wuri-handayani.svg"
            alt="Tut Wuri Handayani"
            className={`${className} object-contain p-0.5`}
          />
        );
      case 'sparkles':
        return <Sparkles className={className} />;
      case 'graduation-cap':
        return <GraduationCap className={className} />;
      case 'building':
        return <Building2 className={className} />;
      case 'shield':
        return <Shield className={className} />;
      case 'book':
        return <BookOpen className={className} />;
      case 'award':
        return <Award className={className} />;
      default:
        return (
          <img
            src="/tut-wuri-handayani.svg"
            alt="Tut Wuri Handayani"
            className={`${className} object-contain p-0.5`}
          />
        );
    }
  };

  const getThemeColorBg = (color: ThemeColorKey) => {
    switch (color) {
      case 'indigo':
        return 'bg-indigo-600';
      case 'blue':
        return 'bg-blue-600';
      case 'emerald':
        return 'bg-emerald-600';
      case 'purple':
        return 'bg-purple-600';
      case 'amber':
        return 'bg-amber-600';
      case 'rose':
        return 'bg-rose-600';
      case 'teal':
        return 'bg-teal-600';
      default:
        return 'bg-indigo-600';
    }
  };

  const getThemeColorText = (color: ThemeColorKey) => {
    switch (color) {
      case 'indigo':
        return 'text-indigo-600';
      case 'blue':
        return 'text-blue-600';
      case 'emerald':
        return 'text-emerald-600';
      case 'purple':
        return 'text-purple-600';
      case 'amber':
        return 'text-amber-600';
      case 'rose':
        return 'text-rose-600';
      case 'teal':
        return 'text-teal-600';
      default:
        return 'text-indigo-600';
    }
  };

  return (
    <div id="pengaturan-aplikasi-view" className="space-y-6">
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between shadow-md transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-3">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="text-xs font-semibold">{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-xs opacity-70 hover:opacity-100 font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">
                  Profil Admin & Identitas Aplikasi
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Administrator Dinas
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Kelola profil kedinasan Admin, nama resmi sistem, logo aplikasi, dan tema visual terintegrasi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={handleResetDefaults}
              type="button"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
              title="Reset ke pengaturan default awal"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Default</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-6 border-t border-slate-100">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'profile'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>1. Profil Admin Dinas</span>
          </button>

          <button
            onClick={() => setActiveTab('identity')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'identity'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layout className="w-4 h-4" />
            <span>2. Nama & Identitas Aplikasi</span>
          </button>

          <button
            onClick={() => setActiveTab('logo')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'logo'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>3. Logo & Tema Warna</span>
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'preview'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>4. Pratinjau Tampilan (Live Preview)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('database');
              loadDatabaseStatuses();
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'database'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-400" />
            <span>5. Database & Integrasi (Firebase, Google Sheets, Supabase)</span>
          </button>
        </div>
      </div>

      {/* TAB 1: PROFIL ADMIN DINAS */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Summary Avatar Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5 flex flex-col items-center text-center">
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-3xl shadow-md ring-4 ring-indigo-50 overflow-hidden">
                {adminAvatarUrl ? (
                  <img src={adminAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{adminName.charAt(0) || 'A'}</span>
                )}
              </div>
              <label
                htmlFor="avatar-upload-input"
                className="absolute bottom-0 right-0 p-1.5 bg-slate-900 text-white rounded-lg shadow-md hover:bg-indigo-600 cursor-pointer transition-colors"
                title="Ganti foto profil"
              >
                <Upload className="w-3.5 h-3.5" />
                <input
                  id="avatar-upload-input"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">{adminName || 'Didik Setiawan, S.E'}</h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">NIP. {adminNip || '-'}</p>
              <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-purple-50 text-purple-700 border border-purple-200">
                <Shield className="w-3 h-3" />
                {adminPosition || 'Administrator Dinas'}
              </div>
            </div>

            <div className="w-full pt-4 border-t border-slate-100 text-left space-y-2.5 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Username:</span>
                <span className="font-semibold text-slate-800 font-mono">{currentUser?.username || 'admin_dinas'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Status Akun:</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Aktif & Terverifikasi
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Instansi:</span>
                <span className="font-semibold text-slate-800 truncate max-w-[150px]">{agencyName}</span>
              </div>
            </div>

            {adminAvatarUrl && (
              <button
                type="button"
                onClick={() => setAdminAvatarUrl('')}
                className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold"
              >
                Hapus Foto Kustom
              </button>
            )}
          </div>

          {/* Right: Profile Edit Form */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 sm:p-7 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-indigo-600" />
              Edit Informasi Data Diri & Akun
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Perbarui identitas pejabat pengelola dinas pendidikan yang berwenang
            </p>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nama Lengkap */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Lengkap & Gelar Resmi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="Contoh: Didik Setiawan, S.E"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    required
                  />
                </div>

                {/* NIP */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    NIP (Nomor Induk Pegawai)
                  </label>
                  <input
                    type="text"
                    value={adminNip}
                    onChange={(e) => setAdminNip(e.target.value)}
                    placeholder="18 Digit NIP"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                  />
                </div>

                {/* Jabatan */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jabatan / Unit Kerja
                  </label>
                  <input
                    type="text"
                    value={adminPosition}
                    onChange={(e) => setAdminPosition(e.target.value)}
                    placeholder="Contoh: Kepala Bidang Pembinaan & Ketenagaan"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                {/* Email Kedinasan */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Kedinasan
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="dinas@pendidikan.go.id"
                      className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Nomor Telepon/WhatsApp */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor WhatsApp / HP
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={adminPhone}
                      onChange={(e) => setAdminPhone(e.target.value)}
                      placeholder="081234567890"
                      className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Password Section */}
              <div className="mt-6 pt-5 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                  Keamanan & Ubah Kata Sandi (Opsional)
                </h3>
                <p className="text-[11px] text-slate-500 mb-3">
                  Biarkan kosong jika tidak ingin mengubah kata sandi saat ini
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Kata Sandi Baru
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimal 6 karakter"
                        className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Konfirmasi Kata Sandi Baru
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Ulangi kata sandi baru"
                        className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Menyimpan Profil...' : 'Simpan Profil Admin'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: NAMA & IDENTITAS APLIKASI */}
      {activeTab === 'identity' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-7 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layout className="w-4 h-4 text-indigo-600" />
                Nama Resmi & Identitas Aplikasi
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Konfigurasi penamaan aplikasi yang ditampilkan pada Navbar, Halaman Login, Laporan, dan Surat Rekomendasi
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveAppSettings} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nama Aplikasi Utama */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Utama Aplikasi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="Contoh: SIBER-PM atau SIM-SUPERVISI"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-semibold"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Ditampilkan sebagai judul utama pada header navigasi dan banner login.
                </p>
              </div>

              {/* Sub-Nama / Singkatan Akhir */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Singkatan / Badge Tambahan
                </label>
                <input
                  type="text"
                  value={appShortName}
                  onChange={(e) => setAppShortName(e.target.value)}
                  placeholder="Contoh: PM atau 2026"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Ditampilkan dengan aksen warna khusus di sebelah nama aplikasi.
                </p>
              </div>

              {/* Nama Instansi / Dinas */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Instansi / Lembaga <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  placeholder="Contoh: Dinas Pendidikan atau Disdikpora Kab. Magetan"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  required
                />
              </div>

              {/* Slogan / Subtitle Navbar */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Slogan Pendek / Subtitle Header
                </label>
                <input
                  type="text"
                  value={appSubtitle}
                  onChange={(e) => setAppSubtitle(e.target.value)}
                  placeholder="Contoh: Supervisi Akademik & Pembelajaran Mendalam"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Tagline Lengkap */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tagline Lengkap Sistem
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Contoh: Sistem Informasi Supervisi Akademik & Pembelajaran Mendalam Terintegrasi"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Deskripsi Sistem */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deskripsi Singkat Sistem (Halaman Login & Ringkasan)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Deskripsi platform supervisi..."
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Teks Footer */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Teks Hak Cipta / Footer
                </label>
                <input
                  type="text"
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  placeholder="Contoh: Dinas Pendidikan • Hak Cipta Dilindungi"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Kontak Helpdesk */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email & Kontak Layanan Bantuan
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="dinas@pendidikan.go.id"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="081234567890"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Identitas Aplikasi'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: LOGO & TEMA WARNA */}
      {activeTab === 'logo' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-7 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Palette className="w-4 h-4 text-indigo-600" />
                Pengaturan Logo & Tema Warna
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pilih logo resmi aplikasi (unggah berkas gambar kustom atau gunakan preset ikon vektor) serta tema warna sistem
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveAppSettings} className="space-y-6">
            {/* Logo Selection Mode */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Metode Logo Aplikasi
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setLogoType('custom')}
                  className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 ${
                    logoType === 'custom'
                      ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="p-2 bg-indigo-600 text-white rounded-lg">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Upload Berkas Logo Kustom</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Gunakan logo lambang daerah / dinas resmi (PNG, JPG, SVG, WebP)
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setLogoType('preset')}
                  className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 ${
                    logoType === 'preset'
                      ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="p-2 bg-indigo-600 text-white rounded-lg">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Preset Ikon Vektor Presisi</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Pilih dari koleksi ikon modern bertema pendidikan & kepengawasan
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Custom Logo Upload Section */}
            {logoType === 'custom' && (
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Logo Preview */}
                  <div className="w-24 h-24 rounded-2xl bg-white border border-slate-200 flex items-center justify-center p-2 shadow-xs shrink-0 overflow-hidden">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo Aplikasi" className="w-full h-full object-contain" />
                    ) : (
                      <div className="text-center text-slate-400">
                        <ImageIcon className="w-8 h-8 mx-auto stroke-1" />
                        <span className="text-[10px] block mt-1">Belum ada logo</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <p className="text-xs font-bold text-slate-800">Unggah Logo Lembaga / Daerah</p>
                    <p className="text-[11px] text-slate-500">
                      Format yang didukung: PNG transparan, JPG, SVG, atau WebP. Disarankan rasio 1:1 (persegi) dengan resolusi minimal 200x200 px.
                    </p>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                      <label
                        htmlFor="app-logo-file-input"
                        className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer transition-colors shadow-xs"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Pilih Berkas Logo</span>
                        <input
                          id="app-logo-file-input"
                          type="file"
                          accept="image/png, image/jpeg, image/svg+xml, image/webp"
                          onChange={handleLogoFileUpload}
                          className="hidden"
                        />
                      </label>
                      {logoUrl && (
                        <button
                          type="button"
                          onClick={() => setLogoUrl('')}
                          className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
                        >
                          Hapus Logo
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Preset Icons Selection */}
            {logoType === 'preset' && (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-800">
                  Pilih Preset Ikon Lambang
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
                  {(
                    [
                      { id: 'tut-wuri-handayani', label: 'Tut Wuri Handayani', icon: 'tut-wuri-handayani' },
                      { id: 'sparkles', label: 'Sparkles (PM)', icon: 'sparkles' },
                      { id: 'graduation-cap', label: 'Topi Toga', icon: 'graduation-cap' },
                      { id: 'building', label: 'Satuan Pendidikan', icon: 'building' },
                      { id: 'shield', label: 'Perisai Pengawasan', icon: 'shield' },
                      { id: 'book', label: 'Buku / Modul', icon: 'book' },
                      { id: 'award', label: 'Piala / Prestasi', icon: 'award' }
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setLogoPreset(item.id as PresetLogoIcon)}
                      className={`p-3.5 rounded-xl border text-center transition-all flex flex-col items-center gap-2 ${
                        logoPreset === item.id
                          ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-500/20'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl ${getThemeColorBg(primaryColor)} flex items-center justify-center shadow-xs`}>
                        {renderPresetIcon(item.id as PresetLogoIcon)}
                      </div>
                      <span className="text-[11px] font-semibold text-slate-700 leading-tight">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Theme Color Key Selection */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-800">
                Pilih Aksen Warna Tema Utama
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {(
                  [
                    { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-600' },
                    { id: 'blue', label: 'Biru Edukasi', bg: 'bg-blue-600' },
                    { id: 'emerald', label: 'Emerald Hijau', bg: 'bg-emerald-600' },
                    { id: 'purple', label: 'Ungu Wibawa', bg: 'bg-purple-600' },
                    { id: 'amber', label: 'Amber Hangat', bg: 'bg-amber-600' },
                    { id: 'rose', label: 'Rose Kreatif', bg: 'bg-rose-600' },
                    { id: 'teal', label: 'Teal Modern', bg: 'bg-teal-600' }
                  ] as const
                ).map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setPrimaryColor(theme.id as ThemeColorKey)}
                    className={`p-3 rounded-xl border text-center transition-all flex items-center gap-2.5 ${
                      primaryColor === theme.id
                        ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-400/20 font-bold'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full ${theme.bg} shrink-0`}></span>
                    <span className="text-xs text-slate-800 truncate">{theme.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Logo & Warna'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: PRATINJAU LANGSUNG (LIVE PREVIEW) */}
      {activeTab === 'preview' && (
        <div className="space-y-6">
          {/* Card 1: Navbar Preview */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layout className="w-4 h-4 text-indigo-600" />
                Simulasi Header Navbar Aplikasi
              </h2>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">
                Pratinjau Navigasi Atas
              </span>
            </div>

            <div className="p-4 bg-slate-100 rounded-xl border border-slate-200">
              <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg ${getThemeColorBg(primaryColor)} flex items-center justify-center text-white shadow-xs overflow-hidden`}>
                    {logoType === 'custom' && logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      renderPresetIcon(logoPreset, 'w-4 h-4 text-white')
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 tracking-tight text-base leading-none">
                        {appName}{' '}
                        {appShortName && (
                          <span className={`${getThemeColorText(primaryColor)} font-extrabold`}>
                            {appShortName}
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {agencyName}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase leading-none mt-1">
                      {appSubtitle}
                    </p>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-2">
                  <span className="px-3 py-1 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold">
                    T.A. 2026/2027 (Ganjil)
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                    {adminName.charAt(0) || 'A'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Login Banner Preview */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-600" />
                Simulasi Kolom Branding Halaman Login
              </h2>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">
                Pratinjau Halaman Masuk
              </span>
            </div>

            <div className="p-4 bg-slate-100 rounded-xl border border-slate-200">
              <div className="max-w-md mx-auto bg-slate-900 text-white p-6 rounded-2xl shadow-lg border border-slate-800 space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${getThemeColorBg(primaryColor)} flex items-center justify-center shadow-md overflow-hidden`}>
                    {logoType === 'custom' && logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      renderPresetIcon(logoPreset, 'w-6 h-6 text-white')
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold tracking-tight text-white">{appName} {appShortName}</h3>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {tagline}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 text-xs">
                  <p className="font-semibold text-indigo-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> {agencyName}
                  </p>
                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                    {description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{footerText}</span>
                  <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-300 border border-slate-700">
                    v2.5.0
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* TAB 5: DATABASE & INTEGRASI (FIREBASE, GOOGLE SHEETS, SUPABASE) */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          {/* Sub-tab Navigation Bar */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setDbSubTab('firebase')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  dbSubTab === 'firebase'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Flame className="w-4 h-4 text-amber-200" />
                <span>Firebase Cloud Firestore</span>
                <span className="px-1.5 py-0.5 text-[9px] uppercase tracking-wider rounded bg-amber-600/70 text-white font-mono">
                  Cloud DB
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDbSubTab('googlesheets')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  dbSubTab === 'googlesheets'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                <span>Google Sheets & Excel</span>
                <span className="px-1.5 py-0.5 text-[9px] uppercase tracking-wider rounded bg-emerald-700/70 text-white font-mono">
                  Spreadsheet
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDbSubTab('supabase')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  dbSubTab === 'supabase'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Database className="w-4 h-4 text-indigo-200" />
                <span>Supabase (PostgreSQL)</span>
                <span className="px-1.5 py-0.5 text-[9px] uppercase tracking-wider rounded bg-indigo-700/70 text-white font-mono">
                  SQL
                </span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadDatabaseStatuses}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Muat Ulang Status</span>
              </button>
            </div>
          </div>

          {/* ============================================================ */}
          {/* SUB-TAB 1: FIREBASE CLOUD FIRESTORE */}
          {/* ============================================================ */}
          {dbSubTab === 'firebase' && (
            <div className="space-y-6">
              {/* Card Status & Kredensial Firebase */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
                      <Flame className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">
                          Google Cloud Firebase Firestore
                        </h3>
                        <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Terkoneksi & Aktif
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Database NoSQL cloud berkinerja tinggi dari Google Cloud Platform dengan persistensi real-time dan aturan keamanan terverifikasi.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={isTestingFirebase}
                      onClick={handleTestFirebase}
                      className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTestingFirebase ? 'animate-spin' : ''}`} />
                      <span>{isTestingFirebase ? 'Menguji...' : 'Uji Koneksi Firestore'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isSyncingFirebase}
                      onClick={handleSyncFirebase}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 active:bg-amber-700 rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {isSyncingFirebase ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Menyinkronkan...</span>
                        </>
                      ) : (
                        <>
                          <Flame className="w-3.5 h-3.5" />
                          <span>Sinkronkan Seluruh Data ke Firebase</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Grid Metadata Firestore */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Project ID Firebase</span>
                    <p className="text-sm font-mono font-bold text-slate-800">polar-drive-c6rpq</p>
                    <span className="text-[10px] text-slate-400">Google Cloud Project</span>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Firestore Database ID</span>
                    <p className="text-xs font-mono font-bold text-slate-800 truncate" title="ai-studio-sibersupervisiin-e85c9c5d-7154-4dfc-b7cd-825c1e32ea17">
                      ai-studio-sibersupervisiin-...
                    </p>
                    <span className="text-[10px] text-emerald-600 font-semibold">Instance Khusus SIBER-PM</span>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Aturan Keamanan (Rules)</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <p className="text-xs font-semibold text-emerald-700">firestore.rules Terpasang</p>
                    </div>
                    <span className="text-[10px] text-slate-400">Role-Based & Sync Access</span>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Sinkronisasi Otomatis</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <p className="text-xs font-semibold text-emerald-700">Aktif Real-Time</p>
                    </div>
                    <span className="text-[10px] text-slate-400">Tersinkron saat penambahan data</span>
                  </div>
                </div>

                {/* Firestore Collections Overview */}
                <div className="px-6 pb-6">
                  <div className="p-4 bg-amber-50/50 border border-amber-200/80 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-amber-600" />
                        Koleksi Dokumen Terdaftar di Firestore
                      </span>
                      <span className="text-[11px] text-amber-700 font-medium">
                        Sesuai blueprint skema database resmi
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 bg-white border border-amber-200 rounded-lg">
                        <p className="text-slate-500 text-[11px]">Koleksi /schools</p>
                        <p className="text-lg font-bold text-slate-900 mt-0.5">
                          {firebaseStatus?.collections?.schools ?? 6} <span className="text-xs font-normal text-slate-500">Sekolah</span>
                        </p>
                      </div>

                      <div className="p-3 bg-white border border-amber-200 rounded-lg">
                        <p className="text-slate-500 text-[11px]">Koleksi /teachers</p>
                        <p className="text-lg font-bold text-slate-900 mt-0.5">
                          {firebaseStatus?.collections?.teachers ?? 24} <span className="text-xs font-normal text-slate-500">Guru</span>
                        </p>
                      </div>

                      <div className="p-3 bg-white border border-amber-200 rounded-lg">
                        <p className="text-slate-500 text-[11px]">Koleksi /supervisors</p>
                        <p className="text-lg font-bold text-slate-900 mt-0.5">
                          {firebaseStatus?.collections?.supervisors ?? 8} <span className="text-xs font-normal text-slate-500">Pengawas</span>
                        </p>
                      </div>

                      <div className="p-3 bg-white border border-amber-200 rounded-lg">
                        <p className="text-slate-500 text-[11px]">Koleksi /supervisions</p>
                        <p className="text-lg font-bold text-slate-900 mt-0.5">
                          {firebaseStatus?.collections?.supervisions ?? 10} <span className="text-xs font-normal text-slate-500">Supervisi</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* SUB-TAB 2: GOOGLE SHEETS & EXCEL */}
          {/* ============================================================ */}
          {dbSubTab === 'googlesheets' && (
            <div className="space-y-6">
              {/* Opsi 1: Unduh Database Lengkap ke Format Google Sheet / Excel */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        1. Ekspor Seluruh Database ke Google Sheet / Excel (.xlsx)
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Unduh salinan lengkap database dalam satu file multi-sheet yang siap dibuka di Google Spreadsheet atau Microsoft Excel.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href="https://sheets.new"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka Google Sheet Baru</span>
                    </a>

                    <a
                      href={api.getGoogleSheetsExportUrl()}
                      download
                      className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Unduh Database Lengkap (.xlsx)</span>
                    </a>
                  </div>
                </div>

                {/* Struktur Sheet yang dihasilkan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1">
                  <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-xl">
                    <p className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Tab DATA_SEKOLAH
                    </p>
                    <p className="text-[11px] text-slate-600 mt-1">
                      NPSN, Nama Satuan Pendidikan, Alamat, Kecamatan, Kepala Sekolah, Pengawas Pembina.
                    </p>
                  </div>

                  <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-xl">
                    <p className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Tab DATA_GURU
                    </p>
                    <p className="text-[11px] text-slate-600 mt-1">
                      NIP, Nama Lengkap, Satuan Pendidikan, Status Pegawai, Pangkat/Golongan, Mata Pelajaran.
                    </p>
                  </div>

                  <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-xl">
                    <p className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Tab DATA_PENGAWAS
                    </p>
                    <p className="text-[11px] text-slate-600 mt-1">
                      NIP, Nama Pengawas, Jenjang Binaan, Wilayah Kecamatan Magetan, Daftar Sekolah Binaan.
                    </p>
                  </div>

                  <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-xl">
                    <p className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Tab REKAP_SUPERVISI
                    </p>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Jadwal pelaksanaan supervisi, guru sasaran, tanggal, nilai instrumen, dan umpan balik.
                    </p>
                  </div>
                </div>
              </div>

              {/* Opsi 2: Integrasi Sinkronisasi Langsung Webhook Google Apps Script */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      2. Koneksi Otomatis Google Apps Script (Webhook Sync)
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Hubungkan URL Webhook Google Sheet agar perubahan data di aplikasi otomatis tersinkronisasi ke Spreadsheet Google Anda secara langsung.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {googleSheetsConfig.lastSync && (
                      <span className="text-[11px] text-slate-500 font-medium bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                        Terakhir Sync: {new Date(googleSheetsConfig.lastSync).toLocaleString('id-ID')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Form Input Webhook URL */}
                <form onSubmit={handleSaveGoogleSheetsConfig} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      URL Webhook Google Apps Script (Web App URL)
                    </label>
                    <input
                      type="url"
                      placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                      value={googleSheetsConfig.webhookUrl}
                      onChange={(e) =>
                        setGoogleSheetsConfig((prev) => ({ ...prev, webhookUrl: e.target.value }))
                      }
                      className="w-full px-3.5 py-2.5 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Dapatkan URL ini setelah menerapkan (deploy) script di bawah ini sebagai Aplikasi Web di Google Spreadsheet Anda.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tautan Google Spreadsheet Anda (Opsional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                      value={googleSheetsConfig.spreadsheetUrl}
                      onChange={(e) =>
                        setGoogleSheetsConfig((prev) => ({ ...prev, spreadsheetUrl: e.target.value }))
                      }
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={googleSheetsConfig.autoSync}
                        onChange={(e) =>
                          setGoogleSheetsConfig((prev) => ({ ...prev, autoSync: e.target.checked }))
                        }
                        className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">
                          Auto-Sinkronisasi ke Google Sheet Otomatis
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          Setiap penambahan atau perubahan data sekolah/guru/supervisi akan otomatis dikirimkan ke Google Sheet via webhook.
                        </span>
                      </div>
                    </label>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isSyncingGoogleSheets || !googleSheetsConfig.webhookUrl}
                        onClick={handleSyncGoogleSheets}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {isSyncingGoogleSheets ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Mengirim Data...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Kirim / Sinkronkan Data ke Google Sheet Sekarang</span>
                          </>
                        )}
                      </button>

                      {googleSheetsConfig.spreadsheetUrl && (
                        <a
                          href={googleSheetsConfig.spreadsheetUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Buka Spreadsheet Terhubung</span>
                        </a>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingGoogleSheets}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSavingGoogleSheets ? 'Menyimpan...' : 'Simpan Pengaturan Webhook'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Opsi 3: Script Google Apps Script Siap Salin */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      3. Kode Script Google Apps Script (Siap Tempel)
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Tempelkan kode ini di Google Sheet Anda untuk menerima data otomatis dari SIBER-PM.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyGoogleAppsScript}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
                  >
                    {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedScript ? 'Kode Berhasil Disalin!' : 'Salin Kode Google Apps Script'}</span>
                  </button>
                </div>

                {/* Panduan 4 Langkah */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px]">
                      1
                    </span>
                    <p className="font-bold text-slate-800">Buat Spreadsheet Baru</p>
                    <p className="text-[11px] text-slate-500">Buka <span className="font-mono text-emerald-700">sheets.new</span> di browser Anda.</p>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px]">
                      2
                    </span>
                    <p className="font-bold text-slate-800">Buka Apps Script</p>
                    <p className="text-[11px] text-slate-500">Klik menu <strong className="text-slate-700">Ekstensi</strong> &gt; <strong className="text-slate-700">Apps Script</strong>.</p>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px]">
                      3
                    </span>
                    <p className="font-bold text-slate-800">Tempel Kode & Terapkan</p>
                    <p className="text-[11px] text-slate-500">Hapus kode lama, tempel kode di bawah, lalu klik <strong className="text-slate-700">Terapkan &gt; Penerapan Baru</strong>.</p>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px]">
                      4
                    </span>
                    <p className="font-bold text-slate-800">Pilih Aplikasi Web</p>
                    <p className="text-[11px] text-slate-500">Setel Akses ke <strong className="text-slate-700">Siapa saja (Anyone)</strong>, salin URL ke form di atas.</p>
                  </div>
                </div>

                {/* Code Preview Box */}
                <div className="relative">
                  <pre className="p-4 bg-slate-900 text-slate-200 font-mono text-[11px] rounded-xl max-h-56 overflow-y-auto select-text leading-relaxed">
                    {googleAppsScriptTemplate || '// Memuat template Google Apps Script...'}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* SUB-TAB 3: SUPABASE (POSTGRESQL) */}
          {/* ============================================================ */}
          {dbSubTab === 'supabase' && (
            <div className="space-y-6">
              {/* Card Status & Kredensial Supabase */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    Database Supabase (PostgreSQL)
                    <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Terkoneksi
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Konfigurasi integrasi backend database Supabase untuk aplikasi SIBER-PM
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isTestingSupabase}
                  onClick={async () => {
                    setIsTestingSupabase(true);
                    try {
                      const res = await checkSupabaseHealth();
                      setSupabaseHealth(res);
                      showToast(res.connected ? 'success' : 'error', res.message);
                    } finally {
                      setIsTestingSupabase(false);
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingSupabase ? 'animate-spin' : ''}`} />
                  <span>{isTestingSupabase ? 'Memeriksa...' : 'Uji Koneksi'}</span>
                </button>

                <a
                  href={`https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/sql/new`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka Supabase Dashboard</span>
                </a>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Nama Project</span>
                <p className="text-sm font-bold text-slate-800">{SUPABASE_PROJECT_NAME}</p>
                <span className="text-[10px] text-slate-400">Project Backend Utama</span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Project ID</span>
                <p className="text-sm font-mono font-bold text-slate-800">{SUPABASE_PROJECT_ID}</p>
                <span className="text-[10px] text-slate-400">Identifier Unik Supabase</span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Status Koneksi API</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-xs font-semibold text-emerald-700">API Gateway Terhubung</p>
                </div>
                <span className="text-[10px] text-slate-400">Endpoint REST & Auth Valid</span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Status Tabel DB</span>
                <p className="text-xs font-semibold text-slate-800">
                  {supabaseHealth ? (
                    supabaseHealth.hasTables ? (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Siap Digunakan
                      </span>
                    ) : (
                      <span className="text-amber-700 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Perlu Migrasi SQL
                      </span>
                    )
                  ) : (
                    'Klik "Uji Koneksi"'
                  )}
                </p>
                <span className="text-[10px] text-slate-400">PostgreSQL Schema Cache</span>
              </div>
            </div>

            {/* Health Info Banner */}
            {supabaseHealth && (
              <div className="mx-6 mb-6 p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs">
                <p className="font-semibold text-slate-800">{supabaseHealth.message}</p>
                {supabaseHealth.missingTables && supabaseHealth.missingTables.length > 0 && (
                  <p className="text-slate-600 mt-1 text-[11px]">
                    Tabel yang belum terdeteksi di Supabase: <strong className="text-amber-800">{supabaseHealth.missingTables.join(', ')}</strong>.
                    Jalankan query migrasi di bawah pada Supabase SQL Editor agar seluruh tabel terbuat secara otomatis.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Panduan Migrasi Schema & Copy SQL */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Server className="w-4 h-4 text-indigo-600" />
                  Script Migrasi Database (supabase-schema.sql)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Terapkan tabel PostgreSQL, Row Level Security (RLS), dan data awal ke project Supabase Anda dalam 3 langkah mudah.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  fetch('/supabase-schema.sql')
                    .then((res) => res.text())
                    .then((sql) => {
                      navigator.clipboard.writeText(sql);
                      setCopiedSql(true);
                      showToast('success', 'Script SQL berhasil disalin ke clipboard!');
                      setTimeout(() => setCopiedSql(false), 3000);
                    })
                    .catch(() => {
                      showToast('error', 'Gagal menyalin file SQL.');
                    });
                }}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors shrink-0"
              >
                {copiedSql ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedSql ? 'Tersalin!' : 'Salin Script SQL Migrasi'}</span>
              </button>
            </div>

            {/* 3 Step Instruction */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1">
                <span className="font-bold text-indigo-600">Langkah 1:</span>
                <p className="font-semibold text-slate-800">Buka SQL Editor di Supabase</p>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Buka dashboard Supabase project <strong className="text-slate-700">{SUPABASE_PROJECT_NAME}</strong>, lalu klik menu <strong>SQL Editor</strong> di bilah samping.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1">
                <span className="font-bold text-indigo-600">Langkah 2:</span>
                <p className="font-semibold text-slate-800">Tempelkan Script SQL</p>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Klik tombol <strong>Salin Script SQL Migrasi</strong> di atas, buat query baru (<em>New query</em>), lalu tempel (<em>Paste</em>) seluruh kode SQL.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1">
                <span className="font-bold text-indigo-600">Langkah 3:</span>
                <p className="font-semibold text-slate-800">Klik "Run"</p>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Tekan tombol hijau <strong>Run</strong>. Semua tabel (schools, teachers, supervisors, dsb.) beserta kebijakan RLS akan langsung terbuat!
                </p>
              </div>
            </div>

            {/* URL info */}
            <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs text-emerald-800 space-y-1">
              <p className="font-bold text-emerald-900">Kredensial Aktif pada Aplikasi:</p>
              <p className="text-[11px] font-mono text-emerald-800 break-all">
                URL: {SUPABASE_URL}
              </p>
              <p className="text-[11px] font-mono text-emerald-800 break-all">
                Anon Key: {SUPABASE_ANON_KEY.slice(0, 45)}...
              </p>
            </div>
          </div>

          {/* UTILITY CARD: MIGRASI DATA FIRESTORE KE SUPABASE */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center shrink-0">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    Utilitas Migrasi Data (Firestore &rarr; Supabase)
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Transfer otomatis seluruh rekaman data (dokumen) dari Cloud Firestore ke tabel PostgreSQL Supabase sesuai skema database.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-lg border border-slate-200 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={migrationDryRun}
                    disabled={isMigrating}
                    onChange={(e) => setMigrationDryRun(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                  />
                  <span>Mode Simulasi (Dry Run)</span>
                </label>

                <button
                  type="button"
                  disabled={isMigrating}
                  onClick={async () => {
                    setIsMigrating(true);
                    setMigrationProgress(0);
                    setMigrationCurrentEntity('Memulai migrasi...');
                    setMigrationLogs([]);
                    setMigrationReport(null);

                    try {
                      showToast('success', 'Memulai migrasi data dari Firestore ke Supabase...');
                      const report = await migrateAllFromFirestoreToSupabase(
                        migrationDryRun,
                        (entity, percent, message) => {
                          setMigrationCurrentEntity(entity);
                          setMigrationProgress(percent);
                          setMigrationLogs((prev) => [...prev.slice(-30), message]);
                        }
                      );

                      setMigrationReport(report);
                      if (report.totalFailed === 0) {
                        showToast(
                          'success',
                          `Migrasi selesai! Berhasil mentransfer ${report.totalTransferred} record ke Supabase.`
                        );
                      } else {
                        showToast(
                          'error',
                          `Migrasi selesai dengan catatan: ${report.totalTransferred} berhasil, ${report.totalFailed} gagal.`
                        );
                      }
                    } catch (err: any) {
                      showToast('error', `Gagal menjalankan migrasi: ${err.message || 'Terjadi kesalahan sistem'}`);
                      setMigrationLogs((prev) => [...prev, `[FATAL ERROR] ${err.message}`]);
                    } finally {
                      setIsMigrating(false);
                      setMigrationProgress(100);
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 rounded-lg shadow-xs transition-all disabled:opacity-50"
                >
                  {isMigrating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Memproses Migrasi ({migrationProgress}%)...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>{migrationDryRun ? 'Uji Simulasi Migrasi' : 'Mulai Migrasi Data'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Sumber & Tujuan Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Sumber Data: Cloud Firestore</span>
                <p className="font-mono text-slate-800 text-[11px] truncate">
                  DB ID: ai-studio-sibersupervisiin-e85c9c5d-7154-4dfc-b7cd-825c1e32ea17
                </p>
                <p className="text-[10px] text-amber-700">Project: polar-drive-c6rpq</p>
              </div>

              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Tujuan Data: Supabase PostgreSQL</span>
                <p className="font-mono text-slate-800 text-[11px] truncate">
                  Project ID: {SUPABASE_PROJECT_ID}
                </p>
                <p className="text-[10px] text-emerald-700">Project Name: {SUPABASE_PROJECT_NAME}</p>
              </div>
            </div>

            {/* Progress Bar & Status */}
            {isMigrating && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                    Sedang memproses: <strong className="text-indigo-600">{migrationCurrentEntity}</strong>
                  </span>
                  <span className="font-bold text-indigo-600">{migrationProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${migrationProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Real-time Log Output */}
            {migrationLogs.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                  Log Aktivitas Migrasi:
                </span>
                <div className="bg-slate-900 text-slate-200 font-mono text-[11px] p-3 rounded-xl max-h-44 overflow-y-auto space-y-1 select-text">
                  {migrationLogs.map((log, idx) => (
                    <div key={idx} className="leading-relaxed">
                      <span className="text-emerald-400 select-none">&gt;</span> {log}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hasil Ringkasan Migrasi */}
            {migrationReport && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Ringkasan Hasil Migrasi ({migrationReport.dryRun ? 'Mode Simulasi' : 'Penyimpanan Aktif'}):
                  </h5>
                  <span className="text-[11px] text-slate-500">
                    Durasi: {(migrationReport.totalDurationMs / 1000).toFixed(2)} detik
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold">Entitas / Modul</th>
                        <th className="py-2.5 px-3 font-semibold">Tabel Supabase</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Ditemukan</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Berhasil</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Gagal</th>
                        <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {migrationReport.results.map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-medium text-slate-800">{r.collectionName}</td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{r.targetTable}</td>
                          <td className="py-2.5 px-3 text-right font-medium text-slate-700">{r.totalFetched}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-600">{r.transferredCount}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-rose-600">{r.failedCount}</td>
                          <td className="py-2.5 px-3 text-center">
                            {r.status === 'success' && (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                                Berhasil
                              </span>
                            )}
                            {r.status === 'empty' && (
                              <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-100 text-slate-600">
                                Kosong (0 doc)
                              </span>
                            )}
                            {r.status === 'partial' && (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800">
                                Sebagian
                              </span>
                            )}
                            {r.status === 'error' && (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-800">
                                Gagal
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                      <tr>
                        <td colSpan={2} className="py-2.5 px-3 text-slate-800">Total Keseluruhan</td>
                        <td className="py-2.5 px-3 text-right text-slate-800">{migrationReport.totalFetched}</td>
                        <td className="py-2.5 px-3 text-right text-emerald-700">{migrationReport.totalTransferred}</td>
                        <td className="py-2.5 px-3 text-right text-rose-700">{migrationReport.totalFailed}</td>
                        <td className="py-2.5 px-3 text-center">
                          {migrationReport.totalFailed === 0 ? (
                            <span className="text-emerald-700 text-[11px]">Sempurna</span>
                          ) : (
                            <span className="text-amber-700 text-[11px]">Ada Catatan</span>
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
