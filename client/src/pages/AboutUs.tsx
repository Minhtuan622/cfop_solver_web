import { Link } from "wouter";
import { Button } from "@/components/ui/Button";
import { BoxSeam } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/StudioLayout";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AboutUs() {
  const { t } = useLanguage();

  return (
    <section className="mx-auto max-w-[88rem] px-3 pb-10 pt-6 sm:px-5">
      <PageHeader
        eyebrow={t("aboutUs.eyebrow")}
        title={t("aboutUs.title")}
        description={t("aboutUs.subtitle")}
      />
      <section className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <section className="rounded-card bg-surface p-5 sm:p-6">
          <BoxSeam className="text-xl text-primary" />
          <h3 className="mt-3 text-sm font-semibold tracking-tight text-ink">
            {t("aboutUs.mission")}
          </h3>
          <p className="mt-2 text-sm text-muted">{t("aboutUs.missionDesc")}</p>
        </section>
        <section className="rounded-card bg-surface p-5 sm:p-6">
          <h3 className="text-sm font-semibold tracking-tight text-ink">
            {t("aboutUs.valuesTitle")}
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>{t("aboutUs.value1")}</li>
            <li>{t("aboutUs.value2")}</li>
            <li>{t("aboutUs.value3")}</li>
          </ul>
        </section>
        <section className="rounded-card bg-surface p-5 sm:p-6">
          <h3 className="text-sm font-semibold tracking-tight text-ink">
            {t("aboutUs.techTitle")}
          </h3>
          <p className="mt-3 text-sm text-muted">{t("aboutUs.techDesc")}</p>
        </section>
      </section>
      <div className="mt-8 flex flex-wrap gap-2">
        <Link href="/about">
          <Button variant="soft" size="sm">
            {t("aboutUs.viewFeatures")}
          </Button>
        </Link>
        <Link href="/support">
          <Button variant="soft" size="sm">
            {t("aboutUs.support")}
          </Button>
        </Link>
      </div>
    </section>
  );
}
