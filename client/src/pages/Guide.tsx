import { Link } from "wouter";
import { buttonClass } from "@/components/ui/Button";
import { PageHeader, SectionCard } from "@/components/ui/StudioUI";
import { useLanguage } from "@/contexts/LanguageContext";

const SECTIONS = [
  { id: "solve", href: "/" },
  { id: "timer", href: "/timer" },
  { id: "history", href: "/history" },
  { id: "study", href: "/study" },
  { id: "play", href: "/play" },
  { id: "rooms", href: "/rooms" },
  { id: "rankings", href: "/competition" },
  { id: "wca", href: "/wca" },
  { id: "settings", href: "/settings" },
  { id: "account", href: null },
] as const;

export default function Guide() {
  const { t } = useLanguage();
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
      <PageHeader title={t("guide.title")} description={t("guide.subtitle")} />
      <ol className="m-0 grid list-none grid-cols-1 gap-6 p-0 md:grid-cols-2">
        {SECTIONS.map(section => (
          <li key={section.id} className="flex">
            <SectionCard title={t(`guide.${section.id}.title`)} className="w-full">
              <div className="flex flex-col items-start gap-4">
                <p className="mb-0 text-sm leading-relaxed text-ink">
                  {t(`guide.${section.id}.body`)}
                </p>
                {section.href ? (
                  <Link href={section.href} className={buttonClass("outline", "sm")}>
                    {t("guide.open")}
                  </Link>
                ) : null}
              </div>
            </SectionCard>
          </li>
        ))}
      </ol>
    </div>
  );
}
