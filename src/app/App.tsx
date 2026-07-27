import AppRouter from "./router/AppRouter";
import { Toaster } from "./components/ui/sonner";
import { ThemeProvider } from "../context/ThemeContext";

export default function App() {
  return (
    <ThemeProvider>
      <AppRouter />
      <Toaster closeButton position="bottom-right" expand={false} richColors />
    </ThemeProvider>
  );
}
