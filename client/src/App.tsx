import { lazy, Suspense, useEffect } from "react";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AppNav } from "./components/AppNav";
import { SkeletonCard } from "./components/BootstrapUI";
import { CfopCloudSync } from "./components/CfopCloudSync";
import { CompetitionOutcomeCelebration } from "./components/CompetitionOutcomeCelebration";
const Home = lazy(() => import("./pages/Home"));
const History = lazy(() => import("./pages/History"));
const Profile = lazy(() => import("./pages/Profile"));
const Rooms = lazy(() => import("./pages/Rooms"));
const CompetitionLeaderboard = lazy(() => import("./pages/CompetitionLeaderboard"));
const Settings = lazy(() => import("./pages/Settings"));
const TimerLab = lazy(() => import("./pages/TimerLab"));
const WcaCompetitions = lazy(() => import("./pages/WcaCompetitions"));

function RouteLoading() {
  return <div className="container py-4 py-lg-5" aria-live="polite"><div className="row g-4"><div className="col-12 col-xl-8"><SkeletonCard lines={2} label="Đang tải công cụ" /><SkeletonCard lines={5} className="mt-4" label="Đang tải nội dung công cụ" /></div><div className="col-12 col-xl-4"><SkeletonCard lines={4} label="Đang tải thông tin bổ sung" /></div></div></div>;
}
function Router() {
  // make sure to consider if you need authentication for certain routes
  return <Suspense fallback={<RouteLoading />}><Switch>
    <Route path="/" component={Home} />
    <Route path="/timer" component={TimerLab} />
    <Route path="/study" component={TimerLab} />
    <Route path="/settings" component={Settings} />
    <Route path="/history" component={History} />
    <Route path="/profile" component={Profile} />
    <Route path="/rooms/:code" component={Rooms} />
    <Route path="/rooms" component={Rooms} />
    <Route path="/competition/player/:accountId" component={CompetitionLeaderboard} />
    <Route path="/competition" component={CompetitionLeaderboard} />
    <Route path="/wca" component={WcaCompetitions} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch></Suspense>;
}

export function BootstrapControlEnhancer() {
  useEffect(() => {
    let disposed = false;
    const instances: { dispose: () => void }[] = [];
    const applyStaticClasses = () => {
      document.querySelectorAll<HTMLElement>("button:disabled, [aria-disabled='true']").forEach((element) => element.classList.add("text-body-secondary"));
    };
    const applyTooltips = async () => {
      const { default: Tooltip } = await import("bootstrap/js/dist/tooltip");
      if (disposed) return;
      document.querySelectorAll<HTMLButtonElement>("button[aria-label]").forEach((button) => {
        if (button.dataset.bootstrapControl === "navbar-toggler") return;
        const isIconOnly = Boolean(button.querySelector(".bi")) && !button.textContent?.trim();
        if (!isIconOnly) return;
        button.classList.add("p-2", "d-inline-flex", "align-items-center", "justify-content-center");
        if (!button.disabled && !button.dataset.bsToggle) {
          button.dataset.bsToggle = "tooltip";
          button.setAttribute("title", button.getAttribute("aria-label") ?? "");
          instances.push(new Tooltip(button));
        }
      });
    };
    applyStaticClasses();
    void applyTooltips();
    const observer = new MutationObserver(() => { applyStaticClasses(); void applyTooltips(); });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["disabled", "aria-disabled"] });
    return () => { disposed = true; observer.disconnect(); instances.forEach((instance) => instance.dispose()); };
  }, []);
  return null;
}

function App() {
  return <ErrorBoundary><LanguageProvider>
    <BootstrapControlEnhancer />
    <CfopCloudSync />
    <CompetitionOutcomeCelebration />
    <a className="visually-hidden-focusable position-absolute top-0 start-0 m-2 btn btn-primary" href="#main-content">Bỏ qua điều hướng</a>
    <AppNav />
    <main id="main-content" className="py-4 py-lg-5"><Router /></main>
  </LanguageProvider></ErrorBoundary>;
}

export default App;
