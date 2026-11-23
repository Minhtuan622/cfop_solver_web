import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { cfopAccountProcedure, publicProcedure, router } from "../_core/trpc";
import {
  countPushSubscriptions,
  deletePushSubscription,
  findPushSubscription,
  updatePushSchedule,
  upsertPushSubscription,
} from "../db";
import { isAllowedPushEndpoint, readVapidConfig } from "../services/pushReminders";

/** Số trình duyệt tối đa một tài khoản bật nhắc ôn tập. */
export const MAX_PUSH_SUBSCRIPTIONS_PER_ACCOUNT = 5;

const endpointInput = z.string().url().max(512);
const timezoneInput = z.number().int().min(-840).max(840);

const subscribeInput = z.object({
  endpoint: endpointInput,
  p256dh: z.string().min(16).max(160),
  auth: z.string().min(8).max(64),
  tzOffsetMinutes: timezoneInput,
});

const syncInput = z.object({
  endpoint: endpointInput,
  /** Mốc đến hạn gần nhất (epoch ms); `null` khi chưa có case nào để ôn. */
  nextDueAt: z.number().int().nonnegative().nullable(),
  dueCount: z.number().int().min(0).max(100_000),
  tzOffsetMinutes: timezoneInput,
});

export const pushRouter = router({
  /** Khoá công khai để trình duyệt đăng ký; `null` khi máy chủ chưa bật tính năng. */
  config: publicProcedure.query(() => {
    const config = readVapidConfig();
    return { enabled: Boolean(config), publicKey: config?.publicKey ?? null };
  }),
  subscribe: cfopAccountProcedure
    .input(subscribeInput)
    .mutation(async ({ ctx, input }) => {
      if (!readVapidConfig())
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Thông báo ôn tập chưa được bật trên máy chủ.",
        });
      if (!isAllowedPushEndpoint(input.endpoint))
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Địa chỉ nhận thông báo không hợp lệ.",
        });
      const known = await findPushSubscription(ctx.cfopAccount.id, input.endpoint);
      if (
        !known &&
        (await countPushSubscriptions(ctx.cfopAccount.id)) >=
          MAX_PUSH_SUBSCRIPTIONS_PER_ACCOUNT
      )
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Bạn đã bật thông báo trên quá nhiều trình duyệt.",
        });
      await upsertPushSubscription({ accountId: ctx.cfopAccount.id, ...input });
      return { success: true } as const;
    }),
  /** Client báo lịch ôn tập mới. `subscribed: false` nghĩa là đăng ký đã mất (đăng ký lại). */
  sync: cfopAccountProcedure.input(syncInput).mutation(async ({ ctx, input }) => {
    const known = await findPushSubscription(ctx.cfopAccount.id, input.endpoint);
    if (!known) return { subscribed: false } as const;
    await updatePushSchedule(ctx.cfopAccount.id, input.endpoint, {
      nextDueAt: input.nextDueAt,
      dueCount: input.dueCount,
      tzOffsetMinutes: input.tzOffsetMinutes,
    });
    return { subscribed: true } as const;
  }),
  unsubscribe: cfopAccountProcedure
    .input(z.object({ endpoint: endpointInput }))
    .mutation(async ({ ctx, input }) => {
      await deletePushSubscription(ctx.cfopAccount.id, input.endpoint);
      return { success: true } as const;
    }),
});
