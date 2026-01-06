/**
 * Website Cloning Agent
 * 
 * Intelligently clones websites, landing pages, and web applications
 * by analyzing their structure, styles, and functionality.
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { selfLearningAgent } from '../learning/SelfLearningAgent';

// ============================================================================
// TYPES
// ============================================================================

interface CloneOptions {
    includeImages?: boolean;
    includeScripts?: boolean;
    includeStyles?: boolean;
    simplifyStyles?: boolean;
    targetPath: string;
}

interface ClonedPage {
    url: string;
    html: string;
    styles: string[];
    scripts: string[];
    images: string[];
    structure: PageStructure;
}

interface PageStructure {
    header?: boolean;
    hero?: boolean;
    features?: boolean;
    testimonials?: boolean;
    pricing?: boolean;
    faq?: boolean;
    cta?: boolean;
    footer?: boolean;
    sections: number;
}

interface CloneResult {
    success: boolean;
    files: string[];
    template?: string;
    error?: string;
}

// ============================================================================
// WEBSITE CLONING AGENT
// ============================================================================

export class WebsiteCloningAgent extends EventEmitter {
    private static instance: WebsiteCloningAgent;

    private constructor() {
        super();
    }

    static getInstance(): WebsiteCloningAgent {
        if (!WebsiteCloningAgent.instance) {
            WebsiteCloningAgent.instance = new WebsiteCloningAgent();
        }
        return WebsiteCloningAgent.instance;
    }

    // ========================================================================
    // CLONE FROM HTML
    // ========================================================================

    async cloneFromHTML(
        html: string,
        options: CloneOptions
    ): Promise<CloneResult> {
        try {
            const { targetPath } = options;
            const files: string[] = [];

            // Analyze page structure
            const structure = this.analyzeStructure(html);

            // Clean and process HTML
            let processedHTML = this.processHTML(html, options);

            // Extract and process styles
            let combinedCSS = '';
            if (options.includeStyles !== false) {
                combinedCSS = this.extractInlineStyles(html);
                combinedCSS += this.generateBaseStyles();
            }

            // Create output directory
            if (!fs.existsSync(targetPath)) {
                fs.mkdirSync(targetPath, { recursive: true });
            }

            // Write HTML file
            const htmlPath = path.join(targetPath, 'index.html');
            fs.writeFileSync(htmlPath, processedHTML);
            files.push('index.html');

            // Write CSS file
            if (combinedCSS) {
                const cssPath = path.join(targetPath, 'styles.css');
                fs.writeFileSync(cssPath, combinedCSS);
                files.push('styles.css');
            }

            // Write basic JS
            const jsContent = this.generateBasicJS(structure);
            const jsPath = path.join(targetPath, 'script.js');
            fs.writeFileSync(jsPath, jsContent);
            files.push('script.js');

            // Save as template
            const filesMap = new Map<string, string>();
            filesMap.set('index.html', processedHTML);
            filesMap.set('styles.css', combinedCSS);
            filesMap.set('script.js', jsContent);

            const template = await selfLearningAgent.saveAsTemplate(
                'Cloned Page',
                'landing-page',
                filesMap,
                { tags: ['cloned', 'landing-page'] }
            );

            this.emit('clone:complete', { files: files.length, structure });

            return {
                success: true,
                files,
                template: template.id,
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.emit('clone:error', { error: message });
            return { success: false, files: [], error: message };
        }
    }

    // ========================================================================
    // STRUCTURE ANALYSIS
    // ========================================================================

    analyzeStructure(html: string): PageStructure {
        const lowerHTML = html.toLowerCase();

        return {
            header: lowerHTML.includes('<header') || lowerHTML.includes('class="header"'),
            hero: lowerHTML.includes('hero') || lowerHTML.includes('banner'),
            features: lowerHTML.includes('features') || lowerHTML.includes('benefits'),
            testimonials: lowerHTML.includes('testimonial') || lowerHTML.includes('review'),
            pricing: lowerHTML.includes('pricing') || lowerHTML.includes('plans'),
            faq: lowerHTML.includes('faq') || lowerHTML.includes('frequently'),
            cta: lowerHTML.includes('cta') || lowerHTML.includes('call-to-action'),
            footer: lowerHTML.includes('<footer') || lowerHTML.includes('class="footer"'),
            sections: (html.match(/<section/gi) || []).length,
        };
    }

    // ========================================================================
    // HTML PROCESSING
    // ========================================================================

    private processHTML(html: string, options: CloneOptions): string {
        let processed = html;

        // Remove tracking scripts
        processed = processed.replace(/<script[^>]*google|facebook|analytics[^>]*>[\s\S]*?<\/script>/gi, '');

        // Remove external resources if not needed
        if (options.includeScripts === false) {
            processed = processed.replace(/<script[^>]*src[^>]*>[\s\S]*?<\/script>/gi, '');
        }

        // Update asset paths
        processed = processed.replace(/src="\/\//g, 'src="https://');
        processed = processed.replace(/href="\/\//g, 'href="https://');

        // Add local stylesheet link
        if (!processed.includes('styles.css')) {
            processed = processed.replace(
                '</head>',
                '    <link rel="stylesheet" href="styles.css">\n</head>'
            );
        }

        // Add local script
        if (!processed.includes('script.js')) {
            processed = processed.replace(
                '</body>',
                '    <script src="script.js"></script>\n</body>'
            );
        }

        return processed;
    }

    // ========================================================================
    // STYLE EXTRACTION
    // ========================================================================

    private extractInlineStyles(html: string): string {
        let styles = '';

        // Extract inline <style> tags
        const styleMatches = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
        if (styleMatches) {
            styleMatches.forEach(match => {
                const content = match.replace(/<\/?style[^>]*>/gi, '');
                styles += content + '\n\n';
            });
        }

        return styles;
    }

    private generateBaseStyles(): string {
        return `
/* Base Reset */
*, *::before, *::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html {
    scroll-behavior: smooth;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: #333;
}

