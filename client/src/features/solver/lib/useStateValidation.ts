/**
 * Kiểm tra trạng thái 54 ô đang nhập (chế độ "trạng thái") bằng worker của bộ
 * giải, trễ 280 ms sau lần gõ cuối. Chế độ scramble không cần kiểm.
 */
import { useEffect, useState } from "react";
import { validateStateInBrowser, type CubeValidation } from "@/lib/solverRuntime";

export function useStateValidation({
  enabled,
  value,
  language,
  incompleteMessage,
}: {
  /** Chỉ kiểm khi đang ở chế độ nhập trạng thái. */
  enabled: boolean;
  value: string;
  language: string;
  /** Thông báo khi chưa đủ 54 ô. */
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
    // Như bản gốc: chạy lại khi đổi ngôn ngữ, chế độ hoặc giá trị.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, enabled, value]);

  return stateValidation;
}
