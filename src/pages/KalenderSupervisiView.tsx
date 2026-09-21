import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Building2,
  User,
  CheckCircle2,
  Calendar as CalendarIcon,
  Filter,
  Plus
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { SupervisionRequest, School } from '../types';

export const KalenderSupervisiView: React.FC = () => {
  const { currentUser, currentRole } = useAuth();

  const [supervisions, setSupervisions] = useState<SupervisionRequest[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState('');

  // Calendar State: Default to August 2026
  const [currentDate, setCurrentDate] = useState(new Date(2026, 7, 1)); // Month index 7 = August

  const [selectedEvent, setSelectedEvent] = useState<SupervisionRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = async () => {
    try {
      const schoolFilter =
        currentRole === 'KEPALA_SEKOLAH' || currentRole === 'GURU'
          ? currentUser?.schoolId
          : selectedSchoolFilter || undefined;

      const supervisorFilter = currentRole === 'PENGAWAS' ? currentUser?.id : undefined;

      const [sList, schList] = await Promise.all([
        api.getSupervisionRequests({
          schoolId: schoolFilter,
          supervisorId: supervisorFilter
        }),
        api.getSchools()
      ]);

      setSupervisions(sList);
      setSchools(schList);
    } catch (err) {
      console.error('Error loading calendar data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentRole, currentUser, selectedSchoolFilter]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember'
  ];

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const paddingDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  // Group events by date string YYYY-MM-DD
  const getEventsForDay = (day: number) => {
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return supervisions.filter(
      (s) => s.approvedDate === formattedDate || s.proposedDate1 === formattedDate
    );
  };

  return (
    <div id="kalender-supervisi-view" className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Kalender Interaktif Supervisi Akademik & Observasi Kelas
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Visualisasi jadwal kunjungan supervisi tatap muka sekolah binaan. Klik pada tanggal yang memiliki agenda untuk melihat detail kegiatan.
          </p>
        </div>

        {/* Month Navigation & School Filter */}
        <div className="flex flex-wrap items-center gap-3">
          {(currentRole === 'ADMIN_DINAS' || currentRole === 'PENGAWAS') && (
            <select
              value={selectedSchoolFilter}
              onChange={(e) => setSelectedSchoolFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Semua Satuan Pendidikan</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={prevMonth}
              className="p-1 hover:bg-white text-slate-600 rounded transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-3 text-xs font-bold text-slate-800 min-w-[120px] text-center">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={nextMonth}
              className="p-1 hover:bg-white text-slate-600 rounded transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Day Headers (Sun - Sat) */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 text-center py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          <div className="text-rose-600">Minggu</div>
          <div>Senin</div>
          <div>Selasa</div>
          <div>Rabu</div>
          <div>Kamis</div>
          <div>Jumat</div>
          <div className="text-indigo-600">Sabtu</div>
        </div>

        {/* Days Matrix */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100">
          {/* Leading empty days */}
          {paddingDays.map((i) => (
            <div key={`pad-${i}`} className="min-h-[110px] bg-slate-50/30 p-2" />
          ))}

          {/* Actual days */}
          {daysArray.map((day) => {
            const dayEvents = getEventsForDay(day);
            const isToday = day === 20 && month === 7 && year === 2026; // Example today marker

            return (
              <div
                key={`day-${day}`}
                className={`min-h-[110px] p-2 transition-colors relative hover:bg-slate-50/60 ${
                  isToday ? 'bg-indigo-50/30' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-xs font-bold w-5 h-5 rounded flex items-center justify-center ${
                      isToday
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : dayEvents.length > 0
                        ? 'text-slate-900'
                        : 'text-slate-400'
                    }`}
                  >
                    {day}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded">
                      {dayEvents.length} Jadwal
                    </span>
                  )}
                </div>

                {/* Event list pills */}
                <div className="space-y-1 overflow-y-auto max-h-[80px]">
                  {dayEvents.map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => {
                        setSelectedEvent(ev);
                        setIsModalOpen(true);
                      }}
                      className={`p-1.5 rounded text-[10px] font-medium leading-tight cursor-pointer border truncate transition-all ${
                        ev.status === 'DISETUJUI' || ev.status === 'SELESAI'
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      <span className="font-bold block truncate">{ev.teacherName}</span>
                      <span className="text-slate-500 block truncate">{ev.subject}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Detail Event Kunjungan Supervisi */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Rincian Agenda Supervisi Akademik"
        subtitle={selectedEvent?.teacherName}
      >
        {selectedEvent && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block">Satuan Pendidikan:</span>
                <span className="font-bold text-slate-900">{selectedEvent.schoolName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Mata Pelajaran & Kelas:</span>
                <span className="font-bold text-slate-900">
                  {selectedEvent.subject} ({selectedEvent.grade})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Pengawas Pembina:</span>
                <span className="font-bold text-slate-900">
                  {selectedEvent.supervisorName || 'Pengawas Dinas'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Status Pelaksanaan:</span>
                <Badge status={selectedEvent.status} size="sm" className="mt-0.5" />
              </div>
            </div>

            <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 space-y-1 text-blue-950">
              <p className="font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-700" />
                <span>Waktu & Tanggal Terjadwal:</span>
              </p>
              <p className="font-semibold text-sm">
                {selectedEvent.approvedDate || selectedEvent.proposedDate1} (
                {selectedEvent.approvedTime || selectedEvent.proposedTime1})
              </p>
              <p className="text-[11px] text-blue-800">
                Jenis Supervisi: {selectedEvent.supervisionType.replace('_', ' ')}
              </p>
            </div>

            {selectedEvent.notes && (
              <div>
                <span className="font-bold text-slate-700 block mb-1">Catatan Fokus Pelaksanaan:</span>
                <p className="p-3 bg-white border border-slate-200 rounded-lg text-slate-600 leading-relaxed">
                  {selectedEvent.notes}
                </p>
              </div>
            )}

            {selectedEvent.score && (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-emerald-900 font-bold block">Nilai Supervisi:</span>
                  <span className="text-xs text-emerald-800">{selectedEvent.feedback}</span>
                </div>
                <span className="text-2xl font-black text-emerald-700">{selectedEvent.score}/100</span>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
