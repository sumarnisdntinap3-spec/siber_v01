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
  Zap,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PresetLogoIcon, ThemeColorKey, User } from '../types';

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
  const agencyTitle = appSettings?.agencyName || 'Dinas Pendidikan, Kepemudaan dan Olahraga Kab. Magetan';
  const footerText = appSettings?.footerText || 'Dinas Pendidikan • Sistem Informasi Supervisi Akademik & Pembelajaran Mendalam';
  const hasCustomLogo = appSettings?.logoType === 'custom' && !!appSettings?.logoUrl;

  // Key Quick Login Accounts
  const quickAccounts = [
    {
      id: 'u-guru-1',
      name: 'Sumarni, S.Pd.SD.',
      roleTitle: 'Guru Kelas / Guru Mapel',
      school: 'SDN Tinap 3 Sukomoro',
      email: 'sumarni.sdntinap3@gmail.com',
      nip: '198504152009022007',
      role: 'GURU',
      badge: 'Akun Utama',
      isPrimary: true
    },
    {
      id: 'u-ks-1',
      name: 'Hj. Sri Wahyuni, M.Pd.',
      roleTitle: 'Kepala Sekolah',
      school: 'SDN Tinap 3 Sukomoro',
      email: 'sri.wahyuni@sdntinap3.sch.id',
      nip: '197508141999032003',
      role: 'KEPALA_SEKOLAH',
      badge: 'Penilai Internal',
      isPrimary: false
    },
    {
      id: 'u-pengawas-1',
      name: 'Drs. H. Bambang Sutrisno, M.Pd.',
      roleTitle: 'Pengawas Sekolah Pembina',
      school: 'Wilayah Binaan Sukomoro',
      email: 'bambang.pengawas@pendidikan.go.id',
      nip: '196803151992031004',
      role: 'PENGAWAS',
      badge: 'Pengawas',
      isPrimary: false
    },
    {
      id: 'u-dinas',
      name: 'Didik Setiawan, S.E',
      roleTitle: 'Administrator Dinas Dikpora',
      school: 'Dinas Pendidikan Kab. Magetan',
      email: 'dinas@pendidikan.go.id',
      nip: '197405121998031002',
      role: 'ADMIN_DINAS',
      badge: 'Admin Sistem',
      isPrimary: false
    }
  ];

  const handleQuickLogin = async (account: typeof quickAccounts[0]) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const success = await login(account.email || account.nip, '123456', account.role, account.id);
      if (!success) {
        setErrorMessage('Gagal masuk dengan akun cepat. Silakan coba lagi.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal masuk. Silakan coba sesaat lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanIdent = identifier.trim();
    if (!cleanIdent) {
      setErrorMessage('Silakan masukkan NIP, Email, atau Username Anda.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    // If password is blank, default to '123456' for convenience
    const effectivePwd = password.trim() || '123456';

    try {
      const success = await login(cleanIdent, effectivePwd);
      if (!success) {
        setErrorMessage('User atau Password tidak sesuai. Silakan periksa kembali atau gunakan Akses 1-Klik.');
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
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[500px] h-[350px] bg-slate-800/40 rounded-full blur-2xl" />
      </div>

      {/* Main Container */}
      <div className="w-full max-w-xl relative z-10 space-y-5">
        {/* Header Branding */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-1 bg-slate-800/90 rounded-2xl border border-slate-700/80 shadow-lg mb-3">
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
          <p className="text-xs text-indigo-300 font-medium mt-0.5">
            Sistem Informasi Supervisi Akademik &amp; Pembelajaran Mendalam
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {agencyTitle}
          </p>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-950/80 border border-rose-800 rounded-xl flex items-start gap-3 text-xs text-rose-200 animate-in fade-in duration-200 shadow-md">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="font-medium leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* SECTION 1: AKSES CEPAT 1-KLIK (INSTANT ACCESS) */}
        <div className="bg-slate-800/95 backdrop-blur-md rounded-2xl border border-slate-700 p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-700/80">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Akses Masuk Cepat 1-Klik
              </h2>
            </div>
            <span className="text-[10px] text-slate-400">Pilih profil untuk masuk instan</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {quickAccounts.map((acc) => (
              <button
                key={acc.id}
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickLogin(acc)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer group relative flex flex-col justify-between ${
                  acc.isPrimary
                    ? 'bg-indigo-950/40 border-indigo-500/50 hover:border-indigo-400 hover:bg-indigo-900/50 shadow-sm shadow-indigo-500/10'
                    : 'bg-slate-900/60 border-slate-700/80 hover:border-slate-500 hover:bg-slate-800'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="flex items-start justify-between gap-1 mb-1">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      acc.isPrimary
                        ? 'bg-indigo-500 text-white shadow-xs'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {acc.badge}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-transform group-hover:translate-x-0.5" />
                </div>

                <div className="mt-1">
                  <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {acc.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{acc.roleTitle}</p>
                  <p className="text-[10px] text-slate-500 mt-1 font-mono truncate">{acc.email}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* SECTION 2: FORM MASUK MANUAL */}
        <div className="bg-slate-800/95 backdrop-blur-md rounded-2xl border border-slate-700 p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-700/80">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <UserIcon className="w-3.5 h-3.5 text-indigo-400" />
              Atau Masuk dengan NIP / Akun Resmi
            </h3>
            <span className="text-[10px] text-slate-400">Kata sandi default: 123456</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* User Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  NIP / Email / Username
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('sumarni.sdntinap3@gmail.com');
                    setPassword('123456');
                  }}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 cursor-pointer underline"
                >
                  Isi Otomatis Akun Bu Sumarni
                </button>
              </div>
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
                  placeholder="Masukkan NIP (1985...) atau Email (sumarni...)"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Password
                </label>
                <span className="text-[10px] text-slate-400">
                  Bawaan: <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-300">123456</code> atau NIP
                </span>
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
                  placeholder="Masukkan password (bawaan: 123456)"
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
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
            <div className="pt-1">
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
