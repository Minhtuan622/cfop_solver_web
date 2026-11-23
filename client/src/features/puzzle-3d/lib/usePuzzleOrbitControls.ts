/**
 * Điều khiển xoay/zoom bằng chuột và cảm ứng cho preview 3D: kéo để xoay (có
 * quán tính), chụm hai ngón để zoom mượt, và đặt lại góc nhìn. Các ref được
 * trả ra để vòng dựng cảnh của canvas ghi vào (quỹ đạo, hàm vẽ lại, hàm đặt lại).
 */
import { useRef, type PointerEvent } from "react";
import type { PuzzleId } from "./puzzleIds";
import {
  distanceFromPinch,
  gapBetween,
  inertiaStepForPuzzle,
  orbitFromPuzzleDrag,
  type PointerPoint,
} from "./puzzleCamera";

export function usePuzzleOrbitControls(puzzle: PuzzleId) {
  const dragRef = useRef<{
    x: number;
    y: number;
    yaw: number;
    pitch: number;
    lastX: number;
    lastY: number;
    lastAt: number;
    moved: boolean;
  } | null>(null);
  const orbitRef = useRef({ yaw: -0.55, pitch: 0.32, distance: 5.4 });
  const targetDistanceRef = useRef(5.4);
  const pointersRef = useRef(new Map<number, PointerPoint>());
  const pinchRef = useRef<{ gap: number; distance: number } | null>(null);
  const userZoomedRef = useRef(false);
  const zoomFrameRef = useRef<number | null>(null);
  const inertiaFrameRef = useRef<number | null>(null);
  const inertiaVelocityRef = useRef({ yaw: 0, pitch: 0 });
  const renderRef = useRef<(() => void) | null>(null);
  const resetRef = useRef<(() => void) | null>(null);

  const smoothZoom = () => {
    if (!renderRef.current) return;
    if (zoomFrameRef.current !== null) return;
    const tick = () => {
      const orbit = orbitRef.current;
      const target = targetDistanceRef.current;
      const nextDistance = orbit.distance + (target - orbit.distance) * 0.28;
      orbit.distance =
        Math.abs(target - nextDistance) < 0.01 ? target : nextDistance;
      renderRef.current?.();
      if (orbit.distance === target) {
        zoomFrameRef.current = null;
        return;
      }
      zoomFrameRef.current = window.requestAnimationFrame(tick);
    };
    zoomFrameRef.current = window.requestAnimationFrame(tick);
  };

  const cancelInertia = () => {
    if (inertiaFrameRef.current !== null)
      window.cancelAnimationFrame(inertiaFrameRef.current);
    inertiaFrameRef.current = null;
    inertiaVelocityRef.current = { yaw: 0, pitch: 0 };
  };

  const startInertia = () => {
    if (
      !renderRef.current ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const advance = () => {
      const next = inertiaStepForPuzzle(
        puzzle,
        orbitRef.current,
        inertiaVelocityRef.current
      );
      inertiaVelocityRef.current = next.velocity;
      if (
        Math.abs(next.velocity.yaw) < 0.0004 &&
        Math.abs(next.velocity.pitch) < 0.0004
      ) {
        cancelInertia();
        return;
      }
      orbitRef.current.yaw = next.orbit.yaw;
      orbitRef.current.pitch = next.orbit.pitch;
      renderRef.current?.();
      inertiaFrameRef.current = window.requestAnimationFrame(advance);
    };
    inertiaFrameRef.current = window.requestAnimationFrame(advance);
  };

  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (!renderRef.current) return;
    cancelInertia();
    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    if (pointersRef.current.size >= 2) {
      const points = Array.from(pointersRef.current.values());
      pinchRef.current = {
        gap: gapBetween(points),
        distance: targetDistanceRef.current,
      };
      dragRef.current = null;
      return;
    }
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      yaw: orbitRef.current.yaw,
      pitch: orbitRef.current.pitch,
      lastX: event.clientX,
      lastY: event.clientY,
      lastAt: performance.now(),
      moved: false,
    };
  };
  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(event.pointerId) || !renderRef.current) return;
    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    if (pointersRef.current.size >= 2 && pinchRef.current) {
      userZoomedRef.current = true;
      targetDistanceRef.current = distanceFromPinch(
        pinchRef.current.distance,
        pinchRef.current.gap,
        gapBetween(Array.from(pointersRef.current.values()))
      );
      smoothZoom();
      return;
    }
    const drag = dragRef.current;
    if (!drag) return;
    const now = performance.now();
    const elapsed = Math.max(8, now - drag.lastAt);
    inertiaVelocityRef.current = {
      yaw: ((event.clientX - drag.lastX) * 0.012 * 16) / elapsed,
      pitch: ((event.clientY - drag.lastY) * 0.012 * 16) / elapsed,
    };
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    drag.lastAt = now;
    drag.moved = true;
    const nextOrbit = orbitFromPuzzleDrag(
      puzzle,
      { yaw: drag.yaw, pitch: drag.pitch, distance: orbitRef.current.distance },
      event.clientX - drag.x,
      event.clientY - drag.y
    );
    orbitRef.current.yaw = nextOrbit.yaw;
    orbitRef.current.pitch = nextOrbit.pitch;
    renderRef.current();
  };
  const pointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const wasDragged = dragRef.current?.moved ?? false;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    pointersRef.current.delete(event.pointerId);
    pinchRef.current = null;
    const remaining = Array.from(pointersRef.current.values())[0];
    dragRef.current = remaining
      ? {
          x: remaining.x,
          y: remaining.y,
          yaw: orbitRef.current.yaw,
          pitch: orbitRef.current.pitch,
          lastX: remaining.x,
          lastY: remaining.y,
          lastAt: performance.now(),
          moved: false,
        }
      : null;
    if (!remaining && wasDragged) startInertia();
  };

  /** Đặt lại góc nhìn về mặc định (dừng quán tính, bỏ zoom của người dùng). */
  const resetView = () => {
    cancelInertia();
    userZoomedRef.current = false;
    resetRef.current?.();
    targetDistanceRef.current = orbitRef.current.distance;
  };

  return {
    orbitRef,
    targetDistanceRef,
    pointersRef,
    pinchRef,
    userZoomedRef,
    zoomFrameRef,
    inertiaFrameRef,
    renderRef,
    resetRef,
    pointerDown,
    pointerMove,
    pointerUp,
    resetView,
  };
}
