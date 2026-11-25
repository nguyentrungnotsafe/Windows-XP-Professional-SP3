import React, { useEffect, useState } from 'react';
import type { AccessibilityState, AppId, SystemState } from '../types/os';

// --- Docked Magnifier Overlay ---
export const MagnifierOverlay: React.FC<{
  accessibility: AccessibilityState;
  onClose: () => void;
}> = ({ accessibility, onClose }) => {
  const [coords, setCoords] = useState({ x: 512, y: 384 });
  const [targetLabel, setTargetLabel] = useState('Windows XP Desktop');

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      setCoords({ x: Math.round(e.clientX), y: Math.round(e.clientY) });
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      const text =
        el?.getAttribute('aria-label') ||
        el?.textContent?.trim().slice(0, 48) ||
        el?.tagName ||
        'Desktop';
      setTargetLabel(text);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  const zoom = accessibility.magnifierZoom;
  return (
    <div
      role="region"
      aria-label="Microsoft Magnifier Viewport"
      className={`fixed top-0 left-0 right-0 h-[74px] z-[9700] border-b-2 border-[#003c74] px-4 flex items-center justify-between shadow-lg ${
        accessibility.magnifierInvert
          ? 'bg-[#000000] text-[#ffff00]'
          : 'bg-[#e8f1ff] text-[#001d4a]'
      }`}
    >
      <div className="flex items-center gap-4 overflow-hidden">
        <div
          className="font-bold tracking-wide truncate"
          style={{ fontSize: `${Math.min(28, 12 + zoom * 3)}px` }}
        >
          {targetLabel}
        </div>
      </div>
      <div className="flex items-center gap-3 text-[11px] shrink-0">
        <span>
          Zoom: {zoom}x | Cursor: ({coords.x}, {coords.y})
        </span>
        <button type="button" onClick={onClose} className="xp-button text-black">
          Exit Magnifier
        </button>
      </div>
    </div>
  );
};

// --- Magnifier Control Window ---
interface MagnifierControlAppProps {
  system: SystemState;
  magnifierOpen: boolean;
  onSetMagnifierOpen: (open: boolean) => void;
  onUpdateSystem: (updater: (prev: SystemState) => SystemState) => void;
}

export const MagnifierControlApp: React.FC<MagnifierControlAppProps> = ({
  system,
  magnifierOpen,
  onSetMagnifierOpen,
  onUpdateSystem,
}) => {
  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] p-3 text-[11px] gap-3">
      <div className="flex items-center justify-between">
        <label htmlFor="mag-zoom" className="font-bold">Magnification level:</label>
        <select
          id="mag-zoom"
          value={system.accessibility.magnifierZoom}
          onChange={(e) =>
            onUpdateSystem((prev) => ({
              ...prev,
              accessibility: { ...prev.accessibility, magnifierZoom: Number(e.target.value) },
            }))
          }
          className="xp-input"
        >
          {[1, 2, 3, 4, 5, 6].map((z) => (
            <option key={z} value={z}>{z}x</option>
          ))}
        </select>
      </div>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={system.accessibility.magnifierInvert}
          onChange={(e) =>
            onUpdateSystem((prev) => ({
              ...prev,
              accessibility: { ...prev.accessibility, magnifierInvert: e.target.checked },
            }))
          }
        />
        <span>Invert colors</span>
      </label>
      <div className="flex items-center justify-between pt-2 border-t border-[#aca899]">
        <span>Status: {magnifierOpen ? 'Docked Lens Active' : 'Stopped'}</span>
        <button
          type="button"
          onClick={() => onSetMagnifierOpen(!magnifierOpen)}
          className="xp-button xp-button-default"
        >
          {magnifierOpen ? 'Hide Lens' : 'Show Lens'}
        </button>
      </div>
    </div>
  );
};

// --- On-Screen Keyboard (Focus-preserving) ---
interface OnScreenKeyboardAppProps {
  onInjectKey: (key: string) => void;
}

