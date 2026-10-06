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
} from 'lucide-react';

interface QuestionModalProps {
  currentQuestion: CurrentQuestionState;
  activePlayer: Player;
  isHost: boolean;
  isCurrentPlayer: boolean;
  onSubmitAnswer: (answerText: string) => void;
  onEvaluate: (isCorrect: boolean) => void;
}

export const QuestionModal: React.FC<QuestionModalProps> = ({
  currentQuestion,
  activePlayer,
  isHost,
  isCurrentPlayer,
  onSubmitAnswer,
  onEvaluate,
}) => {
  const [answerInput, setAnswerInput] = useState('');
  const [showOfficialAnswer, setShowOfficialAnswer] = useState(false);
  const [showScoreBadge, setShowScoreBadge] = useState<string | null>(null);

  const config = CATEGORY_CONFIG[currentQuestion.category] || CATEGORY_CONFIG.knowledge;
  const isScenario = currentQuestion.category === 'scenario';
  const pointValue = isScenario ? 2 : 1;

  useEffect(() => {
    if (currentQuestion.status === 'resolved') {
      setShowOfficialAnswer(true); // Reveal official answer to everyone once graded
      if (currentQuestion.result === 'correct') {
        setShowScoreBadge(`+${currentQuestion.awardedPoints ?? pointValue} ĐIỂM`);
        sounds.playCorrect();
      } else {
        setShowScoreBadge(`+0 ĐIỂM`);
        sounds.playIncorrect();
      }
    }
  }, [currentQuestion.status, currentQuestion.result, currentQuestion.awardedPoints, pointValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerInput.trim()) return;
    sounds.playClick();
    onSubmitAnswer(answerInput.trim());
  };

  const handleGrade = (correct: boolean) => {
    sounds.playClick();
    onEvaluate(correct);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border-4 border-amber-400 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className={`p-4 sm:p-5 flex items-center justify-between border-b-2 ${config.borderClass} ${config.bgClass}`}>
          <div className="flex items-center gap-2.5">
            <span className={`px-2.5 py-1 rounded-full text-xs font-black shadow-xs ${config.badgeClass}`}>
              {currentQuestion.squareId === 1 ? 'BẮT ĐẦU' : `Ô ${currentQuestion.squareId}`}
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

          <div className="text-right shrink-0">
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-400 text-red-950 font-black text-xs sm:text-sm rounded-full shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              {pointValue} Điểm
            </span>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          
          {/* Active Player Indicator */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/80 border border-amber-200">
            <div className="flex items-center gap-2">
              <div
                style={{ backgroundColor: activePlayer.color }}
                className="w-6 h-6 rounded-full text-white text-xs font-black flex items-center justify-center border border-white"
              >
                {activePlayer.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs sm:text-sm font-extrabold text-slate-800">
                Lượt trả lời của: <span className="text-red-700">{activePlayer.name}</span>
              </span>
            </div>
            {isCurrentPlayer && (
              <span className="text-[11px] font-black px-2 py-0.5 rounded bg-red-600 text-white animate-pulse">
                Bạn trả lời!
              </span>
            )}
          </div>

          {/* Question Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border-2 border-slate-200 shadow-inner">
            <div className="flex items-start gap-2.5">
              <HelpCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-1">
                  Câu hỏi dành cho người chơi:
                </p>
                <p className="text-sm sm:text-base md:text-lg font-extrabold text-slate-900 leading-relaxed">
                  {currentQuestion.questionText}
                </p>
              </div>
            </div>
          </div>

          {/* Player Written Answer (if typed or submitted) */}
          {currentQuestion.playerAnswer && (
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200">
              <p className="text-xs text-blue-700 font-bold uppercase mb-0.5">
                Câu trả lời của {activePlayer.name}:
              </p>
              <p className="text-sm font-semibold text-blue-950 italic">
                "{currentQuestion.playerAnswer}"
              </p>
            </div>
          )}

          {/* Active player typing answer box */}
          {isCurrentPlayer && !currentQuestion.playerAnswer && currentQuestion.status !== 'resolved' && (
            <form onSubmit={handleSubmit} className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Nhập câu trả lời của bạn (hoặc trả lời trực tiếp trước lớp):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={answerInput}
                  onChange={(e) => setAnswerInput(e.target.value)}
                  placeholder="Gõ câu trả lời tại đây..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl border-2 border-amber-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none text-sm font-medium"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                >
                  <Send className="w-4 h-4" /> Gửi
                </button>
              </div>
            </form>
          )}

          {/* Host Evaluation Section */}
          {isHost ? (
            <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-amber-900">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide">
                    Dành cho Host (Người điều phối)
                  </h3>
                </div>

                {/* Hide / Reveal Answer Button for Host */}
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setShowOfficialAnswer(!showOfficialAnswer);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-200/80 hover:bg-amber-300 text-amber-950 text-xs font-extrabold flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                >
                  {showOfficialAnswer ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" /> Ẩn đáp án
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5 text-amber-800" /> 👁️ Xem đáp án gợi ý
                    </>
                  )}
                </button>
              </div>

              {/* Official Answer Box */}
              {showOfficialAnswer ? (
                <div className="p-3 bg-white rounded-xl border border-amber-200 shadow-xs animate-fade-in">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                    ĐÁP ÁN GỢI Ý / ĐÁP ÁN CHÍNH THỨC:
                  </p>
                  <p className="text-sm sm:text-base font-black text-emerald-800">
                    {currentQuestion.officialAnswer}
                  </p>
                </div>
              ) : (
                <div
                  onClick={() => {
                    sounds.playClick();
                    setShowOfficialAnswer(true);
                  }}
                  className="p-3 bg-white/70 hover:bg-white rounded-xl border border-dashed border-amber-300 text-center cursor-pointer transition-all"
                >
                  <p className="text-xs font-bold text-amber-800 flex items-center justify-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" /> Đáp án đang được ẩn (Bấm vào đây để xem trước khi chấm)
                  </p>
                </div>
              )}

              {/* Grading Buttons */}
              {currentQuestion.status !== 'resolved' ? (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={() => handleGrade(true)}
                    className="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm sm:text-base shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    ✅ ĐÚNG (+{pointValue}đ)
                  </button>
                  <button
                    onClick={() => handleGrade(false)}
                    className="py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-black text-sm sm:text-base shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
                  >
                    <XCircle className="w-5 h-5" />
                    ❌ CHƯA ĐÚNG (+0đ)
                  </button>
                </div>
              ) : (
                <div className="text-center py-2 font-bold text-xs text-slate-600">
                  Đã chấm điểm xong, đang chuyển lượt...
                </div>
              )}
            </div>
          ) : (
            /* Non-host view */
            <div className="p-3.5 rounded-xl bg-slate-100 text-center border border-slate-200">
              {currentQuestion.status === 'resolved' ? (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Đáp án chính thức:</p>
                  <p className="text-sm sm:text-base font-extrabold text-emerald-800 mt-1">
                    {currentQuestion.officialAnswer}
                  </p>
                </div>
              ) : (
                <p className="text-xs sm:text-sm font-bold text-slate-600 flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  Đang chờ Host lắng nghe câu trả lời và chấm điểm...
                </p>
              )}
            </div>
          )}

          {/* Point Popup Animation */}
          {showScoreBadge && (
            <div className="py-2 text-center animate-bounce">
              <span
                className={`inline-block px-5 py-2 rounded-2xl text-base sm:text-lg font-black shadow-lg ${
                  showScoreBadge.includes('+0')
                    ? 'bg-rose-100 text-rose-700 border-2 border-rose-300'
                    : 'bg-emerald-500 text-white border-2 border-emerald-300'
                }`}
              >
                🎉 {showScoreBadge}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
