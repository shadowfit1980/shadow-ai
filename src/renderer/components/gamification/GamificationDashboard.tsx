/**
 * Gamification Dashboard Component
 * React component for displaying XP, achievements, and leaderboards
 */
import React, { useState, useEffect } from 'react';
import './GamificationDashboard.css';

interface PlayerProfile {
    id: string;
    username: string;
    level: number;
    xp: number;
    xpToNextLevel: number;
    totalXp: number;
    rank: string;
    achievements: Achievement[];
    stats: PlayerStats;
    streaks: { currentDaily: number; longestDaily: number };
}

interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    rarity: string;
    xpReward: number;
    unlockedAt?: Date;
}

interface PlayerStats {
    linesWritten: number;
    filesCreated: number;
    bugsFixed: number;
    testsWritten: number;
    challengesCompleted: number;
}

interface LeaderboardEntry {
    rank: number;
    username: string;
    score: number;
}

interface Challenge {
    id: string;
    title: string;
    description: string;
    difficulty: string;
    xpReward: number;
    completedBy: number;
}

export const GamificationDashboard: React.FC = () => {
    const [player, setPlayer] = useState<PlayerProfile | null>(null);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [activeTab, setActiveTab] = useState<'profile' | 'achievements' | 'leaderboard' | 'challenges'>('profile');

    useEffect(() => {
        loadPlayerData();
    }, []);

    const loadPlayerData = async () => {
        try {
            const playerData = await window.shadowAPI?.invoke('gamification:get-player', 'current');
            if (playerData) setPlayer(playerData);

            const achievementsData = await window.shadowAPI?.invoke('gamification:get-achievements');
            if (achievementsData) setAchievements(achievementsData);

            const leaderboardData = await window.shadowAPI?.invoke('gamification:get-leaderboard', 'allTime');
            if (leaderboardData?.entries) setLeaderboard(leaderboardData.entries);

            const challengesData = await window.shadowAPI?.invoke('gamification:get-challenges');
            if (challengesData) setChallenges(challengesData);
        } catch (error) {
            console.error('Failed to load gamification data:', error);
        }
    };

    const calculateXpProgress = () => {
        if (!player) return 0;
        return (player.xp / player.xpToNextLevel) * 100;
    };

    const getRarityColor = (rarity: string) => {
        switch (rarity) {
            case 'legendary': return '#ffd700';
            case 'epic': return '#a855f7';
            case 'rare': return '#3b82f6';
            case 'uncommon': return '#22c55e';
            default: return '#9ca3af';
        }
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'expert': return '#dc2626';
            case 'advanced': return '#f97316';
            case 'intermediate': return '#eab308';
            case 'beginner': return '#22c55e';
            default: return '#9ca3af';
        }
    };

    return (
        <div className="gamification-dashboard">
            <header className="dashboard-header">
                <h1>🎮 Coding Arena</h1>
                {player && (
                    <div className="quick-stats">
                        <span className="level-badge">Lv. {player.level}</span>
                        <span className="streak-badge">🔥 {player.streaks.currentDaily} day streak</span>
                    </div>
                )}
            </header>

            <nav className="dashboard-tabs">
                <button
                    className={activeTab === 'profile' ? 'active' : ''}
                    onClick={() => setActiveTab('profile')}
                >
                    👤 Profile
                </button>
                <button
                    className={activeTab === 'achievements' ? 'active' : ''}
                    onClick={() => setActiveTab('achievements')}
                >
                    🏆 Achievements
                </button>
                <button
                    className={activeTab === 'leaderboard' ? 'active' : ''}
                    onClick={() => setActiveTab('leaderboard')}
                >
                    📊 Leaderboard
                </button>
                <button
                    className={activeTab === 'challenges' ? 'active' : ''}
                    onClick={() => setActiveTab('challenges')}
                >
                    ⚔️ Challenges
                </button>
            </nav>

            <main className="dashboard-content">
                {activeTab === 'profile' && player && (
                    <div className="profile-section">
                        <div className="profile-card">
                            <div className="avatar-section">
                                <div className="avatar">
                                    <span className="level-indicator">{player.level}</span>
                                </div>
                                <h2>{player.username}</h2>
                                <p className="rank">{player.rank}</p>
                            </div>

                            <div className="xp-section">
                                <div className="xp-bar">
                                    <div
                                        className="xp-fill"
                                        style={{ width: `${calculateXpProgress()}%` }}
                                    />
                                </div>
                                <p className="xp-text">
                                    {player.xp.toLocaleString()} / {player.xpToNextLevel.toLocaleString()} XP
                                </p>
                            </div>

                            <div className="stats-grid">
                                <div className="stat-item">
                                    <span className="stat-value">{player.stats.linesWritten.toLocaleString()}</span>
                                    <span className="stat-label">Lines Written</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-value">{player.stats.filesCreated}</span>
                                    <span className="stat-label">Files Created</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-value">{player.stats.bugsFixed}</span>
                                    <span className="stat-label">Bugs Fixed</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-value">{player.stats.testsWritten}</span>
                                    <span className="stat-label">Tests Written</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-value">{player.stats.challengesCompleted}</span>
                                    <span className="stat-label">Challenges</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-value">{player.totalXp.toLocaleString()}</span>
                                    <span className="stat-label">Total XP</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'achievements' && (
                    <div className="achievements-section">
                        <div className="achievements-grid">
                            {achievements.map(achievement => (
                                <div
                                    key={achievement.id}
                                    className={`achievement-card ${achievement.unlockedAt ? 'unlocked' : 'locked'}`}
                                    style={{ borderColor: getRarityColor(achievement.rarity) }}
                                >
                                    <span className="achievement-icon">{achievement.icon}</span>
                                    <h3>{achievement.name}</h3>
                                    <p>{achievement.description}</p>
                                    <div className="achievement-meta">
                                        <span
                                            className="rarity"
                                            style={{ color: getRarityColor(achievement.rarity) }}
                                        >
                                            {achievement.rarity}
                                        </span>
                                        <span className="xp-reward">+{achievement.xpReward} XP</span>
                                    </div>
                                    {achievement.unlockedAt && (
                                        <span className="unlocked-badge">✓ Unlocked</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'leaderboard' && (
                    <div className="leaderboard-section">
                        <div className="leaderboard-table">
                            {leaderboard.map((entry, index) => (
                                <div
                                    key={index}
                                    className={`leaderboard-row ${index < 3 ? `top-${index + 1}` : ''}`}
                                >
                                    <span className="rank">
                                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${entry.rank}`}
                                    </span>
                                    <span className="username">{entry.username}</span>
                                    <span className="score">{entry.score.toLocaleString()} XP</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'challenges' && (
                    <div className="challenges-section">
                        <div className="challenges-list">
                            {challenges.map(challenge => (
                                <div key={challenge.id} className="challenge-card">
                                    <div className="challenge-header">
                                        <h3>{challenge.title}</h3>
                                        <span
                                            className="difficulty"
                                            style={{ backgroundColor: getDifficultyColor(challenge.difficulty) }}
                                        >
                                            {challenge.difficulty}
                                        </span>
                                    </div>
                                    <p>{challenge.description}</p>
                                    <div className="challenge-footer">
                                        <span className="reward">🎁 {challenge.xpReward} XP</span>
                                        <span className="completed-by">
                                            👥 {challenge.completedBy.toLocaleString()} completed
                                        </span>
                                        <button className="start-btn">Start Challenge</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default GamificationDashboard;
