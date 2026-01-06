import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SecurityIssue {
    id: string;
    type: 'critical' | 'high' | 'medium' | 'low' | 'info';
    category: string;
    title: string;
    description: string;
    line?: number;
    code?: string;
    fix?: string;
}

interface ScanResult {
    timestamp: Date;
    issuesFound: number;
    issues: SecurityIssue[];
    score: number;
}

export default function SecurityScanner() {
    const [inputCode, setInputCode] = useState(`// Example code with security issues
const express = require('express');
const app = express();

// Hardcoded credentials (security issue!)
const API_KEY = "sk-1234567890abcdef";
const DB_PASSWORD = "admin123";

// SQL Injection vulnerability
app.get('/user', (req, res) => {
    const userId = req.query.id;
    const query = "SELECT * FROM users WHERE id = " + userId;
    db.query(query);
});

// XSS vulnerability
app.get('/search', (req, res) => {
    const term = req.query.q;
    res.send('<h1>Results for: ' + term + '</h1>');
});

// Insecure cookie
app.use(session({
    secret: 'mysecret',
    cookie: { secure: false }
}));

// eval usage
function runCode(code) {
    return eval(code);
}
`);

    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState<SecurityIssue | null>(null);

    const scanCode = useCallback(async () => {
        setIsScanning(true);
        await new Promise(resolve => setTimeout(resolve, 1500));

        const issues: SecurityIssue[] = [];

        // Check for hardcoded secrets
        if (/API_KEY\s*=\s*["'][^"']+["']/.test(inputCode)) {
            issues.push({
                id: '1',
                type: 'critical',
                category: 'Secrets',
                title: 'Hardcoded API Key',
                description: 'API keys should never be hardcoded in source code.',
                line: 6,
                code: 'const API_KEY = "sk-1234567890abcdef"',
                fix: 'Use environment variables: process.env.API_KEY'
            });
        }

        if (/PASSWORD\s*=\s*["'][^"']+["']/.test(inputCode)) {
            issues.push({
                id: '2',
                type: 'critical',
                category: 'Secrets',
                title: 'Hardcoded Password',
                description: 'Passwords should never be stored in code.',
                line: 7,
                code: 'const DB_PASSWORD = "admin123"',
                fix: 'Use environment variables or a secrets manager'
            });
        }

        // SQL Injection
        if (/query\s*=\s*["'][^"']*\+/.test(inputCode) || /SELECT.*\+\s*\w+/.test(inputCode)) {
            issues.push({
                id: '3',
                type: 'critical',
                category: 'Injection',
                title: 'SQL Injection Vulnerability',
                description: 'User input is directly concatenated into SQL query.',
                line: 11,
                code: '"SELECT * FROM users WHERE id = " + userId',
                fix: 'Use parameterized queries: db.query("SELECT * FROM users WHERE id = ?", [userId])'
            });
        }

        // XSS
        if (/res\.send\s*\([^)]*\+/.test(inputCode)) {
            issues.push({
                id: '4',
                type: 'high',
                category: 'XSS',
                title: 'Cross-Site Scripting (XSS)',
                description: 'User input is rendered without sanitization.',
                line: 17,
                code: "res.send('<h1>Results for: ' + term + '</h1>')",
                fix: 'Sanitize input with a library like DOMPurify or use a templating engine'
            });
        }

        // Insecure cookie
        if (/secure:\s*false/.test(inputCode)) {
            issues.push({
                id: '5',
                type: 'medium',
                category: 'Configuration',
                title: 'Insecure Cookie Configuration',
                description: 'Cookies should be set with secure: true in production.',
                line: 22,
                code: 'cookie: { secure: false }',
                fix: 'Set secure: true and add httpOnly: true, sameSite: "strict"'
            });
        }

        // eval usage
        if (/eval\s*\(/.test(inputCode)) {
            issues.push({
                id: '6',
                type: 'critical',
                category: 'Code Execution',
                title: 'Dangerous eval() Usage',
                description: 'eval() can execute arbitrary code and is a security risk.',
                line: 27,
                code: 'return eval(code)',
                fix: 'Avoid eval(). Use safer alternatives like JSON.parse() or Function constructor with caution'
            });
        }

        // Weak secret
        if (/secret:\s*['"][^'"]{0,10}['"]/.test(inputCode)) {
            issues.push({
                id: '7',
                type: 'medium',
                category: 'Secrets',
                title: 'Weak Session Secret',
                description: 'Session secret is too short and predictable.',
                line: 21,
                code: "secret: 'mysecret'",
                fix: 'Use a strong, random secret: require("crypto").randomBytes(32).toString("hex")'
            });
        }

        // Calculate score
        const score = Math.max(0, 100 - (
            issues.filter(i => i.type === 'critical').length * 25 +
            issues.filter(i => i.type === 'high').length * 15 +
            issues.filter(i => i.type === 'medium').length * 10 +
            issues.filter(i => i.type === 'low').length * 5
        ));

        setScanResult({
            timestamp: new Date(),
            issuesFound: issues.length,
            issues,
            score
        });
        setIsScanning(false);
    }, [inputCode]);

    const getSeverityColor = (type: SecurityIssue['type']) => {
        switch (type) {
            case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
            case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'info': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-400';
        if (score >= 60) return 'text-yellow-400';
        if (score >= 40) return 'text-orange-400';
        return 'text-red-400';
    };

    return (
        <div className="cyber-panel h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <div>
                    <h2 className="text-lg font-semibold text-neon-cyan flex items-center space-x-2">
                        <span>🔒</span>
                        <span>Security Scanner</span>
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">Detect vulnerabilities in your code</p>
                </div>
                <button
                    onClick={scanCode}
                    disabled={isScanning || !inputCode.trim()}
                    className="cyber-button text-sm disabled:opacity-50"
                >
                    {isScanning ? '⏳ Scanning...' : '🔍 Scan Code'}
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Code Input */}
                <div className="w-1/2 border-r border-gray-700 flex flex-col">
                    <div className="p-3 border-b border-gray-700">
                        <h3 className="text-sm font-medium text-gray-300">Code to Scan</h3>
                    </div>
                    <textarea
                        value={inputCode}
                        onChange={e => setInputCode(e.target.value)}
                        placeholder="Paste code to scan..."
                        className="flex-1 p-4 bg-gray-900 text-gray-300 font-mono text-sm resize-none focus:outline-none"
                        spellCheck={false}
                    />
                </div>

                {/* Results */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {scanResult ? (
                        <>
                            {/* Score */}
                            <div className="p-4 border-b border-gray-700 bg-gray-800/50">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-gray-500">Security Score</p>
                                        <p className={`text-3xl font-bold ${getScoreColor(scanResult.score)}`}>
                                            {scanResult.score}/100
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500">Issues Found</p>
                                        <p className="text-2xl font-bold text-white">{scanResult.issuesFound}</p>
                                    </div>
                                </div>

                                {/* Severity breakdown */}
                                <div className="flex space-x-2 mt-3">
                                    {['critical', 'high', 'medium', 'low'].map(severity => {
                                        const count = scanResult.issues.filter(i => i.type === severity).length;
                                        if (count === 0) return null;
                                        return (
                                            <span key={severity} className={`text-xs px-2 py-1 rounded border ${getSeverityColor(severity as any)}`}>
                                                {count} {severity}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Issues List */}
                            <div className="flex-1 overflow-y-auto p-4">
                                {scanResult.issues.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <div className="text-4xl mb-4">✅</div>
                                        <p>No security issues found!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {scanResult.issues.map(issue => (
                                            <motion.div
                                                key={issue.id}
                                                layoutId={issue.id}
                                                onClick={() => setSelectedIssue(issue)}
                                                className={`p-3 rounded-lg cursor-pointer border transition-all ${selectedIssue?.id === issue.id
                                                        ? 'bg-gray-800 border-neon-cyan/50'
                                                        : `${getSeverityColor(issue.type)} hover:bg-opacity-30`
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <div className="flex items-center space-x-2">
                                                            <span className={`text-xs px-1.5 py-0.5 rounded ${getSeverityColor(issue.type)}`}>
                                                                {issue.type.toUpperCase()}
                                                            </span>
                                                            <span className="text-sm font-medium text-gray-200">{issue.title}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-1">{issue.category}</p>
                                                    </div>
                                                    {issue.line && (
                                                        <span className="text-xs text-gray-500">Line {issue.line}</span>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-500">
                            <div className="text-center">
                                <div className="text-4xl mb-4">🔒</div>
                                <p>Scan your code for security issues</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Issue Details Modal */}
            <AnimatePresence>
                {selectedIssue && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                        onClick={() => setSelectedIssue(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            onClick={e => e.stopPropagation()}
                            className="cyber-panel p-6 w-full max-w-lg"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <span className={`text-xs px-2 py-0.5 rounded ${getSeverityColor(selectedIssue.type)}`}>
                                        {selectedIssue.type.toUpperCase()}
                                    </span>
                                    <h3 className="text-lg font-semibold text-white mt-2">{selectedIssue.title}</h3>
                                    <p className="text-sm text-gray-400">{selectedIssue.category}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedIssue(null)}
                                    className="text-gray-500 hover:text-gray-300"
                                >
                                    ✕
                                </button>
                            </div>

                            <p className="text-gray-300 mb-4">{selectedIssue.description}</p>

                            {selectedIssue.code && (
                                <div className="mb-4">
                                    <p className="text-xs text-gray-500 mb-1">Vulnerable Code:</p>
                                    <pre className="p-3 bg-red-900/20 border border-red-500/30 rounded text-sm text-red-300 font-mono overflow-x-auto">
                                        {selectedIssue.code}
                                    </pre>
                                </div>
                            )}

                            {selectedIssue.fix && (
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Recommended Fix:</p>
                                    <pre className="p-3 bg-green-900/20 border border-green-500/30 rounded text-sm text-green-300 font-mono overflow-x-auto">
                                        {selectedIssue.fix}
                                    </pre>
                                </div>
                            )}

                            <div className="flex justify-end mt-6">
                                <button onClick={() => setSelectedIssue(null)} className="cyber-button">
                                    Got it
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
