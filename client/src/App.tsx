import { lazy, Suspense } from "react";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AppNav } from "./components/AppNav";
import { SkeletonCard } from "./components/ui/StudioUI";
import { AppToaster } from "./components/ui/AppToaster";
import { useLanguage } from "./contexts/LanguageContext";
import { CompetitionOutcomeCelebration } from "./features/competition/components/CompetitionOutcomeCelebration";
// Account sync is background work: keep its storage helpers out of the entry
// chunk so the first screen does not wait for solve history and SRS code.
const CfopCloudSync = lazy(() =>
  import("./features/profile/components/CfopCloudSync").then(module => ({
    default: module.CfopCloudSync,
  }))
);
const Home = lazy(() => import("./pages/Home"));
const History = lazy(() => import("./pages/History"));
const Profile = lazy(() => import("./pages/Profile"));
const Rooms = lazy(() => import("./pages/Rooms"));
const CompetitionLeaderboard = lazy(
  () => import("./pages/CompetitionLeaderboard")
);
const Settings = lazy(() => import("./pages/Settings"));
const TimerLab = lazy(() => import("./pages/TimerLab"));
const WcaCompetitions = lazy(() => import("./pages/WcaCompetitions"));

function RouteLoading() {
  const { t } = useLanguage();
  return (
    <div
      className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
      aria-live="polite"
    >
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 flex flex-col gap-4 xl:col-span-8">
          <SkeletonCard lines={2} label={t("common.loading")} />
          <SkeletonCard lines={5} label={t("common.loading")} />
        </div>
        <div className="col-span-12 xl:col-span-4">
          <SkeletonCard lines={4} label={t("common.loading")} />
        </div>
      </div>
    </div>
  );
}
function Router() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/timer" component={TimerLab} />
        <Route path="/study" component={TimerLab} />
        <Route path="/settings" component={Settings} />
        <Route path="/history" component={History} />
        <Route path="/profile" component={Profile} />
        <Route path="/rooms/:code" component={Rooms} />
        <Route path="/rooms" component={Rooms} />
        <Route
          path="/competition/player/:accountId"
          component={CompetitionLeaderboard}
        />
        <Route path="/leaderboard" component={CompetitionLeaderboard} />
        <Route path="/competition" component={CompetitionLeaderboard} />
        <Route path="/wca" component={WcaCompetitions} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function AppFooter() {
  const { t } = useLanguage();
  return (
    <footer className="mt-auto border-t border-line/70 bg-surface/50 py-8 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div>
          <p className="text-sm font-semibold tracking-tight text-ink">
            CFOP Solver Studio
          </p>
          <p className="mt-1 text-xs text-muted">{t("footer.tagline")}</p>
        </div>
        <nav
          className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-muted"
          aria-label={t("footer.links")}
        >
          <a className="transition hover:text-primary" href="/">
            {t("nav.solve")}
          </a>
          <a className="transition hover:text-primary" href="/timer">
            {t("nav.timer")}
          </a>
          <a className="transition hover:text-primary" href="/study">
            {t("nav.study")}
          </a>
          <a className="transition hover:text-primary" href="/history">
            {t("nav.history")}
          </a>
          <a className="transition hover:text-primary" href="/settings">
            {t("nav.settings")}
          </a>
        </nav>
      </div>
    </footer>
  );
}

function AppShell() {
  const { t } = useLanguage();
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -top-40 right-[-12%] h-[34rem] w-[34rem] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute left-[-15%] top-[28%] h-[30rem] w-[30rem] rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute bottom-[-20%] right-[20%] h-[26rem] w-[26rem] rounded-full bg-primary/5 blur-3xl" />
      </div>
      <Suspense fallback={null}>
        <CfopCloudSync />
      </Suspense>
      <CompetitionOutcomeCelebration />
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-primary focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
        href="#main-content"
      >
        {t("nav.skip")}
      </a>
      <AppNav />
      <main id="main-content" className="flex-1 py-5 lg:py-7">
        <Router />
      </main>
      <AppFooter />
      <AppToaster />
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <ErrorBoundary>
        <ThemeProvider>
          <AppShell />
        </ThemeProvider>
      </ErrorBoundary>
    </LanguageProvider>
  );
}

export default App;
