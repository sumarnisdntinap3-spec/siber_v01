import React, { useState } from 'react';
import {
  GraduationCap,
  Shield,
  Building2,
  BookOpen,
  Lock,
  Sparkles,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  Award,
  User as UserIcon,
  CheckCircle2,
  HelpCircle,
  Briefcase,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PresetLogoIcon, ThemeColorKey, UserRole } from '../types';

export const LoginView: React.FC = () => {
  const { login, appSettings, demoUsers } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const renderPresetLogo = (preset?: PresetLogoIcon) => {
    switch (preset) {
      case 'tut-wuri-handayani':
        return (
          <img
            src="/tut-wuri-handayani.svg"
            alt="Tut Wuri Handayani"
            className="w-full h-full object-contain p-1"
          />
        );
      case 'sparkles':
        return <Sparkles className="w-7 h-7 text-white" />;
      case 'graduation-cap':
        return <GraduationCap className="w-7 h-7 text-white" />;
      case 'building':
        return <Building2 className="w-7 h-7 text-white" />;
      case 'shield':
        return <Shield className="w-7 h-7 text-white" />;
      case 'book':
        return <BookOpen className="w-7 h-7 text-white" />;
      case 'award':
        return <Award className="w-7 h-7 text-white" />;
      default:
        return (
          <img
            src="/tut-wuri-handayani.svg"
            alt="Tut Wuri Handayani"
            className="w-full h-full object-contain p-1"
          />
        );
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

  const appTitle = appSettings?.appName || 'SIBER-PM';
  const agencyTitle = appSettings?.agencyName || 'Dinas Pendidikan';
  const footerText = appSettings?.footerText || 'Dinas Pendidikan • Hak Cipta Dilindungi';
  const hasCustomLogo = appSettings?.logoType === 'custom' && !!appSettings?.logoUrl;

  const handleQuickLogin = async (targetId: string, targetPwd?: string) => {
    setIdentifier(targetId);
    if (targetPwd) setPassword(targetPwd);
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const success = await login(targetId, targetPwd || '123456');
      if (!success) {
        setErrorMessage('Gagal masuk dengan akun yang dipilih.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal masuk. Periksa kembali akun Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMessage('Silakan masukkan User, NIP, atau Email Anda.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const pwdToSend = password.trim() || '123456';
      const success = await login(identifier.trim(), pwdToSend);
      if (!success) {
        setErrorMessage('User atau Password salah. Silakan periksa kembali.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal masuk. Periksa kembali User dan Password Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick account options
  const guruUser = demoUsers.find((u) => u.email === 'sumarni.sdntinap3@gmail.com') || demoUsers.find((u) => u.role === 'GURU');
  const ksUser = demoUsers.find((u) => u.role === 'KEPALA_SEKOLAH');
  const pengawasUser = demoUsers.find((u) => u.role === 'PENGAWAS');
  const adminUser = demoUsers.find((u) => u.role === 'ADMIN_DINAS');

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4 py-8 relative selection:bg-indigo-500 selection:text-white">
      {/* Subtle Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-slate-800/40 rounded-full blur-2xl" />
      </div>

      {/* Main Container Card */}
      <div className="w-full max-w-lg relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-1 bg-slate-800/80 rounded-2xl border border-slate-700/80 shadow-lg mb-3.5">
            <div
              className={`w-14 h-14 rounded-xl ${getThemeBg(
                appSettings?.primaryColor
              )} flex items-center justify-center shadow-md overflow-hidden`}
            >
              {hasCustomLogo ? (
                <img
                  src={appSettings?.logoUrl}
                  alt="Logo"
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                renderPresetLogo(appSettings?.logoPreset)
              )}
            </div>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white">
            {appTitle}
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            {agencyTitle}
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl border border-slate-700/70 p-6 sm:p-8 shadow-2xl">
          <div className="mb-5 pb-3 border-b border-slate-700/60">
            <h2 className="text-base font-semibold text-white">
              Masuk ke Sistem Supervisi
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Gunakan NIP, Email, atau pilih akun cepat di bawah ini
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-rose-950/70 border border-rose-800/80 rounded-xl flex items-start gap-3 text-xs text-rose-200 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="font-medium leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Quick Login Options */}
          <div className="mb-5">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Pilih Akun Masuk Cepat (1-Klik)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Ibu Sumarni (Guru) */}
              <button
                type="button"
                onClick={() => handleQuickLogin(guruUser?.email || 'sumarni.sdntinap3@gmail.com', guruUser?.nip || '123456')}
                disabled={isLoading}
                className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/80 hover:border-indigo-500/80 hover:bg-slate-900 transition-all text-left flex items-center gap-2.5 group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                  G
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-white truncate group-hover:text-indigo-300">
                    {guruUser?.name || 'Sumarni, S.Pd.SD.'}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">Guru • SDN Tinap 3</p>
                </div>
              </button>

              {/* Kepala Sekolah */}
              <button
                type="button"
                onClick={() => handleQuickLogin(ksUser?.nip || '197203121996032001', ksUser?.nip || '123456')}
                disabled={isLoading}
                className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/80 hover:border-indigo-500/80 hover:bg-slate-900 transition-all text-left flex items-center gap-2.5 group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                  KS
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-white truncate group-hover:text-indigo-300">
                    {ksUser?.name || 'Hj. Sri Wahyuni, M.Pd.'}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">Kepala Sekolah</p>
                </div>
              </button>

              {/* Pengawas Sekolah */}
              <button
                type="button"
                onClick={() => handleQuickLogin(pengawasUser?.nip || '196805121993031004', pengawasUser?.nip || '123456')}
                disabled={isLoading}
                className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/80 hover:border-indigo-500/80 hover:bg-slate-900 transition-all text-left flex items-center gap-2.5 group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                  PS
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-white truncate group-hover:text-indigo-300">
                    {pengawasUser?.name || 'Drs. H. Bambang Sutrisno'}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">Pengawas Sekolah</p>
                </div>
              </button>

              {/* Admin Dinas */}
              <button
                type="button"
                onClick={() => handleQuickLogin('admin123', 'admin123')}
                disabled={isLoading}
                className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/80 hover:border-indigo-500/80 hover:bg-slate-900 transition-all text-left flex items-center gap-2.5 group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                  AD
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-white truncate group-hover:text-indigo-300">
                    {adminUser?.name || 'Didik Setiawan, S.E'}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">Admin Dinas • admin123</p>
                </div>
              </button>
            </div>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="grow border-t border-slate-700/60"></div>
            <span className="shrink mx-3 text-[11px] text-slate-400 uppercase tracking-wider">Atau Masuk Manual</span>
            <div className="grow border-t border-slate-700/60"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 mt-3">
            {/* User Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                User / NIP / Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  id="login-username"
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="NIP / Email (contoh: sumarni.sdntinap3@gmail.com)"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-900/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Password
                </label>
                <span className="text-[10px] text-slate-400">Default: NIP atau 123456</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password (NIP atau 123456)"
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-900/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
                  title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                id="btn-submit-login"
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogIn className="w-4 h-4" />
                <span>{isLoading ? 'Memverifikasi...' : 'Masuk ke Sistem'}</span>
              </button>
            </div>
          </form>

          {/* Quick Help Box */}
          <div className="mt-4 p-3 bg-slate-900/50 rounded-xl border border-slate-700/50 flex items-start gap-2.5 text-[11px] text-slate-400 leading-relaxed">
            <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-300">Bantuan Akses Masuk:</p>
              <p className="mt-0.5">
                • <strong>Admin Dinas</strong>: Username <code className="text-indigo-300 bg-slate-800 px-1 py-0.5 rounded">admin123</code> & Password <code className="text-indigo-300 bg-slate-800 px-1 py-0.5 rounded">admin123</code>
              </p>
              <p className="mt-0.5">
                • <strong>Guru, KS, & Pengawas</strong>: Gunakan NIP (18 digit), Email, atau Username dengan password NIP / <strong className="text-white">123456</strong>, atau gunakan tombol 1-klik di atas.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-slate-500">
          <p>{footerText}</p>
        </div>
      </div>
    </div>
  );
};

