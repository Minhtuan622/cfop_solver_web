import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/Button";
import { ExternalLink, GeoAlt } from "@/components/ui/Icon";
import { Select } from "@/components/ui/Select";
import { EmptyState, SkeletonList, StatusFeedback } from "@/components/ui/StudioUI";
import { useLanguage } from "@/contexts/LanguageContext";
import { errorMessage } from "@/lib/apiError";
import { trpc } from "@/lib/trpc";
import { wcaEventShortName } from "@/lib/wcaEvents";
import { cn } from "@/lib/utils";
import { flagEmoji, formatDayRange } from "../lib/wcaCalendar";
import { daysUntil, formatDateTime, formatEntryFee, registrationState } from "../lib/myCompetitions";
import { defaultCountry, distanceLabel, type NearbyCompetition } from "../lib/explore";

const PAGE = 12;

function NearbyCard({ item }: { item: NearbyCompetition }) {
  const { language, t } = useLanguage();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const range = formatDayRange(item.startDate, item.endDate, language);
  const reg = registrationState(item, now, today);
  const days = daysUntil(item.startDate, today);
  const fee = formatEntryFee(item.entryFee, language);
  const close = formatDateTime(item.registrationClose, language);
  const open = formatDateTime(item.registrationOpen, language);
  const distance = distanceLabel(item.distanceKm);
  return (
    <li className="rounded-panel bg-surface px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <Link href={`/wca/competitions/${item.id}`} className="text-sm font-semibold text-ink hover:text-primary hover:underline">
            {item.name}
          </Link>
          <p className="m-0 mt-0.5 text-xs text-muted">
            {range.days} {range.months} · {flagEmoji(item.countryIso2)} {item.city}
            {item.venue ? ` · ${item.venue}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-muted">{days <= 0 ? t("wcax.nearby.today") : t("wcax.nearby.inDays", { count: days })}</span>
          {distance ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-primary">
              <GeoAlt className="text-xs" aria-hidden="true" />
              {distance}
            </span>
          ) : null}
          <span
            className={cn(
              "rounded-full px-2 py-0.5",
              reg === "open" && "bg-success-soft text-success",
              reg === "notYet" && "bg-warning-soft text-ink",
              (reg === "closed" || reg === "unknown") && "bg-surface-2 text-muted"
            )}
          >
            {t(`wca.mine.reg.${reg}`)}
          </span>
        </div>
      </div>
      <dl className="m-0 mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted">
        {fee ? <div>{t("wca.mine.fee")}: <span className="text-ink">{fee}</span></div> : null}
        {item.competitorLimit ? <div>{t("wca.mine.limit")}: <span className="text-ink">{item.competitorLimit}</span></div> : null}
        {open ? <div>{t("wcax.nearby.regOpens")}: <span className="text-ink">{open}</span></div> : null}
        {close ? <div>{t("wcax.nearby.regCloses")}: <span className="text-ink">{close}</span></div> : null}
      </dl>
      <p className="m-0 mt-2 text-xs text-muted">{item.eventIds.map(id => wcaEventShortName(id, language)).join(" · ")}</p>
      <a href={item.wcaUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
        {t("wca.mine.link.wca")}
        <ExternalLink className="text-xs" aria-hidden="true" />
      </a>
    </li>
  );
}

export function NearbyPanel() {
  const { language, t } = useLanguage();
  const profile = trpc.cfopAccount.wca.profile.useQuery(undefined, { staleTime: 10 * 60 * 1000, retry: false });
  const countries = trpc.wca.countries.useQuery(undefined, { staleTime: 24 * 60 * 60 * 1000, retry: 1 });
  const [picked, setPicked] = useState("");
  const [origin, setOrigin] = useState<{ latitude: number; longitude: number } | null>(null);
  const [geoError, setGeoError] = useState(false);
  const [shown, setShown] = useState(PAGE);
  const countryIso2 = picked || defaultCountry(language, profile.data?.countryIso2);
  const query = trpc.wca.nearby.useQuery({ countryIso2, ...(origin ?? {}) }, { staleTime: 10 * 60 * 1000, retry: 1 });

  const locate = () => {
    setGeoError(false);
    if (!navigator.geolocation) return setGeoError(true);
    navigator.geolocation.getCurrentPosition(
      position => setOrigin({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      () => setGeoError(true),
      { maximumAge: 10 * 60 * 1000, timeout: 10_000 }
    );
  };

  const list = query.data ?? [];
  return (
    <div>
      <p className="mb-4 mt-0 text-sm text-muted">{t("wcax.nearby.hint")}</p>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Select
          value={countryIso2}
          onChange={event => {
            setPicked(event.target.value);
            setShown(PAGE);
          }}
          aria-label={t("wca.country")}
          className="w-full sm:w-64"
        >
          {(countries.data ?? [{ iso2: countryIso2, name: countryIso2, id: countryIso2 }]).map(country => (
            <option key={country.iso2} value={country.iso2}>
              {flagEmoji(country.iso2)} {country.name}
            </option>
          ))}
        </Select>
        <Button type="button" variant={origin ? "primary" : "secondary"} size="sm" onClick={origin ? () => setOrigin(null) : locate}>
          <GeoAlt className="text-sm" aria-hidden="true" />
          {origin ? t("wcax.nearby.sortByDate") : t("wcax.nearby.useLocation")}
        </Button>
      </div>
      {geoError ? <p className="mb-3 mt-0 text-xs text-danger">{t("wcax.nearby.locationDenied")}</p> : null}
      {query.isLoading ? <SkeletonList rows={4} label={t("wca.loading")} /> : null}
      {query.isError ? (
        <StatusFeedback tone="danger" title={t("wca.loadFailed")}>
          {errorMessage(query.error, t)}
        </StatusFeedback>
      ) : null}
      {query.data && list.length === 0 ? <EmptyState title={t("wcax.nearby.empty")} /> : null}
      {list.length > 0 ? (
        <>
          <p className="mb-2 mt-0 text-xs text-muted" role="status">
            {t("wcax.nearby.count", { count: list.length })}
          </p>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {list.slice(0, shown).map(item => (
              <NearbyCard key={item.id} item={item} />
            ))}
          </ul>
          {shown < list.length ? (
            <div className="mt-4 flex justify-center">
              <Button type="button" variant="secondary" size="sm" onClick={() => setShown(value => value + PAGE)}>
                {t("wca.mine.loadMore")}
              </Button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
