// Table Component Generator - Generate data table components
import Anthropic from '@anthropic-ai/sdk';

class TableComponentGenerator {
    private anthropic: Anthropic | null = null;

    generateTanStackTable(): string {
        return `import { useReactTable, getCoreRowModel, getSortedRowModel, getPaginationRowModel, getFilteredRowModel, flexRender, ColumnDef, SortingState, ColumnFiltersState } from '@tanstack/react-table';
import { useState } from 'react';

interface DataTableProps<T> {
    data: T[];
    columns: ColumnDef<T>[];
    searchColumn?: string;
}

export function DataTable<T>({ data, columns, searchColumn }: DataTableProps<T>) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState('');

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        state: { sorting, columnFilters, globalFilter },
    });

    return (
        <div>
            <input
                placeholder="Search..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="mb-4 p-2 border rounded"
            />
            <table className="w-full border-collapse">
                <thead>
                    {table.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id} className="bg-gray-100">
                            {headerGroup.headers.map(header => (
                                <th key={header.id} onClick={header.column.getToggleSortingHandler()} className="p-3 text-left cursor-pointer">
                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                    {{ asc: ' ↑', desc: ' ↓' }[header.column.getIsSorted() as string] ?? ''}
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody>
                    {table.getRowModel().rows.map(row => (
                        <tr key={row.id} className="border-b hover:bg-gray-50">
                            {row.getVisibleCells().map(cell => (
                                <td key={cell.id} className="p-3">
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="mt-4 flex items-center gap-2">
                <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</button>
                <span>Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}</span>
                <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</button>
            </div>
        </div>
    );
}
`;
    }

    generateAgGridSetup(): string {
        return `import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridReadyEvent, GridApi } from 'ag-grid-community';
import { useState, useCallback, useRef } from 'react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

interface DataGridProps<T> {
    data: T[];
    columns: ColDef<T>[];
    onRowClick?: (data: T) => void;
    enableServerSide?: boolean;
}

export function DataGrid<T>({ data, columns, onRowClick, enableServerSide }: DataGridProps<T>) {
    const gridRef = useRef<AgGridReact<T>>(null);
    const [gridApi, setGridApi] = useState<GridApi<T> | null>(null);

    const defaultColDef: ColDef = {
        sortable: true,
        filter: true,
        resizable: true,
        floatingFilter: true,
    };

    const onGridReady = useCallback((params: GridReadyEvent<T>) => {
        setGridApi(params.api);
        params.api.sizeColumnsToFit();
    }, []);

    const onRowClicked = useCallback((event: any) => {
        onRowClick?.(event.data);
    }, [onRowClick]);

    const exportToCsv = () => {
        gridApi?.exportDataAsCsv();
    };

    return (
        <div>
            <button onClick={exportToCsv} className="mb-2 px-4 py-2 bg-blue-500 text-white rounded">Export CSV</button>
            <div className="ag-theme-alpine" style={{ height: 500, width: '100%' }}>
                <AgGridReact<T>
                    ref={gridRef}
                    rowData={data}
                    columnDefs={columns}
                    defaultColDef={defaultColDef}
                    onGridReady={onGridReady}
                    onRowClicked={onRowClicked}
                    pagination={true}
                    paginationPageSize={20}
                    rowSelection="multiple"
                    animateRows={true}
                />
            </div>
        </div>
    );
}
`;
    }

    generateCustomTable(): string {
        return `import React, { useState, useMemo } from 'react';
import './Table.css';

interface Column<T> { key: keyof T; header: string; sortable?: boolean; render?: (value: T[keyof T], row: T) => React.ReactNode; }

interface TableProps<T> {
    data: T[];
    columns: Column<T>[];
    itemsPerPage?: number;
    onRowClick?: (row: T) => void;
}

export function Table<T extends { id: string | number }>({ data, columns, itemsPerPage = 10, onRowClick }: TableProps<T>) {
    const [sortConfig, setSortConfig] = useState<{ key: keyof T; direction: 'asc' | 'desc' } | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [search, setSearch] = useState('');

    const filteredData = useMemo(() => {
        return data.filter(row => 
            columns.some(col => String(row[col.key]).toLowerCase().includes(search.toLowerCase()))
        );
    }, [data, columns, search]);

    const sortedData = useMemo(() => {
        if (!sortConfig) return filteredData;
        return [...filteredData].sort((a, b) => {
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredData, sortConfig]);

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return sortedData.slice(start, start + itemsPerPage);
    }, [sortedData, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(sortedData.length / itemsPerPage);

    const handleSort = (key: keyof T) => {
        setSortConfig(prev => 
            prev?.key === key ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' }
        );
    };

    return (
        <div className="table-container">
            <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="table-search" />
            <table className="table">
                <thead>
                    <tr>
                        {columns.map(col => (
                            <th key={String(col.key)} onClick={() => col.sortable && handleSort(col.key)} className={col.sortable ? 'sortable' : ''}>
                                {col.header}
                                {sortConfig?.key === col.key && (sortConfig.direction === 'asc' ? ' ↑' : ' ↓')}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {paginatedData.map(row => (
                        <tr key={row.id} onClick={() => onRowClick?.(row)} className={onRowClick ? 'clickable' : ''}>
                            {columns.map(col => (
                                <td key={String(col.key)}>{col.render ? col.render(row[col.key], row) : String(row[col.key])}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="pagination">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</button>
                <span>Page {currentPage} of {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</button>
            </div>
        </div>
    );
}
`;
    }

    generateTableCSS(): string {
        return `.table-container { border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.table-search { width: 100%; padding: 12px; border: none; border-bottom: 1px solid #eee; font-size: 14px; }
.table { width: 100%; border-collapse: collapse; }
.table th, .table td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #eee; }
.table th { background: #f8f9fa; font-weight: 600; color: #333; }
.table th.sortable { cursor: pointer; user-select: none; }
.table th.sortable:hover { background: #e9ecef; }
.table tbody tr:hover { background: #f8f9fa; }
.table tbody tr.clickable { cursor: pointer; }
.pagination { display: flex; justify-content: center; align-items: center; gap: 16px; padding: 16px; background: #f8f9fa; }
.pagination button { padding: 8px 16px; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer; }
.pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
.pagination button:hover:not(:disabled) { background: #e9ecef; }
`;
    }
}

export const tableComponentGenerator = new TableComponentGenerator();
