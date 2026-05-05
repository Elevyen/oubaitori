import { useEffect } from "react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import Footer from "./components/ui/Footer";
import AppRouter from "./router/AppRouter";

function App() {
  useEffect(() => {
    const hour = new Date().getHours();
    let theme = "";
    if (hour >= 6 && hour < 12) theme = "amanecer";
    else if (hour >= 12 && hour < 18) theme = "mediodia";
    else if (hour >= 18 && hour < 21) theme = "atardecer";
    else theme = "noche";
    document.body.className = theme;
  }, []);

  const apiBase =
    import.meta?.env?.VITE_LOCAL_BACKEND ||
    window?.API_BASE ||
    import.meta?.env?.VITE_RENDER_BACKEND ||
    "";

  const token = localStorage.getItem("token") || null;
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch (e) {
      return null;
    }
  })();

  return (
    <div className="page-layout">
      <AppRouter apiBase={apiBase} token={token} user={user} />
      <Footer />
      <SpeedInsights />
    </div>
  );
}

export default App;
