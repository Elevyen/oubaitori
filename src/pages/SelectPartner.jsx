import { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/select-partner.css";

const API_BASE =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    (import.meta.env.VITE_LOCAL_BACKEND ||
      import.meta.env.VITE_RENDER_BACKEND)) ||
  "";

export default function SelectPartner({ selectedId = null, onSelect = () => { } }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setUser } = useContext(AuthContext);

  const statePendingUser = location.state?.pendingUser ?? null;
  const statePendingToken = location.state?.pendingToken ?? null;

  // Intenta recuperar pendingUser y pendingToken del registro de usuario
  let storedPendingUser = null;
  let storedPendingToken = null;
  if (typeof window !== "undefined") {
    try {
      const rawUser = sessionStorage.getItem("pendingUser");
      const rawToken = sessionStorage.getItem("pendingToken");
      if (rawUser) storedPendingUser = JSON.parse(rawUser);
      if (rawToken) storedPendingToken = rawToken;
    } catch (err) {
      storedPendingUser = null;
      storedPendingToken = null;
    }
  }

  const pendingUser = statePendingUser ?? storedPendingUser ?? null;
  const pendingToken = statePendingToken ?? storedPendingToken ?? null;

  useEffect(() => {
    // si venimos del registro guardamos pending en sessionStorage para poder continuar
    if (statePendingUser && typeof window !== "undefined") {
      try {
        const safePending = { ...statePendingUser };
        delete safePending.password;
        sessionStorage.setItem("pendingUser", JSON.stringify(safePending));
      } catch (err) { }
    }
    if (statePendingToken && typeof window !== "undefined") {
      try {
        sessionStorage.setItem("pendingToken", statePendingToken);
      } catch (err) { }
    }
  }, [statePendingUser, statePendingToken]);

  useEffect(() => {
    // si no hay pending y no hay usuario logueado, redirigimos al registro
    if (!pendingUser && !user) {
      navigate("/registro", { replace: true });
    }
  }, [pendingUser, user, navigate]);

  if (!pendingUser && !user) return null;

  const [partners, setPartners] = useState([]);
  const [tempSelected, setTempSelected] = useState(() => (selectedId ?? null));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedId != null) setTempSelected(selectedId);
  }, [selectedId]);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    const authToken = user?.token || localStorage.getItem("userToken") || null;

    async function loadPartners() {
      setLoading(true);
      setError("");
      try {
        const headers = {};
        if (authToken) headers.Authorization = `Bearer ${authToken}`;
        const res = await fetch(`${API_BASE}/api/partners`, { headers, signal: controller.signal });
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || `Error cargando partners (${res.status})`);
        }
        const json = await res.json();
        const list = Array.isArray(json.partners) ? json.partners : [];
        if (!mounted) return;
        setPartners(list);
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("loadPartners error", err);
        setError("No se pudieron cargar los personajes.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadPartners();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [user]);

  const findPartnerById = (id) => {
    if (!id) return null;
    return partners.find(p => String(p._id || p.key) === String(id) || String(p.key) === String(id));
  };

  const confirmSelection = async (rawId) => {
    if (!rawId) return;
    setError("");
    setSaving(true);

    try {
      onSelect(rawId);
    } catch (err) {
    }

    try {
      localStorage.setItem("selectedPartner", rawId);
    } catch (err) { }

    try {
      const raw = sessionStorage.getItem("pendingUser");
      let current = raw ? JSON.parse(raw) : (pendingUser ? { ...pendingUser } : {});
      if (current) {
        current.selectedPartner = rawId;
        sessionStorage.setItem("pendingUser", JSON.stringify(current));
      }
    } catch (err) { }

    // Si venimos del flujo de registro (pendingToken) llamamos a complete-registration
    const tokenFromSession = sessionStorage.getItem("pendingToken") || pendingToken;
    if (tokenFromSession) {
      try {
        const partner = findPartnerById(rawId) || { _id: rawId, nombre: "" };
        const personajePayload = { id: partner._id || partner.key || rawId, nombre: partner.nombre || "" };

        const res = await fetch(`${API_BASE}/api/usuarios/complete-registration`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pendingToken: tokenFromSession, personaje: personajePayload })
        });

        const text = await res.text();
        let data = {};
        try { data = JSON.parse(text); } catch (e) { /* no JSON */ }

        if (!res.ok) {
          console.error("complete-registration error:", res.status, text);
          setError(data.error || "No se pudo completar el registro.");
          setSaving(false);
          return;
        }

        const userToken = data.token;
        if (userToken) {
          // guardamos token de sesión y actualizamos contexto
          localStorage.setItem("userToken", userToken);
          const nuevoUsuario = {
            id: data.id,
            nombre: (pendingUser && pendingUser.nombre) || "",
            personaje: { id: personajePayload.id, nombre: personajePayload.nombre }
          };
          setUser && setUser(nuevoUsuario);
          try {
            sessionStorage.removeItem("pendingUser");
            sessionStorage.removeItem("pendingToken");
          } catch (err) { }
          setSaving(false);
          navigate("/dashboard", { replace: true });
          return;
        }

        setError("Respuesta inesperada del servidor.");
        setSaving(false);
        return;
      } catch (err) {
        console.error("Error en complete-registration:", err);
        setError("Error de red al completar el registro.");
        setSaving(false);
        return;
      }
    }

    // Si no hay pendingToken, es que el usuario ya está registrado y accede desde editar personaje de acompañamiento
    const authToken = user?.token || localStorage.getItem("userToken");
    if (authToken) {
      try {
        const partner = findPartnerById(rawId) || { _id: rawId, nombre: "" };
        const personajePayload = { id: partner._id || partner.key || rawId, nombre: partner.nombre || "" };

        const res = await fetch(`${API_BASE}/api/usuarios/usuario/personaje`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
          body: JSON.stringify({ personaje: personajePayload })
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error || "No se pudo guardar la selección en el servidor.");
          setSaving(false);
          return;
        }

        const updatedUser = { ...(user || {}), personaje: { id: personajePayload.id, nombre: personajePayload.nombre } };
        setUser && setUser(updatedUser);
        setSaving(false);
        navigate("/dashboard", { replace: true });
        return;
      } catch (err) {
        console.error("Error guardando personaje:", err);
        setError("Error de red al guardar personaje.");
        setSaving(false);
        return;
      }
    }

    // Si la ejecución llega hasta aquí, significa que no tenemos token ni usuario
    setError("No se pudo realizar el registro.");
    setSaving(false);
  };

  const handleCardClick = (id) => setTempSelected(id);
  const handleCardKeyDown = (ev, id) => {
    if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      setTempSelected(id);
    }
  };
  const handleBadgeClick = (ev, id) => { ev.stopPropagation(); confirmSelection(id); };
  const handleBadgeKeyDown = (ev, id) => {
    if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      ev.stopPropagation();
      confirmSelection(id);
    }
  };

  // Resuelve la ruta de la imagen
  const resolvePartnerImage = (p) => {
  const raw = p?.imagen || p?.image || "";
  if (!raw) return "";
  if (/^(https?:)?\/\//i.test(raw) || raw.startsWith('/')) return raw;
  try {
    // crea URL válida en tiempo de ejecución con Vite
    return new URL(`../assets/${raw}`, import.meta.url).href;
  } catch (e) {
    return `/assets/${raw}`;
  }
};

  return (
    <div className="select-partner-page">
      <header className="sp-header" role="banner" aria-label="Cabecera Oubaitori">
        <div className="sp-header-inner">
          <div className="sp-title">
            <div className="sp-title-main">Oubaitori</div>
            <div className="sp-title-sub">Selecciona tu compañero</div>
          </div>
          <div className="sp-user">
            <div className="sp-user-name">{(pendingUser && pendingUser.nombre) || user?.nombre || "Usuario"}</div>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="select-partner-loading">Cargando personajes…</div>
      ) : (
        <div className="select-partner-grid" role="list">
          {partners.map((p) => {
            const id = p._id || p.key;
            const isPreselected = String(tempSelected) === String(id);
            const pronombre = (p.meta && p.meta.pronombre) || p.pronombre || "—";
            const genero = (p.meta && p.meta.genero) || p.genero || "—";
            const gustos = (p.meta && Array.isArray(p.meta.gustos) ? p.meta.gustos : (p.gustos || []));

            return (
              <div key={String(id)} role="listitem" className={`select-partner-card-wrapper`}>
                <div
                  role="button"
                  tabIndex={0}
                  aria-pressed={isPreselected}
                  className={`select-partner-card ${isPreselected ? "selected" : ""}`}
                  onClick={() => handleCardClick(String(id))}
                  onKeyDown={(ev) => handleCardKeyDown(ev, String(id))}
                  title={`${p.nombre} — ${p.descripcion || ""}`}
                >
                  <div className="partner-media">
                    <img src={resolvePartnerImage(p)} alt={p.nombre} className="partner-image" />
                  </div>
                  <div className="partner-body">
                    <div className="partner-name">{p.nombre}</div>
                    <div className="partner-meta">
                      <span className="pronouns">{pronombre}</span>
                      <span className="gender">{genero}</span>
                    </div>
                    <div className="partner-desc">{p.descripcion}</div>
                    {gustos && gustos.length > 0 && (
                      <div className="partner-likes" aria-hidden>
                        <strong>Gustos:</strong> {gustos.join(", ")}
                      </div>
                    )}
                  </div>
                  <div className="partner-badge">
                    <button
                      type="button"
                      className={`partner-badge-button ${isPreselected ? "selected" : ""}`}
                      onClick={(ev) => handleBadgeClick(ev, String(id))}
                      onKeyDown={(ev) => handleBadgeKeyDown(ev, String(id))}
                      aria-label={isPreselected ? `Confirmar ${p.nombre} (seleccionado)` : `Seleccionar ${p.nombre}`}
                      disabled={saving}
                    >
                      {isPreselected ? (saving ? "GUARDANDO..." : "SELECCIONADO") : "SELECCIONAR"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {error && <div className="error" style={{ padding: 12 }}>{error}</div>}
    </div>
  );
}
