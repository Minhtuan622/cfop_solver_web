import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import type { TimerCompletion } from "@/components/common/SolveTimer";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  PendingButton,
  RefreshIndicator,
  SkeletonCard,
} from "@/components/ui/StudioUI";
import {
  SystemLeaderboard,
  competitionErrorText,
  competitionEventLabel,
  competitionResultLabel,
  formatLabels,
  type RoomFormat,
} from "@/features/competition";
import {
  RemoveSpectatorDialog,
  RoomLobby,
  RoomRoundPanel,
  RoomSidebar,
  type PendingSolve,
  type RemovalTarget,
} from "@/features/rooms";
import {
  DEFAULT_TIMER_EVENT,
  isTimerEventId,
  type TimerEventId,
} from "@/lib/timerEvents";
import { trpc } from "@/lib/trpc";
import { useAsync } from "@/lib/useAsync";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Rooms() {
  const { language, t } = useLanguage();
  const [location, setLocation] = useLocation();
  const code =
    location.match(/^\/rooms\/([A-Z0-9]+)/i)?.[1]?.toUpperCase() ?? "";
  const utils = trpc.useUtils();
  const account = trpc.cfopAccount.me.useQuery(undefined, {
    staleTime: 30_000,
    retry: false,
  });
  const [name, setName] = useState("");
  const [eventId, setEventId] = useState<TimerEventId>(DEFAULT_TIMER_EVENT);
  const [format, setFormat] = useState<RoomFormat>("ao5");
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [multiBlindCubes, setMultiBlindCubes] = useState(2);
  const [joinCode, setJoinCode] = useState("");
  const [chat, setChat] = useState("");
  const [pendingMultiBlind, setPendingMultiBlind] =
    useState<PendingSolve | null>(null);
  const [multiBlindSolved, setMultiBlindSolved] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [removalTarget, setRemovalTarget] = useState<RemovalTarget | null>(
    null
  );
  const [removalReason, setRemovalReason] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const copyInvite = useAsync(async () => {
    await navigator.clipboard?.writeText(
      `${window.location.origin}/rooms/${code}`
    );
  });
  const roomInput = useMemo(() => ({ code }), [code]);
  const mine = trpc.competition.listMine.useQuery(undefined, {
    enabled: Boolean(account.data),
    retry: false,
  });
  const roomQuery = trpc.competition.state.useQuery(roomInput, {
    enabled: Boolean(account.data && code),
    refetchInterval: code ? 2_500 : false,
    retry: false,
  });
  const refresh = async () => {
    if (code) await utils.competition.state.invalidate(roomInput);
    await utils.competition.listMine.invalidate();
  };
  const create = trpc.competition.create.useMutation({
    onSuccess: room => setLocation(`/rooms/${room.code}`),
    onError: next => setError(competitionErrorText(next, t)),
  });
  const join = trpc.competition.join.useMutation({
    onSuccess: room => setLocation(`/rooms/${room.code}`),
    onError: next => setError(competitionErrorText(next, t)),
  });
  const spectate = trpc.competition.spectate.useMutation({
    onSuccess: room => setLocation(`/rooms/${room.code}`),
    onError: next => setError(competitionErrorText(next, t)),
  });
  const leave = trpc.competition.leave.useMutation({
    onSuccess: () => setLocation("/rooms"),
    onError: next => setError(competitionErrorText(next, t)),
  });
  const deleteRoom = trpc.competition.delete.useMutation({
    onSuccess: async () => {
      setLocation("/rooms");
      await utils.competition.listMine.invalidate();
    },
    onError: next => setError(competitionErrorText(next, t)),
  });
  const start = trpc.competition.startRound.useMutation({
    onSuccess: async () => {
      setMessage(t("rooms.roundOpened"));
      await refresh();
    },
    onError: next => setError(competitionErrorText(next, t)),
  });
  const finish = trpc.competition.finish.useMutation({
    onSuccess: async () => {
      setMessage(t("rooms.roundFinished"));
      await refresh();
    },
    onError: next => setError(competitionErrorText(next, t)),
  });
  const rematch = trpc.competition.rematch.useMutation({
    onSuccess: room => setLocation(`/rooms/${room.code}`),
    onError: next => setError(competitionErrorText(next, t)),
  });
  const submit = trpc.competition.submit.useMutation({
    onSuccess: async () => {
      setPendingMultiBlind(null);
      setMessage(t("rooms.resultSubmitted"));
      await refresh();
    },
    onError: next => setError(competitionErrorText(next, t)),
  });
  const send = trpc.competition.sendMessage.useMutation({
    onSuccess: async () => {
      setChat("");
      await refresh();
    },
    onError: next => setError(competitionErrorText(next, t)),
  });
  const grantModerator = trpc.competition.grantModerator.useMutation({
    onSuccess: refresh,
    onError: next => setError(competitionErrorText(next, t)),
  });
  const revokeModerator = trpc.competition.revokeModerator.useMutation({
    onSuccess: refresh,
    onError: next => setError(competitionErrorText(next, t)),
  });
  const removeSpectator = trpc.competition.removeSpectator.useMutation({
    onSuccess: async () => {
      setRemovalTarget(null);
      setRemovalReason("");
      await refresh();
    },
    onError: next => setError(competitionErrorText(next, t)),
  });
  useEffect(() => {
    setPendingMultiBlind(null);
    setMultiBlindSolved(0);
  }, [roomQuery.data?.activeRound?.id]);

  if (account.isLoading)
    return (
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SkeletonCard lines={5} label={t("rooms.loadingAccount")} />
      </div>
    );
  if (!account.data)
    return (
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-lg font-semibold tracking-tight mb-0">
          {t("rooms.title")}
        </h1>
        <SystemLeaderboard />
        <div className="rounded-panel border px-4 py-3 text-sm border-line bg-surface-2 text-ink mt-6">
          {t("rooms.signInHint")}
        </div>
      </div>
    );
  if (!code)
    return (
      <RoomLobby
        name={name}
        onNameChange={setName}
        eventId={eventId}
        onEventIdChange={setEventId}
        format={format}
        onFormatChange={setFormat}
        maxPlayers={maxPlayers}
        onMaxPlayersChange={setMaxPlayers}
        multiBlindCubes={multiBlindCubes}
        onMultiBlindCubesChange={setMultiBlindCubes}
        joinCode={joinCode}
        onJoinCodeChange={setJoinCode}
        createPending={create.isPending}
        joinPending={join.isPending}
        myRooms={
          mine.data?.map(({ room }) => ({
            id: room.id,
            code: room.code,
            name: room.name,
            eventId: room.eventId,
          })) ?? []
        }
        myRoomsPending={mine.isLoading}
        onCreate={() =>
          create.mutate({
            name,
            eventId,
            format,
            maxPlayers,
            multiBlindCubes,
          })
        }
        onJoin={() => join.mutate({ code: joinCode })}
        error={error}
      />
    );

  const room = roomQuery.data;
  if (roomQuery.isLoading)
    return (
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SkeletonCard lines={7} label={t("rooms.loadingRoom")} />
      </div>
    );
  if (!room)
    return (
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-panel border px-4 py-3 text-sm border-line bg-surface-2 text-ink">
          <h1 className="text-lg font-semibold tracking-tight">
            {t("rooms.roomTitle", { code })}
          </h1>
          <p>{t("rooms.pickRole")}</p>
          <div className="flex gap-2">
            <PendingButton
              type="button"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 bg-primary text-white shadow-sm shadow-primary/25 hover:bg-primary-hover"
              pending={join.isPending}
              onClick={() => join.mutate({ code })}
            >
              {t("rooms.join")}
            </PendingButton>
            <PendingButton
              type="button"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 border-primary/35 bg-transparent text-primary hover:bg-primary-soft"
              pending={spectate.isPending}
              onClick={() => spectate.mutate({ code })}
            >
              {t("rooms.spectate")}
            </PendingButton>
          </div>
        </div>
      </div>
    );
  const event = isTimerEventId(room.room.eventId)
    ? room.room.eventId
    : DEFAULT_TIMER_EVENT;
  const isMultiBlind = event === "333mbf";
  const active = room.activeRound;
  const accountId = account.data?.id;
  const myPlayer = room.players.find(player => player.accountId === accountId);
  const submitted = Boolean(myPlayer?.currentResult);
  const canManageSpectators = room.isHost || room.isModerator;
  const onComplete = (completion: TimerCompletion) => {
    if (isMultiBlind) {
      setPendingMultiBlind(completion);
      setMultiBlindSolved(0);
      return;
    }
    submit.mutate({
      code,
      roundId: active!.id,
      elapsedMs: completion.elapsedMs,
      inspectionMs: completion.inspectionMs,
      penalty: completion.automaticPenalty,
    });
  };
  const latestModeration = room.moderationLogs.at(-1) ?? null;
  const moderationNotice = latestModeration
    ? t("rooms.sidebar.moderationNotice", {
        actor: latestModeration.actorDisplayName,
        target: latestModeration.targetDisplayName,
        reason: latestModeration.reason,
      })
    : null;
  const deleteCurrentRoom = () => setConfirmDelete(true);

  return (
    <>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-between items-end gap-4 mb-6">
          <div>
            <p className="text-muted text-sm mb-1">
              {competitionEventLabel(event, language)} ·{" "}
              {formatLabels[room.room.format]} ·{" "}
              {t("rooms.round", {
                current: room.room.currentRound,
                limit: room.roundLimit,
              })}
            </p>
            <h1 className="text-xl font-semibold tracking-tight mb-1">
              {room.room.name}
            </h1>
            {roomQuery.isFetching ? (
              <RefreshIndicator label={t("rooms.refreshing")} />
            ) : null}
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide bg-surface-3 text-ink">
              {t("rooms.spectatorCount", { count: room.onlineSpectatorCount })}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <PendingButton
              type="button"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 border-primary/35 bg-transparent text-primary hover:bg-primary-soft px-3 py-1.5 text-xs"
              pending={copyInvite.pending}
              onClick={() => void copyInvite.run()}
            >
              {t("rooms.copyInvite")}
            </PendingButton>
            {room.isHost && room.room.status === "finished" ? (
              <PendingButton
                type="button"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 bg-success text-white shadow-sm hover:brightness-95 px-3 py-1.5 text-xs"
                pending={rematch.isPending}
                onClick={() => rematch.mutate({ code })}
              >
                {t("rooms.rematch")}
              </PendingButton>
            ) : null}
            {room.isHost && room.room.status !== "active" ? (
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 border-danger/35 bg-transparent text-danger hover:bg-danger-soft px-3 py-1.5 text-xs"
                onClick={deleteCurrentRoom}
              >
                {t("rooms.delete")}
              </button>
            ) : null}
            {!room.isHost ? (
              <PendingButton
                type="button"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 border-line bg-surface text-ink hover:bg-surface-2 px-3 py-1.5 text-xs"
                pending={leave.isPending}
                onClick={() => leave.mutate({ code })}
              >
                {t("rooms.leave")}
              </PendingButton>
            ) : null}
          </div>
        </div>
        {room.isSpectator ? (
          <div className="rounded-panel border px-4 py-3 text-sm border-info/20 bg-info-soft text-ink">
            {t("rooms.spectatorNoticePrefix")}{" "}
            <strong>
              {room.isModerator
                ? t("rooms.role.moderator")
                : t("rooms.role.spectator")}
            </strong>
            . {t("rooms.spectatorNoticeAction")}{" "}
            {room.isModerator
              ? t("rooms.ability.moderator")
              : t("rooms.ability.spectator")}
          </div>
        ) : null}
        <div className="grid grid-cols-12 gap-6">
          <section className="col-span-12 xl:col-span-8">
            <RoomRoundPanel
              status={room.room.status}
              isHost={room.isHost}
              isSpectator={room.isSpectator}
              roundLimit={room.roundLimit}
              currentRound={room.room.currentRound}
              eventId={event}
              multiBlindCubes={room.room.multiBlindCubes}
              activeRound={active}
              submitted={submitted}
              myResultLabel={competitionResultLabel(
                myPlayer?.currentResult,
                event,
                t
              )}
              pendingMultiBlind={pendingMultiBlind}
              multiBlindSolved={multiBlindSolved}
              onMultiBlindSolvedChange={setMultiBlindSolved}
              onComplete={onComplete}
              onStartRound={() => start.mutate({ code })}
              onFinish={() => finish.mutate({ code })}
              onSubmitMultiBlind={() =>
                submit.mutate({
                  code,
                  roundId: active!.id,
                  elapsedMs: pendingMultiBlind!.elapsedMs,
                  inspectionMs: pendingMultiBlind!.inspectionMs,
                  penalty: pendingMultiBlind!.automaticPenalty,
                  multiBlind: {
                    attempted: room.room.multiBlindCubes,
                    solved: multiBlindSolved,
                  },
                })
              }
              startPending={start.isPending}
              finishPending={finish.isPending}
              submitPending={submit.isPending}
            />
          </section>
          <RoomSidebar
            eventId={event}
            format={room.room.format}
            standings={room.standings}
            canManageSpectators={canManageSpectators}
            isHost={room.isHost}
            isModerator={room.isModerator}
            members={room.members}
            onlineSpectators={room.onlineSpectators}
            moderationNotice={moderationNotice}
            moderationLogs={room.moderationLogs}
            isSpectator={room.isSpectator}
            messages={room.messages}
            chat={chat}
            onChatChange={setChat}
            onSend={() => send.mutate({ code, content: chat })}
            sendPending={send.isPending}
            moderationPending={
              grantModerator.isPending || revokeModerator.isPending
            }
            onGrantModerator={accountId =>
              grantModerator.mutate({ code, accountId })
            }
            onRevokeModerator={accountId =>
              revokeModerator.mutate({ code, accountId })
            }
            onRemoveSpectator={setRemovalTarget}
          />
        </div>
        {message ? (
          <div className="rounded-panel border px-4 py-3 text-sm border-success/20 bg-success-soft text-ink mt-6">
            {message}
          </div>
        ) : null}
        {error ? (
          <div className="rounded-panel border px-4 py-3 text-sm border-danger/20 bg-danger-soft text-ink mt-6">
            {error}
          </div>
        ) : null}
      </div>
      <RemoveSpectatorDialog
        open={Boolean(removalTarget)}
        targetName={removalTarget?.displayName ?? ""}
        reason={removalReason}
        onReasonChange={setRemovalReason}
        onConfirm={() => {
          if (!removalTarget) return;
          removeSpectator.mutate({
            code,
            accountId: removalTarget.accountId,
            reason: removalReason.trim(),
          });
        }}
        onClose={() => {
          setRemovalTarget(null);
          setRemovalReason("");
        }}
        pending={removeSpectator.isPending}
      />
      <ConfirmDialog
        open={confirmDelete}
        title={t("rooms.deleteConfirmTitle")}
        description={t("rooms.deleteConfirmDetail")}
        confirmLabel={t("rooms.deleteConfirmAction")}
        tone="danger"
        pending={deleteRoom.isPending}
        onConfirm={() => deleteRoom.mutate({ code })}
        onClose={() => setConfirmDelete(false)}
      />
    </>
  );
}
