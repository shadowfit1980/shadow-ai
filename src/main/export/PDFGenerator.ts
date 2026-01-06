/**
 * PDF Generator
 * Generate PDFs from markdown, HTML, or code
 * Similar to Canva's export to PDF
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface PDFOptions {
    format?: 'A4' | 'Letter' | 'Legal' | 'A3';
    orientation?: 'portrait' | 'landscape';
    margin?: { top: number; right: number; bottom: number; left: number };
    header?: string;
    footer?: string;
    pageNumbers?: boolean;
    theme?: 'light' | 'dark';
    fontSize?: number;
    fontFamily?: string;
}

export interface PDFResult {
    success: boolean;
    path?: string;
    pages?: number;
    size?: number;
    error?: string;
}

export interface PDFDocument {
    id: string;
    title: string;
    content: string;
    type: 'markdown' | 'html' | 'code';
    options: PDFOptions;
    createdAt: number;
}

/**
 * PDFGenerator
 * Generates PDF documents from various sources
 */
export class PDFGenerator extends EventEmitter {
    private static instance: PDFGenerator;
    private documents: Map<string, PDFDocument> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): PDFGenerator {
        if (!PDFGenerator.instance) {
            PDFGenerator.instance = new PDFGenerator();
        }
        return PDFGenerator.instance;
    }

    /**
     * Generate PDF from Markdown
     */
    async fromMarkdown(markdown: string, options?: PDFOptions): Promise<string> {
        const html = this.markdownToHtml(markdown, options);
        return this.generatePdfHtml(html, options);
    }

    /**
     * Generate PDF from HTML
     */
    async fromHtml(html: string, options?: PDFOptions): Promise<string> {
        return this.generatePdfHtml(html, options);
    }

    /**
     * Generate PDF from code file
     */
    async fromCode(code: string, language: string, options?: PDFOptions): Promise<string> {
        const html = this.codeToHtml(code, language, options);
        return this.generatePdfHtml(html, options);
    }

    /**
     * Save PDF to file
     */
    async savePdf(content: string, outputPath: string, options?: PDFOptions): Promise<PDFResult> {
        try {
            const html = this.markdownToHtml(content, options);
            const pdfHtml = this.wrapInPdfTemplate(html, options);

            // Save as HTML (for conversion via puppeteer/browser)
            const htmlPath = outputPath.replace('.pdf', '.html');
            await fs.writeFile(htmlPath, pdfHtml, 'utf-8');

            this.emit('generated', { path: htmlPath, type: 'html' });

            return {
                success: true,
                path: htmlPath,
                pages: Math.ceil(content.split('\n').length / 50),
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Generate report PDF
     */
    async generateReport(data: {
        title: string;
        sections: Array<{ heading: string; content: string }>;
        metadata?: Record<string, string>;
    }, options?: PDFOptions): Promise<string> {
        const lines: string[] = [
            `# ${data.title}`,
            '',
        ];

        if (data.metadata) {
            lines.push('---');
            for (const [key, value] of Object.entries(data.metadata)) {
                lines.push(`**${key}:** ${value}`);
            }
            lines.push('---');
            lines.push('');
        }

        for (const section of data.sections) {
            lines.push(`## ${section.heading}`);
            lines.push('');
            lines.push(section.content);
            lines.push('');
        }

        return this.fromMarkdown(lines.join('\n'), options);
    }

    /**
     * Generate invoice PDF
     */
    async generateInvoice(invoice: {
        number: string;
        date: string;
        dueDate: string;
        from: { name: string; address: string };
        to: { name: string; address: string };
        items: Array<{ description: string; quantity: number; price: number }>;
        notes?: string;
    }): Promise<string> {
        const total = invoice.items.reduce((sum, item) => sum + item.quantity * item.price, 0);

        const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .invoice-title { font-size: 28px; font-weight: bold; color: #333; }
    .invoice-number { color: #666; }
    .parties { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .party { width: 45%; }
    .party h3 { margin-bottom: 10px; color: #333; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f5f5f5; font-weight: bold; }
    .total { font-size: 18px; font-weight: bold; text-align: right; }
    .notes { margin-top: 30px; padding: 15px; background: #f9f9f9; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="invoice-title">INVOICE</div>
      <div class="invoice-number">#${invoice.number}</div>
    </div>
    <div style="text-align: right;">
      <div>Date: ${invoice.date}</div>
      <div>Due: ${invoice.dueDate}</div>
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <h3>From:</h3>
      <div>${invoice.from.name}</div>
      <div>${invoice.from.address}</div>
    </div>
    <div class="party">
      <h3>To:</h3>
      <div>${invoice.to.name}</div>
      <div>${invoice.to.address}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Quantity</th>
        <th>Price</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      ${invoice.items.map(item => `
        <tr>
          <td>${item.description}</td>
          <td>${item.quantity}</td>
          <td>$${item.price.toFixed(2)}</td>
          <td>$${(item.quantity * item.price).toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="total">Total: $${total.toFixed(2)}</div>

  ${invoice.notes ? `<div class="notes"><strong>Notes:</strong><br>${invoice.notes}</div>` : ''}
</body>
</html>
`;

        return html;
    }

    /**
     * Generate resume PDF
     */
    async generateResume(resume: {
        name: string;
        title: string;
        email: string;
        phone?: string;
        summary: string;
        experience: Array<{ company: string; role: string; period: string; highlights: string[] }>;
        education: Array<{ school: string; degree: string; year: string }>;
        skills: string[];
    }): Promise<string> {
        const markdown = `
# ${resume.name}
**${resume.title}**

📧 ${resume.email}${resume.phone ? ` | 📱 ${resume.phone}` : ''}

---

## Summary
${resume.summary}

---

## Experience

${resume.experience.map(exp => `
### ${exp.role}
**${exp.company}** | ${exp.period}

${exp.highlights.map(h => `- ${h}`).join('\n')}
`).join('\n')}

---

## Education

${resume.education.map(edu => `
**${edu.degree}**
${edu.school} | ${edu.year}
`).join('\n')}

---

## Skills

${resume.skills.map(s => `- ${s}`).join('\n')}
`;

        return this.fromMarkdown(markdown);
    }

    // Private methods

    private markdownToHtml(markdown: string, options?: PDFOptions): string {
        // Simple markdown to HTML conversion
        let html = markdown
            // Headers
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            // Bold and Italic
            .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Code blocks
            .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            // Lists
            .replace(/^\- (.*$)/gm, '<li>$1</li>')
            // Links
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
            // Horizontal rules
            .replace(/^---$/gm, '<hr>')
            // Paragraphs
            .replace(/\n\n/g, '</p><p>');

        // Wrap list items
        html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

        return `<p>${html}</p>`;
    }

    private codeToHtml(code: string, language: string, options?: PDFOptions): string {
        const escapedCode = code
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        return `
<div class="code-block">
  <div class="code-header">${language}</div>
  <pre><code class="language-${language}">${escapedCode}</code></pre>
</div>
`;
    }

    private generatePdfHtml(html: string, options?: PDFOptions): string {
        return this.wrapInPdfTemplate(html, options);
    }

    private wrapInPdfTemplate(content: string, options?: PDFOptions): string {
        const theme = options?.theme || 'light';
        const fontFamily = options?.fontFamily || 'Arial, sans-serif';
        const fontSize = options?.fontSize || 12;

        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: ${options?.format || 'A4'} ${options?.orientation || 'portrait'};
      margin: ${options?.margin?.top || 20}mm ${options?.margin?.right || 20}mm ${options?.margin?.bottom || 20}mm ${options?.margin?.left || 20}mm;
    }
    body {
      font-family: ${fontFamily};
      font-size: ${fontSize}pt;
      line-height: 1.6;
      color: ${theme === 'dark' ? '#e0e0e0' : '#333'};
      background: ${theme === 'dark' ? '#1a1a1a' : '#fff'};
    }
    h1 { font-size: 24pt; margin-top: 0; }
    h2 { font-size: 18pt; margin-top: 20pt; }
    h3 { font-size: 14pt; margin-top: 15pt; }
    code {
      font-family: 'Courier New', monospace;
      background: ${theme === 'dark' ? '#2d2d2d' : '#f4f4f4'};
      padding: 2px 6px;
      border-radius: 3px;
    }
    pre {
      background: ${theme === 'dark' ? '#2d2d2d' : '#f4f4f4'};
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
    }
    pre code { background: none; padding: 0; }
    ul { padding-left: 25px; }
    hr { border: none; border-top: 1px solid #ddd; margin: 20px 0; }
    a { color: #0066cc; text-decoration: none; }
    .code-block { margin: 15px 0; }
    .code-header {
      background: ${theme === 'dark' ? '#3d3d3d' : '#e0e0e0'};
      padding: 5px 15px;
      font-size: 10pt;
      font-weight: bold;
      border-radius: 5px 5px 0 0;
    }
    .code-block pre { margin-top: 0; border-radius: 0 0 5px 5px; }
  </style>
</head>
<body>
  ${content}
</body>
</html>
`;
    }
}

// Singleton getter
export function getPDFGenerator(): PDFGenerator {
    return PDFGenerator.getInstance();
}
