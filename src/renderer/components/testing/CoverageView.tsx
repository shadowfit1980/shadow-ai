/**
 * CoverageView - Visual coverage metrics and insights
 */

import React, { useState, useEffect } from 'react';
import {
    ChartBarIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { TestFramework, CoverageData } from '../../types/testing';

export default function CoverageView() {
    const [framework, setFramework] = useState<TestFramework>(TestFramework.Jest);
    const [coverageData, setCoverageData] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);

    const loadCoverage = async () => {
        setLoading(true);
        try {
            const result = await window.shadowAPI.testing.getCoverage(framework);
            if (result.success && result.coverage) {
                setCoverageData(result.coverage);
            } else {
                setCoverageData(null);
            }
        } catch (error) {
            console.error('Error loading coverage:', error);
            setCoverageData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCoverage();
    }, [framework]);

    const getCoverageColor = (percentage: number) => {
        if (percentage >= 80) return 'text-green-400 bg-green-900/30 border-green-700';
        if (percentage >= 60) return 'text-yellow-400 bg-yellow-900/30 border-yellow-700';
        return 'text-red-400 bg-red-900/30 border-red-700';
    };

    const getCoverageBarColor = (percentage: number) => {
        if (percentage >= 80) return 'bg-green-500';
        if (percentage >= 60) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <div className="h-full flex flex-col bg-gray-900">
            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* Framework Selector */}
                    <div className="flex gap-4 items-center">
                        <label className="text-sm font-medium text-gray-300">
                            Framework:
                        </label>
                        <select
                            value={framework}
                            onChange={(e) => setFramework(e.target.value as TestFramework)}
                            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value={TestFramework.Jest}>Jest</option>
                            <option value={TestFramework.Mocha}>Mocha</option>
                            <option value={TestFramework.Pytest}>Pytest</option>
                        </select>
                        <button
                            onClick={loadCoverage}
                            disabled={loading}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                        >
                            {loading ? 'Loading...' : 'Refresh'}
                        </button>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-gray-400">Loading coverage data...</p>
                        </div>
                    ) : coverageData ? (
                        <>
                            {/* Overall Coverage Gauge */}
                            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-white mb-6">
                                    Overall Coverage
                                </h3>

                                <div className="flex items-center justify-center mb-8">
                                    <div className="relative">
                                        {/* Circular progress */}
                                        <svg className="w-48 h-48 transform -rotate-90">
                                            <circle
                                                cx="96"
                                                cy="96"
                                                r="88"
                                                stroke="currentColor"
                                                strokeWidth="12"
                                                fill="none"
                                                className="text-gray-700"
                                            />
                                            <circle
                                                cx="96"
                                                cy="96"
                                                r="88"
                                                stroke="currentColor"
                                                strokeWidth="12"
                                                fill="none"
                                                strokeDasharray={`${2 * Math.PI * 88}`}
                                                strokeDashoffset={`${2 * Math.PI * 88 * (1 - coverageData.percentage / 100)
                                                    }`}
                                                className={getCoverageBarColor(coverageData.percentage).replace('bg-', 'text-')}
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="text-center">
                                                <div className="text-4xl font-bold text-white">
                                                    {coverageData.percentage.toFixed(1)}%
                                                </div>
                                                <div className="text-sm text-gray-400 mt-1">Coverage</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Breakdown */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-gray-900 rounded-lg p-4">
                                        <div className="text-sm text-gray-400 mb-2">Lines</div>
                                        <div className="text-2xl font-bold text-white mb-2">
                                            {((coverageData.coveredLines / coverageData.totalLines) * 100).toFixed(1)}%
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {coverageData.coveredLines} / {coverageData.totalLines}
                                        </div>
                                        <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                                            <div
                                                className={getCoverageBarColor(
                                                    (coverageData.coveredLines / coverageData.totalLines) * 100
                                                ) + ' h-2 rounded-full'}
                                                style={{
                                                    width: `${(coverageData.coveredLines / coverageData.totalLines) * 100}%`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-gray-900 rounded-lg p-4">
                                        <div className="text-sm text-gray-400 mb-2">Functions</div>
                                        <div className="text-2xl font-bold text-white mb-2">
                                            {((coverageData.coveredFunctions / coverageData.totalFunctions) * 100).toFixed(1)}%
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {coverageData.coveredFunctions} / {coverageData.totalFunctions}
                                        </div>
                                        <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                                            <div
                                                className={getCoverageBarColor(
                                                    (coverageData.coveredFunctions / coverageData.totalFunctions) * 100
                                                ) + ' h-2 rounded-full'}
                                                style={{
                                                    width: `${(coverageData.coveredFunctions / coverageData.totalFunctions) * 100}%`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-gray-900 rounded-lg p-4">
                                        <div className="text-sm text-gray-400 mb-2">Branches</div>
                                        <div className="text-2xl font-bold text-white mb-2">
                                            {((coverageData.coveredBranches / coverageData.totalBranches) * 100).toFixed(1)}%
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {coverageData.coveredBranches} / {coverageData.totalBranches}
                                        </div>
                                        <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                                            <div
                                                className={getCoverageBarColor(
                                                    (coverageData.coveredBranches / coverageData.totalBranches) * 100
                                                ) + ' h-2 rounded-full'}
                                                style={{
                                                    width: `${(coverageData.coveredBranches / coverageData.totalBranches) * 100}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Uncovered Areas */}
                            {coverageData.uncoveredAreas && coverageData.uncoveredAreas.length > 0 && (
                                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                        <ExclamationTriangleIcon className="w-6 h-6 text-yellow-400" />
                                        Uncovered Areas ({coverageData.uncoveredAreas.length})
                                    </h3>

                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {coverageData.uncoveredAreas.map((area: any, index: number) => (
                                            <div
                                                key={index}
                                                className="bg-gray-900 border border-gray-700 rounded-lg p-3 hover:bg-gray-800 transition-colors"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="font-mono text-sm text-white mb-1">
                                                            {area.file}
                                                        </div>
                                                        <div className="text-xs text-gray-400">
                                                            {area.type.toUpperCase()} at line {area.location.line}
                                                            {area.name && ` - ${area.name}`}
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            {area.reason}
                                                        </div>
                                                    </div>
                                                    <span
                                                        className={`px-2 py-1 rounded text-xs font-medium ${area.type === 'function'
                                                                ? 'bg-blue-900/30 text-blue-400'
                                                                : area.type === 'branch'
                                                                    ? 'bg-yellow-900/30 text-yellow-400'
                                                                    : 'bg-red-900/30 text-red-400'
                                                            }`}
                                                    >
                                                        {area.type}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Suggestions */}
                            {coverageData.suggestions && coverageData.suggestions.length > 0 && (
                                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                                    <h3 className="text-lg font-semibold text-white mb-4">
                                        💡 Improvement Suggestions
                                    </h3>
                                    <ul className="space-y-2">
                                        {coverageData.suggestions.map((suggestion: string, index: number) => (
                                            <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                                                <span className="text-purple-400 mt-1">•</span>
                                                <span>{suggestion}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <ChartBarIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-400 mb-2">
                                No Coverage Data
                            </h3>
                            <p className="text-gray-500 mb-4">
                                Run tests with coverage enabled to see metrics
                            </p>
                            <button
                                onClick={loadCoverage}
                                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                Try Loading Again
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
