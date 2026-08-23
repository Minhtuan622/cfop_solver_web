import { createRoot } from "react-dom/client";
import App from "./App";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap";
import "./index.css";
import { applyAppThemeMode, readAppThemeMode } from "./lib/displaySettings";

applyAppThemeMode(readAppThemeMode());
createRoot(document.getElementById("root")!).render(<App />);
