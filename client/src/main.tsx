import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { applyAppFontSize, readAppFontSize } from "./lib/displaySettings";

applyAppFontSize(readAppFontSize());
createRoot(document.getElementById("root")!).render(<App />);
