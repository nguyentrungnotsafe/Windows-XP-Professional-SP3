import React, { useEffect, useRef, useState } from 'react';
import type { AppId, SystemState } from '../types/os';
import {
  type MinesweeperBoard,
  type ReversiDisc,
  createMinesweeperBoard,
  createReversiBoard,
  getReversiFlips,
  revealMineCell,
  toggleMineFlag,
} from '../utils/games';
import { XpMenuBar, type XpMenuGroup } from '../components/xp/XpMenuBar';
import { HeartsApp } from './CardGamesApp';

// --- Minesweeper ---
interface MinesweeperAppProps {
  system: SystemState;
  onUpdateSystem: (updater: (prev: SystemState) => SystemState) => void;
}

export const MinesweeperApp: React.FC<MinesweeperAppProps> = ({
  system,
  onUpdateSystem,
}) => {
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'expert' | 'custom'>('beginner');
  const [board, setBoard] = useState<MinesweeperBoard>(() => createMinesweeperBoard(9, 9, 10));
  const [elapsedSec, setElapsedSec] = useState(0);
  const [customOpen, setCustomOpen] = useState(false);
  const [customRows, setCustomRows] = useState(12);
  const [customCols, setCustomCols] = useState(14);
  const [customMines, setCustomMines] = useState(25);

  useEffect(() => {
    if (board.status !== 'playing') return;
    const id = window.setInterval(() => {
      setElapsedSec((s) => Math.min(999, s + 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [board.status]);

  const restart = (
    diff: 'beginner' | 'intermediate' | 'expert' | 'custom' = difficulty,
    r = customRows,
    c = customCols,
    m = customMines
  ) => {
    setDifficulty(diff);
    setElapsedSec(0);
    if (diff === 'beginner') setBoard(createMinesweeperBoard(9, 9, 10));
    else if (diff === 'intermediate') setBoard(createMinesweeperBoard(16, 16, 40));
    else if (diff === 'expert') setBoard(createMinesweeperBoard(16, 30, 99));
    else setBoard(createMinesweeperBoard(r, c, m));
  };

  const handleCellClick = (r: number, c: number) => {
    const next = revealMineCell(board, r, c);
    setBoard(next);
    if (next.status === 'won' && board.status !== 'won' && difficulty !== 'custom') {
      const currentBest = system.gameStats.minesweeperBest[difficulty];
      if (currentBest === null || elapsedSec < currentBest) {
        onUpdateSystem((prev) => ({
          ...prev,
          gameStats: {
            ...prev.gameStats,
            minesweeperBest: { ...prev.gameStats.minesweeperBest, [difficulty]: elapsedSec },
          },
        }));
      }
    }
  };

  const formatLed = (val: number) => {
    const clamped = Math.max(-99, Math.min(999, val));
    if (clamped < 0) return `-${String(Math.abs(clamped)).padStart(2, '0')}`;
    return String(clamped).padStart(3, '0');
  };

  const numColor = (n: number) => {
    const colors = ['', '#0000ff', '#008000', '#ff0000', '#000080', '#800000', '#008080', '#000000', '#808080'];
    return colors[n] || '#000000';
  };

  const menuGroups: XpMenuGroup[] = [
    {
      id: 'game',
      label: 'Game',
      items: [
        { id: 'new', label: 'New', shortcut: 'F2', onSelect: () => restart(difficulty) },
        { id: 'beg', label: 'Beginner', checked: difficulty === 'beginner', separatorBefore: true, onSelect: () => restart('beginner') },
        { id: 'int', label: 'Intermediate', checked: difficulty === 'intermediate', onSelect: () => restart('intermediate') },
        { id: 'exp', label: 'Expert', checked: difficulty === 'expert', onSelect: () => restart('expert') },
        { id: 'cus', label: 'Custom...', checked: difficulty === 'custom', onSelect: () => setCustomOpen(true) },
      ],
    },
  ];

  const remainingMines = board.mines - board.flagsUsed;

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#c0c0c0] text-[11px] select-none">
      <XpMenuBar groups={menuGroups} />
      <div className="p-2 flex-1 min-h-0 flex flex-col gap-2 overflow-auto xp-scroll items-center">
        {/* LED Bar */}
        <div className="w-full max-w-[660px] bg-[#c0c0c0] border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white px-2 py-1.5 flex items-center justify-between">
          <div className="bg-black text-[#ff2222] font-mono text-[16px] font-bold px-1.5 py-0.5 tracking-widest">
            {formatLed(remainingMines)}
          </div>
          <button
            type="button"
            aria-label="Restart Minesweeper"
            onClick={() => restart(difficulty)}
            className="w-[28px] h-[28px] bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] text-[15px] flex items-center justify-center cursor-default"
          >
            {board.status === 'lost' ? '😵' : board.status === 'won' ? '😎' : '🙂'}
          </button>
          <div className="bg-black text-[#ff2222] font-mono text-[16px] font-bold px-1.5 py-0.5 tracking-widest">
            {formatLed(elapsedSec)}
          </div>
        </div>

        {/* Grid */}
        <div
          className="border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white inline-grid"
          style={{ gridTemplateColumns: `repeat(${board.cols}, 20px)` }}
        >
          {board.cells.flatMap((row) =>
            row.map((cell) => (
              <button
                key={`${cell.row}_${cell.col}`}
                type="button"
                aria-label={`Row ${cell.row + 1} Col ${cell.col + 1}`}
                onClick={() => handleCellClick(cell.row, cell.col)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setBoard((prev) => toggleMineFlag(prev, cell.row, cell.col));
                }}
                className={`w-[20px] h-[20px] text-[11px] font-bold flex items-center justify-center p-0 cursor-default ${
                  cell.revealed
                    ? 'bg-[#c0c0c0] border border-[#808080]'
                    : 'bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080]'
                }`}
                style={{ color: cell.revealed ? numColor(cell.adjacent) : '#000000' }}
              >
                {cell.revealed
                  ? cell.hasMine
                    ? '💣'
                    : cell.adjacent > 0
                    ? cell.adjacent
                    : ''
                  : cell.flagged
                  ? '🚩'
                  : cell.question
                  ? '?'
                  : ''}
              </button>
            ))
          )}
        </div>

        <div className="text-[10px] text-[#333333]">
          Right-click to flag mines. Best ({difficulty}):{' '}
          {difficulty !== 'custom' && system.gameStats.minesweeperBest[difficulty] !== null
            ? `${system.gameStats.minesweeperBest[difficulty]}s`
            : 'None'}
        </div>
      </div>

      {customOpen && (
        <div className="p-2 bg-[#ece9d8] border-t border-[#808080] flex items-center gap-2 flex-wrap">
          <label>R: <input type="number" value={customRows} onChange={(e) => setCustomRows(Number(e.target.value))} className="xp-input w-[44px]" /></label>
          <label>C: <input type="number" value={customCols} onChange={(e) => setCustomCols(Number(e.target.value))} className="xp-input w-[44px]" /></label>
          <label>Mines: <input type="number" value={customMines} onChange={(e) => setCustomMines(Number(e.target.value))} className="xp-input w-[48px]" /></label>
          <button type="button" onClick={() => { setCustomOpen(false); restart('custom'); }} className="xp-button xp-button-default">Apply</button>
          <button type="button" onClick={() => setCustomOpen(false)} className="xp-button">Cancel</button>
        </div>
      )}
    </div>
  );
};

// --- 3D Pinball Space Cadet (2D Physics Canvas Projection) ---
interface PinballAppProps {
  system: SystemState;
  onUpdateSystem: (updater: (prev: SystemState) => SystemState) => void;
}

export const PinballApp: React.FC<PinballAppProps> = ({ system, onUpdateSystem }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [ballsLeft, setBallsLeft] = useState(3);
  const [mission, setMission] = useState('Space Cadet Ready — Press Space to launch');
  const keysRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });
  const simRef = useRef({
    bx: 318,
    by: 340,
    vx: 0,
    vy: 0,
    inPlay: false,
    score: 0,
    balls: 3,
  });

  const launchBall = () => {
    const s = simRef.current;
    if (s.inPlay || s.balls <= 0) return;
    s.bx = 318;
    s.by = 340;
    s.vx = -2.6 - Math.random() * 1.4;
    s.vy = -10.5 - Math.random() * 1.5;
    s.inPlay = true;
    setMission('Mission Active: Hit Hyperspace Bumpers!');
  };

  const resetTable = () => {
    simRef.current = { bx: 318, by: 340, vx: 0, vy: 0, inPlay: false, score: 0, balls: 3 };
    setScore(0);
    setBallsLeft(3);
    setMission('Space Cadet Ready — Press Space to launch');
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        launchBall();
      } else if (e.key.toLowerCase() === 'z' || e.key === 'ArrowLeft') {
        keysRef.current.left = true;
      } else if (e.key === '/' || e.key === 'ArrowRight') {
        keysRef.current.right = true;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'z' || e.key === 'ArrowLeft') keysRef.current.left = false;
      if (e.key === '/' || e.key === 'ArrowRight') keysRef.current.right = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bumpers = [
      { x: 130, y: 120, r: 22, pts: 1500, color: '#ff5555' },
      { x: 210, y: 120, r: 22, pts: 1500, color: '#ffaa22' },
      { x: 170, y: 185, r: 20, pts: 2500, color: '#33ccff' },
    ];

    let rafId = 0;
    const step = () => {
      const s = simRef.current;
      if (s.inPlay) {
        s.vy += 0.16; // gravity
        s.bx += s.vx;
        s.by += s.vy;

        // Walls
        if (s.bx < 18) { s.bx = 18; s.vx = Math.abs(s.vx) * 0.85; }
        if (s.bx > 300) { s.bx = 300; s.vx = -Math.abs(s.vx) * 0.85; }
        if (s.by < 18) { s.by = 18; s.vy = Math.abs(s.vy) * 0.85; }

        // Bumpers
        for (const b of bumpers) {
          const dx = s.bx - b.x;
          const dy = s.by - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < b.r + 8) {
            const nx = dx / (dist || 1);
            const ny = dy / (dist || 1);
            s.bx = b.x + nx * (b.r + 9);
            s.by = b.y + ny * (b.r + 9);
            s.vx = nx * 6.5;
            s.vy = ny * 6.5;
            s.score += b.pts;
            setScore(s.score);
          }
        }

        // Flippers
        if (s.by > 328 && s.by < 354) {
          const leftHit = keysRef.current.left && s.bx >= 70 && s.bx <= 155;
          const rightHit = keysRef.current.right && s.bx >= 165 && s.bx <= 250;
          if (leftHit || rightHit) {
            s.vy = -8.8;
            s.vx += (s.bx - 160) * 0.04;
            s.score += 250;
            setScore(s.score);
          }
        }

        // Drain
        if (s.by > 382) {
          s.inPlay = false;
          s.balls -= 1;
          setBallsLeft(s.balls);
          if (s.balls <= 0) {
            setMission(`Game Over — Final Score: ${s.score}`);
            if (s.score > system.gameStats.pinballHighScore) {
              onUpdateSystem((prev) => ({
                ...prev,
                gameStats: { ...prev.gameStats, pinballHighScore: s.score },
              }));
            }
          } else {
            setMission('Ball drained — Press Space for next ball');
          }
        }
      }

      // Draw Table
      ctx.fillStyle = '#0b1026';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#3874ff';
      ctx.lineWidth = 3;
      ctx.strokeRect(10, 10, 320, 370);
      ctx.beginPath();
      ctx.moveTo(308, 70);
      ctx.lineTo(308, 380);
      ctx.stroke();

      // Bumpers
      for (const b of bumpers) {
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Flippers
      ctx.strokeStyle = '#f8d249';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(85, 342);
      ctx.lineTo(145, keysRef.current.left ? 324 : 352);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(235, 342);
      ctx.lineTo(175, keysRef.current.right ? 324 : 352);
      ctx.stroke();

      // Ball
      ctx.fillStyle = '#e5e7eb';
      ctx.beginPath();
      ctx.arc(s.bx, s.by, 7, 0, Math.PI * 2);
      ctx.fill();

      rafId = window.requestAnimationFrame(step);
    };

    rafId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(rafId);
  }, [system.gameStats.pinballHighScore, onUpdateSystem]);

  return (
    <div className="flex-1 min-h-0 flex bg-[#111827] text-white text-[11px] p-2 gap-3 select-none">
      <canvas
        ref={canvasRef}
        width={340}
        height={390}
        className="border border-[#4b5563] bg-[#0b1026] shrink-0"
      />
      <div className="flex-1 flex flex-col justify-between">
        <div className="flex flex-col gap-2">
          <div className="font-bold text-[14px] text-[#60a5fa]">3D Pinball - Space Cadet</div>
          <div className="bg-black border border-[#374151] p-2">
            <div className="text-[10px] text-[#9ca3af]">SCORE</div>
            <div className="text-[18px] font-mono text-[#34d399] font-bold">{score.toLocaleString()}</div>
          </div>
          <div className="bg-black border border-[#374151] p-2">
            <div>Balls Remaining: <strong>{ballsLeft}</strong></div>
            <div>High Score: <strong>{system.gameStats.pinballHighScore.toLocaleString()}</strong></div>
          </div>
          <div className="text-[#fde68a]">{mission}</div>
          <div className="text-[10px] text-[#d1d5db]">
            Controls: <strong>Space</strong> Launch, <strong>Z / ←</strong> Left Flipper, <strong>/ / →</strong> Right Flipper
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-1.5">
            <button
              type="button"
              onMouseDown={() => (keysRef.current.left = true)}
              onMouseUp={() => (keysRef.current.left = false)}
              className="xp-button text-black flex-1"
            >
              Left Flipper
            </button>
            <button
              type="button"
              onMouseDown={() => (keysRef.current.right = true)}
              onMouseUp={() => (keysRef.current.right = false)}
              className="xp-button text-black flex-1"
            >
              Right Flipper
            </button>
          </div>
          <button type="button" onClick={launchBall} className="xp-button xp-button-default text-black">
            Launch Ball (Space)
          </button>
          <button type="button" onClick={resetTable} className="xp-button text-black">
            New Game
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Zone.com Internet Board & Card Games (Local Computer Opponent Mode) ---
interface ZoneBoardGameAppProps {
  appId: AppId;
  system: SystemState;
  onUpdateSystem: (updater: (prev: SystemState) => SystemState) => void;
}

export const ZoneBoardGameApp: React.FC<ZoneBoardGameAppProps> = ({
  appId,
  system,
  onUpdateSystem,
}) => {
  const [connected, setConnected] = useState(false);

  // Reversi state
  const [revBoard, setRevBoard] = useState<ReversiDisc[][]>(() => createReversiBoard());
  const [revStatus, setRevStatus] = useState('Your turn (Black). Click a valid square to flip discs.');

  // Checkers state (8x8: 0 empty, 1 player, 2 AI)
  const [checkersBoard, setCheckersBoard] = useState<number[][]>(() => {
    const b = Array.from({ length: 8 }, () => Array(8).fill(0));
    for (let r = 0; r < 3; r++) for (let c = 0; c < 8; c++) if ((r + c) % 2 === 1) b[r][c] = 2;
    for (let r = 5; r < 8; r++) for (let c = 0; c < 8; c++) if ((r + c) % 2 === 1) b[r][c] = 1;
    return b;
  });
  const [selChecker, setSelChecker] = useState<[number, number] | null>(null);

  // Backgammon state
  const [dice, setDice] = useState<[number, number]>([3, 5]);
  const [bgPips, setBgPips] = useState<{ player: number; ai: number }>({ player: 167, ai: 167 });

  // Spades state
  const [spadesBid, setSpadesBid] = useState(3);
  const [spadesScore, setSpadesScore] = useState({ you: 0, ai: 0, round: 1 });

  const titleMap: Record<string, string> = {
    zone_backgammon: 'Internet Backgammon',
    zone_checkers: 'Internet Checkers',
    zone_hearts: 'Internet Hearts',
    zone_reversi: 'Internet Reversi',
    zone_spades: 'Internet Spades',
  };

  if (!connected) {
    return (
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center bg-[#f0f4fc] p-6 text-[11px] gap-3 text-center">
        <div className="font-bold text-[15px] text-[#0b3c8d]">
          MSN Gaming Zone — {titleMap[appId] ?? 'Internet Game'}
        </div>
        <p className="max-w-[340px] text-[#333333]">
          Online Zone.com matchmaking servers are simulated locally. Click below to start an immediate Local Computer Opponent match.
        </p>
        <button
          type="button"
          onClick={() => setConnected(true)}
          className="xp-button xp-button-default px-4"
        >
          Play Against Local Computer Opponent
        </button>
      </div>
    );
  }

  if (appId === 'zone_hearts') {
    return <HeartsApp system={system} onUpdateSystem={onUpdateSystem} />;
  }

  if (appId === 'zone_reversi') {
    const playReversi = (r: number, c: number) => {
      const flips = getReversiFlips(revBoard, r, c, 1);
      if (flips.length === 0) return;
      const next = revBoard.map((row) => [...row]);
      next[r][c] = 1;
      for (const [fr, fc] of flips) next[fr][fc] = 1;

      // AI move
      let aiMoved = false;
      for (let ar = 0; ar < 8 && !aiMoved; ar++) {
        for (let ac = 0; ac < 8 && !aiMoved; ac++) {
          const aiFlips = getReversiFlips(next, ar, ac, 2);
          if (aiFlips.length > 0) {
            next[ar][ac] = 2;
            for (const [fr, fc] of aiFlips) next[fr][fc] = 2;
            aiMoved = true;
          }
        }
      }
      setRevBoard(next);
      const counts = next.flat().reduce(
        (acc, v) => {
          if (v === 1) acc.b++;
          if (v === 2) acc.w++;
          return acc;
        },
        { b: 0, w: 0 }
      );
      setRevStatus(`Black (You): ${counts.b} | White (AI): ${counts.w}`);
    };

    return (
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center bg-[#0d6e3f] p-3 text-white text-[11px] gap-2">
        <div className="flex items-center gap-3">
          <span>{revStatus}</span>
          <button type="button" onClick={() => setRevBoard(createReversiBoard())} className="xp-button text-black">
            Restart
          </button>
        </div>
        <div className="grid grid-cols-8 border-2 border-black bg-[#178a52]">
          {revBoard.flatMap((row, r) =>
            row.map((cell, c) => (
              <button
                key={`${r}_${c}`}
                type="button"
                aria-label={`Reversi ${r},${c}`}
                onClick={() => playReversi(r, c)}
                className="w-[34px] h-[34px] border border-[#0b4729] flex items-center justify-center cursor-default"
              >
                {cell !== 0 && (
                  <span
                    className={`w-[24px] h-[24px] rounded-full border border-black ${
                      cell === 1 ? 'bg-[#111111]' : 'bg-[#f8fafc]'
                    }`}
                  />
                )}
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  if (appId === 'zone_checkers') {
    const clickCell = (r: number, c: number) => {
      if (checkersBoard[r][c] === 1) {
        setSelChecker([r, c]);
        return;
      }
      if (selChecker && checkersBoard[r][c] === 0 && (r + c) % 2 === 1) {
        const [sr, sc] = selChecker;
        const dr = r - sr;
        const dc = Math.abs(c - sc);
        if (dr === -1 && dc === 1) {
          const next = checkersBoard.map((row) => [...row]);
          next[sr][sc] = 0;
          next[r][c] = 1;
          setCheckersBoard(next);
          setSelChecker(null);
        }
      }
    };

    return (
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center bg-[#ece9d8] p-3 text-[11px] gap-2">
        <div>Internet Checkers (Red = You, Black = AI). Click a red piece, then a dark diagonal square ahead.</div>
        <div className="grid grid-cols-8 border-2 border-[#444]">
          {checkersBoard.flatMap((row, r) =>
            row.map((val, c) => (
              <button
                key={`${r}_${c}`}
                type="button"
                onClick={() => clickCell(r, c)}
                className={`w-[34px] h-[34px] flex items-center justify-center ${
                  (r + c) % 2 === 1 ? 'bg-[#5c4033]' : 'bg-[#f3e5ab]'
                } ${selChecker?.[0] === r && selChecker?.[1] === c ? 'ring-2 ring-yellow-300' : ''}`}
              >
                {val !== 0 && (
                  <span
                    className={`w-[24px] h-[24px] rounded-full border border-black ${
                      val === 1 ? 'bg-[#dc2626]' : 'bg-[#1f2937]'
                    }`}
                  />
                )}
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  if (appId === 'zone_backgammon') {
    const roll = () => {
      const d1 = 1 + Math.floor(Math.random() * 6);
      const d2 = 1 + Math.floor(Math.random() * 6);
      setDice([d1, d2]);
      const aiMove = 2 + Math.floor(Math.random() * 10);
      setBgPips((p) => ({
        player: Math.max(0, p.player - (d1 + d2)),
        ai: Math.max(0, p.ai - aiMove),
      }));
    };
    return (
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center bg-[#5e3a1e] text-white p-4 text-[11px] gap-3">
        <div className="text-[14px] font-bold">Internet Backgammon — Local Match</div>
        <div>Dice: [{dice[0]}] [{dice[1]}]</div>
        <div>Your Pip Count Remaining: {bgPips.player} | AI Pip Count: {bgPips.ai}</div>
        <div className="flex gap-2">
          <button type="button" onClick={roll} className="xp-button xp-button-default text-black">
            Roll &amp; Advance Checkers
          </button>
          <button
            type="button"
            onClick={() => setBgPips({ player: 167, ai: 167 })}
            className="xp-button text-black"
          >
            New Match
          </button>
        </div>
      </div>
    );
  }

  // zone_spades
  return (
    <div className="flex-1 min-h-0 flex flex-col items-center justify-center bg-[#0a5c36] text-white p-4 text-[11px] gap-3">
      <div className="text-[14px] font-bold">Internet Spades — Local Table (Round {spadesScore.round})</div>
      <div>You &amp; Partner: {spadesScore.you} pts | Opponents: {spadesScore.ai} pts</div>
      <div className="flex items-center gap-2">
        <label>Your Bid: <input type="number" min={1} max={13} value={spadesBid} onChange={(e) => setSpadesBid(Number(e.target.value))} className="xp-input text-black w-[50px]" /></label>
        <button
          type="button"
          onClick={() =>
            setSpadesScore((s) => ({
              you: s.you + spadesBid * 10,
              ai: s.ai + 30,
              round: s.round + 1,
            }))
          }
          className="xp-button xp-button-default text-black"
        >
          Play Hand
        </button>
      </div>
    </div>
  );
};
