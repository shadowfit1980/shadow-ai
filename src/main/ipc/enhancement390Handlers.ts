/**
 * Enhancement 390+ IPC Handlers - LM Arena model evaluation features
 */

import { ipcMain } from 'electron';

export function setupEnhancement390Handlers(): void {
    // MODEL ARENA
    ipcMain.handle('arena:createBattle', async (_, { prompt, category }: any) => {
        try { const { getModelArenaEngine } = await import('../modelarena/ModelArenaEngine'); return { success: true, battle: getModelArenaEngine().createBattle(prompt, category) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // ELO RATING
    ipcMain.handle('elo:recordMatch', async (_, { winnerId, loserId, tie }: any) => {
        try { const { getEloRatingEngine } = await import('../elorating/EloRatingEngine'); return { success: true, result: getEloRatingEngine().recordMatch(winnerId, loserId, tie) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // BLIND COMPARISON
    ipcMain.handle('blind:create', async (_, { prompt, responses }: any) => {
        try { const { getBlindComparisonEngine } = await import('../blindcompare/BlindComparisonEngine'); return { success: true, comparison: getBlindComparisonEngine().create(prompt, responses) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // VOTE COLLECTOR
    ipcMain.handle('vote:record', async (_, { battleId, userId, winner, category }: any) => {
        try { const { getVoteCollectorEngine } = await import('../votecollector/VoteCollectorEngine'); return { success: true, vote: getVoteCollectorEngine().record(battleId, userId, winner, category) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // LEADERBOARD
    ipcMain.handle('leaderboard:getTop', async (_, { limit }: any) => {
        try { const { getLeaderboardEngine } = await import('../leaderboard/LeaderboardEngine'); return { success: true, entries: getLeaderboardEngine().getTop(limit) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // BENCHMARK RUNNER
    ipcMain.handle('benchmark:run', async (_, { suiteId, modelId }: any) => {
        try { const { getBenchmarkRunnerEngine } = await import('../benchmarkrun/BenchmarkRunnerEngine'); return { success: true, run: await getBenchmarkRunnerEngine().run(suiteId, modelId) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // RESPONSE EVALUATOR
    ipcMain.handle('eval:autoEvaluate', async (_, { response, modelId }: any) => {
        try { const { getResponseEvaluatorEngine } = await import('../responseeval/ResponseEvaluatorEngine'); return { success: true, evaluation: getResponseEvaluatorEngine().autoEvaluate(response, modelId) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // CATEGORY ANALYZER
    ipcMain.handle('category:getTop', async (_, { category, limit }: any) => {
        try { const { getCategoryAnalyzerEngine } = await import('../catanalyzer/CategoryAnalyzerEngine'); return { success: true, top: getCategoryAnalyzerEngine().getTopByCategory(category, limit) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // MODEL PAIR SELECTOR
    ipcMain.handle('pairselector:select', async (_, { strategy }: any) => {
        try { const { getModelPairSelectorEngine } = await import('../pairselector/ModelPairSelectorEngine'); return { success: true, pair: getModelPairSelectorEngine().selectPair(strategy) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // ARENA STATS
    ipcMain.handle('arenastats:get', async () => {
        try { const { getArenaStatsEngine } = await import('../arenastats/ArenaStatsEngine'); return { success: true, stats: getArenaStatsEngine().getStats() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    console.log('✅ Enhancement 390+ IPC handlers registered (10 handlers)');
}
