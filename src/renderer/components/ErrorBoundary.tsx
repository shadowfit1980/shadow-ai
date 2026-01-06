/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI.
 */

import React from 'react';

interface Props {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
    errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Error boundary caught:', error, errorInfo);
        this.setState({ errorInfo });
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div style={styles.container}>
                    <div style={styles.icon}>⚠️</div>
                    <h2 style={styles.title}>Something went wrong</h2>
                    <p style={styles.message}>
                        {this.state.error?.message || 'An unexpected error occurred'}
                    </p>
                    <div style={styles.actions}>
                        <button
                            onClick={this.handleRetry}
                            style={styles.retryButton}
                        >
                            Try Again
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            style={styles.reloadButton}
                        >
                            Reload Page
                        </button>
                    </div>
                    {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                        <details style={styles.details}>
                            <summary style={styles.summary}>Error Details</summary>
                            <pre style={styles.stack}>
                                {this.state.error?.stack}
                            </pre>
                        </details>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

const styles: Record<string, React.CSSProperties> = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        backgroundColor: '#1a1a2e',
        color: '#eaeaea',
        minHeight: '300px',
        textAlign: 'center',
    },
    icon: {
        fontSize: '48px',
        marginBottom: '16px',
    },
    title: {
        fontSize: '24px',
        fontWeight: 'bold',
        marginBottom: '12px',
        color: '#ff4757',
    },
    message: {
        fontSize: '14px',
        color: '#a4b0be',
        marginBottom: '24px',
        maxWidth: '400px',
    },
    actions: {
        display: 'flex',
        gap: '12px',
    },
    retryButton: {
        padding: '12px 24px',
        backgroundColor: '#4a90d9',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '14px',
    },
    reloadButton: {
        padding: '12px 24px',
        backgroundColor: 'transparent',
        color: '#a4b0be',
        border: '1px solid #3d3d5c',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '14px',
    },
    details: {
        marginTop: '24px',
        width: '100%',
        maxWidth: '600px',
    },
    summary: {
        cursor: 'pointer',
        color: '#a4b0be',
        fontSize: '14px',
    },
    stack: {
        marginTop: '12px',
        padding: '12px',
        backgroundColor: '#16213e',
        borderRadius: '8px',
        overflow: 'auto',
        fontSize: '12px',
        textAlign: 'left',
        color: '#ff6b6b',
    },
};

export default ErrorBoundary;
