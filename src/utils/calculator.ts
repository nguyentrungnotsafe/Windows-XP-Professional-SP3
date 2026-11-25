export type CalcOperator = '+' | '-' | '*' | '/' | '^' | 'mod';
export type AngleUnit = 'deg' | 'rad';

interface CalcFrame {
  accumulator: number | null;
  pendingOperator: CalcOperator | null;
}

export interface CalculatorState {
  display: string;
  accumulator: number | null;
  pendingOperator: CalcOperator | null;
  enteringNewValue: boolean;
  lastOperand: number | null;
  lastOperator: CalcOperator | null;
  memory: number;
  hasMemory: boolean;
  angleUnit: AngleUnit;
  inv: boolean;
  hyp: boolean;
  parenStack: CalcFrame[];
  error: string | null;
}

export function createInitialCalcState(): CalculatorState {
  return {
    display: '0',
    accumulator: null,
    pendingOperator: null,
    enteringNewValue: true,
    lastOperand: null,
    lastOperator: null,
    memory: 0,
    hasMemory: false,
    angleUnit: 'deg',
    inv: false,
    hyp: false,
    parenStack: [],
    error: null,
  };
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return 'Error';
  const rounded = Number.parseFloat(value.toPrecision(12));
  if (Object.is(rounded, -0)) return '0';
  return String(rounded);
}

function compute(a: number, op: CalcOperator, b: number): { value?: number; error?: string } {
  switch (op) {
    case '+':
      return { value: a + b };
    case '-':
      return { value: a - b };
    case '*':
      return { value: a * b };
    case '/':
      if (b === 0) {
        return { error: 'Cannot divide by zero.' };
      }
      return { value: a / b };
    case '^':
      return { value: Math.pow(a, b) };
    case 'mod':
      if (b === 0) {
        return { error: 'Cannot divide by zero.' };
      }
      return { value: a % b };
  }
}

export function pressDigit(state: CalculatorState, digit: string): CalculatorState {
  if (state.error) return state;
  if (!/^[0-9]$/.test(digit)) return state;

  if (state.enteringNewValue) {
    return {
      ...state,
      display: digit,
      enteringNewValue: false,
    };
  }
  if (state.display === '0') {
    return {
      ...state,
      display: digit,
    };
  }
  if (state.display.length >= 16) {
    return state;
  }
  return {
    ...state,
    display: state.display + digit,
  };
}

export function pressDecimal(state: CalculatorState): CalculatorState {
  if (state.error) return state;
  if (state.enteringNewValue) {
    return {
      ...state,
      display: '0.',
      enteringNewValue: false,
    };
  }
  if (state.display.includes('.')) return state;
  return {
    ...state,
    display: state.display + '.',
  };
}

export function pressBackspace(state: CalculatorState): CalculatorState {
  if (state.error) return state;
  if (state.enteringNewValue) return state;
  if (state.display.length <= 1 || (state.display.length === 2 && state.display.startsWith('-'))) {
    return {
      ...state,
      display: '0',
      enteringNewValue: true,
    };
  }
  return {
    ...state,
    display: state.display.slice(0, -1),
  };
}

export function pressToggleSign(state: CalculatorState): CalculatorState {
  if (state.error) return state;
  if (state.display === '0' || state.display === '0.') return state;
  return {
    ...state,
    display: state.display.startsWith('-') ? state.display.slice(1) : '-' + state.display,
  };
}

export function pressClearEntry(state: CalculatorState): CalculatorState {
  if (state.error) {
    return {
      ...createInitialCalcState(),
      memory: state.memory,
      hasMemory: state.hasMemory,
      angleUnit: state.angleUnit,
    };
  }
  return {
    ...state,
    display: '0',
    enteringNewValue: true,
  };
}

export function pressClearAll(state?: CalculatorState): CalculatorState {
  return {
    ...createInitialCalcState(),
    memory: state?.memory ?? 0,
    hasMemory: state?.hasMemory ?? false,
    angleUnit: state?.angleUnit ?? 'deg',
  };
}

