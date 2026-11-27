import { buttonClass } from "@/components/ui/Button";
import { PageHeader, SectionCard } from "@/components/ui/StudioUI";
import { useLanguage } from "@/contexts/LanguageContext";
import { REPOSITORY_URL } from "@/features/info/lib/links";

const FEATURES = ["solve", "timer", "study", "compete"] as const;

export default function About() {
  const { t } = useLanguage();
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-4 sm:px-6 lg:px-8">
      <PageHeader title={t("about.title")} description={t("about.subtitle")} />
      <div className="flex flex-col gap-6">
        <SectionCard title={t("about.mission.title")}>
          <p className="mb-0 text-sm leading-relaxed text-ink">
            {t("about.mission.body")}
          </p>
        </SectionCard>
        <SectionCard title={t("about.features.title")}>
          <ul className="m-0 flex list-disc flex-col gap-2 pl-5 text-sm leading-relaxed text-ink">
            {FEATURES.map(feature => (
              <li key={feature}>{t(`about.features.${feature}`)}</li>
            ))}
          </ul>
        </SectionCard>
        <SectionCard title={t("about.tech.title")}>
          <p className="mb-0 text-sm leading-relaxed text-ink">
            {t("about.tech.body")}
          </p>
        </SectionCard>
        <SectionCard title={t("about.open.title")}>
          <div className="flex flex-col items-start gap-4">
            <p className="mb-0 text-sm leading-relaxed text-ink">{t("about.open.body")}</p>
            <a
              className={buttonClass("primary", "md")}
              href={REPOSITORY_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("about.open.link")}
            </a>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
