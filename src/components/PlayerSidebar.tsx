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
    <div className="flex flex-col gap-3 w-full bg-white rounded-2xl p-3.5 border border-emerald-100 shadow-xs">
      
      {/* Quản trò info (Quản trò chỉ xem & điều phối) */}
      <div className="px-3 py-2 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <Crown className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
          <span className="font-semibold text-emerald-950 truncate">
            {hostName || 'Quản trò'} {isMeHost && '(Bạn)'}
          </span>
        </div>
        <span className="text-[10px] text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200 shrink-0">
          Chỉ quan sát
        </span>
      </div>

      {/* Danh sách người chơi */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-stone-600 px-0.5">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-emerald-700" /> Người chơi ({players.length})
          </span>
        </div>

        {players.length === 0 ? (
          <div className="p-3 text-center text-xs text-stone-400 bg-stone-50 rounded-xl">
            Đang chờ người chơi vào phòng...
          </div>
        ) : (
          players.map((player, idx) => {
            const isCurrentTurn = idx === currentPlayerIndex;
            const isMe = player.id === myPlayerId;
            const hintsRemaining = player.hintsRemaining ?? 2;

            return (
              <div
                key={player.id}
                className={`relative rounded-xl p-2.5 transition-all border ${
                  isCurrentTurn
                    ? 'bg-emerald-50/40 border-emerald-400 shadow-2xs'
                    : 'bg-white border-stone-200/80'
                }`}
              >
                {/* Badge đang có lượt */}
                {isCurrentTurn && (
                  <div
                    style={{ backgroundColor: player.color }}
                    className="absolute -top-1.5 right-2 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-2xs"
                  >
                    Đang có lượt
                  </div>
                )}

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      style={{ backgroundColor: player.color }}
                      className="w-7 h-7 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0"
                    >
                      {player.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-xs font-bold text-stone-900 truncate">
                          {player.name}
                        </p>
                        {isMe && (
                          <span className="text-[9px] text-emerald-700 font-semibold">(Bạn)</span>
                        )}
                      </div>
                      <p className="text-[10px] text-stone-500 truncate" title={getSquareName(player.position)}>
                        {player.position === 1 ? 'Khởi hành' : `Ô ${player.position}: ${getSquareName(player.position)}`}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex flex-col items-end gap-0.5">
                    <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-stone-100 text-stone-800">
                      Ô {player.position}
                    </span>
                    <span className="text-[10px] text-stone-500 flex items-center gap-0.5">
                      <Lightbulb className="w-2.5 h-2.5 text-amber-500" /> {hintsRemaining} gợi ý
                    </span>
                    {player.completedLap && (
                      <span className="text-[9px] font-bold text-emerald-700 flex items-center gap-0.5">
                        <Flag className="w-2.5 h-2.5" /> 1 vòng
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