export function pressOperator(state: CalculatorState, op: CalcOperator): CalculatorState {
  if (state.error) return state;
  const current = Number.parseFloat(state.display);

  if (state.pendingOperator && !state.enteringNewValue && state.accumulator !== null) {
    const result = compute(state.accumulator, state.pendingOperator, current);
    if (result.error !== undefined || result.value === undefined || !Number.isFinite(result.value)) {
      return {
        ...state,
        display: result.error ?? 'Invalid input for function.',
        error: result.error ?? 'Invalid input for function.',
        accumulator: null,
        pendingOperator: null,
        enteringNewValue: true,
      };
    }
    return {
      ...state,
      display: formatNumber(result.value),
      accumulator: result.value,
      pendingOperator: op,
      enteringNewValue: true,
      lastOperand: null,
      lastOperator: null,
    };
  }

  return {
    ...state,
    accumulator: current,
    pendingOperator: op,
    enteringNewValue: true,
    lastOperand: null,
    lastOperator: null,
  };
}

export function pressEquals(state: CalculatorState): CalculatorState {
  if (state.error) return state;
  let working = state;

  // Close any open parenthesis frames on '='
  while (working.parenStack.length > 0) {
    working = pressCloseParen(working);
    if (working.error) return working;
  }

  const current = Number.parseFloat(working.display);

  if (working.pendingOperator && working.accumulator !== null) {
    const result = compute(working.accumulator, working.pendingOperator, current);
    if (result.error !== undefined || result.value === undefined || !Number.isFinite(result.value)) {
      return {
        ...working,
        display: result.error ?? 'Invalid input for function.',
        error: result.error ?? 'Invalid input for function.',
        accumulator: null,
        pendingOperator: null,
        enteringNewValue: true,
      };
    }
    return {
      ...working,
      display: formatNumber(result.value),
      accumulator: result.value,
      pendingOperator: null,
      enteringNewValue: true,
      lastOperand: current,
      lastOperator: working.pendingOperator,
    };
  }

  if (working.lastOperator && working.lastOperand !== null) {
    const result = compute(current, working.lastOperator, working.lastOperand);
    if (result.error !== undefined || result.value === undefined || !Number.isFinite(result.value)) {
      return {
        ...working,
        display: result.error ?? 'Invalid input for function.',
        error: result.error ?? 'Invalid input for function.',
        accumulator: null,
        pendingOperator: null,
        enteringNewValue: true,
      };
    }
    return {
      ...working,
      display: formatNumber(result.value),
      accumulator: result.value,
      enteringNewValue: true,
    };
  }

  return {
    ...working,
    enteringNewValue: true,
  };
}

export function pressOpenParen(state: CalculatorState): CalculatorState {
  if (state.error) return state;
  if (state.parenStack.length >= 25) return state;
  return {
    ...state,
    parenStack: [
      ...state.parenStack,
      { accumulator: state.accumulator, pendingOperator: state.pendingOperator },
    ],
    accumulator: null,
    pendingOperator: null,
    display: '0',
    enteringNewValue: true,
  };
}

export function pressCloseParen(state: CalculatorState): CalculatorState {
  if (state.error || state.parenStack.length === 0) return state;
  let innerVal = Number.parseFloat(state.display);
  if (state.pendingOperator && state.accumulator !== null) {
    const res = compute(state.accumulator, state.pendingOperator, innerVal);
    if (res.error !== undefined || res.value === undefined || !Number.isFinite(res.value)) {
      return {
        ...state,
        display: res.error ?? 'Error',
        error: res.error ?? 'Error',
        parenStack: [],
        accumulator: null,
        pendingOperator: null,
        enteringNewValue: true,
      };
    }
    innerVal = res.value;
  }

  const prevFrame = state.parenStack[state.parenStack.length - 1];
  const nextStack = state.parenStack.slice(0, -1);

  return {
    ...state,
    display: formatNumber(innerVal),
    accumulator: prevFrame.accumulator,
    pendingOperator: prevFrame.pendingOperator,
    parenStack: nextStack,
    enteringNewValue: false,
  };
}

export function pressPercent(state: CalculatorState): CalculatorState {
  if (state.error) return state;
  const current = Number.parseFloat(state.display);
  const val =
    state.accumulator !== null && state.pendingOperator
      ? (state.accumulator * current) / 100
      : current / 100;
  return {
    ...state,
    display: formatNumber(val),
    enteringNewValue: true,
  };
}

export type UnarySciOp =
  | 'sqrt'
  | 'recip'
  | 'sq'
  | 'cube'
  | 'sin'
  | 'cos'
  | 'tan'
  | 'log'
  | 'ln'
  | 'fact'
  | 'exp10'
  | 'expe'
  | 'pi';

