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

const Calendar: React.FC<CalendarProps> = ({ events }) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = React.useState(today.getMonth());
  const [currentYear, setCurrentYear] = React.useState(today.getFullYear());

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfWeek = getFirstDayOfWeek(currentYear, currentMonth);

  // Map events by date for quick lookup
  const eventsByDate: Record<string, CalendarEvent[]> = {};
  events.forEach(event => {
    if (!eventsByDate[event.date]) eventsByDate[event.date] = [];
    eventsByDate[event.date].push(event);
  });

  // Generate calendar grid
  const calendarCells = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarCells.push(<div key={`empty-start-${i}`} className="bg-transparent" />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarCells.push(
      <div key={dateStr} className="border border-gray-200 min-h-[80px] p-1 relative rounded-lg bg-white hover:bg-gray-50 transition">
        <div className="text-xs text-gray-500 absolute top-1 left-2">{day}</div>
        <div className="mt-5 space-y-1">
          {(eventsByDate[dateStr] || []).map(ev => (
            <div key={ev.id} className={`text-xs rounded px-2 py-1 font-medium ${ev.type === 'campaign' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{ev.title}</div>
          ))}
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

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => {
          if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(y => y - 1);
          } else {
            setCurrentMonth(m => m - 1);
          }
        }} className="px-2 py-1 rounded hover:bg-gray-100">&lt;</button>
        <div className="font-semibold text-lg">{today.toLocaleString('default', { month: 'long' })} {currentYear}</div>
        <button onClick={() => {
          if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(y => y + 1);
          } else {
            setCurrentMonth(m => m + 1);
          }
        }} className="px-2 py-1 rounded hover:bg-gray-100">&gt;</button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {daysOfWeek.map(d => (
          <div key={d} className="text-xs font-bold text-center text-gray-500">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {calendarCells}
      </div>
    </div>
  );
};

export default Calendar; 