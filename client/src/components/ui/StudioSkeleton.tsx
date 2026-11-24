import { cn } from "@/lib/utils";

export function SkeletonCard({
  lines = 3,
  className,
  label = "Đang tải nội dung",
}: {
  lines?: number;
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-card bg-surface p-5 sm:p-6",
        className
      )}
      role="status"
      aria-label={label}
    >
      <span className="mb-4 block h-4 w-1/2 rounded-full bg-surface-3" />
      {Array.from({ length: lines }, (_, index) => (
        <span
          key={index}
          className={cn(
            "mb-2.5 block h-3 rounded-full bg-surface-3",
            index === lines - 1 ? "w-7/12" : "w-full"
          )}
        />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function SkeletonList({
  rows = 4,
  label = "Đang tải danh sách",
}: {
  rows?: number;
  label?: string;
}) {
  return (
    <div
      className="overflow-hidden rounded-panel bg-surface"
      role="status"
      aria-label={label}
    >
      {Array.from({ length: rows }, (_, index) => (
        <div className="space-y-2 p-4" key={index}>
          <span className="block h-3 w-1/3 rounded-full bg-surface-3" />
          <span className="block h-3 w-full rounded-full bg-surface-3" />
          <span className="block h-3 w-2/3 rounded-full bg-surface-3" />
        </div>
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
  label = "Đang tải bảng dữ liệu",
}: {
  rows?: number;
  columns?: number;
  label?: string;
}) {
  return (
    <div
      className="overflow-x-auto"
      role="status"
      aria-label={label}
    >
      <table className="w-full text-left text-sm">
        <tbody>
          {Array.from({ length: rows }, (_, row) => (
            <tr key={row}>
              {Array.from({ length: columns }, (_, column) => (
                <td key={column} className="px-3 py-3">
                  <span
                    className={cn(
                      "block h-3 rounded-full bg-surface-3",
                      column === 0 ? "w-1/3" : "w-2/3"
                    )}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <span className="sr-only">{label}</span>
    </div>
  );
}
