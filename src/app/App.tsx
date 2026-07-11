import AppRouter from "./router/AppRouter";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  return (
    <>
      <AppRouter />
      <Toaster closeButton position="top-right" />
    </>
  );
}

