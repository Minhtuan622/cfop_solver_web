import { buttonClass } from "@/components/ui/Button";
import { Bug, Code2, GitPullRequest, Share2, Star } from "@/components/ui/Icon";
import { PageHeader, SectionCard } from "@/components/ui/StudioUI";
import { useLanguage } from "@/contexts/LanguageContext";
import { DonateQrPanel } from "@/features/info/components/DonateQrPanel";
import { InfoIconBox } from "@/features/info/components/InfoIconBox";
import { DONATE_LINKS, DONATE_QR, ISSUES_URL, REPOSITORY_URL } from "@/features/info/lib/links";

const FREE_WAYS = [
  { id: "star", icon: Star },
  { id: "share", icon: Share2 },
  { id: "report", icon: Bug },
  { id: "contribute", icon: GitPullRequest },
] as const;

export default function Donate() {
  const { t } = useLanguage();
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
      <PageHeader title={t("donate.title")} description={t("donate.subtitle")} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr]">
        <SectionCard title={t("donate.money.title")} description={t("donate.money.body")}>
          <div className="flex flex-col gap-4">
            <DonateQrPanel items={DONATE_QR} />
            {DONATE_LINKS.length > 0 ? (
              <div className="flex flex-wrap justify-center gap-2">
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
            ) : null}
          </div>
        </SectionCard>
        <SectionCard title={t("donate.free.title")}>
          <div className="flex flex-col gap-4">
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {FREE_WAYS.map(way => (
                <li key={way.id} className="flex items-center gap-3 rounded-2xl px-2 py-2.5">
                  <InfoIconBox icon={way.icon} />
                  <div>
                    <p className="m-0 text-sm font-semibold text-ink">{t(`donate.free.${way.id}Title`)}</p>
                    <p className="m-0 text-sm text-muted">{t(`donate.free.${way.id}`)}</p>
                  </div>
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
                <Code2 aria-hidden="true" />
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
      </div>
      <p className="mb-0 mt-6 text-center text-sm font-medium text-muted">{t("donate.thanks")}</p>
    </div>
  );
}
