import { TRPCError } from "@trpc/server";
import { cfopAccountProcedure } from "../_core/trpc";
import { createCompetitionCode } from "../services/competition";
import {
  createCompetitionRematch,
  createCompetitionRoom,
  deleteCompetitionRoom,
  findCompetitionMember,
  findCompetitionRoomByCode,
  finishCompetitionRoom,
  finishCompetitionRound,
  getCompetitionActiveRound,
  joinCompetitionRoom,
  leaveCompetitionRoom,
  listCompetitionMembers,
  listCompetitionRoomsForAccount,
} from "../db";
import { publishCompetitionEvent } from "../services/competitionEventBus";
import { createRoomInput, roomCodeInput } from "./inputs";
import {
  competitionHistory,
  competitionRoomState,
  requireCompetitionMember,
  requireCompetitionRoom,
} from "./competitionShared";
import {
  leaderboardCache,
  roomCreateLimiter,
  MAX_SPECTATORS_PER_ROOM,
  HOUR,
  roomCreateRateKey,
} from "./competitionState";

export const roomProcedures = {
  listMine: cfopAccountProcedure.query(({ ctx }) =>
    listCompetitionRoomsForAccount(ctx.cfopAccount.id)
  ),
  history: cfopAccountProcedure.query(({ ctx }) =>
    competitionHistory(ctx.cfopAccount.id)
  ),
  create: cfopAccountProcedure
    .input(createRoomInput)
    .mutation(async ({ ctx, input }) => {
      const rateResult = roomCreateLimiter.consume(
        roomCreateRateKey(ctx.cfopAccount.id),
        { limit: 5, windowMs: HOUR }
      );
      if (!rateResult.allowed)
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message:
            "Bạn tạo phòng quá nhiều trong một giờ. Vui lòng thử lại sau.",
        });
      let room = null;
      for (let attempt = 0; attempt < 5 && !room; attempt += 1) {
        const code = createCompetitionCode();
        if (await findCompetitionRoomByCode(code)) continue;
        room = await createCompetitionRoom({
          code,
          name: input.name,
          maxPlayers: input.maxPlayers,
          format: input.format,
          eventId: input.eventId,
          multiBlindCubes:
            input.eventId === "333mbf" ? input.multiBlindCubes : 2,
          hostAccountId: ctx.cfopAccount.id,
        });
      }
      if (!room)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Không thể tạo mã phòng. Hãy thử lại.",
        });
      return { code: room.code };
    }),
  join: cfopAccountProcedure
    .input(roomCodeInput)
    .mutation(async ({ ctx, input }) => {
      const room = await requireCompetitionRoom(input.code);
      if (await findCompetitionMember(room.id, ctx.cfopAccount.id))
        return { code: room.code };
      if (room.status !== "waiting")
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Phòng đã bắt đầu; không thể tham gia lượt này.",
        });
      if ((await listCompetitionMembers(room.id)).length >= room.maxPlayers)
        throw new TRPCError({
          code: "CONFLICT",
          message: "Phòng đã đủ người chơi.",
        });
      await joinCompetitionRoom(room.id, ctx.cfopAccount.id);
      publishCompetitionEvent(room.id, "member");
      return { code: room.code };
    }),
  spectate: cfopAccountProcedure
    .input(roomCodeInput)
    .mutation(async ({ ctx, input }) => {
      const room = await requireCompetitionRoom(input.code);
      if (!(await findCompetitionMember(room.id, ctx.cfopAccount.id))) {
        const members = await listCompetitionMembers(room.id);
        const spectators = members.filter(
          member => member.role === "spectator"
        ).length;
        if (spectators >= MAX_SPECTATORS_PER_ROOM)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Phòng đã đủ khán giả.",
          });
        await joinCompetitionRoom(room.id, ctx.cfopAccount.id, "spectator");
        publishCompetitionEvent(room.id, "member");
      }
      return { code: room.code };
    }),
  state: cfopAccountProcedure
    .input(roomCodeInput)
    .query(({ ctx, input }) =>
      competitionRoomState(input.code, ctx.cfopAccount.id)
    ),
  leave: cfopAccountProcedure
    .input(roomCodeInput)
    .mutation(async ({ ctx, input }) => {
      const room = await requireCompetitionRoom(input.code);
      if (room.hostAccountId === ctx.cfopAccount.id)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Chủ phòng không thể rời phòng. Hãy tạo phòng mới nếu cần.",
        });
      await requireCompetitionMember(room.id, ctx.cfopAccount.id);
      await leaveCompetitionRoom(room.id, ctx.cfopAccount.id);
      publishCompetitionEvent(room.id, "member");
      return { success: true } as const;
    }),
  delete: cfopAccountProcedure
    .input(roomCodeInput)
    .mutation(async ({ ctx, input }) => {
      const room = await requireCompetitionRoom(input.code);
      if (room.hostAccountId !== ctx.cfopAccount.id)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Chỉ chủ phòng được xóa phòng.",
        });
      if (room.status === "active")
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Không thể xóa khi phòng đang thi. Hãy hoàn tất thể thức trước.",
        });
      await deleteCompetitionRoom(room.id);
      publishCompetitionEvent(room.id, "room");
      return { success: true } as const;
    }),
  finish: cfopAccountProcedure
    .input(roomCodeInput)
    .mutation(async ({ ctx, input }) => {
      const room = await requireCompetitionRoom(input.code);
      if (room.hostAccountId !== ctx.cfopAccount.id)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Chỉ chủ phòng được hoàn tất thể thức.",
        });
      const activeRound = await getCompetitionActiveRound(room.id);
      if (activeRound) await finishCompetitionRound(activeRound.id);
      await finishCompetitionRoom(room.id);
      publishCompetitionEvent(room.id, "room");
      leaderboardCache.invalidate();
      return { success: true } as const;
    }),
  rematch: cfopAccountProcedure
    .input(roomCodeInput)
    .mutation(async ({ ctx, input }) => {
      const source = await requireCompetitionRoom(input.code);
      if (source.hostAccountId !== ctx.cfopAccount.id)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Chỉ chủ phòng được tạo Đấu lại.",
        });
      if (source.status !== "finished")
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Chỉ có thể Đấu lại sau khi phòng kết thúc.",
        });
      let room = null;
      for (let attempt = 0; attempt < 5 && !room; attempt += 1) {
        const code = createCompetitionCode();
        if (await findCompetitionRoomByCode(code)) continue;
        room = await createCompetitionRematch(source.id, code);
      }
      publishCompetitionEvent(source.id, "room");
      if (!room)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Không thể tạo phòng Đấu lại. Hãy thử lại.",
        });
      return { code: room.code };
    }),
};
