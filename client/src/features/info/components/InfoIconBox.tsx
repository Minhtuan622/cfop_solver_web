import type { ComponentType } from "react";

type IconComponent = ComponentType<{ className?: string }>;

// Ô icon 40px dùng chung cho các trang thông tin (Về chúng tôi, Hướng dẫn, Ủng hộ).
export function InfoIconBox({ icon: Icon }: { icon: IconComponent }) {
  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
      <Icon className="size-5" />
    </span>
  );
}
