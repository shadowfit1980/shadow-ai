import { useState } from 'react';
import { motion } from 'framer-motion';

export default function AnalyticsDashboard() {
    const [period, setPeriod] = useState('24h');

    return (
        <div className="cyber-panel h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <div>
                    <h2 className="text-lg font-semibold text-neon-cyan flex items-center space-x-2">
                        <span>📈</span>
                        <span>Analytics Dashboard</span>
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">Agent performance and usage insights</p>
                </div>
                <div className="flex space-x-2 bg-gray-800 p-1 rounded-lg">
                    {['6h', '24h', '7d', '30d'].map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-3 py-1 text-xs rounded transition-colors ${period === p
                                    ? 'bg-neon-cyan text-black font-medium'
                                    : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-4 gap-6 mb-8">
                    {[
                        { label: 'Tasks Completed', value: '142', change: '+12%', color: 'text-green-400' },
                        { label: 'Code Generated', value: '45.2K', change: '+24%', color: 'text-blue-400' },
                        { label: 'Refactors', value: '28', change: '-5%', color: 'text-purple-400' },
                        { label: 'Avg Response', value: '1.2s', change: '-15%', color: 'text-neon-cyan' }
                    ].map((metric, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-gray-800/50 border border-gray-700 p-4 rounded-xl"
                        >
                            <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">{metric.label}</p>
                            <div className="flex items-end justify-between">
                                <h3 className={`text-3xl font-bold ${metric.color}`}>{metric.value}</h3>
                                <span className={`text-xs ${metric.change.startsWith('+') ? 'text-green-500' : 'text-red-500'} bg-gray-900 px-2 py-1 rounded`}>
                                    {metric.change}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-3 gap-6 mb-6">
                    <div className="col-span-2 bg-gray-800/50 border border-gray-700 p-6 rounded-xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-white font-medium">Activity Overview</h3>
                            <button className="text-gray-500 hover:text-white text-xs">Export CSV</button>
                        </div>

                        {/* Fake Chart Visualization */}
                        <div className="h-64 flex items-end justify-between space-x-2">
                            {Array.from({ length: 24 }).map((_, i) => {
                                const height = Math.random() * 80 + 20;
                                return (
                                    <motion.div
                                        key={i}
                                        initial={{ height: 0 }}
                                        animate={{ height: `${height}%` }}
                                        className="w-full bg-gradient-to-t from-neon-cyan/20 to-neon-cyan/60 rounded-t-sm hover:from-neon-cyan/40 hover:to-neon-cyan/80 transition-colors cursor-pointer relative group"
                                    >
                                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-gray-700 z-10">
                                            {Math.round(height * 10)} ops
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                        <div className="flex justify-between mt-4 text-xs text-gray-500 font-mono">
                            <span>00:00</span>
                            <span>06:00</span>
                            <span>12:00</span>
                            <span>18:00</span>
                            <span>23:59</span>
                        </div>
                    </div>

                    <div className="bg-gray-800/50 border border-gray-700 p-6 rounded-xl">
                        <h3 className="text-white font-medium mb-6">Task Distribution</h3>
                        <div className="h-64 flex flex-col justify-center space-y-4">
                            {[
                                { label: 'Code Generation', val: 45, color: 'bg-blue-500' },
                                { label: 'Refactoring', val: 25, color: 'bg-purple-500' },
                                { label: 'Debugging', val: 20, color: 'bg-red-500' },
                                { label: 'Documentation', val: 10, color: 'bg-green-500' }
                            ].map((item, i) => (
                                <div key={i}>
                                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                                        <span>{item.label}</span>
                                        <span>{item.val}%</span>
                                    </div>
                                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${item.val}%` }}
                                            className={`h-full ${item.color}`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent Activity Table */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-gray-700">
                        <h3 className="text-white font-medium">Recent Agent Actions</h3>
                    </div>
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-900/50 text-gray-500">
                            <tr>
                                <th className="p-4 font-medium">Action</th>
                                <th className="p-4 font-medium">Type</th>
                                <th className="p-4 font-medium">Duration</th>
                                <th className="p-4 font-medium">Status</th>
                                <th className="p-4 font-medium">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700 text-gray-300">
                            {[
                                { action: 'Created AuthController.ts', type: 'Generation', dur: '2.3s', status: 'Success', time: '2m ago' },
                                { action: 'Refactored User Model', type: 'Refactor', dur: '4.5s', status: 'Success', time: '15m ago' },
                                { action: 'Failed to parse JSON', type: 'Error', dur: '0.1s', status: 'Failed', time: '1h ago' },
                                { action: 'Generated Test Suite', type: 'Testing', dur: '8.2s', status: 'Success', time: '2h ago' },
                                { action: 'Optimized DB Query', type: 'Optimization', dur: '1.5s', status: 'Success', time: '3h ago' }
                            ].map((row, i) => (
                                <tr key={i} className="hover:bg-gray-700/30 transition-colors">
                                    <td className="p-4 text-white font-medium">{row.action}</td>
                                    <td className="p-4">
                                        <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs border border-gray-600">
                                            {row.type}
                                        </span>
                                    </td>
                                    <td className="p-4 font-mono text-gray-400">{row.dur}</td>
                                    <td className="p-4">
                                        <span className={`flex items-center space-x-1.5 ${row.status === 'Success' ? 'text-green-400' : 'text-red-400'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${row.status === 'Success' ? 'bg-green-400' : 'bg-red-400'}`} />
                                            <span>{row.status}</span>
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-500">{row.time}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
