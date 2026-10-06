import React, { useState, useEffect } from 'react';
import { CurrentQuestionState, Player } from '../types/game';
import { CATEGORY_CONFIG } from '../questions/boardData';
import { sounds } from '../utils/audio';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  Send,
  ShieldCheck,
  Eye,
  EyeOff,
  Mic,
  MessageSquare,
  Clock,
  Zap,
  Lightbulb,
  UserX,
  Flame,
} from 'lucide-react';

interface QuestionModalProps {
  currentQuestion: CurrentQuestionState;
  activePlayer: Player;
  players: Player[];
  myPlayerId: string;
  isHost: boolean;
  onAnswerSubmit: (answerText: string) => void;
  onEvaluateMain: (isCorrect: boolean) => void;
  onBuzzToSteal: () => void;
  onEvaluateSteal: (isCorrect: boolean) => void;
  onUseHint: () => void;
}

export const QuestionModal: React.FC<QuestionModalProps> = ({
  currentQuestion,
  activePlayer,
  players,
  myPlayerId,
  isHost,
  onAnswerSubmit,
  onEvaluateMain,
  onBuzzToSteal,
  onEvaluateSteal,
  onUseHint,
}) => {
  const [answerInput, setAnswerInput] = useState('');
  const [showOfficialAnswer, setShowOfficialAnswer] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(10);
  const [localHintRevealed, setLocalHintRevealed] = useState(false);

  const config = CATEGORY_CONFIG[currentQuestion.category] || CATEGORY_CONFIG.knowledge;
  const isMainPlayer = myPlayerId === currentQuestion.activePlayerId;
  const stealer = players.find((p) => p.id === currentQuestion.stolenByPlayerId);
  const isStealer = myPlayerId === currentQuestion.stolenByPlayerId;
  const isDisqualified = currentQuestion.disqualifiedPlayerIds?.includes(myPlayerId);
  const canBuzz =
    currentQuestion.phase === 'stealing_open' &&
    !isMainPlayer &&
    !isDisqualified &&
    !isHost;

  const myPlayer = players.find((p) => p.id === myPlayerId);
  const hintsRemaining = myPlayer?.hintsRemaining ?? 2;
  const hasUsedHintThisQuestion =
    currentQuestion.hintUsedByPlayerIds?.includes(myPlayerId) || localHintRevealed;

  // 10s Countdown Timer for Stealer Phase
  useEffect(() => {
    if (currentQuestion.phase === 'stealer_answering' && currentQuestion.stealStartTime) {
      const updateCountdown = () => {
        const elapsed = (Date.now() - (currentQuestion.stealStartTime || Date.now())) / 1000;
        const remaining = Math.max(0, Math.ceil(10 - elapsed));
        setTimeLeft(remaining);

        if (remaining <= 0 && isHost) {
          // Auto evaluate steal as timeout/incorrect if timer expires
          onEvaluateSteal(false);
        }
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 500);
      return () => clearInterval(interval);
    } else {
      setTimeLeft(10);
    }
  }, [currentQuestion.phase, currentQuestion.stealStartTime, isHost]);

  // Audio cues on phase shifts
  useEffect(() => {
    if (currentQuestion.phase === 'stealing_open') {
      sounds.playIncorrect();
    } else if (currentQuestion.phase === 'stealer_answering') {
      sounds.playClick();
    }
  }, [currentQuestion.phase]);

  const handleSubmitText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerInput.trim()) return;
    sounds.playClick();
    onAnswerSubmit(answerInput.trim());
  };

  const handleSpokenAnswer = () => {
    sounds.playClick();
    onAnswerSubmit('Đã trả lời trực tiếp trước lớp / qua mic');
  };

  const handleBuzzClick = () => {
    sounds.playClick();
    onBuzzToSteal();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-sm animate-fade-in select-none">
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
          
          {/* Phase Banner */}
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
                    Người chơi chính trả lời
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

          {currentQuestion.phase === 'stealing_open' && (
            <div className="p-3.5 rounded-2xl bg-amber-500 text-slate-950 border-2 border-amber-600 flex items-center justify-between animate-pulse shadow-md">
              <div className="flex items-center gap-2.5">
                <Zap className="w-6 h-6 text-slate-950 shrink-0" />
                <div>
                  <p className="font-black text-sm uppercase tracking-wide">
                    ⚡ CƠ HỘI CƯỚP CÂU HỎI MỞ RA!
                  </p>
                  <p className="text-xs font-bold text-slate-900">
                    Người chơi chính trả lời chưa đúng. Bấm nhanh nhất để giành quyền đi {currentQuestion.originalDiceValue} ô!
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentQuestion.phase === 'stealer_answering' && stealer && (
            <div className="p-3.5 rounded-2xl bg-indigo-900 text-white border-2 border-indigo-700 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2.5">
                <div
                  style={{ backgroundColor: stealer.color }}
                  className="w-8 h-8 rounded-full text-white text-sm font-black flex items-center justify-center border-2 border-white shadow"
                >
                  {stealer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-amber-300 tracking-wider">
                    ĐÃ GIÀNH QUYỀN TRẢ LỜI
                  </p>
                  <p className="text-sm font-extrabold text-white">
                    {stealer.name} {isStealer && '(Bạn)'}
                  </p>
                </div>
              </div>

              {/* 10-Second Countdown Timer Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-amber-400/50">
                <Clock className={`w-4 h-4 ${timeLeft <= 3 ? 'text-rose-500 animate-spin' : 'text-amber-400'}`} />
                <span className={`text-base sm:text-lg font-black ${timeLeft <= 3 ? 'text-rose-400 animate-ping' : 'text-amber-300'}`}>
                  {timeLeft}s
                </span>
              </div>
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
                    {currentQuestion.hint || 'D__ là ch__ và d__ làm ch__'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stealing Buzzer Action Area for Opponents */}
          {currentQuestion.phase === 'stealing_open' && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-center space-y-3 shadow-lg border-2 border-amber-600 animate-bounce">
              {canBuzz ? (
                <button
                  onClick={handleBuzzClick}
                  className="w-full py-4 px-6 bg-slate-950 hover:bg-slate-900 active:scale-95 text-white font-black text-base sm:text-xl rounded-2xl shadow-2xl flex items-center justify-center gap-3 cursor-pointer transition-transform border-2 border-amber-300"
                >
                  <Flame className="w-6 h-6 text-amber-400 animate-pulse" />
                  ⚡ BẤM ĐỂ TRẢ LỜI ⚡
                </button>
              ) : isMainPlayer ? (
                <p className="text-xs sm:text-sm font-bold text-slate-950">
                  Bạn là người chơi chính câu này, đang mở quyền cướp cho các đối thủ...
                </p>
              ) : isDisqualified ? (
                <p className="text-xs sm:text-sm font-bold text-slate-950 flex items-center justify-center gap-1.5">
                  <UserX className="w-4 h-4 text-rose-900" /> Bạn đã trả lời sai câu này và bị loại khỏi lượt cướp.
                </p>
              ) : (
                <p className="text-xs sm:text-sm font-bold text-slate-950">
                  Đang chờ các đối thủ bấm nút giành quyền trả lời...
                </p>
              )}
            </div>
          )}

          {/* Player Answer Display (Synced in real-time) */}
          <div className="p-4 rounded-2xl bg-blue-50/70 border-2 border-blue-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                Câu trả lời của {currentQuestion.phase === 'stealer_answering' && stealer ? stealer.name : activePlayer.name}:
              </span>
              {currentQuestion.playerAnswer ? (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-200 text-blue-800">
                  Đã gửi
                </span>
              ) : (
                <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400 animate-spin" /> Đang đợi trả lời...
                </span>
              )}
            </div>

            {currentQuestion.playerAnswer ? (
              <p className="text-sm sm:text-base font-bold text-blue-950 italic bg-white p-3 rounded-xl border border-blue-200">
                "{currentQuestion.playerAnswer}"
              </p>
            ) : (
              <p className="text-xs text-slate-500 italic py-1">
                (Thí sinh có thể gõ câu trả lời vào máy hoặc đứng lên phát biểu trực tiếp trước lớp)
              </p>
            )}
          </div>

          {/* Answering Form for Active Player or Stealer */}
          {((currentQuestion.phase === 'active_answering' && isMainPlayer) ||
            (currentQuestion.phase === 'stealer_answering' && isStealer)) &&
            !currentQuestion.playerAnswer && (
              <div className="p-4 rounded-2xl bg-indigo-50/80 border-2 border-indigo-200 space-y-3">
                <p className="text-xs font-black uppercase text-indigo-900">
                  Lượt của bạn — Hãy đưa ra câu trả lời {currentQuestion.phase === 'stealer_answering' && `(còn ${timeLeft}s)`}:
                </p>
                <form onSubmit={handleSubmitText} className="flex gap-2">
                  <input
                    type="text"
                    value={answerInput}
                    onChange={(e) => setAnswerInput(e.target.value)}
                    placeholder="Gõ nội dung câu trả lời..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl border-2 border-indigo-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-semibold bg-white"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95"
                  >
                    <Send className="w-4 h-4" /> Gửi
                  </button>
                </form>

                <div className="flex items-center justify-between pt-1 border-t border-indigo-200">
                  <span className="text-[11px] text-indigo-700 font-medium">Hoặc phát biểu trực tiếp:</span>
                  <button
                    type="button"
                    onClick={handleSpokenAnswer}
                    className="px-3 py-1.5 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-900 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Mic className="w-3.5 h-3.5" /> Xác nhận đã trả lời miệng
                  </button>
                </div>
              </div>
            )}

          {/* Host Evaluation Panel */}
          {isHost ? (
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3 border border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-amber-300">
                  <ShieldCheck className="w-4 h-4" />
                  <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide">
                    Bảng Chấm Điểm (Dành cho Quản Trò)
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
                      <EyeOff className="w-3.5 h-3.5" /> Ẩn đáp án
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5 text-amber-400" /> 👁️ Xem đáp án chuẩn
                    </>
                  )}
                </button>
              </div>

              {/* Official Answer Box */}
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

              {/* Evaluation Buttons depending on phase */}
              {currentQuestion.phase === 'active_answering' && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={() => {
                      sounds.playCorrect();
                      onEvaluateMain(true);
                    }}
                    className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    ✅ ĐÚNG (Đi {currentQuestion.originalDiceValue} ô + Tung thưởng)
                  </button>
                  <button
                    onClick={() => {
                      sounds.playIncorrect();
                      onEvaluateMain(false);
                    }}
                    className="py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
                  >
                    <XCircle className="w-5 h-5" />
                    ❌ CHƯA ĐÚNG (Mở cướp)
                  </button>
                </div>
              )}

              {currentQuestion.phase === 'stealing_open' && (
                <div className="text-center py-2 text-xs font-bold text-amber-300">
                  ⚡ Đang chờ người chơi bấm cướp quyền trả lời...
                </div>
              )}

              {currentQuestion.phase === 'stealer_answering' && stealer && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={() => {
                      sounds.playCorrect();
                      onEvaluateSteal(true);
                    }}
                    className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    ✅ {stealer.name} ĐÚNG (Đi {currentQuestion.originalDiceValue} ô)
                  </button>
                  <button
                    onClick={() => {
                      sounds.playIncorrect();
                      onEvaluateSteal(false);
                    }}
                    className="py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
                  >
                    <XCircle className="w-5 h-5" />
                    ❌ {stealer.name} SAI / HẾT GIỜ
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Non-host view */
            <div className="p-3.5 rounded-xl bg-slate-100 text-center border border-slate-200">
              <p className="text-xs sm:text-sm font-bold text-slate-600 flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                Quản trò đang theo dõi và đối chiếu kết quả...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
