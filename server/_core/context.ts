import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { PublicCfopAccount } from "../services/cfopAccountAuth";
import { getCfopAccountFromRequest, toPublicCfopAccount } from "../services/cfopAccountAuth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  cfopAccount: PublicCfopAccount | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let cfopAccount: PublicCfopAccount | null = null;

  try {
    const account = await getCfopAccountFromRequest(opts.req);
    cfopAccount = account ? toPublicCfopAccount(account) : null;
  } catch (error) {
    cfopAccount = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    cfopAccount,
  };
}
