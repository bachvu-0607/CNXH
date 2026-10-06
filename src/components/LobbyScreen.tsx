import React, { useState } from 'react';
import { RoomState } from '../types/game';
import { sounds } from '../utils/audio';
import { setPlayerReady } from '../firebase/roomService';
import {
  Users,
  Copy,
  Check,
  Play,
  LogOut,
  Crown,
  Link2,
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
  const [actionError, setActionError] = useState('');
  const [isSavingReady, setIsSavingReady] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const isHost = room.hostId === myPlayerId;
  const myPlayer = room.players.find((p) => p.id === myPlayerId);
  const isMyPlayerReady = myPlayer?.isReady ?? false;

  const totalPlayers = room.players.length;
  const canStart = isHost && totalPlayers >= 1;

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

  const handleToggleReady = async () => {
    if (isSavingReady) return;
    setIsSavingReady(true);
    setActionError('');
    try {
      const result = await setPlayerReady(room.roomCode, myPlayerId, !isMyPlayerReady);
      if (!result.success) setActionError(result.message || 'Không lưu được trạng thái.');
    } catch { setActionError('Mất kết nối. Vui lòng thử lại.'); }
    finally { setIsSavingReady(false); }
  };

  return (
    <div className="min-h-screen bg-[#f4f7f4] text-stone-800 flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-emerald-100 p-6 sm:p-7 space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-stone-200/60">
          <div>
            <h1 className="font-['Playfair_Display',serif] text-lg font-bold text-stone-900">
              Phòng Chờ Bàn Cờ
            </h1>
            <p className="text-xs text-stone-500">Hành Trình Làm Chủ</p>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onLeaveRoom();
            }}
            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            title="Rời phòng"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Mã phòng thi đấu */}
        <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-center space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800">
            Mã phòng thi đấu
          </p>
          <div className="flex items-center justify-center gap-2">
            <span className="font-['Playfair_Display',serif] text-2xl font-black tracking-widest text-emerald-950 font-mono">
              {room.roomCode}
            </span>
            <button
              onClick={handleCopyCode}
              className="p-1 bg-white hover:bg-emerald-100 rounded-md transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-semibold text-emerald-800 border border-emerald-200 shadow-2xs"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedCode ? 'Đã chép' : 'Chép mã'}
            </button>
          </div>

          <div className="pt-1.5 border-t border-emerald-200/60 flex items-center justify-center">
            <button
              onClick={handleCopyLink}
              className="text-xs font-medium text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer transition-colors"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Link2 className="w-3.5 h-3.5" />}
              {copiedLink ? 'Đã chép link vào bộ nhớ tạm' : 'Sao chép link mời người chơi'}
            </button>
          </div>
        </div>

        {/* Thông tin Quản trò */}
        <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <Crown className="w-3.5 h-3.5 text-emerald-700" />
            <span className="font-semibold text-stone-800">
              Quản trò: {room.hostName || 'Quản trò'} {isHost && '(Bạn)'}
            </span>
          </div>
          <span className="text-[10px] text-stone-500 bg-white px-2 py-0.5 rounded border border-stone-200">
            Chỉ theo dõi & điều phối
          </span>
        </div>

        {/* Danh sách người chơi */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-700">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-700" /> Danh sách người chơi ({room.players.length}/7)
            </span>
          </div>

          {room.players.length === 0 ? (
            <div className="p-4 text-center bg-stone-50 rounded-xl border border-dashed border-stone-200 text-xs text-stone-400">
              Chưa có người chơi nào vào phòng. Vui lòng chia sẻ mã phòng hoặc link mời.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-0.5">
              {room.players.map((player) => {
                const isMe = player.id === myPlayerId;
                const isReady = player.isReady ?? false;

                return (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-white border border-stone-200 shadow-2xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        style={{ backgroundColor: player.color }}
                        className="w-6 h-6 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0"
                      >
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-semibold text-stone-900 truncate">
                        {player.name} {isMe && '(Bạn)'}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.2 rounded ${
                        isReady ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-500'
                      }`}
                    >
                      {isReady ? 'Sẵn sàng' : 'Chờ'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {actionError && <p role="alert" className="text-xs text-rose-700">{actionError}</p>}
        {/* Khu vực hành động */}
        <div className="pt-1">
          {isHost ? (
            <button
              onClick={onStartGame}
              disabled={!canStart || isStarting}
              className={`w-full py-2.5 rounded-xl font-semibold text-xs sm:text-sm shadow-xs cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                canStart
                  ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              {isStarting ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Bắt đầu trò chơi ({room.players.length} người chơi)
                </>
              )}
            </button>
          ) : myPlayer ? (
            <button
              onClick={handleToggleReady}
              disabled={isSavingReady}
              className={`w-full py-2.5 rounded-xl font-semibold text-xs sm:text-sm shadow-xs cursor-pointer transition-all ${
                isMyPlayerReady
                  ? 'bg-stone-200 hover:bg-stone-300 text-stone-800'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white'
              }`}
            >
              {isMyPlayerReady ? 'Hủy sẵn sàng' : 'Tôi đã sẵn sàng!'}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
