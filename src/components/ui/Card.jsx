// src/components/ui/Card.jsx
import '../../styles/card.css'; // opcional: elimina esta línea si no quieres archivo extra

/**
 * Card
 * - variant: clases ya definidas en tu CSS (ej: "greeting-card", "status-card-compact")
 * - className: clases adicionales
 * - as: elemento HTML a renderizar (div, section, article...)
 *
 * Esta versión no realiza comprobaciones en runtime ni usa prop-types.
 */
export default function Card({ children, variant = '', className = '', as: Component = 'div', ...props }) {
    const classes = ['card', variant, className].filter(Boolean).join(' ')
    return (
        <Component className={classes} {...props}>
            {children}
        </Component>
    )
}
