import React, { useState, useEffect } from 'react';
import { Search, X, User, Building2, BookOpen, Calendar, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';
import { Badge } from './Badge';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (tab: any, itemData?: any) => void;
  onSelect?: (tab: any, itemData?: any) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onSelect
}) => {
  const [query, setQuery] = useState('');
  const [teachers, setTeachers] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [supervisions, setSupervisions] = useState<any[]>([]);

  const handleNavigate = (tab: any, itemData?: any) => {
    if (onNavigate) {
      onNavigate(tab, itemData);
    } else if (onSelect) {
      onSelect(tab, itemData);
    }
  };

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        api.getTeachers(),
        api.getSchools(),
        api.getLearningModules(),
        api.getSupervisionRequests()
      ]).then(([t, s, m, sup]) => {
        setTeachers(t);
        setSchools(s);
        setModules(m);
        setSupervisions(sup);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const filteredTeachers = q
    ? teachers.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.nip.includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.schoolName.toLowerCase().includes(q)
      )
    : [];

  const filteredSchools = q
    ? schools.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.npsn.includes(q) ||
          s.principalName?.toLowerCase().includes(q) ||
          s.subDistrict.toLowerCase().includes(q)
      )
    : [];

  const filteredModules = q
    ? modules.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.teacherName.toLowerCase().includes(q) ||
          m.subject.toLowerCase().includes(q)
      )
    : [];

  const filteredSupervisions = q
    ? supervisions.filter(
        (sup) =>
          sup.teacherName.toLowerCase().includes(q) ||
          sup.schoolName.toLowerCase().includes(q) ||
          sup.subject.toLowerCase().includes(q)
      )
    : [];

  const hasResults =
    filteredTeachers.length > 0 ||
    filteredSchools.length > 0 ||
    filteredModules.length > 0 ||
    filteredSupervisions.length > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-4 pt-16 sm:pt-20">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-10">
        {/* Search input header */}
        <div className="flex items-center px-4 border-b border-slate-200 bg-slate-50/50">
          <Search className="w-4 h-4 text-slate-400 mr-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ketik nama guru, NIP, sekolah, mapel, atau modul ajar..."
            autoFocus
            className="w-full py-3.5 text-xs bg-transparent border-0 focus:outline-hidden text-slate-900 placeholder:text-slate-400 font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Results area */}
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4">
          {!q && (
            <div className="py-8 text-center text-xs text-slate-400">
              Ketik kata kunci pencarian di atas untuk menemukan data guru, satuan pendidikan, modul pembelajaran, atau jadwal supervisi.
            </div>
          )}

          {q && !hasResults && (
            <div className="py-8 text-center text-xs text-slate-500">
              Tidak ditemukan hasil untuk <span className="font-semibold text-slate-800">"{query}"</span>
            </div>
          )}

          {filteredTeachers.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-2">
                Guru ({filteredTeachers.length})
              </p>
              <div className="space-y-1">
                {filteredTeachers.slice(0, 5).map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      handleNavigate('master-guru', t);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-md bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{t.name}</p>
                        <p className="text-[11px] text-slate-500">
                          NIP: {t.nip} • {t.subject} • {t.schoolName}
                        </p>
                      </div>
                    </div>
                    <Badge status={t.moduleStatus || 'BELUM_UPLOAD'} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredSchools.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-2">
                Satuan Pendidikan ({filteredSchools.length})
              </p>
              <div className="space-y-1">
                {filteredSchools.slice(0, 4).map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      handleNavigate('master-sekolah', s);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{s.name}</p>
                        <p className="text-[11px] text-slate-500">
                          NPSN: {s.npsn} • KS: {s.principalName || '-'} • Pengawas: {s.supervisorName || '-'}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredModules.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-2">
                Modul Ajar ({filteredModules.length})
              </p>
              <div className="space-y-1">
                {filteredModules.slice(0, 4).map((m) => (
                  <div
                    key={m.id}
                    onClick={() => {
                      handleNavigate('modul-ajar', m);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-md bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                        <BookOpen className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{m.title}</p>
                        <p className="text-[11px] text-slate-500">
                          Oleh {m.teacherName} • {m.subject} • {m.schoolName}
                        </p>
                      </div>
                    </div>
                    <Badge status={m.status} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredSupervisions.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-2">
                Jadwal Supervisi ({filteredSupervisions.length})
              </p>
              <div className="space-y-1">
                {filteredSupervisions.slice(0, 4).map((sup) => (
                  <div
                    key={sup.id}
                    onClick={() => {
                      handleNavigate('kalender', sup);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
                        <Calendar className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          Supervisi: {sup.teacherName} ({sup.subject})
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {sup.approvedDate || sup.proposedDate1} • {sup.schoolName} • Pengawas: {sup.supervisorName}
                        </p>
                      </div>
                    </div>
                    <Badge status={sup.status} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Gunakan Esc untuk menutup</span>
          <span>SI-SUPERVISI PM Global Search</span>
        </div>
      </div>
    </div>
  );
};
