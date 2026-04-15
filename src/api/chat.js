import fetch from 'node-fetch'

const GEMINI_KEY = process.env.GEMINI_API_KEY
const MAX_NOTA_LENGTH = 600
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_PER_WINDOW = 10

// Simple rate limiter en memoria
// Usar Upstash/Redis o similar.
const rateMap = new Map()

function rateLimitExceeded(ip) {
    const now = Date.now()
    const entry = rateMap.get(ip) || { count: 0, start: now }
    if (now - entry.start > RATE_LIMIT_WINDOW_MS) {
        // reset window
        entry.count = 1
        entry.start = now
        rateMap.set(ip, entry)
        return false
    }
    entry.count += 1
    rateMap.set(ip, entry)
    return entry.count > RATE_LIMIT_MAX_PER_WINDOW
}

function detectRisk({ intensidad, texto }) {
    if (typeof intensidad === 'number' && intensidad >= 8) return true
    if (!texto) return false
    const lowered = texto.toLowerCase()
    const riskWords = [
        'suicid', 'matarme', 'lastim', 'hacerme daño', 'no quiero vivir',
        'no puedo más', 'quitarme la vida', 'me voy a matar'
    ]
    return riskWords.some(w => lowered.includes(w))
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Método no permitido' })

    if (!GEMINI_KEY) {
        console.error('GEMINI_API_KEY no configurada en env')
        return res.status(500).json({ ok: false, error: 'Configuración del servidor incompleta' })
    }

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'
    if (rateLimitExceeded(ip)) {
        return res.status(429).json({ ok: false, error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' })
    }

    const { emocion, intensidad = null, nota = '' } = req.body || {}

    if (!emocion || typeof emocion !== 'string') {
        return res.status(400).json({ ok: false, error: 'Falta el campo "emocion" o no es válido' })
    }

    const safeNota = String(nota || '').slice(0, MAX_NOTA_LENGTH)

    // Detección de riesgo simple
    const flagSeekHelp = detectRisk({ intensidad, texto: safeNota })

    // Si la intensidad alta, respuesta inmediata y segura (no llamar al LLM)
    if (flagSeekHelp && (typeof intensidad === 'number' && intensidad >= 9)) {
        return res.status(200).json({
            ok: true,
            respuesta: 'Veo que te sientes muy abrumado/a. Te acompaño, pero si te sientes en peligro, por favor contacta con alguien de confianza o con servicios de emergencia. No estás solo/a.',
            flagSeekHelp: true
        })
    }

    // Prompt seguro y breve
    const systemPrompt = `Eres el guía emocional de la app Oubaitori. Habla en español, con tono empático, calmado y respetuoso. No des diagnósticos ni consejos médicos. Responde en máximo 2 frases.`
    const userPrompt = `Contexto: emoción="${emocion}", intensidad=${intensidad ?? 'desconocida'}. Nota: "${safeNota}". Instrucciones: Sugiere una acción práctica y segura (1–2 pasos) para manejar esa emoción ahora mismo. Si detectas riesgo, añade una frase que recomiende buscar apoyo humano.`

    try {
        const resp = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    // Estructura mínima para Gemini API
                    contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
                    generationConfig: {
                        maxOutputTokens: 80,
                        temperature: 0.65
                    }
                }),
                // Controlar timeout
            }
        )

        if (!resp.ok) {
            const text = await resp.text().catch(() => '')
            console.error('Gemini API error', resp.status, text)
            return res.status(502).json({ ok: false, error: 'Error al comunicarse con el servicio de IA' })
        }

        const data = await resp.json().catch(() => null)
        // Comprobar estructura
        const iaText =
            data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            data?.candidates?.[0]?.output?.[0]?.content?.text ||
            data?.output?.[0]?.content?.text ||
            null

        if (!iaText) {
            console.warn('Respuesta de Gemini sin texto esperado', JSON.stringify(data).slice(0, 1000))
            return res.status(502).json({ ok: false, error: 'Respuesta inesperada del servicio de IA' })
        }

        // Si detectamos riesgo por palabras en la nota, forzamos flagSeekHelp true
        const finalFlag = flagSeekHelp || detectRisk({ intensidad, texto: iaText })

        return res.status(200).json({
            ok: true,
            respuesta: iaText.trim(),
            flagSeekHelp: finalFlag
        })
    } catch (err) {
        console.error('Error en api/chat.js', err)
        return res.status(500).json({ ok: false, error: 'Error interno en el servidor' })
    }
}
