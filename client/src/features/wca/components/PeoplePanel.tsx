import { useState, type FormEvent } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormControls";
import { PersonCircle, Search } from "@/components/ui/Icon";
import { EmptyState, SkeletonList, StatusFeedback } from "@/components/ui/StudioUI";
import { useLanguage } from "@/contexts/LanguageContext";
import { errorMessage } from "@/lib/apiError";
import { trpc } from "@/lib/trpc";
import { flagEmoji, formatDayRange } from "../lib/wcaCalendar";

export function PeoplePanel() {
  const { language, t } = useLanguage();
  const [draft, setDraft] = useState("");
  const [term, setTerm] = useState("");
  const query = trpc.wca.search.useQuery({ q: term }, { enabled: term.length >= 2, staleTime: 10 * 60 * 1000, retry: false });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setTerm(draft.trim());
  };
  const data = query.data;
  return (
    <div>
      <p className="mb-4 mt-0 text-sm text-muted">{t("wcax.search.hint")}</p>
      <form onSubmit={submit} className="mb-5 flex flex-wrap gap-2" role="search">
        <div className="min-w-0 flex-1 sm:max-w-md">
          <Input
            type="search"
            value={draft}
            onChange={event => setDraft(event.target.value)}
            placeholder={t("wcax.search.placeholder")}
            aria-label={t("wcax.search.placeholder")}
            icon={<Search className="text-sm" />}
            maxLength={60}
          />
        </div>
        <Button type="submit" variant="primary" size="md" disabled={draft.trim().length < 2}>
          {t("wcax.search.submit")}
        </Button>
      </form>
      {query.isLoading ? <SkeletonList rows={3} label={t("wcax.loading")} /> : null}
      {query.isError ? (
        <StatusFeedback tone="danger" title={t("wcax.failed")}>
          {errorMessage(query.error, t)}
        </StatusFeedback>
      ) : null}
      {data && data.people.length === 0 && data.competitions.length === 0 ? (
        <EmptyState title={t("wcax.search.empty")} />
      ) : null}
      {data && data.people.length > 0 ? (
        <section className="mb-6">
          <h4 className="mb-2 mt-0 text-sm font-semibold tracking-tight text-ink">
            {t("wcax.search.people", { count: data.people.length })}
          </h4>
          <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
            {data.people.map(person => (
              <li key={person.wcaId}>
                <Link
                  href={`/wca/persons/${person.wcaId}`}
                  className="flex items-center gap-3 rounded-panel bg-surface px-4 py-3 hover:bg-surface-2"
                >
                  {person.avatarUrl ? (
                    <img src={person.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" loading="lazy" />
                  ) : (
                    <PersonCircle className="text-4xl text-muted" aria-hidden="true" />
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-ink">{person.name}</span>
                    <span className="block text-xs text-muted">
                      {person.wcaId} · {flagEmoji(person.countryIso2)} {person.countryName}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {data && data.competitions.length > 0 ? (
        <section>
          <h4 className="mb-2 mt-0 text-sm font-semibold tracking-tight text-ink">
            {t("wcax.search.competitions", { count: data.competitions.length })}
          </h4>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {data.competitions.map(competition => {
              const range = competition.startDate ? formatDayRange(competition.startDate, competition.endDate || competition.startDate, language) : null;
              return (
                <li key={competition.id}>
                  <Link
                    href={`/wca/competitions/${competition.id}`}
                    className="block rounded-panel bg-surface px-4 py-3 hover:bg-surface-2"
                  >
                    <span className="block text-sm font-semibold text-ink">{competition.name}</span>
                    <span className="block text-xs text-muted">
                      {range ? `${range.days} ${range.months} · ` : ""}
                      {flagEmoji(competition.countryIso2)} {competition.city}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
