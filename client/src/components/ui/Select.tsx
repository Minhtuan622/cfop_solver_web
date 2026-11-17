import {
  Children,
  isValidElement,
  useMemo,
  type ReactNode,
} from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDown } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

/**
 * Dropdown chọn giá trị dựa trên Radix Select.
 *
 * `<select>` gốc dùng mũi tên và danh sách bật lên của hệ điều hành nên lệch
 * với phần còn lại của trang. Component này giữ đúng API của `<select>` (vẫn
 * nhận `<option value="…">`) nhưng vẽ bằng Radix, nên tự lo cổng gắn vào body,
 * bàn phím, focus, gõ tắt (typeahead), lật mở khi sát đáy và accessibility:
 *
 * - Mũi tên lên/xuống để mở và chuyển lựa chọn, Home/End tới đầu/cuối
 * - Enter hoặc Space để chọn, Escape để đóng
 * - Đóng khi bấm ra ngoài hoặc nhấn Tab
 */
type OptionSpec = {
  value: string;
  label: ReactNode;
  disabled: boolean;
};

/** Radix rejects empty item values; keep a sentinel internally instead. */
const EMPTY_OPTION = "__cfop_empty_option__";
const toItemValue = (value: string) =>
  value === "" ? EMPTY_OPTION : value;
const fromItemValue = (value: string) =>
  value === EMPTY_OPTION ? "" : value;

/** Đọc các `<option>` con thành danh sách lựa chọn. */
function readOptions(children: ReactNode): OptionSpec[] {
  const options: OptionSpec[] = [];
  Children.forEach(children, child => {
    if (!isValidElement(child)) return;
    const props = child.props as {
      value?: string | number;
      disabled?: boolean;
      children?: ReactNode;
    };
    if (props.value === undefined) return;
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

  return (
    <div className={cn("relative", className)}>
      <SelectPrimitive.Root
        value={toItemValue(value)}
        onValueChange={next => onChange({ target: { value: fromItemValue(next) } })}
        disabled={disabled}
        name={name}
      >
      <SelectPrimitive.Trigger
        id={id}
        aria-label={rest["aria-label"]}
        aria-labelledby={rest["aria-labelledby"]}
        className={cn(
          "flex w-full items-center justify-between gap-1.5 rounded-field bg-surface-3 px-3 py-2.5 text-left text-sm text-ink transition focus-visible:bg-surface focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 hover:bg-surface-2 data-[state=open]:bg-surface",
          buttonClassName
        )}
      >
        <SelectPrimitive.Value />
        <SelectPrimitive.Icon asChild>
          <ChevronDown
            className="shrink-0 text-muted transition-transform duration-200"
            aria-hidden="true"
          />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          collisionPadding={8}
          align="start"
          style={{
            minWidth: "var(--radix-select-trigger-width)",
            maxHeight: "var(--radix-select-content-available-height)",
          }}
          className="z-50 overflow-y-auto rounded-panel bg-surface-3 p-1.5"
        >
          <SelectPrimitive.Viewport>
            {options.map(option => (
              <SelectPrimitive.Item
                key={option.value}
                value={toItemValue(option.value)}
                disabled={option.disabled}
                className={cn(
                  "relative flex cursor-pointer select-none items-center rounded-xl px-3 py-2 text-sm text-muted transition",
                  "data-[highlighted]:bg-surface data-[highlighted]:text-ink",
                  "data-[state=checked]:font-semibold data-[state=checked]:text-primary",
                  "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50"
                )}
              >
                <SelectPrimitive.ItemText>
                  {option.label}
                </SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
    </div>
  );
}
