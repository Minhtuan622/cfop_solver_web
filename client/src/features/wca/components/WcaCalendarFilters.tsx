import { Field } from "@/components/ui/BootstrapUI";
import { Search } from "@/components/ui/BootstrapIcon";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { RANGE_PRESETS, type WcaCountry } from "../lib/wcaCalendar";

export type WcaCalendarFiltersProps = {
  start: string;
  end: string;
  countryIso2: string;
  countries: WcaCountry[];
  countriesLoading: boolean;
  query: string;
  presetId: string;
  shownCount: number;
  totalCount: number;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onQueryChange: (value: string) => void;
  onPresetChange: (days: number) => void;
  onReset?: () => void;
};

/**
 * The toolbar that shapes the calendar: a period, a country and a search box.
 * Everything it can do is visible at once — the page never hides a control
 * behind a "filters" button.
 */
export function WcaCalendarFilters({
  start,
  end,
  countryIso2,
  countries,
  countriesLoading,
  query,
  presetId,
  shownCount,
  totalCount,
  onStartChange,
  onEndChange,
  onCountryChange,
  onQueryChange,
  onPresetChange,
  onReset,
}: WcaCalendarFiltersProps) {
  const { t } = useLanguage();

  return (
    <section className="cfop-calendar-filters" aria-label={t("wca.filters")}>
      <div className="cfop-calendar-filters__header">
        <h2 className="cfop-calendar-filters__title">{t("wca.filters")}</h2>
        {onReset ? (
          <button type="button" className="btn btn-link btn-sm p-0 text-decoration-none" onClick={onReset}>
            {t("wca.resetFilters")}
          </button>
        ) : null}
      </div>

      <div className="cfop-calendar-filters__presets">
        <span className="form-label" id="wca-preset-label">{t("wca.presets")}</span>
        <div className="btn-group btn-group-sm" role="group" aria-labelledby="wca-preset-label">
          {RANGE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              aria-pressed={preset.id === presetId}
              className={cn("btn", preset.id === presetId ? "btn-primary" : "btn-outline-secondary")}
              onClick={() => onPresetChange(preset.days)}
            >
              {t(`wca.preset.${preset.id}`)}
            </button>
          ))}
        </div>
      </div>

      <Field id="wca-from" label={t("wca.from")} className="cfop-calendar-filters__field">
        <input
          id="wca-from"
          type="date"
          className="form-control"
          value={start}
          onChange={(event) => onStartChange(event.target.value)}
        />
      </Field>

      <Field id="wca-to" label={t("wca.to")} className="cfop-calendar-filters__field">
        <input
          id="wca-to"
          type="date"
          className="form-control"
          min={start}
          value={end}
          onChange={(event) => onEndChange(event.target.value)}
        />
      </Field>

      <Field id="wca-country" label={t("wca.country")} className="cfop-calendar-filters__field">
        <select
          id="wca-country"
          className="form-select"
          value={countryIso2}
          onChange={(event) => onCountryChange(event.target.value)}
          disabled={countriesLoading}
        >
          <option value="">{countriesLoading ? t("wca.countriesLoading") : t("wca.allCountries")}</option>
          {countries.map((country) => (
            <option key={country.iso2} value={country.iso2}>{country.name}</option>
          ))}
        </select>
      </Field>

      <Field id="wca-search" label={t("wca.search")} className="cfop-calendar-filters__field cfop-calendar-filters__field--wide">
        <div className="input-group">
          <span className="input-group-text"><Search /></span>
          <input
            id="wca-search"
            type="search"
            className="form-control"
            value={query}
            placeholder={t("wca.searchPlaceholder")}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </div>
      </Field>

      <p className="cfop-calendar-filters__count" role="status" aria-live="polite">
        {shownCount < totalCount
          ? t("wca.resultsFiltered", { shown: shownCount, total: totalCount })
          : t("wca.resultsCount", { count: shownCount })}
      </p>
    </section>
  );
}
