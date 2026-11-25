import test from 'node:test';
import assert from 'node:assert/strict';
import { clampContextMenuPosition, clampWindowBounds } from './windowLayout';

test('clampWindowBounds keeps title bar accessible after viewport shrink', () => {
  const clamped = clampWindowBounds(
    { x: 900, y: 700, width: 640, height: 480 },
    390,
    844,
    240,
    180
  );
  assert.ok(clamped.width <= 382);
  assert.ok(clamped.x < 390);
  assert.ok(clamped.y >= 0 && clamped.y <= 844 - 30 - 28);
});

test('clampContextMenuPosition keeps menu inside viewport near bottom-right corner', () => {
  const pos = clampContextMenuPosition(1010, 750, 180, 200, 1024, 768);
  assert.ok(pos.left + 180 <= 1024);
  assert.ok(pos.top + 200 <= 768 - 30);
});
