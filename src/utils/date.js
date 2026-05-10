const TZ = 'Europe/Madrid';

// Detecta DD-MM-YYYY
function isDDMMYYYY(value) {
    return /^\d{2}-\d{2}-\d{4}$/.test(String(value || ''));
}

// Convierte DD-MM-YYYY a Date segura
function parseDDMMYYYY(value) {
    const [dd, mm, yyyy] = String(value).split('-');

    return new Date(
        Number(yyyy),
        Number(mm) - 1,
        Number(dd),
        12,
        0,
        0
    );
}

// Convierte cualquier valor a Date segura
function safeDate(value = new Date()) {

    if (value instanceof Date) {
        return value;
    }

    if (isDDMMYYYY(value)) {
        return parseDDMMYYYY(value);
    }

    return new Date(value);
}

// DD-MM-YYYY
export function formatDate(value = new Date()) {

    if (isDDMMYYYY(value)) {
        return value;
    }

    const date = safeDate(value);

    const parts = new Intl.DateTimeFormat('es-ES', {
        timeZone: TZ,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).formatToParts(date);

    const dd = parts.find(p => p.type === 'day').value;
    const mm = parts.find(p => p.type === 'month').value;
    const yyyy = parts.find(p => p.type === 'year').value;

    return `${dd}-${mm}-${yyyy}`;
}

// Hoy España DD-MM-YYYY
export function todayDate() {
    return formatDate();
}

// DD-MM-YYYY a Date
export function toDate(value) {

    if (!value) {
        return null;
    }

    if (value instanceof Date) {
        return value;
    }

    if (isDDMMYYYY(value)) {
        return parseDDMMYYYY(value);
    }

    return new Date(value);
}

// Comparar fechas
export function isSameDate(a, b) {
    return formatDate(a) === formatDate(b);
}

// Fecha futura
export function isFutureDate(value) {

    const input = toDate(value);
    const today = toDate(todayDate());

    if (!input || !today) {
        return false;
    }

    return input > today;
}

// Últimos 7 días
export function isWithinLast7Days(value) {

    const input = toDate(value);
    const today = toDate(todayDate());

    if (!input || !today) {
        return false;
    }

    const diff = today - input;

    const days = Math.floor(
        diff / (1000 * 60 * 60 * 24)
    );

    return days >= 0 && days <= 6;
}

// DD-MM-YYYY a YYYY-MM-DD
export function toISODate(value) {

    if (!isDDMMYYYY(value)) {
        value = formatDate(value);
    }

    const [dd, mm, yyyy] = value.split('-');

    return `${yyyy}-${mm}-${dd}`;
}

// Hora España HH:mm:ss
export function spainTime() {

    return new Intl.DateTimeFormat('sv-SE', {
        timeZone: TZ,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).format(new Date());
}

// Fecha hoy YYYY-MM-DD
export function todayISODate() {
    return toISODate(todayDate());
}

// Fecha y hora legible
export function formatDateTime(value = new Date()) {

    const date = safeDate(value);

    return new Intl.DateTimeFormat('es-ES', {
        timeZone: TZ,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).format(date);
}