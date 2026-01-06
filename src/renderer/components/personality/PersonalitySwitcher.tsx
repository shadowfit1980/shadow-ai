/**
 * Personality Switcher Component
 * React component for switching AI personality
 */
import React, { useState, useEffect } from 'react';
import './PersonalitySwitcher.css';

interface Personality {
    id: string;
    name: string;
    description: string;
    icon: string;
    traits: {
        formality: number;
        humor: number;
        verbosity: number;
        encouragement: number;
        creativity: number;
        patience: number;
        technicality: number;
        proactivity: number;
    };
}

export const PersonalitySwitcher: React.FC = () => {
    const [personalities, setPersonalities] = useState<Personality[]>([]);
    const [activePersonality, setActivePersonality] = useState<Personality | null>(null);
    const [showDetails, setShowDetails] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadPersonalities();
    }, []);

    const loadPersonalities = async () => {
        try {
            const all = await window.shadowAPI?.invoke('personality:get-all');
            const active = await window.shadowAPI?.invoke('personality:get-active');
            if (all) setPersonalities(all);
            if (active) setActivePersonality(active);
        } catch (error) {
            console.error('Failed to load personalities:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectPersonality = async (id: string) => {
        try {
            await window.shadowAPI?.invoke('personality:set', id);
            const active = await window.shadowAPI?.invoke('personality:get-active');
            if (active) setActivePersonality(active);
        } catch (error) {
            console.error('Failed to set personality:', error);
        }
    };

    const getTraitBar = (value: number) => {
        return (
            <div className="trait-bar">
                <div className="trait-fill" style={{ width: `${value}%` }} />
            </div>
        );
    };

    const getGreeting = async (id: string) => {
        try {
            await handleSelectPersonality(id);
            const greeting = await window.shadowAPI?.invoke('personality:generate-response', 'taskStart');
            return greeting;
        } catch (error) {
            return null;
        }
    };

    if (isLoading) {
        return (
            <div className="personality-switcher loading">
                <div className="spinner" />
                <p>Loading personalities...</p>
            </div>
        );
    }

    return (
        <div className="personality-switcher">
            <h2>🎭 AI Personality</h2>
            <p className="subtitle">Choose how your AI assistant communicates</p>

            <div className="personality-grid">
                {personalities.map(personality => (
                    <div
                        key={personality.id}
                        className={`personality-card ${activePersonality?.id === personality.id ? 'active' : ''}`}
                        onClick={() => handleSelectPersonality(personality.id)}
                        onMouseEnter={() => setShowDetails(personality.id)}
                        onMouseLeave={() => setShowDetails(null)}
                    >
                        <div className="personality-icon">{personality.icon}</div>
                        <h3>{personality.name}</h3>
                        <p>{personality.description}</p>

                        {activePersonality?.id === personality.id && (
                            <span className="active-badge">Active</span>
                        )}

                        {showDetails === personality.id && (
                            <div className="trait-details">
                                <div className="trait-row">
                                    <span>Formality</span>
                                    {getTraitBar(personality.traits.formality)}
                                </div>
                                <div className="trait-row">
                                    <span>Humor</span>
                                    {getTraitBar(personality.traits.humor)}
                                </div>
                                <div className="trait-row">
                                    <span>Verbosity</span>
                                    {getTraitBar(personality.traits.verbosity)}
                                </div>
                                <div className="trait-row">
                                    <span>Encouragement</span>
                                    {getTraitBar(personality.traits.encouragement)}
                                </div>
                                <div className="trait-row">
                                    <span>Creativity</span>
                                    {getTraitBar(personality.traits.creativity)}
                                </div>
                                <div className="trait-row">
                                    <span>Patience</span>
                                    {getTraitBar(personality.traits.patience)}
                                </div>
                                <div className="trait-row">
                                    <span>Technicality</span>
                                    {getTraitBar(personality.traits.technicality)}
                                </div>
                                <div className="trait-row">
                                    <span>Proactivity</span>
                                    {getTraitBar(personality.traits.proactivity)}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {activePersonality && (
                <div className="current-personality">
                    <h3>Currently Active: {activePersonality.icon} {activePersonality.name}</h3>
                    <div className="sample-messages">
                        <button onClick={() => getGreeting(activePersonality.id)}>
                            Test Greeting
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PersonalitySwitcher;
