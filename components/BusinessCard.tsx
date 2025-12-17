import React from 'react';
import { Business } from '../types';
import { formatMoney } from '../utils';

interface Props {
  business: Business;
  onBuy: (amount: number) => void;
  onHire: () => void;
  canAfford: (cost: number) => boolean;
  canAffordManager: boolean;
  buyCost1: number;
  buyCost10: number;
  currentIncome: number;
  currentCycleTime: number;
}

const BusinessCard: React.FC<Props> = React.memo(({
  business,
  onBuy,
  onHire,
  canAfford,
  canAffordManager,
  buyCost1,
  buyCost10,
  currentIncome,
  currentCycleTime,
}) => {
  const isLocked = business.level === 0 && business.id > 0 && !canAfford(buyCost1);

  // Format cycle time nicely
  const formattedTime = currentCycleTime < 1 
    ? `${(currentCycleTime * 1000).toFixed(0)}ms`
    : `${currentCycleTime.toFixed(2)}s`;

  return (
    <div className={`relative p-4 rounded-xl border border-slate-700 bg-slate-800/50 shadow-lg transition-all duration-300 ${isLocked ? 'opacity-50 grayscale' : 'hover:border-slate-500'}`}>
      <div className="flex items-center gap-4">
        {/* Icon Area */}
        <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center bg-slate-900 rounded-lg text-4xl shadow-inner border border-slate-700">
          {business.icon}
        </div>

        {/* Info Area */}
        <div className="flex-grow min-w-0">
          <div className="flex justify-between items-baseline mb-1">
            <h3 className="text-lg font-bold text-slate-100 truncate">{business.name}</h3>
            <span className="text-sm font-mono text-cyan-400">Lv {business.level}</span>
          </div>
          
          {/* Progress Bar */}
          <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden mb-2 relative">
            <div
              className={`h-full ${business.hasManager ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-amber-500'}`}
              style={{ width: `${business.progress}%` }}
            />
          </div>
          
          <div className="flex justify-between text-xs text-slate-400 font-mono">
            <span className={business.level > 0 ? "text-emerald-400 font-bold" : ""}>
              {formatMoney(currentIncome)} / cycle
            </span>
            <span className="text-cyan-200">
              {formattedTime}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <button
          onClick={() => onBuy(1)}
          disabled={!canAfford(buyCost1)}
          className={`px-2 py-2 rounded-lg text-xs font-bold transition-colors border flex flex-col items-center justify-center
            ${canAfford(buyCost1) 
              ? 'bg-amber-600 border-amber-500 text-white hover:bg-amber-500 active:scale-95' 
              : 'bg-slate-700 border-slate-600 text-slate-400 cursor-not-allowed'}`}
        >
          <span>Buy x1</span>
          <span className="font-mono opacity-80">{formatMoney(buyCost1)}</span>
        </button>

        <button
          onClick={() => onBuy(10)}
          disabled={!canAfford(buyCost10)}
          className={`px-2 py-2 rounded-lg text-xs font-bold transition-colors border flex flex-col items-center justify-center
            ${canAfford(buyCost10)
              ? 'bg-amber-700 border-amber-600 text-white hover:bg-amber-600 active:scale-95'
              : 'bg-slate-700 border-slate-600 text-slate-400 cursor-not-allowed'}`}
        >
          <span>Buy x10</span>
          <span className="font-mono opacity-80">{formatMoney(buyCost10)}</span>
        </button>

        <button
          onClick={onHire}
          disabled={business.hasManager || !canAffordManager}
          className={`px-2 py-2 rounded-lg text-xs font-bold transition-colors border flex flex-col items-center justify-center
            ${business.hasManager
              ? 'bg-emerald-900/50 border-emerald-800 text-emerald-400 cursor-default'
              : canAffordManager
                ? 'bg-cyan-600 border-cyan-500 text-white hover:bg-cyan-500 active:scale-95'
                : 'bg-slate-700 border-slate-600 text-slate-400 cursor-not-allowed'
            }`}
        >
          {business.hasManager ? (
            <span>Auto Active</span>
          ) : (
            <>
              <span>Manager</span>
              <span className="font-mono opacity-80">{formatMoney(business.managerCost)}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
});

export default BusinessCard;