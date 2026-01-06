/**
 * TestGeneratorView - AI-powered test generation interface
 */

import React, { useState, useEffect } from 'react';
import {
    SparklesIcon,
    DocumentDuplicateIcon,
    ArrowDownTrayIcon,
    EyeIcon,
    CodeBracketIcon,
    FolderOpenIcon,
} from '@heroicons/react/24/outline';
import { TestFramework, TestGenerationOptions, TestSuite, TestProgressEvent } from '../../types/testing';

export default function TestGeneratorView() {
    const [sourceCode, setSourceCode] = useState('');
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [framework, setFramework] = useState<TestFramework>(TestFramework.Jest);
    const [options, setOptions] = useState<TestGenerationOptions>({
        includeEdgeCases: true,
        includeMocks: true,
        coverageTarget: 80,
        generateFixtures: false,
        testStyle: 'unit',
    });
    const [generating, setGenerating] = useState(false);
    const [progress, setProgress] = useState<TestProgressEvent | null>(null);
    const [generatedSuite, setGeneratedSuite] = useState<TestSuite | null>(null);
    const [generatedCode, setGeneratedCode] = useState('');

    // Listen for progress updates
    useEffect(() => {
        const handleProgress = (_: any, event: TestProgressEvent) => {
            setProgress(event);
        };

        window.shadowAPI.on('testing:progress', handleProgress);

        return () => {
            window.shadowAPI.off('testing:progress', handleProgress);
        };
    }, []);

    const handleGenerate = async () => {
        if (!sourceCode.trim()) {
            alert('Please enter some code to generate tests for');
            return;
        }

        setGenerating(true);
        setProgress(null);
        setGeneratedSuite(null);
        setGeneratedCode('');

        try {
            const result = await window.shadowAPI.testing.generateFromCode(sourceCode, {
                ...options,
                framework,
            });

            if (result.success) {
                setGeneratedSuite(result.suite);

                // Get the file content
                const previewResult = await window.shadowAPI.testing.previewTestFile(result.suite);
                if (previewResult.success) {
                    setGeneratedCode(previewResult.content);
                }
            } else {
                alert(`Error: ${result.error}`);
            }
        } catch (error: any) {
            alert(`Error generating tests: ${error.message}`);
        } finally {
            setGenerating(false);
            setProgress(null);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedCode);
        // TODO: Show toast notification
    };

    const handleSave = async () => {
        if (!generatedSuite) return;

        // TODO: Open file dialog to choose save location
        const savePath = `${generatedSuite.filePath}`;

        try {
            const result = await window.shadowAPI.testing.saveTestSuite(generatedSuite, savePath);

            if (result.success) {
                alert(`Tests saved to ${result.path}`);
            } else {
                alert(`Error saving: ${result.error}`);
            }
        } catch (error: any) {
            alert(`Error: ${error.message}`);
        }
    };

    return (
        <div className="h-full flex flex-col bg-gray-900">
            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Configuration Header */}
                    <div className="flex gap-4 items-start">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Source
                            </label>
                            <div className="flex gap-2">
                                <select
                                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    value={selectedFile ? 'file' : 'code'}
                                    onChange={(e) => {
                                        if (e.target.value === 'file') {
                                            // TODO: Open file picker
                                        }
                                    }}
                                >
                                    <option value="code">From Code</option>
                                    <option value="file">From File</option>
                                </select>
                                {selectedFile && (
                                    <button className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition-colors">
                                        <FolderOpenIcon className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Framework
                            </label>
                            <select
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                value={framework}
                                onChange={(e) => setFramework(e.target.value as TestFramework)}
                            >
                                <option value={TestFramework.Jest}>Jest</option>
                                <option value={TestFramework.Mocha}>Mocha</option>
                                <option value={TestFramework.Pytest}>Pytest</option>
                                <option value={TestFramework.JUnit}>JUnit</option>
                            </select>
                        </div>
                    </div>

                    {/* Code Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            <CodeBracketIcon className="w-5 h-5 inline mr-1" />
                            Code to Test
                        </label>
                        <textarea
                            className="w-full h-64 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                            placeholder="// Paste your code here..."
                            value={sourceCode}
                            onChange={(e) => setSourceCode(e.target.value)}
                        />
                    </div>

                    {/* Options */}
                    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-300 mb-3">⚙️ Options</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={options.includeEdgeCases}
                                    onChange={(e) =>
                                        setOptions({ ...options, includeEdgeCases: e.target.checked })
                                    }
                                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500"
                                />
                                Include Edge Cases
                            </label>

                            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={options.includeMocks}
                                    onChange={(e) =>
                                        setOptions({ ...options, includeMocks: e.target.checked })
                                    }
                                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500"
                                />
                                Include Mocks
                            </label>

                            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={options.generateFixtures}
                                    onChange={(e) =>
                                        setOptions({ ...options, generateFixtures: e.target.checked })
                                    }
                                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500"
                                />
                                Generate Fixtures
                            </label>

                            <div>
                                <label className="block text-sm text-gray-300 mb-1">Test Style</label>
                                <select
                                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    value={options.testStyle}
                                    onChange={(e) =>
                                        setOptions({
                                            ...options,
                                            testStyle: e.target.value as 'unit' | 'integration' | 'both',
                                        })
                                    }
                                >
                                    <option value="unit">Unit</option>
                                    <option value="integration">Integration</option>
                                    <option value="both">Both</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm text-gray-300 mb-2">
                                Coverage Target: {options.coverageTarget}%
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                step="5"
                                value={options.coverageTarget}
                                onChange={(e) =>
                                    setOptions({ ...options, coverageTarget: parseInt(e.target.value) })
                                }
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-purple"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>0%</span>
                                <span>50%</span>
                                <span>100%</span>
                            </div>
                        </div>
                    </div>

                    {/* Generate Button */}
                    <button
                        onClick={handleGenerate}
                        disabled={generating || !sourceCode.trim()}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-purple-500/30"
                    >
                        {generating ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Generating Tests...
                            </>
                        ) : (
                            <>
                                <SparklesIcon className="w-5 h-5" />
                                Generate Tests with AI
                            </>
                        )}
                    </button>

                    {/* Progress */}
                    {progress && (
                        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-white">{progress.message}</div>
                                    <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                                        <div
                                            className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${progress.progress}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Generated Tests */}
                    {generatedSuite && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-white">📝 Generated Tests</h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleCopy}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                                    >
                                        <DocumentDuplicateIcon className="w-5 h-5" />
                                        Copy
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 border border-purple-500 rounded-lg text-white hover:bg-purple-700 transition-colors"
                                    >
                                        <ArrowDownTrayIcon className="w-5 h-5" />
                                        Save
                                    </button>
                                </div>
                            </div>

                            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                                <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                                    <span>Framework: <span className="text-purple-400">{generatedSuite.framework}</span></span>
                                    <span>Tests: <span className="text-green-400">{generatedSuite.testCases.length}</span></span>
                                    <span>Imports: <span className="text-blue-400">{generatedSuite.imports.length}</span></span>
                                    {generatedSuite.mocks && generatedSuite.mocks.length > 0 && (
                                        <span>Mocks: <span className="text-yellow-400">{generatedSuite.mocks.length}</span></span>
                                    )}
                                </div>

                                <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto text-sm">
                                    <code className="text-gray-300 font-mono">{generatedCode}</code>
                                </pre>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
