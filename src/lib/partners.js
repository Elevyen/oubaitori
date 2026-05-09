const API_BASE =
    (typeof import.meta !== "undefined" &&
        import.meta.env &&
        (import.meta.env.VITE_LOCAL_BACKEND ||
            import.meta.env.VITE_RENDER_BACKEND)) ||
    "";

export async function fetchPartners(token) {
    const res = await fetch(`${API_BASE}/api/partners`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || 'error_fetch_partners');
    }
    const json = await res.json();
    return json.partners || [];
}
