import { lazy, Suspense } from "react";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AppNav } from "./components/AppNav";
import { SkeletonCard } from "./components/ui/BootstrapUI";
import { AppToaster } from "./components/ui/AppToaster";
import { useLanguage } from "./contexts/LanguageContext";
import { CompetitionOutcomeCelebration } from "./features/competition/components/CompetitionOutcomeCelebration";
// Account sync is background work: keep its storage helpers out of the entry
// chunk so the first screen does not wait for solve history and SRS code.
const CfopCloudSync = lazy(() => import("./features/profile/components/CfopCloudSync").then(module => ({ default: module.CfopCloudSync })));
const Home = lazy(() => import("./pages/Home"));
const History = lazy(() => import("./pages/History"));
const Profile = lazy(() => import("./pages/Profile"));
const Rooms = lazy(() => import("./pages/Rooms"));
const CompetitionLeaderboard = lazy(() => import("./pages/CompetitionLeaderboard"));
const Settings = lazy(() => import("./pages/Settings"));
const TimerLab = lazy(() => import("./pages/TimerLab"));
const WcaCompetitions = lazy(() => import("./pages/WcaCompetitions"));

function RouteLoading() {
  const { t } = useLanguage();
  return <div className="container py-4 py-lg-5" aria-live="polite"><div className="row g-4"><div className="col-12 col-xl-8"><SkeletonCard lines={2} label={t("common.loading")} /><SkeletonCard lines={5} className="mt-4" label={t("common.loading")} /></div><div className="col-12 col-xl-4"><SkeletonCard lines={4} label={t("common.loading")} /></div></div></div>;
}
function Router() {
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
    <Route path="/leaderboard" component={CompetitionLeaderboard} />
    <Route path="/competition" component={CompetitionLeaderboard} />
    <Route path="/wca" component={WcaCompetitions} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch></Suspense>;
}

function AppFooter() {
  const { t } = useLanguage();
  return (
    <footer className="app-footer py-4 mt-auto">
      <div className="container">
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md">
            <p className="mb-1 fw-semibold text-body">CFOP Solver Studio</p>
            <p className="mb-0">{t("footer.tagline")}</p>
          </div>
          <nav className="col-12 col-md-auto d-flex flex-wrap gap-3" aria-label={t("footer.links")}>
            <a href="/">{t("nav.solve")}</a>
            <a href="/timer">{t("nav.timer")}</a>
            <a href="/study">{t("nav.study")}</a>
            <a href="/history">{t("nav.history")}</a>
            <a href="/settings">{t("nav.settings")}</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}

function AppShell() {
  const { t } = useLanguage();
  const [location] = useLocation();
  const solverHome = location === "/";
  return <div className={`d-flex flex-column min-vh-100 ${solverHome ? "solver-home-shell" : "bs-page"}`}>
    <Suspense fallback={null}><CfopCloudSync /></Suspense>
    <CompetitionOutcomeCelebration />
    <a className="visually-hidden-focusable position-absolute top-0 start-0 m-2 btn btn-primary" href="#main-content">{t("nav.skip")}</a>
    {solverHome ? null : <AppNav />}
    <main id="main-content" className={solverHome ? "flex-grow-1" : "py-4 py-lg-5 flex-grow-1"}><Router /></main>
    {solverHome ? null : <AppFooter />}
    <AppToaster />
  </div>;
}

function App() {
  return <LanguageProvider><ErrorBoundary><ThemeProvider>
    <AppShell />
  </ThemeProvider></ErrorBoundary></LanguageProvider>;
}

export default App;
