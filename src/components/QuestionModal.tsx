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
  Eye,
  EyeOff,
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
  const [showOfficialAnswer, setShowOfficialAnswer] = useState(false);
  const [localHintRevealed, setLocalHintRevealed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState<number>(3);
  const closeTriggeredRef = useRef<boolean>(false);

  const onCloseRef = useRef(onCloseQuestion);
  onCloseRef.current = onCloseQuestion;

  const config = CATEGORY_CONFIG[currentQuestion.category] || CATEGORY_CONFIG.knowledge;
  const isMainPlayer = myPlayerId === currentQuestion.activePlayerId;

  const myPlayer = players.find((p) => p.id === myPlayerId);
  const hintsRemaining = myPlayer?.hintsRemaining ?? 2;
  const hasUsedHintThisQuestion =
    currentQuestion.hintUsedByPlayerIds?.includes(myPlayerId) || localHintRevealed;

  // 1. Fully Automated Countdown & Auto-Close Timer when showing_result
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

  const isHintVisible = isHost ? localHintRevealed : hasUsedHintThisQuestion;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border-4 border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className={`p-4 sm:p-5 flex items-center justify-between border-b ${config.borderClass} ${config.bgClass}`}>
          <div className="flex items-center gap-2.5">
            <span className={`px-2.5 py-1 rounded-full text-xs font-black shadow-xs ${config.badgeClass}`}>
              {currentQuestion.squareId === 1 ? 'BẮT ĐẦU' : `Ô ĐÍCH: Ô ${currentQuestion.squareId}`}
            </span>
            <div>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider block opacity-90">
                {config.label}
              </span>
              <h2 className="font-['Playfair_Display',serif] text-base sm:text-xl font-black text-slate-900 leading-tight">
                {currentQuestion.squareName}
              </h2>
            </div>
          </div>

          <div className="text-right shrink-0 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-full shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              Đi {currentQuestion.originalDiceValue} Ô
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          
          {/* Phase Banner for Active Answering */}
          {currentQuestion.phase === 'active_answering' && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 border border-slate-200">
              <div className="flex items-center gap-2.5">
                <div
                  style={{ backgroundColor: activePlayer.color }}
                  className="w-7 h-7 rounded-full text-white text-xs font-black flex items-center justify-center border-2 border-white shadow-xs"
                >
                  {activePlayer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    Người chơi chính đang trả lời
                  </p>
                  <p className="text-xs sm:text-sm font-extrabold text-slate-900">
                    {activePlayer.name} (Tung được {currentQuestion.originalDiceValue} ô)
                  </p>
                </div>
              </div>
              {isMainPlayer && (
                <span className="text-xs font-black px-2.5 py-1 rounded-full bg-indigo-600 text-white animate-pulse">
                  Lượt của bạn!
                </span>
              )}
            </div>
          )}

          {/* Question Text Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border-2 border-slate-200 shadow-inner space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <HelpCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-1">
                    Nội dung câu hỏi:
                  </p>
                  <p className="text-sm sm:text-base md:text-lg font-extrabold text-slate-900 leading-relaxed">
                    {currentQuestion.questionText}
                  </p>
                </div>
              </div>
            </div>

            {/* Hint Button & Quota (Each player has 2 hints per game) */}
            <div className="pt-2 border-t border-slate-200 flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleToggleHint}
                  disabled={!isHost && hintsRemaining <= 0 && !hasUsedHintThisQuestion}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs ${
                    isHost
                      ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 cursor-pointer'
                      : hasUsedHintThisQuestion
                      ? 'bg-amber-200 text-amber-950 border border-amber-400 cursor-pointer'
                      : hintsRemaining > 0
                      ? 'bg-amber-400 hover:bg-amber-500 text-slate-950 border border-amber-500 cursor-pointer active:scale-95'
                      : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
                  }`}
                >
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                  {isHost ? (
                    isHintVisible ? 'Ẩn gợi ý' : '💡 Xem gợi ý (Quản trò)'
                  ) : hasUsedHintThisQuestion ? (
                    isHintVisible ? 'Ẩn gợi ý đã mở' : '💡 Mở lại gợi ý'
                  ) : hintsRemaining > 0 ? (
                    `💡 DÙNG GỢI Ý (Còn ${hintsRemaining}/2 lượt)`
                  ) : (
                    '💡 ĐÃ HẾT LƯỢT GỢI Ý (0/2)'
                  )}
                </button>

                {!isHost && (
                  <span className="text-[11px] font-bold text-slate-500">
                    Mỗi người chơi có tối đa <strong>2 lượt gợi ý</strong> cả ván
                  </span>
                )}
              </div>

              {isHintVisible && (
                <div className="p-3.5 bg-amber-50 rounded-2xl border-2 border-amber-300 animate-fade-in space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-black text-amber-900 uppercase tracking-wider">
                      💡 GỢI Ý TỪ KHÓA ĐÁP ÁN:
                    </p>
                    <span className="text-[10px] text-amber-700 font-bold bg-amber-200/80 px-2 py-0.5 rounded">
                      Chỉ che bớt ký tự, không lộ toàn bộ
                    </span>
                  </div>
                  <div className="font-mono text-sm sm:text-base font-bold text-slate-900 tracking-wider whitespace-pre-line leading-relaxed bg-white/80 p-2.5 rounded-xl border border-amber-200">
                    {currentQuestion.hint || 'Chưa có gợi ý cho câu hỏi này.'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ============================================================== */}
          {/* RESULT DISPLAY BANNER: TỰ ĐỘNG THÔNG BÁO CHO TẤT CẢ NGƯỜI CHƠI */}
          {/* ============================================================== */}
          {currentQuestion.phase === 'showing_result' && (
            <div className={`p-5 rounded-2xl border-3 shadow-xl space-y-3 animate-fade-in ${
              currentQuestion.result === 'correct'
                ? 'bg-emerald-50 border-emerald-500 text-emerald-950'
                : 'bg-rose-50 border-rose-500 text-rose-950'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl shrink-0 ${
                  currentQuestion.result === 'correct'
                    ? 'bg-emerald-200 text-emerald-800'
                    : 'bg-rose-200 text-rose-800'
                }`}>
                  {currentQuestion.result === 'correct' ? (
                    <CheckCircle2 className="w-8 h-8" />
                  ) : (
                    <XCircle className="w-8 h-8" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight">
                    {currentQuestion.result === 'correct'
                      ? `🎉 CHÍNH XÁC! ${activePlayer.name} ĐÃ TRẢ LỜI ĐÚNG!`
                      : `❌ CHƯA ĐÚNG! ${activePlayer.name} ĐÃ TRẢ LỜI CHƯA CHÍNH XÁC!`}
                  </h3>
                  <p className="text-xs sm:text-sm font-semibold opacity-90">
                    {currentQuestion.result === 'correct'
                      ? `Quân cờ sẽ tiến ${currentQuestion.originalDiceValue} ô và nhận 1 lượt tung xúc xắc thưởng!`
                      : 'Quân cờ giữ nguyên vị trí và lượt chơi sẽ chuyển cho người tiếp theo.'}
                  </p>
                </div>
              </div>

              {/* Answers Inspection Box */}
              <div className="p-3.5 bg-white/95 backdrop-blur-xs rounded-xl border border-slate-200 space-y-2">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Câu trả lời của thí sinh:
                  </span>
                  <p className="text-sm font-extrabold text-slate-900 italic">
                    "{currentQuestion.playerAnswer || '(Chưa nhập)'}"
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <span className={`text-[10px] font-black uppercase tracking-wider block ${
                    currentQuestion.result === 'correct' ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    Đáp án chính xác của đề bài:
                  </span>
                  <p className="text-sm sm:text-base font-extrabold text-slate-950 font-mono">
                    {currentQuestion.officialAnswer}
                  </p>
                </div>
              </div>

              {/* Countdown & Action Button to close immediately */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-bold flex items-center gap-1.5 opacity-90">
                  <Clock className="w-4 h-4 animate-spin" />
                  Tự động đóng và tiếp tục sau <strong className="text-sm">{countdown}s</strong>...
                </span>
                <button
                  type="button"
                  onClick={onCloseQuestion}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-900 active:scale-95 text-white font-black text-xs sm:text-sm rounded-xl cursor-pointer shadow-md transition-all flex items-center gap-1.5"
                >
                  Tiếp tục ngay <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Answering Form for Active Player */}
          {currentQuestion.phase !== 'showing_result' && isMainPlayer && (
            <div className="p-4 rounded-2xl bg-indigo-50/80 border-2 border-indigo-200 space-y-3">
              <p className="text-xs font-black uppercase text-indigo-900">
                Lượt của bạn — Nhập câu trả lời rồi nhấn Gửi:
              </p>
              <form onSubmit={handleSubmitText} className="flex gap-2">
                <input
                  type="text"
                  value={answerInput}
                  onChange={(e) => setAnswerInput(e.target.value)}
                  placeholder="Gõ nội dung câu trả lời..."
                  disabled={isSubmitting}
                  autoFocus
                  className="flex-1 px-3.5 py-2.5 rounded-xl border-2 border-indigo-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-semibold bg-white"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !answerInput.trim()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95"
                >
                  <Send className="w-4 h-4" /> Gửi câu trả lời
                </button>
              </form>
            </div>
          )}

          {/* Host Spectator View: Quản trò ngồi xem câu hỏi và câu trả lời */}
          {isHost && currentQuestion.phase !== 'showing_result' && (
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3 border border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-amber-300">
                  <Eye className="w-4 h-4" />
                  <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide">
                    Màn Hình Quản Trò (Theo Dõi)
                  </h3>
                </div>

                {/* Hide / Reveal Answer Button */}
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setShowOfficialAnswer(!showOfficialAnswer);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all border border-slate-700"
                >
                  {showOfficialAnswer ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" /> Ẩn đáp án chuẩn
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5 text-amber-400" /> 👁️ Xem trước đáp án chuẩn
                    </>
                  )}
                </button>
              </div>

              {/* Official Answer Box for Host */}
              {showOfficialAnswer ? (
                <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 shadow-xs animate-fade-in">
                  <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-0.5">
                    ĐÁP ÁN CHÍNH THỨC CỦA ĐỀ BÀI:
                  </p>
                  <p className="text-sm sm:text-base font-extrabold text-white">
                    {currentQuestion.officialAnswer}
                  </p>
                </div>
              ) : (
                <div
                  onClick={() => {
                    sounds.playClick();
                    setShowOfficialAnswer(true);
                  }}
                  className="p-2.5 bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-dashed border-slate-700 text-center cursor-pointer transition-all"
                >
                  <p className="text-xs font-medium text-slate-300 flex items-center justify-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-amber-400" /> Bấm vào đây để xem trước đáp án chuẩn
                  </p>
                </div>
              )}

              <div className="p-2 bg-slate-800/60 rounded-lg text-center text-[11px] text-slate-400 font-medium">
                🤖 Máy sẽ tự động kiểm tra đáp án khi thí sinh bấm gửi, hiển thị kết quả và đóng câu hỏi.
              </div>
            </div>
          )}

          {/* Non-host, non-active player spectator info */}
          {!isHost && !isMainPlayer && currentQuestion.phase !== 'showing_result' && (
            <div className="p-3.5 rounded-xl bg-slate-100 text-center border border-slate-200">
              <p className="text-xs sm:text-sm font-bold text-slate-600 flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                Đang chờ {activePlayer.name} trả lời câu hỏi...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
