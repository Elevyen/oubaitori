import "../styles/analisisEmocional.css";
import Card from "./ui/Card";

export default function AnalisisEmocional({
    open,
    onClose,
    analisisHistorial = []
}) {
    if (!open) return null;

    return (
        <div className="analisis-modal-overlay" onClick={onClose}>
            <div
                className="analisis-modal-container"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="analisis-modal-header">
                    <div>
                        <h2>Análisis semanales</h2>
                        <p>Resumen emocional de tus últimos registros</p>
                    </div>

                    <button
                        className="analisis-modal-close"
                        onClick={onClose}
                        type="button"
                    >
                        ✕
                    </button>
                </div>

                <div className="analisis-modal-content">
                    {analisisHistorial.length === 0 ? (
                        <Card className="analisis-empty-card">
                            <p>
                                Todavía no hay análisis disponibles.
                            </p>
                        </Card>
                    ) : (
                        analisisHistorial.map((item) => {
                            const resumen = item?.resumen || {};

                            return (
                                <Card
                                    key={item._id || item.fechaClave}
                                    className="analisis-item-card"
                                >
                                    <div className="analisis-item-top">
                                        <div>
                                            <h3>
                                                Semana de {item.fechaClave}
                                            </h3>

                                            <p className="analisis-meta">
                                                Estado general:
                                                <strong>
                                                    {" "}
                                                    {resumen.estadoGeneral || "Sin datos"}
                                                </strong>
                                            </p>
                                        </div>

                                        <div className="analisis-intensidad">
                                            <span>
                                                {resumen.intensidadMedia || 0}/10
                                            </span>
                                        </div>
                                    </div>

                                    {Array.isArray(resumen.emocionesDominantes) &&
                                        resumen.emocionesDominantes.length > 0 && (
                                            <div className="analisis-tags">
                                                {resumen.emocionesDominantes.map((emocion, index) => (
                                                    <span
                                                        key={`${emocion}-${index}`}
                                                        className="analisis-tag"
                                                    >
                                                        {emocion}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                    <div className="analisis-resumen">
                                        <p>
                                            {resumen.resumen ||
                                                "No hay resumen disponible."}
                                        </p>
                                    </div>

                                    {resumen.alerta?.mostrar && (
                                        <div className="analisis-alerta">
                                            <span>⚠️</span>

                                            <p>
                                                {resumen.alerta.mensaje}
                                            </p>
                                        </div>
                                    )}
                                </Card>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}