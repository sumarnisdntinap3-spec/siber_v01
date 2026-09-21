import React, { useState, useEffect } from 'react';
import {
  Palette,
  Layout,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  Eye,
  Sliders,
  Type,
  Maximize2,
  Megaphone,
  Grid,
  Check,
  Building2,
  GraduationCap,
  School as SchoolIcon,
  Shield,
  Sun,
  Moon,
  Smartphone,
  Monitor,
  Laptop,
  ArrowRight,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  AppSettings,
  TemplatePresetKey,
  ThemeColorKey,
  SidebarStyleKey,
  CardRadiusKey,
  DensityModeKey,
  FontFamilyKey,
  NavbarStyleKey,
  BgPatternKey,
  PresetLogoIcon
} from '../types';

interface TemplatePresetDefinition {
  key: TemplatePresetKey;
  name: string;
  category: string;
  description: string;
  primaryColor: ThemeColorKey;
  sidebarStyle: SidebarStyleKey;
  navbarStyle: NavbarStyleKey;
  cardRadius: CardRadiusKey;
  density: DensityModeKey;
  fontFamily: FontFamilyKey;
  bgPattern: BgPatternKey;
  previewGradient: string;
  badgeText: string;
}

const TEMPLATE_PRESETS: TemplatePresetDefinition[] = [
  {
    key: 'modern-corporate',
    name: 'Modern Kemendikbud',
    category: 'Standar Nasional',
    description: 'Tata letak resmi dengan nuansa Indigo modern, sidebar terang bersih, dan tipografi Plus Jakarta Sans.',
    primaryColor: 'indigo',
    sidebarStyle: 'light',
    navbarStyle: 'white',
    cardRadius: 'rounded',
    density: 'comfortable',
    fontFamily: 'jakarta',
    bgPattern: 'none',
    previewGradient: 'from-indigo-600 to-indigo-800',
    badgeText: 'Default Rekomendasi'
  },
  {
    key: 'classic-emerald',
    name: 'Hijau Edukasi / Kemenag',
    category: 'Formal Edukatif',
    description: 'Nuansa hijau emerald segar mencerminkan pertumbuhan, keterbukaan kurikulum, dan integritas akademik.',
    primaryColor: 'emerald',
    sidebarStyle: 'light',
    navbarStyle: 'white',
    cardRadius: 'soft',
    density: 'comfortable',
    fontFamily: 'inter',
    bgPattern: 'dots',
    previewGradient: 'from-emerald-600 to-teal-800',
    badgeText: 'Populer Sekolah'
  },
  {
    key: 'ocean-gov',
    name: 'Birokrasi Maritim / Ocean',
    category: 'Pemerintahan Resmi',
    description: 'Warna biru maritim khas tata kelola dinas pemerintahan daerah yang formal, tegas, dan berwibawa.',
    primaryColor: 'blue',
    sidebarStyle: 'dark',
    navbarStyle: 'glass',
    cardRadius: 'subtle',
    density: 'comfortable',
    fontFamily: 'inter',
    bgPattern: 'grid',
    previewGradient: 'from-blue-600 to-cyan-800',
    badgeText: 'Resmi Pemda'
  },
  {
    key: 'royal-purple',
    name: 'Ungu Prestasi & Inovasi',
    category: 'Eksklusif & Kreatif',
    description: 'Warna ungu megah dengan sidebar aksen dinamis, menonjolkan inovasi kepemimpinan dan pencapaian guru.',
    primaryColor: 'purple',
    sidebarStyle: 'colored',
    navbarStyle: 'white',
    cardRadius: 'rounded',
    density: 'comfortable',
    fontFamily: 'poppins',
    bgPattern: 'mesh',
    previewGradient: 'from-purple-600 to-indigo-900',
    badgeText: 'Kreatif'
  },
  {
    key: 'sunset-amber',
    name: 'Hangat Inspiratif / Amber',
    category: 'Apresiatif & Ramah',
    description: 'Sentuhan warna amber emas yang bersahabat, meningkatkan motivasi supervisi dan budaya apresiasi.',
    primaryColor: 'amber',
    sidebarStyle: 'light',
    navbarStyle: 'white',
    cardRadius: 'soft',
    density: 'comfortable',
    fontFamily: 'poppins',
    bgPattern: 'waves',
    previewGradient: 'from-amber-500 to-orange-700',
    badgeText: 'Humanis'
  },
  {
    key: 'cyber-teal',
    name: 'Toska Digital Modern',
    category: 'Transformasi Digital',
    description: 'Nuansa teal futuristik dengan efek glassmorphism transparan, merepresentasikan digitalisasi sekolah.',
    primaryColor: 'teal',
    sidebarStyle: 'glass',
    navbarStyle: 'glass',
    cardRadius: 'rounded',
    density: 'compact',
    fontFamily: 'jakarta',
    bgPattern: 'dots',
    previewGradient: 'from-teal-500 to-emerald-800',
    badgeText: 'Futuristik'
  },
  {
    key: 'slate-minimal',
    name: 'Dark Contrast / Slate Pro',
    category: 'Kontras Tinggi',
    description: 'Sidebar gelap obsidian dengan kartu kontras tinggi, sangat nyaman di mata untuk analisa data padat.',
    primaryColor: 'indigo',
    sidebarStyle: 'dark',
    navbarStyle: 'dark',
    cardRadius: 'subtle',
    density: 'compact',
    fontFamily: 'slate',
    bgPattern: 'none',
    previewGradient: 'from-slate-800 to-slate-950',
    badgeText: 'Fokus Data'
  }
];

