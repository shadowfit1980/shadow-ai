import { FileAnalysis } from '../types';
import fs from 'fs';
import path from 'path';

/**
 * File Analyzer
 * Analyzes various file types and extracts relevant information
 */

export async function analyzeFile(filePath: string): Promise<FileAnalysis> {
    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {
        case '.jpg':
        case '.jpeg':
        case '.png':
        case '.gif':
        case '.webp':
            return await analyzeImage(filePath);
        case '.pdf':
            return await analyzePDF(filePath);
        case '.mp3':
        case '.wav':
        case '.m4a':
            return await analyzeAudio(filePath);
        case '.js':
        case '.ts':
        case '.jsx':
        case '.tsx':
        case '.py':
        case '.go':
        case '.rs':
            return await analyzeCode(filePath);
        default:
            return await analyzeGeneric(filePath);
    }
}

/**
 * Analyze image files
 */
async function analyzeImage(filePath: string): Promise<FileAnalysis> {
    const stats = fs.statSync(filePath);
    const buffer = fs.readFileSync(filePath);

    return {
        type: 'image',
        content: `Image file: ${path.basename(filePath)}`,
        metadata: {
            size: stats.size,
            format: path.extname(filePath).slice(1),
            path: filePath,
        },
        extractedData: {
            base64: buffer.toString('base64'),
        },
    };
}

/**
 * Analyze PDF files
 */
async function analyzePDF(filePath: string): Promise<FileAnalysis> {
    const stats = fs.statSync(filePath);

    return {
        type: 'pdf',
        content: `PDF file: ${path.basename(filePath)}`,
        metadata: {
            size: stats.size,
            pages: 0, // Would use pdf-parse library in production
            path: filePath,
        },
    };
}

/**
 * Analyze audio files
 */
async function analyzeAudio(filePath: string): Promise<FileAnalysis> {
    const stats = fs.statSync(filePath);

    return {
        type: 'audio',
        content: `Audio file: ${path.basename(filePath)}`,
        metadata: {
            size: stats.size,
            format: path.extname(filePath).slice(1),
            path: filePath,
        },
    };
}

/**
 * Analyze code files
 */
async function analyzeCode(filePath: string): Promise<FileAnalysis> {
    const content = fs.readFileSync(filePath, 'utf8');
    const stats = fs.statSync(filePath);
    const lines = content.split('\n');

    // Basic code analysis
    const analysis = {
        lines: lines.length,
        functions: (content.match(/function\s+\w+|const\s+\w+\s*=\s*\(/g) || []).length,
        classes: (content.match(/class\s+\w+/g) || []).length,
        imports: (content.match(/import\s+.*from|require\(/g) || []).length,
    };

    return {
        type: 'code',
        content,
        metadata: {
            size: stats.size,
            language: path.extname(filePath).slice(1),
            path: filePath,
            ...analysis,
        },
    };
}

/**
 * Analyze generic files
 */
async function analyzeGeneric(filePath: string): Promise<FileAnalysis> {
    const stats = fs.statSync(filePath);
    let content = '';

    try {
        content = fs.readFileSync(filePath, 'utf8');
    } catch {
        content = 'Binary file';
    }

    return {
        type: 'code',
        content,
        metadata: {
            size: stats.size,
            path: filePath,
        },
    };
}
