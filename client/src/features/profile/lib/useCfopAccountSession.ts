import { useState, type FormEvent } from "react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { errorMessage } from "@/lib/apiError";
import type { AuthMode } from "../components/CfopAuthDialog";

export function useCfopAccountSession() {
  const { t } = useLanguage();
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");

  const accountQuery = trpc.cfopAccount.me.useQuery(undefined, {
    staleTime: 60_000,
    retry: false,
  });
  const googleConfigured = trpc.cfopAccount.googleConfigured.useQuery(undefined, {
    staleTime: 5 * 60_000,
    retry: false,
  });
  const facebookConfigured = trpc.cfopAccount.facebookConfigured.useQuery(undefined, {
    staleTime: 5 * 60_000,
    retry: false,
  });

  const complete = async () => {
    await utils.cfopAccount.me.invalidate();
    setOpen(false);
    setPassword("");
    setError("");
  };
  const register = trpc.cfopAccount.register.useMutation({
    onSuccess: complete,
    onError: next => setError(errorMessage(next, t)),
  });
  const login = trpc.cfopAccount.login.useMutation({
    onSuccess: complete,
    onError: next => setError(errorMessage(next, t)),
  });
  const logout = trpc.cfopAccount.logout.useMutation({
    onSuccess: () => void utils.cfopAccount.me.invalidate(),
  });
  const googleLogin = trpc.cfopAccount.googleLogin.useMutation({
    onSuccess: complete,
    onError: next => setError(errorMessage(next, t)),
  });
  const signInWithGoogle = (credential: string) => {
    setError("");
    googleLogin.mutate({ idToken: credential });
  };
  const facebookLogin = trpc.cfopAccount.facebookLogin.useMutation({
    onSuccess: complete,
    onError: next => setError(errorMessage(next, t)),
  });
  const signInWithFacebook = (accessToken: string) => {
    setError("");
    facebookLogin.mutate({ accessToken });
  };

  const pending = register.isPending || login.isPending || googleLogin.isPending || facebookLogin.isPending;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (mode === "register") register.mutate({ email, password, displayName });
    else login.mutate({ email, password });
  };
  const changeMode = (next: AuthMode) => {
    setMode(next);
    setError("");
  };
  const show = (next: AuthMode) => {
    changeMode(next);
    setOpen(true);
  };
  const close = () => setOpen(false);

  return {
    account: accountQuery.data,
    googleEnabled: Boolean(googleConfigured.data),
    facebookEnabled: Boolean(facebookConfigured.data),
    signInWithGoogle,
    signInWithFacebook,
    open,
    mode,
    email,
    password,
    displayName,
    error,
    pending,
    setEmail,
    setPassword,
    setDisplayName,
    submit,
    changeMode,
    show,
    close,
    logout,
    logoutPending: logout.isPending,
  };
}

export type CfopAccountSession = ReturnType<typeof useCfopAccountSession>;
