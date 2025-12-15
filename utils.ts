export const formatMoney = (amount: number): string => {
  if (amount < 1000) return `$${Math.floor(amount)}`;
  if (amount < 1000000) return `$${(amount / 1000).toFixed(2)}k`;
  if (amount < 1000000000) return `$${(amount / 1000000).toFixed(2)}M`;
  if (amount < 1000000000000) return `$${(amount / 1000000000).toFixed(2)}B`;
  return `$${(amount / 1000000000000).toFixed(2)}T`;
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(num);
};

export const calculatePrestigePoints = (lifetimeEarnings: number): number => {
  if (lifetimeEarnings < 1000000) return 0;
  return Math.floor(Math.sqrt(lifetimeEarnings / 1000000));
};