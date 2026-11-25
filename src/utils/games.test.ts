import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createMinesweeperBoard,
  createReversiBoard,
  drawSolitaireStock,
  getReversiFlips,
  heartsTrickWinner,
  initFreeCell,
  initSolitaire,
  initSpider,
  isLegalHeartsPlay,
  isSpiderMovableRun,
  revealMineCell,
  toggleMineFlag,
} from './games';
import {
  createInitialCalcState,
  pressDigit,
  pressEquals,
  pressMemoryAdd,
  pressMemoryRecall,
  pressOperator,
  pressPercent,
  pressUnary,
} from './calculator';

test('Solitaire initializes 7 tableau columns and draws stock to waste', () => {
  const sol = initSolitaire(1, 42);
  assert.equal(sol.tableau.length, 7);
  assert.equal(sol.tableau[6].length, 7);
  assert.equal(sol.stock.length, 24);
  const drawn = drawSolitaireStock(sol);
  assert.equal(drawn.waste.length, 1);
  assert.equal(drawn.stock.length, 23);
});

test('Spider Solitaire validates descending same-suit runs and FreeCell deal #1', () => {
  const sp = initSpider(1, 1);
  assert.equal(sp.tableau.length, 10);
  assert.equal(
    isSpiderMovableRun(
      [
        { id: '1', suit: 'spades', rank: 9, faceUp: true },
        { id: '2', suit: 'spades', rank: 8, faceUp: true },
      ],
      0
    ),
    true
  );
  assert.equal(
    isSpiderMovableRun(
      [
        { id: '1', suit: 'spades', rank: 9, faceUp: true },
        { id: '2', suit: 'hearts', rank: 8, faceUp: true },
      ],
      0
    ),
    false
  );

  const fc = initFreeCell(1);
  assert.equal(fc.dealNumber, 1);
  assert.equal(fc.tableau.reduce((acc, c) => acc + c.length, 0), 52);
});

test('Minesweeper first click is always safe and flags toggle accurately', () => {
  let board = createMinesweeperBoard(9, 9, 10);
  board = toggleMineFlag(board, 0, 0);
  assert.equal(board.flagsUsed, 1);
  board = revealMineCell(board, 4, 4);
  assert.equal(board.cells[4][4].hasMine, false);
  assert.equal(board.cells[4][4].revealed, true);
});

test('Hearts enforces follow-suit and computes trick winner', () => {
  const hand = [
    { id: 'h5', suit: 'hearts' as const, rank: 5, faceUp: true },
    { id: 'c9', suit: 'clubs' as const, rank: 9, faceUp: true },
  ];
  const trick = [{ player: 1, card: { id: 'c4', suit: 'clubs' as const, rank: 4, faceUp: true } }];
  assert.equal(isLegalHeartsPlay({ card: hand[0], hand, trick, heartsBroken: true, isFirstTrick: false }).legal, false);
  assert.equal(isLegalHeartsPlay({ card: hand[1], hand, trick, heartsBroken: true, isFirstTrick: false }).legal, true);
  assert.equal(
    heartsTrickWinner([
      { player: 1, card: { id: 'c4', suit: 'clubs', rank: 4, faceUp: true } },
      { player: 2, card: { id: 'c1', suit: 'clubs', rank: 1, faceUp: true } },
    ]),
    2
  );
});

test('Reversi detects legal flip moves and rejects empty/non-flanking squares', () => {
  const b = createReversiBoard();
  assert.ok(getReversiFlips(b, 2, 3, 1).length > 0);
  assert.equal(getReversiFlips(b, 0, 0, 1).length, 0);
});

test('Scientific Calculator supports sin, sqrt, memory, and percentage', () => {
  let s = createInitialCalcState();
  s = pressDigit(s, '9');
  s = pressUnary(s, 'sqrt');
  assert.equal(s.display, '3');
  s = pressMemoryAdd(s);
  s = pressDigit(s, '5');
  s = pressMemoryRecall(s);
  assert.equal(s.display, '3');

  let p = createInitialCalcState();
  p = pressDigit(p, '2');
  p = pressDigit(p, '0');
  p = pressDigit(p, '0');
  p = pressOperator(p, '+');
  p = pressDigit(p, '1');
  p = pressDigit(p, '0');
  p = pressPercent(p);
  p = pressEquals(p);
  assert.equal(p.display, '220');
});
