import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./lib/idleDetector"; // Auto-reload after 3min idle

createRoot(document.getElementById("root")!).render(<App />);
