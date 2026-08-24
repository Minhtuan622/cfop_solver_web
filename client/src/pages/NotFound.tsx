import { AlertCircle, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();
  return <div className="container py-5"><div className="row justify-content-center"><div className="col-12 col-md-8 col-lg-6"><section className="card text-center"><div className="card-body p-5"><AlertCircle className="display-4 text-danger mb-3" aria-hidden="true" /><h1 className="display-5">404</h1><h2 className="">Page not found</h2><p className="text-body-secondary mb-4">Sorry, the page you are looking for does not exist. It may have been moved or deleted.</p><button type="button" onClick={() => setLocation("/")} className="btn btn-primary"><Home className="me-1" />Go home</button></div></section></div></div></div>;
}
