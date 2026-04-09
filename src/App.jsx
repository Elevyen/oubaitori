import { useEffect } from "react";
import Footer from "./components/ui/Footer"; // <-- importa tu Footer tal cual
import AppRouter from "./router/AppRouter";

function App() {

  useEffect(() => {
    const hour = new Date().getHours()

    let theme = ""

    if (hour >= 6 && hour < 12) {
      theme = "amanecer"
    } else if (hour >= 12 && hour < 18) {
      theme = "mediodia"
    } else if (hour >= 18 && hour < 21) {
      theme = "atardecer"
    } else {
      theme = "noche"
    }

    document.body.className = theme
  }, [])

  return (
    <>
      <AppRouter />
      <Footer />
    </>
  )
}

export default App
