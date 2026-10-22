import { Toaster } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";

/**
 * The single toast surface of the app.
 *
 * Every transient message — a new personal record, a moderation notice — goes
 * through sonner so the look and the placement never depend on the page that
 * raised it. The colours come from the Bootstrap tokens, see `.sonner-toaster`
 * in `index.css`.
 */
export function AppToaster() {
  const { resolved } = useTheme();
  return (
    <Toaster
      theme={resolved}
      position="bottom-right"
      closeButton
      toastOptions={{ className: "cfop-toast" }}
    />
  );
}
