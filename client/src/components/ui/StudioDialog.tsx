import {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

type DialogContextValue = {
  titleId: string;
  descriptionId: string;
  registerTitle: () => void;
  registerDescription: () => void;
};

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialogContext(component: string) {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error(`${component} must be rendered inside a <Dialog>.`);
  }
  return context;
}

function focusableWithin(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  ).filter(
    element =>
      !element.hasAttribute("hidden") &&
      element.getAttribute("aria-hidden") !== "true"
  );
}

type ModalShellProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  dialogClassName?: string;
};

function ModalShell({
  open,
  onOpenChange,
  children,
  dialogClassName,
}: ModalShellProps) {
  const idSuffix = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const titleId = `cfop-dialog-title-${idSuffix}`;
  const descriptionId = `cfop-dialog-description-${idSuffix}`;
  const [hasTitle, setHasTitle] = useState(false);
  const [hasDescription, setHasDescription] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const context = useMemo<DialogContextValue>(
    () => ({
      titleId,
      descriptionId,
      registerTitle: () => setHasTitle(true),
      registerDescription: () => setHasDescription(true),
    }),
    [descriptionId, titleId]
  );

  // WAI-ARIA dialog pattern: move focus into the dialog when it opens and hand
  // it back to whatever opened it once it closes.
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    restoreFocusRef.current =
      previous instanceof HTMLElement && previous !== document.body
        ? previous
        : null;
    const node = dialogRef.current;
    if (node && !node.contains(document.activeElement)) {
      const [first] = focusableWithin(node);
      (first ?? node).focus();
    }
    return () => {
      const target = restoreFocusRef.current;
      restoreFocusRef.current = null;
      if (target && document.contains(target)) target.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onOpenChange(false);
        return;
      }
      if (event.key !== "Tab") return;
      const node = dialogRef.current;
      if (!node) return;
      const items = focusableWithin(node);
      if (items.length === 0) {
        event.preventDefault();
        node.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      const inside =
        active instanceof HTMLElement &&
        active !== node &&
        node.contains(active);
      if (!inside) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onOpenChange, open]);

  if (!open) return null;

  return createPortal(
    <DialogContext.Provider value={context}>
      <div className="fixed inset-0 z-50 overflow-y-auto" role="presentation">
        <div
          className="fixed inset-0 bg-ink/45 backdrop-blur-[2px]"
          data-testid="dialog-backdrop"
          aria-hidden="true"
          onMouseDown={() => onOpenChange(false)}
        />
        <div
          className="relative flex min-h-full items-start justify-center p-3 sm:items-center sm:p-6"
          onMouseDown={event => {
            if (event.target === event.currentTarget) onOpenChange(false);
          }}
        >
          <div
            ref={dialogRef}
            className={cn(
              "relative flex max-h-[calc(100dvh-1.5rem)] w-full flex-col overflow-hidden rounded-[1.6rem] border border-line/80 bg-surface shadow-float outline-none sm:max-h-[min(88vh,56rem)] sm:max-w-2xl",
              dialogClassName
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby={hasTitle ? titleId : undefined}
            aria-describedby={hasDescription ? descriptionId : undefined}
            tabIndex={-1}
          >
            {children}
          </div>
        </div>
      </div>
    </DialogContext.Provider>,
    document.body
  );
}

export function Dialog({
  open,
  onOpenChange,
  children,
  dialogClassName,
}: ModalShellProps) {
  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      dialogClassName={dialogClassName}
    >
      {children}
    </ModalShell>
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
    <div
      className={cn(
        "flex flex-col gap-1 border-b border-line px-6 py-5",
        className
      )}
    >
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
  const { titleId, registerTitle } = useDialogContext("DialogTitle");
  useEffect(() => {
    registerTitle();
  }, [registerTitle]);
  return (
    <h2
      id={titleId}
      className={cn("text-lg font-semibold tracking-tight text-ink", className)}
    >
      {children}
    </h2>
  );
}
export function DialogDescription({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { descriptionId, registerDescription } =
    useDialogContext("DialogDescription");
  useEffect(() => {
    registerDescription();
  }, [registerDescription]);
  return (
    <p
      id={descriptionId}
      className={cn("text-sm leading-relaxed text-muted", className)}
    >
      {children}
    </p>
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
        "mt-auto flex flex-wrap items-center justify-end gap-2 border-t border-line px-6 py-4",
        className
      )}
    >
      {children}
    </div>
  );
}
