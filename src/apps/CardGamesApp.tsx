import React, { useMemo, useState } from 'react';
import type { ModalPromptRequest, SystemState } from '../types/os';
import {
  type Card,
  type FreeCellState,
  type SolitaireState,
  type SpiderState,
  canPlaceOnFoundation,
  canPlaceOnFreeCellTableau,
  canPlaceOnKlondikeTableau,
  canPlaceOnSpiderColumn,
  checkSolitaireWon,
  createShuffledDeck,
  drawSolitaireStock,
  heartsTrickWinner,
  initFreeCell,
  initSolitaire,
  initSpider,
  isLegalHeartsPlay,
  isSpiderMovableRun,
  rankLabel,
  stripCompletedSpiderRuns,
  suitColor,
  suitSymbol,
} from '../utils/games';
import { XpMenuBar, type XpMenuGroup } from '../components/xp/XpMenuBar';

const CardChip: React.FC<{
  card: Card;
  selected?: boolean;
  compact?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
}> = ({ card, selected, compact, onClick, onDoubleClick }) => {
  if (!card.faceUp) {
    return (
      <div
        onClick={onClick}
        className={`w-[54px] ${compact ? 'h-[20px]' : 'h-[72px]'} rounded-[4px] border border-[#ffffff] bg-gradient-to-br from-[#235bc9] to-[#11317a] shadow-sm cursor-default`}
      />
    );
  }
  const red = suitColor(card.suit) === 'red';
  return (
    <button
      type="button"
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={`w-[54px] ${compact ? 'h-[24px]' : 'h-[72px]'} rounded-[4px] border ${
        selected ? 'border-[#ffcf33] ring-2 ring-[#ffcf33]' : 'border-[#333333]'
      } bg-white px-1 py-0.5 flex flex-col justify-between text-left shadow-sm cursor-default ${
        red ? 'text-[#cc1111]' : 'text-[#111111]'
      }`}
    >
      <div className="text-[11px] font-bold leading-none flex items-center justify-between">
        <span>{rankLabel(card.rank)}</span>
        <span>{suitSymbol(card.suit)}</span>
      </div>
      {!compact && (
        <div className="text-[20px] self-center leading-none">{suitSymbol(card.suit)}</div>
      )}
      {!compact && (
        <div className="text-[10px] font-bold self-end leading-none">
          {rankLabel(card.rank)}
        </div>
      )}
    </button>
  );
};

// --- Klondike Solitaire ---
interface SolitaireAppProps {
  system: SystemState;
  onUpdateSystem: (updater: (prev: SystemState) => SystemState) => void;
  onOpenModal: (modal: Omit<ModalPromptRequest, 'id'>) => void;
}

