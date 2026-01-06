/**
 * TestingPanel - Main testing interface with tabbed views
 */

import React, { useState } from 'react';
import { BeakerIcon, PlayIcon, ChartBarIcon, SparklesIcon } from '@heroicons/react/24/outline';
import TestGeneratorView from './testing/TestGeneratorView';
import TestRunnerView from './testing/TestRunnerView';
import CoverageView from './testing/CoverageView';
import QualityView from './testing/QualityView';

type TabType = 'generate' | 'run' | 'coverage' | 'quality';

interface Tab {
    id: TabType;
    name: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const tabs: Tab[] = [
    { id: 'generate', name: 'Generate', icon: BeakerIcon },
    { id: 'run', name: 'Run', icon: PlayIcon },
    { id: 'coverage', name: 'Coverage', icon: ChartBarIcon },
    { id: 'quality', name: 'Quality', icon: SparklesIcon },
];

export default function TestingPanel() {
    const [activeTab, setActiveTab] = useState<TabType>('generate');

    return (
        <div className="testing-panel h-full flex flex-col bg-gray-900">
            {/* Header */}
            <div className="flex-shrink-0 border-b border-gray-700 bg-gray-800">
                <div className="px-6 py-4">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <BeakerIcon className="w-6 h-6 text-purple-400" />
                        Testing Framework
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
                        AI-powered test generation, execution, and analysis
                    </p>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-1 px-6">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                flex items-center gap-2 px-4 py-3 rounded-t-lg font-medium text-sm
                                transition-all duration-200 ease-in-out
                                ${activeTab === tab.id
                                    ? 'bg-gray-900 text-white border-b-2 border-purple-500'
                                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                                }
                            `}
                        >
                            <tab.icon className="w-5 h-5" />
                            {tab.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
                {activeTab === 'generate' && <TestGeneratorView />}
                {activeTab === 'run' && <TestRunnerView />}
                {activeTab === 'coverage' && <CoverageView />}
                {activeTab === 'quality' && <QualityView />}
            </div>
        </div>
    );
}
