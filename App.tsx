import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Business, GameState, FloatingText, Toast, UpgradeItem, MissionDefinition } from './types';
import { INITIAL_BUSINESSES, UPGRADES, LEGACY_UPGRADES, PRESTIGE_THRESHOLD, MISSIONS } from './constants';
import { formatMoney, calculatePrestigePoints, formatNumber } from './utils';
import BusinessCard from './components/BusinessCard';
import FloatingTexts from './components/FloatingTexts';
import MissionItem from './components/MissionItem';
import GemSpawn from './components/GemSpawn';

const STORAGE_KEY = 'money_empire_save_react_v1';

// Initial state creator
const getInitialState = (): GameState => ({
  money: 0,
  gems: 0,
  legacyPoints: 0,
  totalEarned: 0,
  prestigeMultiplier: 1,
  startTime: Date.now(),
  businesses: JSON.parse(JSON.stringify(INITIAL_BUSINESSES)),
  upgrades: {},
  missions: {},
  lastSaveTime: Date.now(),
});

const App: React.FC = () => {
  // Game State
  const [gameState, setGameState] = useState<GameState>(getInitialState);
  const [historyData, setHistoryData] = useState<{ time: string; value: number }[]>([]);
  
  // UI State
  const [activeTab, setActiveTab] = useState<'businesses' | 'research' | 'missions' | 'legacy'>('businesses');
  const [showPrestigeModal, setShowPrestigeModal] = useState(false);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Gem Spawn State
  const [activeGem, setActiveGem] = useState<{ id: number; x: number; y: number } | null>(null);

  // Refs for Game Loop
  const stateRef = useRef(gameState);
  const activeGemRef = useRef(activeGem);
  const lastTickRef = useRef(Date.now());
  const requestRef = useRef<number>(0);
  const historyTimerRef = useRef(0);
  const missionCheckTimerRef = useRef(0);
  const gemSpawnTimerRef = useRef(0);

  // Sync ref with state on manual updates (purchases, etc)
  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    activeGemRef.current = activeGem;
  }, [activeGem]);

  // Helper: Toast
  const addToast = useCallback((message: string, type: Toast['type']) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  // Helper: Floating Text
  const spawnFloatingText = useCallback((x: number, y: number, text: string, color: string = '#fbbf24') => {
    const id = Date.now() + Math.random();
    setFloatingTexts(prev => [...prev, { id, x, y, text, color }]);
    setTimeout(() => setFloatingTexts(prev => prev.filter(t => t.id !== id)), 1000);
  }, []);

  // Load Save
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge with initial to ensure new fields exist
        const merged = { ...getInitialState(), ...parsed };
        
        // Ensure missions object exists if loading old save
        if (!merged.missions) merged.missions = {};

        // Calculate offline earnings
        const now = Date.now();
        const diffSeconds = (now - merged.lastSaveTime) / 1000;
        if (diffSeconds > 10) {
          let offlineEarnings = 0;
          merged.businesses.forEach((b: Business) => {
            if (b.hasManager && b.level > 0) {
               // Simple approximation: (income / cycle) * seconds
               const cps = b.baseIncome * b.level / b.cycleTime;
               offlineEarnings += cps * diffSeconds;
            }
          });
          
          if (offlineEarnings > 0) {
            merged.money += offlineEarnings;
            merged.totalEarned += offlineEarnings;
            addToast(`Offline Earnings: ${formatMoney(offlineEarnings)}`, 'success');
          }
        }
        
        setGameState(merged);
        stateRef.current = merged;
      } catch (e) {
        console.error("Failed to load save", e);
      }
    }
  }, [addToast]);

  // Save Game
  const saveGame = useCallback(() => {
    const stateToSave = { ...stateRef.current, lastSaveTime: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    addToast('Game Saved', 'info');
  }, [addToast]);

  // Auto-save every 30s
  useEffect(() => {
    const interval = setInterval(saveGame, 30000);
    return () => clearInterval(interval);
  }, [saveGame]);

  // Helper: Calculate Multipliers
  const getMultipliers = useCallback(() => {
    const state = stateRef.current;
    
    // Base Prestige Multiplier
    let incomeMult = 1 * state.prestigeMultiplier; 
    let speedMult = 1;
    let costReduction = 1;
    let clickPower = 1;

    // Combine all upgrades (standard + legacy) to process effects
    const allUpgrades = [...UPGRADES, ...LEGACY_UPGRADES];

    allUpgrades.forEach(u => {
      const level = state.upgrades[u.id] || 0;
      if (level > 0) {
        // Standard Additive Bonuses
        if (u.effectType === 'income_mult') incomeMult += (u.effectValue * level);
        if (u.effectType === 'speed_mult') speedMult += (u.effectValue * level);
        if (u.effectType === 'click_power') clickPower += (u.effectValue * level);
        
        // Multiplicative Bonuses
        if (u.effectType === 'cost_reduction') costReduction *= Math.pow((1 - u.effectValue), level);
        
        // Prestige Multiplier Scaling (Multiplies the total result)
        if (u.effectType === 'prestige_bonus') incomeMult *= (1 + (u.effectValue * level));
      }
    });

    return { incomeMult, speedMult, costReduction, clickPower };
  }, []);

  // Mission Check Logic
  const checkMissions = useCallback((currentState: GameState) => {
    let changed = false;
    const newMissions = { ...currentState.missions };

    MISSIONS.forEach(mission => {
      const state = newMissions[mission.id] || { completed: false, claimed: false };
      if (state.completed) return;

      let isComplete = false;
      if (mission.type === 'EARN_TOTAL') {
        if (currentState.totalEarned >= mission.targetValue) isComplete = true;
      } else if (mission.type === 'OWN_BUSINESS') {
        if (mission.targetId !== undefined) {
             const bus = currentState.businesses.find(b => b.id === mission.targetId);
             if (bus && bus.level >= mission.targetValue) isComplete = true;
        }
      } else if (mission.type === 'HIRE_MANAGER') {
         if (mission.targetId !== undefined) {
            const bus = currentState.businesses.find(b => b.id === mission.targetId);
            if (bus && bus.hasManager) isComplete = true;
         }
      }

      if (isComplete) {
        newMissions[mission.id] = { completed: true, claimed: false };
        changed = true;
        addToast(`Achievement Unlocked: ${mission.title}`, 'success');
      }
    });

    if (changed) {
      return { ...currentState, missions: newMissions };
    }
    return null;
  }, [addToast]);

  // GAME LOOP
  const tick = useCallback(() => {
    const now = Date.now();
    const dt = (now - lastTickRef.current) / 1000; // delta time in seconds
    lastTickRef.current = now;

    const state = { ...stateRef.current };
    let moneyGained = 0;
    const { incomeMult, speedMult } = getMultipliers();

    // Process Businesses
    state.businesses = state.businesses.map(b => {
      if (b.level === 0) return b;

      const cycleTime = b.cycleTime / speedMult;
      
      // If manager exists, auto-progress
      if (b.hasManager) {
        let newProgress = b.progress + (dt / cycleTime) * 100;
        
        if (newProgress >= 100) {
          // Calculate how many cycles finished
          const cycles = Math.floor(newProgress / 100);
          const payout = (b.baseIncome * b.level * incomeMult) * cycles;
          moneyGained += payout;
          newProgress = newProgress % 100;
        }
        return { ...b, progress: newProgress };
      } 
      return b;
    });

    // Update State if money changed
    if (moneyGained > 0) {
      state.money += moneyGained;
      state.totalEarned += moneyGained;
    }

    // Check Missions periodically
    missionCheckTimerRef.current += dt;
    if (missionCheckTimerRef.current >= 1) {
        missionCheckTimerRef.current = 0;
        const missionsUpdatedState = checkMissions(state);
        if (missionsUpdatedState) {
            Object.assign(state, missionsUpdatedState);
        }
    }

    // Gem Spawn Logic
    gemSpawnTimerRef.current += dt;
    if (gemSpawnTimerRef.current >= 1) {
      gemSpawnTimerRef.current = 0;
      // ~2.2% chance per second to spawn if none active (avg every 45s)
      if (!activeGemRef.current && Math.random() < 0.022) {
        const id = Date.now();
        const x = Math.random() * 80 + 10; // 10% to 90%
        const y = Math.random() * 80 + 10;
        setActiveGem({ id, x, y });
        addToast('A Gem has appeared!', 'info');
        
        // Auto-despawn after 8 seconds
        setTimeout(() => {
          setActiveGem(prev => prev && prev.id === id ? null : prev);
        }, 8000);
      }
    }

    // Update Chart History (every 5 seconds)
    historyTimerRef.current += dt;
    if (historyTimerRef.current >= 5) {
      historyTimerRef.current = 0;
      setHistoryData(prev => {
        const newData = [...prev, { time: new Date().toLocaleTimeString(), value: state.money }];
        if (newData.length > 20) newData.shift();
        return newData;
      });
    }
    
    // Commit state
    stateRef.current = state;
    setGameState(state);

    requestRef.current = requestAnimationFrame(tick);
  }, [getMultipliers, checkMissions, addToast]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(tick);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [tick]);

  // ACTIONS
  const handleManualWork = (e: React.MouseEvent) => {
    const { incomeMult, clickPower } = getMultipliers();
    
    // Base * Multiplier * ClickPower
    const baseClick = 1 * incomeMult * clickPower;
    
    // 5% of CpS bonus
    let cps = 0;
    stateRef.current.businesses.forEach(b => {
        if(b.level > 0) cps += (b.baseIncome * b.level) / b.cycleTime;
    });
    const clickValue = Math.max(1, (baseClick + (cps * 0.05 * incomeMult)));

    const newState = { ...stateRef.current };
    newState.money += clickValue;
    newState.totalEarned += clickValue;

    // Lucky Gem Drop (0.5% chance)
    if (Math.random() < 0.005) {
      newState.gems += 1;
      spawnFloatingText(e.clientX, e.clientY, "+1 💎", "#22d3ee");
      addToast("Lucky! Found 1 Gem!", "success");
    }
    
    setGameState(newState);
    spawnFloatingText(e.clientX, e.clientY, `+${formatMoney(clickValue)}`);
  };

  const handleGemClick = () => {
    if (!activeGem) return;
    
    const amount = Math.floor(Math.random() * 3) + 1; // 1 to 3 gems
    const newState = { ...stateRef.current };
    newState.gems += amount;
    setGameState(newState);
    
    spawnFloatingText(
      (activeGem.x / 100) * window.innerWidth, 
      (activeGem.y / 100) * window.innerHeight, 
      `+${amount} 💎`, 
      "#22d3ee"
    );
    addToast(`Collected ${amount} Gem${amount > 1 ? 's' : ''}!`, 'success');
    setActiveGem(null);
  };

  const getBusinessCost = (b: Business, count: number) => {
    const { costReduction } = getMultipliers();
    const growth = 1.15; 
    const currentBaseCost = b.baseCost * Math.pow(growth, b.level);
    
    let totalCost = 0;
    if (count === 1) {
        totalCost = currentBaseCost;
    } else {
        totalCost = currentBaseCost * (Math.pow(growth, count) - 1) / (growth - 1);
    }
    
    return totalCost * costReduction;
  };

  const buyBusiness = (id: number, count: number) => {
    const state = { ...stateRef.current };
    const businessIndex = state.businesses.findIndex(b => b.id === id);
    if (businessIndex === -1) return;
    
    const business = state.businesses[businessIndex];
    const cost = getBusinessCost(business, count);
    
    if (state.money >= cost) {
      state.money -= cost;
      state.businesses[businessIndex].level += count;
      setGameState(state);
      addToast(`Upgraded ${business.name}`, 'success');
    } else {
      addToast('Not enough money!', 'error');
    }
  };

  const hireManager = (id: number) => {
    const state = { ...stateRef.current };
    const businessIndex = state.businesses.findIndex(b => b.id === id);
    if (businessIndex === -1) return;
    
    const business = state.businesses[businessIndex];
    
    if (state.money >= business.managerCost) {
      state.money -= business.managerCost;
      state.businesses[businessIndex].hasManager = true;
      setGameState(state);
      addToast(`Hired manager for ${business.name}`, 'success');
    }
  };

  const buyUpgrade = (upgrade: UpgradeItem) => {
    const state = { ...stateRef.current };
    const currentLevel = state.upgrades[upgrade.id] || 0;
    
    if (upgrade.maxLevel && currentLevel >= upgrade.maxLevel) return;
    
    const cost = upgrade.costBase * Math.pow(upgrade.costMult, currentLevel);
    
    // Check currency
    if (upgrade.type === 'money') {
      if (state.money >= cost) {
        state.money -= cost;
        state.upgrades[upgrade.id] = currentLevel + 1;
        setGameState(state);
        addToast(`Researched ${upgrade.title}`, 'success');
      } else {
        addToast('Insufficient Funds', 'error');
      }
    } else if (upgrade.type === 'gems') {
      if (state.gems >= cost) {
        state.gems -= cost;
        state.upgrades[upgrade.id] = currentLevel + 1;
        setGameState(state);
        addToast(`Bought ${upgrade.title}`, 'success');
      } else {
         addToast('Insufficient Gems', 'error');
      }
    } else if (upgrade.type === 'legacy') {
        if (state.legacyPoints >= cost) {
            state.legacyPoints -= cost;
            state.upgrades[upgrade.id] = currentLevel + 1;
            setGameState(state);
            addToast(`Unlocked ${upgrade.title}`, 'success');
        } else {
            addToast('Insufficient Legacy Points', 'error');
        }
    }
  };

  const claimMission = (id: string) => {
      const state = { ...stateRef.current };
      const mission = MISSIONS.find(m => m.id === id);
      const missionState = state.missions[id];

      if (mission && missionState && missionState.completed && !missionState.claimed) {
          // Grant Reward
          if (mission.rewardType === 'money') state.money += mission.rewardValue;
          if (mission.rewardType === 'gems') state.gems += mission.rewardValue;
          if (mission.rewardType === 'legacy') state.legacyPoints += mission.rewardValue;

          state.missions[id].claimed = true;
          setGameState(state);
          spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2, `Reward Claimed!`, '#10b981');
      }
  };

  const handlePrestige = () => {
    const potentialPoints = calculatePrestigePoints(stateRef.current.totalEarned);
    if (potentialPoints === 0) return;

    // Reset game state
    const newState = getInitialState();
    
    // Preserve Persistent Currencies
    newState.legacyPoints = stateRef.current.legacyPoints + potentialPoints;
    newState.gems = stateRef.current.gems + 5; // Bonus gems on prestige
    
    // Calculate Prestige Multiplier
    // Base 1 + 0.1 * points. 
    newState.prestigeMultiplier = 1 + (0.1 * potentialPoints);

    // Preserve Legacy Upgrades
    LEGACY_UPGRADES.forEach(u => {
        const level = stateRef.current.upgrades[u.id] || 0;
        if (level > 0) {
            newState.upgrades[u.id] = level;
            
            // Handle "Seed Money" logic immediately upon reset
            if (u.effectType === 'starting_money') {
                const bonusCash = level * 5000;
                newState.money += bonusCash;
                newState.totalEarned += bonusCash; // Starting cash counts towards lifetime earnings? Usually yes to jumpstart.
            }
        }
    });

    // Preserve Missions (Achievements)
    newState.missions = { ...stateRef.current.missions };

    setGameState(newState);
    setHistoryData([]);
    setShowPrestigeModal(false);
    addToast(`Prestige Successful! x${newState.prestigeMultiplier.toFixed(2)} Multiplier`, 'success');
  };

  // RENDER HELPERS
  const potentialPrestigePoints = calculatePrestigePoints(stateRef.current.totalEarned);

  // Count claimable missions
  const claimableCount = MISSIONS.filter(m => {
      const s = gameState.missions[m.id];
      return s && s.completed && !s.claimed;
  }).length;

  const renderUpgradeList = (list: UpgradeItem[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {list.map(u => {
        const level = gameState.upgrades[u.id] || 0;
        const cost = u.costBase * Math.pow(u.costMult, level);
        const isMax = u.maxLevel ? level >= u.maxLevel : false;
        const canAfford = u.type === 'money' ? gameState.money >= cost : 
                          u.type === 'gems' ? gameState.gems >= cost :
                          gameState.legacyPoints >= cost;

        return (
          <div key={u.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col justify-between">
            <div>
              <div className="flex justify-between">
                <h4 className="font-bold text-slate-100">{u.title}</h4>
                <span className="text-xs text-slate-400">Lv {level} {u.maxLevel ? `/ ${u.maxLevel}` : ''}</span>
              </div>
              <p className="text-sm text-slate-400 mt-1 h-10">{u.desc}</p>
            </div>
            <button
              onClick={() => buyUpgrade(u)}
              disabled={isMax || !canAfford}
              className={`mt-3 py-2 px-4 rounded-lg text-sm font-bold w-full transition-colors
                ${isMax ? 'bg-slate-700 text-slate-500' :
                  canAfford ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-slate-700 text-slate-500 opacity-50'}`}
            >
              {isMax ? 'MAXED' : `${u.type === 'money' ? '$' : u.type === 'gems' ? '💎' : '✨'} ${formatNumber(cost)}`}
            </button>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-20 selection:bg-cyan-500 selection:text-white relative overflow-hidden">
      <FloatingTexts texts={floatingTexts} />
      
      {activeGem && <GemSpawn x={activeGem.x} y={activeGem.y} onClick={handleGemClick} />}

      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`px-4 py-2 rounded-lg shadow-lg text-sm font-bold animate-pulse pointer-events-auto
            ${t.type === 'success' ? 'bg-emerald-600 text-white' : t.type === 'error' ? 'bg-rose-600 text-white' : 'bg-slate-700 text-white'}`}>
            {t.message}
          </div>
        ))}
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 p-4 shadow-xl">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-600">
              MONEY EMPIRE
            </h1>
            <div className="text-xs text-slate-400 font-mono">
              Net Worth: {formatMoney(gameState.totalEarned)} | Multiplier: x{gameState.prestigeMultiplier.toFixed(2)}
            </div>
          </div>

          <div className="flex gap-6 items-center">
             <div className="text-center">
                <div className="text-xs text-slate-400 uppercase tracking-wider">Cash</div>
                <div className="text-xl font-mono font-bold text-emerald-400">{formatMoney(gameState.money)}</div>
             </div>
             <div className="text-center">
                <div className="text-xs text-slate-400 uppercase tracking-wider">Gems</div>
                <div className="text-xl font-mono font-bold text-cyan-400">💎 {formatNumber(gameState.gems)}</div>
             </div>
             <div className="text-center">
                <div className="text-xs text-slate-400 uppercase tracking-wider">Legacy</div>
                <div className="text-xl font-mono font-bold text-purple-400">✨ {formatNumber(gameState.legacyPoints)}</div>
             </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4 relative z-10">
        
        {/* LEFT COLUMN: Controls & Stats */}
        <div className="space-y-6">
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 text-center shadow-lg relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent group-hover:from-amber-500/20 transition-all duration-500"></div>
            <button 
              onClick={handleManualWork}
              className="relative w-full py-8 bg-gradient-to-b from-amber-500 to-orange-600 rounded-xl text-2xl font-black text-white shadow-lg 
              hover:shadow-amber-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 border-b-4 border-orange-800"
            >
              WORK HARDER
            </button>
            <p className="mt-2 text-xs text-slate-400">Click to earn manual income (Chance for Gems!)</p>
          </div>

          <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 h-64">
            <h3 className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-wide">Net Worth History</h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData}>
                <XAxis dataKey="time" hide />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                  itemStyle={{ color: '#fbbf24' }}
                  formatter={(value: number) => [formatMoney(value), 'Money']}
                />
                <Line type="monotone" dataKey="value" stroke="#fbbf24" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex gap-2">
            <button 
               onClick={() => saveGame()}
               className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-bold transition-colors"
            >
              Save Game
            </button>
            <button 
               onClick={() => setShowPrestigeModal(true)}
               className="flex-1 py-2 bg-purple-900/50 hover:bg-purple-800 border border-purple-700 text-purple-300 rounded-lg text-sm font-bold transition-colors"
            >
              Prestige
            </button>
          </div>
        </div>

        {/* CENTER COLUMN: Businesses/Tabs */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-4 bg-slate-800 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('businesses')}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'businesses' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              Businesses
            </button>
            <button 
              onClick={() => setActiveTab('research')}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'research' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              Research
            </button>
            <button 
              onClick={() => setActiveTab('missions')}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-bold transition-all whitespace-nowrap relative ${activeTab === 'missions' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              Missions
              {claimableCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white animate-bounce">
                  {claimableCount}
                </span>
              )}
            </button>
            <button 
              onClick={() => setActiveTab('legacy')}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'legacy' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              Legacy
            </button>
          </div>

          {activeTab === 'businesses' && (
            <div className="space-y-3">
              {gameState.businesses.map(business => (
                <BusinessCard
                  key={business.id}
                  business={business}
                  canAfford={(cost) => gameState.money >= cost}
                  canAffordManager={gameState.money >= business.managerCost}
                  buyCost1={getBusinessCost(business, 1)}
                  buyCost10={getBusinessCost(business, 10)}
                  onBuy={(count) => buyBusiness(business.id, count)}
                  onHire={() => hireManager(business.id)}
                />
              ))}
            </div>
          )}

          {activeTab === 'research' && (
             <div className="space-y-6">
               <div>
                  <h3 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
                    <span>🧪</span> Research Lab (Money)
                  </h3>
                  {renderUpgradeList(UPGRADES.filter(u => u.type === 'money'))}
               </div>
               <div>
                  <h3 className="text-xl font-bold text-emerald-400 mb-4 flex items-center gap-2">
                    <span>💎</span> Gem Shop (Premium)
                  </h3>
                  {renderUpgradeList(UPGRADES.filter(u => u.type === 'gems'))}
               </div>
             </div>
          )}

          {activeTab === 'missions' && (
            <div className="space-y-3">
                <h3 className="text-xl font-bold text-amber-400 mb-4 flex items-center gap-2">
                    <span>🏆</span> Achievements
                </h3>
                {MISSIONS.map(mission => {
                    const state = gameState.missions[mission.id] || { completed: false, claimed: false };
                    
                    // Calc progress
                    let progressText = "";
                    let progressPercent = 0;
                    if (state.completed) {
                        progressText = "Completed";
                        progressPercent = 100;
                    } else if (mission.type === 'EARN_TOTAL') {
                        progressText = `${formatNumber(gameState.totalEarned)} / ${formatNumber(mission.targetValue)}`;
                        progressPercent = (gameState.totalEarned / mission.targetValue) * 100;
                    } else if (mission.type === 'OWN_BUSINESS') {
                        const bus = gameState.businesses.find(b => b.id === mission.targetId);
                        const current = bus ? bus.level : 0;
                        progressText = `${current} / ${mission.targetValue}`;
                        progressPercent = (current / mission.targetValue) * 100;
                    } else if (mission.type === 'HIRE_MANAGER') {
                        progressText = "Not Hired";
                        progressPercent = 0;
                    }

                    return (
                        <MissionItem 
                            key={mission.id} 
                            mission={mission} 
                            state={state} 
                            onClaim={claimMission}
                            progressText={progressText}
                            progressPercent={progressPercent}
                        />
                    );
                })}
            </div>
          )}

          {activeTab === 'legacy' && (
            <div>
               <h3 className="text-xl font-bold text-purple-400 mb-4 flex items-center gap-2">
                 <span>✨</span> Legacy Store (Prestige)
               </h3>
               <p className="mb-4 text-slate-400 text-sm">Prestige to earn Legacy Points. These upgrades persist through resets.</p>
               {renderUpgradeList(LEGACY_UPGRADES)}
            </div>
          )}
        </div>
      </main>

      {/* PRESTIGE MODAL */}
      {showPrestigeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-purple-500/50 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl shadow-purple-900/20">
            <h2 className="text-3xl font-black text-purple-400 mb-2">PRESTIGE</h2>
            <p className="text-slate-300 mb-6">Reset your businesses and money to gain a permanent multiplier and Legacy Points.</p>
            
            <div className="bg-slate-800 p-4 rounded-xl mb-6 space-y-2">
               <div className="flex justify-between">
                 <span className="text-slate-400">Current Multiplier:</span>
                 <span className="font-mono text-white">x{gameState.prestigeMultiplier.toFixed(2)}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-slate-400">Claimable Points:</span>
                 <span className="font-mono text-purple-400 font-bold">+{potentialPrestigePoints}</span>
               </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowPrestigeModal(false)}
                className="flex-1 py-3 bg-slate-700 text-white rounded-xl font-bold hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handlePrestige}
                disabled={potentialPrestigePoints <= 0}
                className={`flex-1 py-3 rounded-xl font-bold transition-colors text-white
                   ${potentialPrestigePoints > 0 ? 'bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-600/30' : 'bg-slate-700 opacity-50 cursor-not-allowed'}`}
              >
                PRESTIGE NOW
              </button>
            </div>
            {potentialPrestigePoints <= 0 && (
                <p className="text-xs text-rose-400 mt-4">You need ${formatMoney(PRESTIGE_THRESHOLD)} lifetime earnings to prestige.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;