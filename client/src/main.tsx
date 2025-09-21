// main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./css/index.css";

// Preload all images under assets directory without delaying initial render
// Use Vite import.meta.glob with eager loading
{
  const modules = (import.meta as any).glob('./assets/**/*.{webp,png,jpg,svg}', { eager: true });
  Object.values(modules as Record<string, { default: string }>).forEach(mod => {
    const img = new Image();
    img.src = mod.default;
  });
}

const container = document.getElementById("root");
if (!container) throw new Error("Could not find root element");

// createRoot comes from react-dom/client in React18+
const root = createRoot(container);

root.render(
  <StrictMode>
    <div className="phone-wrapper">
      <div className="cropped-viewport">
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </div>
    </div>
  </StrictMode>
);