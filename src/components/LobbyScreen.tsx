import React, { useState } from 'react';
import { RoomState } from '../types/game';
import { sounds } from '../utils/audio';
import { togglePlayerReady } from '../firebase/roomService';
import {
  Users,
  Copy,
  Check,
  Play,
  LogOut,
  Radio,
  Crown,
  Share2,
  Info,
  Link2,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface LobbyScreenProps {
  room: RoomState;
  myPlayerId: string;
  onStartGame: () => void;
  onLeaveRoom: () => void;
  isStarting: boolean;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  room,
  myPlayerId,
  onStartGame,
  onLeaveRoom,
  isStarting,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const isHost = room.hostId === myPlayerId;
  const myPlayer = room.players.find((p) => p.id === myPlayerId);
  const isMyPlayerReady = myPlayer?.isReady ?? false;

  const totalPlayers = room.players.length;
  const readyCount = room.players.filter((p) => p.isReady).length;
  const canStart = totalPlayers >= 1; // Host can start

  const handleCopyCode = () => {
    sounds.playClick();
    navigator.clipboard.writeText(room.roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    sounds.playClick();
    const url = `${window.location.origin}${window.location.pathname}?room=${room.roomCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleToggleReady = () => {
    sounds.playClick();
    togglePlayerReady(room.roomCode, myPlayerId);
  };

  const handleStart = () => {
    if (!isHost || !canStart) return;
    sounds.playClick();
    onStartGame();
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-black text-lg shadow-sm">
              🎲
            </div>
            <div>
              <h1 className="font-['Playfair_Display',serif] text-xl sm:text-2xl font-black text-slate-900">
                PHÒNG CHỜ BÀN CỜ
              </h1>
              <p className="text-xs text-slate-500 font-semibold">Hành Trình Làm Chủ</p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onLeaveRoom();
            }}
            className="px-3 py-1.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
            title="Rời phòng"
          >
            <LogOut className="w-4 h-4" /> Rời phòng
          </button>
        </div>

        {/* Room Code Card (Navy academic card) */}
        <div className="my-4 p-4 rounded-2xl bg-slate-900 text-white text-center shadow-md border border-slate-700">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
            MÃ PHÒNG THAM GIA
          </p>
          <div className="flex items-center justify-center gap-3">
            <span className="font-['Playfair_Display',serif] text-3xl sm:text-4xl font-black tracking-widest text-amber-300">
              {room.roomCode}
            </span>
            <button
              onClick={handleCopyCode}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-1 text-xs font-bold text-slate-200 border border-slate-700"
              title="Sao chép mã phòng"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copiedCode ? 'Đã chép' : 'Copy mã'}
            </button>
          </div>

          {/* Direct Link Share Button */}
          <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-center">
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Link2 className="w-3.5 h-3.5" />}
              {copiedLink ? 'Đã sao chép liên kết vào bộ nhớ tạm!' : '📋 Sao chép Link mời (Dán vào tab ẩn danh hoặc máy 2)'}
            </button>
          </div>
        </div>

        {/* Host Info Box */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-xs">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                QUẢN TRÒ (HOST) / TRỌNG TÀI
              </span>
              <p className="text-sm font-extrabold text-slate-900">
                {room.hostName || 'Thầy/Cô Quản Trò'} {isHost && '(Bạn)'}
              </p>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
            {room.hostIsPlayer ? 'Host cùng chơi' : 'Host chỉ điều phối'}
          </span>
        </div>

        {/* Teams / Players List */}
        <div className="space-y-2.5 mb-5">
          <div className="flex items-center justify-between text-xs font-black text-slate-700 uppercase">
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-600" /> CÁC ĐỘI ĐÃ VÀO PHÒNG ({room.players.length}/4)
            </span>
            <span className="flex items-center gap-1 text-slate-500 font-bold">
              {readyCount}/{totalPlayers} đội đã sẵn sàng
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {room.players.map((player) => {
              const isMe = player.id === myPlayerId;
              const isReady = player.isReady ?? false;

              return (
                <div
                  key={player.id}
                  style={{ borderColor: player.color }}
                  className="flex items-center justify-between p-3 rounded-xl bg-white border-2 shadow-xs transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      style={{ backgroundColor: player.color }}
                      className="w-8 h-8 rounded-full text-white font-black text-xs flex items-center justify-center border-2 border-white shadow shrink-0"
                    >
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                        {player.name} {isMe && '(Bạn)'}
                      </p>
                      <p className="text-[10px] font-bold text-slate-500">
                        Quân màu {player.colorName}
                      </p>
                    </div>
                  </div>

                  <div>
                    {isReady ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Sẵn sàng
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold border border-slate-200">
                        <Clock className="w-3 h-3 text-slate-400" /> Chờ
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Empty placeholders */}
            {Array.from({ length: Math.max(0, 4 - room.players.length) }).map((_, idx) => (
              <div
                key={idx}
                className="flex items-center justify-center p-3 rounded-xl border border-dashed border-slate-300 text-slate-400 text-xs font-semibold gap-1.5 bg-slate-50"
              >
                <span>➕ Đang đợi đội {room.players.length + idx + 1}...</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="space-y-3">
          {/* Non-host player Ready toggle */}
          {myPlayer && (
            <button
              onClick={handleToggleReady}
              className={`w-full py-3 px-6 rounded-xl font-black text-sm tracking-wide shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                isMyPlayerReady
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700'
              }`}
            >
              {isMyPlayerReady ? (
                <>
                  <CheckCircle2 className="w-4 h-4" /> BẠN ĐÃ SẴN SÀNG (Nhấn để hủy)
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" /> BẤM ĐỂ SẴN SÀNG THI ĐẤU
                </>
              )}
            </button>
          )}

          {/* Host Start Game Controls */}
          {isHost ? (
            <button
              onClick={handleStart}
              disabled={isStarting || !canStart}
              className={`w-full py-3.5 px-6 rounded-xl font-black text-sm sm:text-base tracking-wide shadow-md transition-all flex items-center justify-center gap-2 ${
                canStart
                  ? 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer border border-slate-700'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isStarting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Đang khởi tạo bàn cờ...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 text-amber-400 fill-current" />
                  BẮT ĐẦU TRÒ CHƠI (QUẢN TRÒ)
                </>
              )}
            </button>
          ) : (
            <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-center">
              <p className="text-xs sm:text-sm font-bold text-slate-700 flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                Chờ Quản trò ({room.hostName}) bấm Bắt đầu sau khi các đội sẵn sàng...
              </p>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
          <Info className="w-4 h-4 text-slate-400" />
          <span>Người chơi bấm Sẵn sàng → Quản trò bấm Bắt đầu trò chơi.</span>
        </div>
      </div>
    </div>
  );
};
