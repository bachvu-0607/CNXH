import React, { useState, useEffect } from 'react';
import { sounds } from '../utils/audio';
import { Dices, Sparkles } from 'lucide-react';

interface Dice3DProps {
  diceValue: number | null;
  isRolling: boolean;
  canRoll: boolean;
  onRoll: () => void;
  activePlayerName: string;
}

export const Dice3D: React.FC<Dice3DProps> = ({
  diceValue,
  isRolling,
  canRoll,
  onRoll,
  activePlayerName,
}) => {
  const [displayValue, setDisplayValue] = useState<number>(diceValue || 1);
  const [animating, setAnimating] = useState<boolean>(false);

  useEffect(() => {
    if (isRolling) {
      setAnimating(true);
      sounds.playDiceRoll();
      const interval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 6) + 1);
      }, 100);

      const timeout = setTimeout(() => {
        clearInterval(interval);
        setAnimating(false);
        if (diceValue) {
          setDisplayValue(diceValue);
        }
      }, 900);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    } else if (diceValue) {
      setDisplayValue(diceValue);
      setAnimating(false);
    }
  }, [isRolling, diceValue]);

  const handleRollClick = () => {
    if (!canRoll || isRolling || animating) return;
    sounds.playClick();
    onRoll();
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
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full shadow-inner transition-transform ${
                val === 1 ? 'bg-indigo-900 scale-120 ring-2 ring-indigo-300' : 'bg-slate-800'
              }`}
            />
          )}
        </div>
      );
    }
    return pips;
  };

  return (
    <div className="flex flex-col items-center justify-center p-3 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-lg">
      {/* Academic Ivory Minimalist Dice Cube */}
      <div className="relative mb-3 flex items-center justify-center">
        <div
          className={`w-18 h-18 sm:w-20 sm:h-20 bg-gradient-to-br from-white via-slate-50 to-slate-200 rounded-2xl border-2 border-slate-300 shadow-md p-2.5 sm:p-3 grid grid-cols-3 grid-rows-3 transition-transform duration-300 ${
            animating ? 'rotate-180 scale-105 ring-2 ring-indigo-500 animate-spin' : 'hover:scale-105'
          }`}
          style={{
            boxShadow: '0 8px 16px -4px rgba(15,23,42,0.15), inset 0 2px 4px rgba(255,255,255,0.9)',
          }}
        >
          {renderDicePips(displayValue)}
        </div>

        {diceValue && !animating && (
          <div className="absolute -top-2 -right-2 bg-slate-900 text-amber-300 font-black text-xs px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 border border-slate-700">
            <Sparkles className="w-3 h-3 text-amber-400" />
            {diceValue}
          </div>
        )}
      </div>

      {/* Action Button / Waiting Status */}
      {canRoll ? (
        <button
          onClick={handleRollClick}
          disabled={isRolling || animating}
          className="w-full py-3 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-extrabold text-sm tracking-wide shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 border border-slate-700"
        >
          <Dices className="w-4 h-4 text-amber-400" />
          🎲 TUNG XÚC XẮC
        </button>
      ) : (
        <div className="w-full py-2 px-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold text-center flex items-center justify-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
          Đang chờ <span className="font-extrabold text-slate-900 mx-1">{activePlayerName}</span> tung...
        </div>
      )}
    </div>
  );
};
