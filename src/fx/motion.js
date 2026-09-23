// Effects mode: the player's choice ('full' | 'reduced') overrides the system setting.
export const EFFECTS = ['full', 'reduced'];

export function reducedMotion(systemReduced, choice) {
  if (choice === 'full') return false;
  if (choice === 'reduced') return true;
  return Boolean(systemReduced);
}
