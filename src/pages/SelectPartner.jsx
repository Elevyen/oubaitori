import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import personajeImg from "../assets/personaje.png";
import "../styles/select-partner.css";

// Array fijo de compañeros
const PARTNERS = [
  {
    id: "p1",
    nombre: "Violet",
    imagen: personajeImg,
    descripcion: "Tranquila, sabe escuchar.",
    gustos: ["café", "lectura"],
    genero: "mujer",
    pronombre: "ella"
  },
  {
    id: "p2",
    nombre: "Milo",
    imagen: personajeImg,
    descripcion: "Compañero enérgico y optimista.",
    gustos: ["música", "arte"],
    genero: "hombre",
    pronombre: "él"
  },
  {
    id: "p3",
    nombre: "Karen",
    imagen: personajeImg,
    descripcion: "Sincere y buena compañía.",
    gustos: ["videojuegos", "animales"],
    genero: "nobinario",
    pronombre: "elle"
  }
];

export default function SelectPartner({ selectedId = null, onSelect = () => {} }) {
  const location = useLocation();
  const navigate = useNavigate();

  const statePending = location.state?.pendingUser ?? null;

  let storedPending = null;
  if (typeof window !== "undefined") {
    try {
      const raw = sessionStorage.getItem("pendingUser");
      if (raw) storedPending = JSON.parse(raw);
    } catch (err) {
      storedPending = null;
    }
  }
  const pendingUser = statePending ?? storedPending ?? null;

  useEffect(() => {
    if (statePending && typeof window !== "undefined") {
      try {
        const safePending = { ...statePending };
        delete safePending.password;
        sessionStorage.setItem("pendingUser", JSON.stringify(safePending));
      } catch (err) {
      }
    }
  }, [statePending]);

  useEffect(() => {
    if (!pendingUser) {
      navigate("/registro", { replace: true });
    }
  }, [pendingUser, navigate]);

  if (!pendingUser) return null;

  const [localPartner] = useState(() => PARTNERS);

  const [tempSelected, setTempSelected] = useState(() => {
    return (selectedId !== null && selectedId !== undefined) ? selectedId : null;
  });

  useEffect(() => {
    if (selectedId !== null && selectedId !== undefined) {
      setTempSelected(selectedId);
    }
  }, [selectedId]);

  const confirmSelection = (id) => {
    if (!id) return;

    try {
      onSelect(id);
    } catch (err) {
    }

    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("selectedPartner", id);
      }
    } catch (err) {
    }

    try {
      if (typeof window !== "undefined") {
        const raw = sessionStorage.getItem("pendingUser");
        let current = raw ? JSON.parse(raw) : (pendingUser ? { ...pendingUser } : {});
        if (current) {
          current.selectedPartner = id;
          sessionStorage.setItem("pendingUser", JSON.stringify(current));
        }
      }
    } catch (err) {
    }

    navigate("/dashboard", { replace: true });
  };

  const handleCardClick = (id) => {
    setTempSelected(id);
  };

  const handleCardKeyDown = (ev, id) => {
    if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      setTempSelected(id);
    }
  };

  const handleBadgeClick = (ev, id) => {
    ev.stopPropagation();
    confirmSelection(id);
  };

  const handleBadgeKeyDown = (ev, id) => {
    if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      ev.stopPropagation();
      confirmSelection(id);
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
            <div className="sp-user-name">{pendingUser.nombre}</div>
          </div>
        </div>
      </header>

      <div className="select-partner-grid" role="list">
        {localPartner.map((c) => {
          const isPreselected = tempSelected === c.id;
          return (
            <div
              key={c.id}
              role="listitem"
              className={`select-partner-card-wrapper`}
            >
              <div
                role="button"
                tabIndex={0}
                aria-pressed={isPreselected}
                className={`select-partner-card ${isPreselected ? "selected" : ""}`}
                onClick={() => handleCardClick(c.id)}
                onKeyDown={(ev) => handleCardKeyDown(ev, c.id)}
                title={`${c.nombre} — ${c.descripcion || ""}`}
              >
                <div className="partner-media">
                  <img src={c.imagen} alt={c.nombre} className="partner-image" />
                </div>

                <div className="partner-body">
                  <div className="partner-name">{c.nombre}</div>

                  <div className="partner-meta">
                    <span className="pronouns">{c.pronombre ?? "—"}</span>
                    <span className="gender">{c.genero ?? "—"}</span>
                  </div>

                  <div className="partner-desc">{c.descripcion}</div>
                  {c.gustos && c.gustos.length > 0 && (
                    <div className="partner-likes" aria-hidden>
                      <strong>Gustos:</strong> {c.gustos.join(", ")}
                    </div>
                  )}
                </div>

                <div className="partner-badge" aria-hidden>
                  <button
                    type="button"
                    className={`partner-badge-button ${isPreselected ? "selected" : ""}`}
                    onClick={(ev) => handleBadgeClick(ev, c.id)}
                    onKeyDown={(ev) => handleBadgeKeyDown(ev, c.id)}
                    aria-label={isPreselected ? `Confirmar ${c.nombre} (seleccionado)` : `Seleccionar ${c.nombre}`}
                  >
                    {isPreselected ? "SELECCIONADO" : "SELECCIONAR"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
