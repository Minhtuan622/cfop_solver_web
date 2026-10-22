import { useCallback, useEffect, useRef, useState } from "react";

export type AsyncRunner<Args extends unknown[], Result> = (...args: Args) => Promise<Result>;

export type UseAsyncResult<Args extends unknown[], Result> = {
  pending: boolean;
  error: string | null;
  run: (...args: Args) => Promise<Result | undefined>;
};

/**
 * Runs an async action and exposes the pending and error state of the last
 * run, so buttons and forms can react to it instead of tracking it by hand.
 */
export function useAsync<Args extends unknown[], Result>(
  action: AsyncRunner<Args, Result>,
): UseAsyncResult<Args, Result> {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(
    async (...args: Args): Promise<Result | undefined> => {
      setPending(true);
      setError(null);
      try {
        return await action(...args);
      } catch (reason) {
        if (mounted.current) {
          setError(reason instanceof Error ? reason.message : String(reason));
        }
        return undefined;
      } finally {
        if (mounted.current) setPending(false);
      }
    },
    [action],
  );

  return { pending, error, run };
}
