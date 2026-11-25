// Pure game logic for Windows XP Games (Solitaire, Spider, FreeCell, Minesweeper, Hearts, Reversi)

export type Suit = 'spades' | 'hearts' | 'clubs' | 'diamonds';
export type CardColor = 'black' | 'red';

export interface Card {
  id: string;
  suit: Suit;
  rank: number; // 1 = Ace .. 13 = King
  faceUp: boolean;
}

export function suitColor(suit: Suit): CardColor {
  return suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black';
}

export function rankLabel(rank: number): string {
  switch (rank) {
    case 1:
      return 'A';
    case 11:
      return 'J';
    case 12:
      return 'Q';
    case 13:
      return 'K';
    default:
      return String(rank);
  }
}

export function suitSymbol(suit: Suit): string {
  switch (suit) {
    case 'spades':
      return '♠';
    case 'hearts':
      return '♥';
    case 'clubs':
      return '♣';
    case 'diamonds':
      return '♦';
  }
}

// Deterministic MS-style Linear Congruential Generator for numbered deals (e.g. FreeCell #1..32000)
export function createSeededRng(seed: number): () => number {
  let state = (seed >>> 0) || 1;
  return () => {
    state = (state * 214013 + 2531011) & 0x7fffffff;
    return (state >>> 16) / 32768;
  };
}

