import { useContext, useEffect, useState } from "react"
import Card from "src/components/ui/Card.jsx"
import { createEntry, fetchEntriesByMonth } from "../api/entries"
import personaje from "../assets/personaje.png"
import CalendarView from "../components/CalendarView"
import RegistroEmocional from "../components/RegistroEmocional"
import { AuthContext } from "../context/AuthContext"
import "../styles/Dashboard.css"

export default function Dashboard() {
    const { user, setUser } = useContext(AuthContext) || {}
    const nombre = user?.nombre || "Usuario/a"


    const [entries, setEntries] = useState([])
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });


    const [modalOpen, setModalOpen] = useState(false)
    const [selectedDate, setSelectedDate] = useState(null)
    const [mensajeRPG, setMensajeRPG] = useState("Me alegra verte por aquí.")
    const [cargando, setCargando] = useState(false)
    const [flagSeekHelp, setFlagSeekHelp] = useState(false)

    // Carga de entradas para el mes seleccionado
    useEffect(() => {
        let mounted = true;
        setCargando(true);

        (async () => {
            try {
                const res = await fetchEntriesByMonth(selectedMonth);

                // Si fetchEntriesByMonth devuelve un Response
                if (res && typeof res.json === 'function') {
                    if (!res.ok) {
                        const text = await res.text();
                        throw new Error(`Fetch failed ${res.status}: ${text.slice(0, 200)}`);
                    }
                    const contentType = res.headers.get('content-type') || '';
                    if (!contentType.includes('application/json')) {
                        const text = await res.text();
                        throw new Error(`Esperaba JSON pero el servidor devolvió: ${text.slice(0, 200)}`);
                    }
                    const data = await res.json();
                    if (mounted) setEntries(Array.isArray(data) ? data : []);
                } else {
                    // Si ya devuelve datos parseados
                    if (mounted) setEntries(Array.isArray(res) ? res : []);
                }
            } catch (err) {
                console.error('Error al cargar entradas:', err);
            } finally {
                if (mounted) setCargando(false);
            }
        })();

        return () => { mounted = false; };
    }, [selectedMonth]);

    const handleLogout = (e) => {
        e.preventDefault();
        if (setUser) setUser(null);
    };

    // --- MANEJO DE INTERACCIÓN ---
    const handleDayClick = (dateString) => {
        setSelectedDate(dateString);
        setModalOpen(true);
    };

    const handleSaveEntry = async (payload) => {
        try {
            // 1. Guardar en MongoDB
            await createEntry(payload);

            // 2. Refrescar el calendario inmediatamente
            const updated = await fetchEntriesByMonth(selectedMonth);
            setEntries(updated);

            // 3. Se obtiene respuesta de la IA en base a la emoción, la intensidad y la nota
            obtenerConsejoIA(payload.emotion, payload.intensity, payload.note);

        } catch (error) {
            console.error("Error al procesar el registro:", error);
        }
    };

    const obtenerConsejoIA = async (emocion, nivel, nota = '') => {
        setCargando(true);
        setFlagSeekHelp(false);
        setMensajeRPG("Pensando...");
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emocion, intensidad: nivel, nota })
            });

            const data = await response.json();

            if (data && data.respuesta) {
                setMensajeRPG(data.respuesta);
            } else {
                setMensajeRPG("Estoy aquí para escucharte.");
            }

            if (data && data.flagSeekHelp) {
                setFlagSeekHelp(true);
            }
        } catch (error) {
            setMensajeRPG("Parece que mi conexión se ha debilitado, pero sigo contigo.");
        } finally {
            setCargando(false);
        }
    };

    const dismissSeekHelp = () => {
        setFlagSeekHelp(false);
    }

    // Obtener la última emoción registrada para las tarjetas de estado
    const ultimaEntrada = entries.length > 0 ? entries[0] : null;

    return (
        <div className="page-layout">
            <main className="page-main-content">
                <div className="dashboard-container">
                    <aside className="sidebar">
                        <h2 className="sidebar-title">Oubaitori</h2>
                        <nav>
                            <a href="/dashboard">Inicio</a>
                            <a href="/registro-emocion">Registrar emoción</a>
                            <a href="/dias">Días</a>
                            <a href="/mapa-emocional">Mapa emocional</a>
                            <a href="/recomendaciones">Recomendaciones</a>
                            <a href="/logros">Logros</a>
                            <a href="#" onClick={handleLogout} className="logout-link">Cerrar sesión</a>
                        </nav>
                    </aside>

                    <div className="main-layout-wrapper">
                        <div className="main-layout">
                            <main className="main-content">
                                <Card as="section" variant="greeting-card" className="section-margin">
                                    <h1>Hola, {nombre}</h1>
                                    <p>¿Listo/a para seguir avanzando a tu ritmo?</p>
                                </Card>

                                <section className="status-row-compact section-margin">
                                    <Card variant="status-card-compact">
                                        <h3>Última emoción</h3>
                                        <p className="status-emotion">
                                            {ultimaEntrada ? `${ultimaEntrada.emotion} ${ultimaEntrada.emoji}` : "Sin registros"}
                                        </p>
                                        <p className="status-detail">
                                            {ultimaEntrada ? `${ultimaEntrada.intensity}/10 · ${ultimaEntrada.date}` : "Empieza registrando hoy."}
                                        </p>
                                    </Card>
                                    <Card variant="status-card-compact">
                                        <h3>Tendencia de la semana</h3>
                                        <p className="status-detail">
                                            {entries.length > 2 ? "Analizando patrones..." : "Sigue registrando para ver tendencias."}
                                        </p>
                                    </Card>
                                </section>

                                <section className="calendar-section section-margin">
                                    <div className="calendar-card">
                                        <h3>Calendario emocional</h3>
                                        <CalendarView
                                            month={selectedMonth}
                                            onDayClick={handleDayClick}
                                            entries={entries}
                                        />
                                    </div>
                                </section>
                            </main>

                            <section className="right-panel">
                                <Card variant="profile-mini-card card" className="section-margin">
                                    <h4>Mi Perfil</h4>
                                    <p className="profile-name">{nombre}</p>
                                    <a href="/perfil" className="edit-link">Ver detalles</a>
                                </Card>

                                <Card variant="recommendation-box card" className="section-margin">
                                    <h4>Recomendación</h4>
                                    <p>Tómate 2 minutos para respirar profundamente.</p>
                                </Card>
                            </section>
                        </div>

                        <div className="rpg-ui-layer">
                            <div className="rpg-dialogue-wrapper">
                                <div className="rpg-character-container">
                                    <img src={personaje} alt="Personaje" className="rpg-character-img" />
                                </div>
                                <div className="dialogue-name-tag"><span>Guía</span></div>
                                <div className="dialogue-box">
                                    {flagSeekHelp && (
                                        <div className="risk-alert" style={{
                                            width: '100%', marginBottom: '12px', padding: '10px',
                                            borderRadius: '12px', background: '#fff1f0', border: '1px solid #ffa39e',
                                            color: '#cf1322', display: 'flex', justifyContent: 'space-between'
                                        }}>
                                            <span>Si te sientes abrumado/a, busca apoyo profesional.</span>
                                            <button onClick={dismissSeekHelp} style={{ border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
                                        </div>
                                    )}

                                    <div className="dialogue-text-content">
                                        <h4>{cargando ? "Meditando..." : `¿Cómo va todo, ${nombre}?`}</h4>
                                        <p>{mensajeRPG}</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            className="rpg-button"
                                            onClick={() => handleDayClick(new Date().toISOString().slice(0, 10))}
                                        >
                                            Registrar hoy
                                        </button>
                                        <button
                                            className="rpg-button"
                                            onClick={() => obtenerConsejoIA(ultimaEntrada?.emotion || "Calma", ultimaEntrada?.intensity || 5)}
                                            disabled={cargando || !ultimaEntrada}
                                        >
                                            {cargando ? "..." : "Pedir consejo"}
                                        </button>
                                    </div>
                                    <div className="dialogue-next-icon">▼</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* MODAL DE REGISTRO */}
            <RegistroEmocional
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                date={selectedDate}
                onSave={handleSaveEntry}
            />
        </div>
    )
}
