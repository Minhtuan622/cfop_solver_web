import { useState } from "react";
import { validateRecordedSolution } from "@/lib/fastCube";
import {
  initialStateFor,
  updateSolveHistory,
  type SolveHistoryEntry,
  type SolvePenalty,
} from "@/lib/solveHistory";

export function useTimerSolveEditor({
  onSaved,
  unfinishedMessage,
  unsupportedMessage,
}: {
  onSaved: (entries: SolveHistoryEntry[]) => void;
  unfinishedMessage: string;
  unsupportedMessage: string;
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
  const changeSolution = (value: string) => {
    setEditSolution(value);
    if (solutionError) setSolutionError("");
  };
  const save = () => {
    if (!editing) return;
    const seconds = Number(editSeconds);
    if (!Number.isFinite(seconds) || seconds < 0) return;
    const validation = validateRecordedSolution(
      initialStateFor(editing),
      editSolution
    );
    if (!validation.valid && validation.error !== "empty") {
      setSolutionError(
        validation.error === "unfinished" ? unfinishedMessage : unsupportedMessage
      );
      return;
    }
    onSaved(
      updateSolveHistory(editing.id, {
        elapsedMs: Math.round(seconds * 1000),
        penalty: editPenalty,
        solution: validation.normalized,
        moves: validation.moves.length,
        note: editNote.trim(),
        tags: editTags
          .split(",")
          .map(tag => tag.trim())
          .filter(Boolean),
      })
    );
    setSolutionError("");
    setEditing(null);
  };

  return {
    editing,
    editSeconds,
    setEditSeconds,
    editPenalty,
    setEditPenalty,
    editSolution,
    changeSolution,
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

export type TimerSolveEditor = ReturnType<typeof useTimerSolveEditor>;
