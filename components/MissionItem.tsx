import React from 'react';
import { MissionDefinition, MissionState } from '../types';
import { formatMoney, formatNumber } from '../utils';

interface Props {
  mission: MissionDefinition;
  state: MissionState;
  onClaim: (id: string) => void;
  progressText: string;
  progressPercent: number;
}

const MissionItem: React.FC<Props> = React.memo(({ mission, state, onClaim, progressText, progressPercent }) => {
  return (
    <div className={`p-4 rounded-xl border flex flex-col md:flex-row justify-between items-center gap-4 transition-all
      ${state.completed 
        ? (state.claimed ? 'bg-slate-800/50 border-slate-700 opacity-60' : 'bg-gradient-to-r from-emerald-900/40 to-slate-800 border-emerald-500/50 shadow-lg shadow-emerald-900/20') 
        : 'bg-slate-800 border-slate-700'
      }`}>
      
      <div className="flex-grow w-full md:w-auto">
        <div className="flex items-center gap-2 mb-1">
          <h4 className={`font-bold ${state.completed && !state.claimed ? 'text-emerald-400' : 'text-slate-200'}`}>
            {mission.title}
          </h4>
          {state.claimed && <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">Claimed</span>}
        </div>
        <p className="text-sm text-slate-400 mb-2">{mission.description}</p>
        
        {/* Progress Bar */}
        {!state.claimed && (
          <div className="w-full max-w-md">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Progress</span>
              <span>{progressText}</span>
            </div>
            <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${state.completed ? 'bg-emerald-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
        <div className="text-right mr-2">
          <div className="text-xs text-slate-500 uppercase">Reward</div>
          <div className={`font-bold ${mission.rewardType === 'gems' ? 'text-cyan-400' : mission.rewardType === 'legacy' ? 'text-purple-400' : 'text-emerald-400'}`}>
            {mission.rewardType === 'gems' && '💎 '}
            {mission.rewardType === 'legacy' && '✨ '}
            {mission.rewardType === 'money' ? formatMoney(mission.rewardValue) : formatNumber(mission.rewardValue)}
          </div>
        </div>

        <button
          onClick={() => onClaim(mission.id)}
          disabled={!state.completed || state.claimed}
          className={`px-6 py-2 rounded-lg font-bold text-sm transition-all transform active:scale-95
            ${state.claimed 
              ? 'bg-transparent border border-slate-600 text-slate-500 cursor-default hidden md:block' 
              : state.completed 
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 animate-pulse' 
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
        >
          {state.claimed ? 'Done' : 'Claim'}
        </button>
      </div>
    </div>
  );
});

export default MissionItem;