const OSK_ROWS = [
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Bksp'],
  ['Tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
  ['Caps', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", 'Enter'],
  ['Shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'Space'],
];

export const OnScreenKeyboardApp: React.FC<OnScreenKeyboardAppProps> = ({ onInjectKey }) => {
  const [shift, setShift] = useState(false);
  const [caps, setCaps] = useState(false);

  const handleKeyPress = (raw: string) => {
    if (raw === 'Shift') {
      setShift((s) => !s);
      return;
    }
    if (raw === 'Caps') {
      setCaps((c) => !c);
      return;
    }
    if (raw === 'Bksp') {
      onInjectKey('Backspace');
      return;
    }
    if (raw === 'Enter') {
      onInjectKey('Enter');
      return;
    }
    if (raw === 'Space') {
      onInjectKey(' ');
      return;
    }
    if (raw === 'Tab') {
      onInjectKey('  ');
      return;
    }
    const upper = shift !== caps;
    const ch = upper && /^[a-z]$/.test(raw) ? raw.toUpperCase() : raw;
    onInjectKey(ch);
    if (shift) setShift(false);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#d4d0c8] p-2 gap-1 text-[11px] select-none">
      {OSK_ROWS.map((row, rIdx) => (
        <div key={rIdx} className="flex gap-1 flex-1">
          {row.map((key) => {
            const active =
              (key === 'Shift' && shift) || (key === 'Caps' && caps);
            const display =
              key.length === 1 && shift !== caps && /^[a-z]$/.test(key)
                ? key.toUpperCase()
                : key;
            return (
              <button
                key={key}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleKeyPress(key)}
                className={`xp-button min-w-0 px-1.5 font-bold ${
                  key === 'Space' ? 'flex-[3]' : key.length > 1 ? 'flex-[1.5]' : 'flex-1'
                } ${active ? 'bg-[#316ac5] text-white' : ''}`}
              >
                {display}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// --- Narrator ---
interface NarratorAppProps {
  system: SystemState;
  onUpdateSystem: (updater: (prev: SystemState) => SystemState) => void;
}

export const NarratorApp: React.FC<NarratorAppProps> = ({ system, onUpdateSystem }) => {
  const [sampleText, setSampleText] = useState(
    'Microsoft Narrator active on Windows XP Professional Service Pack 3.'
  );

  const speak = (text: string) => {
    onUpdateSystem((prev) => ({
      ...prev,
      accessibility: { ...prev.accessibility, narratorLastText: text },
    }));
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
      } catch {
        // fallback handled visually via narratorLastText
      }
    }
  };

  const stopSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] p-3 text-[11px] gap-2.5">
      <label className="flex items-center gap-2 font-bold">
        <input
          type="checkbox"
          checked={system.accessibility.narratorActive}
          onChange={(e) => {
            const on = e.target.checked;
            onUpdateSystem((prev) => ({
              ...prev,
              accessibility: { ...prev.accessibility, narratorActive: on },
            }));
            if (on) speak('Narrator enabled.');
            else stopSpeech();
          }}
        />
        <span>Announce events and read text aloud</span>
      </label>

      <label className="flex flex-col gap-1">
        <span>Text to read:</span>
        <input
          type="text"
          value={sampleText}
          onChange={(e) => setSampleText(e.target.value)}
          className="xp-input"
        />
      </label>

      <div className="bg-white border border-[#aca899] p-2 text-[10px]">
        <strong>Last Spoken:</strong> {system.accessibility.narratorLastText}
      </div>

      <div className="flex gap-2 justify-end">
        <button type="button" onClick={() => speak(sampleText)} className="xp-button xp-button-default">
          Read Aloud
        </button>
        <button type="button" onClick={stopSpeech} className="xp-button">
          Stop
        </button>
      </div>
    </div>
  );
};

// --- Accessibility Options Control Panel Applet ---
interface AccessibilityOptionsDialogProps {
  system: SystemState;
  onUpdateSystem: (updater: (prev: SystemState) => SystemState) => void;
  onClose: () => void;
}

export const AccessibilityOptionsDialog: React.FC<AccessibilityOptionsDialogProps> = ({
  system,
  onUpdateSystem,
  onClose,
}) => {
  const [draft, setDraft] = useState<AccessibilityState>(system.accessibility);
  const [tab, setTab] = useState<'keyboard' | 'sound' | 'display'>('display');

  const apply = () => {
    onUpdateSystem((prev) => ({ ...prev, accessibility: draft }));
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] p-2.5 text-[11px] justify-between">
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex gap-1 pl-1">
          {(['keyboard', 'sound', 'display'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-3 py-1 rounded-t-[3px] border border-b-0 border-[#919b9c] cursor-default ${
                tab === t ? 'bg-[#f9f8f4] font-bold relative z-10 -mb-[1px]' : 'bg-[#e3e0d3]'
              }`}
            >
              {t === 'keyboard' ? 'Keyboard' : t === 'sound' ? 'Sound' : 'Display'}
            </button>
          ))}
        </div>

        <div className="flex-1 bg-[#f9f8f4] border border-[#919b9c] p-3 flex flex-col gap-2.5">
          {tab === 'display' && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={draft.highContrast}
                onChange={(e) => setDraft({ ...draft, highContrast: e.target.checked })}
              />
              <span>Use High Contrast (Windows XP High Contrast theme)</span>
            </label>
          )}
          {tab === 'keyboard' && (
            <>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={draft.stickyKeys}
                  onChange={(e) => setDraft({ ...draft, stickyKeys: e.target.checked })}
                />
                <span>Use StickyKeys</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={draft.filterKeys}
                  onChange={(e) => setDraft({ ...draft, filterKeys: e.target.checked })}
                />
                <span>Use FilterKeys</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={draft.toggleKeys}
                  onChange={(e) => setDraft({ ...draft, toggleKeys: e.target.checked })}
                />
                <span>Use ToggleKeys</span>
              </label>
            </>
          )}
          {tab === 'sound' && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={draft.soundSentry}
                onChange={(e) => setDraft({ ...draft, soundSentry: e.target.checked })}
              />
              <span>Use SoundSentry (visual flash for system alerts)</span>
            </label>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={() => { apply(); onClose(); }} className="xp-button xp-button-default min-w-[72px]">
          OK
        </button>
        <button type="button" onClick={onClose} className="xp-button min-w-[72px]">
          Cancel
        </button>
        <button type="button" onClick={apply} className="xp-button min-w-[72px]">
          Apply
        </button>
      </div>
    </div>
  );
};

// --- Accessibility Wizard ---
interface AccessibilityWizardAppProps {
  system: SystemState;
  onUpdateSystem: (updater: (prev: SystemState) => SystemState) => void;
  onClose: () => void;
}

export const AccessibilityWizardApp: React.FC<AccessibilityWizardAppProps> = ({
  system,
  onUpdateSystem,
  onClose,
}) => {
  const [highContrast, setHighContrast] = useState(system.accessibility.highContrast);
  const [stickyKeys, setStickyKeys] = useState(system.accessibility.stickyKeys);

  const finish = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSystem((prev) => ({
      ...prev,
      accessibility: { ...prev.accessibility, highContrast, stickyKeys },
    }));
    onClose();
  };

  return (
    <form onSubmit={finish} className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] p-4 text-[11px] justify-between">
      <div className="flex flex-col gap-3">
        <div className="text-[13px] font-bold text-[#0b3c8d]">Accessibility Wizard</div>
        <p>Select the accessibility options you want configured for this Windows XP session:</p>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={highContrast} onChange={(e) => setHighContrast(e.target.checked)} />
          <span>Enable High Contrast display scheme</span>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={stickyKeys} onChange={(e) => setStickyKeys(e.target.checked)} />
          <span>Enable StickyKeys for single-finger modifier typing</span>
        </label>
      </div>
      <div className="flex justify-end gap-2 border-t border-[#aca899] pt-2">
        <button type="submit" className="xp-button xp-button-default">Finish</button>
        <button type="button" onClick={onClose} className="xp-button">Cancel</button>
      </div>
    </form>
  );
};

// --- Utility Manager ---
interface UtilityManagerAppProps {
  magnifierOpen: boolean;
  onSetMagnifierOpen: (open: boolean) => void;
  system: SystemState;
  onLaunchApp: (appId: AppId) => void;
  onUpdateSystem: (updater: (prev: SystemState) => SystemState) => void;
}

export const UtilityManagerApp: React.FC<UtilityManagerAppProps> = ({
  magnifierOpen,
  onSetMagnifierOpen,
  system,
  onLaunchApp,
  onUpdateSystem,
}) => {
  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] p-3 text-[11px] gap-2.5">
      <div className="font-bold text-[#0b3c8d]">Utility Manager</div>
      <div className="bg-white border border-[#aca899] p-2 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span>Magnifier — {magnifierOpen ? 'Running' : 'Not running'}</span>
          <div className="flex gap-1">
            <button type="button" onClick={() => onSetMagnifierOpen(true)} className="xp-button">Start</button>
            <button type="button" onClick={() => onSetMagnifierOpen(false)} className="xp-button">Stop</button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span>Narrator — {system.accessibility.narratorActive ? 'Running' : 'Not running'}</span>
          <div className="flex gap-1">
            <button type="button" onClick={() => onLaunchApp('narrator')} className="xp-button">Start</button>
            <button
              type="button"
              onClick={() =>
                onUpdateSystem((prev) => ({
                  ...prev,
                  accessibility: { ...prev.accessibility, narratorActive: false },
                }))
              }
              className="xp-button"
            >
              Stop
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span>On-Screen Keyboard</span>
          <button type="button" onClick={() => onLaunchApp('osk')} className="xp-button">Start</button>
        </div>
      </div>
    </div>
  );
};
