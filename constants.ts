import { Business, UpgradeItem, MissionDefinition } from './types';

export const INITIAL_BUSINESSES: Business[] = [
  { id: 0, name: "Lemonade Stand", icon: "🍋", baseCost: 10, baseIncome: 2, level: 1, hasManager: false, managerCost: 150, cycleTime: 1.5, progress: 0 },
  { id: 1, name: "Newspaper Delivery", icon: "📰", baseCost: 100, baseIncome: 12, level: 0, hasManager: false, managerCost: 1000, cycleTime: 3, progress: 0 },
  { id: 2, name: "Car Wash", icon: "🚗", baseCost: 1100, baseIncome: 90, level: 0, hasManager: false, managerCost: 11000, cycleTime: 6, progress: 0 },
  { id: 3, name: "Pizza Shop", icon: "🍕", baseCost: 12000, baseIncome: 500, level: 0, hasManager: false, managerCost: 120000, cycleTime: 12, progress: 0 },
  { id: 4, name: "Donut Factory", icon: "🍩", baseCost: 130000, baseIncome: 2500, level: 0, hasManager: false, managerCost: 1300000, cycleTime: 24, progress: 0 },
  { id: 5, name: "Shrimp Boat", icon: "🦐", baseCost: 1400000, baseIncome: 15000, level: 0, hasManager: false, managerCost: 14000000, cycleTime: 48, progress: 0 },
  { id: 6, name: "Hockey Team", icon: "🏒", baseCost: 20000000, baseIncome: 120000, level: 0, hasManager: false, managerCost: 200000000, cycleTime: 96, progress: 0 },
  { id: 7, name: "Movie Studio", icon: "🎬", baseCost: 330000000, baseIncome: 1000000, level: 0, hasManager: false, managerCost: 3300000000, cycleTime: 192, progress: 0 },
  { id: 8, name: "Bank", icon: "🏦", baseCost: 5000000000, baseIncome: 12000000, level: 0, hasManager: false, managerCost: 50000000000, cycleTime: 384, progress: 0 },
  { id: 9, name: "Oil Company", icon: "🛢️", baseCost: 75000000000, baseIncome: 100000000, level: 0, hasManager: false, managerCost: 750000000000, cycleTime: 768, progress: 0 },
];

export const UPGRADES: UpgradeItem[] = [
  // Shop Upgrades (Gems)
  { id: 'click_power', title: "Click Power", desc: "Increases click value by 50%", costBase: 5, costMult: 1.5, level: 0, type: 'gems', effectType: 'click_power', effectValue: 0.5 },
  { id: 'click_power_2', title: "Golden Mouse", desc: "Triples click value (+200%)", costBase: 50, costMult: 2.0, level: 0, type: 'gems', effectType: 'click_power', effectValue: 2.0 },
  { id: 'speed_boost', title: "Production Speed", desc: "Businesses run 10% faster", costBase: 10, costMult: 1.8, level: 0, maxLevel: 10, type: 'gems', effectType: 'speed_mult', effectValue: 0.1 },
  { id: 'flux_capacitor', title: "Flux Capacitor", desc: "Supercharge speed by 25%", costBase: 100, costMult: 2.5, level: 0, maxLevel: 5, type: 'gems', effectType: 'speed_mult', effectValue: 0.25 },
  
  // Research (Money)
  { id: 'cost_reduction', title: "Better Negotiations", desc: "Reduces upgrade costs by 2%", costBase: 10000, costMult: 2.5, level: 0, maxLevel: 25, type: 'money', effectType: 'cost_reduction', effectValue: 0.02 },
  { id: 'lobbying', title: "Corporate Lobbying", desc: "Heavy cost reduction (5%)", costBase: 5000000, costMult: 3.0, level: 0, maxLevel: 10, type: 'money', effectType: 'cost_reduction', effectValue: 0.05 },
  { id: 'profit_margin', title: "Profit Margins", desc: "Increases all income by 5%", costBase: 50000, costMult: 2.2, level: 0, type: 'money', effectType: 'income_mult', effectValue: 0.05 },
  { id: 'marketing_1', title: "Local Ads", desc: "Boosts income by 10%", costBase: 500000, costMult: 2.0, level: 0, type: 'money', effectType: 'income_mult', effectValue: 0.10 },
  { id: 'marketing_2', title: "TV Commercials", desc: "Boosts income by 25%", costBase: 25000000, costMult: 2.5, level: 0, type: 'money', effectType: 'income_mult', effectValue: 0.25 },
  { id: 'workflow', title: "Workflow Optimization", desc: "Speed +10%", costBase: 250000, costMult: 2.0, level: 0, maxLevel: 20, type: 'money', effectType: 'speed_mult', effectValue: 0.10 },
];

export const LEGACY_UPGRADES: UpgradeItem[] = [
  { id: 'legacy_boost', title: "Legacy Bonus", desc: "Adds +10% to Prestige Multiplier", costBase: 1, costMult: 2, level: 0, type: 'legacy', effectType: 'prestige_bonus', effectValue: 0.10 },
  { id: 'starter_pack', title: "Seed Money", desc: "Start next run with +$5000", costBase: 2, costMult: 1.5, level: 0, type: 'legacy', effectType: 'starting_money', effectValue: 0 }, // Value handled in logic
  { id: 'time_mastery', title: "Time Mastery", desc: "Permanent +5% Speed", costBase: 5, costMult: 2.5, level: 0, type: 'legacy', effectType: 'speed_mult', effectValue: 0.05 },
];

export const PRESTIGE_THRESHOLD = 1_000_000;

