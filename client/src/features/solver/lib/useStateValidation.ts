import { useEffect, useState } from "react";
import { validateStateInBrowser, type CubeValidation } from "@/lib/solverRuntime";

export function useStateValidation({
  enabled,
  value,
  language,
  incompleteMessage,
}: {
  enabled: boolean;
  value: string;
  language: string;
  incompleteMessage: string;
}) {
  const [stateValidation, setStateValidation] = useState<CubeValidation | null>(
    null
  );

  useEffect(() => {
    if (!enabled) {
      setStateValidation(null);
      return;
    }
    const candidate = value.trim();
    if (candidate.length !== 54) {
      setStateValidation({ valid: false, message: incompleteMessage });
      return;
    }
    let active = true;
    const timer = window.setTimeout(() => {
      validateStateInBrowser(candidate)
        .then(validation => {
          if (active) setStateValidation(validation);
        })
        .catch(reason => {
          if (active)
            setStateValidation({
              valid: false,
              message:
                reason instanceof Error ? reason.message : "Validation failed.",
            });
        });
    }, 280);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, enabled, value]);

  return stateValidation;
}
