import React, { useState, useEffect, useRef } from 'react';
import { CurrentQuestionState, Player } from '../types/game';
import { CATEGORY_CONFIG } from '../questions/boardData';
import { sounds } from '../utils/audio';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  Send,
  Clock,
  Lightbulb,
  ArrowRight,
} from 'lucide-react';

interface QuestionModalProps {
  currentQuestion: CurrentQuestionState;
  activePlayer: Player;
  players: Player[];
  myPlayerId: string;
  isHost: boolean;
  onAnswerSubmit: (answerText: string) => void;
  onCloseQuestion: () => void;
  onUseHint: () => void;
}

export const QuestionModal: React.FC<QuestionModalProps> = ({
  currentQuestion,
  activePlayer,
  players,
  myPlayerId,
  isHost,
  onAnswerSubmit,
  onCloseQuestion,
  onUseHint,
}) => {
  const [answerInput, setAnswerInput] = useState('');
  const [localHintRevealed, setLocalHintRevealed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState<number>(3);
  const closeTriggeredRef = useRef<boolean>(false);

  const onCloseRef = useRef(onCloseQuestion);
  onCloseRef.current = onCloseQuestion;

  const config = CATEGORY_CONFIG[currentQuestion.category] || CATEGORY_CONFIG.knowledge;
  // Người đang chơi ở lượt đó
  const isCurrentTurnPlayer = myPlayerId === currentQuestion.activePlayerId;

  const myPlayer = players.find((p) => p.id === myPlayerId);
  const hintsRemaining = myPlayer?.hintsRemaining ?? 2;
  const hasUsedHintThisQuestion =
    currentQuestion.hintUsedByPlayerIds?.includes(myPlayerId) || localHintRevealed;

  // Auto-close timer: CHỈ người đang chơi ở lượt đó kích hoạt sau 3s (hoặc bấm nút "Tiếp tục ngay")
  // Những người khác chỉ chờ tín hiệu từ Firestore khi cửa sổ đóng
  useEffect(() => {
    if (currentQuestion.phase !== 'showing_result') {
      closeTriggeredRef.current = false;
      setCountdown(3);
      return;
    }

    if (currentQuestion.result === 'correct') {
      sounds.playCorrect();
    } else if (currentQuestion.result === 'incorrect') {
      sounds.playIncorrect();
    }

    // Người chơi lượt đó: đếm lùi 3 giây rồi tự động đóng
    if (isCurrentTurnPlayer) {
      setCountdown(3);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            if (!closeTriggeredRef.current) {
              closeTriggeredRef.current = true;
              onCloseRef.current();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else {
      // Người khác và Quản trò: chỉ đặt fallback an toàn 10s phòng khi người chơi chính ngắt kết nối
      const fallbackTimeout = setTimeout(() => {
        if (!closeTriggeredRef.current) {
          closeTriggeredRef.current = true;
          onCloseRef.current();
        }
      }, 10000);
      return () => clearTimeout(fallbackTimeout);
    }
  }, [currentQuestion.phase, currentQuestion.result, isCurrentTurnPlayer]);

  const handleSubmitText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerInput.trim() || isSubmitting) return;
    sounds.playClick();
    setIsSubmitting(true);
    onAnswerSubmit(answerInput.trim());
  };

  const handleToggleHint = () => {
    sounds.playClick();
    if (isHost) {
      setLocalHintRevealed(!localHintRevealed);
      return;
    }

    if (hasUsedHintThisQuestion) {
      setLocalHintRevealed(!localHintRevealed);
      return;
    }

    if (hintsRemaining > 0) {
      setLocalHintRevealed(true);
      onUseHint();
    }
  };

  const handleManualClose = () => {
    if (!closeTriggeredRef.current) {
      closeTriggeredRef.current = true;
      onCloseRef.current();
    }
  };

  const isHintVisible = isHost ? localHintRevealed : hasUsedHintThisQuestion;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-900/40 backdrop-blur-xs animate-fade-in select-none">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-emerald-100 overflow-hidden flex flex-col max-h-[88vh]">
        
        {/* Header - Xanh lá dịu nhẹ, tối giản */}
        <div className="px-4 py-3.5 flex items-center justify-between border-b border-emerald-100 bg-emerald-50/50">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-700 text-white">
              {currentQuestion.squareId === 1 ? 'Khởi hành' : `Ô ${currentQuestion.squareId}`}
            </span>
            <div>
              <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wide">
                {config.label}
              </span>
              <h2 className="font-['Playfair_Display',serif] text-sm sm:text-base font-bold text-stone-900 leading-tight">
                {currentQuestion.squareName}
              </h2>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white text-emerald-800 font-semibold text-xs rounded-md border border-emerald-200">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            Tiến {currentQuestion.originalDiceValue} ô
          </span>
        </div>

        {/* Nội dung câu hỏi */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 text-stone-800">
          
          {/* Người trả lời */}
          {currentQuestion.phase === 'active_answering' && (
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-50/40 border border-emerald-100 text-xs">
              <div className="flex items-center gap-2">
                <span
                  style={{ backgroundColor: activePlayer.color }}
                  className="w-2.5 h-2.5 rounded-full"
                />
                <span className="text-stone-600">
                  Lượt của: <strong className="text-stone-900">{activePlayer.name}</strong>
                </span>
              </div>
              {isCurrentTurnPlayer && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-600 text-white">
                  Lượt của bạn
                </span>
              )}
            </div>
          )}

          {/* Hộp câu hỏi */}
          <div className="p-3.5 rounded-xl bg-[#fbfcfb] border border-stone-200/80 space-y-2.5">
            <div className="flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <p className="text-sm sm:text-base font-medium text-stone-900 leading-relaxed">
                {currentQuestion.questionText}
              </p>
            </div>

            {/* Gợi ý */}
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handleToggleHint}
                disabled={!isHost && hintsRemaining <= 0 && !hasUsedHintThisQuestion}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isHintVisible
                    ? 'bg-emerald-100 text-emerald-900'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5 text-emerald-700" />
                {isHintVisible ? 'Ẩn gợi ý' : isHost ? 'Gợi ý (Quản trò)' : `Gợi ý (${hintsRemaining}/2)`}
              </button>

              {!isHost && (
                <span className="text-[11px] text-stone-400">Tối đa 2 gợi ý / ván</span>
              )}
            </div>

            {isHintVisible && (
              <div className="p-2.5 bg-emerald-50/70 rounded-lg border border-emerald-200 text-xs text-emerald-950 font-mono animate-fade-in">
                {currentQuestion.hint || 'Chưa có gợi ý cho câu hỏi này.'}
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* KẾT QUẢ: "TIẾP TỤC NGAY" CHỈ HIỂN THỊ VỚI NGƯỜI CHƠI LƯỢT ĐÓ */}
          {/* ============================================================== */}
          {currentQuestion.phase === 'showing_result' && (
            <div className={`p-4 rounded-xl border space-y-3 animate-fade-in ${
              currentQuestion.result === 'correct'
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : 'bg-stone-50 border-stone-200 text-stone-800'
            }`}>
              <div className="flex items-center gap-2.5">
                {currentQuestion.result === 'correct' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                )}
                <div>
                  <h3 className="text-sm font-bold text-stone-900">
                    {currentQuestion.result === 'correct'
                      ? `Chính xác! ${activePlayer.name} trả lời đúng`
                      : `Chưa đúng! ${activePlayer.name} trả lời chưa chính xác`}
                  </h3>
                  <p className="text-xs text-stone-600">
                    {currentQuestion.result === 'correct'
                      ? `Quân cờ tiến ${currentQuestion.originalDiceValue} ô & nhận 1 lần tung xúc xắc thưởng!`
                      : 'Quân cờ giữ nguyên vị trí, chuyển lượt cho người tiếp theo.'}
                  </p>
                </div>
              </div>

              {/* So sánh đáp án */}
              <div className="p-2.5 bg-white rounded-lg border border-stone-200 space-y-1.5 text-xs">
                <div>
                  <span className="text-stone-400 text-[10px] uppercase font-semibold">Đã nhập:</span>
                  <p className="font-medium text-stone-800 italic">
                    "{currentQuestion.playerAnswer || '(Chưa nhập)'}"
                  </p>
                </div>
                <div className="pt-1.5 border-t border-stone-100">
                  <span className="text-emerald-800 text-[10px] uppercase font-semibold">Đáp án chuẩn:</span>
                  <p className="font-semibold text-emerald-950 font-mono">
                    {currentQuestion.officialAnswer}
                  </p>
                </div>
              </div>

              {/* Footer hành động: CHỈ NGƯỜI ĐANG CHƠI LƯỢT ĐÓ MỚI THẤY NÚT TIẾP TỤC */}
              <div className="pt-1">
                {isCurrentTurnPlayer ? (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-stone-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-700 animate-spin" />
                      Tự đóng sau {countdown}s...
                    </span>
                    <button
                      type="button"
                      onClick={handleManualClose}
                      className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg cursor-pointer shadow-xs transition-all flex items-center gap-1 active:scale-95"
                    >
                      Tiếp tục ngay <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="w-full text-center text-xs text-stone-500 py-1 flex items-center justify-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-700 animate-spin" />
                    Đang chờ {activePlayer.name} tiếp tục lượt...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Ô nhập câu trả lời của người chơi chính */}
          {currentQuestion.phase !== 'showing_result' && isCurrentTurnPlayer && (
            <div className="p-3.5 rounded-xl bg-emerald-50/30 border border-emerald-100 space-y-2">
              <label className="text-xs font-semibold text-emerald-950 block">
                Nhập câu trả lời của bạn:
              </label>
              <form onSubmit={handleSubmitText} className="flex gap-2">
                <input
                  type="text"
                  value={answerInput}
                  onChange={(e) => setAnswerInput(e.target.value)}
                  placeholder="Gõ đáp án vào đây..."
                  autoFocus
                  disabled={isSubmitting}
                  className="flex-1 px-3 py-2 rounded-lg border border-stone-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-200 outline-none text-xs sm:text-sm font-medium bg-white text-stone-900"
                />
                <button
                  type="submit"
                  disabled={!answerInput.trim() || isSubmitting}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold text-xs rounded-lg cursor-pointer transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" /> Gửi
                </button>
              </form>
            </div>
          )}

          {/* Thông báo cho người khác hoặc Quản trò */}
          {currentQuestion.phase !== 'showing_result' && !isCurrentTurnPlayer && (
            <div className="p-3 text-center text-xs text-stone-500 bg-stone-50 rounded-xl border border-stone-200">
              {isHost
                ? `Đang quan sát ${activePlayer.name} trả lời câu hỏi...`
                : `Đang chờ ${activePlayer.name} trả lời câu hỏi...`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
