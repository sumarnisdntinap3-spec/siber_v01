import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Users,
  Calendar,
  ArrowLeftRight,
  BookOpen,
  CheckSquare,
  BrainCircuit,
  Sparkles,
  CalendarCheck,
  FileBarChart,
  History,
  FileSpreadsheet,
  Award,
  CalendarDays,
  CheckCircle2,
  Settings,
  Shield,
  Palette,
  TrendingUp,
  Printer,
  MessageSquareQuote,
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ThemeColorKey } from '../../types';

export type NavigationTab =
  | 'dashboard'
  | 'kinerja-guru'
  | 'master-sekolah'
  | 'master-guru'
  | 'master-kepala-sekolah'
  | 'master-pengawas'
  | 'master-tahun'
  | 'mutasi-guru'
  | 'modul-ajar'
  | 'administrasi'
  | 'pola-pikir'
  | 'pembelajaran-mendalam'
  | 'supervisi'
  | 'komentar-supervisi'
  | 'catatan-supervisi'
  | 'catatan-reflektif-guru'
  | 'kalender'
  | 'laporan'
  | 'cetak-laporan'
  | 'audit-log'
  | 'tampilan-template'
  | 'pengaturan-aplikasi'
  | 'profil-guru';

interface SidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile
}) => {
  const { currentRole, currentUser, appSettings } = useAuth();

  const handleNavClick = (tab: NavigationTab) => {
    onSelectTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  const isDarkSidebar = appSettings?.sidebarStyle === 'dark';
  const isColoredSidebar = appSettings?.sidebarStyle === 'colored';
  const isGlassSidebar = appSettings?.sidebarStyle === 'glass';
  const primaryColor = appSettings?.primaryColor || 'indigo';

  // Dynamic active colors
  const getActiveItemClasses = () => {
    if (isDarkSidebar) {
      return 'bg-white/15 text-white font-bold shadow-xs';
    }
    if (isColoredSidebar) {
      return 'bg-white/20 text-white font-bold shadow-xs';
    }
    switch (primaryColor) {
      case 'indigo':
        return 'bg-indigo-50 text-indigo-700 font-semibold';
      case 'blue':
        return 'bg-blue-50 text-blue-700 font-semibold';
      case 'emerald':
        return 'bg-emerald-50 text-emerald-700 font-semibold';
      case 'purple':
        return 'bg-purple-50 text-purple-700 font-semibold';
      case 'amber':
        return 'bg-amber-50 text-amber-800 font-semibold';
      case 'rose':
        return 'bg-rose-50 text-rose-700 font-semibold';
      case 'teal':
        return 'bg-teal-50 text-teal-700 font-semibold';
      default:
        return 'bg-indigo-50 text-indigo-700 font-semibold';
    }
  };

  const getActiveIconClasses = () => {
    if (isDarkSidebar || isColoredSidebar) {
      return 'text-white';
    }
    switch (primaryColor) {
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

  const navItemClass = (tab: NavigationTab) => {
    const isActive = activeTab === tab;
    if (isActive) {
      return `flex items-center gap-3 w-full px-3 py-2 text-xs rounded-md transition-colors ${getActiveItemClasses()}`;
    }
    if (isDarkSidebar) {
      return 'flex items-center gap-3 w-full px-3 py-2 text-xs rounded-md transition-colors text-slate-400 hover:text-white hover:bg-slate-800 font-medium';
    }
    if (isColoredSidebar) {
      return 'flex items-center gap-3 w-full px-3 py-2 text-xs rounded-md transition-colors text-white/70 hover:text-white hover:bg-white/10 font-medium';
    }
    return 'flex items-center gap-3 w-full px-3 py-2 text-xs rounded-md transition-colors text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-medium';
  };

  const iconClass = (tab: NavigationTab) => {
    const isActive = activeTab === tab;
    if (isActive) {
      return `w-4 h-4 shrink-0 ${getActiveIconClasses()}`;
    }
    if (isDarkSidebar) {
      return 'w-4 h-4 shrink-0 text-slate-500';
    }
    if (isColoredSidebar) {
      return 'w-4 h-4 shrink-0 text-white/60';
    }
    return 'w-4 h-4 shrink-0 text-slate-400';
  };

  const sectionHeaderClass =
    isDarkSidebar || isColoredSidebar
      ? 'px-3 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-white/50'
      : 'px-3 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400';

  const getSidebarContainerClass = () => {
    if (isDarkSidebar) {
      return 'bg-slate-900 border-r border-slate-800 text-slate-300';
    }
    if (isColoredSidebar) {
      switch (primaryColor) {
        case 'indigo':
          return 'bg-indigo-900 border-r border-indigo-800 text-indigo-100';
        case 'blue':
          return 'bg-blue-900 border-r border-blue-800 text-blue-100';
        case 'emerald':
          return 'bg-emerald-950 border-r border-emerald-900 text-emerald-100';
        case 'purple':
          return 'bg-purple-950 border-r border-purple-900 text-purple-100';
        case 'amber':
          return 'bg-amber-950 border-r border-amber-900 text-amber-100';
        case 'rose':
          return 'bg-rose-950 border-r border-rose-900 text-rose-100';
        case 'teal':
          return 'bg-teal-950 border-r border-teal-900 text-teal-100';
        default:
          return 'bg-indigo-900 border-r border-indigo-800 text-indigo-100';
      }
    }
    if (isGlassSidebar) {
      return 'bg-white/80 backdrop-blur-md border-r border-slate-200/80 text-slate-700';
    }
    return 'bg-white border-r border-slate-200 text-slate-700';
  };

  // Role-specific navigation groups
  const renderNavLinks = () => {
    switch (currentRole) {
      case 'ADMIN_DINAS':
        return (
          <>
            <div className="px-3 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Utama
            </div>
            <button
              onClick={() => handleNavClick('dashboard')}
              className={navItemClass('dashboard')}
            >
              <LayoutDashboard className={iconClass('dashboard')} />
              <span>Dashboard Dinas</span>
            </button>

            <div className="mt-4 px-3 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Master Data & Wilayah
            </div>
            <button
              onClick={() => handleNavClick('master-sekolah')}
              className={navItemClass('master-sekolah')}
            >
              <Building2 className={iconClass('master-sekolah')} />
              <span>Data Satuan Pendidikan</span>
            </button>
            <button
              onClick={() => handleNavClick('master-guru')}
              className={navItemClass('master-guru')}
            >
              <Users className={iconClass('master-guru')} />
              <span>Data Guru & Akun</span>
            </button>
            <button
              id="sidebar-nav-kelola-pengawas"
              onClick={() => handleNavClick('master-pengawas')}
              className={navItemClass('master-pengawas')}
            >
              <Award className={iconClass('master-pengawas')} />
              <div className="flex items-center justify-between flex-1 min-w-0 pr-1">
                <span className="truncate">Kelola Pengawas Sekolah</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 shrink-0 ml-1">
                  TK-SD-SMP
                </span>
              </div>
            </button>
            <button
              onClick={() => handleNavClick('master-tahun')}
              className={navItemClass('master-tahun')}
            >
              <Calendar className={iconClass('master-tahun')} />
              <span>Tahun Pelaksanaan</span>
            </button>

            <div className="mt-4 px-3 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Mutasi & Akademik
            </div>
            <button
              onClick={() => handleNavClick('mutasi-guru')}
              className={navItemClass('mutasi-guru')}
            >
              <ArrowLeftRight className={iconClass('mutasi-guru')} />
              <span>Mutasi Guru Antar Sekolah</span>
            </button>
            <button
              onClick={() => handleNavClick('modul-ajar')}
              className={navItemClass('modul-ajar')}
            >
              <BookOpen className={iconClass('modul-ajar')} />
              <span>Rekap Modul Ajar</span>
            </button>
            <button
              onClick={() => handleNavClick('administrasi')}
              className={navItemClass('administrasi')}
            >
              <CheckSquare className={iconClass('administrasi')} />
              <span>Administrasi Pembelajaran</span>
            </button>
            <button
              onClick={() => handleNavClick('pola-pikir')}
              className={navItemClass('pola-pikir')}
            >
              <BrainCircuit className={iconClass('pola-pikir')} />
              <span>Pemetaan Pola Pikir Guru</span>
            </button>
            <button
              onClick={() => handleNavClick('pembelajaran-mendalam')}
              className={navItemClass('pembelajaran-mendalam')}
            >
              <Sparkles className={iconClass('pembelajaran-mendalam')} />
              <span>Pembelajaran Mendalam (PM)</span>
            </button>

            <div className="mt-4 px-3 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Supervisi & Laporan
            </div>
            <button
              id="sidebar-nav-kinerja-guru"
              onClick={() => handleNavClick('kinerja-guru')}
              className={navItemClass('kinerja-guru')}
            >
              <TrendingUp className={iconClass('kinerja-guru')} />
              <span>Dashboard Tren Kinerja Guru</span>
            </button>
            <button
              onClick={() => handleNavClick('supervisi')}
              className={navItemClass('supervisi')}
            >
              <CalendarCheck className={iconClass('supervisi')} />
              <span>Monitoring Supervisi</span>
            </button>
            <button
              id="sidebar-nav-dinas-komentar"
              onClick={() => handleNavClick('komentar-supervisi')}
              className={navItemClass('komentar-supervisi')}
            >
              <MessageSquareQuote className={iconClass('komentar-supervisi')} />
              <span>Catatan Masukan Supervisi</span>
            </button>
            <button
              id="sidebar-nav-dinas-reflektif"
              onClick={() => handleNavClick('catatan-reflektif-guru')}
              className={navItemClass('catatan-reflektif-guru')}
            >
              <FileText className={iconClass('catatan-reflektif-guru')} />
              <span>Catatan Reflektif Guru</span>
            </button>
            <button
              onClick={() => handleNavClick('kalender')}
              className={navItemClass('kalender')}
            >
              <CalendarDays className={iconClass('kalender')} />
              <span>Kalender Supervisi Dinas</span>
            </button>
            <button
              id="sidebar-nav-cetak-laporan"
              onClick={() => handleNavClick('cetak-laporan')}
              className={navItemClass('cetak-laporan')}
            >
              <Printer className={iconClass('cetak-laporan')} />
              <span>Cetak Laporan & Rekomendasi</span>
            </button>
            <button
              onClick={() => handleNavClick('laporan')}
              className={navItemClass('laporan')}
            >
              <FileBarChart className={iconClass('laporan')} />
              <span>Rekap & Ekspor Laporan</span>
            </button>

            <div className={`mt-4 ${sectionHeaderClass}`}>
              Pengaturan & Identitas
            </div>
            <button
              id="sidebar-nav-tampilan-template"
              onClick={() => handleNavClick('tampilan-template')}
              className={navItemClass('tampilan-template')}
            >
              <Palette className={iconClass('tampilan-template')} />
              <span>Ubah Tampilan & Template</span>
            </button>
            <button
              id="sidebar-nav-pengaturan-aplikasi"
              onClick={() => handleNavClick('pengaturan-aplikasi')}
              className={navItemClass('pengaturan-aplikasi')}
            >
              <Settings className={iconClass('pengaturan-aplikasi')} />
              <span>Profil & Nama/Logo Aplikasi</span>
            </button>
            <button
              onClick={() => handleNavClick('audit-log')}
              className={navItemClass('audit-log')}
            >
              <History className={iconClass('audit-log')} />
              <span>Audit Log Aktivitas</span>
            </button>
          </>
        );

      case 'PENGAWAS':
        return (
          <>
            <div className="px-3 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Utama
            </div>
            <button
              onClick={() => handleNavClick('dashboard')}
              className={navItemClass('dashboard')}
            >
              <LayoutDashboard className={iconClass('dashboard')} />
              <span>Dashboard Pengawas</span>
            </button>
            <button
              id="sidebar-nav-pengawas-kinerja"
              onClick={() => handleNavClick('kinerja-guru')}
              className={navItemClass('kinerja-guru')}
            >
              <TrendingUp className={iconClass('kinerja-guru')} />
              <span>Tren Kinerja Guru Binaan</span>
            </button>

            <div className="mt-4 px-3 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Wilayah Binaan
            </div>
            <button
              onClick={() => handleNavClick('master-sekolah')}
              className={navItemClass('master-sekolah')}
            >
              <Building2 className={iconClass('master-sekolah')} />
              <span>Sekolah Binaan</span>
            </button>
            <button
              onClick={() => handleNavClick('master-guru')}
              className={navItemClass('master-guru')}
            >
              <Users className={iconClass('master-guru')} />
              <span>Daftar Guru Binaan</span>
            </button>

            <div className="mt-4 px-3 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Supervisi & Persetujuan
            </div>
            <button
              onClick={() => handleNavClick('supervisi')}
              className={navItemClass('supervisi')}
            >
              <CheckCircle2 className={iconClass('supervisi')} />
              <span>Persetujuan Jadwal Supervisi</span>
            </button>
            <button
              id="sidebar-nav-pengawas-komentar"
              onClick={() => handleNavClick('komentar-supervisi')}
              className={navItemClass('komentar-supervisi')}
            >
              <MessageSquareQuote className={iconClass('komentar-supervisi')} />
              <span>Entri Komentar Supervisi</span>
            </button>
            <button
              id="sidebar-nav-pengawas-reflektif"
              onClick={() => handleNavClick('catatan-reflektif-guru')}
              className={navItemClass('catatan-reflektif-guru')}
            >
              <FileText className={iconClass('catatan-reflektif-guru')} />
              <span>Catatan Reflektif Guru</span>
            </button>
            <button
              onClick={() => handleNavClick('kalender')}
              className={navItemClass('kalender')}
            >
              <CalendarDays className={iconClass('kalender')} />
              <span>Kalender Supervisi</span>
            </button>

            <div className="mt-4 px-3 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Evaluasi Akademik
            </div>
            <button
              onClick={() => handleNavClick('modul-ajar')}
              className={navItemClass('modul-ajar')}
            >
              <BookOpen className={iconClass('modul-ajar')} />
              <span>Modul Ajar Guru</span>
            </button>
            <button
              onClick={() => handleNavClick('administrasi')}
              className={navItemClass('administrasi')}
            >
              <CheckSquare className={iconClass('administrasi')} />
              <span>Administrasi Pembelajaran</span>
            </button>
            <button
              onClick={() => handleNavClick('pola-pikir')}
              className={navItemClass('pola-pikir')}
            >
              <BrainCircuit className={iconClass('pola-pikir')} />
              <span>Pola Pikir Guru</span>
            </button>
            <button
              onClick={() => handleNavClick('pembelajaran-mendalam')}
              className={navItemClass('pembelajaran-mendalam')}
            >
              <Sparkles className={iconClass('pembelajaran-mendalam')} />
              <span>Pembelajaran Mendalam</span>
            </button>
            <button
              id="sidebar-nav-pengawas-cetak-laporan"
              onClick={() => handleNavClick('cetak-laporan')}
              className={navItemClass('cetak-laporan')}
            >
              <Printer className={iconClass('cetak-laporan')} />
              <span>Cetak Laporan & Rekomendasi</span>
            </button>
            <button
              onClick={() => handleNavClick('laporan')}
              className={navItemClass('laporan')}
            >
              <FileBarChart className={iconClass('laporan')} />
              <span>Laporan Supervisi Binaan</span>
            </button>
          </>
        );

      case 'KEPALA_SEKOLAH':
        return (
          <>
            <div className="px-3 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Utama
            </div>
            <button
              onClick={() => handleNavClick('dashboard')}
              className={navItemClass('dashboard')}
            >
              <LayoutDashboard className={iconClass('dashboard')} />
              <span>Dashboard Kepala Sekolah</span>
            </button>
            <button
              id="sidebar-nav-ks-kinerja"
              onClick={() => handleNavClick('kinerja-guru')}
              className={navItemClass('kinerja-guru')}
            >
              <TrendingUp className={iconClass('kinerja-guru')} />
              <span>Tren Kinerja Guru Sekolah</span>
            </button>

            <div className="mt-4 px-3 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Guru & Akademik
            </div>
            <button
              onClick={() => handleNavClick('master-guru')}
              className={navItemClass('master-guru')}
            >
              <Users className={iconClass('master-guru')} />
              <span>Daftar Guru Sekolah</span>
            </button>
            <button
              onClick={() => handleNavClick('modul-ajar')}
              className={navItemClass('modul-ajar')}
            >
              <BookOpen className={iconClass('modul-ajar')} />
              <span>Verifikasi Modul Ajar</span>
            </button>
            <button
              onClick={() => handleNavClick('administrasi')}
              className={navItemClass('administrasi')}
            >
              <CheckSquare className={iconClass('administrasi')} />
              <span>Pemeriksaan Administrasi</span>
            </button>

            <div className="mt-4 px-3 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Penilaian & Supervisi
            </div>
            <button
              onClick={() => handleNavClick('pola-pikir')}
              className={navItemClass('pola-pikir')}
            >
              <BrainCircuit className={iconClass('pola-pikir')} />
              <span>Pemetaan Pola Pikir</span>
            </button>
            <button
              onClick={() => handleNavClick('pembelajaran-mendalam')}
              className={navItemClass('pembelajaran-mendalam')}
            >
              <Sparkles className={iconClass('pembelajaran-mendalam')} />
              <span>Pembelajaran Mendalam (PM)</span>
            </button>
            <button
              onClick={() => handleNavClick('supervisi')}
              className={navItemClass('supervisi')}
            >
              <CalendarCheck className={iconClass('supervisi')} />
              <span>Pengajuan Jadwal Supervisi</span>
            </button>
            <button
              onClick={() => handleNavClick('kalender')}
              className={navItemClass('kalender')}
            >
              <CalendarDays className={iconClass('kalender')} />
              <span>Kalender Supervisi</span>
            </button>
            <button
              id="sidebar-nav-ks-komentar"
              onClick={() => handleNavClick('komentar-supervisi')}
              className={navItemClass('komentar-supervisi')}
            >
              <MessageSquareQuote className={iconClass('komentar-supervisi')} />
              <span>Catatan Masukan Pengawas</span>
            </button>
            <button
              id="sidebar-nav-ks-reflektif"
              onClick={() => handleNavClick('catatan-reflektif-guru')}
              className={navItemClass('catatan-reflektif-guru')}
            >
              <FileText className={iconClass('catatan-reflektif-guru')} />
              <span>Catatan Reflektif Guru</span>
            </button>
            <button
              id="sidebar-nav-ks-cetak-laporan"
              onClick={() => handleNavClick('cetak-laporan')}
              className={navItemClass('cetak-laporan')}
            >
              <Printer className={iconClass('cetak-laporan')} />
              <span>Cetak Laporan & Rekomendasi</span>
            </button>
            <button
              onClick={() => handleNavClick('laporan')}
              className={navItemClass('laporan')}
            >
              <FileBarChart className={iconClass('laporan')} />
              <span>Laporan Supervisi Sekolah</span>
            </button>
          </>
        );

      case 'GURU':
        return (
          <>
            <div className="px-3 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Utama
            </div>
            <button
              onClick={() => handleNavClick('dashboard')}
              className={navItemClass('dashboard')}
            >
              <LayoutDashboard className={iconClass('dashboard')} />
              <span>Dashboard Guru</span>
            </button>
            <button
              id="sidebar-nav-guru-kinerja"
              onClick={() => handleNavClick('kinerja-guru')}
              className={navItemClass('kinerja-guru')}
            >
              <TrendingUp className={iconClass('kinerja-guru')} />
              <span>Dashboard Tren Kinerja & Rapor</span>
            </button>
            <button
              onClick={() => handleNavClick('profil-guru')}
              className={navItemClass('profil-guru')}
            >
              <Users className={iconClass('profil-guru')} />
              <span>Profil Saya</span>
            </button>

            <div className="mt-4 px-3 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Administrasi & Modul
            </div>
            <button
              onClick={() => handleNavClick('modul-ajar')}
              className={navItemClass('modul-ajar')}
            >
              <BookOpen className={iconClass('modul-ajar')} />
              <span>Modul Ajar Saya</span>
            </button>
            <button
              onClick={() => handleNavClick('administrasi')}
              className={navItemClass('administrasi')}
            >
              <CheckSquare className={iconClass('administrasi')} />
              <span>Administrasi Pembelajaran</span>
            </button>

            <div className="mt-4 px-3 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Hasil & Jadwal
            </div>
            <button
              onClick={() => handleNavClick('pola-pikir')}
              className={navItemClass('pola-pikir')}
            >
              <BrainCircuit className={iconClass('pola-pikir')} />
              <span>Hasil Penilaian Pola Pikir</span>
            </button>
            <button
              onClick={() => handleNavClick('pembelajaran-mendalam')}
              className={navItemClass('pembelajaran-mendalam')}
            >
              <Sparkles className={iconClass('pembelajaran-mendalam')} />
              <span>Pembelajaran Mendalam (PM)</span>
            </button>
            <button
              onClick={() => handleNavClick('kalender')}
              className={navItemClass('kalender')}
            >
              <CalendarDays className={iconClass('kalender')} />
              <span>Jadwal Supervisi Saya</span>
            </button>
            <button
              id="sidebar-nav-guru-catatan"
              onClick={() => handleNavClick('catatan-supervisi')}
              className={navItemClass('catatan-supervisi')}
            >
              <MessageSquareQuote className={iconClass('catatan-supervisi')} />
              <span>Catatan Masukan Pengawas</span>
            </button>
            <button
              id="sidebar-nav-guru-reflektif"
              onClick={() => handleNavClick('catatan-reflektif-guru')}
              className={navItemClass('catatan-reflektif-guru')}
            >
              <FileText className={iconClass('catatan-reflektif-guru')} />
              <span>Catatan Reflektif Guru</span>
            </button>
          </>
        );
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        id="app-sidebar"
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 overflow-y-auto transition-all duration-200 ease-in-out lg:translate-x-0 ${getSidebarContainerClass()} ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-3 space-y-1">
          {/* User brief card */}
          <div
            className={`p-2.5 mb-3 rounded-lg border transition-colors ${
              isDarkSidebar
                ? 'bg-slate-800/80 border-slate-700/80'
                : isColoredSidebar
                ? 'bg-white/10 border-white/15 text-white'
                : 'bg-slate-50 border-slate-200/80'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs overflow-hidden shrink-0">
                {currentUser?.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  currentUser?.name?.charAt(0) || 'U'
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-xs font-bold truncate leading-tight ${
                    isDarkSidebar || isColoredSidebar ? 'text-white' : 'text-slate-800'
                  }`}
                >
                  {currentUser?.name}
                </p>
                <p
                  className={`text-[10px] font-semibold uppercase tracking-wider truncate ${
                    isDarkSidebar || isColoredSidebar ? 'text-white/70' : 'text-indigo-700'
                  }`}
                >
                  {currentUser?.role?.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          {renderNavLinks()}
        </div>
      </aside>
    </>
  );
};
