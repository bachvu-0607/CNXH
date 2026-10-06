import React from 'react';
import { Player, CategoryType } from '../types/game';
import { BOARD_SQUARES, CATEGORY_CONFIG } from '../questions/boardData';
import {
  Landmark,
  Scale,
  Vote,
  TrendingUp,
  Factory,
  GraduationCap,
  HeartHandshake,
  Sparkles,
  TreePine,
  ShieldCheck,
  UserCheck,
  FileSpreadsheet,
  Award,
  Compass,
  Zap,
} from 'lucide-react';

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
    return { row: 0, col: squareId - 1 };
  } else if (squareId >= 8 && squareId <= 13) {
    return { row: squareId - 7, col: 6 };
  } else if (squareId >= 14 && squareId <= 19) {
    return { row: 6, col: 19 - squareId };
  } else if (squareId >= 20 && squareId <= 24) {
    return { row: 25 - squareId, col: 0 };
  }
  return { row: 0, col: 0 };
}

function getSquareIcon(category: CategoryType, id: number) {
  if (id === 1) return <Compass className="w-4 h-4 text-amber-300" />;
  if (category === 'scenario') return <Zap className="w-3.5 h-3.5 text-purple-600" />;
  if (category === 'law') return <Scale className="w-3.5 h-3.5 text-emerald-600" />;
  if (category === 'politics') {
    if (id === 7) return <Vote className="w-3.5 h-3.5 text-rose-600" />;
    return <Landmark className="w-3.5 h-3.5 text-rose-600" />;
  }
  if (category === 'economy') {
    if (id === 9 || id === 22) return <Factory className="w-3.5 h-3.5 text-amber-600" />;
    return <TrendingUp className="w-3.5 h-3.5 text-amber-600" />;
  }
  if (category === 'knowledge') return <Sparkles className="w-3.5 h-3.5 text-orange-600" />;
  if (id === 11) return <GraduationCap className="w-3.5 h-3.5 text-sky-600" />;
  if (id === 17) return <HeartHandshake className="w-3.5 h-3.5 text-sky-600" />;
  if (id === 19) return <TreePine className="w-3.5 h-3.5 text-sky-600" />;
  if (id === 20) return <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />;
  if (id === 21) return <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />;
  if (id === 24) return <UserCheck className="w-3.5 h-3.5 text-sky-600" />;
  return <Award className="w-3.5 h-3.5 text-sky-600" />;
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

  return (
    <div className="relative w-full max-w-[850px] aspect-square mx-auto p-2 select-none">
      {/* Refined Academic Board Frame (Navy Slate & Crisp Platinum) */}
      <div className="relative w-full h-full rounded-2xl sm:rounded-3xl p-2 sm:p-2.5 bg-slate-900 border-4 sm:border-8 border-slate-800 shadow-2xl grid grid-cols-7 grid-rows-7 gap-1 sm:gap-1.5">
        
        {/* 24 Perimeter Squares */}
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
              className={`relative rounded-lg sm:rounded-xl p-1 sm:p-1.5 flex flex-col justify-between transition-all duration-200 cursor-pointer overflow-hidden border ${
                config.bgClass
              } ${isSelected ? 'ring-4 ring-indigo-500 scale-[1.03] z-20 shadow-md' : 'hover:scale-[1.015]'} ${
                isStart ? 'border-amber-400 font-bold' : config.borderClass
              }`}
            >
              {/* Header: Square Number & Icon */}
              <div className="flex items-center justify-between w-full">
                <span
                  className={`text-[9px] sm:text-[11px] font-black px-1.5 py-0.2 rounded shadow-xs flex items-center gap-1 ${
                    isStart ? 'bg-amber-400 text-slate-950' : 'bg-white/90 ' + config.textColor
                  }`}
                >
                  {isStart ? '⭐' : `Ô ${square.id}`}
                </span>
                <span className="opacity-90">{getSquareIcon(square.category, square.id)}</span>
              </div>

              {/* Square Title */}
              <div className="my-auto py-0.5">
                <p
                  className={`text-[9px] sm:text-[11px] font-bold leading-tight line-clamp-3 text-center ${
                    isStart ? 'text-amber-200 font-extrabold uppercase' : config.textColor
                  }`}
                >
                  {square.name}
                </p>
                {square.category === 'scenario' && (
                  <span className="block text-[8px] sm:text-[9px] text-center font-extrabold text-purple-700 mt-0.5">
                    +2 ĐIỂM
                  </span>
                )}
              </div>

              {/* Pawns Container */}
              <div className="h-5 sm:h-6 flex items-center justify-center gap-1">
                {playersHere.map((p, pIdx) => {
                  const isActive = players[currentPlayerIndex]?.id === p.id;
                  return (
                    <div
                      key={p.id}
                      title={`${p.name} (${p.score}đ)`}
                      style={{
                        backgroundColor: p.color,
                        transform: `translate(${pIdx * 2}px, 0)`,
                      }}
                      className={`relative w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-white shadow-md flex items-center justify-center text-[9px] sm:text-[10px] text-white font-black transition-transform ${
                        isActive ? 'ring-2 ring-amber-400 animate-bounce' : ''
                      }`}
                    >
                      <span className="drop-shadow">{p.name.charAt(0).toUpperCase()}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Center Canvas Area (5x5 grid cells: rows 2-6, cols 2-6) */}
        <div className="col-start-2 col-end-7 row-start-2 row-end-7 rounded-xl sm:rounded-2xl bg-gradient-to-br from-slate-50 via-white to-slate-100 p-3 sm:p-5 flex flex-col justify-between items-center text-center relative overflow-hidden border border-slate-300 shadow-inner">
          
          {/* Subtle Educational Emblem Watermark */}
          <div className="absolute inset-0 opacity-[0.035] pointer-events-none flex items-center justify-center">
            <svg viewBox="0 0 400 400" className="w-[110%] h-[110%] text-slate-900 fill-current">
              <circle cx="200" cy="200" r="180" stroke="currentColor" strokeWidth="6" fill="none" />
              <circle cx="200" cy="200" r="140" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="6 4" />
              <circle cx="200" cy="200" r="90" stroke="currentColor" strokeWidth="3" fill="none" />
              <polygon points="200,50 215,150 310,150 230,200 260,300 200,240 140,300 170,200 90,150 185,150" />
            </svg>
          </div>

          {/* Central Header Branding */}
          <div className="relative z-10 w-full pt-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-slate-900 text-slate-100 rounded-full text-[11px] font-bold uppercase tracking-wider mb-1 sm:mb-1.5 border border-slate-700">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              Board Game Giáo Dục Chính Trị
            </div>
            <h1 className="font-['Playfair_Display',serif] text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              HÀNH TRÌNH LÀM CHỦ
            </h1>
            <p className="text-xs sm:text-sm font-bold text-slate-600 tracking-wide mt-0.5">
              Dân là chủ – Dân làm chủ
            </p>
          </div>

          {/* Category Guide Legend */}
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 gap-1.5 w-full max-w-md my-1 text-[10px] sm:text-xs">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-rose-50 text-rose-900 border border-rose-200 font-semibold justify-center">
              <span className="w-2 h-2 rounded-full bg-rose-600"></span>
              Đỏ: Chính trị
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-50 text-amber-950 border border-amber-200 font-semibold justify-center">
              <span className="w-2 h-2 rounded-full bg-amber-600"></span>
              Vàng: Kinh tế
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-sky-50 text-sky-950 border border-sky-200 font-semibold justify-center">
              <span className="w-2 h-2 rounded-full bg-sky-600"></span>
              Xanh: Văn hóa-XH
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-50 text-emerald-950 border border-emerald-200 font-semibold justify-center">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              Lá: Pháp luật
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-orange-50 text-orange-950 border border-orange-200 font-semibold justify-center">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              Kem: Kiến thức
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-purple-50 text-purple-950 border border-purple-200 font-semibold justify-center">
              <span className="w-2 h-2 rounded-full bg-purple-600"></span>
              Tím: Tình huống (+2đ)
            </div>
          </div>

          {/* Active Turn Spotlight in Center */}
          <div className="relative z-10 w-full max-w-sm bg-white rounded-xl p-2 sm:p-2.5 border border-slate-200 shadow-sm">
            {players[currentPlayerIndex] ? (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    style={{ backgroundColor: players[currentPlayerIndex].color }}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white shadow flex items-center justify-center text-white font-black text-xs sm:text-sm"
                  >
                    {players[currentPlayerIndex].name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      Lượt thi đấu
                    </p>
                    <p className="text-xs sm:text-sm font-extrabold text-slate-900 truncate max-w-[140px]">
                      {players[currentPlayerIndex].name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-black px-2 py-0.5 rounded-lg bg-slate-100 text-slate-900 border border-slate-300">
                    ⭐ {players[currentPlayerIndex].score} điểm
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 font-bold py-1">Đang chờ các đội vào bàn cờ...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