export const TampilanTemplateView: React.FC = () => {
  const { appSettings, updateAppSettings, currentUser } = useAuth();

  // Form State
  const [selectedTemplate, setSelectedTemplate] = useState<TemplatePresetKey>(
    appSettings?.templatePreset || 'modern-corporate'
  );
  const [primaryColor, setPrimaryColor] = useState<ThemeColorKey>(appSettings?.primaryColor || 'indigo');
  const [sidebarStyle, setSidebarStyle] = useState<SidebarStyleKey>(appSettings?.sidebarStyle || 'light');
  const [navbarStyle, setNavbarStyle] = useState<NavbarStyleKey>(appSettings?.navbarStyle || 'white');
  const [cardRadius, setCardRadius] = useState<CardRadiusKey>(appSettings?.cardRadius || 'rounded');
  const [density, setDensity] = useState<DensityModeKey>(appSettings?.density || 'comfortable');
  const [fontFamily, setFontFamily] = useState<FontFamilyKey>(appSettings?.fontFamily || 'jakarta');
  const [bgPattern, setBgPattern] = useState<BgPatternKey>(appSettings?.bgPattern || 'none');

  // Announcement Banner
  const [enableAnnouncement, setEnableAnnouncement] = useState<boolean>(
    appSettings?.enableAnnouncement ?? true
  );
  const [announcementText, setAnnouncementText] = useState<string>(
    appSettings?.announcementText ||
      'Periode Supervisi Akademik & Pembelajaran Mendalam Semester Aktif Sedang Berlangsung'
  );
  const [announcementType, setAnnouncementType] = useState<'info' | 'warning' | 'success' | 'urgent'>(
    appSettings?.announcementType || 'info'
  );

  // Preview State
  const [previewRole, setPreviewRole] = useState<'GURU' | 'KEPALA_SEKOLAH' | 'PENGAWAS' | 'ADMIN_DINAS'>('GURU');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync with current settings when updated
  useEffect(() => {
    if (appSettings) {
      setSelectedTemplate(appSettings.templatePreset || 'modern-corporate');
      setPrimaryColor(appSettings.primaryColor || 'indigo');
      setSidebarStyle(appSettings.sidebarStyle || 'light');
      setNavbarStyle(appSettings.navbarStyle || 'white');
      setCardRadius(appSettings.cardRadius || 'rounded');
      setDensity(appSettings.density || 'comfortable');
      setFontFamily(appSettings.fontFamily || 'jakarta');
      setBgPattern(appSettings.bgPattern || 'none');
      setEnableAnnouncement(appSettings.enableAnnouncement ?? true);
      setAnnouncementText(
        appSettings.announcementText ||
          'Periode Supervisi Akademik & Pembelajaran Mendalam Semester Aktif Sedang Berlangsung'
      );
      setAnnouncementType(appSettings.announcementType || 'info');
    }
  }, [appSettings]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // 1-Click apply template preset
  const handleApplyPreset = (preset: TemplatePresetDefinition) => {
    setSelectedTemplate(preset.key);
    setPrimaryColor(preset.primaryColor);
    setSidebarStyle(preset.sidebarStyle);
    setNavbarStyle(preset.navbarStyle);
    setCardRadius(preset.cardRadius);
    setDensity(preset.density);
    setFontFamily(preset.fontFamily);
    setBgPattern(preset.bgPattern);
  };

  // Save changes to backend and global store
  const handleSaveThemeSettings = async () => {
    setIsSaving(true);
    try {
      const updated = await updateAppSettings({
        templatePreset: selectedTemplate,
        primaryColor,
        sidebarStyle,
        navbarStyle,
        cardRadius,
        density,
        fontFamily,
        bgPattern,
        enableAnnouncement,
        announcementText: announcementText.trim(),
        announcementType
      });

      if (updated) {
        showToast(
          'success',
          'Tampilan & template web berhasil diperbarui! Perubahan langsung diterapkan ke semua akun (Guru, Kepala Sekolah, Pengawas, dan Dinas).'
        );
      } else {
        showToast('error', 'Gagal memperbarui pengaturan template.');
      }
    } catch (err) {
      showToast('error', 'Terjadi kesalahan saat menyimpan pengaturan.');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to default
  const handleResetToDefault = async () => {
    if (!window.confirm('Kembalikan tata letak dan tema ke setelan default awal sistem?')) {
      return;
    }
    const defaultPreset = TEMPLATE_PRESETS[0];
    handleApplyPreset(defaultPreset);
    setEnableAnnouncement(true);
    setAnnouncementText('Periode Supervisi Akademik & Pembelajaran Mendalam Semester Aktif Sedang Berlangsung');
    setAnnouncementType('info');

    setIsSaving(true);
    try {
      await updateAppSettings({
        templatePreset: 'modern-corporate',
        primaryColor: 'indigo',
        sidebarStyle: 'light',
        navbarStyle: 'white',
        cardRadius: 'rounded',
        density: 'comfortable',
        fontFamily: 'jakarta',
        bgPattern: 'none',
        enableAnnouncement: true,
        announcementText: 'Periode Supervisi Akademik & Pembelajaran Mendalam Semester Aktif Sedang Berlangsung',
        announcementType: 'info'
      });
      showToast('success', 'Tema dan template telah dikembalikan ke default nasional.');
    } catch (err) {
      showToast('error', 'Gagal mereset pengaturan.');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper color classes
  const getColorBadge = (color: ThemeColorKey) => {
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

  const getColorBorder = (color: ThemeColorKey) => {
    switch (color) {
      case 'indigo':
        return 'border-indigo-600 ring-indigo-200';
      case 'blue':
        return 'border-blue-600 ring-blue-200';
      case 'emerald':
        return 'border-emerald-600 ring-emerald-200';
      case 'purple':
        return 'border-purple-600 ring-purple-200';
      case 'amber':
        return 'border-amber-600 ring-amber-200';
      case 'rose':
        return 'border-rose-600 ring-rose-200';
      case 'teal':
        return 'border-teal-600 ring-teal-200';
      default:
        return 'border-indigo-600 ring-indigo-200';
    }
  };

  // Preview styling calculations
  const getPreviewSidebarClass = () => {
    switch (sidebarStyle) {
      case 'dark':
        return 'bg-slate-900 text-slate-300 border-slate-800';
      case 'colored':
        switch (primaryColor) {
          case 'indigo':
            return 'bg-indigo-900 text-indigo-100 border-indigo-800';
          case 'blue':
            return 'bg-blue-900 text-blue-100 border-blue-800';
          case 'emerald':
            return 'bg-emerald-950 text-emerald-100 border-emerald-900';
          case 'purple':
            return 'bg-purple-950 text-purple-100 border-purple-900';
          case 'amber':
            return 'bg-amber-950 text-amber-100 border-amber-900';
          case 'rose':
            return 'bg-rose-950 text-rose-100 border-rose-900';
          case 'teal':
            return 'bg-teal-950 text-teal-100 border-teal-900';
          default:
            return 'bg-indigo-900 text-indigo-100 border-indigo-800';
        }
      case 'glass':
        return 'bg-white/80 backdrop-blur-md text-slate-700 border-slate-200/80';
      case 'light':
      default:
        return 'bg-white text-slate-700 border-slate-200';
    }
  };

  const getPreviewNavbarClass = () => {
    switch (navbarStyle) {
      case 'dark':
        return 'bg-slate-900 text-white border-slate-800';
      case 'colored':
        switch (primaryColor) {
          case 'indigo':
            return 'bg-indigo-700 text-white border-indigo-800';
          case 'blue':
            return 'bg-blue-700 text-white border-blue-800';
          case 'emerald':
            return 'bg-emerald-700 text-white border-emerald-800';
          case 'purple':
            return 'bg-purple-700 text-white border-purple-800';
          case 'amber':
            return 'bg-amber-700 text-white border-amber-800';
          case 'rose':
            return 'bg-rose-700 text-white border-rose-800';
          case 'teal':
            return 'bg-teal-700 text-white border-teal-800';
          default:
            return 'bg-indigo-700 text-white border-indigo-800';
        }
      case 'glass':
        return 'bg-white/80 backdrop-blur-md text-slate-900 border-slate-200';
      case 'white':
      default:
        return 'bg-white text-slate-900 border-slate-200';
    }
  };

  const getPreviewRadiusClass = () => {
    switch (cardRadius) {
      case 'none':
        return 'rounded-none';
      case 'subtle':
        return 'rounded-md';
      case 'soft':
        return 'rounded-2xl';
      case 'rounded':
      default:
        return 'rounded-xl';
    }
  };

  const getPreviewDensityPadding = () => {
    switch (density) {
      case 'compact':
        return 'p-3 gap-3';
      case 'spacious':
        return 'p-6 gap-6';
      case 'comfortable':
      default:
        return 'p-4 gap-4';
    }
  };

  return (
    <div id="tampilan-template-view" className="space-y-6">
      {/* Toast Alert */}
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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">
                  Ubah Tampilan & Template Web Dinamis
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Sinkronisasi Otomatis Seluruh Akun
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
                Kelola template tata letak, warna aksen instansi, gaya sidebar, tipografi, dan banner pengumuman.
                Setiap perubahan yang disimpan oleh <strong>Admin Dinas</strong> akan langsung diterapkan secara
                realtime ke akun <strong>Kepala Sekolah</strong>, <strong>Pengawas</strong>, dan <strong>Guru</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start lg:self-center shrink-0">
            <button
              onClick={handleResetToDefault}
              type="button"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Default</span>
            </button>
            <button
              onClick={handleSaveThemeSettings}
              type="button"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Menerapkan...' : 'Terapkan ke Seluruh Akun'}</span>
            </button>
          </div>
        </div>

        {/* Current Theme Summary Pill */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Template Aktif:</span>
            <span className="font-semibold text-slate-800">
              {TEMPLATE_PRESETS.find((t) => t.key === selectedTemplate)?.name || 'Kustom'}
            </span>
          </div>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Warna Utama:</span>
            <span className="capitalize font-semibold text-slate-800 flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${getColorBadge(primaryColor)}`}></span>
              {primaryColor}
            </span>
          </div>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Sidebar:</span>
            <span className="capitalize font-semibold text-slate-800">{sidebarStyle}</span>
          </div>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Banner Pengumuman:</span>
            <span
              className={`font-semibold ${
                enableAnnouncement ? 'text-emerald-600' : 'text-slate-400'
              }`}
            >
              {enableAnnouncement ? 'Aktif Tayang' : 'Nonaktif'}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 1: PRESET TEMPLATE 1-KLIK */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>1. Pilihan Template Instansi (1-Klik Terapkan)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih template desain siap pakai yang dirancang sesuai standar kedinasan dan kebutuhan satuan pendidikan
            </p>
          </div>
          <span className="text-[11px] text-slate-400">Klik salah satu kartu untuk memilih</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-2">
          {TEMPLATE_PRESETS.map((preset) => {
            const isSelected = selectedTemplate === preset.key;
            return (
              <div
                key={preset.key}
                onClick={() => handleApplyPreset(preset)}
                className={`group relative rounded-xl border p-4 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                <div>
                  {/* Card Visual Header Bar */}
                  <div
                    className={`h-16 rounded-lg bg-gradient-to-r ${preset.previewGradient} p-2.5 text-white flex flex-col justify-between relative overflow-hidden mb-3`}
                  >
                    <div className="flex items-center justify-between z-10">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/20 backdrop-blur-xs">
                        {preset.category}
                      </span>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-white text-indigo-700 flex items-center justify-center shadow-xs">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 z-10">
                      <div className="w-3 h-3 rounded-full bg-white/40"></div>
                      <div className="h-1.5 w-14 rounded bg-white/40"></div>
                      <div className="h-1.5 w-8 rounded bg-white/20"></div>
                    </div>
                    {/* Decorative element */}
                    <div className="absolute -right-2 -bottom-2 w-16 h-16 rounded-full bg-white/10 blur-xs pointer-events-none"></div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {preset.name}
                    </h3>
                    <span className="text-[9px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      {preset.badgeText}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                    {preset.description}
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${getColorBadge(preset.primaryColor)}`}></span>
                    <span className="capitalize">{preset.primaryColor}</span>
                  </span>
                  <span>Sidebar {preset.sidebarStyle}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: KUSTOMISASI DETAIL (FINE-TUNING) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Color & Layout Controls */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <span>2. Kustomisasi Komponen Tampilan</span>
          </h2>

          {/* 1. Tema Warna Utama */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Tema Warna Utama (Primary Accent)</span>
              <span className="text-[11px] font-normal text-slate-400 capitalize">
                Warna terpilih: {primaryColor}
              </span>
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {[
                { key: 'indigo', name: 'Indigo', bg: 'bg-indigo-600', ring: 'ring-indigo-300' },
                { key: 'blue', name: 'Blue', bg: 'bg-blue-600', ring: 'ring-blue-300' },
                { key: 'emerald', name: 'Emerald', bg: 'bg-emerald-600', ring: 'ring-emerald-300' },
                { key: 'teal', name: 'Teal', bg: 'bg-teal-600', ring: 'ring-teal-300' },
                { key: 'purple', name: 'Purple', bg: 'bg-purple-600', ring: 'ring-purple-300' },
                { key: 'amber', name: 'Amber', bg: 'bg-amber-600', ring: 'ring-amber-300' },
                { key: 'rose', name: 'Rose', bg: 'bg-rose-600', ring: 'ring-rose-300' }
              ].map((c) => {
                const isSelected = primaryColor === c.key;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => {
                      setPrimaryColor(c.key as ThemeColorKey);
                      setSelectedTemplate('modern-corporate'); // switch to custom
                    }}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full ${c.bg} shadow-xs flex items-center justify-center text-white`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </span>
                    <span className="text-[10px] font-medium text-slate-700">{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Gaya Sidebar */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-700">Gaya Bilah Sisi (Sidebar Navigation)</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                {
                  key: 'light',
                  name: 'Light Clean',
                  desc: 'Putih bersih standar',
                  badge: 'bg-white border-slate-300 text-slate-700'
                },
                {
                  key: 'dark',
                  name: 'Dark Slate',
                  desc: 'Gelap kontras tinggi',
                  badge: 'bg-slate-900 border-slate-800 text-white'
                },
                {
                  key: 'colored',
                  name: 'Aksen Warna',
                  desc: 'Selaras warna tema',
                  badge: 'bg-indigo-900 border-indigo-800 text-white'
                },
                {
                  key: 'glass',
                  name: 'Glassmorphism',
                  desc: 'Efek transparan',
                  badge: 'bg-slate-100 border-slate-300 text-slate-800'
                }
              ].map((style) => {
                const isSelected = sidebarStyle === style.key;
                return (
                  <button
                    key={style.key}
                    type="button"
                    onClick={() => setSidebarStyle(style.key as SidebarStyleKey)}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900">{style.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 stroke-[3]" />}
                    </div>
                    <p className="text-[10px] text-slate-500">{style.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Gaya Header / Navbar */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-700">Gaya Bilah Atas (Navbar Header)</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: 'white', name: 'Solid Putih', desc: 'Minimalis & bersih' },
                { key: 'glass', name: 'Translucent Glass', desc: 'Efek blur modern' },
                { key: 'colored', name: 'Header Berwarna', desc: 'Aksen penuh tema' },
                { key: 'dark', name: 'Header Gelap', desc: 'Elegan kontras' }
              ].map((nav) => {
                const isSelected = navbarStyle === nav.key;
                return (
                  <button
                    key={nav.key}
                    type="button"
                    onClick={() => setNavbarStyle(nav.key as NavbarStyleKey)}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900">{nav.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 stroke-[3]" />}
                    </div>
                    <p className="text-[10px] text-slate-500">{nav.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Sudut Kartu & Kepadatan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Sudut Lengkungan (Border Radius)</label>
              <select
                value={cardRadius}
                onChange={(e) => setCardRadius(e.target.value as CardRadiusKey)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              >
                <option value="none">Tajam / Sharp (0px)</option>
                <option value="subtle">Halus / Subtle (6px)</option>
                <option value="rounded">Standar Modern (12px)</option>
                <option value="soft">Lembut / Soft Pill (18px)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Kepadatan Tampilan (Density)</label>
              <select
                value={density}
                onChange={(e) => setDensity(e.target.value as DensityModeKey)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              >
                <option value="compact">Rapat / Compact (Hemat Ruang)</option>
                <option value="comfortable">Standar / Comfortable (Seimbang)</option>
                <option value="spacious">Lega / Spacious (Lebih Lapang)</option>
              </select>
            </div>
          </div>

          {/* 5. Tipografi & Pola Background */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Tipografi Font Utama</label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value as FontFamilyKey)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              >
                <option value="jakarta">Plus Jakarta Sans (Modern & Bersih)</option>
                <option value="inter">Inter (Standar Sistem Digital)</option>
                <option value="poppins">Poppins (Dinamis & Ramah)</option>
                <option value="slate">Slate Sans (Formal & Tegas)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Pola Latar Belakang</label>
              <select
                value={bgPattern}
                onChange={(e) => setBgPattern(e.target.value as BgPatternKey)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              >
                <option value="none">Polos Bersih (Clean Slate)</option>
                <option value="dots">Dot Matrix Halus</option>
                <option value="grid">Grid Kotak Digital</option>
                <option value="mesh">Gradasi Halus (Mesh)</option>
                <option value="waves">Gelombang Halus</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Column: Global Announcement Banner & Settings */}
        <div className="space-y-6">
          {/* Banner Pengumuman Global */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Banner Pengumuman Global (Seluruh Akun)
                </h2>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableAnnouncement}
                  onChange={(e) => setEnableAnnouncement(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Teks pengumuman resmi dari Dinas Pendidikan yang akan muncul di bilah atas semua akun (Guru, Kepala Sekolah, Pengawas).
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Teks Pengumuman Dinas
                </label>
                <textarea
                  rows={2}
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder="Ketik teks pengumuman penting dinas..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Tipe Notifikasi Banner
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { key: 'info', label: 'Info (Biru)', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
                    { key: 'warning', label: 'Perhatian (Kuning)', bg: 'bg-amber-50 text-amber-800 border-amber-200' },
                    { key: 'success', label: 'Sukses (Hijau)', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
                    { key: 'urgent', label: 'Penting (Merah)', bg: 'bg-rose-50 text-rose-800 border-rose-200' }
                  ].map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setAnnouncementType(t.key as any)}
                      className={`p-2 text-[10px] font-bold rounded-lg border text-center transition-all cursor-pointer ${
                        announcementType === t.key
                          ? `${t.bg} ring-2 ring-indigo-500/20`
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Banner Preview Box */}
            {enableAnnouncement && (
              <div className="pt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Pratinjau Banner yang Dilihat Pengguna:
                </span>
                <div
                  className={`px-3.5 py-2 rounded-lg border text-xs flex items-center gap-2.5 shadow-xs ${
                    announcementType === 'warning'
                      ? 'bg-amber-500 text-white border-amber-600'
                      : announcementType === 'success'
                      ? 'bg-emerald-600 text-white border-emerald-700'
                      : announcementType === 'urgent'
                      ? 'bg-rose-600 text-white border-rose-700'
                      : 'bg-indigo-600 text-white border-indigo-700'
                  }`}
                >
                  <Megaphone className="w-4 h-4 shrink-0" />
                  <span className="font-medium flex-1 text-[11px]">{announcementText || 'Teks pengumuman kosong'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Info Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
              <Info className="w-4 h-4" />
              <span>Prinsip Penyesuaian Otomatis Multi-Akun</span>
            </div>
            <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
              <li>
                <strong>Penerapan Realtime:</strong> Pengaturan disimpan terpusat di server dinas dan langsung diterapkan saat pengguna membuka halaman mana pun.
              </li>
              <li>
                <strong>Konsistensi Identitas:</strong> Logo sekolah, warna dinas, dan pengumuman tampil seragam sehingga memperkuat brand tata kelola pendidikan daerah.
              </li>
              <li>
                <strong>Responsif & Adaptif:</strong> Tata letak otomatis menyesuaikan resolusi layar laptop pengawas, komputer sekolah, hingga ponsel guru.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* SECTION 3: INTERACTIVE LIVE SIMULATOR (MULTI-ROLE PREVIEW) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-600" />
              <span>3. Simulator Tampilan Multi-Peran (Live Preview)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulasikan bagaimana template dan tema ini akan terlihat di layar akun Guru, Kepala Sekolah, dan Pengawas
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Role Switcher in Preview */}
            <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPreviewRole('GURU')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  previewRole === 'GURU'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Akun Guru
              </button>
              <button
                type="button"
                onClick={() => setPreviewRole('KEPALA_SEKOLAH')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  previewRole === 'KEPALA_SEKOLAH'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kepala Sekolah
              </button>
              <button
                type="button"
                onClick={() => setPreviewRole('PENGAWAS')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  previewRole === 'PENGAWAS'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pengawas
              </button>
              <button
                type="button"
                onClick={() => setPreviewRole('ADMIN_DINAS')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  previewRole === 'ADMIN_DINAS'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Admin Dinas
              </button>
            </div>
          </div>
        </div>

        {/* Live Simulated Mockup Frame */}
        <div className="border border-slate-300 rounded-xl overflow-hidden shadow-inner bg-slate-100">
          {/* Top Browser Bar */}
          <div className="bg-slate-200 px-4 py-2 flex items-center justify-between border-b border-slate-300 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="ml-2 font-mono text-[11px] text-slate-600 bg-white/70 px-3 py-0.5 rounded-md">
                https://sipsagu-pm.dinas.go.id/{previewRole.toLowerCase()}
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Pratinjau Realtime: {previewRole}
            </span>
          </div>

          {/* Announcement Banner inside Mockup */}
          {enableAnnouncement && (
            <div
              className={`px-4 py-1.5 text-xs text-white flex items-center justify-between ${
                announcementType === 'warning'
                  ? 'bg-amber-500'
                  : announcementType === 'success'
                  ? 'bg-emerald-600'
                  : announcementType === 'urgent'
                  ? 'bg-rose-600'
                  : 'bg-indigo-600'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Megaphone className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[11px] font-medium truncate">{announcementText}</span>
              </div>
              <span className="text-[10px] opacity-80 shrink-0 font-bold">INFO DINAS</span>
            </div>
          )}

          {/* Simulated App Container */}
          <div className="flex h-80 bg-slate-50">
            {/* Simulated Sidebar */}
            <div className={`w-52 border-r p-3 flex flex-col justify-between shrink-0 ${getPreviewSidebarClass()}`}>
              <div className="space-y-3">
                {/* Logo & App Name in Sidebar */}
                <div className="flex items-center gap-2 pb-2.5 border-b border-current/10">
                  <div
                    className={`w-7 h-7 rounded-lg ${getColorBadge(primaryColor)} text-white flex items-center justify-center font-bold text-xs shadow-xs overflow-hidden`}
                  >
                    <img src="/tut-wuri-handayani.svg" alt="Logo" className="w-full h-full object-contain p-0.5" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold leading-tight truncate">
                      {appSettings?.appName || 'SIBER-PM'}
                    </div>
                    <div className="text-[9px] opacity-70 truncate">{appSettings?.agencyName || 'Dinas Pendidikan'}</div>
                  </div>
                </div>

                {/* Nav Items */}
                <div className="space-y-1 text-[11px]">
                  <div
                    className={`px-2.5 py-1.5 rounded font-bold flex items-center gap-2 ${
                      sidebarStyle === 'dark' || sidebarStyle === 'colored'
                        ? 'bg-white/10 text-white'
                        : `${getColorBadge(primaryColor)} text-white`
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Dashboard Utama</span>
                  </div>
                  {previewRole === 'GURU' && (
                    <>
                      <div className="px-2.5 py-1.5 rounded opacity-75 hover:opacity-100 flex items-center gap-2">
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>Modul Ajar Saya</span>
                      </div>
                      <div className="px-2.5 py-1.5 rounded opacity-75 hover:opacity-100 flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Pembelajaran Mendalam</span>
                      </div>
                    </>
                  )}
                  {previewRole === 'KEPALA_SEKOLAH' && (
                    <>
                      <div className="px-2.5 py-1.5 rounded opacity-75 hover:opacity-100 flex items-center gap-2">
                        <SchoolIcon className="w-3.5 h-3.5" />
                        <span>Supervisi Guru Sekolah</span>
                      </div>
                      <div className="px-2.5 py-1.5 rounded opacity-75 hover:opacity-100 flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verifikasi Administrasi</span>
                      </div>
                    </>
                  )}
                  {previewRole === 'PENGAWAS' && (
                    <>
                      <div className="px-2.5 py-1.5 rounded opacity-75 hover:opacity-100 flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Sekolah Binaan</span>
                      </div>
                      <div className="px-2.5 py-1.5 rounded opacity-75 hover:opacity-100 flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5" />
                        <span>Persetujuan Jadwal</span>
                      </div>
                    </>
                  )}
                  {previewRole === 'ADMIN_DINAS' && (
                    <>
                      <div className="px-2.5 py-1.5 rounded opacity-75 hover:opacity-100 flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Master Satuan Pendidikan</span>
                      </div>
                      <div className="px-2.5 py-1.5 rounded opacity-75 hover:opacity-100 flex items-center gap-2">
                        <Palette className="w-3.5 h-3.5" />
                        <span>Ubah Tampilan Web</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* User Mini Profile in Sidebar */}
              <div className="pt-2 border-t border-current/10 flex items-center gap-2 text-[10px]">
                <div className="w-6 h-6 rounded-full bg-slate-400 text-white flex items-center justify-center font-bold">
                  {previewRole.charAt(0)}
                </div>
                <div className="truncate">
                  <div className="font-bold truncate">
                    {previewRole === 'GURU'
                      ? 'Sumarni, S.Pd.SD.'
                      : previewRole === 'KEPALA_SEKOLAH'
                      ? 'Hj. Sri Wahyuni, M.Pd.'
                      : previewRole === 'PENGAWAS'
                      ? 'Drs. H. Bambang, M.Pd.'
                      : 'Admin Dinas'}
                  </div>
                  <div className="opacity-70 text-[9px]">{previewRole}</div>
                </div>
              </div>
            </div>

            {/* Simulated Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Simulated Top Navbar */}
              <div className={`h-11 border-b px-4 flex items-center justify-between text-xs shrink-0 ${getPreviewNavbarClass()}`}>
                <div className="font-semibold text-xs truncate">
                  Selamat Datang di Portal {appSettings?.appName || 'SIBER-PM'}
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-current/10">
                    T.A. 2026/2027 Ganjil
                  </span>
                  <div className="w-6 h-6 rounded-full bg-current/20 flex items-center justify-center font-bold text-[10px]">
                    ●
                  </div>
                </div>
              </div>

              {/* Simulated Dashboard Cards */}
              <div className={`flex-1 overflow-y-auto p-4 space-y-3`}>
                {/* Hero Box inside Preview */}
                <div
                  className={`p-3 text-white ${getPreviewRadiusClass()} ${getColorBadge(
                    primaryColor
                  )} flex items-center justify-between shadow-xs`}
                >
                  <div>
                    <h4 className="text-xs font-bold">
                      {previewRole === 'GURU'
                        ? 'Portal Supervisi & Modul Ajar Guru'
                        : previewRole === 'KEPALA_SEKOLAH'
                        ? 'Manajemen Supervisi & Mutu Pembelajaran'
                        : previewRole === 'PENGAWAS'
                        ? 'Monitoring Pengawasan Wilayah Binaan'
                        : 'Pusat Kendali Pengawasan Dinas Pendidikan'}
                    </h4>
                    <p className="text-[10px] opacity-90 mt-0.5">
                      Semua komponen tata letak otomatis terkonfigurasi dengan tema {primaryColor}.
                    </p>
                  </div>
                  <div className="px-2.5 py-1 rounded bg-white/20 text-[10px] font-bold backdrop-blur-xs">
                    Live Active
                  </div>
                </div>

                {/* 3 Metric Cards inside Preview */}
                <div className="grid grid-cols-3 gap-3">
                  <div className={`bg-white border border-slate-200 p-2.5 ${getPreviewRadiusClass()} shadow-2xs`}>
                    <div className="text-[10px] text-slate-400 font-medium">Status Modul</div>
                    <div className="text-sm font-bold text-slate-800 mt-0.5">100% Selesai</div>
                    <div className="text-[9px] text-emerald-600 font-semibold mt-0.5">Terverifikasi</div>
                  </div>
                  <div className={`bg-white border border-slate-200 p-2.5 ${getPreviewRadiusClass()} shadow-2xs`}>
                    <div className="text-[10px] text-slate-400 font-medium">Asesmen PM</div>
                    <div className="text-sm font-bold text-slate-800 mt-0.5">Mahir (92/100)</div>
                    <div className="text-[9px] text-indigo-600 font-semibold mt-0.5">10 Aspek Lengkap</div>
                  </div>
                  <div className={`bg-white border border-slate-200 p-2.5 ${getPreviewRadiusClass()} shadow-2xs`}>
                    <div className="text-[10px] text-slate-400 font-medium">Jadwal Supervisi</div>
                    <div className="text-sm font-bold text-slate-800 mt-0.5">25 Agt 2026</div>
                    <div className="text-[9px] text-blue-600 font-semibold mt-0.5">Telah Disetujui</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Save Action CTA */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            Perubahan tampilan yang diterapkan akan disimpan di basis data pusat dan disinkronkan ke seluruh sesi pengguna.
          </p>
          <button
            onClick={handleSaveThemeSettings}
            type="button"
            disabled={isSaving}
            className="flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Menerapkan Perubahan...' : 'Terapkan Template ke Seluruh Akun'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