export function createShuffledDeck(seed?: number): Card[] {
  const suits: Suit[] = ['spades', 'hearts', 'clubs', 'diamonds'];
  const deck: Card[] = [];
  for (const suit of suits) {
    for (let rank = 1; rank <= 13; rank++) {
      deck.push({ id: `${suit}_${rank}`, suit, rank, faceUp: true });
    }
  }
  const rand = seed !== undefined ? createSeededRng(seed) : Math.random;
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// --- Klondike Solitaire ---
export interface SolitaireState {
  stock: Card[];
  waste: Card[];
  foundations: Card[][]; // 4 piles
  tableau: Card[][]; // 7 columns
  drawCount: 1 | 3;
  score: number;
  moves: number;
  won: boolean;
}

export function initSolitaire(drawCount: 1 | 3 = 1, seed?: number): SolitaireState {
  const deck = createShuffledDeck(seed);
  const tableau: Card[][] = [[], [], [], [], [], [], []];
  let idx = 0;
  for (let col = 0; col < 7; col++) {
    for (let row = 0; row <= col; row++) {
      const card = { ...deck[idx++], faceUp: row === col };
      tableau[col].push(card);
    }
  }
  const stock = deck.slice(idx).map((c) => ({ ...c, faceUp: false }));
  return {
    stock,
    waste: [],
    foundations: [[], [], [], []],
    tableau,
    drawCount,
    score: 0,
    moves: 0,
    won: false,
  };
}

export function canPlaceOnFoundation(card: Card, pile: Card[]): boolean {
  if (pile.length === 0) return card.rank === 1;
  const top = pile[pile.length - 1];
  return top.suit === card.suit && card.rank === top.rank + 1;
}

export function canPlaceOnKlondikeTableau(card: Card, column: Card[]): boolean {
  if (column.length === 0) return card.rank === 13;
  const top = column[column.length - 1];
  if (!top.faceUp) return false;
  return suitColor(card.suit) !== suitColor(top.suit) && card.rank === top.rank - 1;
}

export function drawSolitaireStock(state: SolitaireState): SolitaireState {
  if (state.stock.length === 0) {
    if (state.waste.length === 0) return state;
    return {
      ...state,
      stock: [...state.waste].reverse().map((c) => ({ ...c, faceUp: false })),
      waste: [],
      score: Math.max(0, state.score - (state.drawCount === 1 ? 100 : 20)),
      moves: state.moves + 1,
    };
  }
  const count = Math.min(state.drawCount, state.stock.length);
  const drawn = state.stock.slice(-count).reverse().map((c) => ({ ...c, faceUp: true }));
  return {
    ...state,
    stock: state.stock.slice(0, state.stock.length - count),
    waste: [...state.waste, ...drawn],
    moves: state.moves + 1,
  };
}

export function checkSolitaireWon(foundations: Card[][]): boolean {
  return foundations.every((f) => f.length === 13);
}

// --- Spider Solitaire ---
export interface SpiderState {
  stock: Card[];
  tableau: Card[][]; // 10 columns
  completedRuns: Suit[];
  suitsMode: 1 | 2 | 4;
  score: number;
  moves: number;
  won: boolean;
}

export function initSpider(suitsMode: 1 | 2 | 4 = 1, seed?: number): SpiderState {
  const deck: Card[] = [];
  const suitList: Suit[] =
    suitsMode === 1
      ? ['spades', 'spades', 'spades', 'spades', 'spades', 'spades', 'spades', 'spades']
      : suitsMode === 2
      ? ['spades', 'hearts', 'spades', 'hearts', 'spades', 'hearts', 'spades', 'hearts']
      : ['spades', 'hearts', 'clubs', 'diamonds', 'spades', 'hearts', 'clubs', 'diamonds'];

  suitList.forEach((suit, deckIdx) => {
    for (let rank = 1; rank <= 13; rank++) {
      deck.push({ id: `sp_${deckIdx}_${suit}_${rank}`, suit, rank, faceUp: true });
    }
  });

  const rand = seed !== undefined ? createSeededRng(seed) : Math.random;
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  const tableau: Card[][] = Array.from({ length: 10 }, () => []);
  let idx = 0;
  for (let col = 0; col < 10; col++) {
    const count = col < 4 ? 6 : 5;
    for (let r = 0; r < count; r++) {
      tableau[col].push({ ...deck[idx++], faceUp: r === count - 1 });
    }
  }
  const stock = deck.slice(idx).map((c) => ({ ...c, faceUp: false }));
  return {
    stock,
    tableau,
    completedRuns: [],
    suitsMode,
    score: 500,
    moves: 0,
    won: false,
  };
}

export function isSpiderMovableRun(col: Card[], startIdx: number): boolean {
  if (startIdx < 0 || startIdx >= col.length) return false;
  if (!col[startIdx].faceUp) return false;
  for (let i = startIdx; i < col.length - 1; i++) {
    if (col[i].suit !== col[i + 1].suit || col[i].rank !== col[i + 1].rank + 1) {
      return false;
    }
  }
  return true;
}

export function canPlaceOnSpiderColumn(movingTop: Card, targetCol: Card[]): boolean {
  if (targetCol.length === 0) return true;
  const top = targetCol[targetCol.length - 1];
  return movingTop.rank === top.rank - 1;
}

export function stripCompletedSpiderRuns(tableau: Card[][]): {
  tableau: Card[][];
  removedSuits: Suit[];
} {
  const removedSuits: Suit[] = [];
  const nextTableau = tableau.map((col) => {
    if (col.length < 13) return col;
    const tail = col.slice(-13);
    const suit = tail[0].suit;
    const isRun = tail.every((c, idx) => c.faceUp && c.suit === suit && c.rank === 13 - idx);
    if (!isRun) return col;
    removedSuits.push(suit);
    const rem = col.slice(0, -13);
    if (rem.length > 0 && !rem[rem.length - 1].faceUp) {
      rem[rem.length - 1] = { ...rem[rem.length - 1], faceUp: true };
    }
    return rem;
  });
  return { tableau: nextTableau, removedSuits };
}

// --- FreeCell ---
export interface FreeCellState {
  dealNumber: number;
  freeCells: Array<Card | null>; // 4
  foundations: Card[][]; // 4
  tableau: Card[][]; // 8
  moves: number;
  won: boolean;
}

export function initFreeCell(dealNumber = 1): FreeCellState {
  const deck = createShuffledDeck(dealNumber);
  const tableau: Card[][] = Array.from({ length: 8 }, () => []);
  deck.forEach((card, i) => {
    tableau[i % 8].push({ ...card, faceUp: true });
  });
  return {
    dealNumber,
    freeCells: [null, null, null, null],
    foundations: [[], [], [], []],
    tableau,
    moves: 0,
    won: false,
  };
}

export function canPlaceOnFreeCellTableau(card: Card, column: Card[]): boolean {
  if (column.length === 0) return true;
  const top = column[column.length - 1];
  return suitColor(card.suit) !== suitColor(top.suit) && card.rank === top.rank - 1;
}

export function maxFreeCellSupermove(freeCells: Array<Card | null>, tableau: Card[][], targetEmpty: boolean): number {
  const emptyFree = freeCells.filter((c) => c === null).length;
  const emptyCols = tableau.filter((col) => col.length === 0).length - (targetEmpty ? 1 : 0);
  return (emptyFree + 1) * Math.pow(2, Math.max(0, emptyCols));
}

// --- Minesweeper ---
export interface MineCell {
  row: number;
  col: number;
  hasMine: boolean;
  revealed: boolean;
  flagged: boolean;
  question: boolean;
  adjacent: number;
}

export interface MinesweeperBoard {
  rows: number;
  cols: number;
  mines: number;
  cells: MineCell[][];
  minesPlaced: boolean;
  status: 'ready' | 'playing' | 'won' | 'lost';
  flagsUsed: number;
}

export function createMinesweeperBoard(rows: number, cols: number, mines: number): MinesweeperBoard {
  const clampedRows = Math.max(5, Math.min(24, rows));
  const clampedCols = Math.max(5, Math.min(30, cols));
  const maxMines = Math.max(1, clampedRows * clampedCols - 2);
  const clampedMines = Math.max(1, Math.min(maxMines, mines));

  const cells: MineCell[][] = Array.from({ length: clampedRows }, (_, r) =>
    Array.from({ length: clampedCols }, (_, c) => ({
      row: r,
      col: c,
      hasMine: false,
      revealed: false,
      flagged: false,
      question: false,
      adjacent: 0,
    }))
  );

  return {
    rows: clampedRows,
    cols: clampedCols,
    mines: clampedMines,
    cells,
    minesPlaced: false,
    status: 'ready',
    flagsUsed: 0,
  };
}

function placeMinesSafely(board: MinesweeperBoard, safeRow: number, safeCol: number): MineCell[][] {
  const cells = board.cells.map((row) => row.map((cell) => ({ ...cell })));
  const candidates: Array<[number, number]> = [];
  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      if (r === safeRow && c === safeCol) continue;
      candidates.push([r, c]);
    }
  }
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  for (let i = 0; i < board.mines && i < candidates.length; i++) {
    const [mr, mc] = candidates[i];
    cells[mr][mc].hasMine = true;
  }
  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < board.rows && nc >= 0 && nc < board.cols && cells[nr][nc].hasMine) {
            count++;
          }
        }
      }
      cells[r][c].adjacent = count;
    }
  }
  return cells;
}

