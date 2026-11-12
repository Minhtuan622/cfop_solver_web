/** Tailwind-native fallback page: concise, responsive, and consistent with the application shell. */
import { AlertCircle, Home } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  return (
    <div className="mx-auto w-full max-w-2xl px-4 sm:px-6 py-10 lg:py-16">
      <div className="rounded-card border border-line/80 bg-surface shadow-soft text-center">
        <div className="p-6 sm:p-8 md:p-12">
          <AlertCircle className="text-4xl text-danger mb-4" />
          <p className="uppercase tracking-wide text-sm font-semibold text-muted mb-1">
            CFOP Solver Studio
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">404</h1>
          <h2 className="text-lg font-semibold tracking-tight mt-4">
            {t("notFound.title")}
          </h2>
          <p className="text-muted mb-6">{t("notFound.detail")}</p>
          <Button
            variant="secondary"
            size="md"
            icon={<Home className="text-base" />}
            onClick={() => setLocation("/")}
          >
            {t("notFound.home")}
          </Button>
        </div>
      </div>
    </div>
  );
}
