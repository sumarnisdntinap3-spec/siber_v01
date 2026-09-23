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
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PresetLogoIcon, ThemeColorKey } from '../types';

export const LoginView: React.FC = () => {
  const { login, appSettings, demoUsers } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleQuickLogin = async (user: any) => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const success = await login(undefined, undefined, undefined, user.id);
      if (!success) {
        setErrorMessage(`Gagal masuk sebagai ${user.name}`);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || `Gagal masuk sebagai ${user.name}`);
    } finally {
      setIsLoading(false);
    }
  };

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
  const agencyTitle = appSettings?.agencyName || 'Dinas Pendidikan, Kepemudaan dan Olahraga Kab. Magetan';
  const footerText = appSettings?.footerText || 'Dinas Pendidikan • Hak Cipta Dilindungi';
  const hasCustomLogo = appSettings?.logoType === 'custom' && !!appSettings?.logoUrl;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanIdent = identifier.trim();
    if (!cleanIdent) {
      setErrorMessage('Silakan masukkan Username, NIP, atau Email Anda.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Silakan masukkan Kata Sandi (Password) Anda.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const success = await login(cleanIdent, password.trim());
      if (!success) {
        setErrorMessage('Username atau Kata Sandi salah. Silakan periksa kembali.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal masuk ke sistem. Silakan periksa kembali kredensial Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4 py-8 relative selection:bg-indigo-500 selection:text-white">
      {/* Subtle Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[450px] h-[300px] bg-slate-800/40 rounded-full blur-2xl" />
      </div>

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 space-y-5">
        {/* Header Branding */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-1 bg-slate-800/90 rounded-2xl border border-slate-700/80 shadow-lg mb-3.5">
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

          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            <span>{appTitle}</span>
          </h1>
          <p className="text-xs text-indigo-300 font-medium mt-1">
            Sistem Informasi Supervisi Akademik &amp; Pembelajaran Mendalam
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {agencyTitle}
          </p>
        </div>

        {/* Secure Login Form Box */}
        <div className="bg-slate-800/95 backdrop-blur-md rounded-2xl border border-slate-700/80 p-6 sm:p-8 shadow-2xl space-y-5">
          <div className="border-b border-slate-700/70 pb-3">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-400" />
              Masuk ke Sistem
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Masukkan Username dan Kata Sandi terdaftar Anda untuk melanjutkan
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-950/80 border border-rose-800 rounded-xl flex items-start gap-3 text-xs text-rose-200 animate-in fade-in duration-200 shadow-md">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="font-medium leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username / NIP / Email Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Username / NIP / Email
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
                  placeholder="Masukkan Username, NIP, atau Email"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Kata Sandi (Password)
              </label>
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
                  placeholder="Masukkan kata sandi Anda"
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  required
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
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogIn className="w-4 h-4" />
                <span>{isLoading ? 'Memverifikasi...' : 'Masuk ke Sistem'}</span>
              </button>
            </div>
          </form>

          {/* Quick Role Selection for Demo / Simulation */}
          <div className="pt-4 border-t border-slate-700/60 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-slate-400">Akses Cepat (Simulasi Peran)</span>
              <span className="text-[10px] text-indigo-400">1-Klik Masuk</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {demoUsers.slice(0, 4).map((user) => {
                const getRoleLabel = (r: string) => {
                  switch (r) {
                    case 'GURU':
                      return 'Guru Kelas';
                    case 'KEPALA_SEKOLAH':
                      return 'Kepala Sekolah';
                    case 'PENGAWAS':
                      return 'Pengawas Pembina';
                    case 'ADMIN_DINAS':
                      return 'Admin Dinas';
                    default:
                      return r;
                  }
                };

                const getRoleColor = (r: string) => {
                  switch (r) {
                    case 'GURU':
                      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20';
                    case 'KEPALA_SEKOLAH':
                      return 'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20';
                    case 'PENGAWAS':
                      return 'bg-purple-500/10 text-purple-400 border-purple-500/30 hover:bg-purple-500/20';
                    case 'ADMIN_DINAS':
                      return 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20';
                    default:
                      return 'bg-slate-700/50 text-slate-300 border-slate-600 hover:bg-slate-700';
                  }
                };

                return (
                  <button
                    key={user.id}
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleQuickLogin(user)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${getRoleColor(
                      user.role
                    )} flex flex-col justify-between`}
                  >
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                        {getRoleLabel(user.role)}
                      </div>
                      <div className="text-xs font-semibold text-white truncate mt-0.5" title={user.name}>
                        {user.name.split(',')[0]}
                      </div>
                    </div>
                    <div className="text-[10px] opacity-70 mt-1 flex items-center justify-between">
                      <span className="truncate">{user.username || 'user'}</span>
                      <span className="text-[9px] font-mono">→</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Security Badge */}
          <div className="pt-3 border-t border-slate-700/60 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Koneksi Aman &amp; Terenkripsi</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-slate-500 space-y-0.5">
          <p>{footerText}</p>
          <p className="text-[10px] text-slate-600">Kabupaten Magetan • Provinsi Jawa Timur</p>
        </div>
      </div>
    </div>
  );
};
