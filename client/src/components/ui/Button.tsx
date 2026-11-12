/**
 * The single button of the app.
 *
 * Trước đây mỗi nơi tự viết chuỗi class của nút, nên cùng một kiểu nút xuất
 * hiện ở nhiều dạng khác nhau (156 chỗ lặp lại cùng một chuỗi dài). Component
 * này gom phần đó lại: chọn `variant` và `size`, phần còn lại của giao diện
 * không tự thêm class nền, viền hay khoảng đệm.
 *
 *   <Button variant="primary" size="sm" icon={<Play />}>Bắt đầu</Button>
 *
 * Nút chỉ có nhãn trong khi hành động không có chữ (nút icon) thì dùng
 * `IconButton` của `StudioUI`.
 */
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant =
  /** Hành động chính của màn hình: nền tím, chữ trắng. */
  | "primary"
  /** Nền trắng, không viền — mặc định của app. */
  | "secondary"
  /** Nền trắng có viền xám. */
  | "outlined"
  /** Nền xám nhạt có viền, dùng khi nút nằm trong panel. */
  | "soft"
  /** Nền trong suốt, viền tím. */
  | "outline"
  /** Không viền, chữ phụ; dùng cho hành động phụ. */
  | "ghost"
  /** Nền trong suốt, viền đỏ. */
  | "danger"
  /** Nền đỏ đậm: hành động phá huỷ. */
  | "dangerSolid"
  /** Nền trong suốt, viền xanh. */
  | "success"
  /** Nền cảnh báo màu hổ phách, chữ đậm. */
  | "warning"
  /** Nền đậm, chữ sáng: nút trên nền tối. */
  | "inverse"
  /** Nút dạng liên kết: chữ tím, gạch chân khi rê chuột. */
  | "link";

export type ButtonSize =
  /** Nút tự do: không ép khoảng đệm, cỡ chữ, chiều cao dòng hay cách xuống dòng. */
  | "plain"
  | "xs"
  | "sm"
  | "md"
  | "lg";

/** Phần chung của mọi nút: bố cục, bo góc, viền focus và trạng thái tắt. */
const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white shadow-sm shadow-primary/25 hover:bg-primary-hover",
  // Không có `border`: nút nền trắng trong app vốn chỉ đặt màu viền
  // (`border-line`) mà không đặt độ dày, nên về hình thức là không viền.
  secondary: "border-line bg-surface text-ink hover:bg-surface-2",
  outlined: "border border-line bg-surface text-ink hover:bg-surface-2",
  soft: "border-line bg-surface-2 text-ink hover:bg-surface-3",
  outline: "border border-primary/35 bg-transparent text-primary hover:bg-primary-soft",
  ghost: "border border-transparent bg-transparent text-muted hover:bg-surface-2 hover:text-ink",
  danger: "border border-danger/35 bg-transparent text-danger hover:bg-danger-soft",
  dangerSolid: "bg-danger text-white shadow-sm hover:brightness-95",
  success: "border border-success/35 bg-transparent text-success hover:bg-success-soft",
  warning: "bg-warning text-ink shadow-sm hover:brightness-95",
  inverse: "bg-ink text-surface hover:opacity-90",
  link: "bg-transparent text-primary hover:underline",
};

/**
 * Kích thước.
 *
 * `sm` giữ nguyên khoảng đệm của `md` và chỉ nhỏ cỡ chữ: trước đây các nút
 * "nhỏ" trong app viết cả `px-4 py-2` lẫn `px-3 py-1.5`, mà Tailwind sinh CSS
 * theo thứ tự cố định nên `px-4` luôn thắng — tức là các nút đó thực tế vẫn
 * có khoảng đệm cỡ `md`. Giữ nguyên thực tế đó để giao diện không đổi.
 *
 * `whitespace-nowrap` và `leading-none` nằm ở kích thước chứ không ở phần
 * chung: nút không chỉ định kích thước thì giữ chiều cao dòng và cách xuống
 * dòng của khối cha — đúng như các nút viết tay trước đây.
 */
const buttonSizes: Record<ButtonSize, string> = {
  plain: "",
  xs: "px-3 py-1.5 text-xs whitespace-nowrap leading-none",
  sm: "px-4 py-2 text-xs whitespace-nowrap leading-none",
  md: "px-4 py-2 text-sm whitespace-nowrap leading-none",
  lg: "px-5 py-3 text-base whitespace-nowrap leading-none",
};

/**
 * Class của nút theo kiểu màu và kích thước.
 *
 * Dùng cho thẻ `<a>` / `<Link>` — thẻ này không thể dùng `<Button>` nhưng
 * vẫn phải trông đúng như nút. Nhờ đó chỉ có một nơi định nghĩa hình thức
 * của nút trong toàn app.
 */
export function buttonClass(variant: ButtonVariant = "secondary", size: ButtonSize = "md"): string {
  return cn(buttonBase, buttonVariants[variant], buttonSizes[size]);
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Hiện vòng quay và chặn bấm lại trong lúc hành động đang chạy. */
  loading?: boolean;
  /** Icon đặt trước nhãn. */
  icon?: ReactNode;
  /** Icon đặt sau nhãn. */
  iconRight?: ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "secondary",
    size = "md",
    loading = false,
    icon,
    iconRight,
    disabled,
    className,
    children,
    type = "button",
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonClass(variant, size), className)}
      {...rest}
    >
      {loading ? (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
          aria-hidden="true"
        />
      ) : (
        icon
      )}
      {children}
      {iconRight}
    </button>
  );
});