export const SolitaireApp: React.FC<SolitaireAppProps> = ({
  system,
  onUpdateSystem,
  onOpenModal,
}) => {
  const [drawCount, setDrawCount] = useState<1 | 3>(1);
  const [game, setGame] = useState<SolitaireState>(() => initSolitaire(1));
  const [undoStack, setUndoStack] = useState<SolitaireState[]>([]);
  const [selection, setSelection] = useState<
    | { source: 'waste' }
    | { source: 'tableau'; col: number; idx: number }
    | null
  >(null);

  const commitMove = (next: SolitaireState) => {
    setUndoStack((prev) => [...prev.slice(-20), game]);
    const won = checkSolitaireWon(next.foundations);
    setGame({ ...next, won });
    setSelection(null);
    if (won && !game.won) {
      onUpdateSystem((prev) => ({
        ...prev,
        gameStats: { ...prev.gameStats, solitaireWins: prev.gameStats.solitaireWins + 1 },
      }));
    }
  };

  const restart = (nextDraw: 1 | 3 = drawCount) => {
    setDrawCount(nextDraw);
    setGame(initSolitaire(nextDraw));
    setUndoStack([]);
    setSelection(null);
  };

  const tryAutoFoundation = (card: Card, removeFn: (s: SolitaireState) => SolitaireState) => {
    const fIdx = game.foundations.findIndex((f) => canPlaceOnFoundation(card, f));
    if (fIdx === -1) return false;
    const base = removeFn(game);
    const nextFoundations = base.foundations.map((f, i) => (i === fIdx ? [...f, card] : f));
    commitMove({ ...base, foundations: nextFoundations, score: base.score + 10, moves: base.moves + 1 });
    return true;
  };

  const handlePlaceOnColumn = (targetCol: number) => {
    if (!selection) return;
    if (selection.source === 'waste') {
      const card = game.waste[game.waste.length - 1];
      if (!card || !canPlaceOnKlondikeTableau(card, game.tableau[targetCol])) {
        setSelection(null);
        return;
      }
      const nextTableau = game.tableau.map((c, i) => (i === targetCol ? [...c, card] : c));
      commitMove({
        ...game,
        waste: game.waste.slice(0, -1),
        tableau: nextTableau,
        score: game.score + 5,
        moves: game.moves + 1,
      });
    } else if (selection.source === 'tableau') {
      if (selection.col === targetCol) {
        setSelection(null);
        return;
      }
      const moving = game.tableau[selection.col].slice(selection.idx);
      if (moving.length === 0 || !canPlaceOnKlondikeTableau(moving[0], game.tableau[targetCol])) {
        setSelection(null);
        return;
      }
      const nextTableau = game.tableau.map((c, i) => {
        if (i === selection.col) {
          const rem = c.slice(0, selection.idx);
          if (rem.length > 0 && !rem[rem.length - 1].faceUp) {
            rem[rem.length - 1] = { ...rem[rem.length - 1], faceUp: true };
          }
          return rem;
        }
        if (i === targetCol) return [...c, ...moving];
        return c;
      });
      commitMove({ ...game, tableau: nextTableau, moves: game.moves + 1 });
    }
  };

  const handlePlaceOnFoundation = (fIdx: number) => {
    if (!selection) return;
    if (selection.source === 'waste') {
      const card = game.waste[game.waste.length - 1];
      if (card && canPlaceOnFoundation(card, game.foundations[fIdx])) {
        const nextFoundations = game.foundations.map((f, i) => (i === fIdx ? [...f, card] : f));
        commitMove({
          ...game,
          waste: game.waste.slice(0, -1),
          foundations: nextFoundations,
          score: game.score + 10,
          moves: game.moves + 1,
        });
      }
    } else if (selection.source === 'tableau') {
      const col = game.tableau[selection.col];
      if (selection.idx !== col.length - 1) return;
      const card = col[col.length - 1];
      if (card && canPlaceOnFoundation(card, game.foundations[fIdx])) {
        const nextTableau = game.tableau.map((c, i) => {
          if (i !== selection.col) return c;
          const rem = c.slice(0, -1);
          if (rem.length > 0 && !rem[rem.length - 1].faceUp) {
            rem[rem.length - 1] = { ...rem[rem.length - 1], faceUp: true };
          }
          return rem;
        });
        const nextFoundations = game.foundations.map((f, i) => (i === fIdx ? [...f, card] : f));
        commitMove({
          ...game,
          tableau: nextTableau,
          foundations: nextFoundations,
          score: game.score + 10,
          moves: game.moves + 1,
        });
      }
    }
    setSelection(null);
  };

  const menuGroups: XpMenuGroup[] = [
    {
      id: 'game',
      label: 'Game',
      items: [
        { id: 'deal', label: 'Deal', shortcut: 'F2', onSelect: () => restart(drawCount) },
        {
          id: 'undo',
          label: 'Undo',
          disabled: undoStack.length === 0,
          onSelect: () => {
            const prev = undoStack[undoStack.length - 1];
            if (prev) {
              setGame(prev);
              setUndoStack((s) => s.slice(0, -1));
            }
          },
        },
        {
          id: 'draw1',
          label: 'Draw One',
          checked: drawCount === 1,
          separatorBefore: true,
          onSelect: () => restart(1),
        },
        {
          id: 'draw3',
          label: 'Draw Three',
          checked: drawCount === 3,
          onSelect: () => restart(3),
        },
      ],
    },
    {
      id: 'help',
      label: 'Help',
      items: [
        {
          id: 'about',
          label: 'About Solitaire',
          onSelect: () =>
            onOpenModal({
              kind: 'alert',
              icon: 'info',
              title: 'About Solitaire',
              message: `Windows XP Solitaire\nTotal Wins: ${system.gameStats.solitaireWins}`,
            }),
        },
      ],
    },
  ];

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#008000] text-[11px] select-none">
      <XpMenuBar groups={menuGroups} />
      <div className="p-2.5 flex-1 min-h-0 flex flex-col gap-3 overflow-y-auto xp-scroll">
        {/* Top Row: Stock, Waste, Foundations */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => commitMove(drawSolitaireStock(game))}
              className="w-[54px] h-[72px] rounded-[4px] border-2 border-white/70 bg-[#1a4eb8] text-white font-bold flex items-center justify-center cursor-default"
              aria-label="Draw from stock"
            >
              {game.stock.length > 0 ? game.stock.length : '↺'}
            </button>
            <div className="w-[54px] h-[72px] rounded-[4px] border border-white/40 flex items-center justify-center">
              {game.waste.length > 0 && (
                <CardChip
                  card={game.waste[game.waste.length - 1]}
                  selected={selection?.source === 'waste'}
                  onClick={() => setSelection({ source: 'waste' })}
                  onDoubleClick={() => {
                    const top = game.waste[game.waste.length - 1];
                    if (top) {
                      tryAutoFoundation(top, (s) => ({ ...s, waste: s.waste.slice(0, -1) }));
                    }
                  }}
                />
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {game.foundations.map((pile, fIdx) => (
              <div
                key={fIdx}
                onClick={() => handlePlaceOnFoundation(fIdx)}
                className="w-[54px] h-[72px] rounded-[4px] border border-white/60 bg-[#006400] flex items-center justify-center text-white/60 font-bold"
              >
                {pile.length > 0 ? (
                  <CardChip card={pile[pile.length - 1]} />
                ) : (
                  'A'
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tableau */}
        <div className="grid grid-cols-7 gap-1.5 flex-1">
          {game.tableau.map((col, colIdx) => (
            <div
              key={colIdx}
              onClick={() => {
                if (col.length === 0) handlePlaceOnColumn(colIdx);
              }}
              className="min-h-[160px] flex flex-col items-center"
            >
              {col.length === 0 ? (
                <div className="w-[54px] h-[72px] rounded-[4px] border border-dashed border-white/40 text-white/40 flex items-center justify-center">
                  K
                </div>
              ) : (
                col.map((card, rIdx) => {
                  const isLast = rIdx === col.length - 1;
                  const isSel =
                    selection?.source === 'tableau' &&
                    selection.col === colIdx &&
                    rIdx >= selection.idx;
                  return (
                    <div key={card.id} className={rIdx > 0 ? '-mt-[52px]' : ''}>
                      <CardChip
                        card={card}
                        selected={isSel}
                        onClick={() => {
                          if (!card.faceUp) return;
                          if (selection) {
                            handlePlaceOnColumn(colIdx);
                          } else {
                            setSelection({ source: 'tableau', col: colIdx, idx: rIdx });
                          }
                        }}
                        onDoubleClick={() => {
                          if (isLast && card.faceUp) {
                            tryAutoFoundation(card, (s) => ({
                              ...s,
                              tableau: s.tableau.map((c, i) => {
                                if (i !== colIdx) return c;
                                const rem = c.slice(0, -1);
                                if (rem.length > 0 && !rem[rem.length - 1].faceUp) {
                                  rem[rem.length - 1] = { ...rem[rem.length - 1], faceUp: true };
                                }
                                return rem;
                              }),
                            }));
                          }
                        }}
                      />
                    </div>
                  );
                })
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#ece9d8] text-black px-2 py-1 border-t border-[#aca899] flex items-center justify-between">
        <span>{game.won ? 'You Win!' : `Draw ${drawCount} | Moves: ${game.moves}`}</span>
        <span>Score: {game.score}</span>
      </div>
    </div>
  );
};

// --- Spider Solitaire ---
interface SpiderSolitaireAppProps {
  system: SystemState;
  onUpdateSystem: (updater: (prev: SystemState) => SystemState) => void;
}

export const SpiderSolitaireApp: React.FC<SpiderSolitaireAppProps> = ({
  system,
  onUpdateSystem,
}) => {
  const [suitsMode, setSuitsMode] = useState<1 | 2 | 4>(1);
  const [game, setGame] = useState<SpiderState>(() => initSpider(1));
  const [undoStack, setUndoStack] = useState<SpiderState[]>([]);
  const [sel, setSel] = useState<{ col: number; idx: number } | null>(null);

  const restart = (mode: 1 | 2 | 4 = suitsMode) => {
    setSuitsMode(mode);
    setGame(initSpider(mode));
    setUndoStack([]);
    setSel(null);
  };

  const dealRow = () => {
    if (game.stock.length === 0) return;
    if (game.tableau.some((col) => col.length === 0)) return;
    setUndoStack((prev) => [...prev.slice(-15), game]);
    const dealCards = game.stock.slice(0, 10).map((c) => ({ ...c, faceUp: true }));
    const nextTab = game.tableau.map((col, idx) =>
      dealCards[idx] ? [...col, dealCards[idx]] : col
    );
    const stripped = stripCompletedSpiderRuns(nextTab);
    const nextCompleted = [...game.completedRuns, ...stripped.removedSuits];
    const won = nextCompleted.length >= 8;
    setGame({
      ...game,
      stock: game.stock.slice(10),
      tableau: stripped.tableau,
      completedRuns: nextCompleted,
      moves: game.moves + 1,
      won,
    });
  };

  const moveToCol = (targetCol: number) => {
    if (!sel || sel.col === targetCol) {
      setSel(null);
      return;
    }
    const moving = game.tableau[sel.col].slice(sel.idx);
    if (!isSpiderMovableRun(game.tableau[sel.col], sel.idx)) {
      setSel(null);
      return;
    }
    if (!canPlaceOnSpiderColumn(moving[0], game.tableau[targetCol])) {
      setSel(null);
      return;
    }
    setUndoStack((prev) => [...prev.slice(-15), game]);
    const rawTab = game.tableau.map((col, idx) => {
      if (idx === sel.col) {
        const rem = col.slice(0, sel.idx);
        if (rem.length > 0 && !rem[rem.length - 1].faceUp) {
          rem[rem.length - 1] = { ...rem[rem.length - 1], faceUp: true };
        }
        return rem;
      }
      if (idx === targetCol) return [...col, ...moving];
      return col;
    });
    const stripped = stripCompletedSpiderRuns(rawTab);
    const nextCompleted = [...game.completedRuns, ...stripped.removedSuits];
    const won = nextCompleted.length >= 8;
    if (won && !game.won) {
      onUpdateSystem((prev) => ({
        ...prev,
        gameStats: { ...prev.gameStats, spiderWins: prev.gameStats.spiderWins + 1 },
      }));
    }
    setGame({
      ...game,
      tableau: stripped.tableau,
      completedRuns: nextCompleted,
      score: Math.max(0, game.score - 1 + stripped.removedSuits.length * 100),
      moves: game.moves + 1,
      won,
    });
    setSel(null);
  };

  const menuGroups: XpMenuGroup[] = [
    {
      id: 'game',
      label: 'Game',
      items: [
        { id: 'new', label: 'New Game', onSelect: () => restart(suitsMode) },
        {
          id: 'undo',
          label: 'Undo',
          disabled: undoStack.length === 0,
          onSelect: () => {
            const prev = undoStack[undoStack.length - 1];
            if (prev) {
              setGame(prev);
              setUndoStack((s) => s.slice(0, -1));
            }
          },
        },
        { id: 's1', label: '1 Suit (Easy)', checked: suitsMode === 1, separatorBefore: true, onSelect: () => restart(1) },
        { id: 's2', label: '2 Suits (Medium)', checked: suitsMode === 2, onSelect: () => restart(2) },
        { id: 's4', label: '4 Suits (Difficult)', checked: suitsMode === 4, onSelect: () => restart(4) },
      ],
    },
  ];

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#007336] text-[11px] select-none">
      <XpMenuBar groups={menuGroups} />
      <div className="p-2 flex-1 min-h-0 flex flex-col gap-2 overflow-y-auto xp-scroll">
        <div className="flex items-center justify-between text-white">
          <div>Completed Runs: {game.completedRuns.length} / 8 (Wins: {system.gameStats.spiderWins})</div>
          <button
            type="button"
            disabled={game.stock.length === 0}
            onClick={dealRow}
            className="xp-button text-black"
          >
            Deal Row ({Math.floor(game.stock.length / 10)} left)
          </button>
        </div>

        <div className="grid grid-cols-10 gap-1 flex-1">
          {game.tableau.map((col, cIdx) => (
            <div
              key={cIdx}
              onClick={() => {
                if (col.length === 0 && sel) moveToCol(cIdx);
              }}
              className="flex flex-col items-center min-h-[140px]"
            >
              {col.length === 0 ? (
                <div className="w-[54px] h-[72px] rounded-[4px] border border-dashed border-white/40" />
              ) : (
                col.map((card, rIdx) => (
                  <div key={card.id} className={rIdx > 0 ? '-mt-[54px]' : ''}>
                    <CardChip
                      card={card}
                      selected={sel?.col === cIdx && rIdx >= sel.idx}
                      onClick={() => {
                        if (sel) {
                          moveToCol(cIdx);
                        } else if (isSpiderMovableRun(col, rIdx)) {
                          setSel({ col: cIdx, idx: rIdx });
                        }
                      }}
                    />
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#ece9d8] text-black px-2 py-1 border-t border-[#aca899] flex justify-between">
        <span>{game.won ? 'Spider Solitaire Won!' : `${suitsMode} Suit(s) | Moves: ${game.moves}`}</span>
        <span>Score: {game.score}</span>
      </div>
    </div>
  );
};

// --- FreeCell ---
interface FreeCellAppProps {
  system: SystemState;
  onUpdateSystem: (updater: (prev: SystemState) => SystemState) => void;
}

export const FreeCellApp: React.FC<FreeCellAppProps> = ({ system, onUpdateSystem }) => {
  const [dealNumber, setDealNumber] = useState(11982);
  const [game, setGame] = useState<FreeCellState>(() => initFreeCell(11982));
  const [sel, setSel] = useState<
    { source: 'free'; idx: number } | { source: 'tableau'; col: number } | null
  >(null);

  const restart = (num: number = dealNumber) => {
    const clean = Math.max(1, Math.min(32000, num));
    setDealNumber(clean);
    setGame(initFreeCell(clean));
    setSel(null);
  };

  const getSelectedCard = (): Card | null => {
    if (!sel) return null;
    if (sel.source === 'free') return game.freeCells[sel.idx];
    const col = game.tableau[sel.col];
    return col[col.length - 1] ?? null;
  };

  const removeSelected = (s: FreeCellState): FreeCellState => {
    if (!sel) return s;
    if (sel.source === 'free') {
      return {
        ...s,
        freeCells: s.freeCells.map((c, i) => (i === sel.idx ? null : c)),
      };
    }
    return {
      ...s,
      tableau: s.tableau.map((col, i) => (i === sel.col ? col.slice(0, -1) : col)),
    };
  };

  const moveSelectedToFree = (idx: number) => {
    if (game.freeCells[idx] !== null) return;
    const card = getSelectedCard();
    if (!card) return;
    const base = removeSelected(game);
    setGame({
      ...base,
      freeCells: base.freeCells.map((c, i) => (i === idx ? card : c)),
      moves: base.moves + 1,
    });
    setSel(null);
  };

  const moveSelectedToFoundation = (fIdx: number) => {
    const card = getSelectedCard();
    if (!card || !canPlaceOnFoundation(card, game.foundations[fIdx])) {
      setSel(null);
      return;
    }
    const base = removeSelected(game);
    const nextFoundations = base.foundations.map((f, i) => (i === fIdx ? [...f, card] : f));
    const won = checkSolitaireWon(nextFoundations);
    if (won && !game.won) {
      onUpdateSystem((prev) => ({
        ...prev,
        gameStats: { ...prev.gameStats, freecellWins: prev.gameStats.freecellWins + 1 },
      }));
    }
    setGame({ ...base, foundations: nextFoundations, moves: base.moves + 1, won });
    setSel(null);
  };

  const moveSelectedToTableau = (tCol: number) => {
    const card = getSelectedCard();
    if (!card || !canPlaceOnFreeCellTableau(card, game.tableau[tCol])) {
      setSel(null);
      return;
    }
    const base = removeSelected(game);
    setGame({
      ...base,
      tableau: base.tableau.map((col, i) => (i === tCol ? [...col, card] : col)),
      moves: base.moves + 1,
    });
    setSel(null);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#007a00] text-[11px] select-none">
      <div className="bg-[#ece9d8] text-black px-2 py-1 border-b border-[#aca899] flex items-center gap-2">
        <span>Deal #:</span>
        <input
          type="number"
          value={dealNumber}
          onChange={(e) => setDealNumber(Number(e.target.value))}
          className="xp-input w-[72px]"
        />
        <button type="button" onClick={() => restart(dealNumber)} className="xp-button">
          Select Game
        </button>
        <button
          type="button"
          onClick={() => restart(Math.floor(1 + Math.random() * 32000))}
          className="xp-button"
        >
          Random Deal
        </button>
        <span className="ml-auto">Wins: {system.gameStats.freecellWins}</span>
      </div>

      <div className="p-2.5 flex-1 min-h-0 flex flex-col gap-3 overflow-y-auto xp-scroll">
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1.5">
            {game.freeCells.map((c, idx) => (
              <div
                key={idx}
                onClick={() => (c ? setSel({ source: 'free', idx }) : sel && moveSelectedToFree(idx))}
                className="w-[54px] h-[72px] rounded-[4px] border border-white/60 bg-[#005900] flex items-center justify-center"
              >
                {c && <CardChip card={c} selected={sel?.source === 'free' && sel.idx === idx} />}
              </div>
            ))}
          </div>
          <div className="flex gap-1.5">
            {game.foundations.map((pile, fIdx) => (
              <div
                key={fIdx}
                onClick={() => moveSelectedToFoundation(fIdx)}
                className="w-[54px] h-[72px] rounded-[4px] border border-white/60 bg-[#005900] flex items-center justify-center text-white/60 font-bold"
              >
                {pile.length > 0 ? <CardChip card={pile[pile.length - 1]} /> : 'A'}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-8 gap-1 flex-1">
          {game.tableau.map((col, cIdx) => (
            <div
              key={cIdx}
              onClick={() => {
                if (col.length === 0 && sel) moveSelectedToTableau(cIdx);
              }}
              className="flex flex-col items-center min-h-[140px]"
            >
              {col.map((card, rIdx) => {
                const isTop = rIdx === col.length - 1;
                return (
                  <div key={card.id} className={rIdx > 0 ? '-mt-[52px]' : ''}>
                    <CardChip
                      card={card}
                      selected={isTop && sel?.source === 'tableau' && sel.col === cIdx}
                      onClick={() => {
                        if (!isTop) return;
                        if (sel) moveSelectedToTableau(cIdx);
                        else setSel({ source: 'tableau', col: cIdx });
                      }}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#ece9d8] text-black px-2 py-1 border-t border-[#aca899] flex justify-between">
        <span>{game.won ? 'You Won FreeCell!' : `Game #${game.dealNumber}`}</span>
        <span>Moves: {game.moves}</span>
      </div>
    </div>
  );
};

// --- Microsoft Hearts (4-Player vs Local AI) ---
interface HeartsAppProps {
  system: SystemState;
  onUpdateSystem: (updater: (prev: SystemState) => SystemState) => void;
}

export const HeartsApp: React.FC<HeartsAppProps> = ({ system, onUpdateSystem }) => {
  const initialHands = useMemo(() => {
    const deck = createShuffledDeck();
    return [0, 1, 2, 3].map((p) =>
      deck.slice(p * 13, (p + 1) * 13).sort((a, b) => a.suit.localeCompare(b.suit) || a.rank - b.rank)
    );
  }, []);

  const [hands, setHands] = useState<Card[][]>(initialHands);
  const [phase, setPhase] = useState<'passing' | 'playing' | 'finished'>('passing');
  const [passSelection, setPassSelection] = useState<string[]>([]);
  const [trick, setTrick] = useState<Array<{ player: number; card: Card }>>([]);
  const [heartsBroken, setHeartsBroken] = useState(false);
  const [scores, setScores] = useState<[number, number, number, number]>([0, 0, 0, 0]);
  const [tricksPlayed, setTricksPlayed] = useState(0);
  const [notice, setNotice] = useState('Select 3 cards to pass left to West.');

  const names = ['You', 'West', 'North', 'East'];

  const startNewRound = () => {
    const deck = createShuffledDeck();
    setHands([0, 1, 2, 3].map((p) => deck.slice(p * 13, (p + 1) * 13)));
    setPhase('passing');
    setPassSelection([]);
    setTrick([]);
    setHeartsBroken(false);
    setScores([0, 0, 0, 0]);
    setTricksPlayed(0);
    setNotice('Select 3 cards to pass left to West.');
  };

  const confirmPass = () => {
    if (passSelection.length !== 3) return;
    const p0Out = hands[0].filter((c) => passSelection.includes(c.id));
    const p1Out = hands[1].slice(0, 3);
    const p2Out = hands[2].slice(0, 3);
    const p3Out = hands[3].slice(0, 3);
    const nextHands: Card[][] = [
      [...hands[0].filter((c) => !passSelection.includes(c.id)), ...p3Out],
      [...hands[1].slice(3), ...p0Out],
      [...hands[2].slice(3), ...p1Out],
      [...hands[3].slice(3), ...p2Out],
    ];
    setHands(nextHands);
    setPassSelection([]);
    setPhase('playing');

    // Find holder of 2 of Clubs to lead first trick
    const starter = nextHands.findIndex((h) => h.some((c) => c.suit === 'clubs' && c.rank === 2));
    if (starter !== 0) {
      const autoTrick: Array<{ player: number; card: Card }> = [];
      let hb = false;
      const updated = nextHands.map((h) => [...h]);
      for (let offset = 0; offset < 4; offset++) {
        const p = (starter + offset) % 4;
        if (p === 0) break;
        const choice =
          updated[p].find((c) =>
            isLegalHeartsPlay({
              card: c,
              hand: updated[p],
              trick: autoTrick,
              heartsBroken: hb,
              isFirstTrick: true,
            }).legal
          ) ?? updated[p][0];
        updated[p] = updated[p].filter((c) => c.id !== choice.id);
        if (choice.suit === 'hearts') hb = true;
        autoTrick.push({ player: p, card: choice });
      }
      setHands(updated);
      setTrick(autoTrick);
      setHeartsBroken(hb);
      setNotice('2♣ led. Your turn to follow suit.');
    } else {
      setNotice('You hold 2♣. Click 2♣ to lead the first trick.');
    }
  };

  const playCard = (card: Card) => {
    if (phase !== 'playing') return;
    const check = isLegalHeartsPlay({
      card,
      hand: hands[0],
      trick,
      heartsBroken,
      isFirstTrick: tricksPlayed === 0,
    });
    if (!check.legal) {
      setNotice(check.reason || 'Illegal play.');
      return;
    }

    const updated = hands.map((h) => [...h]);
    updated[0] = updated[0].filter((c) => c.id !== card.id);
    const curTrick = [...trick, { player: 0, card }];
    let hb = heartsBroken || card.suit === 'hearts';

    // Remaining players for this trick
    while (curTrick.length < 4) {
      const p = (curTrick[curTrick.length - 1].player + 1) % 4;
      const choice =
        updated[p].find((c) =>
          isLegalHeartsPlay({
            card: c,
            hand: updated[p],
            trick: curTrick,
            heartsBroken: hb,
            isFirstTrick: tricksPlayed === 0,
          }).legal
        ) ?? updated[p][0];
      updated[p] = updated[p].filter((c) => c.id !== choice.id);
      if (choice.suit === 'hearts') hb = true;
      curTrick.push({ player: p, card: choice });
    }

    const winner = heartsTrickWinner(curTrick);
    const pts = curTrick.reduce(
      (sum, item) =>
        sum +
        (item.card.suit === 'hearts' ? 1 : item.card.suit === 'spades' && item.card.rank === 12 ? 13 : 0),
      0
    );
    const nextScores: [number, number, number, number] = [...scores] as [number, number, number, number];
    nextScores[winner] += pts;

    const nextTricksPlayed = tricksPlayed + 1;
    setHeartsBroken(hb);
    setScores(nextScores);
    setTricksPlayed(nextTricksPlayed);

    if (nextTricksPlayed >= 13) {
      setHands(updated);
      setTrick([]);
      setPhase('finished');
      const minScore = Math.min(...nextScores);
      if (nextScores[0] === minScore) {
        onUpdateSystem((prev) => ({
          ...prev,
          gameStats: { ...prev.gameStats, heartsWins: prev.gameStats.heartsWins + 1 },
        }));
      }
      setNotice(`Round complete! ${names[winner]} won last trick. Final scores recorded.`);
      return;
    }

    // Lead next trick automatically until Player 0's turn
    const nextTrick: Array<{ player: number; card: Card }> = [];
    if (winner !== 0) {
      let curP = winner;
      while (curP !== 0) {
        const choice =
          updated[curP].find((c) =>
            isLegalHeartsPlay({
              card: c,
              hand: updated[curP],
              trick: nextTrick,
              heartsBroken: hb,
              isFirstTrick: false,
            }).legal
          ) ?? updated[curP][0];
        updated[curP] = updated[curP].filter((c) => c.id !== choice.id);
        if (choice.suit === 'hearts') hb = true;
        nextTrick.push({ player: curP, card: choice });
        curP = (curP + 1) % 4;
      }
    }

    setHands(updated);
    setTrick(nextTrick);
    setNotice(`${names[winner]} took the trick (+${pts} pts). Your turn!`);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#007b3b] text-white text-[11px] select-none">
      <div className="bg-[#ece9d8] text-black px-2 py-1 border-b border-[#aca899] flex items-center justify-between gap-2">
        <div className="flex gap-3">
          {names.map((n, i) => (
            <span key={n} className="font-bold">
              {n}: {scores[i]}
            </span>
          ))}
        </div>
        <button type="button" onClick={startNewRound} className="xp-button">
          New Round
        </button>
      </div>

      <div className="flex-1 min-h-0 p-3 flex flex-col justify-between items-center">
        <div className="bg-black/25 px-3 py-1 rounded-[2px]">{notice}</div>

        {/* Center Trick */}
        <div className="flex items-center gap-4 my-2">
          {trick.map((t) => (
            <div key={t.player} className="flex flex-col items-center gap-1">
              <span className="text-[10px]">{names[t.player]}</span>
              <CardChip card={t.card} />
            </div>
          ))}
        </div>

        {/* Pass button */}
        {phase === 'passing' && (
          <button
            type="button"
            disabled={passSelection.length !== 3}
            onClick={confirmPass}
            className="xp-button xp-button-default text-black"
          >
            Pass 3 Cards Left ({passSelection.length}/3)
          </button>
        )}

        {/* Player Hand */}
        <div className="flex flex-wrap justify-center gap-1">
          {hands[0].map((card) => (
            <CardChip
              key={card.id}
              card={card}
              selected={passSelection.includes(card.id)}
              onClick={() => {
                if (phase === 'passing') {
                  setPassSelection((prev) =>
                    prev.includes(card.id)
                      ? prev.filter((id) => id !== card.id)
                      : prev.length < 3
                      ? [...prev, card.id]
                      : prev
                  );
                } else {
                  playCard(card);
                }
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
