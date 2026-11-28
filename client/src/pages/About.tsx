import { Link } from "wouter";
import { buttonClass } from "@/components/ui/Button";
import { ArrowRight, BookOpenCheck, ExternalLink, Puzzle, Timer, Trophy } from "@/components/ui/Icon";
import { SectionCard } from "@/components/ui/StudioUI";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { InfoIconBox } from "@/features/info/components/InfoIconBox";
import { REPOSITORY_URL } from "@/features/info/lib/links";

const FEATURES = [
  { id: "solve", icon: Puzzle, href: "/" },
  { id: "timer", icon: Timer, href: "/timer" },
  { id: "study", icon: BookOpenCheck, href: "/study" },
  { id: "compete", icon: Trophy, href: "/rooms" },
] as const;

export default function About() {
  const { t } = useLanguage();
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="rounded-card bg-surface px-6 py-10 sm:px-10 sm:py-14">
        <span className="inline-flex rounded-full bg-surface-2 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          {t("about.eyebrow")}
        </span>
        <h1 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight text-ink sm:text-5xl">
          {t("about.hero.title")}
        </h1>
        <p className="mb-0 mt-3 max-w-2xl text-base leading-relaxed text-muted">
          {t("about.subtitle")}
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link href="/" className={cn(buttonClass("primary", "md"), "w-full sm:w-auto")}>
            {t("about.hero.cta")}
            <ArrowRight aria-hidden="true" />
          </Link>
          <a
            className={cn(buttonClass("secondary", "md"), "w-full sm:w-auto")}
            href={REPOSITORY_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("about.open.link")}
            <ExternalLink aria-hidden="true" />
          </a>
        </div>
      </header>

      <section aria-labelledby="about-features">
        <h2 id="about-features" className="sr-only">
          {t("about.features.title")}
        </h2>
        <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2">
          {FEATURES.map(feature => (
            <li key={feature.id} className="flex">
              <Link
                href={feature.href}
                className="flex w-full gap-4 rounded-card bg-surface p-5 transition-colors hover:bg-surface-2 sm:p-6"
              >
                <InfoIconBox icon={feature.icon} />
                <span className="min-w-0">
                  <span className="block text-base font-semibold text-ink">
                    {t(`about.featureTitle.${feature.id}`)}
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-muted">
                    {t(`about.features.${feature.id}`)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SectionCard title={t("about.mission.title")}>
          <p className="mb-0 text-sm leading-relaxed text-ink">{t("about.mission.body")}</p>
        </SectionCard>
        <SectionCard title={t("about.tech.title")}>
          <p className="mb-0 text-sm leading-relaxed text-ink">{t("about.tech.body")}</p>
        </SectionCard>
      </div>

      <section className="flex flex-col items-start gap-3 rounded-card bg-primary-soft p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h2 className="m-0 text-lg font-semibold text-ink">{t("about.open.title")}</h2>
          <p className="m-0 mt-1 max-w-xl text-sm leading-relaxed text-ink">{t("about.open.body")}</p>
        </div>
        <a
          className={buttonClass("primary", "md")}
          href={REPOSITORY_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("about.open.link")}
          <ExternalLink aria-hidden="true" />
        </a>
      </section>
    </div>
  );
}
