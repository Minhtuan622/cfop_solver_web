import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { applyAppAccent, applyAppFontScale, applyAppThemeMode, applyFormulaScale, readAppAccent, readAppFontScale, readAppThemeMode, readFormulaScale } from "./lib/displaySettings";

applyAppFontScale(readAppFontScale());
applyFormulaScale(readFormulaScale());
applyAppAccent(readAppAccent());
applyAppThemeMode(readAppThemeMode());
createRoot(document.getElementById("root")!).render(<App />);
