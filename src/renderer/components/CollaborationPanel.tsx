import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface User {
    id: string;
    name: string;
    color: string;
    status: 'active' | 'idle' | 'away';
}

interface Message {
    id: string;
    userId: string;
    userName: string;
    content: string;
    timestamp: number;
}

interface TeamMember {
    id: string;
    email: string;
    name: string;
    role: 'owner' | 'editor' | 'viewer';
    status: 'online' | 'offline' | 'busy';
    joinedAt: number;
}

interface TeamInvitation {
    id: string;
    email: string;
    role: 'owner' | 'editor' | 'viewer';
    status: 'pending' | 'accepted' | 'declined' | 'expired';
    invitedAt: number;
}

type TabType = 'team' | 'chat';

export default function CollaborationPanel() {
    const [users, setUsers] = useState<User[]>([
        { id: '1', name: 'You', color: '#4ECDC4', status: 'active' },
    ]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('team');

    // Team invitation state
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor');
    const [isInviting, setIsInviting] = useState(false);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
        { id: '1', email: 'you@example.com', name: 'You', role: 'owner', status: 'online', joinedAt: Date.now() }
    ]);
    const [pendingInvitations, setPendingInvitations] = useState<TeamInvitation[]>([]);
    const [inviteError, setInviteError] = useState<string | null>(null);
    const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

    // Load team members and invitations
    useEffect(() => {
        const loadTeamData = async () => {
            try {
                const api = (window as any).shadowAPI;
                if (api?.collaboration) {
                    const members = await api.collaboration.getTeamMembers?.();
                    const invitations = await api.collaboration.getPendingInvitations?.();
                    if (members) setTeamMembers(members);
                    if (invitations) setPendingInvitations(invitations);
                }
            } catch (error) {
                console.error('Failed to load team data:', error);
            }
        };

        if (isExpanded) {
            loadTeamData();
        }
    }, [isExpanded]);

    const sendMessage = () => {
        if (!newMessage.trim()) return;

        const message: Message = {
            id: Date.now().toString(),
            userId: '1',
            userName: 'You',
            content: newMessage,
            timestamp: Date.now(),
        };

        setMessages([...messages, message]);
        setNewMessage('');
    };

    const sendInvitation = useCallback(async () => {
        if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
            setInviteError('Please enter a valid email address');
            return;
        }

        setIsInviting(true);
        setInviteError(null);
        setInviteSuccess(null);

        try {
            const api = (window as any).shadowAPI;
            if (api?.collaboration?.sendInvitation) {
                const result = await api.collaboration.sendInvitation(inviteEmail, undefined, inviteRole);
                if (result.success) {
                    setInviteSuccess(`Invitation sent to ${inviteEmail}`);
                    setInviteEmail('');
                    // Add to pending invitations
                    if (result.invitation) {
                        setPendingInvitations(prev => [...prev, result.invitation]);
                    }
                } else {
                    setInviteError(result.error || 'Failed to send invitation');
                }
            } else {
                // Simulate invitation for demo
                const newInvitation: TeamInvitation = {
                    id: Date.now().toString(),
                    email: inviteEmail.toLowerCase(),
                    role: inviteRole,
                    status: 'pending',
                    invitedAt: Date.now()
                };
                setPendingInvitations(prev => [...prev, newInvitation]);
                setInviteSuccess(`Invitation sent to ${inviteEmail}`);
                setInviteEmail('');
            }
        } catch (error) {
            setInviteError('Failed to send invitation');
        } finally {
            setIsInviting(false);
        }
    }, [inviteEmail, inviteRole]);

    const revokeInvitation = useCallback(async (invitationId: string) => {
        try {
            const api = (window as any).shadowAPI;
            if (api?.collaboration?.revokeInvitation) {
                await api.collaboration.revokeInvitation(invitationId);
            }
            setPendingInvitations(prev => prev.filter(i => i.id !== invitationId));
        } catch (error) {
            console.error('Failed to revoke invitation:', error);
        }
    }, []);

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'owner': return 'text-yellow-400';
            case 'editor': return 'text-neon-cyan';
            case 'viewer': return 'text-gray-400';
            default: return 'text-gray-400';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'online': return 'bg-green-400';
            case 'busy': return 'bg-yellow-400';
            case 'offline': return 'bg-gray-400';
            default: return 'bg-gray-400';
        }
    };

    return (
        <div className="fixed bottom-6 left-6 z-50">
            <AnimatePresence>
                {isExpanded ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="cyber-panel w-96 h-[500px] flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-3 border-b border-gray-800 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <span className="text-lg">👥</span>
                                <span className="text-sm font-semibold text-neon-cyan">Collaboration</span>
                            </div>
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="text-gray-500 hover:text-white text-sm"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-gray-800">
                            <button
                                onClick={() => setActiveTab('team')}
                                className={`flex-1 py-2 text-xs font-medium transition-colors ${activeTab === 'team'
                                        ? 'text-neon-cyan border-b-2 border-neon-cyan'
                                        : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                👤 Team
                            </button>
                            <button
                                onClick={() => setActiveTab('chat')}
                                className={`flex-1 py-2 text-xs font-medium transition-colors ${activeTab === 'chat'
                                        ? 'text-neon-cyan border-b-2 border-neon-cyan'
                                        : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                💬 Chat
                            </button>
                        </div>

                        {activeTab === 'team' ? (
                            <>
                                {/* Invite Section */}
                                <div className="p-3 border-b border-gray-800">
                                    <div className="text-xs text-gray-500 mb-2">📧 Invite Team Member</div>
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            type="email"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && sendInvitation()}
                                            placeholder="email@example.com"
                                            className="cyber-input flex-1 text-xs"
                                        />
                                        <select
                                            value={inviteRole}
                                            onChange={(e) => setInviteRole(e.target.value as any)}
                                            className="cyber-input text-xs w-20"
                                        >
                                            <option value="editor">Editor</option>
                                            <option value="viewer">Viewer</option>
                                        </select>
                                    </div>
                                    <button
                                        onClick={sendInvitation}
                                        disabled={isInviting || !inviteEmail.trim()}
                                        className="cyber-button text-xs w-full py-1.5"
                                    >
                                        {isInviting ? '⏳ Sending...' : '📨 Send Invite'}
                                    </button>
                                    {inviteError && (
                                        <div className="text-red-400 text-xs mt-2">❌ {inviteError}</div>
                                    )}
                                    {inviteSuccess && (
                                        <div className="text-green-400 text-xs mt-2">✅ {inviteSuccess}</div>
                                    )}
                                </div>

                                {/* Pending Invitations */}
                                {pendingInvitations.length > 0 && (
                                    <div className="p-3 border-b border-gray-800">
                                        <div className="text-xs text-gray-500 mb-2">
                                            ⏳ Pending Invitations ({pendingInvitations.length})
                                        </div>
                                        <div className="space-y-2 max-h-24 overflow-y-auto">
                                            {pendingInvitations.map(inv => (
                                                <div key={inv.id} className="flex items-center justify-between text-xs">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-gray-300">{inv.email}</span>
                                                        <span className={`text-xs ${getRoleColor(inv.role)}`}>
                                                            ({inv.role})
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => revokeInvitation(inv.id)}
                                                        className="text-red-400 hover:text-red-300"
                                                        title="Revoke invitation"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Team Members */}
                                <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
                                    <div className="text-xs text-gray-500 mb-2">
                                        👥 Team Members ({teamMembers.length})
                                    </div>
                                    <div className="space-y-2">
                                        {teamMembers.map(member => (
                                            <div
                                                key={member.id}
                                                className="flex items-center justify-between p-2 rounded-lg bg-gray-800/50 hover:bg-gray-800"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className="relative">
                                                        <div
                                                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                                                            style={{ backgroundColor: '#4ECDC4' }}
                                                        >
                                                            {member.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div
                                                            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-900 ${getStatusColor(member.status)}`}
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm text-white">{member.name}</div>
                                                        <div className="text-xs text-gray-500">{member.email}</div>
                                                    </div>
                                                </div>
                                                <span className={`text-xs font-medium ${getRoleColor(member.role)}`}>
                                                    {member.role === 'owner' ? '👑' : member.role === 'editor' ? '✏️' : '👁️'} {member.role}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Access Info */}
                                <div className="p-3 border-t border-gray-800 text-xs text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <span>🔓</span>
                                        <span>Team members can access all project code when they accept</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Users */}
                                <div className="p-3 border-b border-gray-800">
                                    <div className="text-xs text-gray-500 mb-2">Online ({users.length})</div>
                                    <div className="space-y-2">
                                        {users.map(user => (
                                            <div key={user.id} className="flex items-center space-x-2">
                                                <div
                                                    className="w-2 h-2 rounded-full"
                                                    style={{ backgroundColor: user.color }}
                                                />
                                                <span className="text-sm text-white">{user.name}</span>
                                                <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-green-400' :
                                                    user.status === 'idle' ? 'bg-yellow-400' : 'bg-gray-400'
                                                    }`} />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2">
                                    {messages.length === 0 ? (
                                        <div className="text-center text-gray-500 text-xs mt-4">
                                            No messages yet. Start chatting!
                                        </div>
                                    ) : (
                                        messages.map(msg => (
                                            <div key={msg.id} className="text-sm">
                                                <div className="flex items-baseline space-x-2">
                                                    <span className="font-semibold text-neon-cyan text-xs">
                                                        {msg.userName}
                                                    </span>
                                                    <span className="text-gray-500 text-xs">
                                                        {formatTime(msg.timestamp)}
                                                    </span>
                                                </div>
                                                <div className="text-gray-300 text-xs mt-0.5">{msg.content}</div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Input */}
                                <div className="p-3 border-t border-gray-800">
                                    <div className="flex space-x-2">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                            placeholder="Type a message..."
                                            className="cyber-input flex-1 text-sm"
                                        />
                                        <button
                                            onClick={sendMessage}
                                            className="cyber-button text-sm px-3"
                                        >
                                            Send
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                ) : (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        onClick={() => setIsExpanded(true)}
                        className="cyber-panel p-3 flex items-center space-x-2 hover:border-neon-cyan/50 transition-all"
                    >
                        <span className="text-lg">👥</span>
                        <span className="text-sm text-neon-cyan">{teamMembers.length} members</span>
                        {pendingInvitations.length > 0 && (
                            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" title="Pending invitations" />
                        )}
                        {messages.length > 0 && (
                            <div className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse" />
                        )}
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}
