import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import {
  computeFloatingGeometry,
  floatingStyle,
  sameFloatingStyle,
} from "@/components/ui/floating";

/**
 * Dropdown chọn giá trị do app tự vẽ.
 *
 * `<select>` gốc dùng mũi tên và danh sách bật lên của hệ điều hành nên lệch
 * với phần còn lại của trang. Component này giữ đúng API của `<select>` (vẫn
 * nhận `<option value="…">`) nhưng tự vẽ danh sách, tự vẽ mũi tên và tự
 * lo bàn phím:
 *
 * - Mũi tên lên/xuống để mở và chuyển lựa chọn, Home/End tới đầu/cuối
 * - Enter hoặc Space để chọn, Escape để đóng
 * - Đóng khi bấm ra ngoài hoặc nhấn Tab
 *
 * Danh sách gắn vào `document.body` qua portal và định vị tuyệt đối theo toạ
 * độ tài liệu của nút (xem `floating.ts`), nên không bao giờ bị cắt bởi
 * `overflow-hidden` của card hay dialog chứa nó, và lật lên khi sát đáy khung
 * nhìn.
 *
 * Vùng danh sách dùng `aria-activedescendant` (mẫu combobox của WAI-ARIA) nên
 * trình đọc màn hình đọc đúng lựa chọn đang đứng.
 */

type OptionSpec = {
  value: string;
  label: ReactNode;
  disabled: boolean;
};

/** Đọc các `<option>` con thành danh sách lựa chọn. */
function readOptions(children: ReactNode): OptionSpec[] {
  const options: OptionSpec[] = [];
  Children.forEach(children, child => {
    if (!isValidElement(child)) return;
    const props = child.props as {
      value?: string;
      disabled?: boolean;
      children?: ReactNode;
    };
    if (props.value === undefined) return;
    // `<option value={0}>` hợp lệ trong JSX; về quy ước của component thì giá
    // trị luôn là chuỗi nên ép kiểu tại đây để so sánh và aria-selected đúng.
    options.push({
      value: String(props.value),
      label: props.children,
      disabled: Boolean(props.disabled),
    });
  });
  return options;
}

export type SelectProps = {
  /** Giá trị đang chọn. */
  value: string;
  /** Nhận thay đổi theo kiểu của `<select>`. */
  onChange: (event: { target: { value: string } }) => void;
  /** Các `<option>` của danh sách. */
  children: ReactNode;
  id?: string;
  /** Để giá trị được gửi khi bấm nút "Gửi" trong một form. */
  name?: string;
  disabled?: boolean;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  className?: string;
  /** Class cho nút bấm mở danh sách. */
  buttonClassName?: string;
};

type FloatingPosition = {
  placement: "bottom" | "top";
  style: CSSProperties;
};

