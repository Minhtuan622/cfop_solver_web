/** Tailwind-native application error fallback. */
import { AlertTriangle, RotateCcw } from "@/components/ui/Icon";
import { IconButton } from "./StudioUI";
import { Component, type ReactNode } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { buttonClass } from "@/components/ui/Button";

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundaryView extends Component<
  Props & { t: (key: string) => string },
  State
> {
  constructor(props: Props & { t: (key: string) => string }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: unknown) {
    // The stack stays in the console of the developer machine; the visitor only
    // gets a friendly message, never the internals of the app.
    if (import.meta.env.DEV) console.error(error, info);
  }
  render() {
    if (!this.state.hasError) return this.props.children;
    const { t } = this.props;
    return (
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-12 justify-center">
          <section className="col-span-12 lg:col-span-8">
            <div className="rounded-card bg-surface">
              <div className="p-5 sm:p-6 p-6 md:p-12 text-center">
                <AlertTriangle className="text-4xl text-danger mb-4" />
                <h1 className="text-xl font-semibold tracking-tight">
                  {t("error.title")}
                </h1>
                <p className="text-muted">{t("error.detail")}</p>
                <IconButton
                  label={t("error.reload")}
                  icon={<RotateCcw className="text-base" />}
                  onClick={() => window.location.reload()}
                  className={`${buttonClass("secondary", "md")}`}
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }
}

export default function ErrorBoundary({ children }: Props) {
  const { t } = useLanguage();
  return <ErrorBoundaryView t={t}>{children}</ErrorBoundaryView>;
}
