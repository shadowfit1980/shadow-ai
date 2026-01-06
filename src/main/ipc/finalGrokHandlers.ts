/**
 * Final Extended IPC Handlers
 * Exposes all new features to the renderer process
 */
import { ipcMain } from 'electron';
import { fineTuningUIBuilder } from '../ai/finetuning/FineTuningUIBuilder';
import { holographicFileViz } from '../ai/visualization/HolographicFileViz';
import { codeSentimentAnalyzer } from '../ai/sentiment/CodeSentimentAnalyzer';
import { apiDocumentationGenerator } from '../ai/documentation/APIDocumentationGenerator';
import { dependencyVulnerabilityScanner } from '../ai/security/DependencyVulnerabilityScanner';
import { codeMindmapGenerator } from '../ai/mindmap/CodeMindmapGenerator';
import { changelogGenerator } from '../ai/changelog/ChangelogGenerator';

export function registerFinalGrokHandlers(): void {
    // ============ Fine-Tuning UI Builder ============
    ipcMain.handle('finetuning:create-job', async (_, name: string, baseModel: string, config?: unknown) => {
        return fineTuningUIBuilder.createJob(name, baseModel, config as Parameters<typeof fineTuningUIBuilder.createJob>[2]);
    });

    ipcMain.handle('finetuning:set-dataset', async (_, jobId: string, dataset: unknown) => {
        return fineTuningUIBuilder.setDataset(jobId, dataset as Parameters<typeof fineTuningUIBuilder.setDataset>[1]);
    });

    ipcMain.handle('finetuning:update-config', async (_, jobId: string, config: unknown) => {
        return fineTuningUIBuilder.updateConfig(jobId, config as Parameters<typeof fineTuningUIBuilder.updateConfig>[1]);
    });

    ipcMain.handle('finetuning:start-training', async (_, jobId: string) => {
        return fineTuningUIBuilder.startTraining(jobId);
    });

    ipcMain.handle('finetuning:cancel-job', async (_, jobId: string) => {
        return fineTuningUIBuilder.cancelJob(jobId);
    });

    ipcMain.handle('finetuning:get-job', async (_, id: string) => {
        return fineTuningUIBuilder.getJob(id);
    });

    ipcMain.handle('finetuning:get-all-jobs', async () => {
        return fineTuningUIBuilder.getAllJobs();
    });

    ipcMain.handle('finetuning:get-templates', async () => {
        return fineTuningUIBuilder.getTemplates();
    });

    ipcMain.handle('finetuning:get-default-config', async () => {
        return fineTuningUIBuilder.getDefaultConfig();
    });

    ipcMain.handle('finetuning:estimate-time', async (_, config: unknown, datasetSize: number) => {
        return fineTuningUIBuilder.estimateTrainingTime(config as Parameters<typeof fineTuningUIBuilder.estimateTrainingTime>[0], datasetSize);
    });

    ipcMain.handle('finetuning:validate-dataset', async (_, examples: unknown[]) => {
        return fineTuningUIBuilder.validateDataset(examples as Parameters<typeof fineTuningUIBuilder.validateDataset>[0]);
    });

    // ============ Holographic File Viz ============
    ipcMain.handle('holographic:create-scene', async (_, name: string, themeName?: string) => {
        return holographicFileViz.createScene(name, themeName);
    });

    ipcMain.handle('holographic:add-node', async (_, sceneId: string, config: unknown) => {
        return holographicFileViz.addNode(sceneId, config as Parameters<typeof holographicFileViz.addNode>[1]);
    });

    ipcMain.handle('holographic:load-filesystem', async (_, sceneId: string, files: unknown[]) => {
        return holographicFileViz.loadFileSystem(sceneId, files as Parameters<typeof holographicFileViz.loadFileSystem>[1]);
    });

    ipcMain.handle('holographic:set-layout', async (_, sceneId: string, layout: unknown) => {
        holographicFileViz.setLayout(sceneId, layout as Parameters<typeof holographicFileViz.setLayout>[1]);
        return { success: true };
    });

    ipcMain.handle('holographic:navigate', async (_, sceneId: string, event: unknown) => {
        holographicFileViz.navigate(sceneId, event as Parameters<typeof holographicFileViz.navigate>[1]);
        return { success: true };
    });

    ipcMain.handle('holographic:select-node', async (_, sceneId: string, nodeId: string) => {
        holographicFileViz.selectNode(sceneId, nodeId);
        return { success: true };
    });

    ipcMain.handle('holographic:set-theme', async (_, sceneId: string, themeName: string) => {
        return holographicFileViz.setTheme(sceneId, themeName);
    });

    ipcMain.handle('holographic:update-effects', async (_, sceneId: string, effects: unknown) => {
        holographicFileViz.updateEffects(sceneId, effects as Parameters<typeof holographicFileViz.updateEffects>[1]);
        return { success: true };
    });

    ipcMain.handle('holographic:generate-webgl', async (_, sceneId: string) => {
        return holographicFileViz.generateWebGLCode(sceneId);
    });

    ipcMain.handle('holographic:get-scene', async (_, id: string) => {
        return holographicFileViz.getScene(id);
    });

    ipcMain.handle('holographic:get-themes', async () => {
        return holographicFileViz.getThemes();
    });

    ipcMain.handle('holographic:get-layout-types', async () => {
        return holographicFileViz.getLayoutTypes();
    });

    // ============ Code Sentiment Analyzer ============
    ipcMain.handle('sentiment:analyze-text', async (_, text: string) => {
        return codeSentimentAnalyzer.analyzeText(text);
    });

    ipcMain.handle('sentiment:analyze-file', async (_, filePath: string, content: string) => {
        return codeSentimentAnalyzer.analyzeFile(filePath, content);
    });

    ipcMain.handle('sentiment:analyze-commits', async (_, commits: unknown[]) => {
        const result = codeSentimentAnalyzer.analyzeCommits(commits as Parameters<typeof codeSentimentAnalyzer.analyzeCommits>[0]);
        return {
            byCommit: result.byCommit,
            byAuthor: Object.fromEntries(result.byAuthor)
        };
    });

    ipcMain.handle('sentiment:generate-health-report', async (_, files: unknown[]) => {
        return codeSentimentAnalyzer.generateHealthReport(files as Parameters<typeof codeSentimentAnalyzer.generateHealthReport>[0]);
    });

    ipcMain.handle('sentiment:get-team-morale', async (_, commits: unknown[]) => {
        return codeSentimentAnalyzer.getTeamMorale(commits as Parameters<typeof codeSentimentAnalyzer.getTeamMorale>[0]);
    });

    ipcMain.handle('sentiment:get-history', async () => {
        return codeSentimentAnalyzer.getHistory();
    });

    // ============ API Documentation Generator ============
    ipcMain.handle('apidoc:create', async (_, config: unknown) => {
        return apiDocumentationGenerator.createDocumentation(config as Parameters<typeof apiDocumentationGenerator.createDocumentation>[0]);
    });

    ipcMain.handle('apidoc:parse-code', async (_, code: string, framework?: string) => {
        return apiDocumentationGenerator.parseCode(code, framework as Parameters<typeof apiDocumentationGenerator.parseCode>[1]);
    });

    ipcMain.handle('apidoc:add-endpoint', async (_, docId: string, endpoint: unknown) => {
        return apiDocumentationGenerator.addEndpoint(docId, endpoint as Parameters<typeof apiDocumentationGenerator.addEndpoint>[1]);
    });

    ipcMain.handle('apidoc:add-schema', async (_, docId: string, name: string, schema: unknown) => {
        return apiDocumentationGenerator.addSchema(docId, name, schema as Parameters<typeof apiDocumentationGenerator.addSchema>[2]);
    });

    ipcMain.handle('apidoc:generate-openapi', async (_, docId: string) => {
        return apiDocumentationGenerator.generateOpenAPI(docId);
    });

    ipcMain.handle('apidoc:generate-markdown', async (_, docId: string) => {
        return apiDocumentationGenerator.generateMarkdown(docId);
    });

    ipcMain.handle('apidoc:generate-html', async (_, docId: string) => {
        return apiDocumentationGenerator.generateHTML(docId);
    });

    ipcMain.handle('apidoc:get', async (_, id: string) => {
        return apiDocumentationGenerator.getDocumentation(id);
    });

    ipcMain.handle('apidoc:get-all', async () => {
        return apiDocumentationGenerator.getAllDocumentation();
    });

    // ============ Dependency Vulnerability Scanner ============
    ipcMain.handle('vulnscan:scan-package', async (_, packageJson: unknown) => {
        return dependencyVulnerabilityScanner.scanPackageJson(packageJson as Parameters<typeof dependencyVulnerabilityScanner.scanPackageJson>[0]);
    });

    ipcMain.handle('vulnscan:generate-report', async (_, scanId: string, format?: string) => {
        return dependencyVulnerabilityScanner.generateReport(scanId, format as Parameters<typeof dependencyVulnerabilityScanner.generateReport>[1]);
    });

    ipcMain.handle('vulnscan:get-history', async () => {
        return dependencyVulnerabilityScanner.getScanHistory();
    });

    ipcMain.handle('vulnscan:get-latest', async () => {
        return dependencyVulnerabilityScanner.getLatestScan();
    });

    ipcMain.handle('vulnscan:get-db-stats', async () => {
        return dependencyVulnerabilityScanner.getDatabaseStats();
    });

    // ============ Code Mindmap Generator ============
    ipcMain.handle('mindmap:create', async (_, name: string, description?: string, themeName?: string) => {
        return codeMindmapGenerator.createMindmap(name, description, themeName);
    });

    ipcMain.handle('mindmap:add-node', async (_, mindmapId: string, parentId: string, config: unknown) => {
        return codeMindmapGenerator.addNode(mindmapId, parentId, config as Parameters<typeof codeMindmapGenerator.addNode>[2]);
    });

    ipcMain.handle('mindmap:generate-from-code', async (_, mindmapId: string, code: string, language?: string) => {
        return codeMindmapGenerator.generateFromCode(mindmapId, code, language);
    });

    ipcMain.handle('mindmap:apply-layout', async (_, mindmapId: string, algorithm: string) => {
        codeMindmapGenerator.applyLayout(mindmapId, algorithm as Parameters<typeof codeMindmapGenerator.applyLayout>[1]);
        return { success: true };
    });

    ipcMain.handle('mindmap:toggle-collapse', async (_, mindmapId: string, nodeId: string) => {
        return codeMindmapGenerator.toggleCollapse(mindmapId, nodeId);
    });

    ipcMain.handle('mindmap:update-node', async (_, mindmapId: string, nodeId: string, updates: unknown) => {
        return codeMindmapGenerator.updateNode(mindmapId, nodeId, updates as Parameters<typeof codeMindmapGenerator.updateNode>[2]);
    });

    ipcMain.handle('mindmap:delete-node', async (_, mindmapId: string, nodeId: string) => {
        return codeMindmapGenerator.deleteNode(mindmapId, nodeId);
    });

    ipcMain.handle('mindmap:export', async (_, mindmapId: string, format: unknown) => {
        return codeMindmapGenerator.export(mindmapId, format as Parameters<typeof codeMindmapGenerator.export>[1]);
    });

    ipcMain.handle('mindmap:get', async (_, id: string) => {
        const mindmap = codeMindmapGenerator.getMindmap(id);
        if (!mindmap) return null;
        return {
            ...mindmap,
            nodes: Array.from(mindmap.nodes.values()),
            edges: Array.from(mindmap.edges.values())
        };
    });

    ipcMain.handle('mindmap:get-all', async () => {
        return codeMindmapGenerator.getMindmaps().map(m => ({
            ...m,
            nodes: Array.from(m.nodes.values()),
            edges: Array.from(m.edges.values())
        }));
    });

    ipcMain.handle('mindmap:get-themes', async () => {
        return codeMindmapGenerator.getThemes();
    });

    ipcMain.handle('mindmap:set-theme', async (_, mindmapId: string, themeName: string) => {
        return codeMindmapGenerator.setTheme(mindmapId, themeName);
    });

    // ============ Changelog Generator ============
    ipcMain.handle('changelog:parse-commits', async (_, commits: unknown[]) => {
        return changelogGenerator.parseCommits(commits as Parameters<typeof changelogGenerator.parseCommits>[0]);
    });

    ipcMain.handle('changelog:create-version', async (_, version: string, commits: unknown[], date?: string) => {
        return changelogGenerator.createVersion(
            version,
            commits as Parameters<typeof changelogGenerator.createVersion>[1],
            date ? new Date(date) : undefined
        );
    });

    ipcMain.handle('changelog:generate', async (_, versions?: string[]) => {
        return changelogGenerator.generateChangelog(versions);
    });

    ipcMain.handle('changelog:generate-release-notes', async (_, version: string) => {
        return changelogGenerator.generateReleaseNotes(version);
    });

    ipcMain.handle('changelog:generate-json', async (_, versions?: string[]) => {
        return changelogGenerator.generateJSON(versions);
    });

    ipcMain.handle('changelog:generate-html', async (_, versions?: string[]) => {
        return changelogGenerator.generateHTML(versions);
    });

    ipcMain.handle('changelog:suggest-version', async (_, currentVersion: string) => {
        return changelogGenerator.suggestVersion(currentVersion);
    });

    ipcMain.handle('changelog:get-versions', async () => {
        return changelogGenerator.getVersions();
    });

    ipcMain.handle('changelog:get-stats', async () => {
        return changelogGenerator.getCommitStats();
    });

    ipcMain.handle('changelog:set-config', async (_, config: unknown) => {
        changelogGenerator.setConfig(config as Parameters<typeof changelogGenerator.setConfig>[0]);
        return { success: true };
    });

    ipcMain.handle('changelog:set-repo-url', async (_, url: string) => {
        changelogGenerator.setRepoUrl(url);
        return { success: true };
    });
}
