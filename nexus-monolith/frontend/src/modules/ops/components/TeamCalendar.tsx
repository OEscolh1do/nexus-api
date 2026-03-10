
import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Cake, Plane, Stethoscope, Coffee, Plus, CalendarPlus, X } from 'lucide-react';
import { FormSelect } from '@/components/ui/FormSelect';
import type { CalendarEventDTO, LeaveType } from '../types';

export const TeamCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEventDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<{id: string; username: string; fullName?: string}[]>([]); 

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [leaveForm, setLeaveForm] = useState({ userId: '', type: 'FERIAS' as LeaveType, days: 1, reason: '' });

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  // --- API ---
  const apiCall = async (url: string, method: string = 'GET', body?: unknown) => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"}/api${url}`, {
          method,
          headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}` 
          },
          body: body ? JSON.stringify(body) : undefined
      });
      return res.json();
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
        const [evtRes, usrRes] = await Promise.all([
            apiCall(`/calendar/events?month=${month}&year=${year}`), // Assuming this endpoint exists or mock it
            apiCall('/v2/iam/users')
        ]);

        if (evtRes.success) setEvents(evtRes.data);
        else {
            // Mock empty if fails (Backend might lack this specific endpoint right now)
            setEvents([]); 
        }

        if (usrRes.success) setUsers(usrRes.data);

    } catch (e) {
        console.error("Calendar load error", e);
    } finally {
        setIsLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    loadData();
  }, [loadData]); // Reload when month/year changes

  // Calendar Grid Logic
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun

  const days = [];
  // Padding
  for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
  // Real Days
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDay(dateStr);
    setIsModalOpen(true);
  };

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDay || !leaveForm.userId) return;

    const startDate = new Date(selectedDay);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (leaveForm.days - 1));

    try {
      await apiCall('/hr/leaves', 'POST', {
        userId: leaveForm.userId,
        type: leaveForm.type,
        startDate: selectedDay,
        endDate: endDate.toISOString().split('T')[0],
        reason: leaveForm.reason
      });
      setIsModalOpen(false);
      loadData(); // Refresh
    } catch (err) {
      console.error(err);
      alert("Erro ao registrar ausência.");
    }
  };

  if (isLoading && events.length === 0 && users.length === 0) return <div className="p-8 text-center text-slate-400">Carregando calendário...</div>;

  return (
    <div className="bg-white/60 dark:bg-slate-900/50 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col h-full overflow-hidden backdrop-blur-xl">
      {/* Header */}
      <div className="p-5 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 bg-white/40 dark:bg-transparent">
        <h3 className="font-semibold text-lg text-slate-800 dark:text-white capitalize tracking-tight flex items-center gap-2">
           <CalendarPlus className="w-5 h-5 text-purple-500" />
          {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
        </h3>
        <div className="flex gap-1.5">
          <button onClick={prevMonth} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-500 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 shadow-sm"><ChevronLeft size={18} /></button>
          <button onClick={nextMonth} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-500 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 shadow-sm"><ChevronRight size={18} /></button>
        </div>
      </div>

      {/* Grid Header */}
      <div className="grid grid-cols-7 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50">
        {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'].map(d => (
          <div key={d} className="py-2 text-center text-xs font-bold text-slate-400">{d}</div>
        ))}
      </div>

      {/* Grid Body */}
      <div className="grid grid-cols-7 auto-rows-[minmax(110px,1fr)] flex-1 bg-slate-200/50 dark:bg-slate-800/50 gap-px border-b border-slate-200/80 dark:border-slate-800">
        {days.map((day, idx) => {
          if (!day) return <div key={idx} className="bg-slate-50/50 dark:bg-slate-950/30" />;

          const dayEvents = getEventsForDay(day);
          const isToday =
            day === new Date().getDate() &&
            month === new Date().getMonth() &&
            year === new Date().getFullYear();

          return (
            <div
              key={idx}
              onClick={() => handleDayClick(day)}
              className={`bg-white dark:bg-slate-900/80 p-2.5 hover:bg-purple-50/30 dark:hover:bg-slate-800 transition-colors cursor-pointer group relative`}
            >
              <div className={`text-[13px] font-semibold mb-1.5 ${isToday ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white w-6 h-6 rounded-md flex items-center justify-center shadow-md shadow-purple-500/20' : 'text-slate-500'}`}>
                {day}
              </div>

              <div className="space-y-1.5">
                {dayEvents.map((ev, eIdx) => (
                  <div key={eIdx} className={`text-[11px] font-medium px-2 py-1 rounded-[6px] flex items-center gap-1.5 truncate border shadow-sm ${ev.type === 'BIRTHDAY' ? 'bg-pink-50/80 dark:bg-pink-900/20 text-pink-600 border-pink-200/60 dark:border-pink-800/40' :
                    ev.type === 'FERIAS' ? 'bg-teal-50/80 dark:bg-teal-900/20 text-teal-600 border-teal-200/60 dark:border-teal-800/40' :
                      ev.type === 'FOLGA' ? 'bg-orange-50/80 dark:bg-orange-900/20 text-orange-600 border-orange-200/60 dark:border-orange-800/40' :
                        'bg-slate-50/80 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200/60 dark:border-slate-700/50'
                    }`} title={ev.userFullName}>
                    {ev.type === 'BIRTHDAY' && <Cake size={11} />}
                    {ev.type === 'FERIAS' && <Plane size={11} />}
                    {ev.type === 'ATESTADO' && <Stethoscope size={11} />}
                    {ev.type === 'FOLGA' && <Coffee size={11} />}
                    <span className="truncate">{ev.userFullName.split(' ')[0]}</span>
                  </div>
                ))}
              </div>

              {/* Add Button on Hover */}
              <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0">
                <div className="w-6 h-6 rounded-md bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 shadow-sm flex items-center justify-center text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                  <Plus size={14} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Leave Registration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-slate-200/80 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white tracking-tight">Registrar Ausência</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
               >
                 <X size={18} />
               </button>
            </div>

            <form onSubmit={handleLeaveSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Data Início</label>
                <div className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-[14px] dark:text-slate-200 font-medium">{selectedDay.split('-').reverse().join('/')}</div>
              </div>

              <FormSelect
                label="Colaborador"
                value={leaveForm.userId}
                onChange={e => setLeaveForm({ ...leaveForm, userId: e.target.value })}
                required
              >
                <option value="" className="dark:bg-slate-900">Selecione o membro...</option>
                {users.map(u => (
                  <option key={u.id} value={u.id} className="dark:bg-slate-900">{u.fullName || u.username}</option>
                ))}
              </FormSelect>

              <FormSelect
                label="Tipo de Ausência"
                value={leaveForm.type}
                onChange={e => setLeaveForm({ ...leaveForm, type: e.target.value as LeaveType })}
              >
                <option value="FERIAS" className="dark:bg-slate-900">✈️ Férias</option>
                <option value="FOLGA" className="dark:bg-slate-900">☕ Folga / Banco de Horas</option>
                <option value="ATESTADO" className="dark:bg-slate-900">⚕️ Atestado Médico</option>
                <option value="LICENCA" className="dark:bg-slate-900">📄 Licença (Outros)</option>
              </FormSelect>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Motivo Detalhado</label>
                <input
                  type="text"
                  value={leaveForm.reason}
                  onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 dark:text-white text-[14px] focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all placeholder:text-slate-400"
                  placeholder="Ex: Férias acumuladas 2024..."
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Duração (Dias Corridos)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={leaveForm.days}
                  onChange={e => setLeaveForm({ ...leaveForm, days: parseInt(e.target.value) })}
                  className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 dark:text-white text-[14px] focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                />
              </div>

              <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-lg font-semibold text-[14px] mt-6 shadow-md shadow-purple-500/20 transition-all active:scale-[0.98]">
                Confirmar Registro
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
