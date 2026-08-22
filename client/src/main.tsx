import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { applyAppAccent, applyAppFontSize, applyAppThemeMode, readAppAccent, readAppFontSize, readAppThemeMode } from "./lib/displaySettings";

applyAppFontSize(readAppFontSize());
applyAppAccent(readAppAccent());
applyAppThemeMode(readAppThemeMode());
createRoot(document.getElementById("root")!).render(<App />);
