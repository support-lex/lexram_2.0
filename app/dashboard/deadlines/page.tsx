"use client";

import { useState, useEffect } from 'react';
import { 
  Calendar, ChevronLeft, ChevronRight, Plus, 
  Clock, AlertCircle, FileText, Building2, Filter,
  X, Calculator, Info, Search, Trash2
} from 'lucide-react';
import { getStoredData, setStoredData, STORAGE_KEYS } from '@/lib/storage';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  type: string;
  matterId?: string;
}

const getColorDot = (type: string) => {
  switch (type) {
    case 'Hearing': return 'bg-blue-500';
    case 'Filing Deadline': return 'bg-red-500';
    case 'Limitation Period': return 'bg-amber-500';
    case 'Client Meeting': return 'bg-green-500';
    default: return 'bg-[var(--text-muted)]';
  }
};

export default function DeadlinesPage() {
  const [view, setView] = useState('month');
  const [showCalculator, setShowCalculator] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [matters, setMatters] = useState<any[]>([]);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // Current month state using actual current date
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    title: '',
    date: '',
    time: '',
    type: 'Hearing',
    matterId: ''
  });

  // Limitation calculator state
  const [calcNature, setCalcNature] = useState('');
  const [calcDate, setCalcDate] = useState('');
  const [calcPeriod, setCalcPeriod] = useState('');
  const [calcResult, setCalcResult] = useState<string | null>(null);

  useEffect(() => {
    setEvents(getStoredData<Event[]>(STORAGE_KEYS.EVENTS, [
      { id: '1', title: 'File WS (CS 124/25)', date: '2026-03-02', time: '10:30', type: 'Filing Deadline' },
      { id: '2', title: 'Hearing (WP 892/24)', date: '2026-03-05', time: '14:00', type: 'Hearing' },
      { id: '3', title: 'Limitation - M/s Builders', date: '2026-03-08', time: '', type: 'Limitation Period' },
      { id: '4', title: 'Client Meeting', date: '2026-03-15', time: '11:00', type: 'Client Meeting' }
    ]));
    setMatters(getStoredData<any[]>(STORAGE_KEYS.MATTERS, []));
  }, []);

  const syncMatterNextDate = (matterId: string, allEvents: Event[]) => {
    if (!matterId) return;
    const matterEvents = allEvents.filter(e => e.matterId === matterId && e.type === 'Hearing');
    const today = new Date().toISOString().split('T')[0];
    const upcomingHearings = matterEvents.filter(e => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
    if (upcomingHearings.length > 0) {
      const storedMatters = getStoredData<any[]>(STORAGE_KEYS.MATTERS, []);
      const updated = storedMatters.map(m => m.id === matterId ? { ...m, nextDate: upcomingHearings[0].date } : m);
      setStoredData(STORAGE_KEYS.MATTERS, updated);
    }
  };

  const saveEvents = (newEvents: Event[]) => {
    setEvents(newEvents);
    setStoredData(STORAGE_KEYS.EVENTS, newEvents);
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date) return;

    if (editingEvent) {
      // Update existing event
      const updatedEvents = events.map(ev =>
        ev.id === editingEvent.id
          ? {
              ...ev,
              title: newEvent.title || ev.title,
              date: newEvent.date || ev.date,
              time: newEvent.time || ev.time,
              type: newEvent.type || ev.type,
              matterId: newEvent.matterId || ev.matterId
            }
          : ev
      );
      saveEvents(updatedEvents);
      if (newEvent.type === 'Hearing' && newEvent.matterId) {
        syncMatterNextDate(newEvent.matterId, updatedEvents);
      }
    } else {
      // Create new event
      const event: Event = {
        id: `EVT-${Date.now()}`,
        title: newEvent.title,
        date: newEvent.date,
        time: newEvent.time || '',
        type: newEvent.type || 'Hearing',
        matterId: newEvent.matterId
      };

      const updatedEvents = [...events, event];
      saveEvents(updatedEvents);
      if (newEvent.type === 'Hearing' && newEvent.matterId) {
        syncMatterNextDate(newEvent.matterId, updatedEvents);
      }
    }
    setShowEventModal(false);
    setEditingEvent(null);
    setNewEvent({ title: '', date: '', time: '', type: 'Hearing', matterId: '' });
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setNewEvent({
      title: event.title,
      date: event.date,
      time: event.time,
      type: event.type,
      matterId: event.matterId
    });
    setShowEventModal(true);
  };

  const handleCancelEdit = () => {
    setEditingEvent(null);
    setNewEvent({ title: '', date: '', time: '', type: 'Hearing', matterId: '' });
    setShowEventModal(false);
  };

  const handleDeleteEvent = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this event?')) {
      const deletedEvent = events.find(ev => ev.id === id);
      const updatedEvents = events.filter(ev => ev.id !== id);
      saveEvents(updatedEvents);
      if (deletedEvent?.type === 'Hearing' && deletedEvent.matterId) {
        syncMatterNextDate(deletedEvent.matterId, updatedEvents);
      }
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'Filing Deadline': return 'bg-red-500/10 ring-1 ring-red-500/20 text-red-600 hover:bg-red-500/15';
      case 'Hearing': return 'bg-blue-500/10 ring-1 ring-blue-500/20 text-blue-600 hover:bg-blue-500/15';
      case 'Limitation Period': return 'bg-amber-500/10 ring-1 ring-amber-500/20 text-amber-600 hover:bg-amber-500/15';
      default: return 'bg-[var(--bg-sidebar)]/5 ring-1 ring-[var(--bg-sidebar)]/10 text-[var(--text-primary)] hover:bg-[var(--bg-sidebar)]/10';
    }
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
  
  const calendarCells = Array.from({ length: 42 }).map((_, i) => {
    const date = i - firstDay + 1;
    const isCurrentMonth = date > 0 && date <= daysInMonth;
    const displayDate = date > 0 ? (date <= daysInMonth ? date : date - daysInMonth) : new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate() + date;
    
    const cellDateStr = isCurrentMonth 
      ? `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`
      : '';

    const dayEvents = events.filter(e => e.date === cellDateStr);

    return { date, isCurrentMonth, displayDate, cellDateStr, dayEvents };
  });

  const calculateDeadline = () => {
    if (!calcDate || !calcPeriod) return;
    const start = new Date(calcDate);
    const periodMap: Record<string, number> = {
      '30 Days': 30, '60 Days': 60, '90 Days': 90,
      '3 Years': 365 * 3, '12 Years': 365 * 12
    };
    const days = periodMap[calcPeriod] || 0;
    const deadline = new Date(start);
    deadline.setDate(deadline.getDate() + days);
    setCalcResult(deadline.toISOString().split('T')[0]);
  };

  const addCalculatedToCalendar = () => {
    if (!calcResult || !calcNature) return;
    const event: Event = {
      id: `EVT-${Date.now()}`,
      title: `Limitation: ${calcNature}`,
      date: calcResult,
      time: '',
      type: 'Limitation Period'
    };
    saveEvents([...events, event]);
    setShowCalculator(false);
    setCalcNature('');
    setCalcDate('');
    setCalcPeriod('');
    setCalcResult(null);
  };

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const goToday = () => setCurrentDate(new Date());

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-[var(--bg-primary)]">
      <div className="px-6 py-4 border-b border-[var(--border-default)] bg-[var(--bg-surface)] shrink-0 flex items-center justify-between shadow-[var(--shadow-card)] z-10">
        <div>
          <h1 className="font-sans text-2xl font-sans font-bold text-[var(--text-primary)]">Deadlines & Calendar</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Manage court dates, filings, and limitation periods.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowCalculator(true)}
            className="bg-[var(--bg-surface)] ring-1 ring-[var(--border-default)] text-[var(--text-primary)] px-4 py-2 rounded-xl text-sm font-bold hover:bg-[var(--surface-hover)] transition-colors flex items-center gap-2 shadow-[var(--shadow-card)]"
          >
            <Calculator className="w-4 h-4" /> Limitation Calculator
          </button>
          <button onClick={() => setShowEventModal(true)} className="bg-[var(--accent)] text-[var(--accent-text)] px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[var(--accent-hover)] transition-colors flex items-center gap-2 shadow-[var(--shadow-card)]">
            <Plus className="w-4 h-4" /> Add Deadline
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-[var(--bg-surface)] rounded-2xl ring-1 ring-[var(--border-default)] shadow-[var(--shadow-card)] overflow-hidden flex flex-col min-h-[700px]">
            {/* Calendar Header */}
            <div className="p-4 border-b border-[var(--border-default)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--surface-hover)]">
              <div className="flex items-center gap-4">
                <h2 className="font-sans text-xl font-bold text-[var(--text-primary)] w-48">
                  {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex items-center gap-1 bg-[var(--bg-surface)] ring-1 ring-[var(--border-default)] rounded-lg p-1 shadow-[var(--shadow-card)]">
                  <button onClick={prevMonth} className="p-1 hover:bg-[var(--surface-hover)] rounded text-[var(--text-secondary)] transition-colors active:scale-95"><ChevronLeft className="w-5 h-5" /></button>
                  <button onClick={goToday} className="px-3 py-1 text-sm font-bold text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded transition-colors">Today</button>
                  <button onClick={nextMonth} className="p-1 hover:bg-[var(--surface-hover)] rounded text-[var(--text-secondary)] transition-colors active:scale-95"><ChevronRight className="w-5 h-5" /></button>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-[var(--bg-surface)] ring-1 ring-[var(--border-default)] rounded-lg p-1 shadow-[var(--shadow-card)]">
                  <button 
                    onClick={() => setView('month')}
                    className={`px-4 py-1.5 rounded text-sm font-bold transition-colors ${view === 'month' ? 'bg-[var(--bg-sidebar)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'}`}
                  >
                    Month
                  </button>
                </div>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 grid grid-cols-7 grid-rows-[auto_repeat(6,1fr)] bg-[var(--border-default)] gap-px">
              {/* Days of week */}
              <div className="col-span-7 grid grid-cols-7 bg-[var(--bg-surface)] border-b border-[var(--border-default)]">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="py-3 text-center text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar Cells */}
              {calendarCells.map((cell, i) => {
                const isToday = cell.cellDateStr === new Date().toISOString().split('T')[0];

                return (
                  <div
                    key={i}
                    className={`bg-[var(--bg-surface)] p-2 min-h-[120px] transition-colors hover:bg-[var(--surface-hover)] ${!cell.isCurrentMonth ? 'bg-[var(--surface-hover)]/50 text-[var(--text-muted)]' : 'text-[var(--text-primary)]'} ${cell.isCurrentMonth ? 'cursor-pointer' : ''}`}
                    onClick={() => {
                      if (cell.isCurrentMonth) {
                        setNewEvent({ ...newEvent, date: cell.cellDateStr });
                        setShowEventModal(true);
                      }
                    }}
                  >
                    <div className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full mb-2 ${isToday ? 'bg-[var(--bg-sidebar)] text-white shadow-sm' : ''}`}>
                      {cell.displayDate}
                    </div>
                    
                    {/* Events */}
                    {cell.dayEvents.map(ev => (
                      <div key={ev.id} className={`${getEventColor(ev.type)} text-xs p-3 rounded mb-1.5 cursor-pointer shadow-[var(--shadow-card)] transition-all relative group hover:shadow-[var(--shadow-card-hover)]`} onClick={() => handleEditEvent(ev)}>
                        <div className="flex items-start gap-2">
                          <div className={`w-2 h-2 rounded-full ${getColorDot(ev.type)} shrink-0 mt-1`}></div>
                          <div className="flex-1 min-w-0">
                            {ev.time && <span className="font-bold">{ev.time}</span>} {ev.time && <span>-</span>} <span>{ev.title}</span>
                          </div>
                          <button
                            onClick={(e) => handleDeleteEvent(ev.id, e)}
                            className="p-0.5 hover:bg-black/10 rounded transition-opacity opacity-0 group-hover:opacity-100 shrink-0"
                            title="Delete event"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={editingEvent ? "Edit deadline or event" : "Add deadline or event"}>
          <div className="absolute inset-0 bg-[var(--bg-sidebar)]/40 backdrop-blur-sm" onClick={() => handleCancelEdit()} />
          <div className="relative bg-[var(--bg-surface)] rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onKeyDown={(e) => e.key === 'Escape' && handleCancelEdit()}>
            <div className="p-4 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--bg-sidebar)] text-white">
              <h3 className="font-sans font-bold">{editingEvent ? 'Edit Deadline / Event' : 'Add Deadline / Event'}</h3>
              <button onClick={() => handleCancelEdit()} className="hover:text-[var(--text-on-sidebar)]" aria-label="Close event modal"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Title *</label>
                <input required type="text" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className="w-full border border-[var(--border-default)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Date *</label>
                  <input required type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} className="w-full border border-[var(--border-default)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Time</label>
                  <input type="time" value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} className="w-full border border-[var(--border-default)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Event Type</label>
                <select value={newEvent.type} onChange={e => setNewEvent({...newEvent, type: e.target.value})} className="w-full border border-[var(--border-default)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50">
                  <option>Hearing</option>
                  <option>Filing Deadline</option>
                  <option>Limitation Period</option>
                  <option>Client Meeting</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Linked Matter</label>
                <select value={newEvent.matterId} onChange={e => setNewEvent({...newEvent, matterId: e.target.value})} className="w-full border border-[var(--border-default)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50">
                  <option value="">None</option>
                  {matters.map(m => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => handleCancelEdit()} className="px-4 py-2 text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] rounded-lg">{editingEvent ? 'Cancel Edit' : 'Cancel'}</button>
                <button type="submit" className="px-4 py-2 text-sm font-bold bg-[var(--bg-sidebar)] text-[var(--accent)] hover:bg-[var(--bg-sidebar-hover)] rounded-lg">{editingEvent ? 'Update Event' : 'Save Event'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Limitation Calculator Modal */}
      {showCalculator && (
        <div className="fixed inset-0 bg-[var(--bg-sidebar)]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-label="Limitation calculator">
          <div className="bg-[var(--bg-surface)] rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]" onKeyDown={(e) => e.key === 'Escape' && setShowCalculator(false)}>
            <div className="px-6 py-4 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--bg-sidebar)] text-white">
              <h2 className="font-sans text-lg font-sans font-bold flex items-center gap-2">
                <Calculator className="w-5 h-5 text-[var(--accent)]" /> Limitation Calculator
              </h2>
              <button
                onClick={() => setShowCalculator(false)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Close limitation calculator"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-[var(--bg-primary)]">
              <div className="space-y-6">
                
                <div className="bg-[var(--bg-surface)] p-5 rounded-xl ring-1 ring-[var(--border-default)] shadow-[var(--shadow-card)]">
                  <h3 className="font-sans font-sans text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-4">Calculate Deadline</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Nature of Suit/Appeal</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                        <input
                          type="text"
                          value={calcNature}
                          onChange={e => setCalcNature(e.target.value)}
                          placeholder="e.g., Suit for recovery of money, Appeal to High Court..."
                          className="w-full pl-9 pr-4 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] shadow-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Date of Cause of Action / Order</label>
                        <input
                          type="date"
                          value={calcDate}
                          onChange={e => { setCalcDate(e.target.value); calculateDeadline(); }}
                          className="w-full px-3 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] shadow-sm text-[var(--text-primary)]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Limitation Period</label>
                        <select
                          value={calcPeriod}
                          onChange={e => {
                            setCalcPeriod(e.target.value);
                            if (calcDate) {
                              const start = new Date(calcDate);
                              const periodMap: Record<string, number> = {
                                '30 Days': 30, '60 Days': 60, '90 Days': 90,
                                '3 Years': 365 * 3, '12 Years': 365 * 12
                              };
                              const days = periodMap[e.target.value] || 0;
                              const deadline = new Date(start);
                              deadline.setDate(deadline.getDate() + days);
                              setCalcResult(deadline.toISOString().split('T')[0]);
                            }
                          }}
                          className="w-full px-3 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] shadow-sm text-[var(--text-primary)] appearance-none"
                        >
                          <option>Select period...</option>
                          <option>30 Days</option>
                          <option>60 Days</option>
                          <option>90 Days</option>
                          <option>3 Years</option>
                          <option>12 Years</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <input type="checkbox" id="exclude" className="rounded text-[var(--accent)] focus:ring-[var(--accent)]" />
                      <label htmlFor="exclude" className="text-sm text-[var(--text-secondary)]">Exclude time taken for obtaining certified copy</label>
                    </div>
                  </div>
                </div>

                {/* Result Area */}
                {calcResult && (
                  <div className="bg-[var(--bg-sidebar)] rounded-xl p-6 text-white shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)] rounded-full blur-3xl opacity-20 -mr-10 -mt-10"></div>
                    <h3 className="font-sans font-sans text-xs font-bold text-[var(--accent)] uppercase tracking-wider mb-2 relative z-10">Calculated Deadline</h3>
                    <div className="text-3xl font-sans font-bold mb-2 relative z-10">{new Date(calcResult).toLocaleDateString('en-IN')}</div>
                    <div className="flex items-center gap-2 text-sm text-[var(--text-on-sidebar)] relative z-10">
                      <AlertCircle className="w-4 h-4" /> {Math.max(0, Math.ceil((new Date(calcResult).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} days remaining
                    </div>
                  </div>
                )}

                <div className="bg-[var(--accent)]/5 ring-1 ring-[var(--accent)]/20 rounded-xl p-4 flex items-start gap-3">
                  <Info className="w-5 h-5 text-[var(--accent)] shrink-0 mt-0.5" />
                  <div className="text-sm text-[var(--text-primary)] leading-relaxed">
                    <strong>Note:</strong> This calculation is based on the Limitation Act, 1963. Please verify if any special local laws or recent Supreme Court orders (e.g., suo motu extension of limitation) apply to your specific jurisdiction.
                  </div>
                </div>

              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-[var(--border-default)] bg-[var(--bg-surface)] flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setShowCalculator(false)}
                className="px-4 py-2 bg-[var(--bg-surface)] ring-1 ring-[var(--border-default)] text-[var(--text-secondary)] rounded-xl text-sm font-bold hover:bg-[var(--surface-hover)] transition-colors shadow-[var(--shadow-card)]"
              >
                Cancel
              </button>
              <button
                onClick={addCalculatedToCalendar}
                disabled={!calcResult || !calcNature}
                className="px-4 py-2 bg-[var(--accent)] text-[var(--accent-text)] rounded-xl text-sm font-bold hover:bg-[var(--accent-hover)] transition-colors shadow-[var(--shadow-card)] disabled:opacity-50"
              >
                Add to Calendar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
