/**
 * Content Generation Suite
 * 
 * AI-powered slide, video, and data sheet generation
 * inspired by Genspark's content creation tools.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export interface Slide {
    id: number;
    title: string;
    content: string[];
    notes?: string;
    layout: 'title' | 'content' | 'two-column' | 'image' | 'code' | 'quote';
    imageUrl?: string;
    codeBlock?: { language: string; code: string };
}

export interface Presentation {
    id: string;
    title: string;
    theme: PresentationTheme;
    slides: Slide[];
    createdAt: Date;
}

export interface PresentationTheme {
    name: string;
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    backgroundColor: string;
}

export interface VideoScene {
    id: number;
    narration: string;
    visualDescription: string;
    duration: number; // seconds
    transition: 'fade' | 'slide' | 'zoom' | 'none';
}

export interface VideoProject {
    id: string;
    title: string;
    scenes: VideoScene[];
    voiceStyle: 'professional' | 'casual' | 'energetic';
    musicStyle?: string;
    totalDuration: number;
}

export interface DataSheet {
    id: string;
    name: string;
    columns: ColumnDefinition[];
    rows: Record<string, any>[];
    analysis?: DataAnalysis;
}

export interface ColumnDefinition {
    name: string;
    type: 'text' | 'number' | 'date' | 'boolean' | 'url';
    description?: string;
}

export interface DataAnalysis {
    summary: string;
    insights: string[];
    statistics: Record<string, any>;
    visualizations: ChartConfig[];
}

export interface ChartConfig {
    type: 'bar' | 'line' | 'pie' | 'scatter';
    title: string;
    xAxis: string;
    yAxis: string;
    data: any[];
}

// ============================================================================
// SLIDE GENERATOR
// ============================================================================

export class SlideGenerator extends EventEmitter {
    private static instance: SlideGenerator;
    private themes: Map<string, PresentationTheme> = new Map();

    private constructor() {
        super();
        this.initializeThemes();
    }

    static getInstance(): SlideGenerator {
        if (!SlideGenerator.instance) {
            SlideGenerator.instance = new SlideGenerator();
        }
        return SlideGenerator.instance;
    }

    private initializeThemes(): void {
        this.themes.set('modern', {
            name: 'Modern',
            primaryColor: '#3B82F6',
            secondaryColor: '#1E40AF',
            fontFamily: 'Inter, sans-serif',
            backgroundColor: '#FFFFFF',
        });
        this.themes.set('dark', {
            name: 'Dark',
            primaryColor: '#8B5CF6',
            secondaryColor: '#6D28D9',
            fontFamily: 'Inter, sans-serif',
            backgroundColor: '#1F2937',
        });
        this.themes.set('minimal', {
            name: 'Minimal',
            primaryColor: '#000000',
            secondaryColor: '#374151',
            fontFamily: 'Helvetica, sans-serif',
            backgroundColor: '#FAFAFA',
        });
        this.themes.set('corporate', {
            name: 'Corporate',
            primaryColor: '#0F172A',
            secondaryColor: '#0EA5E9',
            fontFamily: 'Roboto, sans-serif',
            backgroundColor: '#FFFFFF',
        });
    }

    async generateFromPrompt(prompt: string, options?: {
        theme?: string;
        slideCount?: number;
        includeImages?: boolean;
    }): Promise<Presentation> {
        this.emit('generationStarted', { prompt });

        const theme = this.themes.get(options?.theme || 'modern')!;
        const slideCount = options?.slideCount || 8;

        // Generate outline
        const outline = await this.generateOutline(prompt, slideCount);

        // Generate slides from outline
        const slides = await this.generateSlides(outline, options?.includeImages);

        const presentation: Presentation = {
            id: `pres_${Date.now()}`,
            title: outline.title,
            theme,
            slides,
            createdAt: new Date(),
        };

        this.emit('generationComplete', presentation);
        return presentation;
    }

    private async generateOutline(prompt: string, slideCount: number): Promise<{ title: string; sections: string[] }> {
        // In production, use LLM to generate outline
        return {
            title: `Presentation: ${prompt.substring(0, 50)}`,
            sections: Array.from({ length: slideCount }, (_, i) => `Section ${i + 1}`),
        };
    }

    private async generateSlides(
        outline: { title: string; sections: string[] },
        includeImages?: boolean
    ): Promise<Slide[]> {
        const slides: Slide[] = [];

        // Title slide
        slides.push({
            id: 1,
            title: outline.title,
            content: ['Generated presentation'],
            layout: 'title',
        });

        // Content slides
        outline.sections.forEach((section, i) => {
            slides.push({
                id: i + 2,
                title: section,
                content: [
                    'Key point 1',
                    'Key point 2',
                    'Key point 3',
                ],
                layout: 'content',
                notes: `Speaker notes for ${section}`,
            });
        });

        // Conclusion slide
        slides.push({
            id: slides.length + 1,
            title: 'Thank You',
            content: ['Questions?'],
            layout: 'title',
        });

        return slides;
    }

    exportToHTML(presentation: Presentation): string {
        const { theme } = presentation;

        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${presentation.title}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: ${theme.fontFamily}; background: #000; }
        .slide {
            width: 100vw;
            height: 100vh;
            padding: 60px;
            background: ${theme.backgroundColor};
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        .slide h1 {
            color: ${theme.primaryColor};
            font-size: 48px;
            margin-bottom: 30px;
        }
        .slide ul { 
            list-style: none;
            font-size: 28px;
            color: ${theme.secondaryColor};
        }
        .slide li {
            margin: 15px 0;
            padding-left: 30px;
            position: relative;
        }
        .slide li::before {
            content: '•';
            color: ${theme.primaryColor};
            position: absolute;
            left: 0;
        }
        .title-slide {
            text-align: center;
            justify-content: center;
            align-items: center;
        }
        .title-slide h1 { font-size: 64px; }
    </style>
</head>
<body>
${presentation.slides.map(slide => `
    <div class="slide ${slide.layout === 'title' ? 'title-slide' : ''}">
        <h1>${slide.title}</h1>
        ${slide.content.length > 0 ? `
        <ul>
            ${slide.content.map(c => `<li>${c}</li>`).join('\n')}
        </ul>
        ` : ''}
    </div>
`).join('\n')}
</body>
</html>`;
    }

    exportToMarkdown(presentation: Presentation): string {
        let md = `# ${presentation.title}\n\n`;
        md += `*Theme: ${presentation.theme.name}*\n\n---\n\n`;

        presentation.slides.forEach(slide => {
            md += `## ${slide.title}\n\n`;
            slide.content.forEach(c => {
                md += `- ${c}\n`;
            });
            if (slide.notes) {
                md += `\n> **Notes:** ${slide.notes}\n`;
            }
            md += '\n---\n\n';
        });

        return md;
    }
}

// ============================================================================
// VIDEO GENERATOR
// ============================================================================

export class VideoGenerator extends EventEmitter {
    private static instance: VideoGenerator;

    private constructor() {
        super();
    }

    static getInstance(): VideoGenerator {
        if (!VideoGenerator.instance) {
            VideoGenerator.instance = new VideoGenerator();
        }
        return VideoGenerator.instance;
    }

    async generateFromPrompt(prompt: string, options?: {
        duration?: number; // target duration in seconds
        voiceStyle?: 'professional' | 'casual' | 'energetic';
        sceneCount?: number;
    }): Promise<VideoProject> {
        this.emit('generationStarted', { prompt });

        const targetDuration = options?.duration || 60;
        const sceneCount = options?.sceneCount || Math.ceil(targetDuration / 10);

        // Generate script
        const script = await this.generateScript(prompt, sceneCount);

        // Generate scenes
        const scenes = await this.generateScenes(script, targetDuration);

        const project: VideoProject = {
            id: `video_${Date.now()}`,
            title: `Video: ${prompt.substring(0, 50)}`,
            scenes,
            voiceStyle: options?.voiceStyle || 'professional',
            totalDuration: scenes.reduce((acc, s) => acc + s.duration, 0),
        };

        this.emit('generationComplete', project);
        return project;
    }

    private async generateScript(prompt: string, sceneCount: number): Promise<string[]> {
        // In production, use LLM to generate script
        return Array.from({ length: sceneCount }, (_, i) =>
            `Scene ${i + 1}: Content about ${prompt}`
        );
    }

    private async generateScenes(script: string[], targetDuration: number): Promise<VideoScene[]> {
        const durationPerScene = targetDuration / script.length;

        return script.map((narration, i) => ({
            id: i + 1,
            narration,
            visualDescription: `Visual for scene ${i + 1}`,
            duration: Math.round(durationPerScene),
            transition: i === 0 ? 'none' : 'fade',
        }));
    }

    exportToJSON(project: VideoProject): string {
        return JSON.stringify(project, null, 2);
    }

    generateTimeline(project: VideoProject): string {
        let timeline = `# ${project.title}\n\n`;
        timeline += `Total Duration: ${project.totalDuration}s | Voice: ${project.voiceStyle}\n\n`;

        let currentTime = 0;
        project.scenes.forEach(scene => {
            const startTime = this.formatTime(currentTime);
            const endTime = this.formatTime(currentTime + scene.duration);

            timeline += `## [${startTime} - ${endTime}] Scene ${scene.id}\n`;
            timeline += `**Narration:** ${scene.narration}\n`;
            timeline += `**Visual:** ${scene.visualDescription}\n`;
            timeline += `**Transition:** ${scene.transition}\n\n`;

            currentTime += scene.duration;
        });

        return timeline;
    }

    private formatTime(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}

// ============================================================================
// AI SHEETS (DATA ANALYSIS)
// ============================================================================

export class AISheets extends EventEmitter {
    private static instance: AISheets;
    private sheets: Map<string, DataSheet> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): AISheets {
        if (!AISheets.instance) {
            AISheets.instance = new AISheets();
        }
        return AISheets.instance;
    }

    async createFromPrompt(prompt: string, options?: {
        rowCount?: number;
        includeAnalysis?: boolean;
    }): Promise<DataSheet> {
        this.emit('creationStarted', { prompt });

        // Infer columns from prompt
        const columns = await this.inferColumns(prompt);

        // Generate sample data
        const rows = await this.generateData(columns, options?.rowCount || 10);

        // Perform analysis if requested
        const analysis = options?.includeAnalysis
            ? await this.analyzeData(columns, rows)
            : undefined;

        const sheet: DataSheet = {
            id: `sheet_${Date.now()}`,
            name: `Data: ${prompt.substring(0, 30)}`,
            columns,
            rows,
            analysis,
        };

        this.sheets.set(sheet.id, sheet);
        this.emit('creationComplete', sheet);
        return sheet;
    }

    private async inferColumns(prompt: string): Promise<ColumnDefinition[]> {
        // In production, use LLM to infer schema
        return [
            { name: 'id', type: 'number' },
            { name: 'name', type: 'text' },
            { name: 'value', type: 'number' },
            { name: 'date', type: 'date' },
            { name: 'active', type: 'boolean' },
        ];
    }

    private async generateData(
        columns: ColumnDefinition[],
        rowCount: number
    ): Promise<Record<string, any>[]> {
        return Array.from({ length: rowCount }, (_, i) => {
            const row: Record<string, any> = {};
            columns.forEach(col => {
                switch (col.type) {
                    case 'number':
                        row[col.name] = col.name === 'id' ? i + 1 : Math.round(Math.random() * 1000);
                        break;
                    case 'text':
                        row[col.name] = `Item ${i + 1}`;
                        break;
                    case 'date':
                        row[col.name] = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                        break;
                    case 'boolean':
                        row[col.name] = Math.random() > 0.5;
                        break;
                    default:
                        row[col.name] = '';
                }
            });
            return row;
        });
    }

    private async analyzeData(
        columns: ColumnDefinition[],
        rows: Record<string, any>[]
    ): Promise<DataAnalysis> {
        const numericColumns = columns.filter(c => c.type === 'number');
        const statistics: Record<string, any> = {};

        numericColumns.forEach(col => {
            const values = rows.map(r => r[col.name]).filter(v => typeof v === 'number');
            if (values.length > 0) {
                const sum = values.reduce((a, b) => a + b, 0);
                const avg = sum / values.length;
                const min = Math.min(...values);
                const max = Math.max(...values);

                statistics[col.name] = { sum, avg, min, max, count: values.length };
            }
        });

        return {
            summary: `Dataset contains ${rows.length} rows and ${columns.length} columns.`,
            insights: [
                `${numericColumns.length} numeric columns identified.`,
                `Data range spans ${rows.length} entries.`,
            ],
            statistics,
            visualizations: numericColumns.map(col => ({
                type: 'bar',
                title: `${col.name} Distribution`,
                xAxis: 'index',
                yAxis: col.name,
                data: rows.map((r, i) => ({ x: i, y: r[col.name] })),
            })),
        };
    }

    exportToCSV(sheet: DataSheet): string {
        const headers = sheet.columns.map(c => c.name).join(',');
        const rows = sheet.rows.map(row =>
            sheet.columns.map(c => {
                const val = row[c.name];
                return typeof val === 'string' ? `"${val}"` : val;
            }).join(',')
        );
        return [headers, ...rows].join('\n');
    }

    exportToJSON(sheet: DataSheet): string {
        return JSON.stringify({
            schema: sheet.columns,
            data: sheet.rows,
            analysis: sheet.analysis,
        }, null, 2);
    }

    getSheet(id: string): DataSheet | undefined {
        return this.sheets.get(id);
    }

    listSheets(): DataSheet[] {
        return Array.from(this.sheets.values());
    }
}

export const slideGenerator = SlideGenerator.getInstance();
export const videoGenerator = VideoGenerator.getInstance();
export const aiSheets = AISheets.getInstance();
