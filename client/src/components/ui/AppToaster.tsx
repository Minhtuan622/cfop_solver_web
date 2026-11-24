import { Toaster } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";

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
