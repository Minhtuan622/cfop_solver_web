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
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter(
    element =>
      !element.hasAttribute("hidden") &&
      element.getAttribute("aria-hidden") !== "true",
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
    [descriptionId, titleId],
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
        active instanceof HTMLElement && active !== node && node.contains(active);
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
      <div
        ref={dialogRef}
        className="modal fade show d-block"
        role="dialog"
        aria-modal="true"
        aria-labelledby={hasTitle ? titleId : undefined}
        aria-describedby={hasDescription ? descriptionId : undefined}
        tabIndex={-1}
        onMouseDown={event => {
          if (event.target === event.currentTarget) onOpenChange(false);
        }}
      >
        <div
          className={`modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg modal-fullscreen-sm-down ${dialogClassName ?? ""}`}
        >
          <div className="modal-content">{children}</div>
        </div>
      </div>
      <div
        className="modal-backdrop fade show"
        data-testid="dialog-backdrop"
        aria-hidden="true"
        onMouseDown={() => onOpenChange(false)}
      />
    </DialogContext.Provider>,
    document.body,
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
  // `flex-fill` lets the content take the leftover room of the scrollable
  // modal, and `min-height: 0` lets it shrink below its content size so the
  // inner `.modal-body` scrolls instead of the dialog clipping what does not
  // fit on screen.
  return (
    <div
      className={`d-flex flex-column flex-fill ${className ?? ""}`}
      style={{ minHeight: 0 }}
    >
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
  return <div className={`modal-header ${className ?? ""}`}>{children}</div>;
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
    <h2 id={titleId} className={`modal-title fs-5 ${className ?? ""}`}>
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
    <p id={descriptionId} className={`text-body-secondary mb-0 ${className ?? ""}`}>
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
  return <div className={`modal-footer ${className ?? ""}`}>{children}</div>;
}
