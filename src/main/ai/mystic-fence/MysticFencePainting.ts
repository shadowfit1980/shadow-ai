/**
 * Mystic Fence Painting
 */
import { EventEmitter } from 'events';
export class MysticFencePainting extends EventEmitter {
    private static instance: MysticFencePainting;
    private constructor() { super(); }
    static getInstance(): MysticFencePainting { if (!MysticFencePainting.instance) { MysticFencePainting.instance = new MysticFencePainting(); } return MysticFencePainting.instance; }
    numWays(n: number, k: number): number { if (n === 0) return 0; if (n === 1) return k; let same = k, diff = k * (k - 1); for (let i = 2; i < n; i++) { const prevDiff = diff; diff = (same + diff) * (k - 1); same = prevDiff; } return same + diff; }
    numTilings(n: number): number { const MOD = 1e9 + 7; const dp = [1, 0, 0, 0]; for (let i = 0; i < n; i++) { const ndp = [0, 0, 0, 0]; ndp[0] = (dp[0] + dp[1] + dp[2] + dp[3]) % MOD; ndp[1] = (dp[2] + dp[3]) % MOD; ndp[2] = (dp[1] + dp[3]) % MOD; ndp[3] = dp[0]; dp[0] = ndp[0]; dp[1] = ndp[1]; dp[2] = ndp[2]; dp[3] = ndp[3]; } return dp[0]; }
}
export const mysticFencePainting = MysticFencePainting.getInstance();
