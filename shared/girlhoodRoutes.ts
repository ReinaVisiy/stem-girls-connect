export const GIRLHOOD_SUBPATHS = ['', 'share-your-voice', 'wall', 'withdraw', 'privacy'] as const;
export function isGirlhoodSubPath(value: string): boolean {
  return (GIRLHOOD_SUBPATHS as readonly string[]).includes(value.replace(/\/$/, ''));
}
