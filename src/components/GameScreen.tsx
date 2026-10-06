import React, { useState, useEffect, useRef } from 'react';
import { RoomState } from '../types/game';
import { Board } from './Board';
import { Dice3D } from './Dice3D';
import { PlayerSidebar } from './PlayerSidebar';
import { QuestionModal } from './QuestionModal';
import { TieBreakModal } from './TieBreakModal';
import { BOARD_SQUARES, CATEGORY_CONFIG } from '../questions/boardData';
import { sounds } from '../utils/audio';
import {
  finishPawnMove,
  submitPlayerAnswer,
  evaluateAnswer,
  resolveTieBreakWinner,
  leaveRoom,
} from '../firebase/roomService';
import {
  Volume2,
  VolumeX,
  BookOpen,
  LogOut,
  Sparkles,
  Info,
  Compass,
  X,
  HelpCircle,
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

  // Animated pawn movement states
  const [animatingPlayerId, setAnimatingPlayerId] = useState<string | null>(null);
  const [animatedPosition, setAnimatedPosition] = useState<number | null>(null);

  const lastHandledRollKey = useRef<string>('');
  const isHost = room.hostId === myPlayerId;
  const activePlayer = room.players[room.currentPlayerIndex] || room.players[0];
  const isMyTurn = activePlayer?.id === myPlayerId;
  const isRolling = room.status === 'rolling';

  // Step-by-step movement animation effect
  useEffect(() => {
    if (room.status === 'rolling' && room.targetPosition && activePlayer) {
      const rollKey = `${room.currentPlayerIndex}_${room.diceValue}_${room.targetPosition}_${room.updatedAt?.seconds || Date.now()}`;
      
      if (lastHandledRollKey.current === rollKey) {
        return;
      }
      lastHandledRollKey.current = rollKey;

      const startPos = activePlayer.position || 1;
      const targetPos = room.targetPosition;
      const playerId = activePlayer.id;

      setAnimatingPlayerId(playerId);
      setAnimatedPosition(startPos);

      // Build step path
      const steps: number[] = [];
      let temp = startPos;
      while (temp !== targetPos) {
        temp = (temp % 24) + 1;
        steps.push(temp);
      }

      // 800ms for dice shake, then animate steps
      const startMovementTimer = setTimeout(() => {
        let stepIndex = 0;
        const interval = setInterval(() => {
          if (stepIndex < steps.length) {
            const nextPos = steps[stepIndex];
            setAnimatedPosition(nextPos);
            sounds.playStep();
            stepIndex++;
          } else {
            clearInterval(interval);
            setAnimatingPlayerId(null);
            setAnimatedPosition(null);

            // Transition to evaluating
            finishPawnMove(room.roomCode);
          }
        }, 180);
      }, 900);

      // Safety fallback timer: guarantee transition to evaluating within 3s
      const safetyTimer = setTimeout(() => {
        setAnimatingPlayerId(null);
        setAnimatedPosition(null);
        finishPawnMove(room.roomCode);
      }, 3000);

      return () => {
        clearTimeout(startMovementTimer);
        clearTimeout(safetyTimer);
      };
    }
  }, [room.status, room.targetPosition, room.diceValue, room.currentPlayerIndex, room.roomCode, activePlayer]);

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
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col">
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
              Phòng: <span className="font-black text-slate-900 tracking-wider">{room.roomCode}</span>
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

      {/* Main Game Screen Content: Responsive 75% Board | 25% Sidebar */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4 flex flex-col lg:flex-row gap-4 items-start justify-center">
        {/* Left / Center: Board Display (~72%) */}
        <div className="w-full lg:w-[72%] flex flex-col items-center">
          <Board
            players={room.players}
            currentPlayerIndex={room.currentPlayerIndex}
            animatingPlayerId={animatingPlayerId}
            animatedPosition={animatedPosition}
            onSquareClick={handleSquareClick}
            selectedSquareId={selectedSquareId}
          />
        </div>

        {/* Right / Sidebar: Controls & Player Sidebar (~28%) */}
        <div className="w-full lg:w-[28%] flex flex-col gap-4">
          {/* Dice Roll Module */}
          <Dice3D
            diceValue={room.diceValue}
            isRolling={isRolling}
            canRoll={(isMyTurn || (isHost && !room.hostIsPlayer)) && room.status === 'playing'}
            onRoll={onRollDice}
            activePlayerName={activePlayer?.name || 'Đội chơi'}
          />

          {/* Fallback button if rolling state is active */}
          {room.status === 'rolling' && (
            <button
              onClick={() => finishPawnMove(room.roomCode)}
              className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer transition-all flex items-center justify-center gap-1.5"
            >
              <HelpCircle className="w-4 h-4" /> Mở câu hỏi ngay
            </button>
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

      {/* Question Modal (triggers when status === 'evaluating' and currentQuestion exists) */}
      {room.status === 'evaluating' && room.currentQuestion && activePlayer && (
        <QuestionModal
          currentQuestion={room.currentQuestion}
          activePlayer={activePlayer}
          isHost={isHost}
          isCurrentPlayer={isMyTurn}
          onSubmitAnswer={(text) => submitPlayerAnswer(room.roomCode, text)}
          onEvaluate={(isCorrect) => evaluateAnswer(room.roomCode, isCorrect, room.hostId)}
        />
      )}

      {/* Tie Break Modal (if tied top scores at game end) */}
      {room.isTieBreak && room.tieBreakQuestion && (
        <TieBreakModal
          tieBreakQuestion={room.tieBreakQuestion}
          players={room.players}
          isHost={isHost}
          onSelectWinner={(winnerId) =>
            resolveTieBreakWinner(room.roomCode, winnerId, room.hostId)
          }
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
              <h3 className="font-['Playfair_Display',serif] text-xl font-black text-red-950">
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
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <p className="font-extrabold text-amber-950 mb-1">🎯 1. Mục tiêu:</p>
                <p>
                  Củng cố nội dung Chương 4 Chủ nghĩa xã hội khoa học: Dân chủ, quá trình phát triển dân chủ, nền dân chủ XHCN và 3 phương diện bản chất (Chính trị, Kinh tế, Tư tưởng - Văn hóa - Xã hội).
                </p>
              </div>

              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                <p className="font-extrabold text-blue-950 mb-1">🎲 2. Cách chơi:</p>
                <p>
                  Tung xúc xắc (1-6) → quân cờ di chuyển → mở câu hỏi của chính ô đang đứng → Host lắng nghe câu trả lời và chấm điểm (✅ ĐÚNG / ❌ CHƯA ĐÚNG).
                </p>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <p className="font-extrabold text-emerald-950 mb-1">⭐ 3. Điểm số & Kết thúc ván:</p>
                <p>
                  Ô thông thường: +1 điểm. Ô Tình huống: +2 điểm. Khi có người đầu tiên hoàn thành 1 vòng bàn cờ, trò chơi kết thúc. Người có tổng điểm cao nhất chiến thắng!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
