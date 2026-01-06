import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import FileExplorer from './FileExplorer';
import CodeEditor from './CodeEditor';
import TerminalPanel from './TerminalPanel';
import EmulatorPanel from './EmulatorPanel';

type RightPanel = 'preview' | 'emulator' | 'none';
type BottomPanel = 'terminal' | 'output' | 'problems' | 'none';

interface IDELayoutProps {
    onSave?: (content: string) => void;
}

export default function IDELayout({ onSave }: IDELayoutProps) {
    const [leftPanelWidth, setLeftPanelWidth] = useState(250);
    const [rightPanelWidth, setRightPanelWidth] = useState(400);
    const [bottomPanelHeight, setBottomPanelHeight] = useState(200);
    const [rightPanel, setRightPanel] = useState<RightPanel>('emulator');
    const [bottomPanel, setBottomPanel] = useState<BottomPanel>('terminal');
    const [isDragging, setIsDragging] = useState<'left' | 'right' | 'bottom' | null>(null);
    const [currentFile, setCurrentFile] = useState<string | null>(null);
    const [outputLogs, setOutputLogs] = useState<string[]>([
        '[12:00:00] Build started...',
        '[12:00:01] Compiling TypeScript...',
        '[12:00:03] Bundling assets...',
        '[12:00:05] Build completed successfully! ✓',
    ]);

    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = useCallback((panel: 'left' | 'right' | 'bottom') => {
        setIsDragging(panel);
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();

        if (isDragging === 'left') {
            const newWidth = e.clientX - rect.left;
            setLeftPanelWidth(Math.max(150, Math.min(400, newWidth)));
        } else if (isDragging === 'right') {
            const newWidth = rect.right - e.clientX;
            setRightPanelWidth(Math.max(250, Math.min(600, newWidth)));
        } else if (isDragging === 'bottom') {
            const newHeight = rect.bottom - e.clientY;
            setBottomPanelHeight(Math.max(100, Math.min(400, newHeight)));
        }
    }, [isDragging]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(null);
    }, []);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = isDragging === 'bottom' ? 'ns-resize' : 'ew-resize';
            document.body.style.userSelect = 'none';
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    const handleFileSelect = useCallback((file: any) => {
        setCurrentFile(file.path);
        console.log('Selected file:', file.path);
    }, []);

    const renderBottomPanel = () => {
        switch (bottomPanel) {
            case 'terminal':
                return <TerminalPanel />;
            case 'output':
                return (
                    <div className="h-full bg-gray-950 p-3 font-mono text-sm overflow-auto">
                        {outputLogs.map((log, i) => (
                            <div key={i} className={`${log.includes('✓') ? 'text-green-400' : log.includes('error') ? 'text-red-400' : 'text-gray-400'}`}>
                                {log}
                            </div>
                        ))}
                    </div>
                );
            case 'problems':
                return (
                    <div className="h-full bg-gray-950 p-3">
                        <div className="text-sm text-gray-400">No problems detected ✓</div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div ref={containerRef} className="h-full flex flex-col bg-gray-950 select-none">
            {/* Top Toolbar */}
            <div className="h-10 border-b border-gray-800 bg-gray-900/50 flex items-center justify-between px-4">
                <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-neon-cyan">IDE Mode</span>
                    {currentFile && (
                        <span className="text-xs text-gray-400">
                            📄 {currentFile}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        className="cyber-button-secondary text-xs px-3 py-1"
                        onClick={() => setOutputLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Running build...`])}
                    >
                        ▶️ Run
                    </button>
                    <button className="cyber-button-secondary text-xs px-3 py-1">
                        🐛 Debug
                    </button>
                    <button
                        className="cyber-button-secondary text-xs px-3 py-1"
                        onClick={() => onSave?.('')}
                    >
                        💾 Save
                    </button>
                </div>
            </div>

            {/* AI Actions Toolbar */}
            <div className="h-9 border-b border-gray-800 bg-gradient-to-r from-gray-900/80 to-gray-950 flex items-center px-4 gap-2">
                <span className="text-xs text-gray-500 mr-2">🤖 AI Actions:</span>
                <button
                    className="px-3 py-1 text-xs rounded bg-gradient-to-r from-neon-cyan/20 to-blue-500/20 text-neon-cyan border border-neon-cyan/30 hover:border-neon-cyan/60 transition-all flex items-center gap-1"
                    onClick={() => console.log('Generate code...')}
                >
                    ✨ Generate
                </button>
                <button
                    className="px-3 py-1 text-xs rounded bg-gray-800/50 text-gray-300 hover:text-white hover:bg-gray-800 transition-all flex items-center gap-1"
                    onClick={() => console.log('Explain code...')}
                >
                    💡 Explain
                </button>
                <button
                    className="px-3 py-1 text-xs rounded bg-gray-800/50 text-gray-300 hover:text-white hover:bg-gray-800 transition-all flex items-center gap-1"
                    onClick={() => console.log('Refactor code...')}
                >
                    🔄 Refactor
                </button>
                <button
                    className="px-3 py-1 text-xs rounded bg-gray-800/50 text-gray-300 hover:text-white hover:bg-gray-800 transition-all flex items-center gap-1"
                    onClick={() => console.log('Debug code...')}
                >
                    🐛 Fix Bug
                </button>
                <button
                    className="px-3 py-1 text-xs rounded bg-gray-800/50 text-gray-300 hover:text-white hover:bg-gray-800 transition-all flex items-center gap-1"
                    onClick={() => console.log('Generate tests...')}
                >
                    🧪 Add Tests
                </button>
                <button
                    className="px-3 py-1 text-xs rounded bg-gray-800/50 text-gray-300 hover:text-white hover:bg-gray-800 transition-all flex items-center gap-1"
                    onClick={() => console.log('Review code...')}
                >
                    🔍 Review
                </button>
                <div className="flex-1" />
                <button
                    className="px-3 py-1 text-xs rounded bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:border-purple-500/60 transition-all flex items-center gap-1"
                    onClick={() => console.log('Open agent selector...')}
                >
                    🤖 Select Agent
                </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel - File Explorer */}
                <motion.div
                    className="flex-shrink-0 overflow-hidden"
                    style={{ width: leftPanelWidth }}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                >
                    <FileExplorer onFileSelect={handleFileSelect} />
                </motion.div>

                {/* Left Resize Handle */}
                <div
                    className="w-1 bg-gray-800 hover:bg-neon-cyan/50 cursor-ew-resize transition-colors"
                    onMouseDown={() => handleMouseDown('left')}
                />

                {/* Center Panel - Code Editor */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Editor Tabs */}
                    <div className="h-9 border-b border-gray-800 bg-gray-900/30 flex items-center px-2 gap-1">
                        {currentFile ? (
                            <div className="flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-t text-xs text-gray-300">
                                <span>📄</span>
                                <span>{currentFile.split('/').pop()}</span>
                                <button className="text-gray-500 hover:text-gray-300">×</button>
                            </div>
                        ) : (
                            <span className="text-xs text-gray-500 px-2">No file open</span>
                        )}
                    </div>

                    {/* Code Editor Area */}
                    <div className="flex-1 overflow-hidden">
                        <CodeEditor />
                    </div>
                </div>

                {/* Right Resize Handle */}
                {rightPanel !== 'none' && (
                    <div
                        className="w-1 bg-gray-800 hover:bg-neon-cyan/50 cursor-ew-resize transition-colors"
                        onMouseDown={() => handleMouseDown('right')}
                    />
                )}

                {/* Right Panel - Preview/Emulator */}
                {rightPanel !== 'none' && (
                    <motion.div
                        className="flex-shrink-0 overflow-hidden flex flex-col"
                        style={{ width: rightPanelWidth }}
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                    >
                        {/* Right Panel Tabs */}
                        <div className="h-9 border-b border-gray-800 bg-gray-900/30 flex items-center px-2 gap-1">
                            <button
                                onClick={() => setRightPanel('emulator')}
                                className={`px-3 py-1 text-xs rounded ${rightPanel === 'emulator' ? 'bg-gray-800 text-neon-cyan' : 'text-gray-400 hover:text-gray-200'}`}
                            >
                                📱 Emulator
                            </button>
                            <button
                                onClick={() => setRightPanel('preview')}
                                className={`px-3 py-1 text-xs rounded ${rightPanel === 'preview' ? 'bg-gray-800 text-neon-cyan' : 'text-gray-400 hover:text-gray-200'}`}
                            >
                                👁️ Preview
                            </button>
                            <div className="flex-1" />
                            <button
                                onClick={() => setRightPanel('none')}
                                className="text-gray-500 hover:text-gray-300 text-xs px-1"
                            >
                                ×
                            </button>
                        </div>

                        {/* Right Panel Content */}
                        <div className="flex-1 overflow-hidden">
                            {rightPanel === 'emulator' && <EmulatorPanel />}
                            {rightPanel === 'preview' && (
                                <div className="h-full bg-white">
                                    <iframe
                                        src="about:blank"
                                        className="w-full h-full border-0"
                                        title="Preview"
                                    />
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Bottom Resize Handle */}
            {bottomPanel !== 'none' && (
                <div
                    className="h-1 bg-gray-800 hover:bg-neon-cyan/50 cursor-ns-resize transition-colors"
                    onMouseDown={() => handleMouseDown('bottom')}
                />
            )}

            {/* Bottom Panel - Terminal/Output */}
            {bottomPanel !== 'none' && (
                <motion.div
                    className="flex-shrink-0 overflow-hidden flex flex-col"
                    style={{ height: bottomPanelHeight }}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                >
                    {/* Bottom Panel Tabs */}
                    <div className="h-8 border-b border-gray-800 bg-gray-900/30 flex items-center px-2 gap-1">
                        <button
                            onClick={() => setBottomPanel('terminal')}
                            className={`px-3 py-1 text-xs rounded ${bottomPanel === 'terminal' ? 'bg-gray-800 text-neon-cyan' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            💻 Terminal
                        </button>
                        <button
                            onClick={() => setBottomPanel('output')}
                            className={`px-3 py-1 text-xs rounded ${bottomPanel === 'output' ? 'bg-gray-800 text-neon-cyan' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            📋 Output
                        </button>
                        <button
                            onClick={() => setBottomPanel('problems')}
                            className={`px-3 py-1 text-xs rounded ${bottomPanel === 'problems' ? 'bg-gray-800 text-neon-cyan' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            ⚠️ Problems
                        </button>
                        <div className="flex-1" />
                        <button
                            onClick={() => setBottomPanel('none')}
                            className="text-gray-500 hover:text-gray-300 text-xs px-1"
                        >
                            ×
                        </button>
                    </div>

                    {/* Bottom Panel Content */}
                    <div className="flex-1 overflow-hidden">
                        {renderBottomPanel()}
                    </div>
                </motion.div>
            )}

            {/* Status Bar */}
            <div className="h-6 border-t border-gray-800 bg-gray-900/50 flex items-center justify-between px-4 text-xs text-gray-500">
                <div className="flex items-center gap-4">
                    <span>TypeScript React</span>
                    <span>UTF-8</span>
                    <span>LF</span>
                </div>
                <div className="flex items-center gap-4">
                    <span>Ln 1, Col 1</span>
                    <span>Spaces: 2</span>
                    {rightPanel === 'none' && (
                        <button onClick={() => setRightPanel('emulator')} className="text-neon-cyan hover:underline">
                            Show Emulator
                        </button>
                    )}
                    {bottomPanel === 'none' && (
                        <button onClick={() => setBottomPanel('terminal')} className="text-neon-cyan hover:underline">
                            Show Terminal
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
