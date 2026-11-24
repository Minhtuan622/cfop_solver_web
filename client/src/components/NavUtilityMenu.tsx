import { Link } from "wouter";import {
  Dropdown,
  DropdownItem,
  MENU_ITEM_CLASS,
  MENU_LABEL_CLASS,
} from "@/components/ui/Dropdown";
import {
  BoxArrowRight,
  PersonCircle,
} from "@/components/ui/Icon";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  CfopAuthDialog,
  useCfopAccountSession,
} from "@/features/profile";
import { initials } from "@/features/profile/lib/profilePresentation";

/**
 * Thẻ dropdown Tài khoản (mặc định của thanh nav): khi đã đăng nhập hiện avatar +
 * tên hiển thị với mục Hồ sơ / Đăng xuất; khi chưa đăng nhập hiện Sign In / Đăng ký.
 */
export function NavUtilityMenu() {
  const { t } = useLanguage();
  const session = useCfopAccountSession();
  const account = session.account;

  const accountButton = account ? (
    account.avatarUrl ? (
      <img
        src={account.avatarUrl}
        alt={t("account.avatarAlt", { name: account.displayName })}
        width={28}
        height={28}
        className="h-7 w-7 shrink-0 rounded-full object-cover"
      />
    ) : (
      <span
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-3 text-[10px] font-semibold text-ink"
        aria-label={t("account.initialsLabel", { name: account.displayName })}
      >
        {initials(account.displayName)}
      </span>
    )
  ) : (
    <PersonCircle className="text-base" />
  );

  return (
    <>
      <Dropdown
        id="cfop-account-menu"
        variant="nav"
        label={t("nav.utilities")}
        title={account ? account.displayName : t("nav.utilities")}
        menuLabel={t("nav.utilities")}
        button={accountButton}
        buttonClassName="px-2"
      >
        <p className={MENU_LABEL_CLASS}>{t("account.group")}</p>
        {account ? (
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
                className={`${MENU_ITEM_CLASS} disabled:opacity-50`}
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
      />
    </>
  );
}
