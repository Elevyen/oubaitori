import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../styles/calendar.css';

export default function CalendarView({ month, onDayClick, entries = [] }) {

    // Mapea las entradas por fecha para que el calendario las encuentre rápido
    const summaryByDate = entries.reduce((acc, e) => {
        acc[e.date] = e;
        return acc;
    }, {});

    const formatLocalISO = (d) => {
        const date = d instanceof Date ? d : new Date(d);
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    // Identifica el día de hoy para resaltar
    const getTileClassName = ({ date, view }) => {
        if (view === 'month') {
            const dateStr = formatLocalISO(date);
            const todayStr = formatLocalISO(new Date());
            return dateStr === todayStr ? 'calendar-today' : null;
        }
    };

    function tileContent({ date, view }) {
        if (view !== 'month') return null;

        const key = formatLocalISO(date);
        const entry = summaryByDate[key];

        if (!entry) return null;

        return (
            <div className="calendar-tile">
                <div className="tile-emoji">{entry.emoji}</div>
                <div className="tile-intensity">{entry.intensity}/10</div>
                <div className="tile-color-bar" style={{ backgroundColor: entry.color }}></div>
            </div>
        )
    }

    const formatShortWeekday = (locale, date) =>
        new Intl.DateTimeFormat('es-ES', { weekday: 'short' }).format(date);

    const formatMonthYear = (locale, date) =>
        new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(date);

    return (
        <div className="calendar-wrapper">
            <Calendar
                onClickDay={(d) => onDayClick(formatLocalISO(d))}
                tileContent={tileContent}
                tileClassName={getTileClassName}
                locale="es-ES"
                formatShortWeekday={formatShortWeekday}
                formatMonthYear={formatMonthYear}
            />
        </div>
    )
}
