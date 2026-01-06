/**
 * Onboarding Flow Component
 * 
 * First-run wizard for new users
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingStep {
    id: string;
    title: string;
    description: string;
    icon: string;
    content: React.ReactNode;
}

interface OnboardingFlowProps {
    onComplete: () => void;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [selectedModel, setSelectedModel] = useState('');
    const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
    const [preferences, setPreferences] = useState({
        theme: 'dark',
        autoSave: true,
        telemetry: false,
    });

    const steps: OnboardingStep[] = [
        {
            id: 'welcome',
            title: 'Welcome to Shadow AI',
            description: 'Your AI-powered coding assistant',
            icon: '👋',
            content: (
                <div style={styles.stepContent}>
                    <h3 style={styles.contentTitle}>Let's get you started!</h3>
                    <p style={styles.contentText}>
                        Shadow AI helps you write, refactor, and understand code faster with AI.
                    </p>
                    <div style={styles.featureGrid}>
                        <div style={styles.featureCard}>
                            <span>💬</span>
                            <span>AI Chat</span>
                        </div>
                        <div style={styles.featureCard}>
                            <span>🔧</span>
                            <span>Code Refactoring</span>
                        </div>
                        <div style={styles.featureCard}>
                            <span>🧪</span>
                            <span>Test Generation</span>
                        </div>
                        <div style={styles.featureCard}>
                            <span>🔍</span>
                            <span>Code Analysis</span>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            id: 'model',
            title: 'Choose Your AI Model',
            description: 'Select a default AI provider',
            icon: '🤖',
            content: (
                <div style={styles.stepContent}>
                    <div style={styles.modelGrid}>
                        {[
                            { id: 'gemini', name: 'Google Gemini', desc: 'Fast & free tier available' },
                            { id: 'openai', name: 'OpenAI GPT-4', desc: 'Most popular choice' },
                            { id: 'anthropic', name: 'Anthropic Claude', desc: 'Best for code analysis' },
                            { id: 'groq', name: 'Groq (Llama)', desc: 'Ultra-fast inference' },
                        ].map((model) => (
                            <button
                                key={model.id}
                                onClick={() => setSelectedModel(model.id)}
                                style={{
                                    ...styles.modelCard,
                                    borderColor: selectedModel === model.id ? '#1f6feb' : '#30363d',
                                    backgroundColor: selectedModel === model.id ? '#1f6feb20' : 'transparent',
                                }}
                            >
                                <div style={styles.modelName}>{model.name}</div>
                                <div style={styles.modelDesc}>{model.desc}</div>
                            </button>
                        ))}
                    </div>
                </div>
            ),
        },
        {
            id: 'apikey',
            title: 'Add API Key',
            description: 'Configure your AI provider',
            icon: '🔑',
            content: (
                <div style={styles.stepContent}>
                    <p style={styles.contentText}>
                        Enter your API key for {selectedModel || 'the selected model'}:
                    </p>
                    <input
                        type="password"
                        placeholder="sk-..."
                        value={apiKeys[selectedModel] || ''}
                        onChange={(e) => setApiKeys(prev => ({ ...prev, [selectedModel]: e.target.value }))}
                        style={styles.apiKeyInput}
                    />
                    <p style={styles.skipText}>
                        You can skip this and add it later in Settings.
                    </p>
                </div>
            ),
        },
        {
            id: 'preferences',
            title: 'Your Preferences',
            description: 'Customize your experience',
            icon: '⚙️',
            content: (
                <div style={styles.stepContent}>
                    <div style={styles.prefList}>
                        <label style={styles.prefItem}>
                            <span>🌙 Theme</span>
                            <select
                                value={preferences.theme}
                                onChange={(e) => setPreferences(p => ({ ...p, theme: e.target.value }))}
                                style={styles.prefSelect}
                            >
                                <option value="dark">Dark</option>
                                <option value="light">Light</option>
                                <option value="system">System</option>
                            </select>
                        </label>
                        <label style={styles.prefItem}>
                            <span>💾 Auto-save files</span>
                            <input
                                type="checkbox"
                                checked={preferences.autoSave}
                                onChange={(e) => setPreferences(p => ({ ...p, autoSave: e.target.checked }))}
                                style={styles.prefCheckbox}
                            />
                        </label>
                        <label style={styles.prefItem}>
                            <span>📊 Usage analytics</span>
                            <input
                                type="checkbox"
                                checked={preferences.telemetry}
                                onChange={(e) => setPreferences(p => ({ ...p, telemetry: e.target.checked }))}
                                style={styles.prefCheckbox}
                            />
                        </label>
                    </div>
                </div>
            ),
        },
        {
            id: 'shortcuts',
            title: 'Keyboard Shortcuts',
            description: 'Speed up your workflow',
            icon: '⌨️',
            content: (
                <div style={styles.stepContent}>
                    <div style={styles.shortcutList}>
                        <div style={styles.shortcutItem}><span>⌘ K</span><span>Command palette</span></div>
                        <div style={styles.shortcutItem}><span>⌘ N</span><span>New AI chat</span></div>
                        <div style={styles.shortcutItem}><span>⌘ ⇧ E</span><span>Explain code</span></div>
                        <div style={styles.shortcutItem}><span>⌘ ⇧ R</span><span>Refactor code</span></div>
                        <div style={styles.shortcutItem}><span>⌘ ⇧ T</span><span>Generate tests</span></div>
                        <div style={styles.shortcutItem}><span>⌘ ,</span><span>Open settings</span></div>
                    </div>
                </div>
            ),
        },
        {
            id: 'complete',
            title: 'You\'re All Set!',
            description: 'Start building with AI',
            icon: '🚀',
            content: (
                <div style={styles.stepContent}>
                    <div style={styles.completeIcon}>🎉</div>
                    <h3 style={styles.contentTitle}>Ready to code!</h3>
                    <p style={styles.contentText}>
                        You can always access settings, shortcuts, and help from the sidebar.
                    </p>
                </div>
            ),
        },
    ];

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = async () => {
        try {
            // Save preferences
            await (window as any).shadowAPI?.settings?.savePreferences?.(preferences);
            await (window as any).shadowAPI?.settings?.saveApiKeys?.(apiKeys);
            await (window as any).shadowAPI?.settings?.setOnboardingComplete?.(true);
        } catch (err) {
            console.error('Failed to save onboarding settings:', err);
        }
        onComplete();
    };

    const step = steps[currentStep];

    return (
        <div style={styles.container}>
            <div style={styles.modal}>
                {/* Progress */}
                <div style={styles.progress}>
                    {steps.map((s, i) => (
                        <div
                            key={s.id}
                            style={{
                                ...styles.progressDot,
                                backgroundColor: i <= currentStep ? '#1f6feb' : '#30363d',
                            }}
                        />
                    ))}
                </div>

                {/* Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        style={styles.stepWrapper}
                    >
                        <div style={styles.stepHeader}>
                            <span style={styles.stepIcon}>{step.icon}</span>
                            <div>
                                <h2 style={styles.stepTitle}>{step.title}</h2>
                                <p style={styles.stepDesc}>{step.description}</p>
                            </div>
                        </div>
                        {step.content}
                    </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div style={styles.navigation}>
                    {currentStep > 0 && (
                        <button onClick={() => setCurrentStep(c => c - 1)} style={styles.backBtn}>
                            ← Back
                        </button>
                    )}
                    <button onClick={handleNext} style={styles.nextBtn}>
                        {currentStep === steps.length - 1 ? 'Get Started' : 'Continue →'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    container: {
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
    },
    modal: {
        backgroundColor: '#161b22',
        borderRadius: '16px',
        border: '1px solid #30363d',
        width: '500px',
        padding: '32px',
    },
    progress: {
        display: 'flex',
        justifyContent: 'center',
        gap: '8px',
        marginBottom: '24px',
    },
    progressDot: {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
    },
    stepWrapper: {
        minHeight: '300px',
    },
    stepHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '24px',
    },
    stepIcon: { fontSize: '40px' },
    stepTitle: { margin: 0, fontSize: '24px', color: '#e6edf3' },
    stepDesc: { margin: 0, color: '#8b949e', fontSize: '14px' },
    stepContent: {},
    contentTitle: { margin: '0 0 12px', color: '#e6edf3' },
    contentText: { color: '#8b949e', lineHeight: 1.6 },
    featureGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
        marginTop: '20px',
    },
    featureCard: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px',
        backgroundColor: '#21262d',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#e6edf3',
    },
    modelGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
    },
    modelCard: {
        padding: '16px',
        border: '2px solid',
        borderRadius: '8px',
        textAlign: 'left',
        cursor: 'pointer',
        backgroundColor: 'transparent',
    },
    modelName: { fontWeight: 600, color: '#e6edf3', marginBottom: '4px' },
    modelDesc: { fontSize: '12px', color: '#8b949e' },
    apiKeyInput: {
        width: '100%',
        padding: '12px',
        backgroundColor: '#0d1117',
        border: '1px solid #30363d',
        borderRadius: '8px',
        color: '#e6edf3',
        fontSize: '14px',
        marginTop: '12px',
    },
    skipText: { fontSize: '12px', color: '#6e7681', marginTop: '8px' },
    prefList: { display: 'flex', flexDirection: 'column', gap: '16px' },
    prefItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: '#e6edf3',
    },
    prefSelect: {
        padding: '6px 12px',
        backgroundColor: '#21262d',
        border: '1px solid #30363d',
        borderRadius: '4px',
        color: '#e6edf3',
    },
    prefCheckbox: { width: '18px', height: '18px' },
    shortcutList: { display: 'flex', flexDirection: 'column', gap: '8px' },
    shortcutItem: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '10px 12px',
        backgroundColor: '#21262d',
        borderRadius: '6px',
        color: '#e6edf3',
        fontSize: '14px',
    },
    completeIcon: { fontSize: '64px', textAlign: 'center', marginBottom: '16px' },
    navigation: {
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '24px',
    },
    backBtn: {
        padding: '10px 20px',
        backgroundColor: 'transparent',
        border: '1px solid #30363d',
        borderRadius: '8px',
        color: '#8b949e',
        cursor: 'pointer',
    },
    nextBtn: {
        padding: '10px 24px',
        backgroundColor: '#1f6feb',
        border: 'none',
        borderRadius: '8px',
        color: 'white',
        cursor: 'pointer',
        marginLeft: 'auto',
        fontWeight: 500,
    },
};

export default OnboardingFlow;
