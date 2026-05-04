import { BrowserRouter, Route, Routes } from "react-router-dom";
import Contacto from "../pages/Contacto";
import Dashboard from "../pages/Dashboard";
import GuiaUsuario from "../pages/GuiaUsuario";
import Login from "../pages/Login";
import PerfilAdmin from "../pages/PerfilAdmin";
import PerfilUsuario from "../pages/PerfilUsuario";
import RegistroUsuario from "../pages/RegistroUsuario";
import SelectPartner from "../pages/SelectPartner";

export default function AppRouter({ apiBase = '', token = null, user = null }) {
    return (
        <BrowserRouter>
            <main className="page-main-content">
                <Routes>
                    <Route path="/" element={<Login apiBase={apiBase} token={token} user={user} />} />
                    <Route path="/registro" element={<RegistroUsuario apiBase={apiBase} token={token} user={user} />} />
                    <Route path="/selectPartner" element={<SelectPartner apiBase={apiBase} token={token} user={user} />} />
                    <Route path="/dashboard" element={<Dashboard apiBase={apiBase} token={token} user={user} />} />
                    <Route path="/perfilAdmin" element={<PerfilAdmin apiBase={apiBase} token={token} user={user} />} />
                    <Route path="/perfilUsuario" element={<PerfilUsuario apiBase={apiBase} token={token} user={user} />} />
                    <Route path="/contacto" element={<Contacto apiBase={apiBase} token={token} user={user} />}/>
                    <Route path="/guiaUsuario" element={<GuiaUsuario apiBase={apiBase} token={token} user={user} />}/>
                </Routes>
            </main>
        </BrowserRouter>
    );
}
