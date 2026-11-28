import { useMemo, useState } from "react";
import { Input } from "@/components/ui/FormControls";
import { ExternalLink, PersonCircle, Search } from "@/components/ui/Icon";
import { Select } from "@/components/ui/Select";
import { EmptyState, SkeletonList, StatusFeedback } from "@/components/ui/StudioUI";
import { useLanguage } from "@/contexts/LanguageContext";
import { errorMessage } from "@/lib/apiError";
import { trpc } from "@/lib/trpc";
import { flagEmoji } from "../lib/wcaCalendar";
import { delegateCountries, filterDelegates } from "../lib/explore";

const KNOWN_STATUS = new Set(["senior_delegate", "regional_delegate", "delegate", "junior_delegate", "trainee_delegate"]);
const KNOWN_TEAM_STATUS = new Set(["leader", "senior_member", "member"]);

function ScrambleProgram() {
  const { t } = useLanguage();
  const query = trpc.wca.scrambleProgram.useQuery(undefined, { staleTime: 6 * 60 * 60 * 1000, retry: 1 });
  if (!query.data) return null;
  const { current } = query.data;
  return (
    <section className="mb-6 rounded-panel bg-surface px-4 py-3">
      <h4 className="mb-1 mt-0 text-sm font-semibold tracking-tight text-ink">{t("wcax.tnoodle.title")}</h4>
      <p className="m-0 text-sm text-ink">{t("wcax.tnoodle.current", { name: current.name })}</p>
      <p className="m-0 mt-1 text-xs text-muted">{t("wcax.tnoodle.note")}</p>
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs">
        {current.download ? (
          <a href={current.download} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-primary hover:underline">
            {t("wcax.tnoodle.download")}
            <ExternalLink className="text-xs" aria-hidden="true" />
          </a>
        ) : null}
        {current.information ? (
          <a href={current.information} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-primary hover:underline">
            {t("wcax.tnoodle.rules")}
            <ExternalLink className="text-xs" aria-hidden="true" />
          </a>
        ) : null}
      </div>
    </section>
  );
}

export function CommunityPanel() {
  const { t } = useLanguage();
  const query = trpc.wca.community.useQuery(undefined, { staleTime: 6 * 60 * 60 * 1000, retry: 1 });
  const [needle, setNeedle] = useState("");
  const [country, setCountry] = useState("");
  const delegates = query.data?.delegates ?? [];
  const countries = useMemo(() => delegateCountries(delegates), [delegates]);
  const shown = useMemo(() => filterDelegates(delegates, needle, country), [delegates, needle, country]);

  if (query.isLoading) return <SkeletonList rows={5} label={t("wcax.loading")} />;
  if (query.isError)
    return (
      <StatusFeedback tone="danger" title={t("wcax.failed")}>
        {errorMessage(query.error, t)}
      </StatusFeedback>
    );
  return (
    <div>
      <ScrambleProgram />
      <section className="mb-8">
        <h4 className="mb-1 mt-0 text-sm font-semibold tracking-tight text-ink">
          {t("wcax.delegates.title", { count: shown.length })}
        </h4>
        <p className="mb-3 mt-0 text-xs text-muted">{t("wcax.delegates.note")}</p>
        <div className="mb-4 flex flex-wrap gap-2">
          <div className="min-w-0 flex-1 sm:max-w-sm">
            <Input
              type="search"
              value={needle}
              onChange={event => setNeedle(event.target.value)}
              placeholder={t("wcax.delegates.search")}
              aria-label={t("wcax.delegates.search")}
              icon={<Search className="text-sm" />}
            />
          </div>
          <Select value={country} onChange={event => setCountry(event.target.value)} aria-label={t("wca.country")} className="w-full sm:w-56">
            <option value="">{t("wcax.delegates.allCountries")}</option>
            {countries.map(item => (
              <option key={item.iso2} value={item.iso2}>
                {flagEmoji(item.iso2)} {item.name}
              </option>
            ))}
          </Select>
        </div>
        {shown.length === 0 ? <EmptyState title={t("wcax.delegates.empty")} /> : null}
        <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {shown.slice(0, 120).map(delegate => (
            <li key={`${delegate.wcaId}-${delegate.name}`}>
              <a
                href={delegate.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-panel bg-surface px-4 py-3 hover:bg-surface-2"
              >
                {delegate.avatarUrl ? (
                  <img src={delegate.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" loading="lazy" />
                ) : (
                  <PersonCircle className="text-4xl text-muted" aria-hidden="true" />
                )}
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-ink">{delegate.name}</span>
                  <span className="block text-xs text-muted">
                    {KNOWN_STATUS.has(delegate.status) ? t(`wcax.delegate.${delegate.status}`) : delegate.status}
                    {" · "}
                    {flagEmoji(delegate.countryIso2)} {delegate.countryName}
                  </span>
                  {delegate.location ? <span className="block truncate text-xs text-muted">{delegate.location}</span> : null}
                </span>
              </a>
            </li>
          ))}
        </ul>
        {shown.length > 120 ? <p className="mt-3 text-xs text-muted">{t("wcax.delegates.more", { count: shown.length - 120 })}</p> : null}
      </section>
      <section>
        <h4 className="mb-3 mt-0 text-sm font-semibold tracking-tight text-ink">{t("wcax.teams.title")}</h4>
        <div className="grid gap-3 md:grid-cols-2">
          {(query.data?.teams ?? []).map(team => (
            <div key={team.name} className="rounded-panel bg-surface px-4 py-3">
              <h5 className="mb-2 mt-0 text-sm font-semibold text-ink">
                {team.name} <span className="font-normal text-muted">({team.members.length})</span>
              </h5>
              <ul className="m-0 flex list-none flex-col gap-0.5 p-0 text-sm">
                {team.members.map(member => (
                  <li key={`${member.wcaId}-${member.name}`} className="flex justify-between gap-2">
                    <span className="truncate">{member.name}</span>
                    <span className="shrink-0 text-xs text-muted">
                      {KNOWN_TEAM_STATUS.has(member.status) ? t(`wcax.team.${member.status}`) : member.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
