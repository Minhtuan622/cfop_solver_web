import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import type { PublicCfopAccount } from "../cfopAccountAuth";
import { getCfopAccountFromRequest, toPublicCfopAccount } from "../cfopAccountAuth";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  cfopAccount: PublicCfopAccount | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let cfopAccount: PublicCfopAccount | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  try {
    const account = await getCfopAccountFromRequest(opts.req);
    cfopAccount = account ? toPublicCfopAccount(account) : null;
  } catch (error) {
    cfopAccount = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    cfopAccount,
  };
}
