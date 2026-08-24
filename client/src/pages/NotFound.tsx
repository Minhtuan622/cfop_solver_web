/** Bootstrap-native fallback page: concise, responsive, and consistent with the application shell. */
import { AlertCircle, Home } from "@/components/BootstrapIcon";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();
  return <div className="container"><div className="row justify-content-center"><section className="col-12 col-md-8 col-lg-6"><div className="card text-center"><div className="card-body p-4 p-md-5"><AlertCircle className="fs-1 text-danger mb-3" /><p className="text-uppercase small fw-semibold text-body-secondary mb-1">CFOP Solver Studio</p><h1 className="display-5">404</h1><h2 className="h4 mt-3">Page Not Found</h2><p className="text-body-secondary mb-4">Sorry, the page you are looking for does not exist. It may have been moved or deleted.</p><button type="button" onClick={() => setLocation("/")} aria-label="Go home" className="btn btn-outline-secondary"><Home className="fs-6" /></button></div></div></section></div></div>;
}
