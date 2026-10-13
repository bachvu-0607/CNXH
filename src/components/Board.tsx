import React from 'react';
import { Player } from '../types/game';
import { BOARD_SQUARES } from '../questions/boardData';

interface BoardProps {
  players: Player[];
  currentPlayerIndex: number;
  animatingPlayerId?: string | null;
  animatedPosition?: number | null;
  onSquareClick?: (squareId: number) => void;
  selectedSquareId?: number | null;
}

type SquareBounds = { left: number; top: number; width: number; height: number };

// Each hit area follows the printed square in the supplied board artwork.
const SQUARE_BOUNDS: Record<number, SquareBounds> = {
  1: { left: 2.2, top: 83.1, width: 14.9, height: 14.7 },
  2: { left: 2.2, top: 70.2, width: 14.9, height: 12.8 },
  3: { left: 2.2, top: 57.2, width: 14.9, height: 12.8 },
  4: { left: 2.2, top: 44.4, width: 14.9, height: 12.7 },
  5: { left: 2.2, top: 31.5, width: 14.9, height: 12.8 },
  6: { left: 2.2, top: 16.6, width: 14.9, height: 14.7 },
  7: { left: 2.2, top: 1.7, width: 15, height: 14.7 },
  8: { left: 17.3, top: 1.7, width: 9.9, height: 14.7 },
  9: { left: 27.3, top: 1.7, width: 10.8, height: 14.7 },
  10: { left: 38.2, top: 1.7, width: 11, height: 14.7 },
  11: { left: 49.3, top: 1.7, width: 12.5, height: 14.7 },
  12: { left: 62, top: 1.7, width: 10.1, height: 14.7 },
  13: { left: 72.9, top: 1.7, width: 11.6, height: 14.7 },
  14: { left: 84.6, top: 1.7, width: 13.1, height: 14.7 },
  15: { left: 84.7, top: 16.5, width: 13, height: 14.2 },
  16: { left: 84.7, top: 30.9, width: 13, height: 14.3 },
  17: { left: 84.7, top: 45.3, width: 13, height: 14.9 },
  18: { left: 84.7, top: 60.4, width: 13, height: 12.2 },
  19: { left: 84.7, top: 72.7, width: 13, height: 10.3 },
  20: { left: 82.2, top: 83.4, width: 15.6, height: 14.4 },
  21: { left: 64.6, top: 83.4, width: 17.5, height: 14.4 },
  22: { left: 47, top: 83.4, width: 17.5, height: 14.4 },
  23: { left: 33.9, top: 83.4, width: 13, height: 14.4 },
  24: { left: 17.3, top: 83.4, width: 16.5, height: 14.4 },
};

export const Board: React.FC<BoardProps> = ({
  players,
  currentPlayerIndex,
  animatingPlayerId,
  animatedPosition,
  onSquareClick,
  selectedSquareId,
}) => {
  const getPlayersOnSquare = (squareId: number) => players.filter(player => {
    if (animatingPlayerId && player.id === animatingPlayerId && animatedPosition != null) {
      return animatedPosition === squareId;
    }
    return player.position === squareId;
  });
  const activePlayer = players[currentPlayerIndex];

  return (
    <div className="relative mx-auto aspect-[990/664] w-full max-w-[1000px] select-none overflow-hidden rounded-xl shadow-lg">
      <img
        src="/game-board.jpg"
        alt="Bàn cờ Hành Trình Làm Chủ gồm 24 ô"
        draggable={false}
        className="absolute inset-0 h-full w-full pointer-events-none"
      />
      {BOARD_SQUARES.map(square => {
        const bounds = SQUARE_BOUNDS[square.id];
        const playersHere = getPlayersOnSquare(square.id);
        const isSelected = selectedSquareId === square.id;
        return (
          <button
            key={square.id}
            type="button"
            aria-label={`Ô ${square.id}: ${square.name}`}
            aria-pressed={isSelected}
            onClick={() => onSquareClick?.(square.id)}
            style={{
              left: `${bounds.left}%`,
              top: `${bounds.top}%`,
              width: `${bounds.width}%`,
              height: `${bounds.height}%`,
            }}
            className={`absolute cursor-pointer touch-manipulation border-2 transition-colors ${
              isSelected
                ? 'border-emerald-500 bg-emerald-400/20 shadow-[inset_0_0_0_2px_white]'
                : 'border-transparent hover:border-emerald-400/80 hover:bg-emerald-300/15'
            }`}
          >
            {playersHere.length > 0 && (
              <span className="absolute inset-x-0 bottom-[4%] flex items-center justify-center -space-x-1 overflow-visible">
                {playersHere.map((player, index) => {
                  const isActive = activePlayer?.id === player.id;
                  return (
                    <span
                      key={player.id}
                      title={`${player.name} (Ô ${player.position})`}
                      style={{
                        backgroundColor: player.color,
                        zIndex: isActive ? 20 : 10 - index,
                      }}
                      className={`relative flex h-[clamp(12px,2vw,22px)] w-[clamp(12px,2vw,22px)] shrink-0 items-center justify-center rounded-full border border-white text-[clamp(7px,0.8vw,10px)] font-black text-white shadow ${
                        isActive ? 'ring-2 ring-emerald-300' : ''
                      }`}
                    >
                      {player.name.charAt(0).toUpperCase()}
                    </span>
                  );
                })}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
