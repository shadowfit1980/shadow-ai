// Export Generator - PDF, CSV, Excel export functionality
import Anthropic from '@anthropic-ai/sdk';

class ExportGenerator {
    private anthropic: Anthropic | null = null;

    generateCSVExport(): string {
        return `// CSV Export utilities

export function arrayToCSV<T extends Record<string, any>>(data: T[], columns?: { key: keyof T; header: string }[]): string {
    if (data.length === 0) return '';

    const keys = columns?.map(c => c.key) || (Object.keys(data[0]) as (keyof T)[]);
    const headers = columns?.map(c => c.header) || keys.map(String);

    const escapeCSV = (value: any): string => {
        const str = value?.toString() || '';
        if (str.includes(',') || str.includes('"') || str.includes('\\n')) {
            return \`"\${str.replace(/"/g, '""')}"\`;
        }
        return str;
    };

    const rows = data.map(row => keys.map(key => escapeCSV(row[key])).join(','));
    return [headers.join(','), ...rows].join('\\n');
}

export function downloadCSV(csv: string, filename: string = 'export.csv'): void {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
}

// React hook for CSV export
export function useCSVExport<T extends Record<string, any>>() {
    const exportData = (data: T[], filename?: string, columns?: { key: keyof T; header: string }[]) => {
        const csv = arrayToCSV(data, columns);
        downloadCSV(csv, filename);
    };
    return { exportData };
}

// Server-side streaming CSV
export async function* streamCSV<T extends Record<string, any>>(
    dataGenerator: AsyncGenerator<T[]>,
    columns: { key: keyof T; header: string }[]
): AsyncGenerator<string> {
    yield columns.map(c => c.header).join(',') + '\\n';
    for await (const batch of dataGenerator) {
        for (const row of batch) {
            yield columns.map(c => row[c.key]?.toString() || '').join(',') + '\\n';
        }
    }
}
`;
    }

    generateExcelExport(): string {
        return `import * as XLSX from 'xlsx';

interface ExcelColumn<T> {
    key: keyof T;
    header: string;
    width?: number;
    format?: (value: any) => any;
}

export function exportToExcel<T extends Record<string, any>>(
    data: T[],
    columns: ExcelColumn<T>[],
    filename: string = 'export.xlsx',
    sheetName: string = 'Sheet1'
): void {
    const headers = columns.map(c => c.header);
    const rows = data.map(row => columns.map(c => c.format ? c.format(row[c.key]) : row[c.key]));

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    // Set column widths
    ws['!cols'] = columns.map(c => ({ wch: c.width || 15 }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, filename);
}

// Multi-sheet export
export function exportMultiSheet(
    sheets: Array<{ name: string; data: any[][]; }>,
    filename: string = 'export.xlsx'
): void {
    const wb = XLSX.utils.book_new();
    for (const sheet of sheets) {
        const ws = XLSX.utils.aoa_to_sheet(sheet.data);
        XLSX.utils.book_append_sheet(wb, ws, sheet.name);
    }
    XLSX.writeFile(wb, filename);
}

// Read Excel file
export async function readExcel(file: File): Promise<Record<string, any[][]>> {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array' });
    const result: Record<string, any[][]> = {};
    for (const sheetName of wb.SheetNames) {
        result[sheetName] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });
    }
    return result;
}
`;
    }

    generatePDFExport(): string {
        return `import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PDFColumn<T> {
    key: keyof T;
    header: string;
    width?: number;
}

interface PDFOptions {
    title?: string;
    subtitle?: string;
    orientation?: 'portrait' | 'landscape';
    pageSize?: 'a4' | 'letter';
    margin?: number;
}

export function exportToPDF<T extends Record<string, any>>(
    data: T[],
    columns: PDFColumn<T>[],
    filename: string = 'export.pdf',
    options: PDFOptions = {}
): void {
    const { title, subtitle, orientation = 'portrait', pageSize = 'a4', margin = 14 } = options;

    const doc = new jsPDF({ orientation, format: pageSize });

    let yPos = margin;

    if (title) {
        doc.setFontSize(18);
        doc.text(title, margin, yPos);
        yPos += 10;
    }

    if (subtitle) {
        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text(subtitle, margin, yPos);
        yPos += 10;
    }

    autoTable(doc, {
        startY: yPos,
        head: [columns.map(c => c.header)],
        body: data.map(row => columns.map(c => String(row[c.key] ?? ''))),
        margin: { left: margin, right: margin },
        headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: columns.reduce((acc, c, i) => {
            if (c.width) acc[i] = { cellWidth: c.width };
            return acc;
        }, {} as Record<number, { cellWidth: number }>),
    });

    doc.save(filename);
}

// Generate PDF with custom content
export function generateCustomPDF(callback: (doc: jsPDF) => void, filename: string = 'document.pdf'): void {
    const doc = new jsPDF();
    callback(doc);
    doc.save(filename);
}
`;
    }

    generateExportButton(): string {
        return `import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type ExportFormat = 'csv' | 'excel' | 'pdf' | 'json';

interface ExportButtonProps<T> {
    data: T[];
    filename?: string;
    formats?: ExportFormat[];
    onExport?: (format: ExportFormat) => Promise<void>;
}

export function ExportButton<T extends Record<string, any>>({ data, filename = 'export', formats = ['csv', 'excel', 'pdf'], onExport }: ExportButtonProps<T>) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState<ExportFormat | null>(null);

    const icons: Record<ExportFormat, string> = { csv: '📊', excel: '📗', pdf: '📄', json: '{ }' };
    const labels: Record<ExportFormat, string> = { csv: 'CSV', excel: 'Excel', pdf: 'PDF', json: 'JSON' };

    const handleExport = async (format: ExportFormat) => {
        setLoading(format);
        try {
            if (onExport) {
                await onExport(format);
            } else {
                // Default export logic
                switch (format) {
                    case 'json':
                        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = \`\${filename}.json\`;
                        a.click();
                        break;
                    // CSV, Excel, PDF would use respective generators
                }
            }
        } finally {
            setLoading(null);
            setOpen(false);
        }
    };

    return (
        <div className="relative">
            <button onClick={() => setOpen(!open)} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                📥 Export
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg border overflow-hidden z-10">
                        {formats.map(format => (
                            <button key={format} onClick={() => handleExport(format)} disabled={loading !== null}
                                className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100 disabled:opacity-50">
                                {loading === format ? '⏳' : icons[format]} {labels[format]}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
`;
    }
}

export const exportGenerator = new ExportGenerator();
