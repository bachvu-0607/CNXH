import React from 'react';
import { Player } from '../types/game';
import { BOARD_SQUARES, CATEGORY_CONFIG } from '../questions/boardData';
import { Compass, BookOpen, Scale, Award, Heart, Shield } from 'lucide-react';

interface BoardProps {
  players: Player[];
  currentPlayerIndex: number;
  animatingPlayerId?: string | null;
  animatedPosition?: number | null;
  onSquareClick?: (squareId: number) => void;
  selectedSquareId?: number | null;
}

export function getGridPosition(squareId: number): { row: number; col: number } {
  if (squareId >= 1 && squareId <= 7) {
    return { row: 6, col: squareId - 1 };
  } else if (squareId >= 8 && squareId <= 13) {
    return { row: 6 - (squareId - 7), col: 6 };
  } else if (squareId >= 14 && squareId <= 19) {
    return { row: 0, col: 6 - (squareId - 13) };
  } else if (squareId >= 20 && squareId <= 24) {
    return { row: squareId - 19, col: 0 };
  }
  return { row: 6, col: 0 };
}

function getSquareIcon(category: string, id: number) {
  if (id === 1) return <Compass className="w-3.5 h-3.5 text-amber-500" />;
  switch (category) {
    case 'politics':
      return <Shield className="w-3 h-3 text-rose-500" />;
    case 'economy':
      return <Award className="w-3 h-3 text-amber-500" />;
    case 'culture_society':
      return <Heart className="w-3 h-3 text-sky-500" />;
    case 'law':
      return <Scale className="w-3 h-3 text-emerald-600" />;
    case 'knowledge':
    default:
      return <BookOpen className="w-3 h-3 text-emerald-700" />;
  }
}

export const Board: React.FC<BoardProps> = ({
  players,
  currentPlayerIndex,
  animatingPlayerId,
  animatedPosition,
  onSquareClick,
  selectedSquareId,
}) => {
  const getPlayersOnSquare = (squareId: number) => {
    return players.filter((p) => {
      if (animatingPlayerId && p.id === animatingPlayerId && animatedPosition !== null) {
        return animatedPosition === squareId;
      }
      return p.position === squareId;
    });
  };

  const activePlayer = players[currentPlayerIndex];

  return (
    <div className="relative w-full max-w-[820px] aspect-square mx-auto p-1.5 select-none">
      {/* Khung bàn cờ màu xanh lá rêu trang nhã, viền bo tròn nhẹ */}
      <div className="relative w-full h-full rounded-2xl sm:rounded-3xl p-2 sm:p-2.5 bg-[#1b3b27] border-4 border-[#142d1e] shadow-lg grid grid-cols-7 grid-rows-7 gap-1 sm:gap-1.5">
        
        {/* 24 ô quanh chu vi */}
        {BOARD_SQUARES.map((square) => {
          const { row, col } = getGridPosition(square.id);
          const config = CATEGORY_CONFIG[square.category] || CATEGORY_CONFIG.knowledge;
          const playersHere = getPlayersOnSquare(square.id);
          const isSelected = selectedSquareId === square.id;
          const isStart = square.id === 1;

          return (
            <div
              key={square.id}
              onClick={() => onSquareClick?.(square.id)}
              style={{
                gridRowStart: row + 1,
                gridColumnStart: col + 1,
              }}
              className={`relative rounded-xl p-1 sm:p-1.5 flex flex-col justify-between transition-all duration-200 cursor-pointer overflow-hidden border ${
                isStart
                  ? 'bg-amber-50/95 border-amber-300'
                  : 'bg-white/95 hover:bg-white ' + config.borderClass
              } ${isSelected ? 'ring-2 ring-emerald-500 scale-[1.03] z-20 shadow-md' : 'hover:scale-[1.01]'}`}
            >
              {/* Header ô */}
              <div className="flex items-center justify-between w-full">
                <span
                  className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded ${
                    isStart ? 'bg-amber-200 text-amber-900' : 'bg-stone-100 text-stone-700'
                  }`}
                >
                  {isStart ? 'BẮT ĐẦU' : `Ô ${square.id}`}
                </span>
                <span className="opacity-80">{getSquareIcon(square.category, square.id)}</span>
              </div>

              {/* Tên ô ngắn gọn */}
              <div className="my-auto py-0.5 text-center">
                <p className="text-[9px] sm:text-[10px] font-semibold text-stone-800 leading-tight line-clamp-2">
                  {square.name}
                </p>
              </div>

              {/* Quân cờ của người chơi */}
              <div className="h-4 sm:h-5 flex items-center justify-center gap-1">
                {playersHere.map((p, pIdx) => {
                  const isActive = activePlayer?.id === p.id;
                  return (
                    <div
                      key={p.id}
                      title={`${p.name} (Ô ${p.position})`}
                      style={{
                        backgroundColor: p.color,
                        transform: `translate(${pIdx * 2}px, 0)`,
                      }}
                      className={`relative w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-white shadow-xs flex items-center justify-center text-[9px] sm:text-[10px] text-white font-bold transition-transform ${
                        isActive ? 'ring-2 ring-emerald-400 animate-bounce' : ''
                      }`}
                    >
                      <span>{p.name.charAt(0).toUpperCase()}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Trung tâm bàn cờ - Thiết kế tối giản, dịu mắt */}
        <div className="col-start-2 col-end-7 row-start-2 row-end-7 rounded-xl sm:rounded-2xl bg-[#f4f7f4] p-3 sm:p-5 flex flex-col justify-between items-center text-center relative overflow-hidden border border-emerald-100 shadow-inner">
          
          {/* Header trung tâm */}
          <div className="relative z-10 w-full pt-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100/70 text-emerald-800 text-[10px] font-medium tracking-wide mb-1">
              <Compass className="w-3 h-3 text-emerald-700" /> Hành Trình Làm Chủ
            </span>
            <h1 className="font-['Playfair_Display',serif] text-lg sm:text-2xl font-bold text-stone-900 leading-tight">
              Dân Là Chủ · Dân Làm Chủ
            </h1>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Chủ nghĩa xã hội khoa học · Chương 4
            </p>
          </div>

          {/* Tiêu điểm lượt chơi hiện tại */}
          <div className="relative z-10 w-full max-w-xs bg-white rounded-xl p-2.5 border border-emerald-100 shadow-xs">
            {activePlayer ? (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    style={{ backgroundColor: activePlayer.color }}
                    className="w-7 h-7 rounded-full text-white font-bold text-xs flex items-center justify-center shadow-xs"
                  >
                    {activePlayer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-stone-400 font-semibold uppercase">Lượt đi</p>
                    <p className="text-xs sm:text-sm font-bold text-stone-900 truncate max-w-[120px]">
                      {activePlayer.name}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-200">
                  Ô {activePlayer.position}/24
                </span>
              </div>
            ) : (
              <div className="text-xs text-stone-400 py-1 font-medium">
                Đang chờ người chơi...
              </div>
            )}
          </div>

          {/* Ghi chú tối giản về chủ đề */}
          <div className="relative z-10 flex items-center justify-center gap-3 text-[10px] text-stone-500 font-medium">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-400" /> Chính trị
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> Kinh tế
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-sky-400" /> Văn hóa - XH
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Pháp luật
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
