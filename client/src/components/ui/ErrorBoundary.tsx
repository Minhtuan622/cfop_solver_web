/** Bootstrap-native application error fallback. */
import { AlertTriangle, RotateCcw } from "@/components/ui/BootstrapIcon";
import { IconButton } from "./BootstrapUI";
import { Component, type ReactNode } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

class ErrorBoundaryView extends Component<Props & { language: "vi" | "en" }, State> {
  constructor(props: Props & { language: "vi" | "en" }) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error: Error): State { return { hasError: true, error }; }
  componentDidCatch(error: Error, info: unknown) {
    // The stack stays in the console of the developer machine; the visitor only
    // gets a friendly message, never the internals of the app.
    if (import.meta.env.DEV) console.error(error, info);
  }
  render() {
    if (!this.state.hasError) return this.props.children;
    const vi = this.props.language === "vi";
    return <div className="container"><div className="row justify-content-center"><section className="col-12 col-lg-8"><div className="card"><div className="card-body p-4 p-md-5 text-center"><AlertTriangle className="fs-1 text-danger mb-3" /><h1 className="h3">{vi ? "Đã xảy ra lỗi không mong muốn." : "An unexpected error occurred."}</h1><p className="text-body-secondary">{vi ? "Tải lại trang để khôi phục ứng dụng." : "Reload the page to restore the application."}</p><IconButton label={vi ? "Tải lại trang" : "Reload page"} icon={<RotateCcw className="fs-6" />} onClick={() => window.location.reload()} className="btn btn-outline-secondary" /></div></div></section></div></div>;
  }
}

export default function ErrorBoundary({ children }: Props) {
  const { language } = useLanguage();
  return <ErrorBoundaryView language={language}>{children}</ErrorBoundaryView>;
}
