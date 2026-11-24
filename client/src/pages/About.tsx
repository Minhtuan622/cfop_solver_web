import { Link } from "wouter";
import {
  ArrowRight,
  BoxSeam,
  Play,
  Search,
  Timer,
} from "@/components/ui/Icon";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader } from "@/components/ui/StudioLayout";

type Feature = {
  key: string;
  icon: typeof Search;
  to: string;
};

export default function About() {
  const { t } = useLanguage();

  const features: Feature[] = [
    { key: "about.feature.solve", icon: Search, to: "/" },
    { key: "about.feature.timer", icon: Timer, to: "/timer" },
    { key: "about.feature.history", icon: Play, to: "/history" },
    { key: "about.feature.study", icon: Search, to: "/study" },
    { key: "about.feature.verify", icon: Search, to: "/settings" },
    { key: "about.feature.3d", icon: Search, to: "/play" },
    { key: "about.feature.bld", icon: Search, to: "/study" },
    { key: "about.feature.rooms", icon: Play, to: "/rooms" },
    { key: "about.feature.leaderboard", icon: Search, to: "/competition" },
    { key: "about.feature.wca", icon: BoxSeam, to: "/wca" },
    { key: "about.feature.share", icon: Play, to: "/timer" },
  ];

  return (
    <section className="mx-auto max-w-[88rem] px-3 pb-10 pt-6 sm:px-5">
      <PageHeader
        eyebrow={t("about.title")}
        title={t("about.title")}
        description={t("about.subtitle")}
      />

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">
          {t("about.features.title")}
        </h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(item => {
            const Icon = item.icon;
            return (
              <li key={item.key}>
                <Link
                  href={item.to}
                  className="group flex h-full items-center gap-3 rounded-card bg-surface px-4 py-3.5 transition hover:bg-surface-2"
                >
                  <Icon className="text-lg text-primary" />
                  <span className="text-sm text-ink leading-snug">{t(item.key)}</span>
                  <ArrowRight className="ml-auto text-sm text-muted opacity-0 transition group-hover:opacity-100" />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <section className="rounded-card bg-surface p-5 sm:p-6">
          <h3 className="text-sm font-semibold tracking-tight text-ink">
            {t("about.technology")}
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>{t("about.tech.web")}</li>
            <li>{t("about.tech.solver")}</li>
          </ul>
        </section>
        <section className="rounded-card bg-surface p-5 sm:p-6">
          <h3 className="text-sm font-semibold tracking-tight text-ink">
            {t("about.privacy")}
          </h3>
          <p className="mt-3 text-sm text-muted">{t("about.privacy.desc")}</p>
        </section>
        <section className="rounded-card bg-surface p-5 sm:p-6">
          <h3 className="text-sm font-semibold tracking-tight text-ink">
            {t("about.cta")}
          </h3>
          <div className="mt-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition hover:bg-primary-hover"
            >
              {t("about.ctaAction")}
              <ArrowRight className="text-base" />
            </Link>
          </div>
        </section>
      </section>
    </section>
  );
}
