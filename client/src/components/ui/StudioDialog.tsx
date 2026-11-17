import { type ReactNode, useRef } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

/**
 * Hộp thoại modal dựa trên Radix Dialog.
 *
 * Component cũ tự dựng toàn bộ (portal, focus trap, khóa cuộn nền, Escape,
 * trả focus). Giờ do Radix đảm nhiệm; component này chỉ giữ lại phần trình
 * bày (tấm nền, vị trí, khung bề rộng) và API dùng chung của app:
 *
 * - `Dialog` + `DialogTitle`/`DialogDescription`: Radix tự nối `aria-labelledby`
 *   và `aria-describedby`
 * - focus chuyển vào hộp thoại khi mở và quay lại phần tử đã mở
 * - Escape hoặc bấm nền để đóng
 *
 * Tấm nền là `Dialog.Overlay`; `Dialog.Content` chính là tấm panel (nhỏ hơn
 * màn hình), nên bấm vào phần bên ngoài panel được Radix nhận là "ô outside"
 * và tự đóng hộp thoại.
 */
type DialogShellProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  dialogClassName?: string;
};

export function Dialog({
  open,
  onOpenChange,
  children,
  dialogClassName,
}: DialogShellProps) {
  // Call sites open the dialog with a plain button (not Dialog.Trigger), so
  // Radix cannot know what to restore focus to. Capture the element that had
  // focus BEFORE Radix moves it into the content — this runs at render time,
  // ahead of any effect.
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(open);
  if (open !== wasOpenRef.current) {
    if (open) {
      const previous = document.activeElement;
      restoreFocusRef.current =
        previous instanceof HTMLElement && previous !== document.body
          ? previous
          : null;
    }
    wasOpenRef.current = open;
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-50 bg-ink/45 backdrop-blur-[2px]"
          data-testid="dialog-backdrop"
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed inset-x-3 top-3 z-50 flex max-h-[calc(100dvh-1.5rem)] flex-col overflow-hidden rounded-[1.6rem] bg-surface sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:max-h-[min(88vh,56rem)] sm:w-full sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2",
            dialogClassName
          )}
          onCloseAutoFocus={event => {
            event.preventDefault();
            const target = restoreFocusRef.current;
            if (target && document.contains(target))
              target.focus({ preventScroll: true });
          }}
        >
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function DialogContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  // `min-h-0` lets the content shrink below its natural size so the body can
  // scroll instead of the dialog clipping what does not fit on screen.
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      {children}
    </div>
  );
}

export function DialogHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1 px-6 py-5", className)}>
      {children}
    </div>
  );
}

export function DialogTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <DialogPrimitive.Title
      className={cn(
        "text-lg font-semibold tracking-tight text-ink",
        className
      )}
    >
      {children}
    </DialogPrimitive.Title>
  );
}

export function DialogDescription({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <DialogPrimitive.Description
      className={cn("text-sm leading-relaxed text-muted", className)}
    >
      {children}
    </DialogPrimitive.Description>
  );
}

export function DialogFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mt-auto flex flex-wrap items-center justify-end gap-2 px-6 py-4",
        className
      )}
    >
      {children}
    </div>
  );
}
