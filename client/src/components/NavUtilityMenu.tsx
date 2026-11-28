import { useEffect, useMemo } from "react";
import { SIGN_IN_EVENT } from "@/lib/signInRequest";
import { Link } from "wouter";
import {
  Dropdown,
  DropdownItem,
  DropdownRadioGroup,
  DropdownRadioItem,
  MENU_ITEM_CLASS,
  MENU_LABEL_CLASS,
} from "@/components/ui/Dropdown";
import {
  BoxArrowRight,
  CircleHalf,
  MoonStars,
  PersonCircle,
  SunFill,
  Trophy,
} from "@/components/ui/Icon";
import { buttonClass } from "@/components/ui/Button";
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

const SEGMENT_GROUP_CLASS = "grid gap-1 rounded-full bg-surface-2 p-1";
const SEGMENT_ITEM_CLASS =
  "inline-flex cursor-pointer select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-2 py-1.5 text-xs font-semibold text-muted transition-colors data-[highlighted]:text-ink data-[state=checked]:bg-surface data-[state=checked]:text-ink";

function AccountAvatar({ name, avatarUrl }: { name: string | null; avatarUrl: string | null }) {
  const { t } = useLanguage();
  if (!name)
    return (
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-surface-2 text-muted">
        <PersonCircle className="text-xl" />
      </span>
    );
  return avatarUrl ? (
    <img
      src={avatarUrl}
      alt={t("account.avatarAlt", { name })}
      width={44}
      height={44}
      className="size-11 shrink-0 rounded-full object-cover"
    />
  ) : (
    <span
      className="grid size-11 shrink-0 place-items-center rounded-full bg-surface-3 text-sm font-semibold text-ink"
      aria-label={t("account.initialsLabel", { name })}
    >
      {initials(name)}
    </span>
  );
}

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
        menuClassName="w-80 max-w-[calc(100vw-1rem)]"
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
        <div className="flex items-center gap-3 px-3 pb-1 pt-2.5">
          <AccountAvatar
            name={session.account?.displayName ?? null}
            avatarUrl={session.account?.avatarUrl ?? null}
          />
          <div className="min-w-0">
            <p className="m-0 truncate text-sm font-semibold text-ink">
              {session.account ? session.account.displayName : t("account.guest")}
            </p>
            <p className="m-0 truncate text-xs text-muted">
              {session.account
                ? session.account.wcaId
                  ? t("account.wcaId", { id: session.account.wcaId })
                  : t("account.group")
                : t("account.guestHint")}
            </p>
          </div>
        </div>
        {session.account ? (
          <div className="mt-2 flex flex-col gap-0.5">
            <DropdownItem asChild>
              <Link href="/profile" className={MENU_ITEM_CLASS}>
                <PersonCircle className="text-base text-muted" />
                {t("account.profile")}
              </Link>
            </DropdownItem>
            <DropdownItem asChild>
              <Link href="/wca?tab=mine" className={MENU_ITEM_CLASS}>
                <Trophy className="text-base text-muted" />
                {t("account.myCompetitions")}
              </Link>
            </DropdownItem>
          </div>
        ) : (
          <div className="mt-2 flex gap-2 px-3 pb-1">
            <DropdownItem asChild>
              <button
                type="button"
                className={buttonClass("primary", "sm")}
                onClick={() => session.show("login")}
              >
                {t("account.signIn")}
              </button>
            </DropdownItem>
            <DropdownItem asChild>
              <button
                type="button"
                className={buttonClass("soft", "sm")}
                onClick={() => session.show("register")}
              >
                {t("account.register")}
              </button>
            </DropdownItem>
          </div>
        )}
        <div className="mt-2 flex flex-col gap-3 px-3 py-2">
          <div>
            <p className={cn(MENU_LABEL_CLASS, "px-0 pt-0")}>{t("language.label")}</p>
            <DropdownRadioGroup
              value={language}
              onValueChange={value => setLanguage(value as typeof language)}
              className={SEGMENT_GROUP_CLASS}
              style={{ gridTemplateColumns: `repeat(${LANGUAGES.length}, minmax(0, 1fr))` }}
            >
              {LANGUAGES.map(option => (
                <DropdownRadioItem
                  key={option.value}
                  value={option.value}
                  className={SEGMENT_ITEM_CLASS}
                >
                  {option.label}
                </DropdownRadioItem>
              ))}
            </DropdownRadioGroup>
          </div>
          <div>
            <p className={cn(MENU_LABEL_CLASS, "px-0 pt-0")}>{t("theme.label")}</p>
            <DropdownRadioGroup
              value={theme}
              onValueChange={value => setTheme(value as Theme)}
              className={SEGMENT_GROUP_CLASS}
              style={{ gridTemplateColumns: `repeat(${THEMES.length}, minmax(0, 1fr))` }}
            >
              {THEMES.map(option => {
                const OptionIcon = option.icon;
                return (
                  <DropdownRadioItem
                    key={option.value}
                    value={option.value}
                    className={SEGMENT_ITEM_CLASS}
                  >
                    <OptionIcon className="text-sm" />
                    {themeLabels[option.value]}
                  </DropdownRadioItem>
                );
              })}
            </DropdownRadioGroup>
          </div>
        </div>
        {session.account ? (
          <DropdownItem asChild disabled={session.logoutPending}>
            <button
              type="button"
              className={cn(MENU_ITEM_CLASS, "disabled:opacity-50")}
              onClick={() => session.logout.mutate()}
            >
              <BoxArrowRight className="text-base text-muted" />
              {t("account.logout")}
            </button>
          </DropdownItem>
        ) : null}
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
        googleEnabled={session.googleEnabled}
        onGoogleCredential={session.signInWithGoogle}
        facebookEnabled={session.facebookEnabled}
        onFacebookToken={session.signInWithFacebook}
      />
    </>
  );
}
