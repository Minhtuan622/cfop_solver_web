import { TRPCError } from "@trpc/server";
import { cfopAccountProcedure } from "../_core/trpc";
import { competitionRoundLimit, createCompetitionScrambleBundle } from "../services/competition";
import {
  createCompetitionMessage,
  findCompetitionResult,
  finishCompetitionRoom,
  finishCompetitionRound,
  getCompetitionActiveRound,
  listCompetitionMembers,
  listCompetitionResults,
  startCompetitionRound,
  submitCompetitionResult,
} from "../db";
import { isTimerEventId, DEFAULT_TIMER_EVENT } from "../../shared/timerEvents";
import { multiBlindResult } from "../../shared/multiBlind";
import {
  messageInput,
  resultInput,
  roomCodeInput,
} from "./inputs";
import { requireCompetitionMember, requireCompetitionRoom } from "./competitionShared";
import {
  leaderboardCache,
  chatLimiter,
  chatRateKey,
} from "./competitionState";

export const roundProcedures = {
  startRound: cfopAccountProcedure
    .input(roomCodeInput)
    .mutation(async ({ ctx, input }) => {
      const room = await requireCompetitionRoom(input.code);
      if (room.hostAccountId !== ctx.cfopAccount.id)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Chỉ chủ phòng được bắt đầu lượt mới.",
        });
      if (room.status === "finished")
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Thể thức này đã kết thúc. Hãy tạo phòng mới để thi tiếp.",
        });
      if (
        (await listCompetitionMembers(room.id)).filter(
          member => member.role === "player"
        ).length < 2
      )
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cần ít nhất 2 người thi trong phòng để bắt đầu thi đấu.",
        });
      if (room.currentRound >= competitionRoundLimit(room.format, room.eventId))
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Đã đủ số lượt của thể thức này. Hãy hoàn tất phòng để chốt bảng xếp hạng.",
        });
      const activeRound = await getCompetitionActiveRound(room.id);
      if (activeRound) await finishCompetitionRound(activeRound.id);
      const eventId = isTimerEventId(room.eventId)
        ? room.eventId
        : DEFAULT_TIMER_EVENT;
      const scrambleBundle = await createCompetitionScrambleBundle(
        eventId,
        room.multiBlindCubes
      );
      const round = await startCompetitionRound(
        room.id,
        room.currentRound + 1,
        scrambleBundle[0] ?? "",
        eventId === "333mbf" ? scrambleBundle : undefined
      );
      return {
        sequence: round.sequence,
        scramble: round.scramble,
        scrambleBundle,
      };
    }),
  submit: cfopAccountProcedure
    .input(resultInput)
    .mutation(async ({ ctx, input }) => {
      const room = await requireCompetitionRoom(input.code);
      const membership = await requireCompetitionMember(
        room.id,
        ctx.cfopAccount.id
      );
      if (membership.role !== "player")
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Người xem chỉ có thể theo dõi, không thể nộp kết quả.",
        });
      const activeRound = await getCompetitionActiveRound(room.id);
      if (!activeRound)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Phòng chưa có lượt thi đấu đang mở.",
        });
      if (activeRound.id !== input.roundId)
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "Lượt thi đấu đã chuyển. Hãy đồng bộ lại phòng trước khi nộp kết quả.",
        });
      if (await findCompetitionResult(activeRound.id, ctx.cfopAccount.id))
        throw new TRPCError({
          code: "CONFLICT",
          message: "Bạn đã nộp kết quả cho lượt này.",
        });
      const isMultiBlind = room.eventId === "333mbf";
      if (isMultiBlind && !input.multiBlind)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cần nhập số khối MBLD giải đúng.",
        });
      if (isMultiBlind && input.multiBlind?.attempted !== room.multiBlindCubes)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Số khối MBLD không khớp bundle của phòng.",
        });
      const multiBlind =
        isMultiBlind && input.multiBlind
          ? multiBlindResult(input.multiBlind, input.elapsedMs)
          : null;
      const penalty =
        input.penalty === "DNF" || (multiBlind && !multiBlind.valid)
          ? "DNF"
          : input.penalty;
      await submitCompetitionResult({
        roundId: activeRound.id,
        accountId: ctx.cfopAccount.id,
        elapsedMs: input.elapsedMs,
        inspectionMs: input.inspectionMs,
        penalty,
        ...(multiBlind
          ? {
              multiBlindAttempted: multiBlind.attempted,
              multiBlindSolved: multiBlind.solved,
              multiBlindScore: multiBlind.score,
            }
          : {}),
      });
      if (
        activeRound.sequence >= competitionRoundLimit(room.format, room.eventId)
      ) {
        const [members, results] = await Promise.all([
          listCompetitionMembers(room.id),
          listCompetitionResults(room.id),
        ]);
        const allSubmitted = members
          .filter(member => member.role === "player")
          .every(member =>
            results.some(
              result =>
                result.roundId === activeRound.id &&
                result.accountId === member.accountId
            )
          );
        if (allSubmitted) {
          await finishCompetitionRound(activeRound.id);
          await finishCompetitionRoom(room.id);
          leaderboardCache.invalidate();
        }
      }
      return { success: true } as const;
    }),
  sendMessage: cfopAccountProcedure
    .input(messageInput)
    .mutation(async ({ ctx, input }) => {
      const room = await requireCompetitionRoom(input.code);
      const membership = await requireCompetitionMember(
        room.id,
        ctx.cfopAccount.id
      );
      if (membership.role !== "player")
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Người xem không thể gửi chat trong phòng này.",
        });
      const chatRate = chatLimiter.consume(
        chatRateKey(ctx.cfopAccount.id, room.id),
        { limit: 10, windowMs: 10 * 1000 }
      );
      if (!chatRate.allowed)
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message:
            "Bạn gửi tin nhắn quá nhanh. Vui lòng chờ một chút rồi gửi lại.",
        });
      await createCompetitionMessage({
        roomId: room.id,
        accountId: ctx.cfopAccount.id,
        content: input.content,
      });
      return { success: true } as const;
    }),
};
