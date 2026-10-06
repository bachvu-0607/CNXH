import React, { useState, useEffect } from 'react';
import { sounds } from '../utils/audio';
import {
  Compass,
  Play,
  ChevronRight,
  Share2,
} from 'lucide-react';

interface HomeScreenProps {
  onCreateRoom: (hostName: string, hostIsPlayer?: boolean) => void;
  onJoinRoom: (roomCode: string, playerName: string) => void;
  isCreating: boolean;
  isJoining: boolean;
  errorMessage: string | null;
  initialRoomCode?: string | null;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onCreateRoom,
  onJoinRoom,
  isCreating,
  isJoining,
  errorMessage,
  initialRoomCode,
}) => {
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('boardgame_player_name') || '';
  });
  const [roomCode, setRoomCode] = useState(initialRoomCode || '');
  const [mode, setMode] = useState<'create' | 'join'>(initialRoomCode ? 'join' : 'create');

  useEffect(() => {
    if (initialRoomCode) {
      setRoomCode(initialRoomCode);
      setMode('join');
    }
  }, [initialRoomCode]);

  const handleNameChange = (val: string) => {
    setPlayerName(val);
    localStorage.setItem('boardgame_player_name', val);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    sounds.playClick();
    // Quản trò chỉ theo dõi, không tham gia thi đấu
    onCreateRoom(playerName.trim(), false);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !roomCode.trim()) return;
    sounds.playClick();
    onJoinRoom(roomCode.trim().toUpperCase(), playerName.trim());
  };

  return (
    <div className="min-h-screen bg-[#f4f7f4] text-stone-800 flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-emerald-100 p-6 sm:p-7 space-y-5">
        
        {/* Header - Xanh lá dịu nhẹ, thanh lịch */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-semibold text-xs border border-emerald-200/60">
            <Compass className="w-3.5 h-3.5 text-emerald-600" />
            <span>Hành Trình Làm Chủ</span>
          </div>
          
          <h1 className="font-['Playfair_Display',serif] text-2xl font-bold text-stone-900 tracking-tight">
            Dân Là Chủ · Dân Làm Chủ
          </h1>
          
          <p className="text-xs text-stone-500">
            Học phần Chủ nghĩa xã hội khoa học · Chương 4
          </p>
        </div>

        {/* Thông báo link mời nếu có */}
        {initialRoomCode && mode === 'join' && (
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
            <Share2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Đã nhận liên kết vào phòng <strong>{initialRoomCode}</strong></span>
          </div>
        )}

        {/* Thông báo lỗi thông thường */}
        {errorMessage && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium text-center">
            {errorMessage}
          </div>
        )}

        {/* Tabs chế độ */}
        <div className="grid grid-cols-2 p-1 bg-stone-100/70 rounded-xl border border-stone-200/50">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setMode('create');
            }}
            className={`py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'create'
                ? 'bg-white text-emerald-900 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-emerald-700" /> Quản trò tạo phòng
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setMode('join');
            }}
            className={`py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'join'
                ? 'bg-white text-emerald-900 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <ChevronRight className="w-3.5 h-3.5 text-emerald-700" /> Người chơi vào phòng
          </button>
        </div>

        {/* Form nhập liệu */}
        <div className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              {mode === 'create' ? 'Tên quản trò:' : 'Tên người chơi / Đội:'}
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder={mode === 'create' ? 'Ví dụ: Thầy/Cô Quản trò...' : 'Ví dụ: Đội 1...'}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-200 outline-none text-xs sm:text-sm font-medium text-stone-900 bg-white"
            />
          </div>

          {mode === 'create' ? (
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100 text-[11px] text-emerald-900">
                Quản trò tạo phòng để điều phối và quan sát trận đấu (không tham gia thi đấu).
              </div>

              <button
                type="submit"
                disabled={isCreating || !playerName.trim()}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm shadow-xs cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Tạo phòng bàn cờ
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoin} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Mã phòng:
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="MÃ PHÒNG (5 KÝ TỰ)"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-200 outline-none text-xs sm:text-sm font-bold tracking-widest uppercase text-center text-stone-900 bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={isJoining || !playerName.trim() || !roomCode.trim()}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm shadow-xs cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                {isJoining ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ChevronRight className="w-4 h-4" />
                    Vào phòng thi đấu
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
