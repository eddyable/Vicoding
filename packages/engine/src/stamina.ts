/** A level's operation budget for input size n: `perN * n + constant`. */
export interface StaminaBudget {
  perN: number;
  constant: number;
}

export function staminaFor(budget: StaminaBudget, n: number): number {
  return budget.perN * n + budget.constant;
}

/**
 * How big Big-O the Ogre is drawn: 1 = exactly on budget.
 * Values above 1 summon him; the renderer scales him by this ratio.
 */
export function ogreScale(ticks: number, budget: StaminaBudget, n: number): number {
  return ticks / staminaFor(budget, n);
}
