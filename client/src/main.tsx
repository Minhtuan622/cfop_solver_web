import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { applyAppAccent, applyAppFontScale, applyAppThemeMode, readAppAccent, readAppFontScale, readAppThemeMode } from "./lib/displaySettings";

applyAppFontScale(readAppFontScale());
applyAppAccent(readAppAccent());
applyAppThemeMode(readAppThemeMode());
createRoot(document.getElementById("root")!).render(<App />);
