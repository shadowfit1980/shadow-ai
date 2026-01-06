/**
 * Code Splitting Utils
 * 
 * Lazy loading utilities for React components
 */

import React, { Suspense, lazy, ComponentType } from 'react';

/**
 * Loading fallback component
 */
const LoadingFallback: React.FC<{ message?: string }> = ({ message }) => (
    <div style={styles.loading}>
        <div style={styles.spinner}>⟳</div>
        <p>{message || 'Loading...'}</p>
    </div>
);

/**
 * Create a lazy-loaded component with error boundary
 */
export function lazyLoad<T extends ComponentType<any>>(
    factory: () => Promise<{ default: T }>,
    fallbackMessage?: string
): React.FC<React.ComponentProps<T>> {
    const LazyComponent = lazy(factory);

    return (props) => (
        <Suspense fallback={<LoadingFallback message={fallbackMessage} />}>
            <LazyComponent {...props} />
        </Suspense>
    );
}

/**
 * Pre-configured lazy components for Shadow AI
 */
export const LazyComponents: Record<string, React.FC<any>> = {
    // Heavy components
    AnalyticsDashboard: lazyLoad(
        () => import('./components/AnalyticsDashboard'),
        'Loading Analytics...'
    ),
    VisualWorkflowBuilder: lazyLoad(
        () => import('./components/VisualWorkflowBuilder'),
        'Loading Workflow Builder...'
    ),
    EnhancedWorkflowCanvas: lazyLoad(
        () => import('./components/EnhancedWorkflowCanvas'),
        'Loading Canvas...'
    ),
    PluginMarketplace: lazyLoad(
        () => import('./components/PluginMarketplace'),
        'Loading Marketplace...'
    ),

    // Settings and modals
    APIKeySettings: lazyLoad(
        () => import('./components/APIKeySettings'),
        'Loading Settings...'
    ),
    SyncSettings: lazyLoad(
        () => import('./components/SyncSettings'),
        'Loading Sync Settings...'
    ),
    CustomAgentBuilder: lazyLoad(
        () => import('./components/CustomAgentBuilder'),
        'Loading Agent Builder...'
    ),

    // Feature panels
    TeamPanel: lazyLoad(
        () => import('./components/TeamPanel'),
        'Loading Team Panel...'
    ),
    PromptLibrary: lazyLoad(
        () => import('./components/PromptLibrary'),
        'Loading Prompts...'
    ),
    HelpSystem: lazyLoad(
        () => import('./components/HelpSystem'),
        'Loading Help...'
    ),

    // New features
    ModelSelector: lazyLoad(
        () => import('./components/ModelSelector'),
        'Loading Model Selector...'
    ),
    QuickActions: lazyLoad(
        () => import('./components/QuickActions'),
        'Loading Quick Actions...'
    ),
    ProjectGenerator: lazyLoad(
        () => import('./components/ProjectGenerator'),
        'Loading Project Generator...'
    ),
    CodeSnippets: lazyLoad(
        () => import('./components/CodeSnippets'),
        'Loading Snippets...'
    ),
    TerminalPanel: lazyLoad(
        () => import('./components/TerminalPanel'),
        'Loading Terminal...'
    ),
    GitPanel: lazyLoad(
        () => import('./components/GitPanel'),
        'Loading Git...'
    ),
    APIEndpointBuilder: lazyLoad(
        () => import('./components/APIEndpointBuilder'),
        'Loading API Builder...'
    ),
    DatabaseSchemaDesigner: lazyLoad(
        () => import('./components/DatabaseSchemaDesigner'),
        'Loading Database Designer...'
    ),
    ModelBrowserEnhanced: lazyLoad(
        () => import('./components/ModelBrowserEnhanced'),
        'Loading Model Browser...'
    ),
    DeploymentPanel: lazyLoad(
        () => import('./components/DeploymentPanel'),
        'Loading Deployment Panel...'
    ),
    PerformanceMonitor: lazyLoad(
        () => import('./components/PerformanceMonitor'),
        'Loading Performance Monitor...'
    ),
    DocumentationGenerator: lazyLoad(
        () => import('./components/DocumentationGenerator'),
        'Loading Documentation Generator...'
    ),
    SecurityScanner: lazyLoad(
        () => import('./components/SecurityScanner'),
        'Loading Security Scanner...'
    ),
    CodeComplexityAnalyzer: lazyLoad(
        () => import('./components/CodeComplexityAnalyzer'),
        'Loading Complexity Analyzer...'
    ),
    VoiceControlPanel: lazyLoad(
        () => import('./components/VoiceControlPanel'),
        'Loading Voice Control...'
    ),
    PluginStore: lazyLoad(
        () => import('./components/PluginStore'),
        'Loading Plugin Store...'
    ),
    SelfHealer: lazyLoad(
        () => import('./components/SelfHealer'),
        'Loading Self Healer...'
    ),
};

/**
 * Preload components for faster subsequent loads
 */
export const preloadComponent = (name: keyof typeof LazyComponents): void => {
    switch (name) {
        case 'AnalyticsDashboard':
            import('./components/AnalyticsDashboard');
            break;
        case 'VisualWorkflowBuilder':
            import('./components/VisualWorkflowBuilder');
            break;
        case 'PluginMarketplace':
            import('./components/PluginMarketplace');
            break;
        // Add more as needed
    }
};

/**
 * Preload multiple components
 */
export const preloadComponents = (names: Array<keyof typeof LazyComponents>): void => {
    names.forEach(preloadComponent);
};

const styles: Record<string, React.CSSProperties> = {
    loading: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: '#8b949e',
        fontSize: '14px',
    },
    spinner: {
        fontSize: '32px',
        marginBottom: '12px',
        animation: 'spin 1s linear infinite',
    },
};

export default LazyComponents;
