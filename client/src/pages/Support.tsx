import { Link } from "wouter";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/StudioLayout";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Support() {
  const { t } = useLanguage();

  return (
    <section className="mx-auto max-w-[88rem] px-3 pb-10 pt-6 sm:px-5">
      <PageHeader
        eyebrow={t("support.eyebrow")}
        title={t("support.title")}
        description={t("support.subtitle")}
      />
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="space-y-3">
          <h3 className="text-sm font-semibold tracking-tight text-ink">
            {t("support.cta.github")}
          </h3>
          <p className="text-sm text-muted">{t("support.cta.githubDesc")}</p>
          <Button variant="soft" size="sm">
            GitHub Sponsors
          </Button>
        </Card>
        <Card className="space-y-3">
          <h3 className="text-sm font-semibold tracking-tight text-ink">
            {t("support.cta.feedback")}
          </h3>
          <p className="text-sm text-muted">{t("support.cta.feedbackDesc")}</p>
          <Link href="/rooms" className="block">
            <Button variant="soft" size="sm">
              {t("support.cta.feedbackAction")}
            </Button>
          </Link>
        </Card>
        <Card className="space-y-3">
          <h3 className="text-sm font-semibold tracking-tight text-ink">
            {t("support.cta.share")}
          </h3>
          <p className="text-sm text-muted">{t("support.cta.shareDesc")}</p>
        </Card>
      </div>
      <section className="mt-8 rounded-card bg-surface p-5 sm:p-6">
        <h2 className="text-sm font-semibold tracking-tight text-ink">
          {t("support.donate.title")}
        </h2>
        <p className="mt-3 text-sm text-muted">{t("support.donate.desc")}</p>
        <ul className="mt-3 list-inside space-y-1 text-sm text-muted">
          <li>{t("support.donate.email")}</li>
          <li>{t("support.donate.encourage")}</li>
        </ul>
      </section>
    </section>
  );
}
