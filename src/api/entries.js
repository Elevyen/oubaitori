const base = '/api/entries'

export async function fetchEntriesByMonth(month) {
    const q = new URLSearchParams({ month }).toString()
    const res = await fetch(`${base}?${q}`)
    if (!res.ok) throw new Error('Error fetching entries')
    return res.json()
}

export async function createEntry(payload) {
    const res = await fetch(base, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'unknown' }))
        throw new Error(err?.error || 'Error creating entry')
    }
    return res.json()
}
