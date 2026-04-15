import '../../styles/card.css';

export default function Card({ children, variant = '', className = '', as: Component = 'div', ...props }) {
    const classes = ['card', variant, className].filter(Boolean).join(' ')
    return (
        <Component className={classes} {...props}>
            {children}
        </Component>
    )
}
