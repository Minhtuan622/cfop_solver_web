import { useEffect, useMemo } from "react";
import { SIGN_IN_EVENT } from "@/lib/signInRequest";
import { Link } from "wouter";
import {
  Dropdown,
  DropdownItem,
  DropdownRadioGroup,
  DropdownRadioItem,
  MENU_ITEM_CHECKED_CLASS,
  MENU_ITEM_CLASS,
  MENU_LABEL_CLASS,
  MenuCheck,
} from "@/components/ui/Dropdown";
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

export function NavUtilityMenu() {
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const session = useCfopAccountSession();
  const showSession = session.show;
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


  return (
    <>
      <Dropdown
        id="cfop-utility-menu"
        label={t("nav.utilities")}
        title={t("nav.utilities")}
        menuLabel={t("nav.utilities")}
        buttonClassName="bg-transparent px-2 hover:bg-surface-3"
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
        <p className={MENU_LABEL_CLASS}>
          {t("account.group")}
        </p>
        {session.account ? (
          <>
            <DropdownItem asChild>
              <Link href="/profile" className={MENU_ITEM_CLASS}>
                <PersonCircle className="text-base" />
                {t("account.profile")}
              </Link>
            </DropdownItem>
            <DropdownItem asChild disabled={session.logoutPending}>
              <button
                type="button"
                className={cn(MENU_ITEM_CLASS, "disabled:opacity-50")}
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
                className={MENU_ITEM_CLASS}
                onClick={() => session.show("login")}
              >
                <PersonCircle className="text-base" />
                {t("account.signIn")}
              </button>
            </DropdownItem>
            <DropdownItem asChild>
              <button
                type="button"
                className={MENU_ITEM_CLASS}
                onClick={() => session.show("register")}
              >
                {t("account.register")}
              </button>
            </DropdownItem>
          </>
        )}
        <p className={MENU_LABEL_CLASS}>
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
              className={cn(MENU_ITEM_CLASS, MENU_ITEM_CHECKED_CLASS)}
            >
              <Translate className="text-base" />
              {option.label}
              <MenuCheck />
            </DropdownRadioItem>
          ))}
        </DropdownRadioGroup>
        <p className={MENU_LABEL_CLASS}>
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
                className={cn(MENU_ITEM_CLASS, MENU_ITEM_CHECKED_CLASS)}
              >
                <OptionIcon className="text-base" />
                {themeLabels[option.value]}
                <MenuCheck />
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