export function Select({
  value,
  onChange,
  children,
  id,
  name,
  disabled = false,
  className,
  buttonClassName,
  ...rest
}: SelectProps) {
  const options = useMemo(() => readOptions(children), [children]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [floating, setFloating] = useState<FloatingPosition | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const generatedId = useId();
  const listId = `${id ?? generatedId}-list`;

  const selectedIndex = options.findIndex(option => option.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : options[0];

  /** Đo chỗ trống quanh nút để quyết định hướng mở và chiều cao danh sách. */
  const measure = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const scrollX = window.pageXOffset;
    const scrollY = window.pageYOffset;
    const geometry = computeFloatingGeometry({
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      scrollX,
      scrollY,
      triggerTop: rect.top,
      triggerBottom: rect.bottom,
      triggerLeft: rect.left,
      triggerWidth: rect.width,
    });
    const next: FloatingPosition = {
      placement: geometry.placement,
      style: floatingStyle(geometry, {
        align: "start",
        rightDoc: rect.right + scrollX,
        viewportWidth: window.innerWidth,
      }),
    };
    // Cuộn trang mà vị trí tương đối nút-trang không đổi thì đừng render lại
    // (scroll bắn rất dồn trong lúc cuộn mượt).
    setFloating(prev =>
      prev &&
      prev.placement === next.placement &&
      sameFloatingStyle(prev.style, next.style)
        ? prev
        : next,
    );
  }, []);

  /** Mở danh sách: đo trước vị trí nút để biết mở xuống hay lật lên. */
  const openList = useCallback(() => {
    if (disabled) return;
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    measure();
    setOpen(true);
  }, [disabled, selectedIndex, measure]);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      const node = event.target as Node;
      if (rootRef.current?.contains(node)) return;
      // Danh sách nổi qua portal nằm ngoài root, phải giữ riêng nếu không
      // lần pointerdown đầu trên danh sách sẽ đóng luôn.
      if (listRef.current?.contains(node)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [open]);

  // Trong lúc danh sách mở, đo lại khi cuộn hoặc đổi cỡ khung nhìn để danh
  // sách luôn bám theo nút. `capture: true` bắt cả scroll của các vùng cuộn
  // bên trong trang (scroll không nổi bọt lên window).
  useEffect(() => {
    if (!open) return;
    measure();
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [open, measure]);

  /** Bỏ qua lựa chọn đang bị tắt. */
  const step = (from: number, delta: number) => {
    if (!options.length) return from;
    let index = from;
    for (let count = 0; count < options.length; count += 1) {
      index = (index + delta + options.length) % options.length;
      if (!options[index].disabled) return index;
    }
    return from;
  };

  const choose = (index: number) => {
    const option = options[index];
    if (!option || option.disabled) return;
    onChange({ target: { value: option.value } });
    setOpen(false);
  };

  /**
   * Phím được xử lý trên nút bấm: danh sách không nhận tiêu điểm nhìn (tiêu
   * điểm vẫn ở nút, danh sách chỉ được đánh dấu bằng `aria-activedescendant`).
   */
  const onTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        // Lần đầu chỉ mở danh sách, chưa di chuyển khỏi lựa chọn đang chọn.
        openList();
      } else {
        setActiveIndex(index => step(index, event.key === "ArrowDown" ? 1 : -1));
      }
      return;
    }
    if (event.key === "Home" && open) {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }
    if (event.key === "End" && open) {
      event.preventDefault();
      setActiveIndex(Math.max(0, options.length - 1));
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open) choose(activeIndex);
      else openList();
      return;
    }
    if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
      return;
    }
    // Tab rời tiêu điểm sang control kế tiếp: đóng danh sách theo sau,
    // không chặn hành vi mặc định của trình duyệt.
    if (event.key === "Tab" && open) {
      setOpen(false);
    }
  };

  // Đưa lựa chọn đang đứng vào tầm nhìn.
  useEffect(() => {
    if (!open) return;
    const active = listRef.current?.querySelector<HTMLElement>(
      `#${CSS.escape(listId)}-option-${activeIndex}`,
    );
    // `scrollIntoView` không có trong mọi môi trường (ví dụ jsdom).
    if (typeof active?.scrollIntoView === "function") {
      active.scrollIntoView({ block: "nearest" });
    }
  }, [open, activeIndex, listId]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        ref={buttonRef}
        type="button"
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-option-${activeIndex}` : undefined}
        aria-label={rest["aria-label"]}
        aria-labelledby={rest["aria-labelledby"]}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          if (open) setOpen(false);
          else openList();
        }}
        onKeyDown={onTriggerKeyDown}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-field bg-surface-3 px-3.5 py-2.5 text-left text-sm text-ink outline-none transition focus-visible:bg-surface focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60",
          !disabled && "hover:bg-surface-2",
          buttonClassName
        )}
      >
        <span className="min-w-0 truncate">{selected?.label ?? ""}</span>
        <ChevronDown
          className={cn(
            "shrink-0 text-muted transition-transform duration-200",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>
      {open && floating
        ? createPortal(
            <div className="absolute inset-x-0 top-0 h-0">
              <ul
                ref={listRef}
                id={listId}
                role="listbox"
                tabIndex={-1}
                aria-label={rest["aria-label"]}
                aria-labelledby={rest["aria-labelledby"]}
                data-placement={floating.placement}
                style={floating.style}
                className="absolute z-50 list-none overflow-y-auto rounded-panel bg-surface-3 p-1.5"
              >
                {options.map((option, index) => {
                  const isSelected = option.value === value;
                  const isActive = index === activeIndex;
                  return (
                    <li
                      key={option.value}
                      id={`${listId}-option-${index}`}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={option.disabled || undefined}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => choose(index)}
                      className={cn(
                        "cursor-pointer rounded-xl px-3 py-2 text-sm transition",
                        isActive ? "bg-surface text-ink" : "text-muted",
                        isSelected && "font-semibold text-primary",
                        option.disabled && "cursor-not-allowed opacity-50"
                      )}
                    >
                      {option.label}
                    </li>
                  );
                })}
              </ul>
            </div>,
            document.body
          )
        : null}
      {name ? <input type="hidden" name={name} value={value} /> : null}
    </div>
  );
}
