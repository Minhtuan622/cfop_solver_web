import { useEffect, useState } from "react";
import { CFOP_CLOUD_SYNC_EVENT } from "@/lib/cloudSyncSignal";
import { applyCfopCloudState, createCfopCloudState, mergeCfopCloudStates, parseCfopCloudState } from "@/lib/cloudSync";
import { trpc } from "@/lib/trpc";

/** Keeps only Timer/Study state in the account cloud snapshot; settings stay device-local. */
export function CfopCloudSync() {
  const accountQuery = trpc.cfopAccount.me.useQuery(undefined, { staleTime: 60_000, retry: false });
  const accountId = accountQuery.data?.id;
  const remoteQuery = trpc.cfopAccount.cloudState.get.useQuery(undefined, { enabled: Boolean(accountId), retry: false });
  const save = trpc.cfopAccount.cloudState.save.useMutation();
  const [readyAccountId, setReadyAccountId] = useState<number | null>(null);

  useEffect(() => {
    if (!accountId) { setReadyAccountId(null); return; }
    if (!remoteQuery.isSuccess || readyAccountId === accountId) return;
    const local = createCfopCloudState();
    const remote = parseCfopCloudState(remoteQuery.data?.payload);
    const merged = mergeCfopCloudStates(local, remote);
    applyCfopCloudState(merged);
    setReadyAccountId(accountId);
    save.mutate(merged);
  }, [accountId, readyAccountId, remoteQuery.data, remoteQuery.isSuccess, save]);

  useEffect(() => {
    if (!accountId || readyAccountId !== accountId) return;
    let timer: number | undefined;
    const scheduleSave = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => save.mutate(createCfopCloudState()), 900);
    };
    window.addEventListener(CFOP_CLOUD_SYNC_EVENT, scheduleSave);
    return () => { window.removeEventListener(CFOP_CLOUD_SYNC_EVENT, scheduleSave); if (timer) window.clearTimeout(timer); };
  }, [accountId, readyAccountId, save]);

  return null;
}
