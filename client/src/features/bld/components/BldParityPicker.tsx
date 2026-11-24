import type { ReactNode } from "react";
import { Select } from "@/components/ui/Select";
import { CORNER_POSITIONS, EDGE_POSITIONS } from "../lib/bldExecution";

export function BldParityPicker({
  vi,
  parityEdges,
  parityCorners,
  onParityEdgesChange,
  onParityCornersChange,
  children,
}: {
  vi: boolean;
  parityEdges: [string, string];
  parityCorners: [string, string];
  onParityEdgesChange: (pair: [string, string]) => void;
  onParityCornersChange: (pair: [string, string]) => void;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-card bg-surface">
      <div className="p-5 sm:p-6">
        <h4 className="text-sm font-semibold tracking-tight text-warning">
          Parity ·{" "}
          {vi ? "chọn cặp tích hợp" : "select integration pairs"}
        </h4>
        <div className="grid grid-cols-12 gap-2">
          {([parityEdges, parityCorners] as const).map(
            (selection, familyIndex) => (
              <div
                key={familyIndex}
                className="col-span-12 md:col-span-6"
              >
                <label className="mb-1.5 block text-sm font-medium text-ink">
                  {familyIndex === 0
                    ? vi
                      ? "Cạnh"
                      : "Edges"
                    : vi
                      ? "Góc"
                      : "Corners"}
                </label>
                <div className="flex w-full items-stretch text-xs">
                  <Select
                    value={selection[0]}
                    onChange={event =>
                      familyIndex === 0
                        ? onParityEdgesChange([
                            event.target.value,
                            parityEdges[1],
                          ])
                        : onParityCornersChange([
                            event.target.value,
                            parityCorners[1],
                          ])
                    }
                  >
                    {(familyIndex === 0
                      ? EDGE_POSITIONS
                      : CORNER_POSITIONS
                    ).map(position => (
                      <option key={position} value={String(position)}>{position}</option>
                    ))}
                  </Select>
                  <Select
                    value={selection[1]}
                    onChange={event =>
                      familyIndex === 0
                        ? onParityEdgesChange([
                            parityEdges[0],
                            event.target.value,
                          ])
                        : onParityCornersChange([
                            parityCorners[0],
                            event.target.value,
                          ])
                    }
                  >
                    {(familyIndex === 0
                      ? EDGE_POSITIONS
                      : CORNER_POSITIONS
                    ).map(position => (
                      <option key={position} value={String(position)}>{position}</option>
                    ))}
                  </Select>
                </div>
              </div>
            )
          )}
        </div>
        {children ? (
          <div className="overflow-hidden rounded-panel bg-surface mt-4">
            {children}
          </div>
        ) : (
          <p className="text-sm text-danger mt-4 mb-0">
            {vi
              ? "Cặp đã chọn không tạo được exact standard key."
              : "Selected pairs do not produce an exact standard key."}
          </p>
        )}
      </div>
    </div>
  );
}
