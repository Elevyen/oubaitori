import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchEntriesByMonth } from "../api/entries";
import CalendarView from "../components/CalendarView";
import RegistroEmocional from "../components/RegistroEmocional";
import Card from "../components/ui/Card.jsx";
import { AuthContext } from "../context/AuthContext";
import "../styles/dashboard.css";

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

const notaKey = (typeof window !== 'undefined') ? (import.meta.env.VITE_NOTA_MASTER_KEY || null) : null;
const _inFlightAnalisis = new Map(); // fecha Promise
const _lastFetchTimestamp = new Map(); // fecha ms timestamp
const MIN_FETCH_INTERVAL_MS = 300 * 1000; // 5m mínimo entre fetchs para la misma fecha

const API_BASE =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    (import.meta.env.VITE_LOCAL_BACKEND ||
      import.meta.env.VITE_RENDER_BACKEND)) ||
  "";

export default function Dashboard() {
  const notaKey = (typeof window !== 'undefined') ? (import.meta.env.VITE_NOTA_MASTER_KEY || null) : null;
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

  const [modalRegistro, setmodalRegistro] = useState(false);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const [modalInitial, setModalInitial] = useState(null);
  const [mensajeGuia, setMensajeGuia] = useState("Me alegra verte por aquí.");
  const [cargando, setCargando] = useState(false);
  const [flagBuscarAyuda, setFlagPeligroIntensidad] = useState(false);

  const [partner, setPartner] = useState(null);
  const [partnerLoading, setPartnerLoading] = useState(false);

  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisSummary, setAnalysisSummary] = useState(null);
  const [analysisPerRecord, setAnalysisPerRecord] = useState([]);
  const [analysisComplete, setAnalysisComplete] = useState(false);
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
    if (!raw) return null;

    const safe = ensureIdsAreStrings(raw);

    const id = safe._id || safe.id || safe.registroId || null;
    const _id = safe._id || (safe.id ? String(safe.id) : null);

    const fecha = safe.fecha || safe.date || (safe.createdAt && safe.createdAt.slice(0, 10)) || null;
    const hora = safe.hora || safe.time || safe.createdAt || null;
    const nota = safe.nota || null;

    const emociones = safe.emociones || safe.emotions || safe.emotionList || [];
    const intensidad = safe.intensidad ?? safe.intensity ?? safe.int ?? null;
    const etiquetas = safe.etiquetas || safe.tags || safe.labels || [];

    const usuarioId = safe.usuarioId || safe.userId || (safe.usuario && safe.usuario._id) || (safe.user && safe.user._id) || null;
    const usuario = safe.usuario || safe.user || (usuarioId ? { _id: usuarioId, email: safe.email || null } : null);

    const meta = safe.meta || {};
    const synced = typeof safe.synced !== 'undefined' ? safe.synced : (safe.synced === undefined ? null : safe.synced);
    const version = safe.version ?? safe.__v ?? null;

    return {
      ...safe,
      _id,
      id,
      fecha,
      hora,
      nota,
      emociones: Array.isArray(emociones) ? emociones : [],
      intensidad,
      etiquetas: Array.isArray(etiquetas) ? etiquetas : [],
      usuarioId,
      usuario,
      meta,
      synced,
      version,
      raw: safe
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
      const fecha = r.fecha || r.date || (r.createdAt && r.createdAt.slice(0, 10)) || null;
      const key = id ? `id:${id}` : `d:${fecha}`;
      byKey.set(key, r);
    });
    (cArr || []).forEach((r) => {
      const id = r._id || r.id || null;
      const fecha = r.fecha || r.date || (r.createdAt && r.createdAt.slice(0, 10)) || null;
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
            const created = e.createdAt || e.hora || e.time || null;
            if (created) {
              try {
                e.fecha = String(created).slice(0, 10);
              } catch { }
            }
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
                e.fecha = String(created).slice(0, 10);
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
                e.fecha = String(created).slice(0, 10);
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

      console.groupCollapsed("loadEntriesByMonth debug");
      console.debug("month:", month);
      console.debug("serverRaw length:", Array.isArray(serverRaw) ? serverRaw.length : 0);
      console.debug("serverArr length (normalized):", Array.isArray(serverArr) ? serverArr.length : 0);
      console.debug("serverArr sample:", (serverArr || []).slice(0, 3));
      console.debug("cacheArr length:", Array.isArray(cacheArr) ? cacheArr.length : 0);
      console.debug("cacheArr sample:", (cacheArr || []).slice(0, 3));
      console.debug("pendientesArr length:", Array.isArray(pendientesArr) ? pendientesArr.length : 0);
      console.debug("pendientesArr sample:", (pendientesArr || []).slice(0, 3));
      console.groupEnd();

      const merged = mergeServerAndCache(serverArr, cacheArr.concat(pendientesArr), { currentUserId, currentUserEmail });

      console.groupCollapsed("loadEntriesByMonth merged");
      console.debug("merged length:", Array.isArray(merged) ? merged.length : 0);
      console.debug("merged sample:", (merged || []).slice(0, 5));
      console.groupEnd();

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

  // Normaliza a YYYY-MM-DD y acepta strings
  const formatDateKey = (d) => {
    if (!d) return "";
    if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    const dt = new Date(d);
    if (isNaN(dt)) return String(d);
    return dt.toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });
  };

  //normaliza fechas a YYYY-MM-DD y compara
  const findEntryForDate = (fechaYYYYMMDD) => {
    if (!fechaYYYYMMDD) return null;
    const targetKey = formatDateKey(fechaYYYYMMDD);
    const uid = String(user?._id || storedUser?._id || user?.id || storedUser?.id || "").trim();
    const email = (user?.email || storedUser?.email || "")?.toLowerCase() || null;

    const entryMatchesDate = (entry) => {
      if (!entry) return false;
      const candidates = [
        entry.fecha,
        entry.date,
        entry.createdAt && String(entry.createdAt).slice(0, 10),
        entry.hora && String(entry.hora).slice(0, 10),
        entry.time && String(entry.time).slice(0, 10)
      ].filter(Boolean).map(String);
      return candidates.some(c => formatDateKey(c) === targetKey || String(c).startsWith(targetKey));
    };

    const entryMatchesOwner = (entry) => {
      const entryUid = String(entry.usuarioId || entry.userId || entry.usuario?._id || entry.usuario?.id || entry.user?._id || entry.user?.id || "").trim();
      if (entryUid && uid && entryUid === uid) return true;
      const entryEmail = (entry.usuario?.email || entry.user?.email || entry.email || "").toLowerCase();
      if (entryEmail && email && entryEmail === email) return true;
      return false;
    };

    const searchList = (list) => {
      if (!Array.isArray(list)) return null;
      for (const e of list) {
        if (!e) continue;
        if (entryMatchesDate(e) && entryMatchesOwner(e)) return e;
      }
      return null;
    };

    // buscar en entradas cargadas en memoria
    const foundInEntradas = searchList(entradas);
    if (foundInEntradas) return foundInEntradas;

    // buscar en cache local filtrada por usuario
    const cache = loadEntradasCache({ userId: uid || null, userEmail: email || null });
    const foundInCache = searchList(cache);
    if (foundInCache) return foundInCache;

    // buscar en pendientes (localStorage)
    try {
      const raw = localStorage.getItem("pendingRegistros");
      const pendientes = raw ? JSON.parse(raw) : [];
      const normalizedPendientes = (pendientes || []).map(ensureIdsAreStrings);
      const foundInPendientes = searchList(normalizedPendientes);
      if (foundInPendientes) return foundInPendientes;
    } catch (e) { }

    return null;
  };

  const contarRegistrosDelDia = (fechaDDMMYYYY) => {
    if (!fechaDDMMYYYY) return 0;
    let total = 0;
    const countIn = (list) => {
      (list || []).forEach((e) => {
        const mismaFecha =
          e.date === fechaDDMMYYYY ||
          e.fecha === fechaDDMMYYYY ||
          e.createdAt?.startsWith?.(fechaDDMMYYYY) ||
          false;
        if (!mismaFecha) return;
        const emailEnEntrada = e.usuario?.email || e.user?.email || e.email || null;
        if (emailEnEntrada && emailUsuario) {
          if (String(emailEnEntrada).toLowerCase() === String(emailUsuario).toLowerCase()) total++;
        } else {
          total++;
        }
      });
    };
    countIn(entradas);
    countIn(loadEntradasCache({ userId: String(user?._id || storedUser?._id || "").trim() || null, userEmail: (user?.email || storedUser?.email || "").toLowerCase().trim() || null }));
    try {
      const raw = localStorage.getItem("pendingRegistros");
      const pendientes = raw ? JSON.parse(raw) : [];
      const filtered = (pendientes || []).filter((p) => {
        const pEmail = (p.usuario?.email || p.user?.email || p.email || "").toLowerCase().trim();
        const pUid = String(p.usuarioId || p.userId || p.usuario?._id || p.usuario?.id || p.user?._id || p.user?.id || "").trim();
        const uid = String(user?._id || storedUser?._id || "").trim();
        const email = (user?.email || storedUser?.email || "").toLowerCase().trim();
        if (pUid && uid && pUid === uid) return true;
        if (pEmail && email && pEmail === email) return true;
        return false;
      }).map(ensureIdsAreStrings);
      countIn(filtered);
    } catch { }
    return total;
  };

  const isWithinLastNDays = (fechaYYYYMMDD, n) => {
    if (!fechaYYYYMMDD) return false;
    const today = new Date();
    const target = new Date(fechaYYYYMMDD + "T00:00:00");
    const diffMs = today.setHours(0, 0, 0, 0) - target.setHours(0, 0, 0, 0);
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= n;
  };

  const handleDayClick = async (dateString) => {
    const todayKey = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });
    if (dateString > todayKey) {
      setMensajeGuia("No puedes registrar en una fecha futura.");
      return;
    }

    const daysBackAllowed = 6;
    const within = isWithinLastNDays(dateString, daysBackAllowed);
    if (!within) {
      setMensajeGuia(`Solo puedes registrar hasta ${daysBackAllowed} días atrás.`);
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
      // Si existe y no es hoy, no abrir modal para editar
      if (existing && dateString !== todayKey) {
        setModalLoading(false);
        setMensajeGuia("Ya existe un registro para ese día.");
        return;
      }

      // No existe entrada local: hacer fallback remoto
      console.debug('handleDayClick - no local entry found, fetching month to confirm', dateString);
      try {
        let month;
        try {
          if (/^\d{4}-\d{2}-\d{2}$/.test(String(dateString))) {
            const d = new Date(String(dateString) + "T00:00:00");
            const parts = d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' }).split('-');
            const yyyy = parts[0];
            const mm = parts[1];
            month = `${mm}-${yyyy}`; // MM-YYYY
          } else {
            const d = new Date(dateString);
            if (isNaN(d.getTime())) throw new Error('invalid_date');
            const parts = d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' }).split('-');
            const yyyy = parts[0];
            const mm = parts[1];
            month = `${mm}-${yyyy}`;
          }
        } catch (e) {
          // En caso de fallo, usar el mes actualmente seleccionado como fallback
          month = mesSeleccionado;
        }
        const remoteList = await loadEntriesByMonth(month);
        console.debug('handleDayClick - remoteList length', Array.isArray(remoteList) ? remoteList.length : 0);
        const foundRemote = (remoteList || []).find(r => {
          const rFecha = r && (r.fecha || r.date || (r.createdAt && String(r.createdAt).slice(0, 10)));
          return rFecha && String(rFecha).startsWith(String(dateString));
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

    // Normalizar fecha a YYYY-MM-DD
    const fechaNormalized = safePayload && safePayload.fecha ? String(safePayload.fecha).slice(0, 10) : null;
    if (fechaNormalized) safePayload.fecha = fechaNormalized;


    if (providedId) {
      const id = providedId;
      const url = `${API_BASE || ""}/api/registros/${encodeURIComponent(id)}`;

      const bodyForPut = {
        fecha: safePayload.fecha,
        hora: safePayload.hora,
        emociones: safePayload.emociones,
        intensidad: safePayload.intensidad,
        etiquetas: safePayload.etiquetas,
        nota: safePayload.notaEncrypted,
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
      const url = `${API_BASE || ""}/api/registros`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(safePayload),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMsg = json.message || "error_guardando";
        const err = new Error(errorMsg);
        err.code = json.error || "error_guardando";
        err.detalle = json.detalle;
        console.error("Detalle del error en el servidor:", json.detalle);
        throw err;
      }

      try {
        const updated = await loadEntriesByMonth(mesSeleccionado);
        setEntradas(Array.isArray(updated) ? updated : []);
      } catch (e) {
      }

      return json.registro || json;
    } catch (err) {
      console.error("guardarRegistro POST error:", err);
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
      out.push(d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' }));
    }
    return out;
  }

  function lastAnalisisKeyForUser(userId) {
    return `lastAnalisis_${String(userId || "anon")}`;
  }

  async function fetchAnalisisByDate(fechaYYYYMMDD) {
    if (!token || !fechaYYYYMMDD) return null;

    const last = _lastFetchTimestamp.get(fechaYYYYMMDD) || 0;
    if (Date.now() - last < MIN_FETCH_INTERVAL_MS) return null;

    if (_inFlightAnalisis.has(fechaYYYYMMDD)) return _inFlightAnalisis.get(fechaYYYYMMDD);

    const p = (async () => {
      try {
        const preferred = `${API_BASE || ""}/api/AnalisisDiario/fecha/${encodeURIComponent(fechaYYYYMMDD)}`;
        const res = await fetch(preferred, {
          method: "GET",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        });

        if (res.status === 404) {
          _lastFetchTimestamp.set(fechaYYYYMMDD, Date.now());
          return null;
        }

        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          console.error('fetchAnalisisByDate: unexpected status', res.status, preferred, txt);
          _lastFetchTimestamp.set(fechaYYYYMMDD, Date.now());
          return null;
        }

        const json = await res.json().catch(() => null);
        _lastFetchTimestamp.set(fechaYYYYMMDD, Date.now());
        return json?.analisis || json?.result || json || null;
      } catch (err) {
        console.debug('fetchAnalisisByDate network error', err && err.message ? err.message : err);
        _lastFetchTimestamp.set(fechaYYYYMMDD, Date.now());
        return null;
      } finally {
        _inFlightAnalisis.delete(fechaYYYYMMDD);
      }
    })();

    _inFlightAnalisis.set(fechaYYYYMMDD, p);
    return p;
  }

  async function fetchAnalisisDias({ registrosAnalisis = null, persist = false, force = false } = {}) {
    const authToken = token;
    if (!authToken) return { ok: false, error: "no_autenticado" };

    const currentUserId = String(user?._id || storedUser?._id || user?.id || storedUser?.id || "").trim() || "anon";

    const windowDates = lastNDates(7);
    let rawregistrosAnalisis = Array.isArray(registrosAnalisis) ? registrosAnalisis.slice(0, 100) : null;
    if (!rawregistrosAnalisis || rawregistrosAnalisis.length === 0) {
      try {
        const refreshed = await loadEntriesByMonth(mesSeleccionado);
        rawregistrosAnalisis = Array.isArray(refreshed) ? refreshed.slice(0, 200) : [];
      } catch (e) {
        rawregistrosAnalisis = Array.isArray(entradas) ? entradas.slice(0, 200) : [];
      }
    }

    const filteredByUser = (rawregistrosAnalisis || []).filter((r) => {
      if (!r) return false;
      const entryUid = String(r.usuarioId || r.userId || r.usuario?._id || r.user?.id || r.user?._id || r.idUsuario || "").trim();
      if (entryUid && currentUserId && entryUid === currentUserId) return true;
      const entryEmail = (r.usuario?.email || r.user?.email || r.email || "").toLowerCase().trim();
      const currentEmail = (user?.email || storedUser?.email || "").toLowerCase().trim();
      if (entryEmail && currentEmail && entryEmail === currentEmail) return true;
      return !entryUid && !entryEmail;
    });

    const normalized = (filteredByUser || []).map((r) => {
      if (!r || typeof r !== "object") return null;
      const created = r.createdAt || r.hora || r.time || null;
      const fechaRaw = r.fecha || r.date || (created ? String(created).slice(0, 10) : null);
      const fecha = fechaRaw ? String(fechaRaw).slice(0, 10) : null;
      const emociones = Array.isArray(r.emociones) ? r.emociones : (Array.isArray(r.emotions) ? r.emotions : []);
      const intensidad = r.intensidad ?? r.intensity ?? (typeof r.int === "number" ? r.int : null);
      const nota = r.nota || null;
      const id = r.id || r._id || null;
      const usuarioId = r.usuarioId || r.userId || r.usuario?._id || r.user?._id || null;

      return { id, fecha, emociones, intensidad, nota, usuarioId, _raw: r };
    }).filter(Boolean);

    const payloadregistrosAnalisis = normalized.filter((x) => x && x.fecha && windowDates.includes(x.fecha)).slice(0, 14);

    try {
      const key = lastAnalisisKeyForUser(currentUserId);
      const lastTsRaw = localStorage.getItem(key);
      const lastTs = lastTsRaw ? Number(lastTsRaw) : 0;
      const now = Date.now();
      const sevenDaysMs = 1000 * 60 * 60 * 24 * 7;
      if (!force && lastTs && (now - lastTs) < sevenDaysMs) {
        console.debug("fetchAnalisisDias: análisis reciente detectado, omitiendo nueva petición (usar force:true para forzar).", { lastTs, ageDays: (now - lastTs) / (1000 * 60 * 60 * 24) });
        const fechaToCheck = windowDates[0];
        const existing = await fetchAnalisisByDate(fechaToCheck);
        if (existing) {
          setAnalysisSummary(existing.summary || existing || null);
          setAnalysisComplete(true);
          return { ok: true, summary: existing.summary || existing || null, note: "recent_analysis_skipped" };
        }
        return { ok: false, error: "recent_analysis_skipped" };
      }
    } catch (e) {
      console.debug("fetchAnalisisDias: error comprobando lastAnalisis", e);
    }

    if (!Array.isArray(payloadregistrosAnalisis) || payloadregistrosAnalisis.length === 0) {
      console.warn("fetchAnalisisDias: no hay registros válidos en la ventana de 7 días para enviar", { windowDates, normalizedSample: normalized.slice(0, 3) });
      return { ok: false, error: "no_registrosAnalisis_in_window", details: { windowDates, normalizedSample: normalized.slice(0, 3) } };
    }

    const url = `${API_BASE || ""}/api/AnalisisDiario`;
    setAnalysisLoading(true);

    try {
      console.groupCollapsed("AnalisisDias - payload");
      console.debug("windowDates:", windowDates);
      console.debug("registrosAnalisis count:", payloadregistrosAnalisis.length);
      console.debug("payloadregistrosAnalisis sample:", payloadregistrosAnalisis.slice(0, 6));
      console.groupEnd();

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ registrosAnalisis: payloadregistrosAnalisis, persist }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 409 || json?.message === "analisis_duplicado") {
          console.warn("fetchAnalisisDias: análisis duplicado (409). Recuperando análisis existente.", json);
          setAnalysisComplete(true);
          const fechaToCheck = windowDates[0];
          const existing = await fetchAnalisisByDate(fechaToCheck);
          if (existing) {
            const normalizedSummary = existing.summary || existing || null;
            setAnalysisSummary(normalizedSummary);
            try {
              localStorage.setItem(lastAnalisisKeyForUser(currentUserId), String(Date.now()));
            } catch { }
            return { ok: true, summary: normalizedSummary, note: "analisis_duplicado_recovered" };
          }
          return { ok: false, error: "analisis_duplicado", details: json };
        }

        console.error("fetchAnalisisDias server error:", res.status, json);
        return { ok: false, error: json.message || json.error || `server_${res.status}`, details: json };
      }

      const result = json.result || json;
      const rawSummary = result?.summary || result || null;

      const normalizedSummary = rawSummary
        ? {
          totalregistrosAnalisis: rawSummary.totalregistrosAnalisis ?? rawSummary.total_registrosAnalisis ?? rawSummary.count ?? payloadregistrosAnalisis.length,
          avgIntensity: rawSummary.avgIntensity ?? rawSummary.avg_intensity ?? rawSummary.avg ?? null,
          emotionCounts: rawSummary.emotionCounts ?? rawSummary.emotion_counts ?? (Array.isArray(rawSummary.emotions) ? rawSummary.emotions.reduce((acc, it) => { const k = it.emotion || it.label || it.name; if (k) acc[k] = it.count ?? it.cnt ?? it.value ?? 0; return acc; }, {}) : {}),
          highIntensityIds: rawSummary.highIntensityIds ?? rawSummary.high_intensity_ids ?? rawSummary.high ?? [],
          raw: rawSummary,
        }
        : null;

      setAnalysisPerRecord(result?.perRecord || result?.per_record || []);
      setAnalysisSummary(normalizedSummary);
      setAnalysisComplete(true);

      try {
        localStorage.setItem(lastAnalisisKeyForUser(currentUserId), String(Date.now()));
      } catch (e) {
        console.debug("fetchAnalisisDias: no se pudo guardar lastAnalisis en localStorage", e);
      }

      if (normalizedSummary?.avgIntensity >= 7) {
        setMensajeGuia("Has registrado emociones de alta intensidad recientemente. Busca apoyo si lo necesitas.");
      }

      console.groupCollapsed("AnalisisDias - response");
      console.debug("status:", res.status);
      console.debug("body:", json);
      console.debug("normalizedSummary:", normalizedSummary);
      console.groupEnd();

      return { ok: true, summary: normalizedSummary, raw: json };
    } catch (err) {
      console.error("fetchAnalisisDias exception", err);
      return { ok: false, error: "exception", details: String(err) };
    } finally {
      setAnalysisLoading(false);
    }
  }

  useEffect(() => {
    if (!Array.isArray(entradas) || entradas.length === 0 || !token) return;

    (async () => {
      try {
        await fetchAnalisisDias({ registrosAnalisis: entradas.slice(0, 14), persist: false });
        await checkIfAnalysisComplete();
      } catch (err) {
        console.error("Error al solicitar análisis emocional:", err);
      }
    })();
  }, [entradas, token]);

  const RECONCILE_KEY = "pendingAnalisisReconciles";
  const RECONCILE_INTERVAL_MS = 1000 * 60 * 2;
  const reconcileProcessingRef = useRef(false);
  const reconcileIntervalIdRef = useRef(null);

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

  async function checkAnalisisExists(fechaYYYYMMDD) {
    if (!token) return false;
    try {
      const url = `${API_BASE}/api/AnalisisDiario/status?fecha=${encodeURIComponent(fechaYYYYMMDD)}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json().catch(() => ({}));
      return Boolean(json.exists);
    } catch { return false; }
  }

  async function processPendingReconciles() {
    if (reconcileProcessingRef.current) return;
    reconcileProcessingRef.current = true;
    try {
      const raw = localStorage.getItem(RECONCILE_KEY);
      const pending = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(pending) || pending.length === 0) return;

      const uniqueDates = Array.from(new Set(pending.filter(Boolean)));
      for (const fecha of uniqueDates) {
        const last = _lastFetchTimestamp.get(fecha) || 0;
        if (Date.now() - last < MIN_FETCH_INTERVAL_MS) continue;

        const exists = await checkAnalisisExists(fecha);
        _lastFetchTimestamp.set(fecha, Date.now());
        if (exists) {
          dequeueReconcile(fecha);
        }
      }
    } catch (err) {
      console.error('processPendingReconciles error', err);
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

  const currentUserId = String(user?._id || storedUser?._id || "").trim();
  const currentUserEmail = (user?.email || storedUser?.email || "").toLowerCase().trim();

  const entradasUsuario = (entradas || []).filter((e) => {
    const entryUid = String(e.usuarioId || e.userId || e.usuario?._id || "").trim();
    if (entryUid && currentUserId && entryUid === currentUserId) return true;
    const entryEmail = (e.usuario?.email || e.email || "").toLowerCase().trim();
    if (entryEmail && currentUserEmail && entryEmail === currentUserEmail) return true;
    return false;
  });

  const ultimaEntrada = (() => {
    const arr = [...entradasUsuario].sort((a, b) => {
      const ta = new Date(a.createdAt || a.fecha || 0).getTime();
      const tb = new Date(b.createdAt || b.fecha || 0).getTime();
      return tb - ta;
    });
    return arr[0] || null;
  })();

  const handleGuardarEntrada = async (savedOrPayload) => {
    try {
      const isServerSaved = savedOrPayload && (savedOrPayload._id || savedOrPayload.id);
      let savedRegistro = null;

      const payloadCopy = { ...(savedOrPayload || {}) };
      const fecha = payloadCopy.fecha || new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });
      if (!isServerSaved && fecha) {
        const existingForDate = findEntryForDate(fecha);
        if (existingForDate && (existingForDate.id || existingForDate._id) && fecha === new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' })) {
          payloadCopy.id = existingForDate.id || existingForDate._id;
        }
      }

      if (!isServerSaved && !payloadCopy.id && payloadCopy.fecha) {
        markSavingDate(payloadCopy.fecha, true);
        try {
          const created = await guardarRegistro({ ...payloadCopy });
          savedRegistro = created.registro || created;
        } catch (err) {
          if (err && err.code === "registro_existente") {
            markSavingDate(payloadCopy.fecha, false);
            throw err;
          }

          markSavingDate(payloadCopy.fecha, false);
          try {
            const raw = localStorage.getItem("pendingRegistros");
            const arr = raw ? JSON.parse(raw) : [];
            arr.push(payloadCopy);
            localStorage.setItem("pendingRegistros", JSON.stringify(arr));
          } catch { }
          throw err;
        }
      } else if (payloadCopy.id) {
        try {
          const updated = await guardarRegistro({ ...payloadCopy });
          savedRegistro = updated.registro || updated;
        } catch (err) {
          throw err;
        }
      } else {
        savedRegistro = savedOrPayload;
      }

      if (savedRegistro) {
        const updated = await loadEntriesByMonth(mesSeleccionado);
        setEntradas(updated);
        markSavingDate(savedRegistro.fecha, false);
        enqueueReconcile(savedRegistro.fecha);
      }
    } catch (error) {
      if (error && error.code === "registro_existente") {
        setMensajeGuia("Ya existe un registro para esa fecha.");
        if (error.existing) {
          const reg = normalizeRegistro(error.existing);
          setExistingForSelectedDate(reg);
          setModalInitial(reg);
          setmodalRegistro(true);
        }
        return;
      }

      console.error("handleGuardarEntrada error:", error);
    }
  };

  async function checkIfAnalysisComplete() {
    if (!token) return false;
    const todayKey = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });
    const exists = await checkAnalisisExists(todayKey);
    setAnalysisComplete(exists);
    return exists;
  }

  function formatLocalDateYYYYMMDD(d = new Date()) {
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  }

  const realizarAnalisisManual = async ({ persist = true } = {}) => {
    if (analysisLoading || !token) return;

    setAnalysisLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/AnalisisDiario`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ registrosAnalisis: null, persist }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 409 || json?.message === "analisis_duplicado") {
          const fechaToCheck = formatLocalDateYYYYMMDD();
          const existing = await fetchAnalisisByDate(fechaToCheck);
          if (existing) {
            setAnalysisSummary(existing.summary || existing || null);
            setAnalysisPerRecord(existing.perRecord || existing.per_record || []);
            setAnalysisComplete(true);
            setMensajeGuia("Análisis ya existente recuperado.");
            return;
          }
          setMensajeGuia("Análisis duplicado en servidor.");
          return;
        }

        setMensajeGuia(json?.message || `Error servidor (${res.status})`);
        return;
      }

      const result = json.result || json;
      const summary = result?.summary || result || null;
      setAnalysisSummary(summary);
      setAnalysisPerRecord(result?.perRecord || result?.per_record || []);
      setAnalysisComplete(true);

      try {
        const currentUserId = String(user?._id || storedUser?._id || "anon");
        localStorage.setItem(`lastAnalisis_${currentUserId}`, String(Date.now()));
      } catch (e) { /* ignore */ }

      try {
        const updated = await loadEntriesByMonth(mesSeleccionado);
        setEntradas(Array.isArray(updated) ? updated : entradas);
      } catch (e) { /* ignore */ }

    } catch (err) {
      console.error("realizarAnalisisManual error:", err);
      setMensajeGuia("Error de red al solicitar análisis.");
    } finally {
      setAnalysisLoading(false);
    }
  };

  return (
    <div className="page-layout">
      <main className="page-main-content">
        <div className="dashboard-container">
          <aside className="sidebar">
            <h2 className="sidebar-title">Oubaitori</h2>
            <nav>
              <a href="/mapa-emocional">Mapa emocional</a>
              <a href="/recomendaciones">Recomendaciones</a>
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
                    <h3>Última emoción</h3>
                    <p className="status-emotion">
                      {ultimaEntrada ? `${ultimaEntrada.emotion || ultimaEntrada.emociones?.[0]?.label || ""} ${ultimaEntrada.emoji || ""}` : "Sin registros"}
                    </p>
                    <p className="status-detail">
                      {ultimaEntrada ? `${ultimaEntrada.intensity || ultimaEntrada.intensidad || ""}/10 · ${ultimaEntrada.date || ultimaEntrada.fecha}` : "Empieza registrando hoy."}
                    </p>
                  </Card>
                  <Card variant="status-card-compact">
                    <h3>Tendencia de la semana</h3>
                    {analysisLoading ? (
                      <p className="status-detail">Analizando registros...</p>
                    ) : analysisSummary ? (
                      <>
                        <p className="status-detail">
                          Registros analizados: <strong>{analysisSummary.totalregistrosAnalisis}</strong>
                        </p>
                        <p className="status-detail">
                          Intensidad media: <strong>{analysisSummary.avgIntensity}</strong> / 10
                        </p>

                        <div style={{ marginTop: 8 }}>
                          <strong>Emociones más frecuentes:</strong>
                          <ul style={{ margin: "6px 0 0 16px", padding: 0 }}>
                            {analysisSummary.emotionCounts && Object.keys(analysisSummary.emotionCounts).length > 0 ? (
                              Object.entries(analysisSummary.emotionCounts)
                                .sort((a, b) => b[1] - a[1])
                                .slice(0, 3)
                                .map(([emo, cnt]) => (
                                  <li key={emo} style={{ listStyle: "disc" }}>
                                    {emo} — {cnt}
                                  </li>
                                ))
                            ) : (
                              <li style={{ listStyle: "disc" }}>Sin datos suficientes</li>
                            )}
                          </ul>
                        </div>

                        {analysisSummary.highIntensityIds && analysisSummary.highIntensityIds.length > 0 && (
                          <p style={{ color: "#cf1322", marginTop: 8 }}>
                            <strong>Alerta:</strong> {analysisSummary.highIntensityIds.length} registro(s) con intensidad alta.
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="status-detail">Sigue registrando para ver tendencias.</p>
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
                    <p>{analysisComplete ? "El análisis para este periodo ya se ha realizado." : mensajeGuia}</p>
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button className="rpg-button" onClick={() => handleDayClick(new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' }))}>
                      Registrar hoy
                    </button>
                    <button
                      className="rpg-button"
                      onClick={() => realizarAnalisisManual({ persist: true })}
                      disabled={cargando || analysisLoading}
                    >
                      {analysisLoading ? "Analizando..." : "Realizar análisis"}
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
        notaKeyBase64={notaKey}
        guardarRegistro={guardarRegistro}
        sincronizarConServidor={sincronizarConServidor}
        apiBase={API_BASE}
      />
    </div>
  );
}
