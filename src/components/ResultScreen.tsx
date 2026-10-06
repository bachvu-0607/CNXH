import React, { useEffect } from 'react';
import { RoomState } from '../types/game';
import { sounds } from '../utils/audio';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Home, Sparkles, Medal } from 'lucide-react';

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
  const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);
  const winner = room.winner || sortedPlayers[0];

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
        colors: ['#0F172A', '#D97706', '#2563EB', '#059669'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#0F172A', '#D97706', '#2563EB', '#059669'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const getRankBadge = (index: number) => {
    if (index === 0)
      return (
        <span className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center shadow-xs text-base">
          🥇
        </span>
      );
    if (index === 1)
      return (
        <span className="w-8 h-8 rounded-full bg-slate-200 text-slate-800 font-black flex items-center justify-center shadow-xs text-base">
          🥈
        </span>
      );
    if (index === 2)
      return (
        <span className="w-8 h-8 rounded-full bg-amber-700 text-amber-100 font-black flex items-center justify-center shadow-xs text-base">
          🥉
        </span>
      );
    return (
      <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center border text-xs">
        #{index + 1}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8 relative overflow-hidden">
        
        {/* Academic Victory Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-slate-900 text-amber-300 rounded-full font-bold text-xs uppercase shadow-xs">
            <Sparkles className="w-3.5 h-3.5" /> KẾT THÚC VÁN ĐẤU
          </div>

          <h1 className="font-['Playfair_Display',serif] text-2xl sm:text-3xl font-black text-slate-900">
            KẾT QUẢ CHUNG CUỘC
          </h1>

          <p className="text-xs sm:text-sm font-semibold text-slate-500">
            Hành trình dân chủ đã hoàn thành xuất sắc!
          </p>
        </div>

        {/* Winner Card */}
        {winner && (
          <div className="p-5 rounded-2xl bg-slate-900 text-white text-center shadow-md border border-slate-700 mb-6 relative">
            <Trophy className="w-10 h-10 text-amber-400 mx-auto mb-2 drop-shadow animate-bounce" />
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
              👑 ĐỘI QUÁN QUÂN
            </span>
            <h2 className="font-['Playfair_Display',serif] text-2xl sm:text-3xl font-black text-white mt-0.5">
              {winner.name}
            </h2>
            <div className="inline-block px-3.5 py-1 rounded-full bg-slate-800 font-extrabold text-sm text-amber-300 mt-2 border border-slate-700">
              ⭐ Tổng điểm: {winner.score} điểm
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="space-y-2.5 mb-6">
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Medal className="w-4 h-4 text-amber-600" /> BẢNG XẾP HẠNG CÁC ĐỘI
          </h3>

          <div className="space-y-2">
            {sortedPlayers.map((player, idx) => (
              <div
                key={player.id}
                style={{ borderColor: idx === 0 ? player.color : undefined }}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  idx === 0
                    ? 'bg-slate-50 border-2 shadow-xs'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {getRankBadge(idx)}
                  <div
                    style={{ backgroundColor: player.color }}
                    className="w-8 h-8 rounded-full text-white font-black text-xs flex items-center justify-center shadow-xs"
                  >
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-extrabold text-slate-900">{player.name}</p>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {player.completedLap ? 'Đã hoàn thành vòng' : `Vị trí: Ô ${player.position}`}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs sm:text-sm font-black px-2.5 py-1 rounded-lg bg-slate-100 text-slate-900 border border-slate-200">
                    ⭐ {player.score} điểm
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {isHost ? (
            <button
              onClick={() => {
                sounds.playClick();
                onRestartGame();
              }}
              disabled={isRestarting}
              className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 border border-slate-700"
            >
              <RotateCcw className="w-4 h-4" />
              {isRestarting ? 'Đang khởi động...' : 'CHƠI LẠI VÁN MỚI'}
            </button>
          ) : (
            <div className="p-2.5 bg-slate-100 rounded-xl text-center text-xs font-bold text-slate-600 flex items-center justify-center">
              Đang chờ Quản trò bắt đầu ván mới...
            </div>
          )}

          <button
            onClick={() => {
              sounds.playClick();
              onGoHome();
            }}
            className="py-3 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <Home className="w-4 h-4" />
            VỀ TRANG CHỦ
          </button>
        </div>
      </div>
    </div>
  );
};
