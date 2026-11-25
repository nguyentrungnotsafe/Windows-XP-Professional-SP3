import React, { useEffect, useRef, useState } from 'react';
import type { AppearancePrefs, WallpaperId } from '../types/os';
import {
  BACKGROUND_COLOR_SWATCHES,
  WALLPAPER_OPTIONS,
  getWallpaperSrc,
} from '../components/xp/WallpaperLayer';

interface DisplayPropertiesDialogProps {
  committedAppearance: AppearancePrefs;
  onApply: (prefs: AppearancePrefs) => void;
  onClose: () => void;
}

export const DisplayPropertiesDialog: React.FC<DisplayPropertiesDialogProps> = ({
  committedAppearance,
  onApply,
  onClose,
}) => {
  const [draft, setDraft] = useState<AppearancePrefs>(committedAppearance);
  const [dirty, setDirty] = useState(false);
  const listboxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraft(committedAppearance);
    setDirty(false);
  }, [committedAppearance]);

  useEffect(() => {
    const selectedBtn = listboxRef.current?.querySelector<HTMLButtonElement>(
      `[data-wallpaper-id="${draft.wallpaper}"]`
    );
    selectedBtn?.scrollIntoView({ block: 'nearest' });
  }, [draft.wallpaper]);

  const previewSrc = getWallpaperSrc(draft.wallpaper);

  const handleSelectWallpaper = (wallpaper: WallpaperId) => {
    setDraft((prev) => ({ ...prev, wallpaper }));
    setDirty(true);
  };

  const handleListboxKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Home' && e.key !== 'End') {
      return;
    }
    e.preventDefault();
    const currentIndex = WALLPAPER_OPTIONS.findIndex((opt) => opt.id === draft.wallpaper);
    let nextIndex = currentIndex;
    if (e.key === 'ArrowDown') {
      nextIndex = Math.min(WALLPAPER_OPTIONS.length - 1, currentIndex + 1);
    } else if (e.key === 'ArrowUp') {
      nextIndex = Math.max(0, currentIndex - 1);
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = WALLPAPER_OPTIONS.length - 1;
    }
    const nextOption = WALLPAPER_OPTIONS[nextIndex];
    if (nextOption && nextOption.id !== draft.wallpaper) {
      handleSelectWallpaper(nextOption.id);
    }
  };

  const handleSelectColor = (backgroundColor: string) => {
    setDraft((prev) => ({ ...prev, backgroundColor }));
    setDirty(true);
  };

  const handleApply = () => {
    onApply(draft);
    setDirty(false);
  };

  const handleOk = () => {
    onApply(draft);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] p-2.5 text-[11px] justify-between">
      {/* Tab Strip */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex items-end pl-1 gap-0.5">
          <div className="px-3 py-1 bg-[#f9f8f4] border border-b-0 border-[#919b9c] rounded-t-[3px] font-normal text-[#000000] relative z-10 -mb-[1px]">
            Desktop
          </div>
        </div>

        {/* Tab Body */}
        <div className="flex-1 min-h-0 bg-[#f9f8f4] border border-[#919b9c] p-3 flex flex-col gap-3 overflow-y-auto">
          {/* Monitor Preview */}
          <div className="flex flex-col items-center justify-center py-1">
            <div className="w-[152px] h-[112px] bg-[#d8d4c5] border-2 border-[#7c796c] rounded-[6px] p-2.5 flex flex-col items-center shadow-inner">
              <div
                className="w-full h-full border border-[#222222] overflow-hidden relative"
                style={{ backgroundColor: draft.backgroundColor }}
                data-testid="display-preview-screen"
              >
                {previewSrc && (
                  <img
                    src={previewSrc}
                    alt={`${draft.wallpaper} preview`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                )}
                {/* Mini taskbar inside preview */}
                <div className="absolute bottom-0 left-0 right-0 h-[7px] bg-[#245edc]" />
              </div>
            </div>
            <div className="w-[46px] h-[10px] bg-[#bdb9a8] border-x border-[#7c796c]" />
            <div className="w-[82px] h-[6px] bg-[#bdb9a8] border border-[#7c796c] rounded-b-[2px]" />
          </div>

          {/* Background Selection + Color */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_118px] gap-3 items-start">
            <div className="flex flex-col gap-1">
              <span className="font-normal">Background:</span>
              <div
                ref={listboxRef}
                role="listbox"
                tabIndex={0}
                aria-label="Wallpaper list"
                onKeyDown={handleListboxKeyDown}
                className="h-[116px] bg-[#ffffff] border border-[#7f9db9] overflow-y-auto xp-scroll p-0.5 focus:outline-none"
              >
                {WALLPAPER_OPTIONS.map((opt) => {
                  const selected = draft.wallpaper === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="option"
                      tabIndex={-1}
                      data-wallpaper-id={opt.id}
                      aria-selected={selected}
                      onClick={() => handleSelectWallpaper(opt.id)}
                      className={`w-full text-left px-1.5 py-[2px] leading-[15px] truncate cursor-default ${
                        selected
                          ? 'bg-[#316ac5] text-[#ffffff]'
                          : 'text-[#000000] hover:bg-[#eef4fd]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span>Color:</span>
              <div className="grid grid-cols-4 gap-1 bg-[#ffffff] border border-[#7f9db9] p-1.5">
                {BACKGROUND_COLOR_SWATCHES.map((swatch) => (
                  <button
                    key={swatch}
                    type="button"
                    aria-label={`Background color ${swatch}`}
                    aria-pressed={draft.backgroundColor === swatch}
                    onClick={() => handleSelectColor(swatch)}
                    className={`w-[20px] h-[18px] border cursor-default ${
                      draft.backgroundColor === swatch
                        ? 'border-[#000000] ring-1 ring-[#316ac5]'
                        : 'border-[#7f9db9]'
                    }`}
                    style={{ backgroundColor: swatch }}
                  />
                ))}
              </div>
              <label className="flex items-center gap-1.5 text-[10px] text-[#333333]">
                <span>Custom:</span>
                <input
                  type="color"
                  aria-label="Custom background color"
                  value={draft.backgroundColor}
                  onChange={(e) => handleSelectColor(e.target.value)}
                  className="w-6 h-5 p-0 border border-[#7f9db9] cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* OK / Cancel / Apply */}
      <div className="flex items-center justify-end gap-2 pt-2.5 shrink-0">
        <button type="button" onClick={handleOk} className="xp-button xp-button-default min-w-[74px]">
          OK
        </button>
        <button type="button" onClick={handleCancel} className="xp-button min-w-[74px]">
          Cancel
        </button>
        <button
          type="button"
          disabled={!dirty}
          onClick={handleApply}
          className="xp-button min-w-[74px]"
        >
          Apply
        </button>
      </div>
    </div>
  );
};
