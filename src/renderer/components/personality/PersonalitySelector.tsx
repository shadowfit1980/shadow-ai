/**
 * 🎭 PersonalitySelector - React UI Component
 * 
 * Allows users to select AI personality with:
 * - Visual persona cards
 * - Stress level indicator
 * - Personality traits display
 * - Code style preferences
 */

import React, { useState, useEffect } from 'react';

// Types
interface AIPersonality {
    id: string;
    name: string;
    title: string;
    avatar: string;
    description: string;
    expertise: string[];
    quirks: string[];
    codeStyle: {
        indentation: string;
        semicolons: boolean;
        quotes: string;
    };
    communicationStyle: {
        formality: string;
        directness: string;
        usesEmoji: boolean;
        encouragementLevel: string;
    };
}

interface StressLevel {
    level: 'calm' | 'focused' | 'frustrated' | 'overwhelmed';
    confidence: number;
    suggestion?: string;
}

export const PersonalitySelector: React.FC<{
    onSelect?: (personality: AIPersonality) => void;
}> = ({ onSelect }) => {
    const [personalities, setPersonalities] = useState<AIPersonality[]>([]);
    const [current, setCurrent] = useState<AIPersonality | null>(null);
    const [stress, setStress] = useState<StressLevel | null>(null);
    const [loading, setLoading] = useState(true);

    const loadPersonalities = async () => {
        try {
            const result = await (window as any).shadowAPI.personality.getAll();
            if (result.success) {
                setPersonalities(result.personalities);
            }

            const currentResult = await (window as any).shadowAPI.personality.getCurrent();
            if (currentResult.success) {
                setCurrent(currentResult.personality);
            }
        } catch (err) {
            console.error('Failed to load personalities:', err);
        } finally {
            setLoading(false);
        }
    };

    const selectPersonality = async (personality: AIPersonality) => {
        try {
            const result = await (window as any).shadowAPI.personality.set(personality.id);
            if (result.success) {
                setCurrent(personality);
                onSelect?.(personality);
            }
        } catch (err) {
            console.error('Failed to select personality:', err);
        }
    };

    const checkStress = async () => {
        try {
            const result = await (window as any).shadowAPI.personality.detectStress();
            if (result.success) {
                setStress(result.stress);
            }
        } catch (err) {
            console.error('Failed to detect stress:', err);
        }
    };

    useEffect(() => {
        loadPersonalities();
        // Check stress periodically
        const interval = setInterval(checkStress, 30000);
        return () => clearInterval(interval);
    }, []);

    const getStressColor = (level: string) => {
        const colors: Record<string, string> = {
            'calm': '#10B981',
            'focused': '#3B82F6',
            'frustrated': '#F59E0B',
            'overwhelmed': '#EF4444'
        };
        return colors[level] || '#6B7280';
    };

    const getStressIcon = (level: string) => {
        const icons: Record<string, string> = {
            'calm': '😌',
            'focused': '🎯',
            'frustrated': '😤',
            'overwhelmed': '😰'
        };
        return icons[level] || '😐';
    };

    if (loading) {
        return (
            <div style={styles.loading}>
                <span>⏳</span>
                Loading personalities...
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2>🎭 AI Personality</h2>
                {stress && (
                    <div style={{
                        ...styles.stressIndicator,
                        backgroundColor: getStressColor(stress.level) + '20',
                        color: getStressColor(stress.level)
                    }}>
                        {getStressIcon(stress.level)} {stress.level}
                    </div>
                )}
            </div>

            {stress?.suggestion && (
                <div style={styles.suggestion}>
                    💡 {stress.suggestion}
                </div>
            )}

            <div style={styles.personaGrid}>
                {personalities.map(persona => (
                    <div
                        key={persona.id}
                        style={{
                            ...styles.personaCard,
                            ...(current?.id === persona.id ? styles.personaCardActive : {})
                        }}
                        onClick={() => selectPersonality(persona)}
                    >
                        <div style={styles.personaHeader}>
                            <span style={styles.personaAvatar}>{persona.avatar}</span>
                            <div>
                                <h4 style={styles.personaName}>{persona.name}</h4>
                                <span style={styles.personaTitle}>{persona.title}</span>
                            </div>
                            {current?.id === persona.id && (
                                <span style={styles.activeBadge}>✓ Active</span>
                            )}
                        </div>

                        <p style={styles.personaDescription}>{persona.description}</p>

                        <div style={styles.expertise}>
                            <strong>Expertise:</strong>
                            <div style={styles.tags}>
                                {persona.expertise.map((exp, i) => (
                                    <span key={i} style={styles.tag}>{exp}</span>
                                ))}
                            </div>
                        </div>

                        <div style={styles.traits}>
                            <div style={styles.trait}>
                                <span style={styles.traitLabel}>Formality:</span>
                                <span>{persona.communicationStyle.formality}</span>
                            </div>
                            <div style={styles.trait}>
                                <span style={styles.traitLabel}>Style:</span>
                                <span>{persona.communicationStyle.directness}</span>
                            </div>
                            <div style={styles.trait}>
                                <span style={styles.traitLabel}>Encouragement:</span>
                                <span>{persona.communicationStyle.encouragementLevel}</span>
                            </div>
                        </div>

                        {persona.communicationStyle.usesEmoji && (
                            <div style={styles.quirk}>✨ Uses emoji</div>
                        )}
                    </div>
                ))}
            </div>

            {current && (
                <div style={styles.codeStyle}>
                    <h4>Code Style Preferences</h4>
                    <div style={styles.codePrefs}>
                        <div style={styles.codePref}>
                            <span>Indentation:</span>
                            <span>{current.codeStyle.indentation}</span>
                        </div>
                        <div style={styles.codePref}>
                            <span>Semicolons:</span>
                            <span>{current.codeStyle.semicolons ? 'Yes' : 'No'}</span>
                        </div>
                        <div style={styles.codePref}>
                            <span>Quotes:</span>
                            <span>{current.codeStyle.quotes}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Styles
const styles: Record<string, React.CSSProperties> = {
    container: {
        padding: '20px',
        backgroundColor: '#1F2937',
        borderRadius: '12px',
        color: '#F9FAFB',
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
    },
    stressIndicator: {
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '14px',
        fontWeight: 500,
        textTransform: 'capitalize'
    },
    suggestion: {
        padding: '12px 16px',
        backgroundColor: '#374151',
        borderRadius: '8px',
        marginBottom: '20px',
        fontSize: '14px',
        color: '#D1D5DB'
    },
    personaGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '16px'
    },
    personaCard: {
        padding: '16px',
        backgroundColor: '#374151',
        borderRadius: '12px',
        border: '2px solid transparent',
        cursor: 'pointer',
        transition: 'border-color 0.2s, transform 0.2s'
    },
    personaCardActive: {
        borderColor: '#3B82F6'
    },
    personaHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '12px'
    },
    personaAvatar: {
        fontSize: '32px'
    },
    personaName: {
        margin: 0,
        fontSize: '16px',
        fontWeight: 600
    },
    personaTitle: {
        fontSize: '13px',
        color: '#9CA3AF'
    },
    activeBadge: {
        marginLeft: 'auto',
        padding: '4px 8px',
        backgroundColor: '#10B981',
        color: 'white',
        borderRadius: '4px',
        fontSize: '12px'
    },
    personaDescription: {
        fontSize: '14px',
        color: '#D1D5DB',
        marginBottom: '12px',
        lineHeight: 1.5
    },
    expertise: {
        marginBottom: '12px'
    },
    tags: {
        display: 'flex',
        gap: '6px',
        flexWrap: 'wrap',
        marginTop: '6px'
    },
    tag: {
        padding: '4px 8px',
        backgroundColor: '#4B5563',
        color: '#D1D5DB',
        borderRadius: '4px',
        fontSize: '11px'
    },
    traits: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        marginBottom: '8px'
    },
    trait: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '13px'
    },
    traitLabel: {
        color: '#9CA3AF'
    },
    quirk: {
        fontSize: '12px',
        color: '#FBBF24'
    },
    codeStyle: {
        marginTop: '24px',
        padding: '16px',
        backgroundColor: '#374151',
        borderRadius: '12px'
    },
    codePrefs: {
        display: 'flex',
        gap: '24px',
        marginTop: '12px'
    },
    codePref: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        fontSize: '13px'
    },
    loading: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        gap: '12px',
        color: '#9CA3AF'
    }
};

export default PersonalitySelector;
