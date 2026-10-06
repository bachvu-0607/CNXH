import React from 'react';
import { Player } from '../types/game';
import { BOARD_SQUARES } from '../questions/boardData';
import { Compass, Flag, Crown, Users, Lightbulb } from 'lucide-react';

interface PlayerSidebarProps {
  players: Player[];
  currentPlayerIndex: number;
  hostId: string;
  hostName?: string;
  myPlayerId: string;
}

export const PlayerSidebar: React.FC<PlayerSidebarProps> = ({
  players,
  currentPlayerIndex,
  hostId,
  hostName,
  myPlayerId,
}) => {
  const isMeHost = hostId === myPlayerId;

  const getSquareName = (pos: number) => {
    const sq = BOARD_SQUARES.find((s) => s.id === pos);
    return sq ? sq.name : `Ô ${pos}`;
  };

  return (
    <div className="flex flex-col gap-3 w-full bg-white rounded-2xl p-4 border border-slate-200 shadow-md">
      
      {/* Pinned Top Section: Host / Quản trò info */}
      <div className="p-3 rounded-xl bg-slate-900 text-white flex items-center justify-between shadow-sm border border-slate-700">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black text-sm shadow">
            <Crown className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                QUẢN TRÒ (HOST)
              </span>
              {isMeHost && (
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-200 border border-amber-400/30">
                  Bạn
                </span>
              )}
            </div>
            <p className="text-xs font-extrabold text-slate-100 truncate max-w-[150px]">
              {hostName || 'Thầy/Cô Quản Trò'}
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
          Trọng tài
        </span>
      </div>

      {/* Header for Players list */}
      <div className="flex items-center justify-between pt-1 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-1.5">
          <Users className="w-4 h-4 text-indigo-600" />
          <h2 className="font-extrabold text-xs sm:text-sm text-slate-900 uppercase tracking-wide">
            CÁC ĐỘI THI ĐẤU
          </h2>
        </div>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
          {players.length}/4 đội
        </span>
      </div>

      {/* Players List */}
      <div className="space-y-2">
        {players.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center text-xs text-slate-500 font-semibold">
            Đang chờ các đội/học sinh tham gia phòng...
          </div>
        ) : (
          players.map((player, idx) => {
            const isCurrentTurn = idx === currentPlayerIndex;
            const isMe = player.id === myPlayerId;
            const hintsRemaining = player.hintsRemaining ?? 2;

            return (
              <div
                key={player.id}
                style={{
                  borderColor: isCurrentTurn ? player.color : undefined,
                }}
                className={`relative rounded-xl p-2.5 transition-all duration-200 border-2 ${
                  isCurrentTurn
                    ? 'bg-slate-50/95 shadow-sm ring-2 ring-indigo-500/30'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Active Turn Badge */}
                {isCurrentTurn && (
                  <div
                    style={{ backgroundColor: player.color }}
                    className="absolute -top-2 right-2.5 text-white text-[9px] font-black px-2 py-0.2 rounded-full shadow-xs flex items-center gap-1 uppercase tracking-wider"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    Đang có lượt
                  </div>
                )}

                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      style={{ backgroundColor: player.color }}
                      className="relative w-8 h-8 rounded-full border-2 border-white shadow-xs flex items-center justify-center text-white font-black text-xs shrink-0"
                    >
                      {player.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-extrabold text-slate-900 truncate">
                          {player.name}
                        </p>
                        {isMe && (
                          <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700">
                            Bạn
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold mt-0.5">
                        <Compass className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[130px]" title={getSquareName(player.position)}>
                          {player.position === 1 ? 'BẮT ĐẦU' : `Ô ${player.position}: ${getSquareName(player.position)}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-900 font-black text-xs border border-slate-200">
                      Ô {player.position}/24
                    </div>

                    {/* Hints remaining quota */}
                    <div
                      className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded ${
                        hintsRemaining > 0
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                      title={`Lượt gợi ý còn lại: ${hintsRemaining}/2`}
                    >
                      <Lightbulb className="w-2.5 h-2.5 text-amber-600" />
                      {hintsRemaining}/2 gợi ý
                    </div>

                    {player.completedLap && (
                      <div className="flex items-center justify-end gap-0.5 text-[9px] font-extrabold text-emerald-600">
                        <Flag className="w-2.5 h-2.5" /> Hoàn thành 1 vòng
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Classroom Guide footer */}
      <div className="mt-1 pt-2 border-t border-slate-100 text-[10px] text-slate-500 text-center font-medium leading-relaxed">
        🏁 Người đầu tiên hoàn thành 1 vòng và vượt/về ô BẮT ĐẦU sẽ chiến thắng ngay lập tức!
      </div>
    </div>
  );
};
