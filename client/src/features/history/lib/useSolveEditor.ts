/**
 * State của hộp thoại sửa một lượt giải: thời gian gốc, penalty, solution
 * (chỉ 3×3×3 mới kiểm và phát lại được), ghi chú và tag.
 */
import { useState } from "react";
import { validateRecordedSolution } from "@/lib/fastCube";
import {
  initialStateFor,
  updateSolveHistory,
  type SolveHistoryEntry,
  type SolvePenalty,
} from "@/lib/solveHistory";
import { normalizeTimerEventId } from "@/lib/timerEvents";

export function useSolveEditor({
  onSaved,
  invalidSolutionMessage,
}: {
  /** Nhận danh sách lượt giải sau khi lưu. */
  onSaved: (entries: SolveHistoryEntry[]) => void;
  invalidSolutionMessage: string;
}) {
  const [editing, setEditing] = useState<SolveHistoryEntry | null>(null);
  const [editSeconds, setEditSeconds] = useState("");
  const [editPenalty, setEditPenalty] = useState<SolvePenalty>("none");
  const [editSolution, setEditSolution] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editTags, setEditTags] = useState("");
  const [solutionError, setSolutionError] = useState("");

  const open = (entry: SolveHistoryEntry) => {
    setEditing(entry);
    setEditSeconds((entry.elapsedMs / 1000).toFixed(2));
    setEditPenalty(entry.penalty);
    setEditSolution(entry.solution);
    setEditNote(entry.note);
    setEditTags(entry.tags.join(", "));
    setSolutionError("");
  };
  const close = () => setEditing(null);
  const save = () => {
    if (!editing) return;
    const seconds = Number(editSeconds);
    if (!Number.isFinite(seconds) || seconds < 0) return;
    const supportsReplay = normalizeTimerEventId(editing.eventId) === "333";
    const validation = supportsReplay
      ? validateRecordedSolution(initialStateFor(editing), editSolution)
      : {
          valid: true,
          normalized: editing.solution,
          moves: editing.moves ? [editing.solution] : ([] as string[]),
        };
    if (!validation.valid && validation.error !== "empty") {
      setSolutionError(invalidSolutionMessage);
      return;
    }
    onSaved(
      updateSolveHistory(editing.id, {
        elapsedMs: Math.round(seconds * 1000),
        penalty: editPenalty,
        solution: validation.normalized,
        moves: supportsReplay ? validation.moves.length : editing.moves,
        note: editNote.trim(),
        tags: editTags
          .split(",")
          .map(value => value.trim())
          .filter(Boolean),
      })
    );
    setEditing(null);
  };

  return {
    editing,
    /** Chỉ lượt 3×3×3 mới có ô sửa solution (kiểm và phát lại được). */
    supportsReplay: editing
      ? normalizeTimerEventId(editing.eventId) === "333"
      : false,
    editSeconds,
    setEditSeconds,
    editPenalty,
    setEditPenalty,
    editSolution,
    setEditSolution,
    editNote,
    setEditNote,
    editTags,
    setEditTags,
    solutionError,
    open,
    close,
    save,
  };
}

export type SolveEditor = ReturnType<typeof useSolveEditor>;
