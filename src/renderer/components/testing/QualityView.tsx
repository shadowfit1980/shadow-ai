/**
 * QualityView - Test quality analysis and recommendations
 */

import React, { useState } from 'react';
import {
    SparklesIcon,
    CheckCircleIcon,
    XCircleIcon,
    LightBulbIcon,
    DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { TestSuite, QualityAnalysis } from '../../types/testing';

export default function QualityView() {
    const [testSuite, setTestSuite] = useState<TestSuite | null>(null);
    const [analysis, setAnalysis] = useState<QualityAnalysis | null>(null);
    const [analyzing, setAnalyzing] = useState(false);

    const analyzeQuality = async () => {
        if (!testSuite) return;

        setAnalyzing(true);
        try {
            const result = await window.shadowAPI.testing.analyzeQuality(testSuite);
            if (result.success) {
                setAnalysis(result.analysis);
            }
        } catch (error) {
            console.error('Error analyzing quality:', error);
        } finally {
            setAnalyzing(false);
        }
    };

    const getQualityGrade = (score: number) => {
        if (score >= 0.9) return { grade: 'A+', color: 'text-green-400', bg: 'bg-green-900/30' };
        if (score >= 0.8) return { grade: 'A', color: 'text-green-400', bg: 'bg-green-900/30' };
        if (score >= 0.7) return { grade: 'B', color: 'text-blue-400', bg: 'bg-blue-900/30' };
        if (score >= 0.6) return { grade: 'C', color: 'text-yellow-400', bg: 'bg-yellow-900/30' };
        return { grade: 'D', color: 'text-red-400', bg: 'bg-red-900/30' };
    };

    const bestPractices = [
        {
            name: 'Descriptive Test Names',
            description: 'Tests have clear, meaningful names',
            checked: analysis?.quality ? analysis.quality > 0.7 : false,
        },
        {
            name: 'Single Responsibility',
            description: 'Each test focuses on one thing',
            checked: analysis?.quality ? analysis.quality > 0.6 : false,
        },
        {
            name: 'Proper Setup/Teardown',
            description: 'Tests properly initialize and clean up',
            checked: false,
        },
        {
            name: 'Independence',
            description: 'Tests don\'t depend on each other',
            checked: analysis?.quality ? analysis.quality > 0.8 : false,
        },
        {
            name: 'Edge Cases Covered',
            description: 'Tests include boundary conditions',
            checked: analysis?.quality ? analysis.quality > 0.7 : false,
        },
        {
            name: 'Mocks & Stubs Used',
            description: 'External dependencies are mocked',
            checked: analysis?.metrics?.mocks ? analysis.metrics.mocks > 0 : false,
        },
    ];

    const qualityGrade = analysis ? getQualityGrade(analysis.quality) : null;

    return (
        <div className="h-full flex flex-col bg-gray-900">
            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* Upload/Analyze Section */}
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">
                            Analyze Test Suite
                        </h3>
                        <p className="text-sm text-gray-400 mb-4">
                            Generate a test suite first, then analyze its quality here.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={analyzeQuality}
                                disabled={!testSuite || analyzing}
                                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            >
                                {analyzing ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <SparklesIcon className="w-5 h-5" />
                                        Analyze Quality
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => {
                                    // Simulate loading a test suite for demo
                                    setTestSuite({
                                        name: 'Demo Test Suite',
                                        framework: 'jest' as any,
                                        filePath: 'demo.test.ts',
                                        imports: ['@jest/globals'],
                                        testCases: [
                                            {
                                                name: 'should work',
                                                description: 'Test description',
                                                code: 'expect(true).toBe(true)',
                                                assertions: ['toBe'],
                                            },
                                        ],
                                    });
                                    // Auto-analyze
                                    setTimeout(() => {
                                        setAnalysis({
                                            quality: 0.85,
                                            suggestions: [
                                                'Add more edge case tests',
                                                'Consider using test fixtures for complex data',
                                                'Add setup/teardown hooks for better test isolation',
                                            ],
                                            metrics: {
                                                totalTests: 12,
                                                assertions: 34,
                                                mocks: 5,
                                                edgeCases: 8,
                                            },
                                        });
                                    }, 500);
                                }}
                                className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                            >
                                Load Demo Data
                            </button>
                        </div>
                    </div>

                    {analysis && qualityGrade && (
                        <>
                            {/* Quality Score */}
                            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-white mb-6">
                                    Quality Score
                                </h3>

                                <div className="flex items-center justify-center mb-6">
                                    <div className={`relative ${qualityGrade.bg} border-2 border-gray-700 rounded-full p-8`}>
                                        <div className="text-center">
                                            <div className={`text-6xl font-bold ${qualityGrade.color}`}>
                                                {qualityGrade.grade}
                                            </div>
                                            <div className="text-sm text-gray-400 mt-2">
                                                {(analysis.quality * 100).toFixed(0)}/100
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-center">
                                    <p className={`text-lg font-medium ${qualityGrade.color}`}>
                                        {analysis.quality >= 0.9
                                            ? 'Excellent! 🎉'
                                            : analysis.quality >= 0.8
                                                ? 'Very Good! 👍'
                                                : analysis.quality >= 0.7
                                                    ? 'Good 👌'
                                                    : analysis.quality >= 0.6
                                                        ? 'Fair ⚠️'
                                                        : 'Needs Improvement 📈'}
                                    </p>
                                </div>
                            </div>

                            {/* Metrics */}
                            {analysis.metrics && (
                                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                                    <h3 className="text-lg font-semibold text-white mb-4">
                                        📊 Metrics
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-gray-900 rounded-lg p-4">
                                            <div className="text-sm text-gray-400 mb-1">Total Tests</div>
                                            <div className="text-2xl font-bold text-white">
                                                {analysis.metrics.totalTests}
                                            </div>
                                        </div>
                                        <div className="bg-gray-900 rounded-lg p-4">
                                            <div className="text-sm text-gray-400 mb-1">Assertions</div>
                                            <div className="text-2xl font-bold text-white">
                                                {analysis.metrics.assertions}
                                            </div>
                                        </div>
                                        <div className="bg-gray-900 rounded-lg p-4">
                                            <div className="text-sm text-gray-400 mb-1">Mocks</div>
                                            <div className="text-2xl font-bold text-white">
                                                {analysis.metrics.mocks}
                                            </div>
                                        </div>
                                        <div className="bg-gray-900 rounded-lg p-4">
                                            <div className="text-sm text-gray-400 mb-1">Edge Cases</div>
                                            <div className="text-2xl font-bold text-white">
                                                {analysis.metrics.edgeCases}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Recommendations */}
                            {analysis.suggestions && analysis.suggestions.length > 0 && (
                                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                        <LightBulbIcon className="w-6 h-6 text-yellow-400" />
                                        AI Recommendations
                                    </h3>
                                    <div className="space-y-3">
                                        {analysis.suggestions.map((suggestion, index) => (
                                            <div
                                                key={index}
                                                className="bg-gray-900 border border-gray-700 rounded-lg p-4 flex items-start gap-3"
                                            >
                                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-900/30 border border-purple-700 flex items-center justify-center text-purple-400 text-sm font-medium">
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm text-gray-300">{suggestion}</p>
                                                </div>
                                                <span className="text-xs px-2 py-1 rounded bg-purple-900/30 text-purple-400">
                                                    {index === 0 ? 'High' : index === 1 ? 'Medium' : 'Low'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Best Practices Checklist */}
                            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-white mb-4">
                                    ✅ Best Practices
                                </h3>
                                <div className="space-y-3">
                                    {bestPractices.map((practice, index) => (
                                        <div
                                            key={index}
                                            className="flex items-start gap-3 p-3 bg-gray-900 rounded-lg"
                                        >
                                            {practice.checked ? (
                                                <CheckCircleIcon className="w-6 h-6 text-green-400 flex-shrink-0" />
                                            ) : (
                                                <XCircleIcon className="w-6 h-6 text-gray-600 flex-shrink-0" />
                                            )}
                                            <div className="flex-1">
                                                <div className="text-sm font-medium text-white mb-1">
                                                    {practice.name}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    {practice.description}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-700">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-400">Progress</span>
                                        <span className="text-white font-medium">
                                            {bestPractices.filter((p) => p.checked).length} / {bestPractices.length}
                                        </span>
                                    </div>
                                    <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                                        <div
                                            className="bg-purple-500 h-2 rounded-full transition-all"
                                            style={{
                                                width: `${(bestPractices.filter((p) => p.checked).length / bestPractices.length) * 100}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Empty State */}
                    {!analysis && (
                        <div className="text-center py-12">
                            <SparklesIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-400 mb-2">
                                No Analysis Yet
                            </h3>
                            <p className="text-gray-500">
                                Load a test suite and analyze its quality
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
