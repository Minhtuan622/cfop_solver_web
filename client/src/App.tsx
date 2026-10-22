import { lazy, Suspense } from "react";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AppNav } from "./components/AppNav";
import { SkeletonCard } from "./components/ui/BootstrapUI";
import { CfopCloudSync } from "./features/profile/components/CfopCloudSync";
import { CompetitionOutcomeCelebration } from "./features/competition/components/CompetitionOutcomeCelebration";
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
    <Route path="/leaderboard" component={CompetitionLeaderboard} />
    <Route path="/competition" component={CompetitionLeaderboard} />
    <Route path="/wca" component={WcaCompetitions} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch></Suspense>;
}

function AppFooter() {
  return (
    <footer className="app-footer py-4 mt-auto">
      <div className="container">
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md">
            <p className="mb-1 fw-semibold text-body">CFOP Solver Studio</p>
            <p className="mb-0">Giải Rubik 3x3, bấm giờ và luyện tập — miễn phí, dễ dùng cho người mới.</p>
          </div>
          <nav className="col-12 col-md-auto d-flex flex-wrap gap-3" aria-label="Liên kết nhanh">
            <a href="/">Giải Rubik</a>
            <a href="/timer">Bấm giờ</a>
            <a href="/study">Học thêm</a>
            <a href="/history">Kết quả</a>
            <a href="/settings">Cài đặt</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}

function App() {
  return <LanguageProvider><ErrorBoundary><ThemeProvider>
    <div className="d-flex flex-column min-vh-100 bs-page">
      <CfopCloudSync />
      <CompetitionOutcomeCelebration />
      <a className="visually-hidden-focusable position-absolute top-0 start-0 m-2 btn btn-primary" href="#main-content">Bỏ qua điều hướng</a>
      <AppNav />
      <main id="main-content" className="py-4 py-lg-5 flex-grow-1"><Router /></main>
      <AppFooter />
    </div>
  </ThemeProvider></ErrorBoundary></LanguageProvider>;
}

export default App;
