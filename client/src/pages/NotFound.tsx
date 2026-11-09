/** Tailwind-native fallback page: concise, responsive, and consistent with the application shell. */
import { AlertCircle, Home } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/StudioUI";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-12 justify-center">
        <section className="col-span-12 md:col-span-8 lg:col-span-6">
          <div className="rounded-card border border-line/80 bg-surface shadow-soft text-center">
            <div className="p-5 sm:p-6 p-6 md:p-12">
              <AlertCircle className="text-4xl text-danger mb-4" />
              <p className="uppercase tracking-wide text-sm font-semibold text-muted mb-1">
                CFOP Solver Studio
              </p>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                404
              </h1>
              <h2 className="text-lg font-semibold tracking-tight mt-4">
                {t("notFound.title")}
              </h2>
              <p className="text-muted mb-6">{t("notFound.detail")}</p>
              <IconButton
                label={t("notFound.home")}
                icon={<Home className="text-base" />}
                onClick={() => setLocation("/")}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 border-line bg-surface text-ink hover:bg-surface-2"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
