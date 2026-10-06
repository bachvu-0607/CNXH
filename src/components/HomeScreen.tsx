import React, { useState, useEffect } from 'react';
import { sounds } from '../utils/audio';
import {
  Compass,
  Play,
  Users,
  BookOpen,
  ChevronRight,
  Crown,
  Share2,
} from 'lucide-react';

interface HomeScreenProps {
  onCreateRoom: (playerName: string, hostIsPlayer: boolean) => void;
  onJoinRoom: (roomCode: string, playerName: string) => void;
  isCreating: boolean;
  isJoining: boolean;
  errorMessage?: string | null;
  initialRoomCode?: string;
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
  const [showRules, setShowRules] = useState(false);

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
    if (!playerName.trim()) {
      alert('Vui lòng nhập tên của Quản trò');
      return;
    }
    sounds.playClick();
    onCreateRoom(playerName.trim(), false);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      alert('Vui lòng nhập tên người chơi / tên đội của bạn');
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
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col items-center justify-center p-4 select-none">
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

        {/* Invited Link Banner if joining with code */}
        {initialRoomCode && mode === 'join' && (
          <div className="mb-4 p-3 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-950 text-xs sm:text-sm font-bold flex items-center gap-2">
            <Share2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              Bạn được mời tham gia phòng <span className="font-black text-indigo-700">{initialRoomCode}</span>! Nhập tên để vào thi đấu.
            </span>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-bold text-center animate-shake">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Tab Switcher */}
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
            <Crown className="w-4 h-4 text-amber-400" /> Tạo Phòng (Quản Trò)
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
              👤 {mode === 'create' ? 'Tên Quản Trò (Thầy/Cô/MC điều phối):' : 'Tên Người Chơi / Tên Đội Thi Đấu:'}
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
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                📌 <strong>Quy trình Quản trò (Host)</strong>: Quản trò tạo phòng, chia sẻ link/mã phòng cho tối đa 4 đội. Khi người chơi sẵn sàng, Quản trò bấm Bắt đầu, theo dõi câu trả lời và chấm đúng/sai.
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
                  className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold cursor-pointer"
                >
                  Đóng
                </button>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="font-extrabold text-amber-950 mb-1">🏁 1. Mục tiêu & Thắng cuộc:</p>
                  <p>
                    Tối đa 4 người/đội chơi lần lượt. <strong>Không tính điểm</strong>. Người đầu tiên đi đủ 1 vòng bàn cờ và vượt/về ô BẮT ĐẦU sẽ chiến thắng ngay lập tức!
                  </p>
                </div>

                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="font-extrabold text-blue-950 mb-1">🎲 2. Lượt chơi & Tung thưởng:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Người chơi chính tung xúc xắc (ưu tiên 2–3). Chưa đi quân ngay.</li>
                    <li>Hệ thống tính ô đích và chọn ngẫu nhiên 1 trong 4 câu hỏi của ô đó.</li>
                    <li>
                      <strong>Đúng:</strong> Đi số ô đã tung + <strong>Được tặng 1 lần tung xúc xắc thưởng</strong> (ưu tiên ra 5–6, di chuyển luôn không cần trả lời câu hỏi) → Hết lượt.
                    </li>
                  </ul>
                </div>

                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                  <p className="font-extrabold text-rose-950 mb-1">⚡ 3. Cơ chế Cướp câu hỏi (Khi trả lời sai):</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Người chính không được đi. Câu hỏi mở cho tất cả đối thủ còn lại.</li>
                    <li>Ai bấm <strong>BẤM ĐỂ TRẢ LỜI</strong> nhanh nhất có 10 giây để trả lời.</li>
                    <li>Nếu đối thủ trả lời đúng: Được di chuyển bằng đúng số xúc xắc ban đầu của người chính! (Không có lượt tung thưởng).</li>
                    <li>Nếu sai hoặc hết 10 giây: Bị loại khỏi câu này, mở lại cơ hội bấm cho các đối thủ còn lại.</li>
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
