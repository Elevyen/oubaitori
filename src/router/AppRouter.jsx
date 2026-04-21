import { BrowserRouter, Route, Routes } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import Login from "../pages/Login";
import RegistroUsuario from "../pages/RegistroUsuario";
import SelectPartner from "../pages/SelectPartner";




export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/registro" element={<RegistroUsuario />} />
                <Route path="/selectPartner" element={<SelectPartner />} />
                <Route path="/dashboard" element={<Dashboard />} />

            </Routes>
        </BrowserRouter>
    )
}
