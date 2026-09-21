import React from 'react';

interface BadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Badge: React.FC<BadgeProps> = ({ status, className = '', size = 'md' }) => {
  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  const cleanStatus = status?.toUpperCase() || '';

  if (['DISETUJUI', 'LENGKAP', 'AKTIF', 'ACTIVE', 'SELESAI', 'MAHIR', 'POLA PIKIR BERKEMBANG'].includes(cleanStatus)) {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (['DIAJUKAN', 'DIUPLOAD', 'DIPROSES', 'DIPERIKSA', 'BERKEMBANG', 'CAKAP', 'POLA PIKIR BERKEMBANG DENGAN PENDAMPINGAN'].includes(cleanStatus)) {
    colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200';
  } else if (['PERLU_REVISI', 'PERLU REVISI', 'BELUM LENGKAP', 'BELUM_LENGKAP', 'MULAI TERLIHAT', 'POLA PIKIR PERLU PENGUATAN'].includes(cleanStatus)) {
    colorClasses = 'bg-amber-50 text-amber-800 border-amber-200';
  } else if (['DITOLAK', 'NONAKTIF', 'INACTIVE', 'BELUM_UPLOAD', 'BELUM UPLOAD', 'BELUM_TERJADWAL'].includes(cleanStatus)) {
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (['DRAFT'].includes(cleanStatus)) {
    colorClasses = 'bg-slate-50 text-slate-600 border-slate-200';
  }

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider',
    md: 'text-[11px] px-2.5 py-0.5 font-bold uppercase tracking-wider',
    lg: 'text-xs px-3 py-1 font-bold uppercase tracking-wider'
  }[size];

  // Friendly human text
  const labelMap: Record<string, string> = {
    DISETUJUI: 'Disetujui',
    DIAJUKAN: 'Diajukan',
    PERLU_REVISI: 'Perlu Revisi',
    DITOLAK: 'Ditolak',
    DIPERIKSA: 'Sedang Diperiksa',
    DRAFT: 'Draft',
    DIUPLOAD: 'Diupload',
    LENGKAP: 'Lengkap',
    BELUM_LENGKAP: 'Belum Lengkap',
    BELUM_UPLOAD: 'Belum Upload',
    BELUM_TERJADWAL: 'Belum Terjadwal',
    SELESAI: 'Selesai',
    ACTIVE: 'Aktif',
    INACTIVE: 'Nonaktif'
  };

  const displayText = labelMap[cleanStatus] || status;

  return (
    <span
      className={`inline-flex items-center justify-center rounded border whitespace-nowrap ${sizeClasses} ${colorClasses} ${className}`}
    >
      {displayText}
    </span>
  );
};
