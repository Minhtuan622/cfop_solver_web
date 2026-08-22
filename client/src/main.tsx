import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { applyAppFontSize, applyAppTheme, readAppFontSize, readAppTheme } from "./lib/displaySettings";

applyAppFontSize(readAppFontSize());
applyAppTheme(readAppTheme());
createRoot(document.getElementById("root")!).render(<App />);
