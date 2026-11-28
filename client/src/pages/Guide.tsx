import { useEffect, useState } from "react";
import { Link } from "wouter";
import { buttonClass } from "@/components/ui/Button";
import {
  BarChart3,
  BookOpenCheck,
  Globe,
  PersonCircle,
  Puzzle,
  Rotate3D,
  Settings,
  Swords,
  Timer,
  Trophy,
} from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/StudioUI";
import { useLanguage } from "@/contexts/LanguageContext";
import { InfoIconBox } from "@/features/info/components/InfoIconBox";
import { cn } from "@/lib/utils";

type Section = { id: string; icon: typeof Puzzle; href: string | null };

const GROUPS: ReadonlyArray<{ id: string; sections: readonly Section[] }> = [
  {
    id: "learn",
    sections: [
      { id: "solve", icon: Puzzle, href: "/" },
      { id: "study", icon: BookOpenCheck, href: "/study" },
      { id: "play", icon: Rotate3D, href: "/play" },
    ],
  },
  {
    id: "practice",
    sections: [
      { id: "timer", icon: Timer, href: "/timer" },
      { id: "history", icon: BarChart3, href: "/history" },
    ],
  },
  {
    id: "compete",
    sections: [
      { id: "rooms", icon: Swords, href: "/rooms" },
      { id: "rankings", icon: Trophy, href: "/competition" },
    ],
  },
  {
    id: "wca",
    sections: [
      { id: "wca", icon: Globe, href: "/wca" },
      { id: "settings", icon: Settings, href: "/settings" },
      { id: "account", icon: PersonCircle, href: null },
    ],
  },
];

const groupAnchor = (id: string) => `guide-group-${id}`;

export default function Guide() {
  const { t } = useLanguage();
  const [active, setActive] = useState(GROUPS[0].id);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(entry => entry.isIntersecting);
        if (visible.length === 0) return;
        const top = visible.reduce((best, entry) =>
          entry.boundingClientRect.top < best.boundingClientRect.top ? entry : best
        );
        const group = GROUPS.find(item => groupAnchor(item.id) === top.target.id);
        if (group) setActive(group.id);
      },
      { rootMargin: "-20% 0px -60% 0px" }
    );
    for (const group of GROUPS) {
      const node = document.getElementById(groupAnchor(group.id));
      if (node) observer.observe(node);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
      <PageHeader title={t("guide.title")} description={t("guide.subtitle")} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[14rem_1fr]">
        <nav aria-label={t("guide.toc")} className="lg:sticky lg:top-24 lg:self-start">
          <ul className="m-0 grid list-none grid-cols-2 gap-1 p-0 lg:flex lg:flex-col">
            {GROUPS.map(group => (
              <li key={group.id}>
                <a
                  href={`#${groupAnchor(group.id)}`}
                  aria-current={active === group.id ? "true" : undefined}
                  onClick={() => setActive(group.id)}
                  className={cn(
                    "block rounded-full px-4 py-2 text-center text-sm font-medium transition-colors lg:text-left",
                    active === group.id
                      ? "bg-primary text-on-primary"
                      : "text-muted hover:bg-surface hover:text-ink"
                  )}
                >
                  {t(`guide.group.${group.id}`)}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex flex-col gap-6">
          {GROUPS.map(group => (
            <div key={group.id} id={groupAnchor(group.id)} className="scroll-mt-24">
              <section
                aria-labelledby={`${groupAnchor(group.id)}-title`}
                className="rounded-card bg-surface p-5 sm:p-6"
              >
                <h2
                  id={`${groupAnchor(group.id)}-title`}
                  className="m-0 mb-2 text-lg font-semibold text-ink"
                >
                  {t(`guide.group.${group.id}`)}
                </h2>
                <ul className="m-0 flex list-none flex-col gap-1 p-0">
                  {group.sections.map(section => (
                    <li
                      key={section.id}
                      className="flex flex-col gap-3 rounded-2xl px-2 py-3 sm:flex-row sm:items-center sm:gap-4"
                    >
                      <div className="flex min-w-0 flex-1 items-start gap-4">
                        <InfoIconBox icon={section.icon} />
                        <div className="min-w-0">
                          <h3 className="m-0 text-sm font-semibold text-ink">
                            {t(`guide.${section.id}.title`)}
                          </h3>
                          <p className="m-0 text-sm leading-relaxed text-muted">
                            {t(`guide.${section.id}.summary`)}
                          </p>
                        </div>
                      </div>
                      {section.href ? (
                        <Link
                          href={section.href}
                          className={cn(buttonClass("outline", "sm"), "self-start sm:self-center")}
                        >
                          {t("guide.open")}
                        </Link>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
