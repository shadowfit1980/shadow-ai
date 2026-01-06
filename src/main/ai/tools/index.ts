/**
 * Tool System Exports
 * Central export point for all tools and registry
 */

// Core types and registry
export * from './types';
export * from './ToolRegistry';
export * from './BaseTool';
export * from './ToolChainExecutor';

// Tool implementations
export * from './implementations/FileTools';
export * from './implementations/CodeTools';
export * from './implementations/TestingSecurityTools';
export * from './implementations/WebTools';
export * from './implementations/GitTools';
export * from './implementations/DatabaseTools';
export * from './implementations/FrameworkTools';

// Initialize and export default tools
import { toolRegistry } from './ToolRegistry';
import {
    ReadFileTool,
    WriteFileTool,
    ListDirectoryTool,
    FindFilesTool,
} from './implementations/FileTools';
import {
    SearchCodeTool,
    AnalyzeCodeStructureTool,
    CountCodeLinesTool,
} from './implementations/CodeTools';
import {
    GenerateTestsTool,
    ScanSecurityTool,
} from './implementations/TestingSecurityTools';
import { webTools } from './implementations/WebTools';
import { gitTools } from './implementations/GitTools';
import { databaseTools } from './implementations/DatabaseTools';
import { frameworkTools } from './implementations/FrameworkTools';

/**
 * Initialize all default tools
 */
export function initializeDefaultTools() {
    // File tools
    toolRegistry.register(new ReadFileTool());
    toolRegistry.register(new WriteFileTool());
    toolRegistry.register(new ListDirectoryTool());
    toolRegistry.register(new FindFilesTool());

    // Code tools
    toolRegistry.register(new SearchCodeTool());
    toolRegistry.register(new AnalyzeCodeStructureTool());
    toolRegistry.register(new CountCodeLinesTool());

    // Testing & Security tools
    toolRegistry.register(new GenerateTestsTool());
    toolRegistry.register(new ScanSecurityTool());

    // Web tools
    for (const tool of webTools) {
        toolRegistry.register(tool);
    }

    // Git tools
    for (const tool of gitTools) {
        toolRegistry.register(tool);
    }

    // Database tools
    for (const tool of databaseTools) {
        toolRegistry.register(tool);
    }

    // Framework tools
    for (const tool of frameworkTools) {
        toolRegistry.register(tool);
    }

    console.log('✅ Initialized default tools:', toolRegistry.list().length);
}

// Auto-initialize on import
initializeDefaultTools();

// Export registry instance
export { toolRegistry };
