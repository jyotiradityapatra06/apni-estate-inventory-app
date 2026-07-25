import AppRouter from "./router/AppRouter";
import { Toaster } from "./components/ui/sonner";
import { ThemeProvider } from "../context/ThemeContext";

export default function App() {
  return (
    <ThemeProvider>
      <AppRouter />
      <Toaster closeButton position="top-right" />
    </ThemeProvider>
  );
}
