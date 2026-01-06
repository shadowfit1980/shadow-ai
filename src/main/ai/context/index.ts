/**
 * Context Module Index
 * 
 * Exports for deep codebase understanding capabilities
 */

export { ProjectContext } from './ProjectContext';
export type {
    FileInfo,
    ProjectArchitecture,
    ArchitecturePattern,
    DirectoryStructure,
    DependencyGraph,
    FileNode,
    ProjectSummary,
    ProjectStats,
    CodeConvention,
} from './ProjectContext';

// Project Context Graph for dependency analysis
export { ProjectContextGraph, type SymbolInfo, type Dependency, type ImpactAnalysis, type GraphStats } from './ProjectContextGraph';

// Context Compression
export {
    ContextCompressor,
    contextCompressor,
    type ContextItem,
    type CompressionResult,
    type ContextWindow,
    type CompressionConfig,
    type ContentPriority,
} from './ContextCompressor';
