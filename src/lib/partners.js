const API_BASE = import.meta.env.VITE_API_BASE || '';

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