export function revealMineCell(board: MinesweeperBoard, row: number, col: number): MinesweeperBoard {
  if (board.status === 'won' || board.status === 'lost') return board;
  const target = board.cells[row]?.[col];
  if (!target || target.revealed || target.flagged) return board;

  const cells = board.minesPlaced
    ? board.cells.map((r) => r.map((c) => ({ ...c })))
    : placeMinesSafely(board, row, col);

  if (cells[row][col].hasMine) {
    for (let r = 0; r < board.rows; r++) {
      for (let c = 0; c < board.cols; c++) {
        if (cells[r][c].hasMine) cells[r][c].revealed = true;
      }
    }
    return {
      ...board,
      cells,
      minesPlaced: true,
      status: 'lost',
    };
  }

  // Flood fill
  const queue: Array<[number, number]> = [[row, col]];
  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    const cell = cells[r][c];
    if (cell.revealed || cell.flagged) continue;
    cell.revealed = true;
    cell.question = false;
    if (cell.adjacent === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < board.rows && nc >= 0 && nc < board.cols && !cells[nr][nc].revealed) {
            queue.push([nr, nc]);
          }
        }
      }
    }
  }

  let unrevealedSafe = 0;
  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      if (!cells[r][c].hasMine && !cells[r][c].revealed) unrevealedSafe++;
    }
  }

  return {
    ...board,
    cells,
    minesPlaced: true,
    status: unrevealedSafe === 0 ? 'won' : 'playing',
  };
}

