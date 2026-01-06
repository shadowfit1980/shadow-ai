/**
 * Collaboration Panel Component
 * React component for real-time pair programming
 */
import React, { useState, useEffect, useRef } from 'react';
import './CollaborationPanel.css';

interface Participant {
    id: string;
    name: string;
    color: string;
    role: string;
    status: string;
}

interface ChatMessage {
    id: string;
    userId: string;
    userName: string;
    content: string;
    type: string;
    timestamp: Date;
}

interface CollaborationSession {
    id: string;
    name: string;
    participants: Participant[];
    status: string;
}

export const CollaborationPanel: React.FC = () => {
    const [session, setSession] = useState<CollaborationSession | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [sessionName, setSessionName] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadCurrentSession();
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadCurrentSession = async () => {
        try {
            const currentSession = await window.shadowAPI?.invoke('collab:get-user-session', 'current-user');
            if (currentSession) {
                setSession(currentSession);
                const chatHistory = await window.shadowAPI?.invoke('collab:get-chat', currentSession.id);
                if (chatHistory) setMessages(chatHistory);
            }
        } catch (error) {
            console.error('Failed to load session:', error);
        }
    };

    const createSession = async () => {
        if (!sessionName.trim()) return;

        try {
            const newSession = await window.shadowAPI?.invoke('collab:create-session', {
                name: sessionName,
                hostId: 'current-user',
                hostName: 'You',
                documentPath: './current-file.ts',
                content: '// Start collaborating here'
            });
            if (newSession) {
                setSession(newSession);
                setIsCreating(false);
                setSessionName('');
            }
        } catch (error) {
            console.error('Failed to create session:', error);
        }
    };

    const leaveSession = async () => {
        if (!session) return;

        try {
            await window.shadowAPI?.invoke('collab:leave-session', session.id, 'current-user');
            setSession(null);
            setMessages([]);
        } catch (error) {
            console.error('Failed to leave session:', error);
        }
    };

    const sendMessage = async () => {
        if (!session || !newMessage.trim()) return;

        try {
            await window.shadowAPI?.invoke('collab:send-chat', session.id, 'current-user', 'You', newMessage);
            setNewMessage('');
            // Refresh chat
            const chatHistory = await window.shadowAPI?.invoke('collab:get-chat', session.id);
            if (chatHistory) setMessages(chatHistory);
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'online': return '#22c55e';
            case 'away': return '#eab308';
            case 'typing': return '#3b82f6';
            default: return '#6b7280';
        }
    };

    if (!session) {
        return (
            <div className="collaboration-panel empty">
                <div className="empty-state">
                    <span className="icon">🤝</span>
                    <h3>Real-Time Collaboration</h3>
                    <p>Start a session to code together</p>

                    {isCreating ? (
                        <div className="create-form">
                            <input
                                type="text"
                                placeholder="Session name..."
                                value={sessionName}
                                onChange={(e) => setSessionName(e.target.value)}
                                autoFocus
                            />
                            <div className="form-actions">
                                <button onClick={() => setIsCreating(false)}>Cancel</button>
                                <button className="primary" onClick={createSession}>Create</button>
                            </div>
                        </div>
                    ) : (
                        <button className="create-btn" onClick={() => setIsCreating(true)}>
                            ✨ Start Session
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="collaboration-panel">
            <header className="panel-header">
                <div className="session-info">
                    <h3>{session.name}</h3>
                    <span className="status-badge">{session.status}</span>
                </div>
                <button className="leave-btn" onClick={leaveSession}>Leave</button>
            </header>

            <div className="participants-section">
                <h4>Participants ({session.participants.length})</h4>
                <div className="participants-list">
                    {session.participants.map(participant => (
                        <div key={participant.id} className="participant">
                            <div
                                className="avatar"
                                style={{ backgroundColor: participant.color }}
                            >
                                {participant.name[0].toUpperCase()}
                            </div>
                            <div className="participant-info">
                                <span className="name">{participant.name}</span>
                                <span className="role">{participant.role}</span>
                            </div>
                            <div
                                className="status-dot"
                                style={{ backgroundColor: getStatusColor(participant.status) }}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div className="chat-section">
                <h4>Chat</h4>
                <div className="messages-container">
                    {messages.map(msg => (
                        <div
                            key={msg.id}
                            className={`message ${msg.type === 'system' ? 'system' : ''}`}
                        >
                            {msg.type !== 'system' && (
                                <span className="author">{msg.userName}</span>
                            )}
                            <span className="content">{msg.content}</span>
                            <span className="time">
                                {new Date(msg.timestamp).toLocaleTimeString()}
                            </span>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>

                <div className="message-input">
                    <input
                        type="text"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    />
                    <button onClick={sendMessage}>Send</button>
                </div>
            </div>
        </div>
    );
};

export default CollaborationPanel;
