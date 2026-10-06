import React, { useState } from 'react';
import { RoomState } from '../types/game';
import { Board } from './Board';
import { Dice3D } from './Dice3D';
import { PlayerSidebar } from './PlayerSidebar';
import { QuestionModal } from './QuestionModal';
import { BOARD_SQUARES, CATEGORY_CONFIG } from '../questions/boardData';
import { sounds } from '../utils/audio';
import {
  submitPlayerAnswer,
  closeQuestionAndAdvance,
  usePlayerHint,
} from '../firebase/roomService';
import {
  Volume2,
  VolumeX,
  BookOpen,
  LogOut,
  X,
  Flame,
} from 'lucide-react';

interface GameScreenProps {
  room: RoomState;
  myPlayerId: string;
  onRollDice: () => void;
  onLeaveRoom: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  room,
  myPlayerId,
  onRollDice,
  onLeaveRoom,
}) => {
  const [isMuted, setIsMuted] = useState(sounds.getMuted());
  const [showRules, setShowRules] = useState(false);
  const [selectedSquareId, setSelectedSquareId] = useState<number | null>(null);

  const isHost = room.hostId === myPlayerId;
  const activePlayer = room.players[room.currentPlayerIndex] || room.players[0];
  const questionActivePlayer =
    room.players.find((p) => p.id === room.currentQuestion?.activePlayerId) || activePlayer;
  const isMyTurn = activePlayer?.id === myPlayerId;
  const isBonusRoll = room.status === 'bonus_roll' && room.isBonusRoll;
  const isMyBonusTurn = isBonusRoll && room.bonusPlayerId === myPlayerId;
  const canRoll =
    (room.status === 'playing' && isMyTurn) ||
    (room.status === 'bonus_roll' && isMyBonusTurn);

  const toggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const handleSquareClick = (squareId: number) => {
    sounds.playClick();
    setSelectedSquareId(squareId);
  };

  const selectedSquare = BOARD_SQUARES.find((s) => s.id === selectedSquareId);
  const selectedConfig = selectedSquare
    ? CATEGORY_CONFIG[selectedSquare.category] || CATEGORY_CONFIG.knowledge
    : null;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col select-none">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 sm:px-6 py-2.5 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-black text-sm shadow-xs">
            🏛️
          </div>
          <div>
            <h1 className="font-['Playfair_Display',serif] text-sm sm:text-base font-black text-slate-900 leading-tight">
              HÀNH TRÌNH LÀM CHỦ
            </h1>
            <p className="text-[10px] text-slate-500 font-bold hidden sm:block">
              Mã phòng: <span className="font-black text-slate-900 tracking-wider">{room.roomCode}</span>
            </p>
          </div>
        </div>

        {/* Room & Controls Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Active Player Banner */}
          {activePlayer && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-300 text-xs font-bold text-slate-800">
              <span
                style={{ backgroundColor: activePlayer?.color }}
                className="w-2.5 h-2.5 rounded-full ring-1 ring-white"
              />
              <span className="hidden md:inline">Lượt:</span>
              <span className="font-extrabold text-slate-900 truncate max-w-[100px]">
                {activePlayer?.name}
              </span>
            </div>
          )}

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-600" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
          </button>

          {/* Rules Button */}
          <button
            onClick={() => {
              sounds.playClick();
              setShowRules(true);
            }}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
            title="Xem luật chơi"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          {/* Leave Room */}
          <button
            onClick={() => {
              sounds.playClick();
              onLeaveRoom();
            }}
            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition-all cursor-pointer"
            title="Rời phòng"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Game Screen Content: Responsive 72% Board | 28% Sidebar */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4 flex flex-col lg:flex-row gap-4 items-start justify-center">
        {/* Left / Center: Board Display */}
        <div className="w-full lg:w-[72%] flex flex-col items-center">
          <Board
            players={room.players}
            currentPlayerIndex={room.currentPlayerIndex}
            onSquareClick={handleSquareClick}
            selectedSquareId={selectedSquareId}
          />
        </div>

        {/* Right / Sidebar: Controls & Player Sidebar */}
        <div className="w-full lg:w-[28%] flex flex-col gap-4">
          {/* Dice Roll Module */}
          <Dice3D
            diceValue={room.diceValue}
            isRolling={false}
            canRoll={canRoll}
            isBonusRoll={isBonusRoll}
            onRoll={onRollDice}
            activePlayerName={
              isBonusRoll
                ? room.players.find((p) => p.id === room.bonusPlayerId)?.name || 'Người chơi'
                : activePlayer?.name || 'Người chơi'
            }
          />

          {/* Bonus Roll Alert banner */}
          {isBonusRoll && (
            <div className="p-3 bg-amber-100 border-2 border-amber-400 rounded-xl text-amber-950 text-xs font-bold flex items-center gap-2 animate-bounce">
              <Flame className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {isMyBonusTurn
                  ? '🎉 Bạn trả lời đúng! Hãy tung xúc xắc thưởng để tiến bước ngay!'
                  : `🎉 ${activePlayer?.name} được tặng 1 lần tung xúc xắc thưởng!`}
              </span>
            </div>
          )}

          {/* Players Sidebar */}
          <PlayerSidebar
            players={room.players}
            currentPlayerIndex={room.currentPlayerIndex}
            hostId={room.hostId}
            hostName={room.hostName}
            myPlayerId={myPlayerId}
          />
        </div>
      </main>

      {/* Question Modal (Synchronized in real-time) */}
      {room.status === 'question' && room.currentQuestion && questionActivePlayer && (
        <QuestionModal
          currentQuestion={room.currentQuestion}
          activePlayer={questionActivePlayer}
          players={room.players}
          myPlayerId={myPlayerId}
          isHost={isHost}
          onAnswerSubmit={(text) => submitPlayerAnswer(room.roomCode, text, myPlayerId)}
          onCloseQuestion={() => closeQuestionAndAdvance(room.roomCode)}
          onUseHint={() => usePlayerHint(room.roomCode, myPlayerId)}
        />
      )}

      {/* Square Detail Inspector Modal */}
      {selectedSquare && selectedConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border-4 border-amber-400 p-5 space-y-3 relative">
            <button
              onClick={() => setSelectedSquareId(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${selectedConfig.badgeClass}`}>
                {selectedSquare.id === 1 ? 'BẮT ĐẦU' : `Ô ${selectedSquare.id}`}
              </span>
              <span className="text-xs font-bold text-slate-500 uppercase">
                {selectedConfig.label}
              </span>
            </div>

            <h3 className="font-['Playfair_Display',serif] text-lg font-black text-slate-900">
              {selectedSquare.name}
            </h3>

            <p className="text-xs text-slate-600 font-medium">
              {selectedSquare.subtitle}
            </p>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-950 font-semibold">
              📌 {selectedConfig.description}
            </div>

            <div className="text-[11px] text-slate-400 text-center font-bold">
              Ô này gồm 4 câu hỏi ngẫu nhiên trong bài học.
            </div>
          </div>
        </div>
      )}

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border-4 border-amber-400 p-6 max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-amber-200">
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
                <p className="font-extrabold text-amber-950 mb-1">🏁 1. Mục tiêu & Điều kiện thắng:</p>
                <p>
                  Game tối đa 4 người/đội, chơi lần lượt. <strong>Không tính điểm</strong>. Người đầu tiên đi đủ 1 vòng bàn cờ và vượt/về ô BẮT ĐẦU sẽ chiến thắng ngay lập tức!
                </p>
              </div>

              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                <p className="font-extrabold text-blue-950 mb-1">🎲 2. Một lượt chơi & Lần tung thưởng:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Người chơi chính tung xúc xắc (ưu tiên ra 2–3).</li>
                  <li>Chưa di chuyển quân ngay. Hệ thống tính ô đích dự kiến và bốc ngẫu nhiên 1 trong 4 câu hỏi của ô đó.</li>
                  <li>
                    <strong>Nếu trả lời đúng:</strong> Di chuyển đúng số ô đã tung + được thưởng đúng 1 lần tung xúc xắc nữa (ưu tiên ra 5–6, di chuyển luôn không cần trả lời thêm câu hỏi). Sau đó kết thúc lượt.
                  </li>
                </ul>
              </div>

              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                <p className="font-extrabold text-rose-950 mb-1">⚡ 3. Cơ chế Cướp câu hỏi (Khi người chính trả lời sai):</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Người chơi chính không được di chuyển. Câu hỏi được mở cho tất cả đối thủ còn lại.</li>
                  <li>Xuất hiện nút <strong>BẤM ĐỂ TRẢ LỜI</strong>. Ai bấm nhanh nhất được quyền trả lời trong 10 giây.</li>
                  <li>Nếu sai hoặc hết 10 giây: Người đó bị loại khỏi câu hỏi này, mở lại quyền bấm cho các đối thủ còn lại.</li>
                  <li>
                    Nếu 1 đối thủ trả lời đúng: Người đó được di chuyển bằng đúng số bước xúc xắc mà người chơi chính đã tung! (Người cướp không có lượt tung thưởng).
                  </li>
                  <li>Nếu tất cả đối thủ đều sai: Không ai di chuyển, chuyển lượt cho người tiếp theo.</li>
                </ul>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <p className="font-extrabold text-amber-950 mb-1">💡 4. Quy định về Gợi ý:</p>
                <p>
                  Mỗi người chơi có tối đa <strong>2 lượt mở gợi ý</strong> trong suốt cả ván chơi. Gợi ý chỉ che bớt ký tự của từ khóa quan trọng, giữ nguyên cấu trúc câu để hỗ trợ tư duy.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
