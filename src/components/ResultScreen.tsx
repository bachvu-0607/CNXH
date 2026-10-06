import React, { useEffect } from 'react';
import { RoomState } from '../types/game';
import { sounds } from '../utils/audio';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Home, Sparkles, Medal, Flag } from 'lucide-react';

interface ResultScreenProps {
  room: RoomState;
  myPlayerId: string;
  onRestartGame: () => void;
  onGoHome: () => void;
  isRestarting: boolean;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  room,
  myPlayerId,
  onRestartGame,
  onGoHome,
  isRestarting,
}) => {
  const isHost = room.hostId === myPlayerId;
  const winner =
    room.winner ||
    room.players.find((p) => p.completedLap) ||
    room.players[0];

  const sortedPlayers = [...room.players].sort((a, b) => {
    if (a.id === winner?.id) return -1;
    if (b.id === winner?.id) return 1;
    if (a.completedLap && !b.completedLap) return -1;
    if (!a.completedLap && b.completedLap) return 1;
    return (b.position || 0) - (a.position || 0);
  });

  useEffect(() => {
    sounds.playVictory();
    const duration = 2.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#2e7d32', '#4caf50', '#81c784', '#d4af37'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#2e7d32', '#4caf50', '#81c784', '#d4af37'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const getRankBadge = (index: number) => {
    if (index === 0) return <span className="text-base">🥇</span>;
    if (index === 1) return <span className="text-base">🥈</span>;
    if (index === 2) return <span className="text-base">🥉</span>;
    return <span className="text-xs text-stone-500 font-bold">#{index + 1}</span>;
  };

  return (
    <div className="min-h-screen bg-[#f4f7f4] text-stone-800 flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-emerald-100 p-6 sm:p-7 relative overflow-hidden space-y-5">
        
        {/* Victory Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-semibold text-xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Kết thúc ván đấu
          </div>

          <h1 className="font-['Playfair_Display',serif] text-2xl font-bold text-stone-900">
            Chúc Mừng Người Chiến Thắng!
          </h1>
        </div>

        {/* Thẻ Quán Quân */}
        {winner && (
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-center space-y-1.5">
            <Trophy className="w-10 h-10 text-amber-500 mx-auto animate-bounce" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
              👑 Quán Quân
            </span>
            <h2 className="font-['Playfair_Display',serif] text-xl font-bold text-stone-900">
              {winner.name}
            </h2>
            <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-white text-emerald-800 text-xs font-semibold border border-emerald-200 shadow-2xs">
              <Flag className="w-3.5 h-3.5 text-emerald-600" /> Hoàn thành 1 vòng bàn cờ
            </div>
          </div>
        )}

        {/* Bảng xếp hạng */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-stone-600 flex items-center gap-1">
            <Medal className="w-3.5 h-3.5 text-emerald-700" /> Thứ hạng các đội
          </h3>

          <div className="space-y-1.5">
            {sortedPlayers.map((player, idx) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                  idx === 0
                    ? 'bg-emerald-50/40 border-emerald-300'
                    : 'bg-white border-stone-200/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-5 flex justify-center">{getRankBadge(idx)}</div>
                  <div
                    style={{ backgroundColor: player.color }}
                    className="w-7 h-7 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0"
                  >
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-stone-900">{player.name}</p>
                    <p className="text-[10px] text-stone-500">
                      {player.id === winner?.id
                        ? 'Đã hoàn thành 1 vòng'
                        : `Vị trí: Ô ${player.position}/24`}
                    </p>
                  </div>
                </div>

                <span className="font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-800">
                  Ô {player.position}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Nút điều khiển */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
          {isHost ? (
            <button
              onClick={() => {
                sounds.playClick();
                onRestartGame();
              }}
              disabled={isRestarting}
              className="py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs"
            >
              <RotateCcw className="w-4 h-4" />
              {isRestarting ? 'Đang khởi động...' : 'Chơi lại ván mới'}
            </button>
          ) : (
            <div className="p-2.5 bg-stone-50 rounded-xl text-center text-xs text-stone-500 flex items-center justify-center">
              Đang chờ Quản trò...
            </div>
          )}

          <button
            onClick={() => {
              sounds.playClick();
              onGoHome();
            }}
            className="py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all"
          >
            <Home className="w-4 h-4" />
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
};