export const MISSIONS: MissionDefinition[] = [
  // Early Game
  { id: 'm1', title: "First Profits", description: "Earn $100 lifetime earnings", type: 'EARN_TOTAL', targetValue: 100, rewardType: 'gems', rewardValue: 2 },
  { id: 'm2', title: "Lemonade Empire", description: "Reach Level 25 Lemonade Stand", type: 'OWN_BUSINESS', targetId: 0, targetValue: 25, rewardType: 'money', rewardValue: 500 },
  { id: 'm3', title: "Automated Lemonade", description: "Hire a Manager for Lemonade Stand", type: 'HIRE_MANAGER', targetId: 0, targetValue: 1, rewardType: 'gems', rewardValue: 5 },
  { id: 'm4', title: "Newspaper Boy", description: "Unlock Newspaper Delivery", type: 'OWN_BUSINESS', targetId: 1, targetValue: 1, rewardType: 'money', rewardValue: 200 },
  { id: 'm5', title: "Serious Business", description: "Earn $10,000 lifetime earnings", type: 'EARN_TOTAL', targetValue: 10000, rewardType: 'gems', rewardValue: 10 },
  
  // Mid Game
  { id: 'm6', title: "Car Wash King", description: "Reach Level 50 Car Wash", type: 'OWN_BUSINESS', targetId: 2, targetValue: 50, rewardType: 'legacy', rewardValue: 1 },
  { id: 'm7', title: "Millionaire", description: "Earn $1,000,000 lifetime earnings", type: 'EARN_TOTAL', targetValue: 1000000, rewardType: 'gems', rewardValue: 25 },
  { id: 'm8', title: "Pizza Party", description: "Automate the Pizza Shop", type: 'HIRE_MANAGER', targetId: 3, targetValue: 1, rewardType: 'money', rewardValue: 50000 },
  { id: 'm9', title: "Lemonade Tycoon", description: "Reach Level 100 Lemonade Stand", type: 'OWN_BUSINESS', targetId: 0, targetValue: 100, rewardType: 'gems', rewardValue: 15 },
  { id: 'm10', title: "Paper Route", description: "Reach Level 100 Newspaper Delivery", type: 'OWN_BUSINESS', targetId: 1, targetValue: 100, rewardType: 'gems', rewardValue: 15 },
  { id: 'm11', title: "Squeaky Clean", description: "Reach Level 100 Car Wash", type: 'OWN_BUSINESS', targetId: 2, targetValue: 100, rewardType: 'gems', rewardValue: 20 },
  { id: 'm12', title: "Billionaire", description: "Earn $1 Billion lifetime", type: 'EARN_TOTAL', targetValue: 1000000000, rewardType: 'legacy', rewardValue: 2 },
  
  // Late Game
  { id: 'm13', title: "Shrimp King", description: "Unlock Shrimp Boat", type: 'OWN_BUSINESS', targetId: 5, targetValue: 1, rewardType: 'gems', rewardValue: 30 },
  { id: 'm14', title: "Puck Drop", description: "Reach Level 50 Hockey Team", type: 'OWN_BUSINESS', targetId: 6, targetValue: 50, rewardType: 'legacy', rewardValue: 3 },
  { id: 'm15', title: "Blockbuster", description: "Hire Manager for Movie Studio", type: 'HIRE_MANAGER', targetId: 7, targetValue: 1, rewardType: 'money', rewardValue: 50000000 },
  { id: 'm16', title: "Trillionaire", description: "Earn $1 Trillion lifetime", type: 'EARN_TOTAL', targetValue: 1000000000000, rewardType: 'gems', rewardValue: 50 },
  { id: 'm17', title: "Banker", description: "Unlock Bank", type: 'OWN_BUSINESS', targetId: 8, targetValue: 1, rewardType: 'legacy', rewardValue: 5 },
  { id: 'm18', title: "Liquid Gold", description: "Unlock Oil Company", type: 'OWN_BUSINESS', targetId: 9, targetValue: 1, rewardType: 'legacy', rewardValue: 10 },
  { id: 'm19', title: "Oil Baron", description: "Reach Level 100 Oil Company", type: 'OWN_BUSINESS', targetId: 9, targetValue: 100, rewardType: 'gems', rewardValue: 100 },
  
  // End Game
  { id: 'm20', title: "Quadrillionaire", description: "Earn $1 Quadrillion ($1aa)", type: 'EARN_TOTAL', targetValue: 1000000000000000, rewardType: 'legacy', rewardValue: 20 },
  { id: 'm21', title: "Quintillionaire", description: "Earn $1 Quintillion ($1bb)", type: 'EARN_TOTAL', targetValue: 1000000000000000000, rewardType: 'gems', rewardValue: 200 },
  { id: 'm22', title: "Pizza Franchise", description: "Reach Level 200 Pizza Shop", type: 'OWN_BUSINESS', targetId: 3, targetValue: 200, rewardType: 'gems', rewardValue: 40 },
  { id: 'm23', title: "Donut Empire", description: "Reach Level 200 Donut Factory", type: 'OWN_BUSINESS', targetId: 4, targetValue: 200, rewardType: 'gems', rewardValue: 50 },
  { id: 'm24', title: "Shrimp Fleet", description: "Reach Level 200 Shrimp Boat", type: 'OWN_BUSINESS', targetId: 5, targetValue: 200, rewardType: 'gems', rewardValue: 60 },
  { id: 'm25', title: "Manager Monopoly", description: "Hire Manager for Bank", type: 'HIRE_MANAGER', targetId: 8, targetValue: 1, rewardType: 'legacy', rewardValue: 15 },
];