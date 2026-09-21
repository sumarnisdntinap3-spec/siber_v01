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
  FileCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppSettings, PresetLogoIcon, ThemeColorKey, User } from '../types';

export const PengaturanAplikasiView: React.FC = () => {
  const {
    currentUser,
    appSettings,
    updateAppSettings,
    updateCurrentUserProfile,
    refreshGlobalData
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'identity' | 'logo' | 'preview'>('profile');

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
    </div>
  );
};
