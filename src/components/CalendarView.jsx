import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../styles/calendar.css';
import { formatDate, todayDate } from '../utils/date';

export default function CalendarView({ month, onDayClick, entries = [] }) {

    // Mapea las entradas por fecha para que el calendario las encuentre rápido
    const summaryByDate = entries.reduce((acc, e) => {
        const key = formatDate(e.fecha || e.date || e.createdAt);

        if (key) {
            acc[key] = e;
        }

        return acc;
    }, {});

    // Identifica el día de hoy para resaltar
    const getTileClassName = ({ date, view }) => {
        if (view === 'month') {
            const dateStr = formatDate(date);
            const todayStr = todayDate();
            return dateStr === todayStr ? 'calendar-today' : null;
        }
    };

    function tileContent({ date, view }) {
        if (view !== 'month') return null;

        const key = formatDate(date);
        const entry = summaryByDate[key];

        if (!entry) return null;

        const emocionPrincipal =
            entry.emociones?.[0];

        return (
            <div className="calendar-tile">
                <div className="tile-emoji">{emocionPrincipal?.emoji || ""}</div>
                <div className="tile-intensity">{entry.intensidad || 0}/10</div>
                <div className="tile-color-bar" style={{backgroundColor:emocionPrincipal?.color || "#ccc"}}
                />
            </div>
        );
    }

    const formatShortWeekday = (locale, date) =>
        new Intl.DateTimeFormat('es-ES', { weekday: 'short' }).format(date);

    const formatMonthYear = (locale, date) =>
        new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(date);

    return (
        <div className="calendar-wrapper">
            <Calendar
                onClickDay={(d) => onDayClick(formatDate(d))}
                tileContent={tileContent}
                tileClassName={getTileClassName}
                locale="es-ES"
                formatShortWeekday={formatShortWeekday}
                formatMonthYear={formatMonthYear}
            />
        </div>
    )
}
