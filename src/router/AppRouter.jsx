import { BrowserRouter, Route, Routes } from "react-router-dom"
import Dashboard from "../pages/Dashboard"
import Login from "../pages/Login"
import RegistroUsuario from "../pages/RegistroUsuario"




export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/registro" element={<RegistroUsuario />} />
                <Route path="/dashboard" element={<Dashboard />} />

            </Routes>
        </BrowserRouter>
    )
}
