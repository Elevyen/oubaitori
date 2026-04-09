import { useContext, useState } from "react"
import { useNavigate } from "react-router-dom"
import { AuthContext } from "../context/AuthContext"

export default function Login() {
    const navigate = useNavigate()
    const { setUser } = useContext(AuthContext)

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!email || !password) {
            setError("Por favor, completa todos los campos.")
            return
        }

        const fakeUser = {
            id: "123",
            email,
            nombre: "Usuario Oubaitori"
        }

        setUser(fakeUser)
        navigate("/dashboard")
    }

    return (
        <div className="page-layout">
            <main className="page-main-content">
                <div className="login-container">
                    <h1>Oubaitori</h1>
                    <h2>Iniciar sesión</h2>

                    <form onSubmit={handleSubmit} className="login-form">
                        <input
                            type="email"
                            placeholder="Correo electrónico"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />

                        <input
                            type="password"
                            placeholder="Contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />

                        {error && <p className="error">{error}</p>}

                        <button type="submit">Entrar</button>
                    </form>

                    <p className="registro-link">
                        ¿No tienes cuenta? <a href="/registro">Regístrate</a>
                    </p>
                </div>
            </main>
        </div>
    )
}