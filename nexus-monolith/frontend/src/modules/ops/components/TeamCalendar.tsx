
import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Cake, Plane, Stethoscope, Coffee, CalendarPlus, X } from 'lucide-react';
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
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <h3 className="font-bold text-lg text-slate-800 dark:text-white capitalize">
          {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
        </h3>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400"><ChevronLeft /></button>
          <button onClick={nextMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400"><ChevronRight /></button>
        </div>
      </div>

      {/* Grid Header */}
      <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
        {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'].map(d => (
          <div key={d} className="py-2 text-center text-xs font-bold text-slate-400">{d}</div>
        ))}
      </div>

      {/* Grid Body */}
      <div className="grid grid-cols-7 auto-rows-fr flex-1 bg-slate-200 dark:bg-slate-800 gap-px border-b border-slate-200 dark:border-slate-800">
        {days.map((day, idx) => {
          if (!day) return <div key={idx} className="bg-white dark:bg-slate-950/50" />;

          const dayEvents = getEventsForDay(day);
          const isToday =
            day === new Date().getDate() &&
            month === new Date().getMonth() &&
            year === new Date().getFullYear();

          return (
            <div
              key={idx}
              onClick={() => handleDayClick(day)}
              className={`bg-white dark:bg-slate-900 min-h-[100px] p-2 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer group relative`}
            >
              <div className={`text-xs font-bold mb-1 ${isToday ? 'bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-slate-500'}`}>
                {day}
              </div>

              <div className="space-y-1">
                {dayEvents.map((ev, eIdx) => (
                  <div key={eIdx} className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 truncate border ${ev.type === 'BIRTHDAY' ? 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 border-pink-100 dark:border-pink-800' :
                    ev.type === 'FERIAS' ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 border-teal-100 dark:border-teal-800' :
                      ev.type === 'FOLGA' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 border-orange-100 dark:border-orange-800' :
                        'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                    }`} title={ev.userFullName}>
                    {ev.type === 'BIRTHDAY' && <Cake size={10} />}
                    {ev.type === 'FERIAS' && <Plane size={10} />}
                    {ev.type === 'ATESTADO' && <Stethoscope size={10} />}
                    {ev.type === 'FOLGA' && <Coffee size={10} />}
                    <span className="truncate">{ev.userFullName.split(' ')[0]}</span>
                  </div>
                ))}
              </div>

              {/* Add Button on Hover */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <CalendarPlus size={14} className="text-slate-300 hover:text-purple-500" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Leave Registration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-lg shadow-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 dark:text-white">Registrar Ausência</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-slate-400" /></button>
            </div>

            <form onSubmit={handleLeaveSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Data Início</label>
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded text-sm dark:text-white">{selectedDay}</div>
              </div>

              <FormSelect
                label="Colaborador"
                value={leaveForm.userId}
                onChange={e => setLeaveForm({ ...leaveForm, userId: e.target.value })}
                required
              >
                <option value="" className="dark:bg-slate-900">Selecione...</option>
                {users.map(u => (
                  <option key={u.id} value={u.id} className="dark:bg-slate-900">{u.fullName || u.username}</option>
                ))}
              </FormSelect>

              <FormSelect
                label="Tipo de Ausência"
                value={leaveForm.type}
                onChange={e => setLeaveForm({ ...leaveForm, type: e.target.value as LeaveType })}
              >
                <option value="FERIAS" className="dark:bg-slate-900">Férias</option>
                <option value="FOLGA" className="dark:bg-slate-900">Folga / Banco de Horas</option>
                <option value="ATESTADO" className="dark:bg-slate-900">Atestado Médico</option>
                <option value="LICENCA" className="dark:bg-slate-900">Licença (Maternidade/Outros)</option>
              </FormSelect>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Motivo</label>
                <input
                  type="text"
                  value={leaveForm.reason}
                  onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 dark:text-white"
                  placeholder="Ex: Férias, Médico..."
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Duração (Dias)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={leaveForm.days}
                  onChange={e => setLeaveForm({ ...leaveForm, days: parseInt(e.target.value) })}
                  className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 dark:text-white"
                />
              </div>

              <button type="submit" className="w-full bg-purple-600 text-white py-2 rounded font-bold text-sm hover:bg-purple-700 mt-2">
                Confirmar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
