import {
  Children,
  isValidElement,
  useMemo,
  type ReactNode,
} from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "@/components/ui/Icon";
import { MENU_ITEM_CLASS } from "@/components/ui/Dropdown";
import { cn } from "@/lib/utils";

type OptionSpec = {
  value: string;
  label: ReactNode;
  disabled: boolean;
};

const EMPTY_OPTION = "__cfop_empty_option__";
const toItemValue = (value: string) =>
  value === "" ? EMPTY_OPTION : value;
const fromItemValue = (value: string) =>
  value === EMPTY_OPTION ? "" : value;

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
  value: string;
  onChange: (event: { target: { value: string } }) => void;
  children: ReactNode;
  id?: string;
  name?: string;
  disabled?: boolean;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  className?: string;
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
          "flex w-full items-center justify-between gap-1.5 rounded-field bg-surface-2 px-3 py-2.5 text-left text-sm text-ink transition-colors hover:bg-surface-3 focus-visible:bg-surface-3 data-[state=open]:bg-surface-3 disabled:cursor-not-allowed disabled:opacity-60",
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
          className="z-50 overflow-y-auto rounded-panel bg-menu p-1.5"
        >
          <SelectPrimitive.Viewport>
            {options.map(option => (
              <SelectPrimitive.Item
                key={option.value}
                value={toItemValue(option.value)}
                disabled={option.disabled}
                className={cn(
                  MENU_ITEM_CLASS,
                  "relative justify-between data-[state=checked]:font-semibold"
                )}
              >
                <SelectPrimitive.ItemText>
                  {option.label}
                </SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="shrink-0 text-primary">
                  <Check aria-hidden="true" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
    </div>
  );
}
