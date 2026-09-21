import React, { useState } from 'react';
import { Download, Printer, FileSpreadsheet, FileText, Check } from 'lucide-react';

interface ExportButtonProps {
  data: any[];
  fileName?: string;
  title?: string;
  columns?: { key: string; label: string }[];
  className?: string;
  id?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  data,
  fileName = 'rekap_supervisi_akademik',
  title = 'Laporan Supervisi Akademik & Pembelajaran Mendalam',
  columns,
  className = '',
  id = 'export-btn-group'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const exportToCSV = () => {
    if (!data || data.length === 0) {
      alert('Tidak ada data untuk diekspor.');
      return;
    }

    const cols = columns || Object.keys(data[0]).map((k) => ({ key: k, label: k }));
    const headerRow = cols.map((c) => `"${c.label}"`).join(',');
    
    const rows = data.map((item) => {
      return cols
        .map((c) => {
          let val = item[c.key];
          if (typeof val === 'object' && val !== null) {
            val = JSON.stringify(val);
          }
          const str = String(val ?? '').replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headerRow, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsOpen(false);
  };

  const handlePrint = () => {
    window.print();
    setIsOpen(false);
  };

  return (
    <div id={id} className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md shadow-xs hover:bg-slate-50 focus:outline-hidden transition-colors"
      >
        <Download className="w-3.5 h-3.5 text-slate-400" />
        <span>Ekspor / Cetak</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-30 mt-1.5 w-48 origin-top-right rounded-lg bg-white p-1 shadow-lg ring-1 ring-black/5 focus:outline-hidden border border-slate-200">
            <button
              onClick={exportToCSV}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 rounded-md hover:bg-slate-50 hover:text-indigo-600 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ekspor ke CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 rounded-md hover:bg-slate-50 hover:text-indigo-600 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-600" />
              <span>Cetak Laporan</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
