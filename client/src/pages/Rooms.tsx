import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import type { TimerCompletion } from "@/components/common/SolveTimer";
import { RefreshIndicator, SkeletonCard } from "@/components/ui/BootstrapUI";
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

export default function Rooms() {
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
    onError: next => setError(competitionErrorText(next)),
  });
  const join = trpc.competition.join.useMutation({
    onSuccess: room => setLocation(`/rooms/${room.code}`),
    onError: next => setError(competitionErrorText(next)),
  });
  const spectate = trpc.competition.spectate.useMutation({
    onSuccess: room => setLocation(`/rooms/${room.code}`),
    onError: next => setError(competitionErrorText(next)),
  });
  const leave = trpc.competition.leave.useMutation({
    onSuccess: () => setLocation("/rooms"),
    onError: next => setError(competitionErrorText(next)),
  });
  const deleteRoom = trpc.competition.delete.useMutation({
    onSuccess: async () => {
      setLocation("/rooms");
      await utils.competition.listMine.invalidate();
    },
    onError: next => setError(competitionErrorText(next)),
  });
  const start = trpc.competition.startRound.useMutation({
    onSuccess: async () => {
      setMessage("Đã mở lượt mới.");
      await refresh();
    },
    onError: next => setError(competitionErrorText(next)),
  });
  const finish = trpc.competition.finish.useMutation({
    onSuccess: async () => {
      setMessage("Đã hoàn tất thể thức.");
      await refresh();
    },
    onError: next => setError(competitionErrorText(next)),
  });
  const rematch = trpc.competition.rematch.useMutation({
    onSuccess: room => setLocation(`/rooms/${room.code}`),
    onError: next => setError(competitionErrorText(next)),
  });
  const submit = trpc.competition.submit.useMutation({
    onSuccess: async () => {
      setPendingMultiBlind(null);
      setMessage("Đã nộp kết quả.");
      await refresh();
    },
    onError: next => setError(competitionErrorText(next)),
  });
  const send = trpc.competition.sendMessage.useMutation({
    onSuccess: async () => {
      setChat("");
      await refresh();
    },
    onError: next => setError(competitionErrorText(next)),
  });
  const grantModerator = trpc.competition.grantModerator.useMutation({
    onSuccess: refresh,
    onError: next => setError(competitionErrorText(next)),
  });
  const revokeModerator = trpc.competition.revokeModerator.useMutation({
    onSuccess: refresh,
    onError: next => setError(competitionErrorText(next)),
  });
  const removeSpectator = trpc.competition.removeSpectator.useMutation({
    onSuccess: async () => {
      setRemovalTarget(null);
      setRemovalReason("");
      await refresh();
    },
    onError: next => setError(competitionErrorText(next)),
  });
  useEffect(() => {
    setPendingMultiBlind(null);
    setMultiBlindSolved(0);
  }, [roomQuery.data?.activeRound?.id]);

  if (account.isLoading)
    return (
      <div className="container">
        <SkeletonCard lines={5} label="Đang tải tài khoản" />
      </div>
    );
  if (!account.data)
    return (
      <div className="container">
        <h1 className="h4 mb-0">Phòng thi đấu</h1>
        <SystemLeaderboard />
        <div className="alert alert-secondary mt-4">
          Đăng nhập tài khoản CFOP để tạo, thi hoặc theo dõi phòng.
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
      <div className="container">
        <SkeletonCard lines={7} label="Đang tải phòng thi đấu" />
      </div>
    );
  if (!room)
    return (
      <div className="container">
        <div className="alert alert-secondary">
          <h1 className="h4">Phòng {code}</h1>
          <p>Chọn vai trò trước khi vào phòng.</p>
          <div className="d-flex gap-2">
            <button
              className="btn btn-primary"
              onClick={() => join.mutate({ code })}
            >
              Tham gia thi
            </button>
            <button
              className="btn btn-outline-primary"
              onClick={() => spectate.mutate({ code })}
            >
              Theo dõi trực tiếp
            </button>
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
    ? `${latestModeration.actorDisplayName} đã loại ${latestModeration.targetDisplayName}. Lý do: ${latestModeration.reason}`
    : null;
  const deleteCurrentRoom = () => {
    if (
      window.confirm(
        "Xóa phòng này? Toàn bộ lượt, chat và kết quả phòng sẽ bị xóa."
      )
    )
      deleteRoom.mutate({ code });
  };

  return (
    <>
      <div className="container">
        <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
          <div>
            <p className="text-body-secondary small mb-1">
              {competitionEventLabel(event)} · {formatLabels[room.room.format]} ·
              lượt {room.room.currentRound}/{room.roundLimit}
            </p>
            <h1 className="h3 mb-1">{room.room.name}</h1>
            {roomQuery.isFetching ? (
              <RefreshIndicator label="Đang cập nhật phòng" />
            ) : null}
            <span className="badge text-bg-secondary">
              {room.onlineSpectatorCount} người xem trực tuyến
            </span>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={() =>
                void navigator.clipboard?.writeText(
                  `${window.location.origin}/rooms/${room.room.code}`
                )
              }
            >
              Sao chép link mời
            </button>
            {room.isHost && room.room.status === "finished" ? (
              <button
                className="btn btn-success btn-sm"
                onClick={() => rematch.mutate({ code })}
              >
                Đấu lại
              </button>
            ) : null}
            {room.isHost && room.room.status !== "active" ? (
              <button
                className="btn btn-outline-danger btn-sm"
                onClick={deleteCurrentRoom}
              >
                Xóa phòng
              </button>
            ) : null}
            {!room.isHost ? (
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => leave.mutate({ code })}
              >
                Rời phòng
              </button>
            ) : null}
          </div>
        </div>
        {room.isSpectator ? (
          <div className="alert alert-info">
            Bạn đang theo dõi với vai trò{" "}
            <strong>{room.isModerator ? "moderator" : "khán giả"}</strong>. Bạn
            xem được diễn biến trực tiếp;{" "}
            {room.isModerator
              ? "bạn có thể loại khán giả."
              : "bạn không thể chat hoặc nộp kết quả."}
          </div>
        ) : null}
        <div className="row g-4">
          <section className="col-12 col-xl-8">
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
                event
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
          <div className="alert alert-success mt-4">{message}</div>
        ) : null}
        {error ? <div className="alert alert-danger mt-4">{error}</div> : null}
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
    </>
  );
}
