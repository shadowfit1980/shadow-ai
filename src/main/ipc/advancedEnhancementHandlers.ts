/**
 * Advanced Enhancement IPC Handlers
 * IPC bridge for CodeSearch, Profiler, Security, and APIDoc
 */

import { ipcMain } from 'electron';

// Lazy-loaded services
let codeSearch: any = null;
let profiler: any = null;
let securityScanner: any = null;
let apiDocGenerator: any = null;

async function getAdvancedCodeSearch() {
    if (!codeSearch) {
        try {
            const { getAdvancedCodeSearch: getACS } = await import('../search/AdvancedCodeSearch');
            codeSearch = getACS();
        } catch (error) {
            console.warn('⚠️ AdvancedCodeSearch not available:', (error as Error).message);
            return null;
        }
    }
    return codeSearch;
}

async function getPerformanceProfiler() {
    if (!profiler) {
        try {
            const { getPerformanceProfiler: getPP } = await import('../profiler/PerformanceProfiler');
            profiler = getPP();
        } catch (error) {
            console.warn('⚠️ PerformanceProfiler not available:', (error as Error).message);
            return null;
        }
    }
    return profiler;
}

async function getSecurityScanner() {
    if (!securityScanner) {
        try {
            const { getSecurityScanner: getSS } = await import('../security/SecurityScanner');
            securityScanner = getSS();
        } catch (error) {
            console.warn('⚠️ SecurityScanner not available:', (error as Error).message);
            return null;
        }
    }
    return securityScanner;
}

async function getAPIDocGenerator() {
    if (!apiDocGenerator) {
        try {
            const { getAPIDocGenerator: getADG } = await import('../docs/APIDocGenerator');
            apiDocGenerator = getADG();
        } catch (error) {
            console.warn('⚠️ APIDocGenerator not available:', (error as Error).message);
            return null;
        }
    }
    return apiDocGenerator;
}

/**
 * Setup advanced enhancement handlers
 */
export function setupAdvancedEnhancementHandlers(): void {
    // === CODE SEARCH ===

    ipcMain.handle('codesearch:index', async (_, { projectPath }: { projectPath: string }) => {
        try {
            const cs = await getAdvancedCodeSearch();
            if (!cs) return { success: false, error: 'Code search not available' };

            const count = await cs.indexProject(projectPath);
            return { success: true, indexedFiles: count };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('codesearch:search', async (_, options: any) => {
        try {
            const cs = await getAdvancedCodeSearch();
            if (!cs) return { success: false, error: 'Code search not available' };

            const results = await cs.search(options);
            return { success: true, results };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('codesearch:symbols', async (_, { query, kind }: any) => {
        try {
            const cs = await getAdvancedCodeSearch();
            if (!cs) return { success: false, error: 'Code search not available' };

            const symbols = cs.searchSymbols(query, kind);
            return { success: true, symbols };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('codesearch:findRefs', async (_, { symbolName }: { symbolName: string }) => {
        try {
            const cs = await getAdvancedCodeSearch();
            if (!cs) return { success: false, error: 'Code search not available' };

            const refs = await cs.findReferences(symbolName);
            return { success: true, references: refs };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('codesearch:findDef', async (_, { symbolName }: { symbolName: string }) => {
        try {
            const cs = await getAdvancedCodeSearch();
            if (!cs) return { success: false, error: 'Code search not available' };

            const def = cs.findDefinition(symbolName);
            return { success: true, definition: def };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === PERFORMANCE PROFILER ===

    ipcMain.handle('profiler:profile', async (_, { filePath }: { filePath: string }) => {
        try {
            const pp = await getPerformanceProfiler();
            if (!pp) return { success: false, error: 'Profiler not available' };

            const result = await pp.profileFile(filePath);
            return { success: true, result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('profiler:getAll', async () => {
        try {
            const pp = await getPerformanceProfiler();
            if (!pp) return { success: false, error: 'Profiler not available' };

            const profiles = pp.getAllProfiles();
            return { success: true, profiles };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('profiler:report', async (_, { profileId }: { profileId: string }) => {
        try {
            const pp = await getPerformanceProfiler();
            if (!pp) return { success: false, error: 'Profiler not available' };

            const profile = pp.getProfile(profileId);
            if (!profile) return { success: false, error: 'Profile not found' };

            const report = pp.generateReport(profile);
            return { success: true, report };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === SECURITY SCANNER ===

    ipcMain.handle('security:scan', async (_, { filePath }: { filePath: string }) => {
        try {
            const ss = await getSecurityScanner();
            if (!ss) return { success: false, error: 'Security scanner not available' };

            const result = await ss.scanFile(filePath);
            return { success: true, result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('security:getAll', async () => {
        try {
            const ss = await getSecurityScanner();
            if (!ss) return { success: false, error: 'Security scanner not available' };

            const scans = ss.getAllScans();
            return { success: true, scans };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('security:report', async (_, { scanId }: { scanId: string }) => {
        try {
            const ss = await getSecurityScanner();
            if (!ss) return { success: false, error: 'Security scanner not available' };

            const scan = ss.getScan(scanId);
            if (!scan) return { success: false, error: 'Scan not found' };

            const report = ss.generateReport(scan);
            return { success: true, report };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === API DOC GENERATOR ===

    ipcMain.handle('apidoc:generate', async (_, { projectPath, title }: any) => {
        try {
            const adg = await getAPIDocGenerator();
            if (!adg) return { success: false, error: 'API doc generator not available' };

            const doc = await adg.generateFromProject(projectPath, title);
            return { success: true, documentation: doc };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('apidoc:markdown', async (_, { projectPath }: { projectPath: string }) => {
        try {
            const adg = await getAPIDocGenerator();
            if (!adg) return { success: false, error: 'API doc generator not available' };

            const doc = adg.getDocumentation(projectPath);
            if (!doc) return { success: false, error: 'No documentation found' };

            const markdown = adg.generateMarkdown(doc);
            return { success: true, markdown };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('apidoc:openapi', async (_, { projectPath }: { projectPath: string }) => {
        try {
            const adg = await getAPIDocGenerator();
            if (!adg) return { success: false, error: 'API doc generator not available' };

            const doc = adg.getDocumentation(projectPath);
            if (!doc) return { success: false, error: 'No documentation found' };

            const openapi = adg.generateOpenAPI(doc);
            return { success: true, openapi };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    console.log('✅ Advanced enhancement IPC handlers registered');
}
