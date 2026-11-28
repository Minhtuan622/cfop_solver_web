import { useSyncExternalStore } from "react";

export type PreviewView = "2d" | "3d";

export const PREVIEW_VIEW_KEY = "cfop-puzzle-preview-view";
const CHANGE_EVENT = "cfop-puzzle-preview-view-change";

export function readPreviewView(): PreviewView {
  try {
    return window.localStorage.getItem(PREVIEW_VIEW_KEY) === "2d" ? "2d" : "3d";
  } catch {
    return "3d";
  }
}

export function writePreviewView(view: PreviewView) {
  try {
    window.localStorage.setItem(PREVIEW_VIEW_KEY, view);
  } catch {
    // A blocked store only means the choice is not remembered.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(notify: () => void) {
  window.addEventListener(CHANGE_EVENT, notify);
  window.addEventListener("storage", notify);
  return () => {
    window.removeEventListener(CHANGE_EVENT, notify);
    window.removeEventListener("storage", notify);
  };
}

// The 2D/3D choice is shared by every preview on the page and remembered.
export function usePreviewView() {
  const view = useSyncExternalStore(subscribe, readPreviewView, () => "3d" as PreviewView);
  return [view, writePreviewView] as const;
}
