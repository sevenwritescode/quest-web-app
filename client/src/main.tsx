// main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./css/index.css";

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