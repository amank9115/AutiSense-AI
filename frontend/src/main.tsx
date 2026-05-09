import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App"
import { AuthProvider } from "./context/AuthContext"
import { ScreeningProvider } from "./context/ScreeningContext"
import { ThemeProvider } from "./context/ThemeContext"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <ScreeningProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ScreeningProvider>
    </ThemeProvider>
  </StrictMode>,
)
