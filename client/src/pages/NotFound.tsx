/** Bootstrap-native fallback page: concise, responsive, and consistent with the application shell. */
import { AlertCircle, Home } from "@/components/ui/BootstrapIcon";
import { IconButton } from "@/components/ui/BootstrapUI";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  return <div className="container"><div className="row justify-content-center"><section className="col-12 col-md-8 col-lg-6"><div className="card text-center"><div className="card-body p-4 p-md-5"><AlertCircle className="fs-1 text-danger mb-3" /><p className="text-uppercase small fw-semibold text-body-secondary mb-1">CFOP Solver Studio</p><h1 className="display-5">404</h1><h2 className="h4 mt-3">{t("notFound.title")}</h2><p className="text-body-secondary mb-4">{t("notFound.detail")}</p><IconButton label={t("notFound.home")} icon={<Home className="fs-6" />} onClick={() => setLocation("/")} className="btn btn-outline-secondary" /></div></div></section></div></div>;
}
