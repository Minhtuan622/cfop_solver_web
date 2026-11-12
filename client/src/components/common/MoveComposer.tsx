/** Xưởng Cơ Khí Tốc Độ — move pad dùng mono telemetry, chip vuông và mint chỉ cho hành động hợp lệ. */
import { useState } from "react";
import { RotateCcw, Undo2, X } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/StudioUI";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormControls";
import { buttonClass } from "@/components/ui/Button";

const BASE_MOVES = ["U", "R", "F", "D", "L", "B", "M", "E", "S", "x", "y", "z"];
const MOVE_PATTERN = /(?:[URFDLBMESxyz](?:w)?(?:2|')?)/g;

function readMoves(value: string) {
  return value.match(MOVE_PATTERN) ?? [];
}

export function MoveComposer({
  value,
  onChange,
  label,
  pasteLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  pasteLabel: string;
}) {
  const [pasteValue, setPasteValue] = useState("");
  const moves = readMoves(value);
  const commit = (next: string[]) => onChange(next.join(" "));
  const append = (move: string) => commit([...moves, move]);
  const appendPaste = () => {
    const next = readMoves(pasteValue);
    if (next.length) commit([...moves, ...next]);
    setPasteValue("");
  };
  return (
    <section className="rounded-card border border-line/80 bg-surface shadow-soft mt-4">
      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <label className="mb-1.5 block text-sm font-medium text-ink mb-0">
            {label}
          </label>
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide bg-surface-3 text-ink">
            {moves.length} moves
          </span>
        </div>
        <div className="border border-line rounded-xl p-2 mt-4">
          {moves.length ? (
            <div className="flex flex-wrap gap-1">
              {moves.map((move, index) => (
                <Button
                  variant="secondary"
                  size="sm"
                  key={`${move}-${index}`}
                  type="button"
                  onClick={() =>
                    commit(moves.filter((_, itemIndex) => itemIndex !== index))
                  }
                >
                  {move}
                  <X className="text-base ml-1" />
                </Button>
              ))}
            </div>
          ) : (
            <span className="text-muted">—</span>
          )}
        </div>
        <div className="grid grid-cols-12 gap-2 mt-2">
          {BASE_MOVES.map(base => (
            <div key={base} className="col-span-12 sm:col-span-6">
              <div className="inline-flex flex-wrap items-center gap-1 w-full">
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => append(base)}
                >
                  {base}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => append(`${base}'`)}
                >
                  ′
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => append(`${base}2`)}
                >
                  2
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <IconButton
            label="Undo move"
            icon={<Undo2 className="text-lg" />}
            onClick={() => commit(moves.slice(0, -1))}
            disabled={!moves.length}
            className={`${buttonClass("secondary", "sm")}`}
          />
          <IconButton
            label="Clear moves"
            icon={<RotateCcw className="text-lg" />}
            onClick={() => commit([])}
            disabled={!moves.length}
            className={`${buttonClass("secondary", "sm")}`}
          />
        </div>
        <div className="flex w-full items-stretch mt-4">
          <Input
            value={pasteValue}
            onChange={event => setPasteValue(event.target.value)}
            placeholder={pasteLabel}
          />
          <Button
            variant="primary"
            size="md"
            type="button"
            onClick={appendPaste}
            disabled={!readMoves(pasteValue).length}
          >
            Add
          </Button>
        </div>
      </div>
    </section>
  );
}
