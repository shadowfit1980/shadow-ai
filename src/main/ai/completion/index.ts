/**
 * Code Completion System
 * Real-time AI-powered code completions
 */

export * from './types';
export * from './ContextExtractor';
export * from './IntelliSenseEngine';
export * from './CompletionProvider';

// Convenience exports
export { getIntelliSense } from './IntelliSenseEngine';
export { getCompletionProvider } from './CompletionProvider';
