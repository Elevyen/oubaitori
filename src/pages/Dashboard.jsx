import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchEntriesByMonth } from "../api/entries";
import CalendarView from "../components/CalendarView";
import RegistroEmocional from "../components/RegistroEmocional";
import Card from "../components/ui/Card.jsx";
import { AuthContext } from "../context/AuthContext";
import "../styles/dashboard.css";
import { formatDate, isWithinLast7Days, toDate, todayDate } from "../utils/date";

const RECOMENDACIONES = [
  "Recuerda hidratarte, toma un sorbo de agua.",
  "Si puedes, estírate un momento y respira hondo.",
  "Mira por la ventana unos segundos y descansa la vista.",
  "Puedes levántarte y caminar un par de minutos.",
  "Cierra los ojos y relaja los hombros durante unos segundos.",
  "Escribe una cosa por la que estés agradecido hoy.",
  "Haz varias respiraciones suaves y sostenidas en el tiempo.",
  "Si puedes, cambia de postura y alinea la espalda un momento.",
  "Toma un pequeño descanso y cambia de tarea por 5 minutos.",
  "Relaja la mandíbula para liberar tensión."
];

const API_BASE =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    (import.meta.env.VITE_LOCAL_BACKEND ||
      import.meta.env.VITE_RENDER_BACKEND)) ||
  "";

