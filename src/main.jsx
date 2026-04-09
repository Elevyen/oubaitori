import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// Contexto global de autenticación
import { AuthProvider } from './context/AuthContext'

// Estilos globales
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
)
