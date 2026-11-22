import { Calendar3, Search } from "@/components/ui/Icon";
import { useLanguage } from "@/contexts/LanguageContext";
import type { WcaCountry } from "../lib/wcaCalendar";
import { Button } from "@/components/ui/Button";
import { Dropdown, DropdownItem } from "@/components/ui/Dropdown";
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
      {/* Điện thoại: ô tìm một hàng, các bộ lọc xếp lưới 2 cột cho thẳng mép.
          Màn rộng: tất cả trên một hàng. */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-0 sm:min-w-48 sm:flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted"
            aria-hidden="true"
          />
          <input
            id="wca-search"
            type="search"
            aria-label={t("wca.search")}
            className="h-10 w-full min-w-0 rounded-full bg-surface-2 pl-9 pr-3 text-sm text-ink transition-colors placeholder:text-placeholder hover:bg-surface-3 focus:bg-surface-3 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            value={query}
            placeholder={t("wca.searchPlaceholder")}
            onChange={event => onQueryChange(event.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <Select
            id="wca-year"
            aria-label={t("wca.year")}
            className="min-w-0 sm:w-auto"
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
            className="min-w-0 sm:w-auto"
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
            className="min-w-0 sm:w-auto"
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

          <Dropdown
            id="wca-quick-periods"
            align="start"
            variant="soft"
            label={t("wca.quickPeriods")}
            title={t("wca.quickPeriods")}
            menuLabel={t("wca.quickPeriods")}
            buttonClassName="h-10 w-full justify-center px-3 py-0 text-xs font-semibold sm:w-auto"
            button={
              <>
                <Calendar3 className="text-sm" />
                <span>{t("wca.quickPeriods")}</span>
              </>
            }
          >
            <DropdownItem asChild>
              <button
                type="button"
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-ink outline-none transition-colors data-[highlighted]:bg-surface"
                onClick={() => jumpTo(currentYear, new Date().getMonth() + 1)}
              >
                {t("wca.thisMonth")}
              </button>
            </DropdownItem>
            <DropdownItem asChild>
              <button
                type="button"
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-ink outline-none transition-colors data-[highlighted]:bg-surface"
                onClick={() => {
                  const next = new Date();
                  next.setMonth(next.getMonth() + 1);
                  jumpTo(next.getFullYear(), next.getMonth() + 1);
                }}
              >
                {t("wca.nextMonth")}
              </button>
            </DropdownItem>
            <DropdownItem asChild>
              <button
                type="button"
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-ink outline-none transition-colors data-[highlighted]:bg-surface"
                onClick={() => jumpTo(currentYear, 0)}
              >
                {t("wca.thisYear")}
              </button>
            </DropdownItem>
          </Dropdown>

          {onReset ? (
            <Button
              type="button"
              variant="link"
              size="plain"
              className="col-span-2 justify-self-start px-1.5 py-1.5 text-xs sm:col-span-1"
              onClick={onReset}
            >
              {t("wca.resetFilters")}
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
