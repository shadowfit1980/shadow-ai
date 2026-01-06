/**
 * Team Panel Component
 * 
 * Team collaboration sidebar with presence, sessions, and activity
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TeamMember {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    status: 'online' | 'away' | 'busy' | 'offline';
    currentFile?: string;
}

interface Activity {
    id: string;
    type: string;
    userName: string;
    description: string;
    timestamp: Date;
}

interface ChatMessage {
    id: string;
    userId: string;
    userName: string;
    content: string;
    timestamp: Date;
}

const TeamPanel: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [activeTab, setActiveTab] = useState<'members' | 'activity' | 'chat'>('members');
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const connectAndLoad = async () => {
            try {
                const connected = await (window as any).shadowAPI?.collaboration?.connect?.('wss://shadow-collab.io');
                setIsConnected(connected);
                const membersData = await (window as any).shadowAPI?.collaboration?.getMembers?.();
                const activitiesData = await (window as any).shadowAPI?.collaboration?.getActivities?.();
                if (membersData) setMembers(membersData);
                if (activitiesData) setActivities(activitiesData);
            } catch (err) {
                console.error('Collaboration connection failed:', err);
                setIsConnected(false);
            }
        };
        connectAndLoad();

        // Poll for updates (in real app, use WebSocket events)
        const interval = setInterval(async () => {
            try {
                const membersData = await (window as any).shadowAPI?.collaboration?.getMembers?.();
                const activitiesData = await (window as any).shadowAPI?.collaboration?.getActivities?.();
                if (membersData) setMembers(membersData);
                if (activitiesData) setActivities(activitiesData);
            } catch (err) {
                console.error('Polling for updates failed:', err);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            await (window as any).shadowAPI?.collaboration?.sendMessage?.(newMessage);
            const activitiesData = await (window as any).shadowAPI?.collaboration?.getActivities?.();
            if (activitiesData) setActivities(activitiesData);
            setNewMessage('');
        } catch (err) {
            console.error('Failed to send message:', err);
            // Optimistic UI update
            const mockMsg: ChatMessage = {
                id: Date.now().toString(),
                userId: 'me',
                userName: 'You',
                content: newMessage,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, mockMsg]);
            setNewMessage('');
        }
    };

    const getStatusColor = (status: TeamMember['status']) => {
        switch (status) {
            case 'online': return 'bg-green-500';
            case 'away': return 'bg-yellow-500';
            case 'busy': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    const formatTime = (date: Date) => {
        return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="cyber-panel h-full flex flex-col border-l border-gray-700">
            {/* Header */}
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <h2 className="text-lg font-semibold text-neon-cyan">Team Collaboration</h2>
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
                        title={isConnected ? 'Connected' : 'Disconnected'} />
                </div>
                {onClose && (
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        ✕
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-700">
                {['members', 'activity', 'chat'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === tab
                            ? 'border-neon-cyan text-neon-cyan'
                            : 'border-transparent text-gray-400 hover:text-white'
                            }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                <AnimatePresence mode="wait">
                    {activeTab === 'members' && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-4"
                        >
                            {members.map(member => (
                                <div key={member.id} className="flex items-center space-x-3 p-2 hover:bg-gray-800 rounded-lg transition-colors">
                                    <div className="relative">
                                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                            {member.avatar ? (
                                                <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-sm font-bold">{member.name.substring(0, 2).toUpperCase()}</span>
                                            )}
                                        </div>
                                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#161b22] ${getStatusColor(member.status)}`} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-white">{member.name}</h3>
                                        <p className="text-xs text-gray-500">{member.currentFile || 'Idle'}</p>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {activeTab === 'activity' && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-4"
                        >
                            {activities.map(activity => (
                                <div key={activity.id} className="flex items-start space-x-3 text-sm">
                                    <div className="mt-1 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                                    <div>
                                        <p className="text-gray-300">
                                            <span className="font-semibold text-white">{activity.userName}</span> {activity.description}
                                        </p>
                                        <span className="text-xs text-gray-500">{formatTime(activity.timestamp)}</span>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {activeTab === 'chat' && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="h-full flex flex-col"
                        >
                            <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                                {messages.map(msg => (
                                    <div key={msg.id} className={`flex flex-col ${msg.userId === 'me' ? 'items-end' : 'items-start'}`}>
                                        <div className={`max-w-[80%] rounded-lg p-3 ${msg.userId === 'me'
                                            ? 'bg-neon-blue/20 text-white'
                                            : 'bg-gray-800 text-gray-300'
                                            }`}>
                                            <p className="text-xs font-semibold mb-1 opacity-70">{msg.userName}</p>
                                            <p className="text-sm">{msg.content}</p>
                                        </div>
                                        <span className="text-[10px] text-gray-500 mt-1">{formatTime(msg.timestamp)}</span>
                                    </div>
                                ))}
                            </div>
                            <form onSubmit={sendMessage} className="mt-auto">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="cyber-input flex-1"
                                    />
                                    <button type="submit" className="cyber-button px-4">
                                        Send
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default TeamPanel;
