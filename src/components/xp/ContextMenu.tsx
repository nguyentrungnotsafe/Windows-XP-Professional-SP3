import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ContextMenuItem } from '../../types/os';
import { clampContextMenuPosition } from '../../utils/windowLayout';

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ left: x, top: y });

  useLayoutEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const clamped = clampContextMenuPosition(
      x,
      y,
      rect.width || 170,
      rect.height || 180,
      window.innerWidth,
      window.innerHeight
    );
    setCoords(clamped);
  }, [x, y, items]);

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('pointerdown', handlePointerDown, true);
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown, true);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Context menu"
      style={{ left: coords.left, top: coords.top, zIndex: 9990 }}
      className="fixed min-w-[168px] max-w-[240px] max-h-[calc(100vh-38px)] overflow-y-auto bg-[#ffffff] border border-[#aca899] shadow-[2px_2px_4px_rgba(0,0,0,0.28)] py-[2px] px-[2px] text-[11px] text-[#000000]"
    >
      {items.map((item) => (
        <React.Fragment key={item.id}>
          {item.separatorBefore && <div className="my-[2px] mx-[3px] border-t border-[#aca899]" />}
          <button
            type="button"
            role="menuitem"
            disabled={item.disabled}
            onClick={() => {
              if (item.disabled) return;
              onClose();
              item.onSelect?.();
            }}
            className={`w-full text-left px-5 py-[3px] flex items-center justify-between whitespace-nowrap cursor-default relative focus:outline-none ${
              item.disabled
                ? 'text-[#8d8b7e]'
                : 'text-[#000000] hover:bg-[#316ac5] hover:text-[#ffffff] focus-visible:bg-[#316ac5] focus-visible:text-[#ffffff]'
            } ${item.bold ? 'font-bold' : ''}`}
          >
            {item.checked && (
              <span className="absolute left-1.5 text-[10px]" aria-hidden="true">
                ✓
              </span>
            )}
            <span className="truncate">{item.label}</span>
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};
