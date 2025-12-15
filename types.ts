export interface Business {
  id: number;
  name: string;
  icon: string;
  baseCost: number;
  baseIncome: number;
  level: number;
  hasManager: boolean;
  managerCost: number;
  cycleTime: number; // in seconds
  progress: number; // 0 to 100
}

export interface UpgradeItem {
  id: string;
  title: string;
  desc: string;
  costBase: number;
  costMult: number;
  level: number;
  maxLevel?: number;
  type: 'money' | 'gems' | 'legacy';
  effectType: 'income_mult' | 'speed_mult' | 'cost_reduction' | 'prestige_bonus' | 'click_power' | 'starting_money';
  effectValue: number;
}

export type MissionType = 'EARN_TOTAL' | 'OWN_BUSINESS' | 'HIRE_MANAGER';

export interface MissionDefinition {
  id: string;
  title: string;
  description: string;
  type: MissionType;
  targetId?: number; // For business ID
  targetValue: number; // Amount of money or level
  rewardType: 'money' | 'gems' | 'legacy';
  rewardValue: number;
}

export interface MissionState {
  completed: boolean;
  claimed: boolean;
}

export interface GameState {
  money: number;
  gems: number;
  legacyPoints: number;
  totalEarned: number; // Lifetime earnings for prestige calc
  prestigeMultiplier: number;
  startTime: number;
  businesses: Business[];
  upgrades: Record<string, number>; // Upgrade ID -> Level
  missions: Record<string, MissionState>; // Mission ID -> State
  lastSaveTime: number;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
}

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}