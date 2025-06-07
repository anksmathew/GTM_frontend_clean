import React from 'react';

interface CalendarEvent {
  id: string | number;
  title: string;
  date: string; // ISO date string
  type: 'campaign' | 'task';
  status?: string;
}

interface CalendarProps {
  events: CalendarEvent[];
}

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const statusColors: Record<string, string> = {
  'Planned': 'bg-blue-100 text-blue-800 border-blue-200',
  'In Progress': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Launched': 'bg-green-100 text-green-800 border-green-200',
  'Delayed': 'bg-red-100 text-red-800 border-red-200',
  'Done': 'bg-gray-200 text-gray-700 border-gray-300',
  'To-do': 'bg-gray-100 text-gray-700 border-gray-200',
  'task': 'bg-gray-100 text-gray-700 border-gray-200',
};

const statusIcons: Record<string, string> = {
  'Planned': '🗓️',
  'In Progress': '⏳',
  'Launched': '🚀',
  'Delayed': '⚠️',
  'Done': '✅',
  'To-do': '📋',
  'task': '✅',
};

const Calendar: React.FC<CalendarProps> = ({ events }) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = React.useState(today.getMonth());
  const [currentYear, setCurrentYear] = React.useState(today.getFullYear());
  const [popoverEvent, setPopoverEvent] = React.useState<CalendarEvent | null>(null);
  const [popoverPosition, setPopoverPosition] = React.useState<{ x: number; y: number } | null>(null);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfWeek = getFirstDayOfWeek(currentYear, currentMonth);

  // Map events by date for quick lookup
  const eventsByDate: Record<string, CalendarEvent[]> = {};
  events.forEach(event => {
    if (!eventsByDate[event.date]) eventsByDate[event.date] = [];
    eventsByDate[event.date].push(event);
  });

  // Popover close on click outside
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if ((e.target as HTMLElement).closest('.calendar-popover') === null) {
        setPopoverEvent(null);
        setPopoverPosition(null);
      }
    }
    if (popoverEvent) {
      window.addEventListener('mousedown', handleClick);
      return () => window.removeEventListener('mousedown', handleClick);
    }
  }, [popoverEvent]);

  // Generate calendar grid
  const calendarCells = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarCells.push(<div key={`empty-start-${i}`} className="bg-transparent" />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isToday =
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear();
    calendarCells.push(
      <div
        key={dateStr}
        className={`border border-gray-200 min-h-[90px] p-1 relative rounded-xl bg-white hover:bg-blue-50 transition group flex flex-col ${isToday ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`}
      >
        <div className={`text-xs font-bold absolute top-2 left-3 ${isToday ? 'text-blue-600' : 'text-gray-500'}`}>{day}</div>
        <div className="mt-6 flex flex-col gap-1">
          {(eventsByDate[dateStr] || []).map(ev => {
            const colorClass = ev.type === 'task'
              ? statusColors[ev.status || 'task']
              : statusColors[ev.status || 'Planned'] || 'bg-blue-100 text-blue-800 border-blue-200';
            const icon = ev.type === 'task'
              ? statusIcons[ev.status || 'task']
              : statusIcons[ev.status || 'Planned'] || '🗓️';
            return (
              <button
                key={ev.id}
                className={`text-xs rounded-lg px-2 py-1 font-semibold shadow-sm flex items-center gap-1 border w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-400 ${colorClass} group-hover:scale-[1.03] group-hover:shadow-md transition-transform duration-100`}
                title={ev.title}
                onClick={e => {
                  const rect = (e.target as HTMLElement).getBoundingClientRect();
                  setPopoverEvent(ev);
                  setPopoverPosition({ x: rect.left + rect.width / 2, y: rect.top });
                }}
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setPopoverEvent(ev);
                  }
                }}
              >
                <span className="mr-1">{icon}</span>
                <span className="truncate max-w-[90px]">{ev.title}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Fill the last row if needed
  const totalCells = firstDayOfWeek + daysInMonth;
  const trailingEmpty = (7 - (totalCells % 7)) % 7;
  for (let i = 0; i < trailingEmpty; i++) {
    calendarCells.push(<div key={`empty-end-${i}`} className="bg-transparent" />);
  }

  // Popover rendering
  const popover = popoverEvent && popoverPosition ? (
    <div
      className="calendar-popover fixed z-50 min-w-[260px] max-w-xs animate-fade-in"
      style={{ left: Math.max(16, popoverPosition.x - 130), top: popoverPosition.y - 10 }}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
    >
      <div className={`rounded-t-xl flex items-center gap-3 px-4 py-3 shadow-sm ${popoverEvent.type === 'campaign' ? 'bg-blue-100' : 'bg-gray-100'}`}>
        <div className={`rounded-full w-10 h-10 flex items-center justify-center text-2xl shadow ${popoverEvent.type === 'campaign' ? 'bg-blue-200 text-blue-700' : 'bg-gray-200 text-gray-700'}`}>
          {popoverEvent.type === 'task'
            ? statusIcons[popoverEvent.status || 'task']
            : statusIcons[popoverEvent.status || 'Planned'] || '🗓️'}
        </div>
        <div className="flex-1">
          <div className="font-extrabold text-lg text-[#181C2A] truncate" title={popoverEvent.title}>{popoverEvent.title}</div>
          {popoverEvent.status && (
            <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-semibold ${statusColors[popoverEvent.status] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>{popoverEvent.status}</span>
          )}
        </div>
        <button
          className="ml-2 text-gray-400 hover:text-blue-600 text-xl focus:outline-none"
          onClick={() => {
            setPopoverEvent(null);
            setPopoverPosition(null);
          }}
          aria-label="Close"
        >
          ×
        </button>
      </div>
      <div className="bg-white rounded-b-xl shadow-xl p-4">
        <div className="text-xs mb-2">
          <span className="font-semibold">Type:</span> {popoverEvent.type === 'campaign' ? 'Campaign' : 'Task'}
        </div>
        <div className="text-xs mb-2">
          <span className="font-semibold">Date:</span> {popoverEvent.date}
        </div>
        {popoverEvent && popoverEvent.type === 'campaign' && (
          <a
            href={`/products/${popoverEvent.id.toString().replace('campaign-', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center text-xs text-white bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded shadow btn btn-primary font-semibold mb-2 mt-2 transition"
          >
            Open Campaign Page
          </a>
        )}
      </div>
    </div>
  ) : null;

  return (
    <div className="w-full relative">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur flex items-center justify-between mb-4 px-2 py-3 rounded-t-lg shadow-sm">
        <button
          onClick={() => {
            if (currentMonth === 0) {
              setCurrentMonth(11);
              setCurrentYear(y => y - 1);
            } else {
              setCurrentMonth(m => m - 1);
            }
          }}
          className="px-3 py-1 rounded hover:bg-gray-100 text-lg font-bold"
          aria-label="Previous Month"
        >
          &lt;
        </button>
        <div className="font-semibold text-xl text-[#181C2A]">
          {monthNames[currentMonth]} {currentYear}
        </div>
        <button
          onClick={() => {
            if (currentMonth === 11) {
              setCurrentMonth(0);
              setCurrentYear(y => y + 1);
            } else {
              setCurrentMonth(m => m + 1);
            }
          }}
          className="px-3 py-1 rounded hover:bg-gray-100 text-lg font-bold"
          aria-label="Next Month"
        >
          &gt;
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2 bg-gray-50 rounded-t-lg">
        {daysOfWeek.map(d => (
          <div key={d} className="text-xs font-bold text-center text-gray-500 py-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 bg-gray-50 p-2 rounded-b-lg min-h-[600px]">
        {calendarCells}
      </div>
      <div className="flex gap-4 mt-6 items-center">
        <span className="text-xs font-semibold text-gray-500">Legend:</span>
        <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded border border-blue-200"><span>🚀</span>Campaign</span>
        <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded border border-green-200"><span>✅</span>Task</span>
        <span className="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded border border-yellow-200"><span>⏳</span>In Progress</span>
        <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-800 px-2 py-1 rounded border border-red-200"><span>⚠️</span>Delayed</span>
        <span className="inline-flex items-center gap-1 text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded border border-gray-300"><span>✅</span>Done</span>
        <span className="ml-auto text-xs text-gray-400">Today is highlighted</span>
      </div>
      {popover}
    </div>
  );
};

export default Calendar; 