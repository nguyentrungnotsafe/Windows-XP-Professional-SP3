import React, { useEffect, useRef, useState } from 'react';

export interface XpMenuEntry {
  id: string;
  label: string;
  shortcut?: string;
  disabled?: boolean;
  checked?: boolean;
  separatorBefore?: boolean;
  onSelect?: () => void;
}

export interface XpMenuGroup {
  id: string;
  label: string;
  items: XpMenuEntry[];
}

interface XpMenuBarProps {
  groups: XpMenuGroup[];
}

export const XpMenuBar: React.FC<XpMenuBarProps> = ({ groups }) => {
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openGroupId) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpenGroupId(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpenGroupId(null);
      }
    };
    window.addEventListener('pointerdown', handlePointerDown, true);
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown, true);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [openGroupId]);

  return (
    <div
      ref={barRef}
      role="menubar"
      className="h-[22px] shrink-0 bg-[#ece9d8] border-b border-[#d4d0c8] flex items-center px-1 gap-0.5 text-[11px] relative z-30"
    >
      {groups.map((group) => {
        const isOpen = openGroupId === group.id;
        return (
          <div key={group.id} className="relative">
            <button
              type="button"
              role="menuitem"
              aria-haspopup="menu"
              aria-expanded={isOpen}
              onClick={() => setOpenGroupId(isOpen ? null : group.id)}
              onMouseEnter={() => {
                if (openGroupId) setOpenGroupId(group.id);
              }}
              className={`px-2 py-[2px] text-[11px] cursor-default whitespace-nowrap focus:outline-none ${
                isOpen
                  ? 'bg-[#316ac5] text-[#ffffff]'
                  : 'text-[#000000] hover:bg-[#316ac5] hover:text-[#ffffff] focus-visible:bg-[#316ac5] focus-visible:text-[#ffffff]'
              }`}
            >
              {group.label}
            </button>

            {isOpen && (
              <div
                role="menu"
                className="absolute left-0 top-full min-w-[178px] bg-[#ffffff] border border-[#aca899] shadow-[2px_2px_4px_rgba(0,0,0,0.28)] py-[2px] px-[2px] z-50"
              >
                {group.items.map((item) => (
                  <React.Fragment key={item.id}>
                    {item.separatorBefore && (
                      <div className="my-[2px] mx-[3px] border-t border-[#aca899]" />
                    )}
                    <button
                      type="button"
                      role="menuitem"
                      disabled={item.disabled}
                      onClick={() => {
                        if (item.disabled) return;
                        setOpenGroupId(null);
                        item.onSelect?.();
                      }}
                      className={`w-full text-left pl-5 pr-3 py-[3px] flex items-center justify-between gap-4 relative whitespace-nowrap cursor-default focus:outline-none ${
                        item.disabled
                          ? 'text-[#8d8b7e]'
                          : 'text-[#000000] hover:bg-[#316ac5] hover:text-[#ffffff] focus-visible:bg-[#316ac5] focus-visible:text-[#ffffff]'
                      }`}
                    >
                      {item.checked && (
                        <span className="absolute left-1.5 text-[10px]" aria-hidden="true">
                          ✓
                        </span>
                      )}
                      <span>{item.label}</span>
                      {item.shortcut && (
                        <span className="text-[10px] opacity-80">{item.shortcut}</span>
                      )}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
