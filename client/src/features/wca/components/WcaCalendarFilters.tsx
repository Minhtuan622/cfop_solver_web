import { Search } from "@/components/ui/Icon";
import { useLanguage } from "@/contexts/LanguageContext";
import type { WcaCountry } from "../lib/wcaCalendar";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";

export type WcaCalendarFiltersProps = {
  year: number;
  month: number;
  countryIso2: string;
  countries: WcaCountry[];
  countriesLoading: boolean;
  query: string;
  onYearChange: (value: number) => void;
  onMonthChange: (value: number) => void;
  onCountryChange: (value: string) => void;
  onQueryChange: (value: string) => void;
  onReset?: () => void;
};

/**
 * The filter toolbar: a single line of controls, nothing else. The period is
 * chosen by year and month instead of a raw date range, which is how a
 * competition calendar is actually browsed. Every control carries an
 * accessible name, but no visible labels — the row stays compact.
 */
export function WcaCalendarFilters({
  year,
  month,
  countryIso2,
  countries,
  countriesLoading,
  query,
  onYearChange,
  onMonthChange,
  onCountryChange,
  onQueryChange,
  onReset,
}: WcaCalendarFiltersProps) {
  const { language, t } = useLanguage();
  const currentYear = new Date().getFullYear();
  const years = [
    currentYear - 1,
    currentYear,
    currentYear + 1,
    currentYear + 2,
  ];
  const monthNames = Array.from({ length: 12 }, (_, index) =>
    new Date(2000, index, 1).toLocaleString(
      language === "vi" ? "vi-VN" : "en-US",
      { month: "long" }
    )
  );

  const jumpTo = (nextYear: number, nextMonth: number) => {
    onYearChange(nextYear);
    onMonthChange(nextMonth);
  };

  return (
    <section
      className="mt-4 rounded-card bg-surface p-3"
      aria-label={t("wca.filters")}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <div className="flex h-9 min-w-40 flex-1 basis-48 items-stretch">
          <span className="inline-flex items-center rounded-l-full bg-surface-2 px-2.5 text-muted">
            <Search className="text-sm" />
          </span>
          <input
            id="wca-search"
            type="search"
            aria-label={t("wca.search")}
            className="h-full w-full min-w-0 rounded-r-full bg-surface px-3 text-sm text-ink transition placeholder:text-placeholder focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
            value={query}
            placeholder={t("wca.searchPlaceholder")}
            onChange={event => onQueryChange(event.target.value)}
          />
        </div>

        <Select
          id="wca-year"
          aria-label={t("wca.year")}
          className="h-9 rounded-full px-3 text-sm"
          value={String(year)}
          onChange={event => onYearChange(Number(event.target.value))}
        >
          {years.map(value => (
            <option key={value} value={String(value)}>
              {value}
            </option>
          ))}
        </Select>

        <Select
          id="wca-month"
          aria-label={t("wca.month")}
          className="h-9 rounded-full px-3 text-sm"
          value={String(month)}
          onChange={event => onMonthChange(Number(event.target.value))}
        >
          <option value={0}>{t("wca.allMonths")}</option>
          {monthNames.map((name, index) => (
            <option key={index + 1} value={String(index + 1)}>
              {name}
            </option>
          ))}
        </Select>

        <Select
          id="wca-country"
          aria-label={t("wca.country")}
          className="h-9 rounded-full px-3 text-sm"
          value={countryIso2}
          onChange={event => onCountryChange(event.target.value)}
          disabled={countriesLoading}
        >
          <option value="">
            {countriesLoading
              ? t("wca.countriesLoading")
              : t("wca.allCountries")}
          </option>
          {countries.map(country => (
            <option key={country.iso2} value={country.iso2}>
              {country.name}
            </option>
          ))}
        </Select>

        <div
          className="inline-flex items-center gap-1"
          role="group"
          aria-label={t("wca.quickPeriods")}
        >
          <Button
            type="button"
            variant="secondary"
            size="plain"
            className="px-2.5 py-1.5 text-[11px]"
            onClick={() => jumpTo(currentYear, new Date().getMonth() + 1)}
          >
            {t("wca.thisMonth")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="plain"
            className="px-2.5 py-1.5 text-[11px]"
            onClick={() => {
              const next = new Date();
              next.setMonth(next.getMonth() + 1);
              jumpTo(next.getFullYear(), next.getMonth() + 1);
            }}
          >
            {t("wca.nextMonth")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="plain"
            className="px-2.5 py-1.5 text-[11px]"
            onClick={() => jumpTo(currentYear, 0)}
          >
            {t("wca.thisYear")}
          </Button>
        </div>

        {onReset ? (
          <Button
            type="button"
            variant="link"
            size="plain"
            className="px-1.5 py-1.5 text-[11px]"
            onClick={onReset}
          >
            {t("wca.resetFilters")}
          </Button>
        ) : null}
      </div>
    </section>
  );
}
