/**
 * Admin Dashboard Generator
 * 
 * Generate admin dashboard components with CRUD operations,
 * data tables, charts, and user management.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export interface DashboardConfig {
    title: string;
    features: {
        userManagement?: boolean;
        analytics?: boolean;
        contentManagement?: boolean;
        settings?: boolean;
    };
}

export interface CRUDTableConfig {
    entity: string;
    columns: Array<{
        key: string;
        label: string;
        type?: 'text' | 'number' | 'date' | 'boolean' | 'badge';
        sortable?: boolean;
    }>;
    actions?: Array<'view' | 'edit' | 'delete'>;
}

// ============================================================================
// ADMIN DASHBOARD GENERATOR
// ============================================================================

export class AdminDashboardGenerator extends EventEmitter {
    private static instance: AdminDashboardGenerator;

    private constructor() {
        super();
    }

    static getInstance(): AdminDashboardGenerator {
        if (!AdminDashboardGenerator.instance) {
            AdminDashboardGenerator.instance = new AdminDashboardGenerator();
        }
        return AdminDashboardGenerator.instance;
    }

    // ========================================================================
    // DASHBOARD LAYOUT
    // ========================================================================

    generateDashboardLayout(config: DashboardConfig): string {
        return `import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';

export function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const location = useLocation();

    const navigation = [
        { name: 'Dashboard', href: '/admin', icon: '📊' },
${config.features.userManagement ? "        { name: 'Users', href: '/admin/users', icon: '👥' }," : ''}
${config.features.analytics ? "        { name: 'Analytics', href: '/admin/analytics', icon: '📈' }," : ''}
${config.features.contentManagement ? "        { name: 'Content', href: '/admin/content', icon: '📝' }," : ''}
${config.features.settings ? "        { name: 'Settings', href: '/admin/settings', icon: '⚙️' }," : ''}
    ];

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className={\`\${sidebarOpen ? 'w-64' : 'w-20'} bg-gray-900 text-white transition-all\`}>
                <div className="p-4">
                    <h1 className="text-xl font-bold">${config.title}</h1>
                </div>
                <nav className="mt-8">
                    {navigation.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={\`flex items-center px-4 py-3 hover:bg-gray-800 \${
                                    isActive ? 'bg-gray-800 border-l-4 border-blue-500' : ''
                                }\`}
                            >
                                <span className="text-2xl">{item.icon}</span>
                                {sidebarOpen && (
                                    <span className="ml-3">{item.name}</span>
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-white shadow-sm">
                    <div className="flex items-center justify-between px-6 py-4">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            ☰
                        </button>
                        <div className="flex items-center space-x-4">
                            <button className="btn btn-sm">🔔</button>
                            <div className="flex items-center space-x-2">
                                <img
                                    src="/avatar.png"
                                    alt="User"
                                    className="w-8 h-8 rounded-full"
                                />
                                <span>Admin User</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
`;
    }

    // ========================================================================
    // CRUD DATA TABLE
    // ========================================================================

    generateCRUDTable(config: CRUDTableConfig): string {
        return `import { useState, useEffect } from 'react';

interface ${this.capitalize(config.entity)} {
${config.columns.map(col => `    ${col.key}: ${this.getTypeScriptType(col.type || 'text')};`).join('\n')}
}

export function ${this.capitalize(config.entity)}Table() {
    const [data, setData] = useState<${this.capitalize(config.entity)}[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await fetch('/api/${config.entity.toLowerCase()}');
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (column: string) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('asc');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this item?')) return;
        
        try {
            await fetch(\`/api/${config.entity.toLowerCase()}/\${id}\`, { method: 'DELETE' });
            await fetchData();
        } catch (error) {
            console.error('Failed to delete:', error);
        }
    };

    const filteredData = data.filter(item =>
        Object.values(item).some(val =>
            String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    const sortedData = sortBy
        ? [...filteredData].sort((a, b) => {
              const aVal = a[sortBy as keyof ${this.capitalize(config.entity)}];
              const bVal = b[sortBy as keyof ${this.capitalize(config.entity)}];
              const order = sortOrder === 'asc' ? 1 : -1;
              return aVal > bVal ? order : -order;
          })
        : filteredData;

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">${this.capitalize(config.entity)} Management</h2>
                <button className="btn btn-primary">+ Add ${this.capitalize(config.entity)}</button>
            </div>

            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input w-full max-w-md"
                />
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
${config.columns.map(col => `                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                onClick={() => ${col.sortable !== false ? `handleSort('${col.key}')` : 'undefined'}}
                            >
                                ${col.label}
                                {sortBy === '${col.key}' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                            </th>`).join('\n')}
${config.actions ? `                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                Actions
                            </th>` : ''}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {sortedData.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
${config.columns.map(col => `                                <td className="px-6 py-4 whitespace-nowrap">
                                    ${this.renderCell(col)}
                                </td>`).join('\n')}
${config.actions ? `                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
${config.actions.includes('view') ? `                                    <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>` : ''}
${config.actions.includes('edit') ? `                                    <button className="text-green-600 hover:text-green-900 mr-3">Edit</button>` : ''}
${config.actions.includes('delete') ? `                                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900">Delete</button>` : ''}
                                </td>` : ''}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
`;
    }

    private renderCell(col: { key: string; type?: string }): string {
        switch (col.type) {
            case 'boolean':
                return `{item.${col.key} ? '✅' : '❌'}`;
            case 'badge':
                return `<span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">{item.${col.key}}</span>`;
            case 'date':
                return `{new Date(item.${col.key}).toLocaleDateString()}`;
            default:
                return `{item.${col.key}}`;
        }
    }

    // ========================================================================
    // STATS CARDS
    // ========================================================================

    generateStatsCards(): string {
        return `export function StatsCards() {
    const stats = [
        { name: 'Total Users', value: '12,543', change: '+12%', icon: '👥', color: 'blue' },
        { name: 'Revenue', value: '$45,231', change: '+23%', icon: '💰', color: 'green' },
        { name: 'Active Sessions', value: '2,431', change: '+5%', icon: '📊', color: 'purple' },
        { name: 'Conversion Rate', value: '3.2%', change: '+0.3%', icon: '📈', color: 'orange' },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => (
                <div key={stat.name} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">{stat.name}</p>
                            <p className="text-3xl font-bold mt-1">{stat.value}</p>
                            <p className="text-sm text-green-600 mt-2">{stat.change}</p>
                        </div>
                        <div className={\`text-4xl bg-\${stat.color}-100 p-3 rounded-lg\`}>
                            {stat.icon}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
`;
    }

    private capitalize(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    private getTypeScriptType(type: string): string {
        switch (type) {
            case 'number': return 'number';
            case 'boolean': return 'boolean';
            case 'date': return 'string';
            default: return 'string';
        }
    }
}

export const adminDashboardGenerator = AdminDashboardGenerator.getInstance();
