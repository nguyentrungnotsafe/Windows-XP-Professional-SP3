import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialCalcState,
  pressBackspace,
  pressClearAll,
  pressClearEntry,
  pressDecimal,
  pressDigit,
  pressEquals,
  pressOperator,
  pressToggleSign,
} from './calculator';

function enterDigits(state: ReturnType<typeof createInitialCalcState>, str: string) {
  let next = state;
  for (const ch of str) {
    if (ch === '.') next = pressDecimal(next);
    else next = pressDigit(next, ch);
  }
  return next;
}

test('12 + 7 = 19', () => {
  let s = createInitialCalcState();
  s = enterDigits(s, '12');
  s = pressOperator(s, '+');
  s = enterDigits(s, '7');
  s = pressEquals(s);
  assert.equal(s.display, '19');
});

test('12 + 8, CE, 3, = gives 15', () => {
  let s = createInitialCalcState();
  s = enterDigits(s, '12');
  s = pressOperator(s, '+');
  s = enterDigits(s, '8');
  s = pressClearEntry(s);
  assert.equal(s.display, '0');
  s = enterDigits(s, '3');
  s = pressEquals(s);
  assert.equal(s.display, '15');
});

test('division by zero produces error and C recovers cleanly', () => {
  let s = createInitialCalcState();
  s = enterDigits(s, '9');
  s = pressOperator(s, '/');
  s = enterDigits(s, '0');
  s = pressEquals(s);
  assert.ok(s.error);
  assert.equal(s.display, 'Cannot divide by zero.');

  s = pressClearAll();
  assert.equal(s.error, null);
  assert.equal(s.display, '0');
});

test('backspace, decimal, and sign toggle work accurately', () => {
  let s = createInitialCalcState();
  s = enterDigits(s, '4.5');
  s = pressToggleSign(s);
  assert.equal(s.display, '-4.5');
  s = pressBackspace(s);
  assert.equal(s.display, '-4.');
});
