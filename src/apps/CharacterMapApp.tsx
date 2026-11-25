import React, { useMemo, useState } from 'react';
import type { SystemState } from '../types/os';

interface CharacterMapAppProps {
  system: SystemState;
}

const CHAR_RANGES: Array<{ id: string; label: string; codes: number[] }> = [
  {
    id: 'latin',
    label: 'Latin & Common Symbols',
    codes: [
      ...Array.from({ length: 94 }, (_, i) => 0x0021 + i),
      ...Array.from({ length: 96 }, (_, i) => 0x00a0 + i),
    ],
  },
  {
    id: 'math',
    label: 'Mathematical Operators & Arrows',
    codes: [
      0x2190, 0x2191, 0x2192, 0x2193, 0x2194, 0x2200, 0x2202, 0x2203, 0x2205, 0x2208,
      0x220f, 0x2211, 0x221a, 0x221e, 0x2227, 0x2228, 0x2229, 0x222a, 0x222b, 0x2248,
      0x2260, 0x2261, 0x2264, 0x2265, 0x00d7, 0x00f7, 0x00b1, 0x03b1, 0x03b2, 0x03b3,
      0x03b4, 0x03c0, 0x03a3, 0x03a9,
    ],
  },
  {
    id: 'box',
    label: 'Box Drawing & Geometric',
    codes: [
      0x2500, 0x2502, 0x250c, 0x2510, 0x2514, 0x2518, 0x251c, 0x2524, 0x252c, 0x2534,
      0x253c, 0x2588, 0x2591, 0x2592, 0x2593, 0x25a0, 0x25a1, 0x25b2, 0x25bc, 0x25c6,
      0x2605, 0x2606, 0x2660, 0x2663, 0x2665, 0x2666, 0x266a, 0x266b,
    ],
  },
];

export const CharacterMapApp: React.FC<CharacterMapAppProps> = ({ system }) => {
  const [fontFamily, setFontFamily] = useState('Tahoma');
  const [rangeId, setRangeId] = useState('latin');
  const [selectedChar, setSelectedChar] = useState('©');
  const [selectedCode, setSelectedCode] = useState<number>(0x00a9);
  const [copyBuffer, setCopyBuffer] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const customCodepoints = useMemo(() => Object.keys(system.customChars), [system.customChars]);

  const gridCodes = useMemo(() => {
    const found = CHAR_RANGES.find((r) => r.id === rangeId) ?? CHAR_RANGES[0];
    return found.codes;
  }, [rangeId]);

  const handleCopy = async () => {
    const text = copyBuffer || selectedChar;
    try {
      await navigator.clipboard.writeText(text);
      setStatusMsg(`Copied "${text}" to clipboard.`);
    } catch {
      setStatusMsg(`Selected "${text}" (use Ctrl+C if clipboard is blocked).`);
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] p-2.5 gap-2 text-[11px]">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-1.5">
          <span>Font:</span>
          <select
            aria-label="Font"
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className="xp-input h-[22px] bg-white w-[170px]"
          >
            <option value="Tahoma">Tahoma</option>
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Courier New">Courier New</option>
            <option value="Lucida Sans Unicode">Lucida Sans Unicode</option>
          </select>
        </label>

        <label className="flex items-center gap-1.5">
          <span>Group:</span>
          <select
            aria-label="Character group"
            value={rangeId}
            onChange={(e) => setRangeId(e.target.value)}
            className="xp-input h-[22px] bg-white w-[175px]"
          >
            {CHAR_RANGES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex-1 min-h-0 flex gap-2.5">
        {/* Character Grid */}
        <div className="flex-1 min-h-0 bg-white border border-[#7f9db9] p-1.5 overflow-y-auto xp-scroll">
          <div className="grid grid-cols-12 gap-0.5">
            {gridCodes.map((code) => {
              const ch = String.fromCodePoint(code);
              const isSel = selectedCode === code;
              return (
                <button
                  key={code}
                  type="button"
                  title={`U+${code.toString(16).toUpperCase().padStart(4, '0')}`}
                  onClick={() => {
                    setSelectedCode(code);
                    setSelectedChar(ch);
                  }}
                  onDoubleClick={() => setCopyBuffer((b) => b + ch)}
                  style={{ fontFamily }}
                  className={`h-[26px] border text-[14px] flex items-center justify-center cursor-default ${
                    isSel
                      ? 'bg-[#316ac5] text-white border-[#0c2d7a]'
                      : 'border-[#ece9d8] hover:bg-[#eef4fd]'
                  }`}
                >
                  {ch}
                </button>
              );
            })}
            {customCodepoints.map((hex) => {
              const cp = Number.parseInt(hex, 16);
              const ch = String.fromCodePoint(cp);
              const isSel = selectedCode === cp;
              return (
                <button
                  key={hex}
                  type="button"
                  title={`Private Use U+${hex} (Custom Character)`}
                  onClick={() => {
                    setSelectedCode(cp);
                    setSelectedChar(ch);
                  }}
                  onDoubleClick={() => setCopyBuffer((b) => b + ch)}
                  className={`h-[26px] border text-[11px] font-bold flex items-center justify-center cursor-default ${
                    isSel ? 'bg-[#316ac5] text-white border-[#0c2d7a]' : 'bg-[#fff9db] border-[#d4c890]'
                  }`}
                >
                  ★
                </button>
              );
            })}
          </div>
        </div>

        {/* Zoom Preview */}
        <div className="w-[88px] shrink-0 flex flex-col items-center gap-2">
          <div
            className="w-[74px] h-[74px] bg-white border border-[#7f9db9] flex items-center justify-center text-[40px]"
            style={{ fontFamily }}
          >
            {selectedChar}
          </div>
          <div className="text-[10px] text-[#444]">
            U+{selectedCode.toString(16).toUpperCase().padStart(4, '0')}
          </div>
        </div>
      </div>

      {/* Characters to copy */}
      <div className="flex items-center gap-2">
        <label htmlFor="charmap-copy-input" className="shrink-0">
          Characters to copy:
        </label>
        <input
          id="charmap-copy-input"
          type="text"
          value={copyBuffer}
          onChange={(e) => setCopyBuffer(e.target.value)}
          className="xp-input flex-1 h-[22px] bg-white"
        />
        <button
          type="button"
          onClick={() => setCopyBuffer((b) => b + selectedChar)}
          className="xp-button px-2.5"
        >
          Select
        </button>
        <button type="button" onClick={handleCopy} className="xp-button xp-button-default px-2.5">
          Copy
        </button>
      </div>

      {statusMsg && <div className="text-[10px] text-[#215dc6]">{statusMsg}</div>}
    </div>
  );
};
