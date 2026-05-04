import { useNavigate } from 'react-router-dom';
import pdfDocument from '../assets/guia-oubaitori.pdf';
import '../styles/guiausuario.css';

export default function GuiaUsuario({ apiBase = '', token = null, user = null }) {
    const navigate = useNavigate();

    const handleBackToRoot = () => {
        navigate('/', { replace: true });
    };

    return (
        <section className="guia-page">
            <div className="guia-inner">
                <header className="guia-header">
                    <h1>Guía de Usuario</h1>
                </header>

                <div className="guia-content">
                    <div className="pdf-wrapper" role="region" aria-label="Visor de PDF">
                        <iframe
                            src={pdfDocument}
                            title="Guía de Usuario"
                            aria-label="Visor de PDF de la Guía de Usuario"
                            className="pdf-iframe"
                        />
                    </div>

                    <div className="pdf-fallback">
                        <p>Si el visor no carga en tu navegador, puedes descargar el PDF:</p>
                        <a
                            href={pdfDocument}
                            target="_blank"
                            rel="noopener noreferrer"
                            download="Guia-Oubaitori.pdf"
                            className="btn-download"
                        >
                            Descargar Guía de Usuario
                        </a>
                    </div>
                </div>

                <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
                    <button
                        type="button"
                        className="oubaitori-btn oubaitori-btn--secondary"
                        onClick={handleBackToRoot}
                        aria-label="Regresar al inicio"
                    >
                        Regresar al login
                    </button>
                </div>
            </div>
        </section>
    );
}
