import type { WindowBounds } from '../types/os';

export const TASKBAR_HEIGHT = 30;
export const MIN_VISIBLE_TITLEBAR_X = 80;
export const MIN_VISIBLE_TITLEBAR_Y = 28;

export function clampWindowBounds(
  bounds: WindowBounds,
  viewportWidth: number,
  viewportHeight: number,
  minWidth = 220,
  minHeight = 140
): WindowBounds {
  const workHeight = Math.max(200, viewportHeight - TASKBAR_HEIGHT);
  const safeWidth = Math.min(Math.max(bounds.width, minWidth), Math.max(minWidth, viewportWidth - 8));
  const safeHeight = Math.min(Math.max(bounds.height, minHeight), Math.max(minHeight, workHeight - 8));

  const minX = -safeWidth + Math.min(MIN_VISIBLE_TITLEBAR_X, safeWidth);
  const maxX = Math.max(0, viewportWidth - Math.min(MIN_VISIBLE_TITLEBAR_X, safeWidth));
  const minY = 0;
  const maxY = Math.max(0, workHeight - MIN_VISIBLE_TITLEBAR_Y);

  return {
    x: Math.round(Math.min(Math.max(bounds.x, minX), maxX)),
    y: Math.round(Math.min(Math.max(bounds.y, minY), maxY)),
    width: Math.round(safeWidth),
    height: Math.round(safeHeight),
  };
}

export function getCascadedBounds(
  preferredWidth: number,
  preferredHeight: number,
  openCount: number,
  viewportWidth: number,
  viewportHeight: number,
  minWidth = 220,
  minHeight = 140
): WindowBounds {
  const step = (openCount % 7) * 24;
  const workHeight = Math.max(200, viewportHeight - TASKBAR_HEIGHT);
  const width = Math.min(preferredWidth, Math.max(minWidth, viewportWidth - 20));
  const height = Math.min(preferredHeight, Math.max(minHeight, workHeight - 20));
  const baseX = viewportWidth >= 800 ? 104 : 16;
  const x = Math.min(baseX + step, Math.max(8, viewportWidth - width - 8));
  const y = Math.min(34 + step, Math.max(8, workHeight - height - 8));
  return clampWindowBounds({ x, y, width, height }, viewportWidth, viewportHeight, minWidth, minHeight);
}

export function clampContextMenuPosition(
  x: number,
  y: number,
  menuWidth: number,
  menuHeight: number,
  viewportWidth: number,
  viewportHeight: number
): { left: number; top: number } {
  const maxLeft = Math.max(4, viewportWidth - menuWidth - 4);
  const maxTop = Math.max(4, viewportHeight - TASKBAR_HEIGHT - menuHeight - 4);
  return {
    left: Math.round(Math.min(Math.max(4, x), maxLeft)),
    top: Math.round(Math.min(Math.max(4, y), maxTop)),
  };
}
