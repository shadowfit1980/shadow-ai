/**
 * Enhancement 410+ IPC Handlers - Snyk security scanning features
 */

import { ipcMain } from 'electron';

export function setupEnhancement410Handlers(): void {
    // VULN SCANNER
    ipcMain.handle('vuln:scan', async (_, { target, type }: any) => {
        try { const { getVulnScannerEngine } = await import('../vulnscanner/VulnScannerEngine'); return { success: true, result: await getVulnScannerEngine().scan(target, type) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // DEPENDENCY ANALYZER
    ipcMain.handle('deps:analyze', async (_, { projectPath }: any) => {
        try { const { getDependencyAnalyzerEngine } = await import('../depanalyzer/DependencyAnalyzerEngine'); return { success: true, tree: await getDependencyAnalyzerEngine().analyze(projectPath) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // LICENSE CHECKER
    ipcMain.handle('license:check', async (_, { projectPath }: any) => {
        try { const { getLicenseCheckerEngine } = await import('../licensechk/LicenseCheckerEngine'); return { success: true, licenses: await getLicenseCheckerEngine().check(projectPath) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // CODE SECURITY SCANNER
    ipcMain.handle('codesec:scan', async (_, { projectPath }: any) => {
        try { const { getCodeSecurityScannerEngine } = await import('../codesecurity/CodeSecurityScannerEngine'); return { success: true, result: await getCodeSecurityScannerEngine().scan(projectPath) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // CONTAINER SCANNER
    ipcMain.handle('container:scan', async (_, { image, tag }: any) => {
        try { const { getContainerScannerEngine } = await import('../containerscanner/ContainerScannerEngine'); return { success: true, result: await getContainerScannerEngine().scan(image, tag) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // IAC SCANNER
    ipcMain.handle('iac:scan', async (_, { files, provider }: any) => {
        try { const { getIaCScannerEngine } = await import('../iacscanner/IaCScannerEngine'); return { success: true, result: await getIaCScannerEngine().scan(files, provider) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // SBOM GENERATOR
    ipcMain.handle('sbom:generate', async (_, { projectPath, format }: any) => {
        try { const { getSBOMGeneratorEngine } = await import('../sbomgen/SBOMGeneratorEngine'); return { success: true, sbom: await getSBOMGeneratorEngine().generate(projectPath, format) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // FIX SUGGESTER
    ipcMain.handle('fix:suggest', async (_, { vulnId, packageName, currentVersion }: any) => {
        try { const { getFixSuggesterEngine } = await import('../fixsuggest/FixSuggesterEngine'); return { success: true, fixes: await getFixSuggesterEngine().suggest(vulnId, packageName, currentVersion) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // SECURITY POLICY
    ipcMain.handle('secpolicy:getRules', async () => {
        try { const { getSecurityPolicyEngine } = await import('../secpolicy/SecurityPolicyEngine'); return { success: true, rules: getSecurityPolicyEngine().getRules() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // VULN DATABASE
    ipcMain.handle('vulndb:search', async (_, { query }: any) => {
        try { const { getVulnDatabaseEngine } = await import('../vulndb/VulnDatabaseEngine'); return { success: true, entries: getVulnDatabaseEngine().search(query) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    console.log('✅ Enhancement 410+ IPC handlers registered (10 handlers)');
}