img {
    max-width: 100%;
    height: auto;
}

a {
    text-decoration: none;
    color: inherit;
}

/* Responsive Container */
.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

/* Utility Classes */
.text-center { text-align: center; }
.flex { display: flex; }
.flex-center { display: flex; align-items: center; justify-content: center; }
.grid { display: grid; }
`;
    }

    // ========================================================================
    // JAVASCRIPT GENERATION
    // ========================================================================

    private generateBasicJS(structure: PageStructure): string {
        let js = '// Generated JavaScript\n\n';

        // Smooth scroll
        js += `// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

`;

        // Mobile menu toggle
        if (structure.header) {
            js += `// Mobile menu toggle
const menuButton = document.querySelector('.menu-toggle, .hamburger');
const mobileMenu = document.querySelector('.mobile-menu, .nav-links');

if (menuButton && mobileMenu) {
    menuButton.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
    });
}

`;
        }

        // Scroll animations
        js += `// Scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

document.querySelectorAll('section, .card, .feature').forEach(el => {
    observer.observe(el);
});
`;

        return js;
    }

    // ========================================================================
    // GENERATE SIMILAR PAGE
    // ========================================================================

    async generateSimilarPage(
        structure: PageStructure,
        content: {
            title: string;
            subtitle?: string;
            features?: Array<{ title: string; description: string }>;
            ctaText?: string;
        },
        targetPath: string
    ): Promise<CloneResult> {
        const files: string[] = [];

        const html = this.generateHTMLFromStructure(structure, content);
        const css = this.generateCSSFromStructure(structure);
        const js = this.generateBasicJS(structure);

        // Create output directory
        if (!fs.existsSync(targetPath)) {
            fs.mkdirSync(targetPath, { recursive: true });
        }

        fs.writeFileSync(path.join(targetPath, 'index.html'), html);
        fs.writeFileSync(path.join(targetPath, 'styles.css'), css);
        fs.writeFileSync(path.join(targetPath, 'script.js'), js);

        files.push('index.html', 'styles.css', 'script.js');

        return { success: true, files };
    }

    private generateHTMLFromStructure(
        structure: PageStructure,
        content: any
    ): string {
        let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${content.title}</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
`;

        if (structure.header) {
            html += `    <header class="header">
        <nav class="nav container">
            <div class="logo">${content.title}</div>
            <ul class="nav-links">
                <li><a href="#features">Features</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
        </nav>
    </header>
`;
        }

        if (structure.hero) {
            html += `    <section class="hero">
        <div class="container">
            <h1>${content.title}</h1>
            <p>${content.subtitle || 'Welcome to our website'}</p>
            <a href="#" class="btn">${content.ctaText || 'Get Started'}</a>
        </div>
    </section>
`;
        }

        if (structure.features && content.features) {
            html += `    <section id="features" class="features">
        <div class="container">
            <h2>Features</h2>
            <div class="feature-grid">
`;
            content.features.forEach((f: any) => {
                html += `                <div class="feature-card">
                    <h3>${f.title}</h3>
                    <p>${f.description}</p>
                </div>
`;
            });
            html += `            </div>
        </div>
    </section>
`;
        }

        if (structure.footer) {
            html += `    <footer class="footer">
        <div class="container">
            <p>&copy; ${new Date().getFullYear()} ${content.title}. All rights reserved.</p>
        </div>
    </footer>
`;
        }

        html += `    <script src="script.js"></script>
</body>
</html>`;

        return html;
    }

    private generateCSSFromStructure(structure: PageStructure): string {
        return this.generateBaseStyles() + `
/* Header */
.header {
    padding: 1rem 0;
    position: sticky;
    top: 0;
    background: white;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    z-index: 100;
}

.nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.logo {
    font-size: 1.5rem;
    font-weight: bold;
    color: #6366f1;
}

.nav-links {
    display: flex;
    gap: 2rem;
    list-style: none;
}

/* Hero */
.hero {
    min-height: 80vh;
    display: flex;
    align-items: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    text-align: center;
}

.hero h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.btn {
    display: inline-block;
    padding: 1rem 2rem;
    background: white;
    color: #667eea;
    border-radius: 8px;
    font-weight: bold;
    margin-top: 2rem;
    transition: transform 0.2s;
}

.btn:hover {
    transform: scale(1.05);
}

/* Features */
.features {
    padding: 5rem 0;
}

.features h2 {
    text-align: center;
    margin-bottom: 3rem;
    font-size: 2rem;
}

.feature-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
}

.feature-card {
    padding: 2rem;
    background: #f8fafc;
    border-radius: 12px;
    transition: box-shadow 0.3s;
}

.feature-card:hover {
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

/* Footer */
.footer {
    padding: 2rem 0;
    background: #1f2937;
    color: white;
    text-align: center;
}
`;
    }
}

export const websiteCloningAgent = WebsiteCloningAgent.getInstance();
