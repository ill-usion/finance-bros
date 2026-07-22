import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { StoreProvider } from "./lib/store";
import "./i18n";
import "./styles/theme.css";
import "./styles/components.css";
import "./styles/screens.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>
);
