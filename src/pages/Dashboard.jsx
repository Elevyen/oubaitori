import { useContext, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { createEntry, fetchEntriesByMonth } from "../api/entries"
import personaje from "../assets/personaje.png"
import CalendarView from "../components/CalendarView"
import RegistroEmocional from "../components/RegistroEmocional"
import Card from "../components/ui/Card.jsx"
import { AuthContext } from "../context/AuthContext"
import "../styles/dashboard.css"

export default function Dashboard() {
    const { user, setUser } = useContext(AuthContext) || {}
    const nombreUsuario = user?.nombre || "Usuario/a"
    const emailUsuario = user?.email || null

    const navigate = useNavigate();

    const [entradas, setEntradas] = useState([])
    const [mesSeleccionado, setMesSeleccionado] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });

    const [modalRegistro, setmodalRegistro] = useState(false)
    const [fechaSeleccionada, setFechaSeleccionada] = useState(null)
    const [mensajeGuia, setMensajeGuia] = useState("Me alegra verte por aquí.")
    const [cargando, setCargando] = useState(false)
    const [flagBuscarAyuda, setFlagPeligroIntensidad] = useState(false)

    useEffect(() => {
        let mounted = true;
        setCargando(true);

        (async () => {
            try {
                const res = await fetchEntriesByMonth(mesSeleccionado);

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
                    if (mounted) setEntradas(Array.isArray(data) ? data : []);
                } else {
                    if (mounted) setEntradas(Array.isArray(res) ? res : []);
                }
            } catch (err) {
                console.error('Error cargando entradas por mes:', err);
            } finally {
                if (mounted) setCargando(false);
            }
        })();

        return () => { mounted = false; };
    }, [mesSeleccionado]);

    const handleLogout = async (e) => {
        e.preventDefault();

        try {
            if (setUser) setUser(null);

            try {
                sessionStorage.removeItem("pendingUser");
                sessionStorage.removeItem("authToken");
            } catch (err) {
            }
            try {
                localStorage.removeItem("authToken");
            } catch (err) {
            }

            navigate("/", { replace: true });
        } catch (err) {
            try { sessionStorage.clear(); localStorage.clear(); } catch { }
            if (setUser) setUser(null);
            navigate("/", { replace: true });
        }
    };

    /**
     * contarRegistrosDelDia
     * Cuenta en el array 'entradas' cuántos registros hay para el día actual.
     * Intenta emparejar por email si las entradas devueltas por la API incluyen usuario.
     *
     * @param {string} fechaDDMMYYYY fecha en formato DD-MM-YYYY
     * @returns {number}
     */
    const contarRegistrosDelDia = (fechaDDMMYYYY) => {
        if (!fechaDDMMYYYY) return 0;
        // Intentamos contar por email si las entradas contienen `usuario.email`.
        // Si no hay información de usuario en las entradas, se cuenta solo por fecha.
        return entradas.filter(e => {
            const mismaFecha = e.date === fechaDDMMYYYY || e.fecha === fechaDDMMYYYY || e.createdAt?.startsWith?.(fechaDDMMYYYY) || false;
            if (!mismaFecha) return false;
            // Si la entrada incluye usuario con email, compararlo
            const emailEnEntrada = e.usuario?.email || e.user?.email || e.email || null;
            if (emailEnEntrada && emailUsuario) {
                return String(emailEnEntrada).toLowerCase() === String(emailUsuario).toLowerCase();
            }
            // Si no hay email en la entrada, asumimos que la entrada pertenece al usuario actual
            return true;
        }).length;
    };

    const handleDayClick = (dateString) => {
        setFechaSeleccionada(dateString);
        setmodalRegistro(true);
    };

    /**
     * handleGuardarEntrada
     * - Aplica límite de 2 registros por día en frontend antes de enviar.
     * - Añade 'usuario: { nombre, email }' al payload.
     * - Llama a createEntry (API local) y refresca calendario.
     */
    const handleGuardarEntrada = async (payload) => {
        try {
            // Preparar payload enriquecido con usuario
            const payloadConUsuario = Object.assign({}, payload, {
                usuario: { nombre: user?.nombre || nombreUsuario, email: user?.email || emailUsuario }
            });

            // Comprobar límite localmente (2 registros por día)
            const fechaPayload = payload.date || payload.fecha || new Date().toISOString().slice(0, 10);
            const registrosHoy = contarRegistrosDelDia(fechaPayload);
            const LIMITE_DIARIO_REGISTRO = 2;

            if (registrosHoy >= LIMITE_DIARIO_REGISTRO) {
                // Avisamos de que ya se hicieron 2 registros
                alert(`Has alcanzado el límite de ${LIMITE_DIARIO_REGISTRO} registros para ${fechaPayload}.`);
                return;
            }

            // Guardar en MongoDB
            await createEntry(payloadConUsuario);

            // Refrescar el calendario
            const updated = await fetchEntriesByMonth(mesSeleccionado);
            setEntradas(updated);

            // Obtener respuesta de la IA en base a la emoción, la intensidad y la nota
            obtenerConsejoIA(payload.emotion, payload.intensity, payload.note);
        } catch (error) {
            console.error('Error guardando entrada:', error);
        }
    };

    /**
     * Ejemplo de llamada directa al endpoint /api/emociones (preparada y comentada).
     * Puedes pegar esto en lugar de createEntry si prefieres usar fetch directo.
     *
     * // const payloadConUsuario = {
     * //   usuario: { nombre: user?.nombre, email: user?.email },
     * //   date: payload.date,
     * //   emotion: payload.emotion,
     * //   intensity: payload.intensity,
     * //   tags: payload.tags,
     * //   note: payload.note,
     * //   selectedEmotions: payload.selectedEmotions,
     * //   emoji: payload.emoji,
     * //   meta: { origen: 'dashboard-v1' }
     * // };
     * //
     * // fetch('/api/emociones', {
     * //   method: 'POST',
     * //   headers: { 'Content-Type': 'application/json' },
     * //   body: JSON.stringify(payloadConUsuario)
     * // })
     * // .then(async r => {
     * //   if (r.status === 429) {
     * //     const body = await r.json();
     * //     alert('Has alcanzado el límite diario de registros.');
     * //     return;
     * //   }
     * //   return r.json();
     * // })
     * // .then(res => { console.log('Guardado en backend', res); })
     * // .catch(err => { console.error('Error guardando en backend', err); });
     */

    const obtenerConsejoIA = async (emocion, nivel, nota = '') => {
        setCargando(true);
        setFlagPeligroIntensidad(false);
        setMensajeGuia("Pensando...");
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emocion, intensidad: nivel, nota })
            });

            const data = await response.json();

            if (data && data.respuesta) {
                setMensajeGuia(data.respuesta);
            } else {
                setMensajeGuia("Estoy aquí para escucharte.");
            }

            if (data && data.flagSeekHelp) {
                setFlagPeligroIntensidad(true);
            }
        } catch (error) {
            setMensajeGuia("Parece que mi conexión se ha debilitado, pero sigo contigo.");
        } finally {
            setCargando(false);
        }
    };

    const dismissSeekHelp = () => {
        setFlagPeligroIntensidad(false);
    }

    const ultimaEntrada = entradas.length > 0 ? entradas[0] : null;

    return (
        <div className="page-layout">
            <main className="page-main-content">
                <div className="dashboard-container">
                    <aside className="sidebar">
                        <h2 className="sidebar-title">Oubaitori</h2>
                        <nav>
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
                                    <h1>Hola, {nombreUsuario}</h1>
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
                                            {entradas.length > 2 ? "Analizando patrones..." : "Sigue registrando para ver tendencias."}
                                        </p>
                                    </Card>
                                </section>
                                <section className="calendar-section section-margin">
                                    <div className="calendar-card">
                                        <h3>Calendario emocional</h3>
                                        <CalendarView
                                            month={mesSeleccionado}
                                            onDayClick={handleDayClick}
                                            entries={entradas}
                                        />
                                    </div>
                                </section>
                            </main>
                            <section className="right-panel">
                                <Card variant="profile-mini-card card" className="section-margin">
                                    <h4>Mi Perfil</h4>
                                    <p className="profile-name">{nombreUsuario}</p>
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
                                    {flagBuscarAyuda && (
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
                                        <h4>{cargando ? "Meditando..." : `¿Cómo va todo, ${nombreUsuario}?`}</h4>
                                        <p>{mensajeGuia}</p>
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
                open={modalRegistro}
                onClose={() => setmodalRegistro(false)}
                date={fechaSeleccionada}
                onSave={handleGuardarEntrada}
            />
        </div>
    )
}
