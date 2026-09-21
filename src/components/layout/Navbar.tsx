import React, { useState } from 'react';
import {
  Bell,
  Search,
  CheckCheck,
  ChevronDown,
  LogOut,
  Calendar,
  Layers,
  Sparkles,
  School as SchoolIcon,
  UserCheck,
  GraduationCap,
  Shield,
  BookOpen,
  Award,
  Building2,
  Settings,
  User as UserIcon,
  Palette,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';
import { PresetLogoIcon, ThemeColorKey } from '../../types';

interface NavbarProps {
  onOpenSearch: () => void;
  onToggleSidebar?: () => void;
  onNavigate?: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSearch, onToggleSidebar, onNavigate }) => {
  const {
    currentUser,
    currentRole,
    appSettings,
    activeEducationYear,
    allEducationYears,
    notifications,
    unreadNotificationCount,
    demoUsers,
    switchUser,
    logout,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    setActiveEducationYearById
  } = useAuth();

  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getRoleTitle = (role?: string) => {
    switch (role) {
      case 'ADMIN_DINAS':
        return 'Admin Dinas Pendidikan';
      case 'PENGAWAS':
        return 'Pengawas Sekolah';
      case 'KEPALA_SEKOLAH':
        return 'Kepala Sekolah';
      case 'GURU':
        return 'Guru Mata Pelajaran / Kelas';
      default:
        return role;
    }
  };

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'ADMIN_DINAS':
        return <Shield className="w-4 h-4 text-purple-600" />;
      case 'PENGAWAS':
        return <UserCheck className="w-4 h-4 text-blue-600" />;
      case 'KEPALA_SEKOLAH':
        return <SchoolIcon className="w-4 h-4 text-emerald-600" />;
      case 'GURU':
        return <GraduationCap className="w-4 h-4 text-amber-600" />;
      default:
        return null;
    }
  };

  const renderPresetLogo = (preset?: PresetLogoIcon) => {
    switch (preset) {
      case 'sparkles':
        return <Sparkles className="w-4 h-4 text-white" />;
      case 'graduation-cap':
        return <GraduationCap className="w-4 h-4 text-white" />;
      case 'building':
        return <Building2 className="w-4 h-4 text-white" />;
      case 'shield':
        return <Shield className="w-4 h-4 text-white" />;
      case 'book':
        return <BookOpen className="w-4 h-4 text-white" />;
      case 'award':
        return <Award className="w-4 h-4 text-white" />;
      default:
        return <Sparkles className="w-4 h-4 text-white" />;
    }
  };

  const getThemeBg = (color?: ThemeColorKey) => {
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

  const getThemeText = (color?: ThemeColorKey) => {
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

  const appTitle = appSettings?.appName || 'SIP-SAGU PM';
  const appShort = appSettings?.appShortName || 'PM';
  const agencyTitle = appSettings?.agencyName || 'Dinas Pendidikan';
  const appSub = appSettings?.appSubtitle || 'Supervisi Akademik & Pembelajaran Mendalam';
  const hasCustomLogo = appSettings?.logoType === 'custom' && !!appSettings?.logoUrl;

  const getNavbarContainerClass = () => {
    const navStyle = appSettings?.navbarStyle || 'white';
    const pColor = appSettings?.primaryColor || 'indigo';

    switch (navStyle) {
      case 'glass':
        return 'sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-200 shadow-2xs';
      case 'dark':
        return 'sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 shadow-xs';
      case 'colored':
        switch (pColor) {
          case 'indigo':
            return 'sticky top-0 z-30 bg-indigo-700 text-white border-b border-indigo-800 shadow-xs';
          case 'blue':
            return 'sticky top-0 z-30 bg-blue-700 text-white border-b border-blue-800 shadow-xs';
          case 'emerald':
            return 'sticky top-0 z-30 bg-emerald-700 text-white border-b border-emerald-800 shadow-xs';
          case 'purple':
            return 'sticky top-0 z-30 bg-purple-700 text-white border-b border-purple-800 shadow-xs';
          case 'amber':
            return 'sticky top-0 z-30 bg-amber-700 text-white border-b border-amber-800 shadow-xs';
          case 'rose':
            return 'sticky top-0 z-30 bg-rose-700 text-white border-b border-rose-800 shadow-xs';
          case 'teal':
            return 'sticky top-0 z-30 bg-teal-700 text-white border-b border-teal-800 shadow-xs';
          default:
            return 'sticky top-0 z-30 bg-indigo-700 text-white border-b border-indigo-800 shadow-xs';
        }
      case 'white':
      default:
        return 'sticky top-0 z-30 bg-white border-b border-slate-200 shadow-2xs';
    }
  };

  const isDarkOrColoredNav =
    appSettings?.navbarStyle === 'dark' || appSettings?.navbarStyle === 'colored';

  return (
    <header id="main-navbar" className="flex flex-col">
      {/* Global Announcement Banner from Admin Dinas */}
      {appSettings?.enableAnnouncement && appSettings?.announcementText && (
        <div
          id="global-announcement-banner"
          className={`px-4 py-1.5 text-xs text-white flex items-center justify-between transition-all ${
            appSettings.announcementType === 'warning'
              ? 'bg-amber-500 text-white'
              : appSettings.announcementType === 'success'
              ? 'bg-emerald-600 text-white'
              : appSettings.announcementType === 'urgent'
              ? 'bg-rose-600 text-white'
              : 'bg-indigo-600 text-white'
          }`}
        >
          <div className="flex items-center gap-2 max-w-6xl mx-auto w-full px-2">
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-white/20">
              PENGUMUMAN RESMI DINAS
            </span>
            <span className="text-[11px] font-medium truncate flex-1">
              {appSettings.announcementText}
            </span>
          </div>
        </div>
      )}

      {/* Main Navbar Bar */}
      <div className={getNavbarContainerClass()}>
        <div className="flex items-center justify-between px-4 sm:px-6 h-16">
          {/* Left: Brand & Mobile Menu toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleSidebar}
              className={`lg:hidden p-2 rounded-lg transition-colors ${
                isDarkOrColoredNav
                  ? 'text-white/80 hover:text-white hover:bg-white/10'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-5 h-5" />
            </button>

            <div
              onClick={() => onNavigate && onNavigate('dashboard')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div
                className={`w-8 h-8 rounded-lg ${getThemeBg(
                  appSettings?.primaryColor
                )} flex items-center justify-center text-white font-bold text-base shadow-xs overflow-hidden shrink-0 transition-transform group-hover:scale-105`}
              >
                {hasCustomLogo ? (
                  <img
                    src={appSettings?.logoUrl}
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  renderPresetLogo(appSettings?.logoPreset)
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-bold tracking-tight text-base leading-none ${
                      isDarkOrColoredNav ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {appTitle}{' '}
                    {appShort && (
                      <span
                        className={
                          isDarkOrColoredNav
                            ? 'text-white/90 font-extrabold'
                            : `${getThemeText(appSettings?.primaryColor)} font-extrabold`
                        }
                      >
                        {appShort}
                      </span>
                    )}
                  </span>
                  <span
                    className={`hidden sm:inline-flex text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                      isDarkOrColoredNav
                        ? 'bg-white/20 text-white'
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                    }`}
                  >
                    {agencyTitle}
                  </span>
                </div>
                <p
                  className={`text-[10px] font-semibold tracking-widest uppercase hidden md:block leading-none mt-1 truncate max-w-sm ${
                    isDarkOrColoredNav ? 'text-white/70' : 'text-slate-400'
                  }`}
                >
                  {appSub}
                </p>
              </div>
            </div>
          </div>

        {/* Center: Search & Academic Year Active Badge */}
        <div className="hidden md:flex items-center gap-3">
          {/* Quick Search trigger */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-600 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-full transition-all w-64 justify-between group"
          >
            <span className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
              <span className="text-slate-500 font-normal">Cari guru, modul, sekolah...</span>
            </span>
            <kbd className="text-[10px] font-semibold bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-400">
              ⌘K
            </kbd>
          </button>

          {/* Active Academic Year Pill */}
          <div className="relative group">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>
                T.A. {activeEducationYear ? activeEducationYear.name : '2026/2027'} ({activeEducationYear?.semester || 'Ganjil'})
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-1" />
            </div>
          </div>
        </div>

        {/* Right: Role Badge, Notifications, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Read-Only Authenticated Role Badge */}
          <div
            id="current-role-badge"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg shadow-2xs select-none"
          >
            {getRoleIcon(currentRole || '')}
            <span className="hidden sm:inline-block max-w-[150px] truncate">
              {getRoleTitle(currentRole || '')}
            </span>
          </div>

          {/* Notification Bell */}
          <div className="relative">
            <button
              id="notif-btn"
              type="button"
              onClick={() => {
                setShowNotifMenu(!showNotifMenu);
                setShowUserMenu(false);
              }}
              className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadNotificationCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-white">
                  {unreadNotificationCount}
                </span>
              )}
            </button>

            {showNotifMenu && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowNotifMenu(false)} />
                <div className="absolute right-0 z-30 mt-2 w-80 sm:w-96 origin-top-right rounded-xl bg-white shadow-xl border border-slate-200 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">Notifikasi</span>
                      {unreadNotificationCount > 0 && (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-red-100 text-red-700 rounded">
                          {unreadNotificationCount} Baru
                        </span>
                      )}
                    </div>
                    {unreadNotificationCount > 0 && (
                      <button
                        onClick={markAllNotificationsAsRead}
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Tandai semua dibaca
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        Tidak ada notifikasi saat ini.
                      </div>
                    ) : (
                      notifications.slice(0, 8).map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => markNotificationAsRead(notif.id)}
                          className={`p-3.5 text-left hover:bg-slate-50 transition-colors cursor-pointer ${
                            !notif.isRead ? 'bg-indigo-50/30' : ''
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <h4 className="text-xs font-semibold text-slate-900 leading-snug">
                              {notif.title}
                            </h4>
                            <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                              {notif.createdAt}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            {notif.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Profile avatar & Dropdown */}
          <div className="relative">
            <button
              id="user-profile-btn"
              type="button"
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifMenu(false);
              }}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center overflow-hidden">
                {currentUser?.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  currentUser?.name?.charAt(0) || 'U'
                )}
              </div>
              <div className="hidden xl:block text-left">
                <p className="text-xs font-bold text-slate-800 leading-none truncate max-w-[120px]">
                  {currentUser?.name}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5 uppercase font-semibold">
                  {currentUser?.role?.toLowerCase().replace('_', ' ')}
                </p>
              </div>
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 z-30 mt-2 w-64 origin-top-right rounded-xl bg-white p-2 shadow-lg border border-slate-200">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 mb-2">
                    <p className="text-xs font-bold text-slate-900 leading-tight">{currentUser?.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">NIP: {currentUser?.nip || '-'}</p>
                    <p className="text-[11px] text-slate-500">{currentUser?.email}</p>
                    <div className="mt-2">
                      <Badge status={currentUser?.role || ''} size="sm" />
                    </div>
                  </div>

                  {/* If Admin Dinas, direct shortcut to Profile & App Settings */}
                  {currentRole === 'ADMIN_DINAS' && (
                    <>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          if (onNavigate) onNavigate('tampilan-template');
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors mb-1"
                      >
                        <Palette className="w-4 h-4 text-indigo-600" />
                        <span>Ubah Tampilan & Template</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          if (onNavigate) onNavigate('pengaturan-aplikasi');
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors mb-1"
                      >
                        <Settings className="w-4 h-4 text-slate-500" />
                        <span>Edit Profil & Logo Aplikasi</span>
                      </button>
                    </>
                  )}

                  {/* If Guru, shortcut to Profil Guru */}
                  {currentRole === 'GURU' && (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        if (onNavigate) onNavigate('profil-guru');
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors mb-1"
                    >
                      <UserIcon className="w-4 h-4 text-indigo-600" />
                      <span>Lihat Profil Saya</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar dari Akun</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  </header>
);
};
