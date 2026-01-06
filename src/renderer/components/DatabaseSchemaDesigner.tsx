import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Column {
    id: string;
    name: string;
    type: string;
    isPrimaryKey?: boolean;
    isForeignKey?: boolean;
    isNullable?: boolean;
    isUnique?: boolean;
    defaultValue?: string;
    references?: { table: string; column: string };
}

interface Table {
    id: string;
    name: string;
    columns: Column[];
}

interface Schema {
    name: string;
    tables: Table[];
}

const SQL_TYPES = [
    'INT', 'BIGINT', 'SERIAL', 'UUID',
    'VARCHAR(255)', 'TEXT', 'CHAR(10)',
    'BOOLEAN', 'DATE', 'TIMESTAMP', 'TIMESTAMPTZ',
    'DECIMAL(10,2)', 'FLOAT', 'DOUBLE',
    'JSON', 'JSONB', 'ARRAY'
];

export default function DatabaseSchemaDesigner() {
    const [schema, setSchema] = useState<Schema>({
        name: 'my_database',
        tables: [
            {
                id: '1',
                name: 'users',
                columns: [
                    { id: 'c1', name: 'id', type: 'SERIAL', isPrimaryKey: true },
                    { id: 'c2', name: 'email', type: 'VARCHAR(255)', isUnique: true },
                    { id: 'c3', name: 'name', type: 'VARCHAR(255)' },
                    { id: 'c4', name: 'created_at', type: 'TIMESTAMPTZ', defaultValue: 'NOW()' }
                ]
            },
            {
                id: '2',
                name: 'posts',
                columns: [
                    { id: 'c5', name: 'id', type: 'SERIAL', isPrimaryKey: true },
                    { id: 'c6', name: 'title', type: 'VARCHAR(255)' },
                    { id: 'c7', name: 'content', type: 'TEXT' },
                    { id: 'c8', name: 'user_id', type: 'INT', isForeignKey: true, references: { table: 'users', column: 'id' } }
                ]
            }
        ]
    });
    const [selectedTable, setSelectedTable] = useState<Table | null>(null);
    const [showAddTableModal, setShowAddTableModal] = useState(false);
    const [showAddColumnModal, setShowAddColumnModal] = useState(false);
    const [generatedSQL, setGeneratedSQL] = useState('');
    const [sqlDialect, setSqlDialect] = useState<'postgresql' | 'mysql' | 'sqlite' | 'prisma'>('postgresql');

    const addTable = (name: string) => {
        const newTable: Table = {
            id: Math.random().toString(36).substr(2, 9),
            name,
            columns: [
                { id: Math.random().toString(36).substr(2, 9), name: 'id', type: 'SERIAL', isPrimaryKey: true }
            ]
        };
        setSchema(prev => ({ ...prev, tables: [...prev.tables, newTable] }));
        setShowAddTableModal(false);
    };

    const deleteTable = (id: string) => {
        setSchema(prev => ({ ...prev, tables: prev.tables.filter(t => t.id !== id) }));
        if (selectedTable?.id === id) setSelectedTable(null);
    };

    const addColumn = (tableId: string, column: Omit<Column, 'id'>) => {
        setSchema(prev => ({
            ...prev,
            tables: prev.tables.map(t =>
                t.id === tableId
                    ? { ...t, columns: [...t.columns, { ...column, id: Math.random().toString(36).substr(2, 9) }] }
                    : t
            )
        }));
        setShowAddColumnModal(false);
    };

    const deleteColumn = (tableId: string, columnId: string) => {
        setSchema(prev => ({
            ...prev,
            tables: prev.tables.map(t =>
                t.id === tableId
                    ? { ...t, columns: t.columns.filter(c => c.id !== columnId) }
                    : t
            )
        }));
    };

    const generateSQL = useCallback(() => {
        let sql = '';

        switch (sqlDialect) {
            case 'postgresql':
                sql = generatePostgreSQL(schema);
                break;
            case 'mysql':
                sql = generateMySQL(schema);
                break;
            case 'sqlite':
                sql = generateSQLite(schema);
                break;
            case 'prisma':
                sql = generatePrisma(schema);
                break;
        }

        setGeneratedSQL(sql);
    }, [schema, sqlDialect]);

    return (
        <div className="cyber-panel h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <div>
                    <h2 className="text-lg font-semibold text-neon-cyan flex items-center space-x-2">
                        <span>🗄️</span>
                        <span>Database Schema Designer</span>
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">{schema.name} • {schema.tables.length} tables</p>
                </div>
                <div className="flex items-center space-x-2">
                    <select
                        value={sqlDialect}
                        onChange={e => setSqlDialect(e.target.value as any)}
                        className="cyber-input text-sm"
                    >
                        <option value="postgresql">PostgreSQL</option>
                        <option value="mysql">MySQL</option>
                        <option value="sqlite">SQLite</option>
                        <option value="prisma">Prisma Schema</option>
                    </select>
                    <button onClick={generateSQL} className="cyber-button text-sm">
                        ⚡ Generate
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Tables Panel */}
                <div className="w-1/3 border-r border-gray-700 overflow-y-auto p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-300">Tables</h3>
                        <button
                            onClick={() => setShowAddTableModal(true)}
                            className="text-xs px-2 py-1 rounded bg-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/30"
                        >
                            + Add Table
                        </button>
                    </div>

                    <div className="space-y-2">
                        {schema.tables.map(table => (
                            <motion.div
                                key={table.id}
                                layoutId={table.id}
                                onClick={() => setSelectedTable(table)}
                                className={`p-3 rounded-lg cursor-pointer transition-all ${selectedTable?.id === table.id
                                        ? 'bg-gray-800 border border-neon-cyan/50'
                                        : 'bg-gray-800/50 border border-gray-700 hover:border-gray-600'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-lg">📋</span>
                                        <span className="text-sm text-gray-200 font-medium">{table.name}</span>
                                    </div>
                                    <span className="text-xs text-gray-500">{table.columns.length} cols</span>
                                </div>
                                <div className="mt-2 flex flex-wrap gap-1">
                                    {table.columns.slice(0, 3).map(col => (
                                        <span key={col.id} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700 text-gray-400">
                                            {col.name}
                                        </span>
                                    ))}
                                    {table.columns.length > 3 && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700 text-gray-400">
                                            +{table.columns.length - 3} more
                                        </span>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Details / SQL Output */}
                <div className="flex-1 overflow-y-auto p-4">
                    {generatedSQL ? (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-medium text-gray-300">
                                    Generated {sqlDialect === 'prisma' ? 'Prisma Schema' : 'SQL'}
                                </h3>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => navigator.clipboard.writeText(generatedSQL)}
                                        className="text-xs text-neon-cyan hover:underline"
                                    >
                                        📋 Copy
                                    </button>
                                    <button
                                        onClick={() => setGeneratedSQL('')}
                                        className="text-xs text-gray-500 hover:text-gray-400"
                                    >
                                        ← Back
                                    </button>
                                </div>
                            </div>
                            <pre className="p-4 bg-gray-900 rounded-lg overflow-x-auto text-sm text-green-300 font-mono whitespace-pre-wrap">
                                {generatedSQL}
                            </pre>
                        </div>
                    ) : selectedTable ? (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-2">
                                    <span className="text-2xl">📋</span>
                                    <span className="text-lg font-medium text-white">{selectedTable.name}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => setShowAddColumnModal(true)}
                                        className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-400"
                                    >
                                        + Column
                                    </button>
                                    <button
                                        onClick={() => deleteTable(selectedTable.id)}
                                        className="text-xs text-red-400 hover:text-red-300"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>

                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-xs text-gray-500 border-b border-gray-700">
                                        <th className="py-2 px-2">Column</th>
                                        <th className="py-2 px-2">Type</th>
                                        <th className="py-2 px-2">Constraints</th>
                                        <th className="py-2 px-2"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedTable.columns.map(col => (
                                        <tr key={col.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                                            <td className="py-2 px-2">
                                                <span className="text-sm text-gray-200 font-mono">
                                                    {col.name}
                                                </span>
                                            </td>
                                            <td className="py-2 px-2">
                                                <span className="text-sm text-blue-400">{col.type}</span>
                                            </td>
                                            <td className="py-2 px-2">
                                                <div className="flex flex-wrap gap-1">
                                                    {col.isPrimaryKey && (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">PK</span>
                                                    )}
                                                    {col.isForeignKey && (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">
                                                            FK→{col.references?.table}
                                                        </span>
                                                    )}
                                                    {col.isUnique && (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">UNQ</span>
                                                    )}
                                                    {!col.isNullable && (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">NN</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-2 px-2">
                                                {!col.isPrimaryKey && (
                                                    <button
                                                        onClick={() => deleteColumn(selectedTable.id, col.id)}
                                                        className="text-xs text-gray-500 hover:text-red-400"
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <div className="text-4xl mb-4">🗄️</div>
                            <p>Select a table to view its columns</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Table Modal */}
            <AnimatePresence>
                {showAddTableModal && (
                    <AddTableModal onClose={() => setShowAddTableModal(false)} onAdd={addTable} />
                )}
                {showAddColumnModal && selectedTable && (
                    <AddColumnModal
                        onClose={() => setShowAddColumnModal(false)}
                        onAdd={(col) => addColumn(selectedTable.id, col)}
                        tables={schema.tables}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// Modals
function AddTableModal({ onClose, onAdd }: { onClose: () => void; onAdd: (name: string) => void }) {
    const [name, setName] = useState('');

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                onClick={e => e.stopPropagation()}
                className="cyber-panel p-6 w-full max-w-sm"
            >
                <h3 className="text-lg font-semibold text-neon-cyan mb-4">Add Table</h3>
                <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="table_name"
                    className="cyber-input w-full font-mono mb-4"
                    autoFocus
                />
                <div className="flex justify-end space-x-2">
                    <button onClick={onClose} className="cyber-button-secondary">Cancel</button>
                    <button onClick={() => onAdd(name)} className="cyber-button" disabled={!name}>Add</button>
                </div>
            </motion.div>
        </motion.div>
    );
}

function AddColumnModal({
    onClose,
    onAdd,
    tables
}: {
    onClose: () => void;
    onAdd: (col: Omit<Column, 'id'>) => void;
    tables: Table[];
}) {
    const [name, setName] = useState('');
    const [type, setType] = useState('VARCHAR(255)');
    const [isPrimaryKey, setIsPrimaryKey] = useState(false);
    const [isForeignKey, setIsForeignKey] = useState(false);
    const [refTable, setRefTable] = useState('');
    const [refColumn, setRefColumn] = useState('id');

    const handleAdd = () => {
        onAdd({
            name,
            type,
            isPrimaryKey,
            isForeignKey,
            references: isForeignKey ? { table: refTable, column: refColumn } : undefined
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                onClick={e => e.stopPropagation()}
                className="cyber-panel p-6 w-full max-w-md"
            >
                <h3 className="text-lg font-semibold text-neon-cyan mb-4">Add Column</h3>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm text-gray-400 block mb-1">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="column_name"
                            className="cyber-input w-full font-mono"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-400 block mb-1">Type</label>
                        <select
                            value={type}
                            onChange={e => setType(e.target.value)}
                            className="cyber-input w-full"
                        >
                            {SQL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isPrimaryKey}
                                onChange={e => setIsPrimaryKey(e.target.checked)}
                                className="form-checkbox"
                            />
                            <span className="text-sm text-gray-300">Primary Key</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isForeignKey}
                                onChange={e => setIsForeignKey(e.target.checked)}
                                className="form-checkbox"
                            />
                            <span className="text-sm text-gray-300">Foreign Key</span>
                        </label>
                    </div>

                    {isForeignKey && (
                        <div className="flex space-x-2">
                            <select
                                value={refTable}
                                onChange={e => setRefTable(e.target.value)}
                                className="cyber-input flex-1"
                            >
                                <option value="">References table...</option>
                                {tables.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                            </select>
                            <input
                                type="text"
                                value={refColumn}
                                onChange={e => setRefColumn(e.target.value)}
                                placeholder="id"
                                className="cyber-input w-24 font-mono"
                            />
                        </div>
                    )}
                </div>

                <div className="flex justify-end space-x-2 mt-6">
                    <button onClick={onClose} className="cyber-button-secondary">Cancel</button>
                    <button onClick={handleAdd} className="cyber-button" disabled={!name}>Add</button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// SQL Generators
function generatePostgreSQL(schema: Schema): string {
    let sql = `-- PostgreSQL Schema for ${schema.name}\n\n`;

    schema.tables.forEach(table => {
        sql += `CREATE TABLE ${table.name} (\n`;
        const lines: string[] = [];

        table.columns.forEach(col => {
            let line = `    ${col.name} ${col.type}`;
            if (col.isPrimaryKey) line += ' PRIMARY KEY';
            if (col.isUnique) line += ' UNIQUE';
            if (!col.isNullable && !col.isPrimaryKey) line += ' NOT NULL';
            if (col.defaultValue) line += ` DEFAULT ${col.defaultValue}`;
            lines.push(line);
        });

        // Foreign keys
        table.columns.filter(c => c.isForeignKey && c.references).forEach(col => {
            lines.push(`    FOREIGN KEY (${col.name}) REFERENCES ${col.references!.table}(${col.references!.column})`);
        });

        sql += lines.join(',\n');
        sql += '\n);\n\n';
    });

    return sql;
}

function generateMySQL(schema: Schema): string {
    let sql = `-- MySQL Schema for ${schema.name}\n\n`;

    schema.tables.forEach(table => {
        sql += `CREATE TABLE \`${table.name}\` (\n`;
        const lines: string[] = [];

        table.columns.forEach(col => {
            const mysqlType = col.type.replace('SERIAL', 'INT AUTO_INCREMENT').replace('TIMESTAMPTZ', 'TIMESTAMP');
            let line = `    \`${col.name}\` ${mysqlType}`;
            if (col.isPrimaryKey) line += ' PRIMARY KEY';
            if (col.isUnique) line += ' UNIQUE';
            if (!col.isNullable && !col.isPrimaryKey) line += ' NOT NULL';
            lines.push(line);
        });

        table.columns.filter(c => c.isForeignKey && c.references).forEach(col => {
            lines.push(`    FOREIGN KEY (\`${col.name}\`) REFERENCES \`${col.references!.table}\`(\`${col.references!.column}\`)`);
        });

        sql += lines.join(',\n');
        sql += '\n) ENGINE=InnoDB;\n\n';
    });

    return sql;
}

function generateSQLite(schema: Schema): string {
    let sql = `-- SQLite Schema for ${schema.name}\n\n`;

    schema.tables.forEach(table => {
        sql += `CREATE TABLE ${table.name} (\n`;
        const lines: string[] = [];

        table.columns.forEach(col => {
            const sqliteType = col.type
                .replace('SERIAL', 'INTEGER')
                .replace('TIMESTAMPTZ', 'TEXT')
                .replace('JSONB', 'TEXT')
                .replace(/VARCHAR\(\d+\)/g, 'TEXT');
            let line = `    ${col.name} ${sqliteType}`;
            if (col.isPrimaryKey) line += ' PRIMARY KEY AUTOINCREMENT';
            if (col.isUnique) line += ' UNIQUE';
            if (!col.isNullable && !col.isPrimaryKey) line += ' NOT NULL';
            lines.push(line);
        });

        table.columns.filter(c => c.isForeignKey && c.references).forEach(col => {
            lines.push(`    FOREIGN KEY (${col.name}) REFERENCES ${col.references!.table}(${col.references!.column})`);
        });

        sql += lines.join(',\n');
        sql += '\n);\n\n';
    });

    return sql;
}

function generatePrisma(schema: Schema): string {
    let code = `// Prisma Schema for ${schema.name}\n\n`;
    code += `generator client {\n  provider = "prisma-client-js"\n}\n\n`;
    code += `datasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n}\n\n`;

    schema.tables.forEach(table => {
        const modelName = table.name.charAt(0).toUpperCase() + table.name.slice(1);
        code += `model ${modelName} {\n`;

        table.columns.forEach(col => {
            let prismaType = mapToPrismaType(col.type);
            let line = `  ${col.name} ${prismaType}`;
            if (col.isPrimaryKey) line += ' @id @default(autoincrement())';
            if (col.isUnique) line += ' @unique';
            if (col.defaultValue === 'NOW()') line = line.replace('@default(autoincrement())', '@default(now())');
            code += line + '\n';
        });

        code += '}\n\n';
    });

    return code;
}

function mapToPrismaType(sqlType: string): string {
    const map: Record<string, string> = {
        'SERIAL': 'Int',
        'INT': 'Int',
        'BIGINT': 'BigInt',
        'VARCHAR(255)': 'String',
        'TEXT': 'String',
        'BOOLEAN': 'Boolean',
        'DATE': 'DateTime',
        'TIMESTAMP': 'DateTime',
        'TIMESTAMPTZ': 'DateTime',
        'DECIMAL(10,2)': 'Decimal',
        'FLOAT': 'Float',
        'JSON': 'Json',
        'JSONB': 'Json',
        'UUID': 'String'
    };
    return map[sqlType] || 'String';
}
