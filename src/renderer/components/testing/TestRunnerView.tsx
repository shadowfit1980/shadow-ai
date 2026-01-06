/**
 * TestRunnerView - Execute tests and display real-time results
 */

import React, { useState, useEffect } from 'react';
import {
    PlayIcon,
    StopIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
} from '@heroicons/react/24/outline';
import { TestFramework, TestRunResult } from '../../types/testing';

export default function TestRunnerView() {
    const [frameworks, setFrameworks] = useState<TestFramework[]>([]);
    const [selectedFrameworks, setSelectedFrameworks] = useState<TestFramework[]>([]);
    const [testFiles, setTestFiles] = useState<string[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const [running, setRunning] = useState(false);
    const [results, setResults] = useState<TestRunResult[]>([]);
    const [currentProject, setCurrentProject] = useState<string>('.'); // Current directory

    // Load available frameworks and test files
    useEffect(() => {
        loadFrameworks();
        loadTestFiles();
    }, [currentProject]);

    const loadFrameworks = async () => {
        try {
            const result = await window.shadowAPI.testing.detectFrameworks(currentProject);
            if (result.success) {
                setFrameworks(result.frameworks);
                setSelectedFrameworks(result.frameworks); // Select all by default
            }
        } catch (error) {
            console.error('Error loading frameworks:', error);
        }
    };

    const loadTestFiles = async () => {
        try {
            const result = await window.shadowAPI.testing.findTestFiles(currentProject);
            if (result.success) {
                setTestFiles(result.files);
                setSelectedFiles(result.files); // Select all by default
            }
        } catch (error) {
            console.error('Error loading test files:', error);
        }
    };

    const handleRunTests = async () => {
        setRunning(true);
        setResults([]);

        try {
            if (selectedFrameworks.length === 0) {
                // Run all
                const result = await window.shadowAPI.testing.runAllTests({ coverage: true });
                if (result.success) {
                    setResults(result.results);
                }
            } else {
                // Run selected frameworks
                const allResults: TestRunResult[] = [];
                for (const framework of selectedFrameworks) {
                    const result = await window.shadowAPI.testing.runTests(framework, {
                        coverage: true,
                        files: selectedFiles.length < testFiles.length ? selectedFiles : undefined,
                    });
                    if (result.success) {
                        allResults.push(result.results);
                    }
                }
                setResults(allResults);
            }
        } catch (error: any) {
            alert(`Error running tests: ${error.message}`);
        } finally {
            setRunning(false);
        }
    };

    const handleRerun = () => {
        handleRunTests();
    };

    const toggleFramework = (framework: TestFramework) => {
        setSelectedFrameworks((prev) =>
            prev.includes(framework)
                ? prev.filter((f) => f !== framework)
                : [...prev, framework]
        );
    };

    const toggleFile = (file: string) => {
        setSelectedFiles((prev) =>
            prev.includes(file) ? prev.filter((f) => f !== file) : [...prev, file]
        );
    };

    const toggleAllFiles = () => {
        setSelectedFiles(selectedFiles.length === testFiles.length ? [] : testFiles);
    };

    const getTotalStats = () => {
        const total = results.reduce((acc, r) => acc + r.total, 0);
        const passed = results.reduce((acc, r) => acc + r.passed, 0);
        const failed = results.reduce((acc, r) => acc + r.failed, 0);
        const duration = results.reduce((acc, r) => acc + r.duration, 0);
        return { total, passed, failed, duration };
    };

    const stats = getTotalStats();
    const successRate = stats.total > 0 ? (stats.passed / stats.total) * 100 : 0;

    return (
        <div className="h-full flex flex-col bg-gray-900">
            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* Frameworks Selection */}
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-300 mb-3">
                            Test Frameworks
                        </h3>
                        {frameworks.length === 0 ? (
                            <p className="text-sm text-gray-500">
                                No test frameworks detected. Make sure your project has test dependencies installed.
                            </p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {frameworks.map((framework) => (
                                    <button
                                        key={framework}
                                        onClick={() => toggleFramework(framework)}
                                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${selectedFrameworks.includes(framework)
                                            ? 'bg-purple-600 text-white border-2 border-purple-500'
                                            : 'bg-gray-700 text-gray-300 border-2 border-gray-600 hover:bg-gray-600'
                                            }`}
                                    >
                                        {framework}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Test Files Selection */}
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-medium text-gray-300">
                                Test Files ({selectedFiles.length}/{testFiles.length})
                            </h3>
                            <button
                                onClick={toggleAllFiles}
                                className="text-xs text-purple-400 hover:text-purple-300"
                            >
                                {selectedFiles.length === testFiles.length ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>
                        {testFiles.length === 0 ? (
                            <p className="text-sm text-gray-500">No test files found in project.</p>
                        ) : (
                            <div className="max-h-48 overflow-y-auto space-y-1">
                                {testFiles.map((file) => (
                                    <label
                                        key={file}
                                        className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer hover:bg-gray-700 px-2 py-1 rounded"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedFiles.includes(file)}
                                            onChange={() => toggleFile(file)}
                                            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-500"
                                        />
                                        <span className="font-mono text-xs">{file}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Run Controls */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleRunTests}
                            disabled={running || frameworks.length === 0}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                        >
                            {running ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Running Tests...
                                </>
                            ) : (
                                <>
                                    <PlayIcon className="w-5 h-5" />
                                    Run Tests
                                </>
                            )}
                        </button>

                        {results.length > 0 && (
                            <button
                                onClick={handleRerun}
                                disabled={running}
                                className="px-6 py-3 bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <ArrowPathIcon className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    {/* Results Summary */}
                    {results.length > 0 && (
                        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Test Results</h3>

                            {/* Overall Stats */}
                            <div className="grid grid-cols-4 gap-4 mb-6">
                                <div className="bg-gray-900 rounded-lg p-4">
                                    <div className="text-sm text-gray-400 mb-1">Total Tests</div>
                                    <div className="text-2xl font-bold text-white">{stats.total}</div>
                                </div>
                                <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
                                    <div className="text-sm text-green-400 mb-1">Passed</div>
                                    <div className="text-2xl font-bold text-green-400">{stats.passed}</div>
                                </div>
                                <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
                                    <div className="text-sm text-red-400 mb-1">Failed</div>
                                    <div className="text-2xl font-bold text-red-400">{stats.failed}</div>
                                </div>
                                <div className="bg-gray-900 rounded-lg p-4">
                                    <div className="text-sm text-gray-400 mb-1">Duration</div>
                                    <div className="text-2xl font-bold text-white">
                                        {(stats.duration / 1000).toFixed(2)}s
                                    </div>
                                </div>
                            </div>

                            {/* Success Rate Bar */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-400">Success Rate</span>
                                    <span className="text-sm font-medium text-white">
                                        {successRate.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-3">
                                    <div
                                        className={`h-3 rounded-full transition-all ${successRate >= 80
                                            ? 'bg-green-500'
                                            : successRate >= 60
                                                ? 'bg-yellow-500'
                                                : 'bg-red-500'
                                            }`}
                                        style={{ width: `${successRate}%` }}
                                    />
                                </div>
                            </div>

                            {/* Per-Framework Results */}
                            <div className="space-y-4">
                                {results.map((result, index) => (
                                    <div
                                        key={index}
                                        className="bg-gray-900 border border-gray-700 rounded-lg p-4"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                {result.success ? (
                                                    <CheckCircleIcon className="w-6 h-6 text-green-400" />
                                                ) : (
                                                    <XCircleIcon className="w-6 h-6 text-red-400" />
                                                )}
                                                <span className="font-semibold text-white">
                                                    {result.framework}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                                <ClockIcon className="w-4 h-4" />
                                                {(result.duration / 1000).toFixed(2)}s
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 text-sm">
                                            <span className="text-green-400">
                                                ✓ {result.passed} passed
                                            </span>
                                            {result.failed > 0 && (
                                                <span className="text-red-400">
                                                    ✗ {result.failed} failed
                                                </span>
                                            )}
                                            {result.coverage && (
                                                <span className="text-blue-400">
                                                    Coverage: {result.coverage.percentage.toFixed(1)}%
                                                </span>
                                            )}
                                        </div>

                                        {/* Output (collapsed by default, can be expanded) */}
                                        {result.output && (
                                            <details className="mt-3">
                                                <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-300">
                                                    View Output
                                                </summary>
                                                <pre className="mt-2 p-3 bg-black rounded text-xs text-gray-300 overflow-x-auto max-h-64">
                                                    {result.output}
                                                </pre>
                                            </details>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {results.length === 0 && !running && frameworks.length > 0 && (
                        <div className="text-center py-12">
                            <PlayIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-400 mb-2">
                                Ready to Run Tests
                            </h3>
                            <p className="text-gray-500">
                                Select frameworks and files, then click "Run Tests"
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
