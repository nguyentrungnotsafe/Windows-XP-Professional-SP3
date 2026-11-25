import React, { useEffect, useState } from 'react';
import type { ModalPromptRequest } from '../types/os';
import {
  createInitialCalcState,
  pressBackspace,
  pressClearAll,
  pressClearEntry,
  pressCloseParen,
  pressDecimal,
  pressDigit,
  pressEquals,
  pressMemoryAdd,
  pressMemoryClear,
  pressMemoryRecall,
  pressMemoryStore,
  pressOpenParen,
  pressOperator,
  pressPercent,
  pressToggleSign,
  pressUnary,
  type CalculatorState,
} from '../utils/calculator';
import { XpMenuBar, type XpMenuGroup } from '../components/xp/XpMenuBar';

interface CalculatorAppProps {
  windowId: string;
  isActive: boolean;
  onOpenModal: (modal: Omit<ModalPromptRequest, 'id'>) => void;
}

export const CalculatorApp: React.FC<CalculatorAppProps> = ({
  windowId,
  isActive,
  onOpenModal,
}) => {
  const [state, setState] = useState<CalculatorState>(() => createInitialCalcState());
  const [scientific, setScientific] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        setState((s) => pressDigit(s, e.key));
      } else if (e.key === '.') {
        e.preventDefault();
        setState((s) => pressDecimal(s));
      } else if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') {
        e.preventDefault();
        const op = e.key;
        setState((s) => pressOperator(s, op));
      } else if (e.key === '^') {
        e.preventDefault();
        setState((s) => pressOperator(s, '^'));
      } else if (e.key === '(') {
        e.preventDefault();
        setState((s) => pressOpenParen(s));
      } else if (e.key === ')') {
        e.preventDefault();
        setState((s) => pressCloseParen(s));
      } else if (e.key === '%') {
        e.preventDefault();
        setState((s) => pressPercent(s));
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        setState((s) => pressEquals(s));
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        setState((s) => pressBackspace(s));
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setState(() => pressClearAll());
      } else if (e.key === 'Delete') {
        e.preventDefault();
        setState((s) => pressClearEntry(s));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const num = Number.parseFloat(text.trim());
      if (Number.isFinite(num)) {
        setState((s) => ({ ...s, display: String(num), enteringNewValue: false, error: null }));
      }
    } catch {
      // Clipboard blocked
    }
  };

  const menuGroups: XpMenuGroup[] = [
    {
      id: 'edit',
      label: 'Edit',
      items: [
        {
          id: 'copy',
          label: 'Copy',
          shortcut: 'Ctrl+C',
          onSelect: () => {
            navigator.clipboard?.writeText(state.display).catch(() => {});
          },
        },
        {
          id: 'paste',
          label: 'Paste',
          shortcut: 'Ctrl+V',
          onSelect: handlePaste,
        },
      ],
    },
    {
      id: 'view',
      label: 'View',
      items: [
        {
          id: 'standard',
          label: 'Standard',
          checked: !scientific,
          onSelect: () => setScientific(false),
        },
        {
          id: 'scientific',
          label: 'Scientific',
          checked: scientific,
          onSelect: () => setScientific(true),
        },
      ],
    },
    {
      id: 'help',
      label: 'Help',
      items: [
        {
          id: 'about',
          label: 'About Calculator',
          onSelect: () =>
            onOpenModal({
              parentWindowId: windowId,
              kind: 'alert',
              icon: 'info',
              title: 'About Calculator',
              message: 'Microsoft Windows XP Calculator\nVersion 5.1 (Service Pack 3)',
            }),
        },
      ],
    },
  ];

  const renderBtn = (
    label: string,
    onClick: () => void,
    colorClass: string,
    ariaLabel?: string
  ) => (
    <button
      type="button"
      aria-label={ariaLabel ?? label}
      onClick={onClick}
      className={`xp-calc-btn h-[26px] flex items-center justify-center text-[11px] focus-visible:outline focus-visible:outline-1 focus-visible:outline-dotted focus-visible:outline-black ${colorClass}`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#ece9d8] text-[11px]">
      <XpMenuBar groups={menuGroups} />
      <div className="p-2.5 flex flex-col gap-2 flex-1 min-h-0 overflow-auto">
        {/* Numeric Display */}
        <div
          role="status"
          aria-live="polite"
          data-testid="calc-display"
          className="h-[28px] shrink-0 bg-[#ffffff] border border-[#7f9db9] px-2 flex items-center justify-end text-[13px] font-mono tabular-nums text-[#000000] shadow-[inset_1px_1px_1px_rgba(0,0,0,0.08)] overflow-hidden"
        >
          <span className="truncate">{state.display}</span>
        </div>

        {/* Scientific Mode Controls */}
        {scientific && (
          <div className="flex flex-wrap items-center justify-between gap-2 bg-[#f4f2eb] border border-[#aca899] px-2 py-1">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1 cursor-default">
                <input
                  type="radio"
                  name={`angle-${windowId}`}
                  checked={state.angleUnit === 'deg'}
                  onChange={() => setState((s) => ({ ...s, angleUnit: 'deg' }))}
                />
                <span>Degrees</span>
              </label>
              <label className="flex items-center gap-1 cursor-default">
                <input
                  type="radio"
                  name={`angle-${windowId}`}
                  checked={state.angleUnit === 'rad'}
                  onChange={() => setState((s) => ({ ...s, angleUnit: 'rad' }))}
                />
                <span>Radians</span>
              </label>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1 cursor-default">
                <input
                  type="checkbox"
                  checked={state.inv}
                  onChange={(e) => setState((s) => ({ ...s, inv: e.target.checked }))}
                />
                <span>Inv</span>
              </label>
              <label className="flex items-center gap-1 cursor-default">
                <input
                  type="checkbox"
                  checked={state.hyp}
                  onChange={(e) => setState((s) => ({ ...s, hyp: e.target.checked }))}
                />
                <span>Hyp</span>
              </label>
            </div>
          </div>
        )}

        {/* Top Row: Memory Indicator + Backspace / CE / C */}
        <div className="grid grid-cols-6 gap-1.5 items-center">
          <div
            aria-label="Memory status"
            className="h-[26px] border border-[#aca899] bg-[#f4f2eb] flex items-center justify-center font-bold text-[#333]"
          >
            {state.hasMemory ? 'M' : ''}
          </div>
          <div className="col-span-5 grid grid-cols-3 gap-1.5">
            {renderBtn('Backspace', () => setState((s) => pressBackspace(s)), 'text-[#a31515]')}
            {renderBtn('CE', () => setState((s) => pressClearEntry(s)), 'text-[#a31515]', 'Clear Entry')}
            {renderBtn('C', () => setState(() => pressClearAll()), 'text-[#a31515]', 'Clear All')}
          </div>
        </div>

        {/* Keypad Body */}
        <div className={`grid gap-2 ${scientific ? 'grid-cols-10' : 'grid-cols-6'}`}>
          {/* Scientific Pad */}
          {scientific && (
            <div className="col-span-4 grid grid-cols-3 gap-1.5">
              {renderBtn('(', () => setState((s) => pressOpenParen(s)), 'text-[#800080]', 'Open Parenthesis')}
              {renderBtn(')', () => setState((s) => pressCloseParen(s)), 'text-[#800080]', 'Close Parenthesis')}
              {renderBtn('n!', () => setState((s) => pressUnary(s, 'fact')), 'text-[#800080]', 'Factorial')}

              {renderBtn(state.inv ? 'sin⁻¹' : 'sin', () => setState((s) => pressUnary(s, 'sin')), 'text-[#800080]')}
              {renderBtn(state.inv ? 'cos⁻¹' : 'cos', () => setState((s) => pressUnary(s, 'cos')), 'text-[#800080]')}
              {renderBtn(state.inv ? 'tan⁻¹' : 'tan', () => setState((s) => pressUnary(s, 'tan')), 'text-[#800080]')}

              {renderBtn('x^y', () => setState((s) => pressOperator(s, '^')), 'text-[#800080]', 'Power')}
              {renderBtn('x²', () => setState((s) => pressUnary(s, 'sq')), 'text-[#800080]', 'Square')}
              {renderBtn('x³', () => setState((s) => pressUnary(s, 'cube')), 'text-[#800080]', 'Cube')}

              {renderBtn('log', () => setState((s) => pressUnary(s, 'log')), 'text-[#800080]')}
              {renderBtn('ln', () => setState((s) => pressUnary(s, 'ln')), 'text-[#800080]')}
              {renderBtn('pi', () => setState((s) => pressUnary(s, 'pi')), 'text-[#003c74]', 'Pi')}
            </div>
          )}

          {/* Memory Column */}
          <div className="col-span-1 flex flex-col gap-1.5">
            {renderBtn('MC', () => setState((s) => pressMemoryClear(s)), 'text-[#c01a1a]', 'Memory Clear')}
            {renderBtn('MR', () => setState((s) => pressMemoryRecall(s)), 'text-[#c01a1a]', 'Memory Recall')}
            {renderBtn('MS', () => setState((s) => pressMemoryStore(s)), 'text-[#c01a1a]', 'Memory Store')}
            {renderBtn('M+', () => setState((s) => pressMemoryAdd(s)), 'text-[#c01a1a]', 'Memory Add')}
          </div>

          {/* Standard Digits + Ops */}
          <div className="col-span-5 grid grid-cols-5 gap-1.5">
            {renderBtn('7', () => setState((s) => pressDigit(s, '7')), 'text-[#003c74]')}
            {renderBtn('8', () => setState((s) => pressDigit(s, '8')), 'text-[#003c74]')}
            {renderBtn('9', () => setState((s) => pressDigit(s, '9')), 'text-[#003c74]')}
            {renderBtn('/', () => setState((s) => pressOperator(s, '/')), 'text-[#c01a1a]', 'Divide')}
            {renderBtn('sqrt', () => setState((s) => pressUnary(s, 'sqrt')), 'text-[#003c74]', 'Square Root')}

            {renderBtn('4', () => setState((s) => pressDigit(s, '4')), 'text-[#003c74]')}
            {renderBtn('5', () => setState((s) => pressDigit(s, '5')), 'text-[#003c74]')}
            {renderBtn('6', () => setState((s) => pressDigit(s, '6')), 'text-[#003c74]')}
            {renderBtn('*', () => setState((s) => pressOperator(s, '*')), 'text-[#c01a1a]', 'Multiply')}
            {renderBtn('%', () => setState((s) => pressPercent(s)), 'text-[#003c74]', 'Percent')}

            {renderBtn('1', () => setState((s) => pressDigit(s, '1')), 'text-[#003c74]')}
            {renderBtn('2', () => setState((s) => pressDigit(s, '2')), 'text-[#003c74]')}
            {renderBtn('3', () => setState((s) => pressDigit(s, '3')), 'text-[#003c74]')}
            {renderBtn('-', () => setState((s) => pressOperator(s, '-')), 'text-[#c01a1a]', 'Subtract')}
            {renderBtn('1/x', () => setState((s) => pressUnary(s, 'recip')), 'text-[#003c74]', 'Reciprocal')}

            {renderBtn('0', () => setState((s) => pressDigit(s, '0')), 'text-[#003c74]')}
            {renderBtn('+/-', () => setState((s) => pressToggleSign(s)), 'text-[#003c74]', 'Toggle Sign')}
            {renderBtn('.', () => setState((s) => pressDecimal(s)), 'text-[#003c74]', 'Decimal Point')}
            {renderBtn('+', () => setState((s) => pressOperator(s, '+')), 'text-[#c01a1a]', 'Add')}
            {renderBtn('=', () => setState((s) => pressEquals(s)), 'text-[#c01a1a]', 'Equals')}
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-[#555] pt-0.5">
          <span>{scientific ? 'Scientific' : 'Standard'}</span>
          <span>
            {state.parenStack.length > 0 ? `(Depth: ${state.parenStack.length})` : ''}
            {state.pendingOperator ? ` Pending: ${state.accumulator} ${state.pendingOperator}` : ''}
          </span>
        </div>
      </div>
    </div>
  );
};
