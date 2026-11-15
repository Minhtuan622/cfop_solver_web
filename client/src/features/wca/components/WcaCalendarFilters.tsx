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
      className="mt-4 rounded-card bg-surface p-3 sm:p-4"
      aria-label={t("wca.filters")}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <h2 className="text-xs font-semibold tracking-tight text-ink mr-auto">
          {t("wca.filters")}
        </h2>
        <p
          className="text-[11px] tabular-nums text-muted"
          role="status"
          aria-live="polite"
        >
          {shownCount < totalCount
            ? t("wca.resultsFiltered", { shown: shownCount, total: totalCount })
            : t("wca.resultsCount", { count: shownCount })}
        </p>
        <div
          className="inline-flex flex-wrap items-center gap-1 text-xs"
          role="group"
          aria-label={t("wca.quickPeriods")}
        >
          <Button
            type="button"
            variant="secondary"
            size="plain"
            className="px-2.5 py-1 text-[11px]"
            onClick={() => jumpTo(currentYear, new Date().getMonth() + 1)}
          >
            {t("wca.thisMonth")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="plain"
            className="px-2.5 py-1 text-[11px]"
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
            className="px-2.5 py-1 text-[11px]"
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
            className="px-1.5 py-1 text-[11px]"
            onClick={onReset}
          >
            {t("wca.resetFilters")}
          </Button>
        ) : null}
      </div>

      <div className="mt-2 grid grid-cols-12 items-end gap-2">
        <Field
          id="wca-year"
          label={t("wca.year")}
          className="col-span-4 lg:col-span-2"
          labelClassName="mb-1 text-[11px] font-medium text-muted"
        >
          <Select
            id="wca-year"
            className="h-9 rounded-full px-3 py-1.5 text-xs"
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

        <Field
          id="wca-month"
          label={t("wca.month")}
          className="col-span-8 lg:col-span-2"
          labelClassName="mb-1 text-[11px] font-medium text-muted"
        >
          <Select
            id="wca-month"
            className="h-9 rounded-full px-3 py-1.5 text-xs"
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

        <Field
          id="wca-country"
          label={t("wca.country")}
          className="col-span-12 lg:col-span-3"
          labelClassName="mb-1 text-[11px] font-medium text-muted"
        >
          <Select
            id="wca-country"
            className="h-9 rounded-full px-3 py-1.5 text-xs"
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
          className="col-span-12 lg:col-span-5"
          labelClassName="mb-1 text-[11px] font-medium text-muted"
        >
          <div className="flex h-9 w-full items-stretch">
            <span className="inline-flex items-center rounded-l-full bg-surface-2 px-2.5 text-xs text-muted">
              <Search />
            </span>
            <input
              id="wca-search"
              type="search"
              className="h-full w-full rounded-r-full bg-surface px-3 py-1.5 text-xs text-ink transition placeholder:text-placeholder focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
              value={query}
              placeholder={t("wca.searchPlaceholder")}
              onChange={event => onQueryChange(event.target.value)}
            />
          </div>
        </Field>
      </div>
    </section>
  );
}
