import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Clock,
  User,
  Activity,
  Terminal,
  FileSpreadsheet
} from 'lucide-react';
import { api } from '../services/api';
import { Badge } from '../components/common/Badge';
import { ExportButton } from '../components/common/ExportButton';
import { AuditLog } from '../types';

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActionFilter, setSelectedActionFilter] = useState('');

  const loadLogs = async () => {
    try {
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error('Error loading audit logs:', err);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchQ =
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.module.toLowerCase().includes(searchQuery.toLowerCase());
    const matchAct = selectedActionFilter ? log.action === selectedActionFilter : true;
    return matchQ && matchAct;
  });

  return (
    <div id="audit-log-view" className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-slate-800" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Log Audit & Jejak Rekam Aktivitas Sistem (Security Trail)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Pencatatan real-time seluruh mutasi data, unggah modul ajar, verifikasi supervisi, autentikasi sesi, dan modifikasi master data untuk integritas dan kepatuhan audit IT.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ExportButton data={logs} fileName="audit_trail_supervisi_akademik" />
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari user, modul, atau deskripsi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <select
              value={selectedActionFilter}
              onChange={(e) => setSelectedActionFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-md text-slate-700"
            >
              <option value="">Semua Tipe Aksi</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="VERIFY">VERIFY</option>
              <option value="APPROVE">APPROVE</option>
              <option value="LOGIN">LOGIN</option>
            </select>
          </div>

          <div className="text-xs text-slate-500">
            Total tercatat <strong className="text-slate-900">{filteredLogs.length}</strong> aktivitas
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Waktu (Timestamp)</th>
                <th className="px-4 py-3">Pengguna & Peran</th>
                <th className="px-4 py-3">Modul Sistem</th>
                <th className="px-4 py-3">Aksi</th>
                <th className="px-4 py-3">Deskripsi Aktivitas</th>
                <th className="px-4 py-3">IP Address & Browser</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500">
                    <div className="font-semibold text-slate-800">
                      {new Date(log.timestamp).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                    <div>
                      {new Date(log.timestamp).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}{' '}
                      WIB
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-slate-900">{log.userName}</div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold uppercase">
                      {log.userRole.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-slate-800">{log.module}</td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        log.action === 'CREATE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : log.action === 'UPDATE' || log.action === 'VERIFY' || log.action === 'APPROVE'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : log.action === 'DELETE'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-700 max-w-sm">{log.description}</td>
                  <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500">
                    <div>{log.ipAddress || '192.168.1.10'}</div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                      {log.userAgent || 'Chrome/Windows'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