export default function Dashboard() {
  const { user, setUser } = useContext(AuthContext) || {};
  const navigate = useNavigate();
  const [recomendacion] = useState(() => getRecomendacionAleatoria());
  const storedUser = useMemo(() => {
    try {
      const raw = localStorage.getItem("userData");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);
  useEffect(() => {
    if (!user && storedUser && typeof setUser === "function") {
      setUser(storedUser);
    }
  }, [user, storedUser, setUser]);

  const nombreUsuario = user?.nombre || storedUser?.nombre || "Usuario/a";
  const emailUsuario = (user?.email || storedUser?.email || null);

  const [entradas, setEntradas] = useState([]);
  const [mesSeleccionado, setMesSeleccionado] = useState(() => {
    const d = new Date();
    return `${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`; // e.g. "05-2026"
  });
  const reconcileIntervalIdRef = useRef(null);
  const _lastFetchTimestamp = useRef(new Map()).current;
  const MIN_FETCH_INTERVAL_MS = 1000 * 900; // 15m
  const [modalRegistro, setmodalRegistro] = useState(false);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const [modalInitial, setModalInitial] = useState(null);
  const [mensajeGuia, setMensajeGuia] = useState("Me alegra verte por aquí.");
  const [cargando, setCargando] = useState(false);
  const [flagBuscarAyuda, setFlagPeligroIntensidad] = useState(false);

  const [partner, setPartner] = useState(null);
  const [partnerLoading, setPartnerLoading] = useState(false);
  const [analisis, setAnalisis] = useState(null);
  const [cargandoAnalisis, setCargandoAnalisis] = useState(false);

  const [existingForSelectedDate, setExistingForSelectedDate] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // ref para fechas en proceso de guardado (evita race conditions)
  const savingDatesRef = useRef(new Set());
  const [, setSavingTick] = useState(0);
  const markSavingDate = (fecha, adding = true) => {
    const s = savingDatesRef.current;
    if (adding) s.add(fecha);
    else s.delete(fecha);
    setSavingTick((t) => t + 1);
  };
  function getRecomendacionAleatoria() {
    const i = Math.floor(Math.random() * RECOMENDACIONES.length);
    return RECOMENDACIONES[i];
  }
  const resolvePartnerImage = (p) => {
    const raw = p?.imagen || p?.image || "";
    if (!raw) return "";
    if (/^(https?:)?\/\//i.test(raw) || raw.startsWith("/")) return raw;
    try {
      return new URL(`../assets/${raw}`, import.meta.url).href;
    } catch {
      return `/assets/${raw}`;
    }
  };

  // --- Búsqueda robusta del token ---
  const token =
    user?.token ||
    user?.authToken ||
    storedUser?.token ||
    storedUser?.authToken ||
    sessionStorage.getItem("authToken") ||
    localStorage.getItem("userToken") ||
    localStorage.getItem("token") ||
    null;

  // --- Caché local de entradas para persistir entre recargas (filtrada por usuario)
  const ENTRADAS_CACHE_KEY = "entradasCache_v1";

  // --- Utilidades defensivas para evitar ObjectId en cliente
  function ensureIdsAreStrings(obj) {
    if (!obj || typeof obj !== "object") return obj;
    const copy = { ...obj };
    if (copy._id !== undefined) {
      try {
        copy._id = copy._id && typeof copy._id.toString === "function" ? String(copy._id.toString()) : String(copy._id || "");
      } catch {
        copy._id = String(copy._id || "");
      }
    }
    if (copy.id !== undefined) copy.id = String(copy.id || "");
    if (copy.usuarioId !== undefined) copy.usuarioId = String(copy.usuarioId || "");
    if (copy.userId !== undefined) copy.userId = String(copy.userId || "");
    return copy;
  }

  function sanitizeArray(arr) {
    if (!Array.isArray(arr)) return [];
    return arr.map((x) => (x && typeof x === "object" ? ensureIdsAreStrings(x) : x));
  }

  function saveEntradasCache(arr, { userId = null, userEmail = null } = {}) {
    try {
      const normalized = (Array.isArray(arr) ? arr : []).map((r) => {
        const copy = { ...r };
        if (!copy.usuarioId && (copy.usuario || copy.user)) {
          copy.usuarioId = copy.usuario?._id || copy.user?._id || copy.usuario?.id || copy.user?.id || copy.usuarioId || null;
        }
        if (!copy.usuario && userEmail) {
          copy.usuario = copy.usuario || { email: userEmail };
        }
        if (!copy.usuarioId && userId) {
          copy.usuarioId = copy.usuarioId || userId;
        }
        return ensureIdsAreStrings(copy);
      });
      localStorage.setItem(ENTRADAS_CACHE_KEY, JSON.stringify(normalized));
    } catch (e) {
      console.warn("saveEntradasCache error", e);
    }
  }

  function loadEntradasCache({ userId = null, userEmail = null } = {}) {
    try {
      const raw = localStorage.getItem(ENTRADAS_CACHE_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      if (!userId && !userEmail) return arr;
      const uid = userId ? String(userId).trim() : null;
      const email = userEmail ? String(userEmail).toLowerCase().trim() : null;
      return (arr || []).filter((e) => {
        if (!e) return false;
        const entryUid = String(e.usuarioId || e.userId || e.usuario?._id || e.usuario?.id || e.user?._id || e.user?.id || e.idUsuario || "").trim();
        if (entryUid && uid && entryUid === uid) return true;
        const entryEmail = (e.usuario?.email || e.user?.email || e.email || "").toLowerCase().trim();
        if (entryEmail && email && entryEmail === email) return true;
        return false;
      }).map(ensureIdsAreStrings);
    } catch (e) {
      console.warn("loadEntradasCache error", e);
      return [];
    }
  }

  // --- Normalización y fetch single
  function normalizeRegistro(raw) {
    if (!raw || typeof raw !== "object") {
      return null;
    }

    // evitar raw anidados infinitos
    const base =
      raw.raw && typeof raw.raw === "object"
        ? raw.raw
        : raw;

    const safe = ensureIdsAreStrings(base);

    const id =
      safe._id ||
      safe.id ||
      safe.registroId ||
      null;

    const _id =
      safe._id ||
      (safe.id ? String(safe.id) : null);

    const fecha = formatDate(
      safe.fecha ||
      safe.date ||
      safe.createdAt ||
      null
    );

    const hora =
      safe.hora ||
      safe.time ||
      safe.createdAt ||
      null;

    const nota =
      safe.nota || null;

    // NORMALIZAR EMOCIONES BIEN
    const emocionesRaw = Array.isArray(safe.emociones)
      ? safe.emociones
      : Array.isArray(safe.emotions)
        ? safe.emotions
        : Array.isArray(safe.emotionList)
          ? safe.emotionList
          : [];

    const emociones = emocionesRaw
      .filter(Boolean)
      .map((e) => ({
        id: String(e.id || "").trim(),
        label: String(e.label || "").trim(),
        emoji: String(e.emoji || ""),
        color: String(e.color || ""),
        textColor: String(e.textColor || ""),
        tipo: e.tipo || "neutra",
      }))
      .filter((e) => e.id || e.label);

    const intensidad =
      safe.intensidad ??
      safe.intensity ??
      safe.int ??
      null;

    const etiquetas = Array.isArray(safe.etiquetas)
      ? safe.etiquetas
      : Array.isArray(safe.tags)
        ? safe.tags
        : [];

    const usuarioId =
      safe.usuarioId ||
      safe.userId ||
      safe.usuario?._id ||
      safe.user?._id ||
      null;

    const usuario =
      safe.usuario ||
      safe.user ||
      (usuarioId
        ? {
          _id: usuarioId,
          email: safe.email || null,
        }
        : null);

    return {
      _id,
      id,
      fecha,
      hora,
      nota,
      emociones,
      intensidad,
      etiquetas,
      usuarioId,
      usuario,
      meta: safe.meta || {},
      synced:
        typeof safe.synced !== "undefined"
          ? safe.synced
          : null,
      version:
        safe.version ??
        safe.__v ??
        null,

      createdAt: safe.createdAt,
      updatedAt: safe.updatedAt,
      userId: safe.userId,
      usuarioId: safe.usuarioId,
    };
  }

  async function fetchSingleEntryById(id, authToken = token) {
    if (!id) return null;
    try {
      const url = `${API_BASE || ""}/api/registros/${encodeURIComponent(id)}`;
      const headers = { "Content-Type": "application/json" };
      if (authToken) headers.Authorization = `Bearer ${authToken}`;
      const res = await fetch(url, { headers });
      if (!res.ok) return null;
      const json = await res.json().catch(() => null);
      return normalizeRegistro(json.registro || json || null);
    } catch (e) {
      console.warn("fetchSingleEntryById error", e);
      return null;
    }
  }

  function filterByCurrentUser(arr, { currentUserId = null, currentUserEmail = null } = {}) {
    if (!Array.isArray(arr)) return [];
    const uid = currentUserId ? String(currentUserId).trim() : null;
    const email = currentUserEmail ? String(currentUserEmail).toLowerCase().trim() : null;
    return (arr || []).filter((r) => {
      if (!r) return false;
      const entryUid = String(r.usuarioId || r.userId || r.usuario?._id || r.usuario?.id || r.user?._id || r.user?.id || r.idUsuario || "").trim();
      if (entryUid && uid && entryUid === uid) return true;
      const entryEmail = (r.usuario?.email || r.user?.email || r.email || "").toLowerCase().trim();
      if (entryEmail && email && entryEmail === email) return true;
      return false;
    }).map(ensureIdsAreStrings);
  }

  function mergeServerAndCache(serverArr = [], cacheArr = [], { currentUserId = null, currentUserEmail = null } = {}) {
    const sArr = filterByCurrentUser(serverArr, { currentUserId, currentUserEmail });
    const cArr = filterByCurrentUser(cacheArr, { currentUserId, currentUserEmail });
    const byKey = new Map();
    (sArr || []).forEach((r) => {
      const id = r._id || r.id || null;
      const fecha = formatDate(r.fecha || r.date || r.createdAt || null);
      const key = id ? `id:${id}` : `d:${fecha}`;
      byKey.set(key, r);
    });
    (cArr || []).forEach((r) => {
      const id = r._id || r.id || null;
      const fecha = formatDate(r.fecha || r.date || r.createdAt || null);
      const key = id ? `id:${id}` : `d:${fecha}`;
      if (!byKey.has(key)) byKey.set(key, r);
    });
    return Array.from(byKey.values()).map(normalizeRegistro).filter(Boolean).sort((a, b) => {
      const ta = new Date(a.createdAt || a.hora || Date.now()).getTime();
      const tb = new Date(b.createdAt || b.hora || Date.now()).getTime();
      return tb - ta;
    });
  }

  async function loadEntriesByMonth(month) {
    const currentUserId = String(user?._id || storedUser?._id || user?.id || storedUser?.id || "").trim() || null;
    const currentUserEmail = (user?.email || storedUser?.email || "").toLowerCase().trim() || null;

    try {
      const serverData = await fetchEntriesByMonth(month, token);
      const serverRaw = Array.isArray(serverData) ? serverData : (serverData.registros || serverData.entries || []);

      let serverArr = sanitizeArray(serverRaw)
        .map(normalizeRegistro)
        .map((e) => {
          if (!e) return null;
          if (!e.fecha) {
            e.fecha = formatDate(e.createdAt || e.hora || e.time);
          }
          return e;
        })
        .filter(Boolean);

      const cacheRaw = loadEntradasCache({ userId: currentUserId, userEmail: currentUserEmail });
      let cacheArr = (cacheRaw || [])
        .map(normalizeRegistro)
        .map((e) => {
          if (!e) return null;
          if (!e.fecha) {
            const created = e.createdAt || e.hora || e.time || null;
            if (created) {
              try {
                e.fecha = formatDate(e.createdAt || e.hora || e.time);
              } catch { }
            }
          }
          return e;
        })
        .filter(Boolean);

      let pendientes = [];
      try {
        const raw = localStorage.getItem("pendingRegistros");
        pendientes = raw ? JSON.parse(raw) : [];
      } catch { }

      const pendientesArr = (pendientes || [])
        .map(ensureIdsAreStrings)
        .map(normalizeRegistro)
        .map((e) => {
          if (!e) return null;
          if (!e.fecha) {
            const created = e.createdAt || e.hora || e.time || null;
            if (created) {
              try {
                e.fecha = formatDate(e.createdAt || e.hora || e.time);
              } catch { }
            }
          }
          return e;
        })
        .filter(Boolean)
        .filter((p) => {
          const pUid = String(p.usuarioId || p.userId || p.usuario?._id || p.usuario?.id || p.user?._id || p.user?.id || "").trim();
          if (pUid && currentUserId && pUid === currentUserId) return true;
          const pEmail = (p.usuario?.email || p.user?.email || p.email || "").toLowerCase().trim();
          if (pEmail && currentUserEmail && pEmail === currentUserEmail) return true;
          return false;
        });


      const merged = mergeServerAndCache(serverArr, cacheArr.concat(pendientesArr), { currentUserId, currentUserEmail });


      saveEntradasCache(merged, { userId: currentUserId, userEmail: currentUserEmail });
      return merged;
    } catch (err) {
      console.warn("loadEntriesByMonth fetch error, falling back to cache:", err);

      try {
        const cache = loadEntradasCache({ userId: currentUserId, userEmail: currentUserEmail });
        console.debug("fallback cache length:", Array.isArray(cache) ? cache.length : 0);
        console.debug("fallback cache sample:", (cache || []).slice(0, 5));
        return Array.isArray(cache) ? cache.map(normalizeRegistro).filter(Boolean) : [];
      } catch (e) {
        console.warn("fallback cache read error", e);
        return [];
      }
    }
  }

  useEffect(() => {
    if (!token) return;

    let mounted = true;
    setCargando(true);

    (async () => {
      try {
        const data = await loadEntriesByMonth(mesSeleccionado);
        if (!mounted) return;
        setEntradas(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error cargando entradas por mes:", err);
        setMensajeGuia("No se pudieron cargar las entradas. Revisa la conexión con el servidor.");
        const cache = loadEntradasCache({
          userId: String(user?._id || storedUser?._id || "").trim() || null,
          userEmail: (user?.email || storedUser?.email || "").toLowerCase().trim() || null
        });
        setEntradas(Array.isArray(cache) ? cache.map(normalizeRegistro).filter(Boolean) : []);
      } finally {
        if (mounted) setCargando(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [mesSeleccionado, user, storedUser, token]);

  useEffect(() => {
    const personajeId = user?.personaje?.id || storedUser?.personaje?.id || null;
    if (!personajeId) {
      setPartner(null);
      return;
    }

    let mounted = true;
    const controller = new AbortController();
    setPartnerLoading(true);

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/partners`, { signal: controller.signal });
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || `Error cargando partners (${res.status})`);
        }
        const json = await res.json();
        const list = Array.isArray(json.partners) ? json.partners : [];
        if (!mounted) return;
        const found = list.find(
          (p) => String(p._id) === String(personajeId) || String(p.key) === String(personajeId)
        );
        setPartner(found || null);
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Error cargando personaje:", err);
        setPartner(null);
      } finally {
        if (mounted) setPartnerLoading(false);
      }
    })();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [user, storedUser]);

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      if (setUser) setUser(null);
      sessionStorage.removeItem("pendingUser");
      sessionStorage.removeItem("authToken");
      localStorage.removeItem("userToken");
      localStorage.removeItem("userData");
      navigate("/", { replace: true });
    } catch (err) {
      try {
        sessionStorage.clear();
        localStorage.clear();
      } catch { }
      if (setUser) setUser(null);
      navigate("/", { replace: true });
    }
  };


  //normaliza fechas a YYYY-MM-DD y compara
  const findEntryForDate = (fechaYYYYMMDD) => {
    if (!fechaYYYYMMDD) return null;

    const targetKey = formatDate(fechaYYYYMMDD);

    const uid = String(
      user?._id ||
      storedUser?._id ||
      user?.id ||
      storedUser?.id ||
      ""
    ).trim();

    const email = (
      user?.email ||
      storedUser?.email ||
      ""
    ).toLowerCase() || null;

    const entryMatchesDate = (entry) => {
      if (!entry) return false;

      const candidates = [
        entry.fecha,
        entry.date
      ]
        .filter(Boolean)
        .map(formatDate);

      return candidates.some((c) => c === targetKey);
    };

    const entryMatchesOwner = (entry) => {
      const entryUid = String(
        entry.usuarioId ||
        entry.userId ||
        entry.usuario?._id ||
        entry.usuario?.id ||
        entry.user?._id ||
        entry.user?.id ||
        ""
      ).trim();

      if (entryUid && uid && entryUid === uid) return true;

      const entryEmail = (
        entry.usuario?.email ||
        entry.user?.email ||
        entry.email ||
        ""
      ).toLowerCase();

      if (entryEmail && email && entryEmail === email) return true;

      return false;
    };

    const searchList = (list) => {
      if (!Array.isArray(list)) return null;

      for (const e of list) {
        if (!e) continue;

        if (entryMatchesDate(e) && entryMatchesOwner(e)) {
          return e;
        }
      }

      return null;
    };

    const foundInEntradas = searchList(entradas);

    if (foundInEntradas) return foundInEntradas;

    const cache = loadEntradasCache({
      userId: uid || null,
      userEmail: email || null
    });

    const foundInCache = searchList(cache);

    if (foundInCache) return foundInCache;

    try {
      const raw = localStorage.getItem("pendingRegistros");

      const pendientes = raw ? JSON.parse(raw) : [];

      const normalizedPendientes = (pendientes || [])
        .map(ensureIdsAreStrings);

      const foundInPendientes = searchList(normalizedPendientes);

      if (foundInPendientes) return foundInPendientes;
    } catch (e) { }

    return null;
  };

  const handleDayClick = async (dateString) => {
    const todayKey = todayDate();
    if (toDate(dateString) > toDate(todayKey)) {
      setMensajeGuia("No puedes registrar en una fecha futura.");
      return;
    }

    const within = isWithinLast7Days(dateString);
    if (!within) {
      setMensajeGuia("Solo puedes registrar dentro de los últimos 7 días.");
      return;
    }

    if (savingDatesRef.current.has(dateString)) {
      setMensajeGuia("Guardando registro para esa fecha. Espera a que termine el guardado.");
      return;
    }

    const existing = findEntryForDate(dateString);

    setFechaSeleccionada(dateString);
    // Indicar que estamos cargando el modal/registro
    setModalLoading(true);

    try {
      if (existing && (existing.id || existing._id)) {
        // SIEMPRE intenta obtener versión completa actualizada con nota, por ID
        try {
          const full = await fetchSingleEntryById(existing.id || existing._id).catch(() => null);
          const registro = full ? full : normalizeRegistro(existing);
          setExistingForSelectedDate(registro);
          setModalInitial(registro);
          setModalLoading(false);
          setmodalRegistro(true);
          return;
        } catch (e) {
          // fallback si API no responde
          const registroLocal = normalizeRegistro(existing);
          setExistingForSelectedDate(registroLocal);
          setModalInitial(registroLocal);
          setModalLoading(false);
          setmodalRegistro(true);
          return;
        }
      }

      // No existe entrada local: hacer fallback remoto
      console.debug('handleDayClick - no local entry found, fetching month to confirm', dateString);
      try {
        let month;

        try {
          const [dd, mm, yyyy] = formatDate(dateString).split("-");
          month = `${mm}-${yyyy}`;
        } catch (e) {
          month = mesSeleccionado;
        }
        const remoteList = await loadEntriesByMonth(month);
        console.debug('handleDayClick - remoteList length', Array.isArray(remoteList) ? remoteList.length : 0);
        const foundRemote = (remoteList || []).find(r => {
          const rFecha = formatDate(
            r?.fecha || r?.date || r?.createdAt
          );

          return rFecha === formatDate(dateString);
        });
        if (foundRemote) {
          const registro = normalizeRegistro(foundRemote);
          setExistingForSelectedDate(registro);
          setModalInitial(registro);
          setModalLoading(false);
          setMensajeGuia("Ya existe un registro para ese día.");
          return;
        }
      } catch (e) {
        console.debug('handleDayClick - fallback remote fetch failed', e);
      }

      setExistingForSelectedDate(null);
      setModalInitial({ fecha: dateString });
      setModalLoading(false);
      setmodalRegistro(true);
    } catch (err) {
      console.error('handleDayClick error:', err);
      setModalLoading(false);
      setExistingForSelectedDate(null);
      setModalInitial({ fecha: dateString });
      setmodalRegistro(true);
    }
  };

  async function guardarRegistro(payload, { token: overrideToken } = {}) {
    const authToken = overrideToken || token;
    if (!authToken) {
      const err = new Error("Usuario no autenticado");
      err.code = "no_autenticado";
      throw err;
    }

    const safePayload = ensureIdsAreStrings(payload);
    const providedId = safePayload && (safePayload.id || safePayload._id) ? (safePayload.id || safePayload._id) : null;

    // Normalizar fecha a DD-MM-YYYY
    let fechaNormalized = safePayload?.fecha;

    // Solo convertir si NO está ya en DD-MM-YYYY
    if (
      fechaNormalized &&
      !/^\d{2}-\d{2}-\d{4}$/.test(fechaNormalized)
    ) {
      fechaNormalized = formatDate(fechaNormalized);
    }

    if (fechaNormalized) {
      safePayload.fecha = fechaNormalized;
    }


    if (providedId) {
      const id = providedId;
      const url = `${API_BASE || ""}/api/registros/${encodeURIComponent(id)}`;

      const bodyForPut = {
        fecha: safePayload.fecha,
        emociones: safePayload.emociones,
        intensidad: safePayload.intensidad,
        etiquetas: safePayload.etiquetas,
        nota: safePayload.nota,
        meta: { ...(safePayload.meta || {}), source: (safePayload.meta && safePayload.meta.source) || "modal" },
      };

      try {
        const res = await fetch(url, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(bodyForPut),
        });

        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          const err = new Error(json.message || "error_actualizando");
          err.code = json.error || "error_actualizando";
          err.detalle = json.detalle;
          throw err;
        }

        try {
          const updated = await loadEntriesByMonth(mesSeleccionado);
          setEntradas(Array.isArray(updated) ? updated : []);
        } catch (e) {
        }

        return json.registro || json;
      } catch (err) {
        console.error("guardarRegistro PUT error:", err);
        throw err;
      }
    }

    if (!providedId && fechaNormalized) {
      try {
        const existing = findEntryForDate(fechaNormalized);
        if (existing) {
          const err = new Error("registro_existente");
          err.code = "registro_existente";
          err.existing = existing;
          throw err;
        }
      } catch (e) {
        if (e && e.code === "registro_existente") throw e;
        console.debug("guardarRegistro: warning al comprobar duplicados", e);
      }
    }

    try {

      const url =
        `${API_BASE || ""}/api/registros`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            `Bearer ${authToken}`,
        },
        body: JSON.stringify(safePayload),
      });

      const text =
        await res.text();

      let json = {};

      try {
        json = text
          ? JSON.parse(text)
          : {};
      } catch (e) {
        console.error(
          'JSON parse error:',
          e
        );
      }

      if (!res.ok) {

        const errorMsg =
          json.message ||
          "error_guardando";

        const err =
          new Error(errorMsg);

        err.code =
          json.error ||
          "error_guardando";

        err.detalle =
          json.detalle;

        console.error(
          "Detalle servidor:",
          json.detalle
        );

        throw err;
      }

      try {

        const updated =
          await loadEntriesByMonth(
            mesSeleccionado
          );

        setEntradas(
          Array.isArray(updated)
            ? updated
            : []
        );

      } catch (e) { }

      return json.registro || json;

    } catch (err) {

      throw err;
    }
  }

  async function sincronizarConServidor({ token: overrideToken } = {}) {
    const authToken = overrideToken || token;
    if (!authToken) throw new Error("no_autenticado");

    let pendientes = [];
    try {
      const raw = localStorage.getItem("pendingRegistros");
      pendientes = raw ? JSON.parse(raw) : [];
    } catch {
      pendientes = [];
    }

    const currentUserId = String(user?._id || storedUser?._id || "").trim() || null;
    const currentUserEmail = (user?.email || storedUser?.email || "").toLowerCase().trim() || null;
    const pendientesFiltrados = (pendientes || []).filter((p) => {
      if (!p) return false;
      const pUid = String(p.usuarioId || p.userId || p.usuario?._id || "").trim();
      if (pUid && currentUserId && pUid === currentUserId) return true;
      const pEmail = (p.usuario?.email || p.email || "").toLowerCase().trim();
      if (pEmail && currentUserEmail && pEmail === currentUserEmail) return true;
      return false;
    }).map(ensureIdsAreStrings);

    if (pendientesFiltrados.length === 0) return { ok: true };

    const url = `${API_BASE || ""}/api/registros/sincronizar`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ items: pendientesFiltrados }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error("error_sincronizar");

    if (json.actualizados && json.actualizados.length > 0) {
      localStorage.removeItem("pendingRegistros");
      const updated = await loadEntriesByMonth(mesSeleccionado);
      setEntradas(updated);
    }

    return json;
  }

  function lastNDates(n) {
    const out = [];
    const today = new Date();
    for (let i = 0; i < n; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      out.push(formatDate(d));
    }
    return out;
  }

  const RECONCILE_KEY = "pendingAnalisisReconciles";
  const RECONCILE_INTERVAL_MS = 1000 * 60 * 2;
  const reconcileProcessingRef = useRef(false);

  function enqueueReconcile(fechaYYYYMMDD) {
    try {
      const raw = localStorage.getItem(RECONCILE_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      if (!arr.includes(fechaYYYYMMDD)) {
        arr.push(fechaYYYYMMDD);
        localStorage.setItem(RECONCILE_KEY, JSON.stringify(arr));
      }
    } catch (e) { }
  }

  function dequeueReconcile(fechaYYYYMMDD) {
    try {
      const raw = localStorage.getItem(RECONCILE_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      const next = arr.filter((f) => f !== fechaYYYYMMDD);
      localStorage.setItem(RECONCILE_KEY, JSON.stringify(next));
    } catch (e) { }
  }
  async function checkAnalisisExists(fecha) {

    try {

      const res = await fetch(
        `${API_BASE}/api/analisis/${formatDate(fecha)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (res.status === 404) {
        return false;
      }

      return res.ok;

    } catch (err) {

      console.error(
        "checkAnalisisExists error",
        err
      );

      return false;
    }
  }
  async function processPendingReconciles() {

    // evita ejecuciones paralelas
    if (reconcileProcessingRef.current) {
      return;
    }

    reconcileProcessingRef.current = true;

    try {

      const raw =
        localStorage.getItem(RECONCILE_KEY);

      const pending =
        raw ? JSON.parse(raw) : [];

      if (
        !Array.isArray(pending) ||
        pending.length === 0
      ) {
        return;
      }

      // elimina nulls/undefined/duplicados
      const uniqueDates = Array.from(
        new Set(
          pending
            .filter(Boolean)
            .map((f) => formatDate(f))
        )
      );

      for (const fecha of uniqueDates) {

        try {

          // throttle para evitar spam
          const last =
            _lastFetchTimestamp.get(fecha) || 0;

          if (
            Date.now() - last <
            MIN_FETCH_INTERVAL_MS
          ) {
            continue;
          }

          _lastFetchTimestamp.set(
            fecha,
            Date.now()
          );

          // comprobar si ya existe análisis
          const exists =
            await checkAnalisisExists(
              formatDate(fecha)
            );

          // si ya existe → quitar de pendientes
          if (exists) {

            dequeueReconcile(fecha);

            continue;
          }

          // si no existe → regenerar
          console.debug(
            "Regenerando análisis para:",
            fecha
          );

          const res = await fetch(
            `${API_BASE}/api/analisis`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                fecha: formatDate(fecha)
              })
            }
          );

          // si backend respondió OK
          if (res.ok) {

            // volver a comprobar
            const existsAfter =
              await checkAnalisisExists(
                formatDate(fecha)
              );

            if (existsAfter) {

              dequeueReconcile(fecha);

              // refresca análisis actual visible
              try {

                const hoy =
                  formatDate();

                if (
                  formatDate(fecha) === hoy
                ) {

                  await cargarAnalisisHoy();
                }

              } catch (e) {

                console.debug(
                  "refresh análisis warning",
                  e
                );
              }
            }
          }

        } catch (err) {

          console.error(
            "Error reconciliando análisis:",
            fecha,
            err
          );
        }
      }

    } catch (err) {

      console.error(
        "processPendingReconciles error",
        err
      );

    } finally {

      reconcileProcessingRef.current = false;
    }
  }

  useEffect(() => {
    if (!token) return;

    processPendingReconciles().catch(err => console.debug('initial reconcile error', err));

    reconcileIntervalIdRef.current = setInterval(() => {
      processPendingReconciles().catch(err => console.debug('reconcile error', err));
    }, RECONCILE_INTERVAL_MS);

    return () => {
      if (reconcileIntervalIdRef.current) {
        clearInterval(reconcileIntervalIdRef.current);
        reconcileIntervalIdRef.current = null;
      }
    };
  }, [token]);

  const currentUserId = String(user?._id || user?.id || storedUser?._id || storedUser?.id || "").trim();
  console.log("currentUserId", currentUserId);

  console.log(
    "entradas userIds",
    entradas.map((e) => ({
      userId: e.userId,
      usuarioId: e.usuarioId
    }))
  );
  const currentUserEmail = (user?.email || storedUser?.email || "").toLowerCase().trim();

  const entradasUsuario = (entradas || []).filter((e) => {
    const entryUid = String(e.usuarioId || e.userId || e.usuario?._id || e.user?.id || "").trim();
    return entryUid === currentUserId;
  });
  console.log("entradasUsuario", entradasUsuario);
  const parseFecha = (fechaStr) => {
    if (!fechaStr) return 0;

    const [dd, mm, yyyy] = fechaStr.split("-");

    return new Date(`${yyyy}-${mm}-${dd}`).getTime();
  };

  const entradasUsuarioOrdenadas = [...entradasUsuario].sort((a, b) => {
    return parseFecha(b.fecha) - parseFecha(a.fecha);
  });

  const ultimaEntrada = entradasUsuarioOrdenadas[0] || null;

  const ultimaFechaRegistrada = ultimaEntrada
    ? formatDate(
      ultimaEntrada.fecha ||
      ultimaEntrada.date ||
      ultimaEntrada.createdAt
    )
    : null;

  const ultimasEmociones = ultimaFechaRegistrada
    ? entradasUsuarioOrdenadas
      .filter((entry) => {
        const fechaEntry = formatDate(entry.fecha || entry.date || entry.createdAt);
        return fechaEntry === ultimaFechaRegistrada;
      })
      .flatMap((entry) => {
        if (Array.isArray(entry.emociones)) {
          return entry.emociones;
        }
        return [];
      })
      .slice(0, 5) : [];

  const handleGuardarEntrada = async (savedRegistro) => {

    try {

      if (!savedRegistro) return;

      console.log(
        "Registro ya guardado:",
        savedRegistro
      );

      const updated =
        await loadEntriesByMonth(
          mesSeleccionado
        );

      setEntradas(
        Array.isArray(updated)
          ? updated
          : []
      );

      // inicia generación análisis
      try {

        await fetch(
          `${API_BASE}/api/analisis`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              fecha: formatDate(savedRegistro.fecha)
            })
          }
        );

      } catch (e) {

        console.error(
          "Error iniciando análisis",
          e
        );
      }

      // deja pendiente reconciliación
      enqueueReconcile(
        savedRegistro.fecha
      );

      // refresca solo si es hoy
      if (
        formatDate(savedRegistro.fecha) ===
        todayDate()
      ) {

        await cargarAnalisisHoy();
      }

    } catch (error) {

      console.error(
        "handleGuardarEntrada error:",
        error
      );
    }
  };

  async function cargarAnalisisHoy() {
    if (!token) return;

    setCargandoAnalisis(true);

    try {
      const fechaHoy = formatDate();

      const res = await fetch(
        `${API_BASE}/api/analisis/${fechaHoy}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (res.status === 404) {
        setAnalisis(null);
        return;
      }

      if (!res.ok) {
        throw new Error("error_cargando_analisis");
      }

      const data = await res.json();
      console.log("DATA ANALISIS:", data);
      setAnalisis(data.analisis || data || null);

    } catch (error) {
      console.error("Error cargando análisis:", error);
    } finally {
      setCargandoAnalisis(false);
    }
  }
  useEffect(() => {
    if (!token) return;
    cargarAnalisisHoy();
  }, [token]);

  return (
    <div className="page-layout">
      <main className="page-main-content">
        <div className="dashboard-container">
          <aside className="sidebar">
            <h2 className="sidebar-title">Oubaitori</h2>
            <nav>
              <a href="#">Mapa emocional PRÓXIMAMENTE</a>
              <a href="#">Recomendaciones personalizadas PRÓXIMAMENTE</a>
              <a href="#" onClick={handleLogout} className="logout-link">
                Cerrar sesión
              </a>
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
                    <h3>Últimas emociones</h3>

                    <p className="status-emotion">
                      {ultimasEmociones.length > 0 ? (
                        ultimasEmociones.map((emocion, index) => (
                          <span key={index} style={{ marginRight: 6 }}>
                            {emocion?.emoji || "🙂"}
                          </span>
                        ))) : ("Sin registros")}
                    </p>
                    <p className="status-detail">
                      {ultimaFechaRegistrada || "Empieza registrando hoy."}
                    </p>
                  </Card>
                  <Card variant="status-card-compact">
                    <h3>Tendencia de la semana</h3>

                    {cargandoAnalisis ? (
                      <p className="status-detail">
                        Analizando registros...
                      </p>
                    ) : analisis ? (
                      <>
                        <p className="status-detail">
                          Estado general:
                          <strong>
                            {" "}
                            {analisis.resumen.estadoGeneral}
                          </strong>
                        </p>

                        <p className="status-detail">
                          Intensidad media:
                          <strong>
                            {" "}
                            {analisis.resumen.intensidadMedia}/10
                          </strong>
                        </p>

                        <p
                          className="status-detail"
                          style={{ marginTop: 10 }}
                        >
                          {analisis.resumen.resumen}
                        </p>

                        {analisis.resumen.alerta?.mostrar && (
                          <p
                            style={{
                              color: "#cf1322",
                              marginTop: 10
                            }}
                          >
                            ⚠️ {analisis.resumen.alerta.mensaje}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="status-detail">
                        Sigue registrando emociones para generar análisis.
                      </p>
                    )}
                  </Card>
                </section>

                <section className="calendar-section section-margin">
                  <div className="calendar-card">
                    <h3>Calendario emocional</h3>
                    <CalendarView month={mesSeleccionado} onDayClick={handleDayClick} entries={entradasUsuario} />
                  </div>
                </section>
              </main>

              <section className="right-panel">
                <Card variant="profile-mini-card card" className="section-margin">
                  <h4>Mi Perfil</h4>
                  <p className="profile-name">{nombreUsuario}</p>
                  <a href="/perfilUsuario" className="edit-link">Ver detalles</a>
                </Card>
                <Card variant="recommendation-box card" className="section-margin">
                  <h4>Recomendación</h4>
                  <p>{recomendacion}</p>
                </Card>
              </section>
            </div>

            <div className="rpg-ui-layer">
              <div className="rpg-dialogue-wrapper">
                <div className="rpg-character-container">
                  <img
                    src={partner ? resolvePartnerImage(partner) : "/assets/default-partner.png"}
                    alt="Guía"
                    className="rpg-character-img"
                    onError={(e) => { e.target.src = "/assets/default-partner.png"; }}
                  />
                </div>
                <div className="dialogue-name-tag"><span>{partner?.nombre || partner?.name || "Guía"}</span></div>
                <div className="dialogue-box">
                  <div className="dialogue-text-content">
                    <h4>{cargando ? "Meditando..." : `¿Cómo va todo, ${nombreUsuario}?`}</h4>
                    <p>{analisis?.resumen?.resumen || mensajeGuia}</p>
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button className="rpg-button" onClick={() => handleDayClick(todayDate())}>
                      Registrar hoy
                    </button>
                    <button
                      className="rpg-button"
                      onClick={cargarAnalisisHoy}
                      disabled={cargando || cargandoAnalisis}>
                      {cargandoAnalisis ? "Analizando..." : "Actualizar análisis"}
                    </button>
                  </div>
                  <div className="dialogue-next-icon">▼</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <RegistroEmocional
        open={modalRegistro}
        onClose={() => { setmodalRegistro(false); setFechaSeleccionada(null); }}
        date={fechaSeleccionada}
        initial={modalInitial || {}}
        existingEntry={existingForSelectedDate}
        onSave={handleGuardarEntrada}
        usuarioActual={user || storedUser}
        token={token}
        guardarRegistro={guardarRegistro}
        sincronizarConServidor={sincronizarConServidor}
        apiBase={API_BASE}
      />
    </div>
  );
}
