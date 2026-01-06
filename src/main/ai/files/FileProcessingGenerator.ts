/**
 * File Processing Generator
 * 
 * Generate file processing utilities for CSV, Excel,
 * PDF, images, and various file format conversions.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export interface CSVConfig {
    delimiter?: string;
    quote?: string;
    escape?: string;
    headers?: boolean;
}

export interface ExcelConfig {
    sheetName?: string;
    headers?: boolean;
    formatting?: boolean;
}

export interface PDFConfig {
    format?: 'A4' | 'Letter' | 'Legal';
    orientation?: 'portrait' | 'landscape';
    margins?: { top: number; right: number; bottom: number; left: number };
}

// ============================================================================
// FILE PROCESSING GENERATOR
// ============================================================================

export class FileProcessingGenerator extends EventEmitter {
    private static instance: FileProcessingGenerator;

    private constructor() {
        super();
    }

    static getInstance(): FileProcessingGenerator {
        if (!FileProcessingGenerator.instance) {
            FileProcessingGenerator.instance = new FileProcessingGenerator();
        }
        return FileProcessingGenerator.instance;
    }

    // ========================================================================
    // CSV PROCESSING
    // ========================================================================

    generateCSVProcessor(config: CSVConfig = {}): string {
        return `import { createReadStream, createWriteStream } from 'fs';
import { parse } from 'csv-parse';
import { stringify } from 'csv-stringify';
import { Transform } from 'stream';

// CSV Parser
export async function parseCSV<T = any>(filePath: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
        const results: T[] = [];
        
        createReadStream(filePath)
            .pipe(parse({
                delimiter: '${config.delimiter || ','}',
                quote: '${config.quote || '"'}',
                escape: '${config.escape || '"'}',
                columns: ${config.headers !== false},
                skip_empty_lines: true,
                trim: true,
            }))
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', reject);
    });
}

// CSV Writer
export async function writeCSV<T extends Record<string, any>>(
    filePath: string,
    data: T[],
    headers?: string[]
): Promise<void> {
    return new Promise((resolve, reject) => {
        const stringifier = stringify({
            header: ${config.headers !== false},
            columns: headers,
            delimiter: '${config.delimiter || ','}',
            quote: '${config.quote || '"'}',
        });
        
        const writableStream = createWriteStream(filePath);
        
        data.forEach(row => stringifier.write(row));
        stringifier.pipe(writableStream);
        
        stringifier.on('error', reject);
        writableStream.on('finish', resolve);
        writableStream.on('error', reject);
        
        stringifier.end();
    });
}

// Stream CSV processing for large files
export function createCSVTransform<T = any, R = any>(
    transformer: (row: T) => R | null
): Transform {
    return new Transform({
        objectMode: true,
        transform(chunk, encoding, callback) {
            try {
                const result = transformer(chunk);
                if (result !== null) {
                    this.push(result);
                }
                callback();
            } catch (error) {
                callback(error as Error);
            }
        },
    });
}

// Usage example for streaming
export function processLargeCSV(
    inputPath: string,
    outputPath: string,
    transformer: (row: any) => any
): Promise<void> {
    return new Promise((resolve, reject) => {
        createReadStream(inputPath)
            .pipe(parse({ columns: true }))
            .pipe(createCSVTransform(transformer))
            .pipe(stringify({ header: true }))
            .pipe(createWriteStream(outputPath))
            .on('finish', resolve)
            .on('error', reject);
    });
}
`;
    }

    // ========================================================================
    // EXCEL PROCESSING
    // ========================================================================

    generateExcelProcessor(config: ExcelConfig = {}): string {
        return `import ExcelJS from 'exceljs';

// Read Excel file
export async function readExcel<T = any>(filePath: string, sheetName?: string): Promise<T[]> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    const worksheet = sheetName  
        ? workbook.getWorksheet(sheetName)
        : workbook.worksheets[0];
    
    if (!worksheet) {
        throw new Error('Worksheet not found');
    }
    
    const results: T[] = [];
    const headers: string[] = [];
    
    ${config.headers !== false ? `
    // Get headers from first row
    worksheet.getRow(1).eachCell((cell, colNumber) => {
        headers[colNumber - 1] = cell.text;
    });
    
    // Process data rows
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header row
        
        const rowData: any = {};
        row.eachCell((cell, colNumber) => {
            const header = headers[colNumber - 1];
            rowData[header] = cell.value;
        });
        results.push(rowData);
    });
    ` : `
    // Process all rows as arrays
    worksheet.eachRow((row) => {
        const rowData: any = [];
        row.eachCell((cell) => {
            rowData.push(cell.value);
        });
        results.push(rowData);
    });
    `}
    
    return results;
}

// Write Excel file
export async function writeExcel<T extends Record<string, any>>(
    filePath: string,
    data: T[],
    sheetName: string = '${config.sheetName || 'Sheet1'}',
    headers?: string[]
): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);
    
    if (data.length === 0) {
        await workbook.xlsx.writeFile(filePath);
        return;
    }
    
    // Get headers
    const cols = headers || Object.keys(data[0]);
    
    ${config.formatting ? `
    // Add formatted header row
    worksheet.columns = cols.map(col => ({
        header: col.toUpperCase(),
        key: col,
        width: 15,
    }));
    
    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' },
    };
    ` : `
    // Add simple header row
    worksheet.columns = cols.map(col => ({ header: col, key: col }));
    `}
    
    // Add data rows
    data.forEach(row => worksheet.addRow(row));
    
    ${config.formatting ? `
    // Auto-fit columns
    worksheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell?.({ includeEmpty: true }, (cell) => {
            const columnLength = cell.value ? cell.value.toString().length : 10;
            if (columnLength > maxLength) {
                maxLength = columnLength;
            }
        });
        column.width = Math.min(maxLength + 2, 50);
    });
    ` : ''}
    
    await workbook.xlsx.writeFile(filePath);
}

// Add multiple sheets
export async function createWorkbookWithSheets(
    filePath: string,
    sheets: Array<{ name: string; data: any[]; headers?: string[] }>
): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    
    for (const sheet of sheets) {
        const worksheet = workbook.addWorksheet(sheet.name);
        
        if (sheet.data.length > 0) {
            const cols = sheet.headers || Object.keys(sheet.data[0]);
            worksheet.columns = cols.map(col => ({ header: col, key: col }));
            sheet.data.forEach(row => worksheet.addRow(row));
        }
    }
    
    await workbook.xlsx.writeFile(filePath);
}
`;
    }

    // ========================================================================
    // PDF GENERATION
    // ========================================================================

    generatePDFGenerator(config: PDFConfig = {}): string {
        return `import PDFDocument from 'pdfkit';
import { createWriteStream } from 'fs';

export interface PDFOptions {
    title?: string;
    author?: string;
    subject?: string;
}

// Generate PDF from text
export async function generateTextPDF(
    outputPath: string,
    content: string,
    options: PDFOptions = {}
): Promise<void> {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            size: '${config.format || 'A4'}',
            layout: '${config.orientation || 'portrait'}',
            margins: ${JSON.stringify(config.margins || { top: 50, bottom: 50, left: 50, right: 50 })},
        });
        
        const stream = doc.pipe(createWriteStream(outputPath));
        
        // Set metadata
        if (options.title) doc.info.Title = options.title;
        if (options.author) doc.info.Author = options.author;
        if (options.subject) doc.info.Subject = options.subject;
        
        // Add content
        doc.fontSize(12).text(content);
        
        doc.end();
        
        stream.on('finish', resolve);
        stream.on('error', reject);
    });
}

// Generate PDF with formatting
export async function generateFormattedPDF(
    outputPath: string,
    sections: Array<{ title?: string; content: string; fontSize?: number }>,
    options: PDFOptions = {}
): Promise<void> {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            size: '${config.format || 'A4'}',
            layout: '${config.orientation || 'portrait'}',
        });
        
        const stream = doc.pipe(createWriteStream(outputPath));
        
        // Set metadata
        if (options.title) doc.info.Title = options.title;
        if (options.author) doc.info.Author = options.author;
        
        // Add sections
        sections.forEach((section, index) => {
            if (index > 0) {
                doc.addPage();
            }
            
            if (section.title) {
                doc.fontSize(18).font('Helvetica-Bold').text(section.title);
                doc.moveDown();
            }
            
            doc.fontSize(section.fontSize || 12)
                .font('Helvetica')
                .text(section.content, {
                    align: 'justify',
                    lineGap: 4,
                });
        });
        
        doc.end();
        
        stream.on('finish', resolve);
        stream.on('error', reject);
    });
}

// Generate PDF report with tables
export async function generateReportPDF(
    outputPath: string,
    data: {
        title: string;
        subtitle?: string;
        tables: Array<{
            title: string;
            headers: string[];
            rows: string[][];
        }>;
    }
): Promise<void> {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const stream = doc.pipe(createWriteStream(outputPath));
        
        // Title
        doc.fontSize(24).font('Helvetica-Bold').text(data.title, { align: 'center' });
        doc.moveDown();
        
        if (data.subtitle) {
            doc.fontSize(14).font('Helvetica').text(data.subtitle, { align: 'center' });
            doc.moveDown(2);
        }
        
        // Tables
        data.tables.forEach(table => {
            doc.fontSize(16).font('Helvetica-Bold').text(table.title);
            doc.moveDown(0.5);
            
            const colWidth = (doc.page.width - 100) / table.headers.length;
            const startY = doc.y;
            
            // Headers
            table.headers.forEach((header, i) => {
                doc.rect(50 + i * colWidth, startY, colWidth, 20).stroke();
                doc.fontSize(10).text(header, 55 + i * colWidth, startY + 5, {
                    width: colWidth - 10,
                    align: 'center',
                });
            });
            
            doc.y += 25;
            
            // Rows
            table.rows.forEach(row => {
                const rowY = doc.y;
                row.forEach((cell, i) => {
                    doc.rect(50 + i * colWidth, rowY, colWidth, 20).stroke();
                    doc.fontSize(9).text(String(cell), 55 + i * colWidth, rowY + 5, {
                        width: colWidth - 10,
                        align: 'left',
                    });
                });
                doc.y += 25;
            });
            
            doc.moveDown(2);
        });
        
        doc.end();
        
        stream.on('finish', resolve);
        stream.on('error', reject);
    });
}
`;
    }

    // ========================================================================
    // IMAGE PROCESSING
    // ========================================================================

    generateImageProcessor(): string {
        return `import sharp from 'sharp';

export interface ResizeOptions {
    width?: number;
    height?: number;
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
    format?: 'jpeg' | 'png' | 'webp' | 'avif';
    quality?: number;
}

// Resize image
export async function resizeImage(
    inputPath: string,
    outputPath: string,
    options: ResizeOptions
): Promise<void> {
    let transformer = sharp(inputPath);
    
    if (options.width || options.height) {
        transformer = transformer.resize(options.width, options.height, {
            fit: options.fit || 'cover',
        });
    }
    
    if (options.format) {
        transformer = transformer.toFormat(options.format, {
            quality: options.quality || 80,
        });
    }
    
    await transformer.toFile(outputPath);
}

// Generate thumbnail
export async function generateThumbnail(
    inputPath: string,
    outputPath: string,
    size: number = 200
): Promise<void> {
    await sharp(inputPath)
        .resize(size, size, { fit: 'cover' })
        .toFormat('jpeg', { quality: 80 })
        .toFile(outputPath);
}

// Optimize image
export async function optimizeImage(
    inputPath: string,
    outputPath: string
): Promise<void> {
    const metadata = await sharp(inputPath).metadata();
    
    await sharp(inputPath)
        .toFormat(metadata.format as any, {
            quality: 85,
            progressive: true,
            optimizeScans: true,
        })
        .toFile(outputPath);
}

// Convert image format
export async function convertImage(
    inputPath: string,
    outputPath: string,
    format: 'jpeg' | 'png' | 'webp' | 'avif'
): Promise<void> {
    await sharp(inputPath)
        .toFormat(format, { quality: 90 })
        .toFile(outputPath);
}

// Add watermark
export async function addWatermark(
    inputPath: string,
    watermarkPath: string,
    outputPath: string
): Promise<void> {
    const watermark = await sharp(watermarkPath)
        .resize(200)
        .toBuffer();
    
    await sharp(inputPath)
        .composite([{ input: watermark, gravity: 'southeast' }])
        .toFile(outputPath);
}

// Get image metadata
export async function getImageMetadata(filePath: string) {
    return sharp(filePath).metadata();
}
`;
    }

    // ========================================================================
    // FILE UPLOAD HANDLER
    // ========================================================================

    generateFileUploadHandler(): string {
        return `import multer from 'multer';
import path from 'path';
import { Request } from 'express';

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, process.env.UPLOAD_DIR || 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    },
});

// File filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|csv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type'));
    }
};

// Upload middleware
export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
});

// Upload routes
import { Router } from 'express';

export const uploadRouter = Router();

// Single file upload
uploadRouter.post('/upload/single', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    
    res.json({
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype,
    });
});

// Multiple files upload
uploadRouter.post('/upload/multiple', upload.array('files', 5), (req, res) => {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
    }
    
    const files = (req.files as Express.Multer.File[]).map(file => ({
        filename: file.filename,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype,
    }));
    
    res.json({ files });
});
`;
    }
}

export const fileProcessingGenerator = FileProcessingGenerator.getInstance();
