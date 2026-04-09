import { useContext } from "react"
import personaje from "../assets/personaje.png"
import Card from "../components/ui/Card"
import { AuthContext } from "../context/AuthContext"
import "../styles/dashboard.css"

export default function Dashboard() {
    const { user, setUser } = useContext(AuthContext) || {}
    const nombre = user?.nombre || "Explorador/a"

    const handleLogout = (e) => {
        e.preventDefault();
        if (setUser) setUser(null);
        // Aquí podrías añadir un window.location.href = "/" si no usas un router
    };

    return (
        <div className="page-layout">
            <main className="page-main-content">
                <div className="dashboard-container">
                    {/* Menú lateral */}
                    <aside className="sidebar">
                        <h2 className="sidebar-title">Oubaitori</h2>
                        <nav>
                            <a href="/dashboard">Inicio</a>
                            <a href="/registro-emocion">Registrar emoción</a>
                            <a href="/dias">Días</a>
                            <a href="/mapa-emocional">Mapa emocional</a>
                            <a href="/recomendaciones">Recomendaciones</a>
                            <a href="/logros">Logros</a>
                            {/* Cambio de Perfil por Cerrar Sesión con estilo especial */}
                            <a href="#" onClick={handleLogout} className="logout-link">Cerrar sesión</a>
                        </nav>
                    </aside>

                    {/* Contenedor de contenido + RPG */}
                    <div className="main-layout-wrapper">
                        <div className="main-layout">
                            <main className="main-content">
                                <Card as="section" variant="greeting-card" className="section-margin">
                                    <h1>Hola, {nombre}</h1>
                                    <p>¿Lista para seguir explorando tu mundo emocional hoy?</p>
                                </Card>

                                {/* FILA COMPACTA: Última emoción y Tendencia juntas */}
                                <section className="status-row-compact section-margin">
                                    <Card variant="status-card-compact">
                                        <h3>Última emoción</h3>
                                        <p className="status-emotion">Serenidad 🌿</p>
                                        <p className="status-detail">6/10 · Hace 2 horas</p>
                                    </Card>
                                    <Card variant="status-card-compact">
                                        <h3>Tendencia de la semana</h3>
                                        <p className="status-detail">Predominan emociones calmadas.</p>
                                    </Card>
                                </section>

                                <section className="calendar-section section-margin">
                                    <div className="calendar-card">
                                        <h3>Calendario emocional</h3>
                                        <div className="calendar-placeholder">[Calendario]</div>
                                    </div>
                                </section>
                            </main>

                            <section className="right-panel">
                                {/* Nueva caja de perfil encima de recomendación */}
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

                        {/* Capa RPG: Recuperada y vinculada a las clases del CSS completo */}
                        <div className="rpg-ui-layer">
                            <div className="rpg-dialogue-wrapper">
                                <div className="rpg-character-container">
                                    <img src={personaje} alt="Personaje" className="rpg-character-img" />
                                </div>
                                <div className="dialogue-name-tag"><span>{nombre}</span></div>
                                <div className="dialogue-box">
                                    <div className="dialogue-text-content">
                                        <h4>¿Cómo te sientes hoy?</h4>
                                        <p>Me alegra verte por aquí.</p>
                                    </div>
                                    <button className="rpg-button">Registrar emoción</button>
                                    <div className="dialogue-next-icon">▼</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
