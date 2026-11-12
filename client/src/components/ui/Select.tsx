import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ChevronDown } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

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
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const generatedId = useId();
  const listId = `${id ?? generatedId}-list`;

  const selectedIndex = options.findIndex(option => option.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : options[0];

  useEffect(() => {
    if (!open) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [open]);

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
        setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
        setOpen(true);
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
      else {
        setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
        setOpen(true);
      }
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
    const active = listRef.current?.querySelector<HTMLElement>(`#${CSS.escape(listId)}-option-${activeIndex}`);
    // `scrollIntoView` không có trong mọi môi trường (ví dụ jsdom).
    if (typeof active?.scrollIntoView === "function") {
      active.scrollIntoView({ block: "nearest" });
    }
  }, [open, activeIndex, listId]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
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
          setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
          setOpen(value => !value);
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
      {open ? (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-label={rest["aria-label"]}
          aria-labelledby={rest["aria-labelledby"]}
          className="absolute z-50 mt-2 max-h-72 w-full min-w-48 list-none overflow-y-auto rounded-panel bg-surface-3 p-1.5"
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
      ) : null}
      {name ? <input type="hidden" name={name} value={value} /> : null}
    </div>
  );
}
