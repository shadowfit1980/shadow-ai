import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '../store';

export default function CodeEditor() {
    const { codeContent, setCodeContent } = useAppStore();
    const [language, setLanguage] = useState('javascript');
    const [copied, setCopied] = useState(false);
    const [localCode, setLocalCode] = useState(codeContent);

    useEffect(() => {
        if (!codeContent) {
            const initial = `// Write your code here\nfunction example() {\n  console.log('Hello, Shadow AI!');\n}\n\nexample();`;
            setCodeContent(initial);
            setLocalCode(initial);
        }
    }, []);

    // Debounce code updates to store
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (localCode !== codeContent) {
                setCodeContent(localCode);
            }
        }, 300);
        return () => clearTimeout(timeout);
    }, [localCode]);

    // Sync localCode with store if store changes externally (e.g., AI generates code)
    useEffect(() => {
        console.log('[CodeEditor] Store codeContent changed:', codeContent?.length, 'chars');
        if (codeContent && codeContent !== localCode) {
            console.log('[CodeEditor] Updating local code from store');
            setLocalCode(codeContent);
        }
    }, [codeContent]);

    const handleCopy = () => {
        navigator.clipboard.writeText(codeContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        if (!codeContent.trim()) {
            alert('No code to download!');
            return;
        }

        // Detect file type
        const isHTML = codeContent.includes('<html') || codeContent.includes('<!DOCTYPE');
        const isJS = codeContent.includes('function') || codeContent.includes('const') || codeContent.includes('let');
        const isCSS = codeContent.includes('{') && (codeContent.includes('color:') || codeContent.includes('background:'));

        let filename = 'code.txt';
        let mimeType = 'text/plain';

        if (isHTML) {
            filename = 'index.html';
            mimeType = 'text/html';
        } else if (isJS) {
            filename = 'script.js';
            mimeType = 'text/javascript';
        } else if (isCSS) {
            filename = 'styles.css';
            mimeType = 'text/css';
        }

        // Create download
        const blob = new Blob([codeContent], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log(`✅ Downloaded as ${filename}`);
    };

    return (
        <div className="h-full flex flex-col bg-gray-950">
            {/* Toolbar */}
            <div className="p-3 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <span className="text-sm font-mono text-gray-400">Code Editor</span>
                    <div className="flex items-center space-x-1">
                        <button
                            onClick={() => setLanguage('javascript')}
                            className={`px-2 py-1 rounded text-xs ${language === 'javascript' ? 'bg-neon-cyan/20 text-neon-cyan' : 'text-gray-500'}`}
                        >
                            JS
                        </button>
                        <button
                            onClick={() => setLanguage('typescript')}
                            className={`px-2 py-1 rounded text-xs ${language === 'typescript' ? 'bg-neon-cyan/20 text-neon-cyan' : 'text-gray-500'}`}
                        >
                            TS
                        </button>
                        <button
                            onClick={() => setLanguage('python')}
                            className={`px-2 py-1 rounded text-xs ${language === 'python' ? 'bg-neon-cyan/20 text-neon-cyan' : 'text-gray-500'}`}
                        >
                            PY
                        </button>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={handleDownload}
                        className="cyber-button-secondary text-xs px-3 py-1"
                        title="Download code as file"
                    >
                        ⬇️ Download
                    </button>
                    <button onClick={handleCopy} className="cyber-button-secondary text-xs px-3 py-1">
                        {copied ? '✓ Copied' : '📋 Copy'}
                    </button>
                </div>
            </div>

            {/* Code Editor */}
            <div className="flex-1 overflow-hidden">
                <textarea
                    value={localCode}
                    onChange={(e) => setLocalCode(e.target.value)}
                    className="w-full h-full p-4 bg-gray-950 text-gray-100 font-mono text-sm resize-none focus:outline-none scrollbar-thin"
                    spellCheck={false}
                    style={{
                        tabSize: 2,
                        fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                    }}
                />
            </div>
        </div>
    );
}
