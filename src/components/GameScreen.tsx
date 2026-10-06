import React, { useState, useEffect } from 'react';
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
  buzzToStealQuestion,
  handleMainPlayerTimeout,
  handleStealTimeout,
  openQuestionModal,
  finishBonusRoll,
} from '../firebase/roomService';
import {
  Volume2,
  VolumeX,
  BookOpen,
  LogOut,
  X,
  Flame,
  Crown,
  ArrowRight,
  Sparkles,
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
  const [isRollingDice, setIsRollingDice] = useState(false);

  const isHost = room.hostId === myPlayerId;
  const activePlayer = room.players[room.currentPlayerIndex] || room.players[0];
  const questionActivePlayer =
    room.players.find((p) => p.id === room.currentQuestion?.activePlayerId) || activePlayer;
  const isMyTurn = !isHost && activePlayer?.id === myPlayerId;
  const isBonusRoll = room.status === 'bonus_roll' && room.isBonusRoll;
  const isMyBonusTurn = !isHost && isBonusRoll && room.bonusPlayerId === myPlayerId;
  const canRoll =
    !isHost &&
    ((room.status === 'playing' && isMyTurn) ||
     (room.status === 'bonus_roll' && isMyBonusTurn));

  const toggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const handleSquareClick = (squareId: number) => {
    sounds.playClick();
    setSelectedSquareId(squareId);
  };

  const handleRollDice = async () => {
    if (isRollingDice || !canRoll) return;
    setIsRollingDice(true);
    try {
      await onRollDice();
    } finally {
      // Đợi xúc xắc quay xong (550ms) rồi mới hiện hộp thông báo mở câu hỏi
      setTimeout(() => {
        setIsRollingDice(false);
      }, 550);
    }
  };

  // Tự động kết thúc lượt thưởng và chuyển sang người kế tiếp sau 3 giây
  useEffect(() => {
    if (room.status === 'moving' && room.isBonusRoll) {
      const timer = setTimeout(() => {
        if (room.bonusPlayerId === myPlayerId || isHost) {
          finishBonusRoll(room.roomCode);
        }
      }, 3200);
      return () => clearTimeout(timer);
    }
  }, [room.status, room.isBonusRoll, room.roomCode, room.bonusPlayerId, myPlayerId, isHost]);

  const selectedSquare = BOARD_SQUARES.find((s) => s.id === selectedSquareId);
  const selectedConfig = selectedSquare
    ? CATEGORY_CONFIG[selectedSquare.category] || CATEGORY_CONFIG.knowledge
    : null;

  const targetSquare = room.targetPosition
    ? BOARD_SQUARES.find((sq) => sq.id === room.targetPosition) || BOARD_SQUARES[0]
    : null;
  const targetCategoryConfig = targetSquare
    ? CATEGORY_CONFIG[targetSquare.category] || CATEGORY_CONFIG.knowledge
    : null;

  return (
    <div className="min-h-screen bg-[#f4f7f4] text-stone-800 flex flex-col select-none">
      {/* Top Header - Màu xanh lá dịu nhẹ, tối giản */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-emerald-100 px-3 sm:px-6 py-2.5 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
            🌿
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-['Playfair_Display',serif] text-sm sm:text-base font-bold text-stone-900 leading-tight">
                HÀNH TRÌNH LÀM CHỦ
              </h1>
              {isHost && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <Crown className="w-3 h-3 text-emerald-700" /> Quản trò (Chỉ xem)
                </span>
              )}
            </div>
            <p className="text-[10px] text-stone-500 font-medium">
              Mã phòng: <span className="font-bold text-emerald-950 font-mono tracking-wider">{room.roomCode}</span>
            </p>
          </div>
        </div>

        {/* Nút điều khiển */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Lượt hiện tại */}
          {activePlayer && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-xs text-stone-800">
              <span
                style={{ backgroundColor: activePlayer?.color }}
                className="w-2 h-2 rounded-full"
              />
              <span className="text-[11px] text-stone-500 hidden sm:inline">Lượt:</span>
              <span className="font-bold text-stone-900 truncate max-w-[90px]">
                {activePlayer?.name}
              </span>
            </div>
          )}

          {/* Âm thanh */}
          <button
            onClick={toggleSound}
            className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-600" /> : <Volume2 className="w-4 h-4 text-emerald-700" />}
          </button>

          {/* Luật chơi */}
          <button
            onClick={() => {
              sounds.playClick();
              setShowRules(true);
            }}
            className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
            title="Luật chơi"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          {/* Rời phòng */}
          <button
            onClick={() => {
              sounds.playClick();
              onLeaveRoom();
            }}
            className="p-1.5 rounded-lg bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-rose-600 transition-colors cursor-pointer"
            title="Rời phòng"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Nội dung chính: Bàn cờ (72%) và Cột bên (28%) */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4 flex flex-col lg:flex-row gap-4 items-start justify-center">
        {/* Bàn cờ */}
        <div className="w-full lg:w-[72%] flex flex-col items-center">
          <Board
            players={room.players}
            currentPlayerIndex={room.currentPlayerIndex}
            onSquareClick={handleSquareClick}
            selectedSquareId={selectedSquareId}
          />
        </div>

        {/* Cột bên: Xúc xắc & Người chơi */}
        <div className="w-full lg:w-[28%] flex flex-col gap-3">
          {/* Module Xúc xắc */}
          <Dice3D
            diceValue={room.diceValue}
            isRolling={isRollingDice}
            canRoll={canRoll}
            isBonusRoll={isBonusRoll}
            onRoll={handleRollDice}
            activePlayerName={
              isBonusRoll
                ? room.players.find((p) => p.id === room.bonusPlayerId)?.name || 'Người chơi'
                : activePlayer?.name || 'Người chơi'
            }
            isHost={isHost}
          />

          {/* Banner thưởng tinh giản */}
          {isBonusRoll && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-950 text-xs font-semibold flex items-center gap-2">
              <Flame className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                {isMyBonusTurn
                  ? '🎉 Bạn được tặng 1 lượt tung xúc xắc thưởng!'
                  : `🎉 ${activePlayer?.name} được tặng 1 lượt tung xúc xắc thưởng!`}
              </span>
            </div>
          )}

          {/* Danh sách người chơi */}
          <PlayerSidebar
            players={room.players}
            currentPlayerIndex={room.currentPlayerIndex}
            hostId={room.hostId}
            hostName={room.hostName}
            myPlayerId={myPlayerId}
          />
        </div>
      </main>

      {/* ============================================================== */}
      {/* HỘP THÔNG BÁO: "MỞ CÂU HỎI" SAU KHI TUNG XÚC XẮC XONG */}
      {/* ============================================================== */}
      {room.status === 'moving' && !room.isBonusRoll && room.currentQuestion && !isRollingDice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs animate-fade-in select-none">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-emerald-100 p-5 space-y-4 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Xúc xắc đã tung: {room.diceValue} nút</span>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide">
                {targetCategoryConfig?.label || 'Chủ đề'} • Ô số {room.targetPosition}
              </span>
              <h3 className="font-['Playfair_Display',serif] text-base sm:text-lg font-bold text-stone-900 leading-snug">
                {room.currentQuestion.squareName}
              </h3>
            </div>

            {isMyTurn ? (
              <div className="pt-2 space-y-2">
                <button
                  onClick={() => {
                    sounds.playClick();
                    openQuestionModal(room.roomCode);
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold text-sm shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <BookOpen className="w-4 h-4" /> Mở câu hỏi
                </button>
                <p className="text-[11px] text-stone-400">
                  Bạn có 60 giây để trả lời câu hỏi sau khi bấm mở.
                </p>
              </div>
            ) : (
              <div className="pt-2">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-900 text-xs font-medium flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                  Đang chờ <strong>{activePlayer?.name}</strong> bấm mở câu hỏi...
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* HỘP THÔNG BÁO: KẾT QUẢ TUNG XÚC XẮC THƯỞNG */}
      {/* ============================================================== */}
      {room.status === 'moving' && room.isBonusRoll && !isRollingDice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs animate-fade-in select-none">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-emerald-200 p-5 space-y-3.5 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl shadow-inner">
              🎉
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-stone-900">
                {isMyBonusTurn
                  ? `Bạn được thưởng +${room.diceValue} ô!`
                  : `${activePlayer?.name} được thưởng +${room.diceValue} ô!`}
              </h3>
              <p className="text-xs text-stone-600">
                Quân cờ tiến đến ô số <strong>{room.targetPosition}</strong>.
              </p>
            </div>

            <div className="pt-2">
              {isMyBonusTurn || isHost ? (
                <button
                  onClick={() => {
                    sounds.playClick();
                    finishBonusRoll(room.roomCode);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs cursor-pointer transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  Chuyển lượt tiếp theo <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <span className="text-xs text-stone-400 italic">
                  Đang chuyển lượt chơi...
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal câu hỏi đồng bộ thời gian thực */}
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
          onBuzz={() => buzzToStealQuestion(room.roomCode, myPlayerId)}
          onMainPlayerTimeout={() => handleMainPlayerTimeout(room.roomCode)}
          onStealTimeout={(stealerId) => handleStealTimeout(room.roomCode, stealerId)}
        />
      )}

      {/* Chi tiết ô khi click */}
      {selectedSquare && selectedConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-emerald-100 p-4 space-y-3 relative">
            <button
              onClick={() => setSelectedSquareId(null)}
              className="absolute top-3 right-3 p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-700 text-white">
                {selectedSquare.id === 1 ? 'Khởi hành' : `Ô ${selectedSquare.id}`}
              </span>
              <span className="text-xs font-semibold text-emerald-900 uppercase">
                {selectedConfig.label}
              </span>
            </div>

            <h3 className="font-['Playfair_Display',serif] text-base font-bold text-stone-900">
              {selectedSquare.name}
            </h3>

            <p className="text-xs text-stone-600 leading-relaxed">
              {selectedSquare.subtitle}
            </p>

            <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-950 font-medium">
              {selectedConfig.description}
            </div>
          </div>
        </div>
      )}

      {/* Modal Luật chơi - Tối giản, chuẩn quy tắc */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-emerald-100 p-5 space-y-4 relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setShowRules(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-700" />
              <h2 className="font-['Playfair_Display',serif] text-lg font-bold text-stone-900">
                Quy Tắc Trò Chơi
              </h2>
            </div>

            <div className="space-y-2.5 text-xs text-stone-700 leading-relaxed">
              <p>
                <strong>Mục tiêu:</strong> Đi hết 1 vòng 24 ô và hoàn thành ô BẮT ĐẦU đầu tiên để giành chiến thắng.
              </p>
              <p className="font-semibold text-emerald-900">
                Quy trình mỗi lượt chơi:
              </p>
              <ol className="list-decimal pl-4 space-y-1.5 text-stone-600">
                <li>Người chơi đến lượt tung xúc xắc.</li>
                <li>Xem số nút đạt được, sau đó bấm hộp <strong>"Mở câu hỏi"</strong> để bắt đầu thử thách.</li>
                <li>
                  <strong>Trả lời đúng (trong 60s):</strong> Quân cờ tiến đến ô mục tiêu và được tặng thêm <strong>1 lượt tung xúc xắc thưởng</strong>!
                </li>
                <li>
                  <strong>Trả lời sai hoặc hết 60s:</strong> Giữ nguyên vị trí, quyền trả lời được mở cho các đối thủ còn lại.
                </li>
                <li>
                  <strong>Cướp quyền trả lời:</strong> Người bấm nút nhanh nhất sẽ có <strong>30s</strong> để nhập đáp án:
                  <ul className="list-disc pl-4 mt-1 space-y-1 text-stone-500">
                    <li>Nếu đúng: Được cộng số ô bằng đúng số nút người chơi chính đã tung!</li>
                    <li>Nếu sai hoặc hết 30s: Kết thúc câu hỏi, không ai được cộng điểm.</li>
                  </ul>
                </li>
                <li>Mỗi người chơi có tối đa 2 lần sử dụng gợi ý trong cả ván đấu.</li>
                <li>Quản trò chỉ quan sát, theo dõi câu hỏi và kết quả, không tham gia thi đấu.</li>
              </ol>
            </div>

            <button
              onClick={() => setShowRules(false)}
              className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl cursor-pointer"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
