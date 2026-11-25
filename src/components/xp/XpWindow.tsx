import React, { useRef } from 'react';
import type { WindowBounds, WindowInstance } from '../../types/os';
import { clampWindowBounds, TASKBAR_HEIGHT } from '../../utils/windowLayout';
import { XpIcon, type XpIconName } from './XpIcons';

interface XpWindowProps {
  win: WindowInstance;
  active: boolean;
  blockedByModal: boolean;
  iconName: XpIconName;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onMaximizeToggle: () => void;
  onBoundsChange: (bounds: WindowBounds) => void;
  children: React.ReactNode;
}

type ResizeEdge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

export const XpWindow: React.FC<XpWindowProps> = ({
  win,
  active,
  blockedByModal,
  iconName,
  onFocus,
  onClose,
  onMinimize,
  onMaximizeToggle,
  onBoundsChange,
  children,
}) => {
  const windowRef = useRef<HTMLDivElement>(null);

  if (win.minimized) {
    return null;
  }

  const handleTitlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || blockedByModal) return;
    if ((e.target as HTMLElement).closest('button')) return;
    onFocus();
    if (win.maximized) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const orig = win.bounds;

    const handleMove = (mv: PointerEvent) => {
      const dx = mv.clientX - startX;
      const dy = mv.clientY - startY;
      const next = clampWindowBounds(
        { ...orig, x: orig.x + dx, y: orig.y + dy },
        window.innerWidth,
        window.innerHeight,
        win.minWidth,
        win.minHeight
      );
      onBoundsChange(next);
    };

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  const handleResizePointerDown = (edge: ResizeEdge) => (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !win.resizable || win.maximized || blockedByModal) return;
    e.stopPropagation();
    onFocus();

    const startX = e.clientX;
    const startY = e.clientY;
    const orig = win.bounds;

    const handleMove = (mv: PointerEvent) => {
      const dx = mv.clientX - startX;
      const dy = mv.clientY - startY;
      let { x, y, width, height } = orig;

      if (edge.includes('e')) {
        width = Math.max(win.minWidth, orig.width + dx);
      }
      if (edge.includes('s')) {
        height = Math.max(win.minHeight, orig.height + dy);
      }
      if (edge.includes('w')) {
        const nextWidth = Math.max(win.minWidth, orig.width - dx);
        x = orig.x + (orig.width - nextWidth);
        width = nextWidth;
      }
      if (edge.includes('n')) {
        const nextHeight = Math.max(win.minHeight, orig.height - dy);
        y = Math.max(0, orig.y + (orig.height - nextHeight));
        height = nextHeight;
      }

      const maxBottom = window.innerHeight - TASKBAR_HEIGHT;
      if (y + height > maxBottom && edge.includes('s')) {
        height = Math.max(win.minHeight, maxBottom - y);
      }
      onBoundsChange({ x, y, width, height });
    };

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  const style: React.CSSProperties = win.maximized
    ? {
        left: 0,
        top: 0,
        width: '100vw',
        height: `calc(100vh - ${TASKBAR_HEIGHT}px)`,
        zIndex: win.zIndex,
      }
    : {
        left: win.bounds.x,
        top: win.bounds.y,
        width: win.bounds.width,
        height: win.bounds.height,
        zIndex: win.zIndex,
      };

  return (
    <div
      ref={windowRef}
      role="dialog"
      aria-label={win.title}
      data-window-id={win.id}
      data-app-id={win.appId}
      data-active={active ? 'true' : 'false'}
      style={style}
      onPointerDown={() => {
        if (!blockedByModal) onFocus();
      }}
      className={`fixed flex flex-col select-none ${
        win.maximized ? 'rounded-none' : 'rounded-t-[7px]'
      } ${active ? 'xp-window-active-border' : 'xp-window-inactive-border'} bg-[#ece9d8]`}
    >
      {/* Title Bar */}
      <div
        onPointerDown={handleTitlePointerDown}
        onDoubleClick={() => {
          if (win.canMaximize && !blockedByModal) onMaximizeToggle();
        }}
        className={`h-[27px] shrink-0 flex items-center justify-between px-[5px] gap-1.5 ${
          win.maximized ? '' : 'rounded-t-[5px]'
        } ${active ? 'xp-titlebar-active' : 'xp-titlebar-inactive'}`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <XpIcon name={iconName} size={16} />
          <span
            className="text-[12px] font-bold text-[#ffffff] truncate"
            style={{ textShadow: active ? '1px 1px 1px rgba(0,0,0,0.6)' : 'none' }}
          >
            {win.title}
          </span>
        </div>

        <div className="flex items-center gap-[2px] shrink-0">
          {win.canMinimize && (
            <button
              type="button"
              aria-label={`Minimize ${win.title}`}
              onClick={(e) => {
                e.stopPropagation();
                if (!blockedByModal) onMinimize();
              }}
              className="xp-caption-btn w-[21px] h-[21px] flex items-center justify-center focus-visible:outline focus-visible:outline-1 focus-visible:outline-white"
            >
              <svg viewBox="0 0 12 12" className="w-3 h-3" aria-hidden="true">
                <rect x="2" y="8" width="7" height="2" fill="#ffffff" />
              </svg>
            </button>
          )}
          {win.canMaximize && (
            <button
              type="button"
              aria-label={win.maximized ? `Restore ${win.title}` : `Maximize ${win.title}`}
              onClick={(e) => {
                e.stopPropagation();
                if (!blockedByModal) onMaximizeToggle();
              }}
              className="xp-caption-btn w-[21px] h-[21px] flex items-center justify-center focus-visible:outline focus-visible:outline-1 focus-visible:outline-white"
            >
              {win.maximized ? (
                <svg viewBox="0 0 12 12" className="w-3 h-3" aria-hidden="true">
                  <rect x="4" y="2" width="6" height="6" fill="none" stroke="#ffffff" strokeWidth="1.3" />
                  <rect x="2" y="4" width="6" height="6" fill="#2364d8" stroke="#ffffff" strokeWidth="1.3" />
                  <line x1="2" y1="5" x2="8" y2="5" stroke="#ffffff" strokeWidth="1.5" />
                </svg>
              ) : (
                <svg viewBox="0 0 12 12" className="w-3 h-3" aria-hidden="true">
                  <rect x="2" y="2" width="8" height="8" fill="none" stroke="#ffffff" strokeWidth="1.4" />
                  <line x1="2" y1="3" x2="10" y2="3" stroke="#ffffff" strokeWidth="1.8" />
                </svg>
              )}
            </button>
          )}
          <button
            type="button"
            aria-label={`Close ${win.title}`}
            onClick={(e) => {
              e.stopPropagation();
              if (!blockedByModal) onClose();
            }}
            className="xp-caption-close w-[21px] h-[21px] flex items-center justify-center focus-visible:outline focus-visible:outline-1 focus-visible:outline-white"
          >
            <svg viewBox="0 0 12 12" className="w-3 h-3" aria-hidden="true">
              <path d="M3 3 L9 9 M9 3 L3 9" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Client Area */}
      <div className="relative flex-1 min-h-0 flex flex-col overflow-hidden bg-[#ece9d8]">
        {children}
        {blockedByModal && (
          <div
            className="absolute inset-0 bg-transparent z-50"
            aria-hidden="true"
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
          />
        )}
      </div>

      {/* Resize Handles */}
      {win.resizable && !win.maximized && !blockedByModal && (
        <>
          <div onPointerDown={handleResizePointerDown('n')} className="absolute -top-1 left-2 right-2 h-1.5 cursor-ns-resize" />
          <div onPointerDown={handleResizePointerDown('s')} className="absolute -bottom-1 left-2 right-2 h-1.5 cursor-ns-resize" />
          <div onPointerDown={handleResizePointerDown('w')} className="absolute top-2 bottom-2 -left-1 w-1.5 cursor-ew-resize" />
          <div onPointerDown={handleResizePointerDown('e')} className="absolute top-2 bottom-2 -right-1 w-1.5 cursor-ew-resize" />
          <div onPointerDown={handleResizePointerDown('nw')} className="absolute -top-1 -left-1 w-2.5 h-2.5 cursor-nwse-resize" />
          <div onPointerDown={handleResizePointerDown('ne')} className="absolute -top-1 -right-1 w-2.5 h-2.5 cursor-nesw-resize" />
          <div onPointerDown={handleResizePointerDown('sw')} className="absolute -bottom-1 -left-1 w-2.5 h-2.5 cursor-nesw-resize" />
          <div onPointerDown={handleResizePointerDown('se')} className="absolute -bottom-1 -right-1 w-2.5 h-2.5 cursor-nwse-resize" />
        </>
      )}
    </div>
  );
};
