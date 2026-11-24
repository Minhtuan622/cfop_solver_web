import { router } from "./_core/trpc";
import { accountRouter } from "./routers/account";
import { competitionRouter } from "./routers/competition";
import { pushRouter } from "./routers/push";
import { wcaRouter } from "./routers/wca";

export const appRouter = router({
  cfopAccount: accountRouter,
  wca: wcaRouter,
  competition: competitionRouter,
  push: pushRouter,
});

export type AppRouter = typeof appRouter;
