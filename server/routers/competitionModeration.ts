import { TRPCError } from "@trpc/server";
import { cfopAccountProcedure } from "../_core/trpc";
import {
  createCompetitionMessage,
  createCompetitionModerationLog,
  markCompetitionSpectatorRemoved,
  updateCompetitionMemberRole,
} from "../db";
import { publishCompetitionEvent } from "../services/competitionEventBus";
import { memberTargetInput, removeSpectatorInput } from "./inputs";
import { requireCompetitionMember, requireCompetitionRoom } from "./competitionShared";

export const moderationProcedures = {
  grantModerator: cfopAccountProcedure
    .input(memberTargetInput)
    .mutation(async ({ ctx, input }) => {
      const room = await requireCompetitionRoom(input.code);
      if (room.hostAccountId !== ctx.cfopAccount.id)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Chỉ chủ phòng được cấp quyền moderator.",
        });
      const target = await requireCompetitionMember(room.id, input.accountId);
      if (target.role !== "spectator")
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Chỉ spectator có thể được nâng lên moderator.",
        });
      await updateCompetitionMemberRole(room.id, input.accountId, "moderator");
      publishCompetitionEvent(room.id, "member");
      return { success: true } as const;
    }),
  revokeModerator: cfopAccountProcedure
    .input(memberTargetInput)
    .mutation(async ({ ctx, input }) => {
      const room = await requireCompetitionRoom(input.code);
      if (room.hostAccountId !== ctx.cfopAccount.id)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Chỉ chủ phòng được gỡ quyền moderator.",
        });
      const target = await requireCompetitionMember(room.id, input.accountId);
      if (target.role !== "moderator")
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Thành viên này không phải moderator.",
        });
      await updateCompetitionMemberRole(room.id, input.accountId, "spectator");
      publishCompetitionEvent(room.id, "member");
      return { success: true } as const;
    }),
  removeSpectator: cfopAccountProcedure
    .input(removeSpectatorInput)
    .mutation(async ({ ctx, input }) => {
      const room = await requireCompetitionRoom(input.code);
      const actor = await requireCompetitionMember(room.id, ctx.cfopAccount.id);
      if (
        room.hostAccountId !== ctx.cfopAccount.id &&
        actor.role !== "moderator"
      )
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Chỉ chủ phòng hoặc moderator được quản lý khán giả.",
        });
      const target = await requireCompetitionMember(room.id, input.accountId);
      if (target.role !== "spectator")
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Chỉ có thể loại spectator.",
        });
      await createCompetitionModerationLog({
        roomId: room.id,
        actorAccountId: ctx.cfopAccount.id,
        targetAccountId: input.accountId,
        reason: input.reason,
      });
      await createCompetitionMessage({
        roomId: room.id,
        accountId: ctx.cfopAccount.id,
        content: "[system] Moderator đã loại một người xem khỏi phòng.",
      });
      await markCompetitionSpectatorRemoved(room.id, input.accountId);
      publishCompetitionEvent(room.id, "member");
      return { success: true } as const;
    }),
};
