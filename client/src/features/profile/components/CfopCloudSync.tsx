import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { CFOP_CLOUD_SYNC_EVENT } from "@/lib/cloudSyncSignal";
import { applyCfopCloudState, createCfopCloudState, mergeCfopCloudStates, parseCfopCloudState } from "@/lib/cloudSync";
import { trpc } from "@/lib/trpc";

/** Số lần thử lại tối đa khi hai thiết bị liên tục ghi cùng lúc. */
const MAX_CONFLICT_RETRIES = 3;

/** Keeps only Timer/Study state in the account cloud snapshot; settings stay device-local. */
export function CfopCloudSync() {
  const { t } = useLanguage();
  const accountQuery = trpc.cfopAccount.me.useQuery(undefined, { staleTime: 60_000, retry: false });
  const accountId = accountQuery.data?.id;
  const remoteQuery = trpc.cfopAccount.cloudState.get.useQuery(undefined, { enabled: Boolean(accountId), retry: false });
  /**
   * Revision của dòng cloud state mà máy này đã đọc. `null` nghĩa là chưa
   * đọc được (tài khoản chưa có dữ liệu cloud) — máy chủ coi như revision 0.
   */
  const revisionRef = useRef<number | null>(null);
  const conflictAttemptsRef = useRef(0);
  const [readyAccountId, setReadyAccountId] = useState<number | null>(null);

  const save = trpc.cfopAccount.cloudState.save.useMutation({
    onSuccess: result => {
      revisionRef.current = result.revision;
      conflictAttemptsRef.current = 0;
    },
    onError: async error => {
      if ((error as { data?: { code?: string } }).data?.code !== "CONFLICT" || !accountId) {
        toast.error(t("profile.syncFailed"));
        return;
      }
      // Hai thiết bị cùng ghi: đọc bản mới từ máy chủ, gộp với dữ liệu cục
      // bộ rồi lưu lại. Số lần thử có giới hạn để không lặp vô hạn.
      if (conflictAttemptsRef.current >= MAX_CONFLICT_RETRIES) {
        conflictAttemptsRef.current = 0;
        toast.error(t("profile.syncConflict"));
        return;
      }
      conflictAttemptsRef.current += 1;
      const fresh = await remoteQuery.refetch();
      const remote = parseCfopCloudState(fresh.data?.payload);
      const local = createCfopCloudState();
      const merged = mergeCfopCloudStates(local, remote);
      applyCfopCloudState(merged);
      revisionRef.current = fresh.data?.revision ?? null;
      save.mutate({ ...merged, baseVersion: revisionRef.current });
    },
  });

  useEffect(() => {
    if (!accountId) { setReadyAccountId(null); return; }
    if (!remoteQuery.isSuccess || readyAccountId === accountId) return;
    const local = createCfopCloudState();
    const remote = parseCfopCloudState(remoteQuery.data?.payload);
    const merged = mergeCfopCloudStates(local, remote);
    applyCfopCloudState(merged);
    revisionRef.current = remoteQuery.data?.revision ?? null;
    setReadyAccountId(accountId);
    save.mutate({ ...merged, baseVersion: revisionRef.current });
  }, [accountId, readyAccountId, remoteQuery.data, remoteQuery.isSuccess, save]);

  useEffect(() => {
    if (!accountId || readyAccountId !== accountId) return;
    let timer: number | undefined;
    const scheduleSave = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => save.mutate({ ...createCfopCloudState(), baseVersion: revisionRef.current }), 900);
    };
    window.addEventListener(CFOP_CLOUD_SYNC_EVENT, scheduleSave);
    return () => { window.removeEventListener(CFOP_CLOUD_SYNC_EVENT, scheduleSave); if (timer) window.clearTimeout(timer); };
  }, [accountId, readyAccountId, save]);

  return null;
}
