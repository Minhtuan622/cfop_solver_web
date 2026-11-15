import { useMemo } from "react";
import { Link } from "wouter";
import { Dropdown } from "@/components/ui/Dropdown";
import {
  BoxArrowRight,
  CircleHalf,
  MoonStars,
  PersonCircle,
  SunFill,
  Translate,
} from "@/components/ui/Icon";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import {
  CfopAuthDialog,
  useCfopAccountSession,
} from "@/features/profile";
import { initials } from "@/features/profile/lib/profilePresentation";
import type { Theme } from "@/lib/theme";

const THEMES: { value: Theme; icon: typeof SunFill }[] = [
  { value: "light", icon: SunFill },
  { value: "dark", icon: MoonStars },
  { value: "system", icon: CircleHalf },
];

const LANGUAGES = [
  { value: "vi" as const, label: "Tiếng Việt" },
  { value: "en" as const, label: "English" },
];

/**
 * Một nút duy nhất ở thanh điều hướng gom tài khoản, ngôn ngữ và giao diện.
 *
 * Trước đây ba nút chiếm chỗ trên thanh; gom vào một menu giữ cho thanh gọn
 * và đặt mọi tuỳ chọn cá nhân ở đúng một chỗ. Menu là tấm nền đặc `surface`
 * với từng mục là chip `surface-2` (hover `surface-3`) — cùng ngôn ngữ với
 * nút "soft" trong hệ thống; mục đang chọn dùng `primary-soft` với chữ tím.
 */
export function NavUtilityMenu() {
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const session = useCfopAccountSession();

  const themeLabels = useMemo(
    () => ({
      light: t("theme.light"),
      dark: t("theme.dark"),
      system: t("theme.system"),
    }),
    [t],
  );

  const itemClass =
    "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-ink transition";
  const baseChipClass = "bg-surface-2 hover:bg-surface-3";
  const activeItemClass =
    "bg-primary-soft font-semibold text-primary hover:bg-primary-soft";

  return (
    <>
      <Dropdown
        id="cfop-utility-menu"
        label={t("nav.utilities")}
        title={t("nav.utilities")}
        menuLabel={t("nav.utilities")}
        buttonClassName="bg-transparent px-2 hover:bg-surface-3"
        menuClassName="flex flex-col gap-1 rounded-2xl p-2"
        button={
          session.account ? (
            session.account.avatarUrl ? (
              <img
                src={session.account.avatarUrl}
                alt={t("account.avatarAlt", {
                  name: session.account.displayName,
                })}
                width={24}
                height={24}
                className="h-6 w-6 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-3 text-[10px] font-semibold text-ink"
                aria-label={t("account.initialsLabel", {
                  name: session.account.displayName,
                })}
              >
                {initials(session.account.displayName)}
              </span>
            )
          ) : (
            <PersonCircle className="text-base" />
          )
        }
      >
        <li>
          <p className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
            {t("account.group")}
          </p>
        </li>
        {session.account ? (
          <>
            <li>
              <Link
                href="/profile"
                role="menuitem"
                className={cn(itemClass, baseChipClass)}
              >
                <PersonCircle className="text-base" />
                {t("account.profile")}
              </Link>
            </li>
            <li>
              <button
                type="button"
                role="menuitem"
                className={cn(itemClass, baseChipClass, "disabled:opacity-50")}
                onClick={() => session.logout.mutate()}
                disabled={session.logoutPending}
              >
                <BoxArrowRight className="text-base" />
                {t("account.logout")}
              </button>
            </li>
          </>
        ) : (
          <>
            <li>
              <button
                type="button"
                role="menuitem"
                className={cn(itemClass, baseChipClass)}
                onClick={() => session.show("login")}
              >
                <PersonCircle className="text-base" />
                {t("account.signIn")}
              </button>
            </li>
            <li>
              <button
                type="button"
                role="menuitem"
                className={cn(itemClass, baseChipClass)}
                onClick={() => session.show("register")}
              >
                {t("account.register")}
              </button>
            </li>
          </>
        )}
        <li>
          <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
            {t("language.label")}
          </p>
        </li>
        {LANGUAGES.map(option => {
          const active = option.value === language;
          return (
            <li key={option.value}>
              <button
                type="button"
                role="menuitemradio"
                aria-checked={active}
                className={cn(itemClass, active ? activeItemClass : baseChipClass)}
                onClick={() => setLanguage(option.value)}
              >
                <Translate className="text-base" />
                {option.label}
              </button>
            </li>
          );
        })}
        <li>
          <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
            {t("theme.label")}
          </p>
        </li>
        {THEMES.map(option => {
          const OptionIcon = option.icon;
          const active = option.value === theme;
          return (
            <li key={option.value}>
              <button
                type="button"
                role="menuitemradio"
                aria-checked={active}
                className={cn(itemClass, active ? activeItemClass : baseChipClass)}
                onClick={() => setTheme(option.value)}
              >
                <OptionIcon className="text-base" />
                {themeLabels[option.value]}
              </button>
            </li>
          );
        })}
      </Dropdown>
      <CfopAuthDialog
        open={session.open}
        mode={session.mode}
        email={session.email}
        password={session.password}
        displayName={session.displayName}
        error={session.error}
        pending={session.pending}
        onModeChange={session.changeMode}
        onEmailChange={session.setEmail}
        onPasswordChange={session.setPassword}
        onDisplayNameChange={session.setDisplayName}
        onSubmit={session.submit}
        onClose={session.close}
      />
    </>
  );
}