export function toggleMineFlag(board: MinesweeperBoard, row: number, col: number): MinesweeperBoard {
  if (board.status === 'won' || board.status === 'lost') return board;
  const target = board.cells[row]?.[col];
  if (!target || target.revealed) return board;
  const cells = board.cells.map((r) => r.map((c) => ({ ...c })));
  const cell = cells[row][col];
  if (!cell.flagged && !cell.question) {
    cell.flagged = true;
  } else if (cell.flagged) {
    cell.flagged = false;
    cell.question = true;
  } else {
    cell.question = false;
  }
  const flagsUsed = cells.flat().filter((c) => c.flagged).length;
  return { ...board, cells, flagsUsed };
}

// --- Hearts Rules ---
export function isLegalHeartsPlay(params: {
  card: Card;
  hand: Card[];
  trick: Array<{ player: number; card: Card }>;
  heartsBroken: boolean;
  isFirstTrick: boolean;
}): { legal: boolean; reason?: string } {
  const { card, hand, trick, heartsBroken, isFirstTrick } = params;

  if (trick.length === 0) {
    if (isFirstTrick) {
      const hasTwoClubs = hand.some((c) => c.suit === 'clubs' && c.rank === 2);
      if (hasTwoClubs && !(card.suit === 'clubs' && card.rank === 2)) {
        return { legal: false, reason: 'You must lead the 2 of Clubs on the first trick.' };
      }
    }
    if (!heartsBroken && card.suit === 'hearts') {
      const onlyHearts = hand.every((c) => c.suit === 'hearts');
      if (!onlyHearts) {
        return { legal: false, reason: 'Hearts have not been broken yet.' };
      }
    }
    return { legal: true };
  }

  const leadSuit = trick[0].card.suit;
  const hasLeadSuit = hand.some((c) => c.suit === leadSuit);
  if (hasLeadSuit && card.suit !== leadSuit) {
    return { legal: false, reason: `You must follow suit (${leadSuit}).` };
  }

  if (isFirstTrick && !hasLeadSuit) {
    const isPointCard = card.suit === 'hearts' || (card.suit === 'spades' && card.rank === 12);
    const hasNonPointCard = hand.some(
      (c) => c.suit !== 'hearts' && !(c.suit === 'spades' && c.rank === 12)
    );
    if (isPointCard && hasNonPointCard) {
      return { legal: false, reason: 'You cannot play point cards on the first trick.' };
    }
  }

  return { legal: true };
}

export function heartsTrickWinner(trick: Array<{ player: number; card: Card }>): number {
  const leadSuit = trick[0].card.suit;
  let best = trick[0];
  for (const play of trick) {
    const val = play.card.rank === 1 ? 14 : play.card.rank;
    const bestVal = best.card.rank === 1 ? 14 : best.card.rank;
    if (play.card.suit === leadSuit && val > bestVal) {
      best = play;
    }
  }
  return best.player;
}

// --- Reversi Rules (used by Internet Reversi) ---
export type ReversiDisc = 0 | 1 | 2; // 0 empty, 1 player (black), 2 AI (white)

export function createReversiBoard(): ReversiDisc[][] {
  const b: ReversiDisc[][] = Array.from({ length: 8 }, () => Array(8).fill(0));
  b[3][3] = 2;
  b[3][4] = 1;
  b[4][3] = 1;
  b[4][4] = 2;
  return b;
}

export function getReversiFlips(
  board: ReversiDisc[][],
  row: number,
  col: number,
  player: 1 | 2
): Array<[number, number]> {
  if (board[row]?.[col] !== 0) return [];
  const opp: 1 | 2 = player === 1 ? 2 : 1;
  const dirs = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1],
  ];
  const flips: Array<[number, number]> = [];
  for (const [dr, dc] of dirs) {
    const line: Array<[number, number]> = [];
    let r = row + dr;
    let c = col + dc;
    while (r >= 0 && r < 8 && c >= 0 && c < 8 && board[r][c] === opp) {
      line.push([r, c]);
      r += dr;
      c += dc;
    }
    if (line.length > 0 && r >= 0 && r < 8 && c >= 0 && c < 8 && board[r][c] === player) {
      flips.push(...line);
    }
  }
  return flips;
}
