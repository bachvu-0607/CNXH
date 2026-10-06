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
  Zap,
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
  onBuzz: () => void;
  onMainPlayerTimeout: () => void;
  onStealTimeout: (stealerId: string) => void;
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
  onBuzz,
  onMainPlayerTimeout,
  onStealTimeout,
}) => {
  const [answerInput, setAnswerInput] = useState('');
  const [localHintRevealed, setLocalHintRevealed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultCountdown, setResultCountdown] = useState<number>(3);
  const [timerRemaining, setTimerRemaining] = useState<number>(60);
  const closeTriggeredRef = useRef<boolean>(false);
  const timeoutTriggeredRef = useRef<boolean>(false);

  const onCloseRef = useRef(onCloseQuestion);
  onCloseRef.current = onCloseQuestion;

  const onMainTimeoutRef = useRef(onMainPlayerTimeout);
  onMainTimeoutRef.current = onMainPlayerTimeout;

  const onStealTimeoutRef = useRef(onStealTimeout);
  onStealTimeoutRef.current = onStealTimeout;

  const config = CATEGORY_CONFIG[currentQuestion.category] || CATEGORY_CONFIG.knowledge;
  const isMainPlayer = myPlayerId === currentQuestion.activePlayerId;
  const stealerPlayer = players.find((p) => p.id === currentQuestion.stolenByPlayerId);
  const isStealer = myPlayerId === currentQuestion.stolenByPlayerId;
  const winningPlayer = players.find((p) => p.id === currentQuestion.resultWinnerId);

  const myPlayer = players.find((p) => p.id === myPlayerId);
  const hintsRemaining = myPlayer?.hintsRemaining ?? 2;
  const hasUsedHintThisQuestion =
    currentQuestion.hintUsedByPlayerIds?.includes(myPlayerId) || localHintRevealed;

  // 1. Bộ đếm ngược 60 giây cho người chơi chính (active_answering)
  useEffect(() => {
    if (currentQuestion.phase !== 'active_answering') return;
    timeoutTriggeredRef.current = false;
    setAnswerInput('');
    setIsSubmitting(false);

    // Tính thời gian dựa trên questionStartTime hoặc mặc định 60s
    const startTime = currentQuestion.questionStartTime || Date.now();
    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, 60 - elapsed);
      setTimerRemaining(remaining);

      if (remaining <= 0 && !timeoutTriggeredRef.current) {
        timeoutTriggeredRef.current = true;
        if (isMainPlayer) {
          onMainTimeoutRef.current();
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [currentQuestion.phase, currentQuestion.questionStartTime, isMainPlayer]);

  // 2. Bộ đếm ngược 30 giây cho người cướp quyền (stealer_answering)
  useEffect(() => {
    if (currentQuestion.phase !== 'stealer_answering') return;
    timeoutTriggeredRef.current = false;
    setAnswerInput('');
    setIsSubmitting(false);

    const startTime = currentQuestion.stealStartTime || Date.now();
    const updateStealTimer = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, 30 - elapsed);
      setTimerRemaining(remaining);

      if (remaining <= 0 && !timeoutTriggeredRef.current) {
        timeoutTriggeredRef.current = true;
        if (isStealer) {
          onStealTimeoutRef.current(currentQuestion.stolenByPlayerId || '');
        }
      }
    };

    updateStealTimer();
    const interval = setInterval(updateStealTimer, 1000);
    return () => clearInterval(interval);
  }, [currentQuestion.phase, currentQuestion.stealStartTime, isStealer, currentQuestion.stolenByPlayerId]);

  // 3. Thời gian mở cướp quyền (stealing_open): 12 giây nếu không ai cướp thì tự kết thúc câu hỏi
  useEffect(() => {
    if (currentQuestion.phase !== 'stealing_open') return;

    const timer = setTimeout(() => {
      if (isMainPlayer || isHost) {
        onCloseRef.current();
      }
    }, 12000);

    return () => clearTimeout(timer);
  }, [currentQuestion.phase, isMainPlayer, isHost]);

  // 4. Tự động đóng modal sau 3s khi hiện kết quả (showing_result)
  useEffect(() => {
    if (currentQuestion.phase !== 'showing_result') {
      closeTriggeredRef.current = false;
      setResultCountdown(3);
      return;
    }

    if (currentQuestion.result === 'correct') {
      sounds.playCorrect();
    } else if (currentQuestion.result === 'incorrect') {
      sounds.playIncorrect();
    }

    // Người có liên quan (người thắng hoặc người chính) chạy đếm ngược 3s đóng
    setResultCountdown(3);
    const interval = setInterval(() => {
      setResultCountdown((prev) => {
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
  }, [currentQuestion.phase, currentQuestion.result]);

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
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-emerald-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header - Xanh lá dịu nhẹ, thanh lịch */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-emerald-100 bg-emerald-50/50">
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
            Trị giá {currentQuestion.originalDiceValue} ô
          </span>
        </div>

        {/* Nội dung chính Modal */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 text-stone-800">
          
          {/* THANH TRẠNG THÁI LƯỢT & BỘ ĐẾM THỜI GIAN */}
          {currentQuestion.phase === 'active_answering' && (
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs">
              <div className="flex items-center gap-2">
                <span
                  style={{ backgroundColor: activePlayer.color }}
                  className="w-2.5 h-2.5 rounded-full"
                />
                <span className="text-stone-600">
                  Lượt của: <strong className="text-stone-900">{activePlayer.name}</strong>
                </span>
                {isMainPlayer && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-700 text-white">
                    Bạn
                  </span>
                )}
              </div>

              {/* Bộ đếm ngược 60 giây */}
              <div className={`flex items-center gap-1 font-mono font-bold text-xs px-2 py-0.5 rounded-lg ${
                timerRemaining <= 10
                  ? 'bg-rose-100 text-rose-700 animate-pulse'
                  : 'bg-emerald-100 text-emerald-900'
              }`}>
                <Clock className="w-3.5 h-3.5" />
                <span>{timerRemaining}s</span>
              </div>
            </div>
          )}

          {/* Trạng thái cướp quyền (stealer_answering) */}
          {currentQuestion.phase === 'stealer_answering' && stealerPlayer && (
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
                <span className="text-amber-950 font-semibold">
                  {stealerPlayer.name} đang trả lời cướp quyền! {isStealer && '(Bạn)'}
                </span>
              </div>

              {/* Bộ đếm ngược 30 giây */}
              <div className={`flex items-center gap-1 font-mono font-bold text-xs px-2 py-0.5 rounded-lg ${
                timerRemaining <= 5
                  ? 'bg-rose-100 text-rose-700 animate-pulse'
                  : 'bg-amber-100 text-amber-900'
              }`}>
                <Clock className="w-3.5 h-3.5" />
                <span>{timerRemaining}s</span>
              </div>
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
          {/* PHA 1: NGƯỜI CHƠI CHÍNH NHẬP ĐÁP ÁN (TRONG 60S) */}
          {/* ============================================================== */}
          {currentQuestion.phase === 'active_answering' && isMainPlayer && (
            <div className="p-3.5 rounded-xl bg-emerald-50/40 border border-emerald-100 space-y-2">
              <label className="text-xs font-semibold text-emerald-950 block">
                Nhập câu trả lời của bạn (còn {timerRemaining}s):
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

          {/* ============================================================== */}
          {/* PHA 2: CƯỚP QUYỀN TRẢ LỜI (stealing_open) */}
          {/* ============================================================== */}
          {currentQuestion.phase === 'stealing_open' && (
            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-300 text-center space-y-3 animate-fade-in">
              <div className="space-y-1">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wide flex items-center justify-center gap-1">
                  <Zap className="w-4 h-4 text-amber-600 animate-bounce" /> Cơ hội cướp điểm!
                </span>
                <p className="text-xs text-stone-600">
                  {activePlayer.name} chưa trả lời chính xác hoặc hết 60s. Ai bấm nhanh nhất sẽ giành quyền trả lời!
                </p>
                <p className="text-[11px] font-semibold text-emerald-800">
                  Trả lời đúng: Quân cờ của bạn được tiến <strong>+{currentQuestion.originalDiceValue} ô</strong>!
                </p>
              </div>

              {!isMainPlayer && !isHost ? (
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    onBuzz();
                  }}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold text-sm shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4 fill-current" /> BẤM ĐỂ CƯỚP QUYỀN TRẢ LỜI
                </button>
              ) : (
                <div className="text-xs text-stone-500 italic py-1">
                  {isMainPlayer ? 'Bạn đã hết lượt trả lời câu hỏi này.' : 'Quản trò quan sát cơ chế cướp quyền.'}
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* PHA 3: NGƯỜI CƯỚP TRẢ LỜI TRONG 30S (stealer_answering) */}
          {/* ============================================================== */}
          {currentQuestion.phase === 'stealer_answering' && isStealer && (
            <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-300 space-y-2 animate-fade-in">
              <label className="text-xs font-bold text-amber-950 block">
                ⚡ Bạn đã cướp quyền! Nhập câu trả lời trong {timerRemaining}s:
              </label>
              <form onSubmit={handleSubmitText} className="flex gap-2">
                <input
                  type="text"
                  value={answerInput}
                  onChange={(e) => setAnswerInput(e.target.value)}
                  placeholder="Gõ đáp án nhanh..."
                  autoFocus
                  disabled={isSubmitting}
                  className="flex-1 px-3 py-2 rounded-lg border border-amber-300 focus:border-amber-600 focus:ring-1 focus:ring-amber-200 outline-none text-xs sm:text-sm font-semibold bg-white text-stone-900"
                />
                <button
                  type="submit"
                  disabled={!answerInput.trim() || isSubmitting}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg cursor-pointer transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" /> Gửi
                </button>
              </form>
            </div>
          )}

          {/* ============================================================== */}
          {/* PHA 4: HIỂN THỊ KẾT QUẢ ĐÚNG / SAI (showing_result) */}
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
                      ? winningPlayer
                        ? `Chính xác! ${winningPlayer.name} trả lời đúng`
                        : 'Chính xác! Trả lời đúng'
                      : 'Chưa chính xác!'}
                  </h3>
                  <p className="text-xs text-stone-600">
                    {currentQuestion.result === 'correct'
                      ? currentQuestion.resultWinnerId === currentQuestion.activePlayerId
                        ? `Quân cờ tiến ${currentQuestion.originalDiceValue} ô và được tặng 1 lượt tung xúc xắc thưởng!`
                        : `Cướp quyền thành công! Quân cờ của ${winningPlayer?.name} được tiến +${currentQuestion.originalDiceValue} ô!`
                      : 'Quân cờ giữ nguyên vị trí, kết thúc câu hỏi và chuyển lượt cho người tiếp theo.'}
                  </p>
                </div>
              </div>

              {/* So sánh đáp án */}
              <div className="p-2.5 bg-white rounded-lg border border-stone-200 space-y-1.5 text-xs">
                <div>
                  <span className="text-stone-400 text-[10px] uppercase font-semibold">Đã nhập:</span>
                  <p className="font-medium text-stone-800 italic">
                    "{currentQuestion.playerAnswer || '(Chưa nhập / Hết thời gian)'}"
                  </p>
                </div>
                <div className="pt-1.5 border-t border-stone-100">
                  <span className="text-emerald-800 text-[10px] uppercase font-semibold">Đáp án chuẩn:</span>
                  <p className="font-semibold text-emerald-950 font-mono">
                    {currentQuestion.officialAnswer}
                  </p>
                </div>
              </div>

              {/* Nút đóng / Đếm ngược */}
              <div className="pt-1 flex items-center justify-between">
                <span className="text-xs text-stone-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-700 animate-spin" />
                  Tự đóng sau {resultCountdown}s...
                </span>
                {/* Chỉ người đang chơi ở lượt đó hoặc người thắng cướp quyền mới thấy nút Tiếp tục ngay */}
                {(isMainPlayer || currentQuestion.resultWinnerId === myPlayerId) ? (
                  <button
                    type="button"
                    onClick={handleManualClose}
                    className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg cursor-pointer shadow-xs transition-all flex items-center gap-1 active:scale-95"
                  >
                    Tiếp tục ngay <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="text-xs text-stone-400 italic">
                    Chờ người chơi tiếp tục...
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
