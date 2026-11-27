import { buttonClass } from "@/components/ui/Button";
import { PageHeader, SectionCard } from "@/components/ui/StudioUI";
import { useLanguage } from "@/contexts/LanguageContext";
import { DONATE_LINKS, ISSUES_URL, REPOSITORY_URL } from "@/features/info/lib/links";

const FREE_WAYS = ["star", "share", "report", "contribute"] as const;

export default function Donate() {
  const { t } = useLanguage();
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-4 sm:px-6 lg:px-8">
      <PageHeader title={t("donate.title")} description={t("donate.subtitle")} />
      <div className="flex flex-col gap-6">
        <SectionCard title={t("donate.money.title")}>
          <div className="flex flex-col items-start gap-4">
            <p className="mb-0 text-sm leading-relaxed text-ink">{t("donate.money.body")}</p>
            {DONATE_LINKS.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {DONATE_LINKS.map(link => (
                  <a
                    key={link.id}
                    className={buttonClass("primary", "md")}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            ) : (
              <p className="mb-0 text-sm text-muted">{t("donate.money.none")}</p>
            )}
          </div>
        </SectionCard>
        <SectionCard title={t("donate.free.title")}>
          <div className="flex flex-col items-start gap-4">
            <ul className="m-0 flex list-disc flex-col gap-2 pl-5 text-sm leading-relaxed text-ink">
              {FREE_WAYS.map(way => (
                <li key={way}>
                  {t(`donate.free.${way}`)}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <a
                className={buttonClass("outline", "md")}
                href={REPOSITORY_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("donate.github")}
              </a>
              <a
                className={buttonClass("outline", "md")}
                href={ISSUES_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Issues
              </a>
            </div>
          </div>
        </SectionCard>
        <p className="mb-0 text-center text-sm font-medium text-muted">{t("donate.thanks")}</p>
      </div>
    </div>
  );
}
