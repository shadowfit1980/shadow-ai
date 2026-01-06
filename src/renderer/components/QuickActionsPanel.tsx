/**
 * QuickActionsPanel
 * 
 * Floating panel for quick access to domain-specific agent actions
 */

import React, { useState } from 'react';
import { useMobileAgent, useGameAgent, useDesktopAgent } from '../hooks/useDomainAgents';
import './QuickActionsPanel.css';

interface QuickAction {
    id: string;
    label: string;
    icon: string;
    domain: 'mobile' | 'game' | 'desktop';
    execute: () => Promise<any>;
}

export const QuickActionsPanel: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
    const mobile = useMobileAgent();
    const game = useGameAgent();
    const desktop = useDesktopAgent();

    const [activeDomain, setActiveDomain] = useState<'mobile' | 'game' | 'desktop'>('mobile');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const domains = [
        { id: 'mobile' as const, label: 'Mobile', icon: '📱' },
        { id: 'game' as const, label: 'Game', icon: '🎮' },
        { id: 'desktop' as const, label: 'Desktop', icon: '🖥️' },
    ];

    const actions: Record<string, QuickAction[]> = {
        mobile: [
            { id: 'detect', label: 'Detect Platform', icon: '🔍', domain: 'mobile', execute: () => mobile.detectPlatform({ task: 'detect' }) },
            { id: 'component', label: 'Generate Component', icon: '🧩', domain: 'mobile', execute: () => mobile.execute({ task: 'generate component', spec: 'Create a button component' }) },
            { id: 'aso', label: 'App Store Optimize', icon: '📈', domain: 'mobile', execute: () => mobile.generateMetadata('Productivity app', 'ios') },
        ],
        game: [
            { id: 'detect', label: 'Detect Engine', icon: '🎮', domain: 'game', execute: () => game.detectEngine({ task: 'detect' }) },
            { id: 'procedural', label: 'Procedural Gen', icon: '🌍', domain: 'game', execute: () => game.generateProcedural({ type: 'terrain' }, { engine: 'unity' }) },
            { id: 'multiplayer', label: 'Multiplayer', icon: '👥', domain: 'game', execute: () => game.designMultiplayer({ players: 8 }, { engine: 'unity' }) },
        ],
        desktop: [
            { id: 'detect', label: 'Detect Framework', icon: '🔍', domain: 'desktop', execute: () => desktop.detectFramework({ task: 'detect' }) },
            { id: 'installer', label: 'Create Installer', icon: '📦', domain: 'desktop', execute: () => desktop.generateInstaller({ platform: 'macos' }, {}) },
        ],
    };

    const handleAction = async (action: QuickAction) => {
        setLoading(true);
        setResult(null);
        try {
            const res = await action.execute();
            setResult({ success: true, data: res });
        } catch (error: any) {
            setResult({ success: false, error: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="quick-actions-panel">
            <div className="panel-header">
                <h3>⚡ Quick Actions</h3>
                {onClose && <button className="close-btn" onClick={onClose}>×</button>}
            </div>

            <div className="domain-tabs">
                {domains.map(d => (
                    <button
                        key={d.id}
                        className={`domain-tab ${activeDomain === d.id ? 'active' : ''}`}
                        onClick={() => setActiveDomain(d.id)}
                    >
                        <span className="icon">{d.icon}</span>
                        <span className="label">{d.label}</span>
                    </button>
                ))}
            </div>

            <div className="actions-list">
                {actions[activeDomain]?.map(action => (
                    <button
                        key={action.id}
                        className="action-btn"
                        onClick={() => handleAction(action)}
                        disabled={loading}
                    >
                        <span className="action-icon">{action.icon}</span>
                        <span className="action-label">{action.label}</span>
                    </button>
                ))}
            </div>

            {loading && (
                <div className="loading-indicator">
                    <span className="spinner"></span>
                    Processing...
                </div>
            )}

            {result && (
                <div className={`result ${result.success ? 'success' : 'error'}`}>
                    <div className="result-header">
                        {result.success ? '✅ Success' : '❌ Error'}
                    </div>
                    <pre className="result-data">
                        {JSON.stringify(result.success ? result.data : result.error, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default QuickActionsPanel;
