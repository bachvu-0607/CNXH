import React, { useState } from 'react';
import { sounds } from '../utils/audio';
import {
  Compass,
  Play,
  Users,
  BookOpen,
  Sparkles,
  ChevronRight,
  Crown,
  Gamepad2,
} from 'lucide-react';

interface HomeScreenProps {
  onCreateRoom: (playerName: string, hostIsPlayer: boolean) => void;
  onJoinRoom: (roomCode: string, playerName: string) => void;
  isCreating: boolean;
  isJoining: boolean;
  errorMessage?: string | null;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onCreateRoom,
  onJoinRoom,
  isCreating,
  isJoining,
  errorMessage,
}) => {
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('boardgame_player_name') || '';
  });
  const [roomCode, setRoomCode] = useState('');
  const [hostIsPlayer, setHostIsPlayer] = useState(false); // Default: Host is classroom moderator/referee
  const [showRules, setShowRules] = useState(false);
  const [mode, setMode] = useState<'create' | 'join'>('create');

  const handleNameChange = (val: string) => {
    setPlayerName(val);
    localStorage.setItem('boardgame_player_name', val);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      alert('Vui lòng nhập tên của bạn');
      return;
    }
    sounds.playClick();
    onCreateRoom(playerName.trim(), hostIsPlayer);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      alert('Vui lòng nhập tên của bạn / tên đội');
      return;
    }
    if (!roomCode.trim()) {
      alert('Vui lòng nhập mã phòng');
      return;
    }
    sounds.playClick();
    onJoinRoom(roomCode.trim().toUpperCase(), playerName.trim());
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col items-center justify-center p-4">
      {/* Container */}
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8 relative overflow-hidden">
        
        {/* Academic Header */}
        <div className="text-center relative z-10 space-y-2 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-slate-100 font-bold text-xs uppercase tracking-wider border border-slate-700 shadow-xs">
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            Board Game Giáo Dục Chính Trị
          </div>
          
          <h1 className="font-['Playfair_Display',serif] text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            HÀNH TRÌNH LÀM CHỦ
          </h1>
          
          <p className="text-xs sm:text-sm font-extrabold text-slate-600">
            Dân là chủ – Dân làm chủ
          </p>

          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Học phần Chủ nghĩa xã hội khoa học (Chương 4: Dân chủ và nền dân chủ XHCN)
          </p>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-bold text-center animate-shake">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Tab Switcher: Tạo phòng / Vào phòng */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl mb-5 border border-slate-200">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setMode('create');
            }}
            className={`py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'create'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" /> Tạo Phòng (Host)
          </button>
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setMode('join');
            }}
            className={`py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'join'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-sky-400" /> Tham Gia Đội Chơi
          </button>
        </div>

        {/* Form Area */}
        <div className="relative z-10 space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
              👤 {mode === 'create' ? 'Tên Quản Trò (Thầy/Cô/MC):' : 'Tên Đội Chơi / Người Chơi:'}
            </label>
            <input
              type="text"
              maxLength={25}
              value={playerName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder={mode === 'create' ? 'Ví dụ: Thầy Tùng / MC Nam' : 'Ví dụ: Đội 1 / Bạn Linh'}
              className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-slate-800 focus:ring-2 focus:ring-slate-200 outline-none text-sm sm:text-base font-bold text-slate-900 bg-slate-50 focus:bg-white transition-all"
            />
          </div>

          {mode === 'create' ? (
            <form onSubmit={handleCreate} className="space-y-4 pt-1">
              {/* Host role picker */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600">
                  Vai trò của Host khi tạo phòng:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setHostIsPlayer(false)}
                    className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                      !hostIsPlayer
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-extrabold shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs">
                      <Crown className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Quản trò / Trọng tài</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                      Chỉ điều phối và chấm điểm trên máy chiếu (Khuyên dùng)
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHostIsPlayer(true)}
                    className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                      hostIsPlayer
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-extrabold shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs">
                      <Gamepad2 className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>Host cùng chơi</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                      Host vừa điều phối vừa sở hữu 1 quân cờ thi đấu
                    </p>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="w-full py-3.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-black text-sm sm:text-base tracking-wide shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 border border-slate-700"
              >
                {isCreating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang tạo phòng...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 text-amber-400 fill-current" />
                    TẠO PHÒNG BÀN CỜ
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoin} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  🔑 Mã phòng (5 ký tự):
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="Ví dụ: A7K2P"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-slate-800 focus:ring-2 focus:ring-slate-200 outline-none text-base sm:text-lg font-black tracking-widest uppercase text-center text-slate-900 bg-slate-50 focus:bg-white transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isJoining}
                className="w-full py-3.5 px-6 rounded-xl bg-indigo-700 hover:bg-indigo-800 active:scale-[0.98] text-white font-black text-sm sm:text-base tracking-wide shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                {isJoining ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang vào phòng...
                  </>
                ) : (
                  <>
                    <ChevronRight className="w-5 h-5 text-white" />
                    VÀO PHÒNG THI ĐẤU
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setShowRules(!showRules);
            }}
            className="inline-flex items-center gap-1 text-indigo-700 hover:text-indigo-900 font-extrabold cursor-pointer"
          >
            <BookOpen className="w-4 h-4" /> Xem luật chơi & 24 ô chủ đề
          </button>
          <span>Tối đa 4 đội / phòng</span>
        </div>

        {/* Rules Modal */}
        {showRules && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-300 p-6 max-h-[85vh] overflow-y-auto space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="font-['Playfair_Display',serif] text-xl font-black text-slate-900">
                  📜 Luật Chơi “Hành Trình Làm Chủ”
                </h3>
                <button
                  onClick={() => setShowRules(false)}
                  className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold"
                >
                  Đóng
                </button>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="font-extrabold text-slate-900 mb-1">🎯 1. Mục tiêu & Thành phần:</p>
                  <p>
                    Củng cố kiến thức về Dân chủ, quá trình phát triển dân chủ, nền dân chủ XHCN và 3 phương diện bản chất (Chính trị, Kinh tế, Tư tưởng - Văn hóa - Xã hội). Bàn cờ gồm 24 ô.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="font-extrabold text-slate-900 mb-1">🎲 2. Cách chơi theo lượt:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Đến lượt: đội chơi nhấn <strong>🎲 TUNG XÚC XẮC</strong> (1-6).</li>
                    <li>Quân cờ di chuyển từng bước đến ô tương ứng.</li>
                    <li>Hệ thống mở câu hỏi thuộc đúng ô đang đứng.</li>
                    <li>Quản trò (Host) kiểm tra câu trả lời và chấm điểm.</li>
                  </ul>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="font-extrabold text-slate-900 mb-1">⭐ 3. Điểm số & Kết thúc:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Ô thông thường: +1 điểm.</li>
                    <li>Ô Tình huống (Màu tím): +2 điểm.</li>
                    <li>Khi có đội đầu tiên hoàn thành 1 vòng bàn cờ, trò chơi kết thúc. Đội nhiều điểm nhất chiến thắng!</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
