import { Field } from "@/components/ui/BootstrapUI";
import { Search } from "@/components/ui/BootstrapIcon";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import type { WcaCountry } from "../lib/wcaCalendar";

export type WcaCalendarFiltersProps = {
  year: number;
  month: number;
  countryIso2: string;
  countries: WcaCountry[];
  countriesLoading: boolean;
  query: string;
  shownCount: number;
  totalCount: number;
  onYearChange: (value: number) => void;
  onMonthChange: (value: number) => void;
  onCountryChange: (value: string) => void;
  onQueryChange: (value: string) => void;
  onReset?: () => void;
};

/**
 * The filter toolbar. The period is chosen by year and month instead of a raw
 * date range, which is how a competition calendar is actually browsed.
 */
export function WcaCalendarFilters({
  year,
  month,
  countryIso2,
  countries,
  countriesLoading,
  query,
  shownCount,
  totalCount,
  onYearChange,
  onMonthChange,
  onCountryChange,
  onQueryChange,
  onReset,
}: WcaCalendarFiltersProps) {
  const { language, t } = useLanguage();
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];
  const monthNames = Array.from({ length: 12 }, (_, index) =>
    new Date(2000, index, 1).toLocaleString(language === "vi" ? "vi-VN" : "en-US", { month: "long" }),
  );

  const jumpTo = (nextYear: number, nextMonth: number) => {
    onYearChange(nextYear);
    onMonthChange(nextMonth);
  };

  return (
    <section className="cfop-calendar-filters" aria-label={t("wca.filters")}>
      <div className="cfop-calendar-filters__header">
        <h2 className="cfop-calendar-filters__title">{t("wca.filters")}</h2>
        <div className="d-flex align-items-center gap-2">
          <div className="btn-group btn-group-sm" role="group" aria-label={t("wca.quickPeriods")}>
            <button type="button" className="btn btn-outline-secondary" onClick={() => jumpTo(currentYear, new Date().getMonth() + 1)}>
              {t("wca.thisMonth")}
            </button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => {
              const next = new Date();
              next.setMonth(next.getMonth() + 1);
              jumpTo(next.getFullYear(), next.getMonth() + 1);
            }}>
              {t("wca.nextMonth")}
            </button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => jumpTo(currentYear, 0)}>
              {t("wca.thisYear")}
            </button>
          </div>
          {onReset ? (
            <button type="button" className="btn btn-link btn-sm p-0 text-decoration-none" onClick={onReset}>
              {t("wca.resetFilters")}
            </button>
          ) : null}
        </div>
      </div>

      <Field id="wca-year" label={t("wca.year")} className="cfop-calendar-filters__field">
        <select
          id="wca-year"
          className="form-select"
          value={year}
          onChange={(event) => onYearChange(Number(event.target.value))}
        >
          {years.map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>
      </Field>

      <Field id="wca-month" label={t("wca.month")} className="cfop-calendar-filters__field">
        <select
          id="wca-month"
          className="form-select"
          value={month}
          onChange={(event) => onMonthChange(Number(event.target.value))}
        >
          <option value={0}>{t("wca.allMonths")}</option>
          {monthNames.map((name, index) => (
            <option key={index + 1} value={index + 1}>{name}</option>
          ))}
        </select>
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