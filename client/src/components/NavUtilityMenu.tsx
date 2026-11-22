import { useEffect, useMemo } from "react";
import { SIGN_IN_EVENT } from "@/lib/signInRequest";
import { Link } from "wouter";
import { Dropdown, DropdownItem, DropdownRadioGroup, DropdownRadioItem } from "@/components/ui/Dropdown";
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
  const showSession = session.show;
  // Nút "Đăng nhập" ở các trang (Phòng thi, Xếp hạng) mở cùng hộp đăng nhập này.
  useEffect(() => {
    const open = () => showSession("login");
    window.addEventListener(SIGN_IN_EVENT, open);
    return () => window.removeEventListener(SIGN_IN_EVENT, open);
  }, [showSession]);

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
  const baseChipClass = "bg-surface-2";
  const highlight = "data-[highlighted]:bg-surface";
  const checkedClass =
    "data-[state=checked]:bg-primary-soft data-[state=checked]:font-semibold data-[state=checked]:text-primary data-[state=checked]:data-[highlighted]:bg-primary-soft";

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
        <p className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
          {t("account.group")}
        </p>
        {session.account ? (
          <>
            <DropdownItem asChild>
              <Link href="/profile" className={cn(itemClass, baseChipClass, highlight)}>
                <PersonCircle className="text-base" />
                {t("account.profile")}
              </Link>
            </DropdownItem>
            <DropdownItem asChild disabled={session.logoutPending}>
              <button
                type="button"
                className={cn(itemClass, baseChipClass, highlight, "disabled:opacity-50")}
                onClick={() => session.logout.mutate()}
              >
                <BoxArrowRight className="text-base" />
                {t("account.logout")}
              </button>
            </DropdownItem>
          </>
        ) : (
          <>
            <DropdownItem asChild>
              <button
                type="button"
                className={cn(itemClass, baseChipClass, highlight)}
                onClick={() => session.show("login")}
              >
                <PersonCircle className="text-base" />
                {t("account.signIn")}
              </button>
            </DropdownItem>
            <DropdownItem asChild>
              <button
                type="button"
                className={cn(itemClass, baseChipClass, highlight)}
                onClick={() => session.show("register")}
              >
                {t("account.register")}
              </button>
            </DropdownItem>
          </>
        )}
        <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
          {t("language.label")}
        </p>
        <DropdownRadioGroup
          value={language}
          onValueChange={value => setLanguage(value as typeof language)}
        >
          {LANGUAGES.map(option => (
            <DropdownRadioItem
              key={option.value}
              value={option.value}
              className={cn(itemClass, baseChipClass, highlight, checkedClass)}
            >
              <Translate className="text-base" />
              {option.label}
            </DropdownRadioItem>
          ))}
        </DropdownRadioGroup>
        <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
          {t("theme.label")}
        </p>
        <DropdownRadioGroup
          value={theme}
          onValueChange={value => setTheme(value as Theme)}
        >
          {THEMES.map(option => {
            const OptionIcon = option.icon;
            return (
              <DropdownRadioItem
                key={option.value}
                value={option.value}
                className={cn(itemClass, baseChipClass, highlight, checkedClass)}
              >
                <OptionIcon className="text-base" />
                {themeLabels[option.value]}
              </DropdownRadioItem>
            );
          })}
        </DropdownRadioGroup>
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
