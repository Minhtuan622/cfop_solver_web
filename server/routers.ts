import { router } from "./_core/trpc";
import { accountRouter } from "./routers/account";
import { competitionRouter } from "./routers/competition";
import { pushRouter } from "./routers/push";
import { wcaRouter } from "./routers/wca";

/**
 * Root tRPC router. Domain procedures live in focused modules; this file only
 * preserves the public API tree consumed by the frontend and server adapter.
 */
export const appRouter = router({
  cfopAccount: accountRouter,
  wca: wcaRouter,
  competition: competitionRouter,
  push: pushRouter,
});

export type AppRouter = typeof appRouter;
