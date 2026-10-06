import React, { useState, useEffect } from 'react';
import { sounds } from '../utils/audio';
import { Dices, Sparkles, Flame } from 'lucide-react';

interface Dice3DProps {
  diceValue: number | null;
  isRolling: boolean;
  canRoll: boolean;
  isBonusRoll?: boolean;
  onRoll: () => void;
  activePlayerName: string;
  isHost?: boolean;
}

export const Dice3D: React.FC<Dice3DProps> = ({
  diceValue,
  isRolling,
  canRoll,
  isBonusRoll = false,
  onRoll,
  activePlayerName,
  isHost = false,
}) => {
  const [displayValue, setDisplayValue] = useState<number>(diceValue || 1);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);

  // Sync incoming diceValue
  useEffect(() => {
    if (!isSpinning && diceValue) {
      setDisplayValue(diceValue);
    }
  }, [diceValue, isSpinning]);

  const handleRollClick = () => {
    if (!canRoll || isRolling || isSpinning) return;
    
    // Immediate 0ms local response
    sounds.playClick();
    sounds.playDiceRoll();
    setIsSpinning(true);

    const spinInterval = setInterval(() => {
      setDisplayValue(Math.floor(Math.random() * 6) + 1);
    }, 60);

    // Call server roll
    onRoll();

    // Settle animation
    setTimeout(() => {
      clearInterval(spinInterval);
      setIsSpinning(false);
      if (diceValue) {
        setDisplayValue(diceValue);
      }
    }, 450);
  };

  const renderDicePips = (val: number) => {
    const pips: React.ReactNode[] = [];
    const positions: Record<number, number[]> = {
      1: [4],
      2: [0, 8],
      3: [0, 4, 8],
      4: [0, 2, 6, 8],
      5: [0, 2, 4, 6, 8],
      6: [0, 2, 3, 5, 6, 8],
    };

    const activeIndices = new Set(positions[val] || [4]);

    for (let i = 0; i < 9; i++) {
      pips.push(
        <div key={i} className="flex items-center justify-center w-full h-full">
          {activeIndices.has(i) && (
            <div
              className={`w-3 h-3 rounded-full transition-transform ${
                isBonusRoll
                  ? 'bg-emerald-700'
                  : val === 1
                  ? 'bg-emerald-800 scale-110'
                  : 'bg-stone-700'
              }`}
            />
          )}
        </div>
      );
    }
    return pips;
  };

  return (
    <div className={`p-4 rounded-2xl border transition-all flex flex-col items-center justify-center gap-3 ${
      isBonusRoll
        ? 'bg-emerald-50/70 border-emerald-200'
        : 'bg-white border-emerald-100/80 shadow-xs'
    }`}>
      {/* Badge thưởng */}
      {isBonusRoll && (
        <div className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-xs flex items-center gap-1">
          <Flame className="w-3.5 h-3.5 text-emerald-600" />
          <span>Tung xúc xắc thưởng</span>
        </div>
      )}

      {/* Viên xúc xắc */}
      <div className="relative my-1">
        <div
          className={`w-16 h-16 bg-white rounded-xl border p-2 grid grid-cols-3 grid-rows-3 transition-transform duration-200 ${
            isBonusRoll ? 'border-emerald-400 shadow-xs' : 'border-stone-200 shadow-xs'
          } ${isSpinning ? 'rotate-180 scale-105 ring-2 ring-emerald-500 animate-spin' : 'hover:scale-102'}`}
        >
          {renderDicePips(displayValue)}
        </div>

        {diceValue && !isSpinning && (
          <div className="absolute -top-2 -right-2 bg-emerald-700 text-white font-bold text-xs px-2 py-0.2 rounded-full shadow-xs flex items-center gap-0.5">
            <Sparkles className="w-3 h-3 text-emerald-200" />
            {diceValue}
          </div>
        )}
      </div>

      {/* Nút hành động hoặc thông báo chờ */}
      {canRoll ? (
        <button
          onClick={handleRollClick}
          disabled={isRolling || isSpinning}
          className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm tracking-wide shadow-xs cursor-pointer transition-all flex items-center justify-center gap-1.5 active:scale-98 ${
            isBonusRoll
              ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
              : 'bg-stone-800 hover:bg-stone-900 text-white'
          }`}
        >
          <Dices className="w-4 h-4" />
          {isBonusRoll ? 'Tung xúc xắc thưởng' : 'Tung xúc xắc'}
        </button>
      ) : (
        <div className="w-full py-2 px-3 rounded-xl bg-stone-50 border border-stone-200/60 text-stone-600 text-xs text-center flex items-center justify-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
          {isHost ? (
            <span>Lượt của <strong className="text-stone-900">{activePlayerName}</strong></span>
          ) : (
            <span>Đang chờ <strong className="text-stone-900">{activePlayerName}</strong> tung xúc xắc...</span>
          )}
        </div>
      )}
    </div>
  );
};
