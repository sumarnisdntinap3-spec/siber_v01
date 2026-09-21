import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

// Views
import { DashboardView } from './pages/DashboardView';
import { MasterDataView } from './pages/MasterDataView';
import { MutasiGuruView } from './pages/MutasiGuruView';
import { ModulAjarView } from './pages/ModulAjarView';
import { AdministrasiView } from './pages/AdministrasiView';
import { PolaPikirView } from './pages/PolaPikirView';
import { PembelajaranMendalamView } from './pages/PembelajaranMendalamView';
import { SupervisiView } from './pages/SupervisiView';
import { KalenderSupervisiView } from './pages/KalenderSupervisiView';
import { LaporanView } from './pages/LaporanView';
import { AuditLogView } from './pages/AuditLogView';
import { ProfilGuruView } from './pages/ProfilGuruView';
import { PengaturanAplikasiView } from './pages/PengaturanAplikasiView';
import { TampilanTemplateView } from './pages/TampilanTemplateView';
import { PengawasSekolahView } from './pages/PengawasSekolahView';
import { DashboardKinerjaGuruView } from './pages/DashboardKinerjaGuruView';
import { LoginView } from './pages/LoginView';

const AccessDeniedView: React.FC<{ onBackToDashboard: () => void }> = ({ onBackToDashboard }) => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-xs max-w-xl mx-auto my-8">
    <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-4">
      <ShieldAlert className="w-8 h-8" />
    </div>
    <h3 className="text-lg font-bold text-slate-900">Akses Ditolak (Kewenangan Terbatas)</h3>
    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
      Akun Anda tidak memiliki hak akses (permission) untuk membuka halaman manajemen ini. Akses ini hanya diperuntukkan bagi Kepala Sekolah, Pengawas Pembina, atau Administrator Dinas Pendidikan sesuai regulasi sistem.
    </p>
    <button
      onClick={onBackToDashboard}
      className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
    >
      <ArrowLeft className="w-4 h-4" />
      <span>Kembali ke Dashboard Utama</span>
    </button>
  </div>
);

const MainLayout: React.FC = () => {
  const { isAuthenticated, currentRole, appSettings } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // Validate allowed tabs based on role
  const isTabAllowedForRole = (tab: string, role?: string): boolean => {
    if (!role || role === 'ADMIN_DINAS') return true;

    if (role === 'GURU') {
      const allowedGuruTabs = [
        'dashboard',
        'kinerja-guru',
        'kinerja',
        'tren-guru',
        'dashboard-kinerja-guru',
        'profil',
        'profil-guru',
        'modul-ajar',
        'administrasi',
        'pola-pikir',
        'pembelajaran-mendalam',
        'kalender'
      ];
      return allowedGuruTabs.includes(tab);
    }

    if (role === 'KEPALA_SEKOLAH') {
      const allowedKSTabs = [
        'dashboard',
        'kinerja-guru',
        'kinerja',
        'tren-guru',
        'dashboard-kinerja-guru',
        'master-guru',
        'modul-ajar',
        'administrasi',
        'pola-pikir',
        'pembelajaran-mendalam',
        'supervisi',
        'kalender',
        'laporan',
        'cetak-laporan',
        'cetak-laporan-supervisi',
        'profil',
        'profil-guru'
      ];
      return allowedKSTabs.includes(tab);
    }

    if (role === 'PENGAWAS') {
      const allowedPengawasTabs = [
        'dashboard',
        'kinerja-guru',
        'kinerja',
        'tren-guru',
        'dashboard-kinerja-guru',
        'master-sekolah',
        'master-guru',
        'supervisi',
        'kalender',
        'modul-ajar',
        'administrasi',
        'pola-pikir',
        'pembelajaran-mendalam',
        'laporan',
        'cetak-laporan',
        'cetak-laporan-supervisi',
        'profil',
        'profil-guru'
      ];
      return allowedPengawasTabs.includes(tab);
    }

    return true;
  };

  const handleSelectTab = (tab: string) => {
    setActiveTab(tab);
  };

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const renderActiveView = () => {
    if (!isTabAllowedForRole(activeTab, currentRole)) {
      return <AccessDeniedView onBackToDashboard={() => setActiveTab('dashboard')} />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <DashboardView onNavigate={(tab) => handleSelectTab(tab)} />;
      case 'kinerja-guru':
      case 'dashboard-kinerja-guru':
      case 'tren-guru':
      case 'kinerja':
        return <DashboardKinerjaGuruView onNavigate={(tab) => handleSelectTab(tab)} />;
      case 'master-data':
      case 'master-sekolah':
        return <MasterDataView initialTab="sekolah" />;
      case 'master-guru':
        return <MasterDataView initialTab="guru" />;
      case 'master-kepala-sekolah':
        return <MasterDataView initialTab="kepala-sekolah" />;
      case 'master-pengawas':
      case 'kelola-pengawas':
      case 'pengawas-sekolah':
      case 'pengawas':
        return <PengawasSekolahView />;
      case 'master-tahun':
        return <MasterDataView initialTab="tahun" />;
      case 'mutasi-guru':
        return <MutasiGuruView />;
      case 'modul-ajar':
        return <ModulAjarView />;
      case 'administrasi':
        return <AdministrasiView />;
      case 'pola-pikir':
        return <PolaPikirView />;
      case 'pembelajaran-mendalam':
        return <PembelajaranMendalamView />;
      case 'supervisi':
        return <SupervisiView />;
      case 'kalender':
        return <KalenderSupervisiView />;
      case 'cetak-laporan':
      case 'cetak-laporan-supervisi':
        return <LaporanView initialMode="cetak" />;
      case 'laporan':
        return <LaporanView initialMode="dashboard" />;
      case 'audit-log':
        return <AuditLogView />;
      case 'tampilan-template':
      case 'template':
      case 'tema':
        return <TampilanTemplateView />;
      case 'pengaturan':
      case 'pengaturan-aplikasi':
      case 'settings':
        return <PengaturanAplikasiView />;
      case 'profil':
      case 'profil-guru':
        return <ProfilGuruView />;
      default:
        return <DashboardView onNavigate={(tab) => handleSelectTab(tab)} />;
    }
  };

  const getBackgroundPatternClass = () => {
    switch (appSettings?.bgPattern) {
      case 'dots':
        return 'bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] bg-slate-50/50';
      case 'grid':
        return 'bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] bg-slate-50/80';
      case 'mesh':
        return 'bg-gradient-to-br from-slate-50 via-slate-100/50 to-slate-100';
      case 'waves':
        return 'bg-gradient-to-tr from-slate-50 via-slate-100/60 to-slate-50';
      case 'none':
      default:
        return 'bg-slate-50';
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans text-slate-800 ${getBackgroundPatternClass()}`}>
      {/* Top Navbar */}
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onNavigate={(tab) => handleSelectTab(tab)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab as any}
          onSelectTab={(tab) => handleSelectTab(tab)}
          isOpenMobile={isSidebarOpen}
          onCloseMobile={() => setIsSidebarOpen(false)}
        />

        {/* Dynamic Page Container */}
        <main className="flex-1 lg:pl-64 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {renderActiveView()}
        </main>
      </div>

      {/* Global Search Dialog */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={(path) => {
          handleSelectTab(path);
          setIsSearchOpen(false);
        }}
        onSelect={(path) => {
          handleSelectTab(path);
          setIsSearchOpen(false);
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
