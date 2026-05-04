// src/pages/Contacto.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import "../styles/contacto.css";
/**
 * Resolución segura de la base de la API:
 * - Prioriza VITE_LOCAL_BACKEND si está definida en tiempo de build.
 * - Luego window.API_BASE si la app la inyecta en runtime.
 * - Finalmente fallback a http://127.0.0.1:4000 para desarrollo local.
 */
const envApi = import.meta?.env?.VITE_LOCAL_BACKEND || import.meta?.env?.VITE_RENDER_BACKEND || '';
const defaultApiBase = envApi || window?.API_BASE || 'http://127.0.0.1:4000';

export default function ContactoPage({ apiBase = defaultApiBase, token = null, user = null }) {
  const navigate = useNavigate();

  // Estado del formulario
  const [tipo, setTipo] = useState('sugerencia');
  const [email, setEmail] = useState(user?.email || '');
  const [titulo, setTitulo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // { ok: boolean, msg: string }
  const [submitted, setSubmitted] = useState(false);
  const [savedEmail, setSavedEmail] = useState(null);

  useEffect(() => {
    if (user && user.email) setEmail(String(user.email));
  }, [user]);

  useEffect(() => {
    document.title = 'Contacto';
  }, []);

  const resetForm = () => {
    setTipo('sugerencia');
    setEmail(user?.email || '');
    setTitulo('');
    setMensaje('');
    setStatus(null);
  };

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  function isValidEmail(e) {
    return typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);

    if (!isValidEmail(email)) {
      setStatus({ ok: false, msg: 'Introduce un correo electrónico válido.' });
      return;
    }
    if (!titulo.trim()) {
      setStatus({ ok: false, msg: 'El título es obligatorio.' });
      return;
    }
    if (!mensaje.trim() || mensaje.trim().length < 10) {
      setStatus({ ok: false, msg: 'El mensaje debe tener al menos 10 caracteres.' });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        tipo,
        email: String(email).trim(),
        titulo: titulo.trim(),
        mensaje: mensaje.trim()
      };

      const base = apiBase || defaultApiBase;
      const res = await fetch(`${base.replace(/\/$/, '')}/api/contacto`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus({ ok: false, msg: json?.message || `Error servidor (${res.status})` });
        setLoading(false);
        return;
      }

      setSubmitted(true);
      setSavedEmail(json?.email || payload.email);
      setStatus({ ok: true, msg: 'Mensaje enviado. Te responderemos al correo proporcionado.' });
      resetForm();
    } catch (err) {
      console.error('Contacto submit error:', err);
      setStatus({ ok: false, msg: 'Error de red al enviar el mensaje.' });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <main aria-labelledby="contacto-title" className="contacto-page">
        <h1 id="contacto-title">Contacto</h1>

        <Card className="contacto-card" as="section" role="status" aria-live="polite">
          <p className="status-success" style={{ fontWeight: 600 }}>{status?.msg || 'Enviado'}</p>
          {savedEmail && <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.7)' }}>Te contactaremos en: <strong>{savedEmail}</strong></p>}

          <div style={{ marginTop: 18, display: 'flex', gap: 8 }}>
            <button className="btn-secondary" onClick={goBack} style={{ padding: '8px 16px' }}>
              Volver a la página anterior
            </button>

            <button
              className="btn-secondary"
              onClick={() => { setSubmitted(false); setStatus(null); setSavedEmail(null); }}
              style={{ padding: '8px 16px' }}
            >
              Enviar otro mensaje
            </button>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main aria-labelledby="contacto-title" className="contacto-page">
      <h1 id="contacto-title">Contacto</h1>
      <Card as="form" className="contacto-card" onSubmit={handleSubmit} aria-describedby="contacto-desc" noValidate>
        <fieldset style={{ border: 'none', padding: 0 }}>
          <legend className="sr-only">Tipo de mensaje</legend>
          <div role="radiogroup" aria-label="Tipo de mensaje" style={{ display: 'flex', gap: 12 }}>
            <label>
              <input
                type="radio"
                name="tipo"
                value="sugerencia"
                checked={tipo === 'sugerencia'}
                onChange={() => setTipo('sugerencia')}
              />{' '}
              Sugerencia
            </label>
            <label>
              <input
                type="radio"
                name="tipo"
                value="incidencia"
                checked={tipo === 'incidencia'}
                onChange={() => setTipo('incidencia')}
              />{' '}
              Incidencia
            </label>
          </div>
        </fieldset>

        <div style={{ marginTop: 12 }}>
          <label htmlFor="contacto-email">Correo electrónico</label>
          <input
            id="contacto-email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-required="true"
            placeholder="tu@correo.com"
            className="contacto-input"
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <label htmlFor="contacto-titulo">Título</label>
          <input
            id="contacto-titulo"
            name="titulo"
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
            aria-required="true"
            maxLength={200}
            className="contacto-input"
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <label htmlFor="contacto-mensaje">Mensaje</label>
          <textarea
            id="contacto-mensaje"
            name="mensaje"
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            required
            aria-required="true"
            rows={8}
            className="contacto-textarea"
          />
        </div>

        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button
            type="submit"
            disabled={loading}
            aria-disabled={loading}
            className="btn-primary"
            style={{ padding: '8px 16px' }}
          >
            {loading ? 'Enviando…' : 'Enviar'}
          </button>

          <button
            type="button"
            onClick={goBack}
            className="btn-secondary"
            style={{ padding: '8px 16px' }}
          >
            Volver
          </button>

          <button
            type="button"
            onClick={() => { resetForm(); }}
            disabled={loading}
            aria-disabled={loading}
            className="btn-secondary"
            style={{ padding: '8px 16px' }}
          >
            Limpiar
          </button>
        </div>

        {status && (
          <div role="status" aria-live="polite" style={{ marginTop: 12 }} className={status.ok ? 'status-success' : 'status-error'}>
            {status.msg}
          </div>
        )}
      </Card>
    </main>
  );
}
