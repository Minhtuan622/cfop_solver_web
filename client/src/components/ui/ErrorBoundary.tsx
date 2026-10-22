/** Bootstrap-native application error fallback. */
import { AlertTriangle, RotateCcw } from "@/components/ui/BootstrapIcon";
import { IconButton } from "./BootstrapUI";
import { Component, type ReactNode } from "react";

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error: Error): State { return { hasError: true, error }; }
  render() {
    if (!this.state.hasError) return this.props.children;
    return <div className="container"><div className="row justify-content-center"><section className="col-12 col-lg-8"><div className="card"><div className="card-body p-4 p-md-5 text-center"><AlertTriangle className="fs-1 text-danger mb-3" /><h1 className="h3">An unexpected error occurred.</h1><p className="text-body-secondary">Reload the page to restore the application.</p>{this.state.error?.stack && <pre className="alert alert-secondary text-start text-break small mt-4 mb-4">{this.state.error.stack}</pre>}<IconButton label="Reload page" icon={<RotateCcw className="fs-6" />} onClick={() => window.location.reload()} className="btn btn-outline-secondary" /></div></div></section></div></div>;
  }
}

export default ErrorBoundary;
