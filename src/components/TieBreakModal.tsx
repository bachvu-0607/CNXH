import React, { useState } from 'react';
import { Player } from '../types/game';
import { Award, ShieldAlert, Check, Eye, EyeOff } from 'lucide-react';
import { sounds } from '../utils/audio';

interface TieBreakModalProps {
  tieBreakQuestion: {
    text: string;
    answer: string;
    tiedPlayerIds: string[];
  };
  players: Player[];
  isHost: boolean;
  onSelectWinner: (winnerId: string) => void;
}

export const TieBreakModal: React.FC<TieBreakModalProps> = ({
  tieBreakQuestion,
  players,
  isHost,
  onSelectWinner,
}) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const tiedPlayers = players.filter((p) =>
    tieBreakQuestion.tiedPlayerIds.includes(p.id)
  );

  const handlePickWinner = (winnerId: string) => {
    sounds.playVictory();
    onSelectWinner(winnerId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border-4 border-amber-500 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 via-amber-600 to-red-700 p-5 text-white text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400 text-red-950 rounded-full text-xs font-black uppercase mb-1">
            <ShieldAlert className="w-3.5 h-3.5" /> Điểm số ngang bằng
          </div>
          <h2 className="font-['Playfair_Display',serif] text-2xl font-black">
            CÂU HỎI PHỤ PHÂN THẮNG BẠI
          </h2>
          <p className="text-xs text-amber-100 mt-0.5">
            Các người chơi cao điểm nhất sẽ cùng trả lời câu hỏi phụ để quyết định ngôi vị quán quân!
          </p>
        </div>

        {/* Question & Answer Content */}
        <div className="p-6 space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-200">
            <p className="text-xs font-bold text-amber-900 uppercase mb-1">Câu hỏi phụ:</p>
            <p className="text-base font-extrabold text-slate-900">{tieBreakQuestion.text}</p>
          </div>

          {isHost && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-emerald-800 uppercase">
                  Đáp án chuẩn dành cho Host:
                </p>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setShowAnswer(!showAnswer);
                  }}
                  className="px-2 py-0.5 rounded bg-emerald-200 hover:bg-emerald-300 text-emerald-950 text-xs font-bold flex items-center gap-1"
                >
                  {showAnswer ? <><EyeOff className="w-3.5 h-3.5" /> Ẩn</> : <><Eye className="w-3.5 h-3.5" /> 👁️ Xem đáp án</>}
                </button>
              </div>

              {showAnswer ? (
                <p className="text-sm font-black text-emerald-950">{tieBreakQuestion.answer}</p>
              ) : (
                <p className="text-xs italic text-slate-500">(Bấm xem đáp án khi cần kiểm tra)</p>
              )}
            </div>
          )}

          {/* Tied Players list */}
          <div className="space-y-2 pt-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Người chơi tham gia phân thắng bại:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tiedPlayers.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 rounded-xl border-2 border-slate-200 bg-slate-50"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      style={{ backgroundColor: player.color }}
                      className="w-8 h-8 rounded-full text-white font-black text-xs flex items-center justify-center shadow"
                    >
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-slate-900">{player.name}</p>
                      <p className="text-xs text-slate-500 font-bold">⭐ {player.score} điểm</p>
                    </div>
                  </div>

                  {isHost && (
                    <button
                      onClick={() => handlePickWinner(player.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1 shadow cursor-pointer transition-all active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5" /> Chọn thắng
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {!isHost && (
            <div className="p-3 rounded-xl bg-slate-100 text-center text-xs font-bold text-slate-600">
              ⏳ Đang chờ các bên trả lời và Host chọn người thắng cuộc...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
