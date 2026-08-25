import { createRoot } from "react-dom/client";
import App from "./App";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./index.css";

// Accordions are below the first interaction path. Defer their Bootstrap data API
// so React, navigation and the initial Studio route can become interactive first.
window.setTimeout(() => { void import("bootstrap/js/dist/collapse"); }, 0);

createRoot(document.getElementById("root")!).render(<App />);
