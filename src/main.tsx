import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./app/App.tsx";
import "./styles/index.css";

registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log("[PWA] App update available.");
  },
  onOfflineReady() {
    console.log("[PWA] App shell ready for offline usage.");
  },
});

createRoot(document.getElementById("root")!).render(<App />);