import { Field } from "@/components/ui/StudioUI";
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
      className="mt-8 rounded-card border border-line/80 bg-surface p-5 shadow-soft sm:p-6"
      aria-label={t("wca.filters")}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <h2 className="text-base font-semibold tracking-tight text-ink">
          {t("wca.filters")}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="inline-flex flex-wrap items-center gap-1 text-xs"
            role="group"
            aria-label={t("wca.quickPeriods")}
          >
            <Button
              type="button"
              variant="outlined"
              size="plain"
              className="px-4 py-2 text-sm"
              onClick={() => jumpTo(currentYear, new Date().getMonth() + 1)}
            >
              {t("wca.thisMonth")}
            </Button>
            <Button
              type="button"
              variant="outlined"
              size="plain"
              className="px-4 py-2 text-sm"
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
              variant="outlined"
              size="plain"
              className="px-4 py-2 text-sm"
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
              className="px-3 py-1.5 text-xs"
              onClick={onReset}
            >
              {t("wca.resetFilters")}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field id="wca-year" label={t("wca.year")}>
          <Select
            id="wca-year"
            className="h-11 rounded-full px-4 py-2.5"
            value={String(year)}
            onChange={event => onYearChange(Number(event.target.value))}
          >
            {years.map(value => (
              <option key={value} value={String(value)}>
                {value}
              </option>
            ))}
          </Select>
        </Field>

        <Field id="wca-month" label={t("wca.month")}>
          <Select
            id="wca-month"
            className="h-11 rounded-full px-4 py-2.5"
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
        </Field>

        <Field id="wca-country" label={t("wca.country")}>
          <Select
            id="wca-country"
            className="h-11 rounded-full px-4 py-2.5"
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
        </Field>

        <Field
          id="wca-search"
          label={t("wca.search")}
          className="md:col-span-2"
        >
          <div className="flex h-full w-full items-stretch">
            <span className="inline-flex items-center rounded-l-full border border-r-0 border-line bg-surface-2 px-3 text-sm text-muted">
              <Search />
            </span>
            <input
              id="wca-search"
              type="search"
              className="h-full w-full rounded-r-full border border-line bg-surface px-4 py-2.5 text-sm text-ink shadow-sm outline-none transition placeholder:text-muted/60 focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
              value={query}
              placeholder={t("wca.searchPlaceholder")}
              onChange={event => onQueryChange(event.target.value)}
            />
          </div>
        </Field>
      </div>

      <p className="mt-4 text-sm text-muted" role="status" aria-live="polite">
        {shownCount < totalCount
          ? t("wca.resultsFiltered", { shown: shownCount, total: totalCount })
          : t("wca.resultsCount", { count: shownCount })}
      </p>
    </section>
  );
}
