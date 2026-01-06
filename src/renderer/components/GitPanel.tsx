import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GitBranch {
    name: string;
    isCurrent: boolean;
    lastCommit?: string;
}

interface GitFile {
    path: string;
    status: 'modified' | 'added' | 'deleted' | 'untracked' | 'renamed';
}

interface GitCommit {
    hash: string;
    message: string;
    author: string;
    date: string;
}

export default function GitPanel() {
    const [activeTab, setActiveTab] = useState<'changes' | 'branches' | 'commits' | 'stash'>('changes');
    const [branches, setBranches] = useState<GitBranch[]>([
        { name: 'main', isCurrent: true, lastCommit: 'a1b2c3d' },
        { name: 'develop', isCurrent: false, lastCommit: 'e4f5g6h' },
        { name: 'feature/model-selector', isCurrent: false, lastCommit: 'i7j8k9l' },
        { name: 'feature/code-validation', isCurrent: false, lastCommit: 'm0n1o2p' },
    ]);
    const [stagedFiles, setStagedFiles] = useState<GitFile[]>([]);
    const [unstagedFiles, setUnstagedFiles] = useState<GitFile[]>([
        { path: 'src/main/index.ts', status: 'modified' },
        { path: 'src/renderer/App.tsx', status: 'modified' },
        { path: 'src/main/ai/intelligence/', status: 'added' },
        { path: 'src/renderer/components/TerminalPanel.tsx', status: 'added' },
    ]);
    const [commits, setCommits] = useState<GitCommit[]>([
        { hash: 'a1b2c3d', message: 'Add model selector and quick actions', author: 'Shadow AI', date: '2 hours ago' },
        { hash: 'e4f5g6h', message: 'Fix Gemini model errors', author: 'Shadow AI', date: '4 hours ago' },
        { hash: 'i7j8k9l', message: 'Add code validation system', author: 'Shadow AI', date: '1 day ago' },
        { hash: 'm0n1o2p', message: 'Initial project setup', author: 'Shadow AI', date: '2 days ago' },
    ]);
    const [commitMessage, setCommitMessage] = useState('');
    const [isCommitting, setIsCommitting] = useState(false);

    const getStatusIcon = (status: GitFile['status']) => {
        switch (status) {
            case 'modified': return { icon: 'M', color: 'text-yellow-400' };
            case 'added': return { icon: 'A', color: 'text-green-400' };
            case 'deleted': return { icon: 'D', color: 'text-red-400' };
            case 'untracked': return { icon: 'U', color: 'text-gray-400' };
            case 'renamed': return { icon: 'R', color: 'text-blue-400' };
            default: return { icon: '?', color: 'text-gray-400' };
        }
    };

    const stageFile = (file: GitFile) => {
        setUnstagedFiles(prev => prev.filter(f => f.path !== file.path));
        setStagedFiles(prev => [...prev, file]);
    };

    const unstageFile = (file: GitFile) => {
        setStagedFiles(prev => prev.filter(f => f.path !== file.path));
        setUnstagedFiles(prev => [...prev, file]);
    };

    const stageAll = () => {
        setStagedFiles(prev => [...prev, ...unstagedFiles]);
        setUnstagedFiles([]);
    };

    const handleCommit = async () => {
        if (!commitMessage.trim() || stagedFiles.length === 0) return;

        setIsCommitting(true);

        // Simulate commit
        await new Promise(resolve => setTimeout(resolve, 1000));

        const newCommit: GitCommit = {
            hash: Math.random().toString(36).substr(2, 7),
            message: commitMessage,
            author: 'You',
            date: 'Just now'
        };

        setCommits(prev => [newCommit, ...prev]);
        setStagedFiles([]);
        setCommitMessage('');
        setIsCommitting(false);
    };

    const switchBranch = (branchName: string) => {
        setBranches(prev => prev.map(b => ({
            ...b,
            isCurrent: b.name === branchName
        })));
    };

    return (
        <div className="cyber-panel h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <h2 className="text-lg font-semibold text-neon-cyan flex items-center space-x-2">
                    <span>🔀</span>
                    <span>Git</span>
                </h2>
                <div className="flex items-center space-x-2">
                    <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">
                        🌿 {branches.find(b => b.isCurrent)?.name}
                    </span>
                    <button className="cyber-button-secondary text-xs px-2 py-1">
                        ↻ Refresh
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-700">
                {(['changes', 'branches', 'commits', 'stash'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2 text-sm transition-colors capitalize ${activeTab === tab
                                ? 'text-neon-cyan border-b-2 border-neon-cyan'
                                : 'text-gray-400 hover:text-gray-200'
                            }`}
                    >
                        {tab === 'changes' && `📝 Changes (${stagedFiles.length + unstagedFiles.length})`}
                        {tab === 'branches' && `🌿 Branches (${branches.length})`}
                        {tab === 'commits' && `📜 Commits`}
                        {tab === 'stash' && `📦 Stash`}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                <AnimatePresence mode="wait">
                    {activeTab === 'changes' && (
                        <motion.div
                            key="changes"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {/* Staged Files */}
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-medium text-gray-300">
                                        Staged Changes ({stagedFiles.length})
                                    </h3>
                                </div>

                                {stagedFiles.length === 0 ? (
                                    <p className="text-xs text-gray-500 italic">No staged changes</p>
                                ) : (
                                    <div className="space-y-1">
                                        {stagedFiles.map(file => {
                                            const status = getStatusIcon(file.status);
                                            return (
                                                <div
                                                    key={file.path}
                                                    className="flex items-center justify-between p-2 rounded bg-gray-800/50 group"
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <span className={`text-xs font-bold ${status.color}`}>{status.icon}</span>
                                                        <span className="text-sm text-gray-300">{file.path}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => unstageFile(file)}
                                                        className="opacity-0 group-hover:opacity-100 text-xs text-gray-400 hover:text-red-400"
                                                    >
                                                        ➖
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Unstaged Files */}
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-medium text-gray-300">
                                        Changes ({unstagedFiles.length})
                                    </h3>
                                    {unstagedFiles.length > 0 && (
                                        <button
                                            onClick={stageAll}
                                            className="text-xs text-neon-cyan hover:underline"
                                        >
                                            Stage All
                                        </button>
                                    )}
                                </div>

                                {unstagedFiles.length === 0 ? (
                                    <p className="text-xs text-gray-500 italic">Working tree clean</p>
                                ) : (
                                    <div className="space-y-1">
                                        {unstagedFiles.map(file => {
                                            const status = getStatusIcon(file.status);
                                            return (
                                                <div
                                                    key={file.path}
                                                    className="flex items-center justify-between p-2 rounded bg-gray-800/50 group"
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <span className={`text-xs font-bold ${status.color}`}>{status.icon}</span>
                                                        <span className="text-sm text-gray-300">{file.path}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => stageFile(file)}
                                                        className="opacity-0 group-hover:opacity-100 text-xs text-gray-400 hover:text-green-400"
                                                    >
                                                        ➕
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Commit Box */}
                            <div className="mt-4 pt-4 border-t border-gray-700">
                                <textarea
                                    value={commitMessage}
                                    onChange={e => setCommitMessage(e.target.value)}
                                    placeholder="Commit message..."
                                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 resize-none focus:outline-none focus:border-neon-cyan"
                                    rows={3}
                                />
                                <button
                                    onClick={handleCommit}
                                    disabled={!commitMessage.trim() || stagedFiles.length === 0 || isCommitting}
                                    className="w-full mt-2 cyber-button disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isCommitting ? '⏳ Committing...' : `✓ Commit (${stagedFiles.length} file${stagedFiles.length !== 1 ? 's' : ''})`}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'branches' && (
                        <motion.div
                            key="branches"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-2"
                        >
                            {branches.map(branch => (
                                <div
                                    key={branch.name}
                                    className={`flex items-center justify-between p-3 rounded-lg transition-colors ${branch.isCurrent
                                            ? 'bg-neon-cyan/10 border border-neon-cyan/30'
                                            : 'bg-gray-800/50 hover:bg-gray-800'
                                        }`}
                                >
                                    <div className="flex items-center space-x-2">
                                        {branch.isCurrent && <span className="text-green-400">✓</span>}
                                        <span className={branch.isCurrent ? 'text-neon-cyan font-medium' : 'text-gray-300'}>
                                            {branch.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-xs text-gray-500">{branch.lastCommit}</span>
                                        {!branch.isCurrent && (
                                            <button
                                                onClick={() => switchBranch(branch.name)}
                                                className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600"
                                            >
                                                Switch
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            <button className="w-full mt-4 cyber-button-secondary text-sm">
                                ➕ Create New Branch
                            </button>
                        </motion.div>
                    )}

                    {activeTab === 'commits' && (
                        <motion.div
                            key="commits"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-2"
                        >
                            {commits.map((commit, i) => (
                                <div
                                    key={commit.hash}
                                    className="p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-sm text-gray-200">{commit.message}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {commit.author} • {commit.date}
                                            </p>
                                        </div>
                                        <span className="text-xs font-mono text-neon-cyan bg-neon-cyan/10 px-2 py-1 rounded">
                                            {commit.hash}
                                        </span>
                                    </div>
                                    {i < commits.length - 1 && (
                                        <div className="mt-2 ml-3 border-l-2 border-gray-700 h-4" />
                                    )}
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {activeTab === 'stash' && (
                        <motion.div
                            key="stash"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center py-8"
                        >
                            <div className="text-4xl mb-4">📦</div>
                            <p className="text-gray-400">No stashed changes</p>
                            <button className="mt-4 cyber-button-secondary text-sm">
                                Stash Changes
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-700 flex justify-between">
                <button className="cyber-button-secondary text-sm">
                    ↓ Pull
                </button>
                <button className="cyber-button-secondary text-sm">
                    ↑ Push
                </button>
                <button className="cyber-button-secondary text-sm">
                    ⇄ Sync
                </button>
            </div>
        </div>
    );
}