function factorial(n: number): number | null {
  if (!Number.isInteger(n) || n < 0 || n > 170) return null;
  let acc = 1;
  for (let i = 2; i <= n; i++) acc *= i;
  return acc;
}

export function pressUnary(state: CalculatorState, op: UnarySciOp): CalculatorState {
  if (state.error) return state;
  const x = Number.parseFloat(state.display);
  const toRad = (v: number) => (state.angleUnit === 'deg' ? (v * Math.PI) / 180 : v);
  const fromRad = (v: number) => (state.angleUnit === 'deg' ? (v * 180) / Math.PI : v);

  let out: number | null = null;
  let errMsg: string | null = null;

  switch (op) {
    case 'pi':
      out = Math.PI;
      break;
    case 'sqrt':
      if (x < 0) errMsg = 'Invalid input for function.';
      else out = Math.sqrt(x);
      break;
    case 'recip':
      if (x === 0) errMsg = 'Cannot divide by zero.';
      else out = 1 / x;
      break;
    case 'sq':
      out = x * x;
      break;
    case 'cube':
      out = x * x * x;
      break;
    case 'log':
      if (state.inv) out = Math.pow(10, x);
      else if (x <= 0) errMsg = 'Invalid input for function.';
      else out = Math.log10(x);
      break;
    case 'ln':
      if (state.inv) out = Math.exp(x);
      else if (x <= 0) errMsg = 'Invalid input for function.';
      else out = Math.log(x);
      break;
    case 'exp10':
      out = Math.pow(10, x);
      break;
    case 'expe':
      out = Math.exp(x);
      break;
    case 'fact': {
      const f = factorial(x);
      if (f === null) errMsg = 'Invalid input for function.';
      else out = f;
      break;
    }
    case 'sin':
      if (state.hyp) {
        out = state.inv ? Math.asinh(x) : Math.sinh(x);
      } else if (state.inv) {
        if (x < -1 || x > 1) errMsg = 'Invalid input for function.';
        else out = fromRad(Math.asin(x));
      } else {
        out = Math.sin(toRad(x));
      }
      break;
    case 'cos':
      if (state.hyp) {
        if (state.inv && x < 1) errMsg = 'Invalid input for function.';
        else out = state.inv ? Math.acosh(x) : Math.cosh(x);
      } else if (state.inv) {
        if (x < -1 || x > 1) errMsg = 'Invalid input for function.';
        else out = fromRad(Math.acos(x));
      } else {
        out = Math.cos(toRad(x));
      }
      break;
    case 'tan':
      if (state.hyp) {
        if (state.inv && (x <= -1 || x >= 1)) errMsg = 'Invalid input for function.';
        else out = state.inv ? Math.atanh(x) : Math.tanh(x);
      } else if (state.inv) {
        out = fromRad(Math.atan(x));
      } else {
        const c = Math.cos(toRad(x));
        if (Math.abs(c) < 1e-12) errMsg = 'Invalid input for function.';
        else out = Math.tan(toRad(x));
      }
      break;
  }

  if (errMsg || out === null || !Number.isFinite(out)) {
    return {
      ...state,
      display: errMsg ?? 'Invalid input for function.',
      error: errMsg ?? 'Invalid input for function.',
      enteringNewValue: true,
    };
  }

  return {
    ...state,
    display: formatNumber(out),
    enteringNewValue: true,
    inv: false,
    hyp: false,
  };
}

export function pressMemoryClear(state: CalculatorState): CalculatorState {
  return { ...state, memory: 0, hasMemory: false };
}

export function pressMemoryRecall(state: CalculatorState): CalculatorState {
  if (!state.hasMemory) return state;
  return { ...state, display: formatNumber(state.memory), enteringNewValue: true, error: null };
}

export function pressMemoryStore(state: CalculatorState): CalculatorState {
  if (state.error) return state;
  const val = Number.parseFloat(state.display);
  return { ...state, memory: val, hasMemory: true, enteringNewValue: true };
}

export function pressMemoryAdd(state: CalculatorState): CalculatorState {
  if (state.error) return state;
  const val = Number.parseFloat(state.display);
  return { ...state, memory: state.memory + val, hasMemory: true, enteringNewValue: true };
}
