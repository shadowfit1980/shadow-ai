/**
 * Game Development Dashboard Component
 * 
 * UI for browsing and using game development templates.
 */

import React, { useState, useEffect } from 'react';
import { useGameDev, GameTemplate } from '../hooks/useGameDev';
import './GameDevDashboard.css';

const FRAMEWORK_ICONS: Record<string, string> = {
    pygame: '🐍',
    arcade: '🎮',
    phaser: '🕹️',
    threejs: '🧊',
    babylonjs: '🏛️',
    unity: '🎯',
    unreal: '🎬',
    godot: '🤖',
    libgdx: '☕',
    custom: '⚙️',
};

const LANGUAGE_COLORS: Record<string, string> = {
    python: '#3776ab',
    javascript: '#f7df1e',
    typescript: '#3178c6',
    csharp: '#239120',
    cpp: '#00599c',
    gdscript: '#478cbf',
    java: '#ed8b00',
};

export const GameDevDashboard: React.FC = () => {
    const { frameworks, loading, selectedTemplate, getTemplate, getInstallCommand } = useGameDev();
    const [activeFramework, setActiveFramework] = useState<string | null>(null);
    const [installCommand, setInstallCommand] = useState<string>('');
    const [copiedFile, setCopiedFile] = useState<string | null>(null);

    const handleFrameworkSelect = async (framework: string) => {
        setActiveFramework(framework);
        const cmd = await getInstallCommand(framework);
        setInstallCommand(cmd);
        await getTemplate(framework);
    };

    const copyToClipboard = (content: string, fileName: string) => {
        navigator.clipboard.writeText(content);
        setCopiedFile(fileName);
        setTimeout(() => setCopiedFile(null), 2000);
    };

    return (
        <div className="game-dev-dashboard">
            <header className="gdd-header">
                <h2>🎮 Game Development Studio</h2>
                <p>Choose a framework to get started with game development</p>
            </header>

            {/* Framework Grid */}
            <div className="framework-grid">
                {frameworks.map(({ language, frameworks: fws }) => (
                    <div key={language} className="language-group">
                        <h3 style={{ color: LANGUAGE_COLORS[language] || '#fff' }}>
                            {language.toUpperCase()}
                        </h3>
                        <div className="framework-buttons">
                            {fws.map(fw => (
                                <button
                                    key={fw}
                                    className={`framework-btn ${activeFramework === fw ? 'active' : ''}`}
                                    onClick={() => handleFrameworkSelect(fw)}
                                >
                                    <span className="fw-icon">{FRAMEWORK_ICONS[fw] || '🎯'}</span>
                                    <span className="fw-name">{fw}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Install Command */}
            {installCommand && (
                <div className="install-section">
                    <h3>📦 Installation</h3>
                    <div className="install-command">
                        <code>{installCommand}</code>
                        <button
                            className="copy-btn"
                            onClick={() => copyToClipboard(installCommand, 'install')}
                        >
                            {copiedFile === 'install' ? '✓' : '📋'}
                        </button>
                    </div>
                </div>
            )}

            {/* Template Display */}
            {loading && (
                <div className="loading">
                    <span className="spinner">⟳</span> Loading template...
                </div>
            )}

            {selectedTemplate && !loading && (
                <div className="template-section">
                    <h3>📁 {selectedTemplate.name}</h3>

                    {/* Dependencies */}
                    {selectedTemplate.dependencies.length > 0 && (
                        <div className="dependencies">
                            <h4>Dependencies:</h4>
                            <div className="dep-list">
                                {selectedTemplate.dependencies.map(dep => (
                                    <span key={dep} className="dep-badge">{dep}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Files */}
                    <div className="files-list">
                        {selectedTemplate.files.map(file => (
                            <div key={file.path} className="file-card">
                                <div className="file-header">
                                    <span className="file-name">{file.path}</span>
                                    <button
                                        className="copy-btn"
                                        onClick={() => copyToClipboard(file.content, file.path)}
                                    >
                                        {copiedFile === file.path ? '✓ Copied!' : '📋 Copy'}
                                    </button>
                                </div>
                                <pre className="file-content">
                                    <code>{file.content}</code>
                                </pre>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GameDevDashboard;
