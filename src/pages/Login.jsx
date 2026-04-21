import { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

export default function Login() {
    const navigate = useNavigate()
    const { setUser } = useContext(AuthContext)

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [errorMsg, setErrorMsg] = useState('')

    const onSubmit = async (event) => {
        event.preventDefault()

        if (!email || !password) {
            setErrorMsg('Por favor, completa todos los campos.')
            return
        }

        const userData = {
            id: '123',
            email,
            nombre: 'Usuario Oubaitori'
        }

        setUser(userData)
        navigate('/dashboard')
    }

    return (
        <div className='page-layout'>
            <main className='page-main-content'>
                <div className='login-container'>
                    <h1>Oubaitori</h1>
                    <h2>Iniciar sesión</h2>

                    <form onSubmit={onSubmit} className='login-form'>
                        <input
                            type='email'
                            placeholder='Correo electrónico'
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />

                        <input
                            type='password'
                            placeholder='Contraseña'
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />

                        {errorMsg && <p className='error'>{errorMsg}</p>}

                        <button type='submit'>Entrar</button>
                    </form>

                    <p className='registro-link'>
                        ¿No tienes cuenta? <a href='/registro'>Regístrate</a>
                    </p>
                </div>
            </main>
        </div>
    )
}