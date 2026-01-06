/**
 * Smart Code Generator
 * 
 * Generates code that is validated and auto-fixed BEFORE presenting to user.
 * No more "let me know if something's wrong" - code is verified first!
 */

import { CodePreValidator, ValidationResult } from './CodePreValidator';

export interface GeneratedCode {
    files: GeneratedFile[];
    validated: boolean;
    validationResult: ValidationResult;
    autoFixesApplied: number;
}

export interface GeneratedFile {
    path: string;
    content: string;
    language: 'html' | 'css' | 'javascript' | 'typescript' | 'json' | 'other';
}

export class SmartCodeGenerator {
    private static instance: SmartCodeGenerator;
    private validator: CodePreValidator;

    private constructor() {
        this.validator = CodePreValidator.getInstance();
    }

    static getInstance(): SmartCodeGenerator {
        if (!SmartCodeGenerator.instance) {
            SmartCodeGenerator.instance = new SmartCodeGenerator();
        }
        return SmartCodeGenerator.instance;
    }

    /**
     * Generate a complete HTML page with embedded CSS/JS
     * This avoids file path issues by bundling everything together
     */
    generateSingleFileHTML(options: {
        title: string;
        description?: string;
        styles: string;
        bodyContent: string;
        scripts?: string;
    }): GeneratedCode {
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${options.description || options.title}">
    <title>${options.title}</title>
    <style>
        /* Reset and base styles */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; }
        
        ${options.styles}
    </style>
</head>
<body>
    ${options.bodyContent}
    
    ${options.scripts ? `<script>\n${options.scripts}\n</script>` : ''}
</body>
</html>`;

        // Validate before returning
        const validationResult = this.validator.validateHTML(html, { checkLinks: false, checkScripts: false });

        return {
            files: [{ path: 'index.html', content: html, language: 'html' }],
            validated: validationResult.valid,
            validationResult,
            autoFixesApplied: 0
        };
    }

    /**
     * Generate a multi-file project but verify all links are correct
     */
    generateWebProject(options: {
        name: string;
        html: string;
        css: string;
        js?: string;
    }): GeneratedCode {
        const files: GeneratedFile[] = [];
        let autoFixesApplied = 0;

        // Ensure HTML has proper structure and correct file references
        let html = options.html;

        // Auto-fix: Add DOCTYPE if missing
        if (!html.includes('<!DOCTYPE') && !html.includes('<!doctype')) {
            html = '<!DOCTYPE html>\n' + html;
            autoFixesApplied++;
        }

        // Auto-fix: Ensure CSS link is correct
        if (!html.includes('href="style.css"') && !html.includes("href='style.css'") &&
            !html.includes('href="./style.css"') && !html.includes("href='./style.css'")) {
            // Add CSS link if body content exists
            if (html.includes('</head>')) {
                html = html.replace('</head>', '    <link rel="stylesheet" href="style.css">\n</head>');
                autoFixesApplied++;
            }
        }

        // Auto-fix: Ensure JS link is correct if JS provided
        if (options.js && !html.includes('src="script.js"') && !html.includes("src='script.js'") &&
            !html.includes('src="./script.js"') && !html.includes("src='./script.js'")) {
            if (html.includes('</body>')) {
                html = html.replace('</body>', '    <script src="script.js"></script>\n</body>');
                autoFixesApplied++;
            }
        }

        files.push({ path: 'index.html', content: html, language: 'html' });
        files.push({ path: 'style.css', content: options.css, language: 'css' });

        if (options.js) {
            files.push({ path: 'script.js', content: options.js, language: 'javascript' });
        }

        // Validate the complete project
        const validationResult = this.validator.validateWebProject(files);

        return {
            files,
            validated: validationResult.valid,
            validationResult,
            autoFixesApplied
        };
    }

    /**
     * Generate a React component with proper structure
     */
    generateReactComponent(options: {
        name: string;
        props?: { name: string; type: string; required?: boolean }[];
        state?: { name: string; type: string; initial: string }[];
        jsx: string;
        styles?: string;
    }): GeneratedCode {
        const componentName = options.name.charAt(0).toUpperCase() + options.name.slice(1);

        // Build props interface
        let propsInterface = '';
        if (options.props && options.props.length > 0) {
            propsInterface = `interface ${componentName}Props {\n`;
            options.props.forEach(p => {
                propsInterface += `    ${p.name}${p.required ? '' : '?'}: ${p.type};\n`;
            });
            propsInterface += '}\n\n';
        }

        // Build state hooks
        let stateHooks = '';
        if (options.state && options.state.length > 0) {
            options.state.forEach(s => {
                const setter = `set${s.name.charAt(0).toUpperCase() + s.name.slice(1)}`;
                stateHooks += `    const [${s.name}, ${setter}] = useState<${s.type}>(${s.initial});\n`;
            });
        }

        const content = `import React${options.state ? ', { useState }' : ''} from 'react';
${options.styles ? `import './${componentName}.css';` : ''}

${propsInterface}export default function ${componentName}(${options.props?.length ? `props: ${componentName}Props` : ''}) {
${stateHooks}
    return (
        ${options.jsx}
    );
}
`;

        const files: GeneratedFile[] = [
            { path: `${componentName}.tsx`, content, language: 'typescript' }
        ];

        if (options.styles) {
            files.push({ path: `${componentName}.css`, content: options.styles, language: 'css' });
        }

        const validationResult = this.validator.validateTypeScript(content);

        return {
            files,
            validated: validationResult.valid,
            validationResult,
            autoFixesApplied: 0
        };
    }

    /**
     * Auto-fix common issues in generated code
     */
    autoFixHTML(html: string): { fixed: string; fixesApplied: string[] } {
        let fixed = html;
        const fixesApplied: string[] = [];

        // Fix: Add DOCTYPE
        if (!fixed.includes('<!DOCTYPE') && !fixed.includes('<!doctype')) {
            fixed = '<!DOCTYPE html>\n' + fixed;
            fixesApplied.push('Added DOCTYPE declaration');
        }

        // Fix: Add html tag
        if (!fixed.includes('<html')) {
            fixed = fixed.replace('<!DOCTYPE html>', '<!DOCTYPE html>\n<html lang="en">');
            if (!fixed.includes('</html>')) {
                fixed += '\n</html>';
            }
            fixesApplied.push('Added <html> tag');
        }

        // Fix: Add head tag
        if (!fixed.includes('<head>') && !fixed.includes('<head ')) {
            const insertPoint = fixed.indexOf('<html');
            if (insertPoint !== -1) {
                const endOfHtml = fixed.indexOf('>', insertPoint);
                fixed = fixed.slice(0, endOfHtml + 1) + '\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Page</title>\n</head>' + fixed.slice(endOfHtml + 1);
                fixesApplied.push('Added <head> with meta tags');
            }
        }

        // Fix: Add body tag
        if (!fixed.includes('<body>') && !fixed.includes('<body ')) {
            if (fixed.includes('</head>')) {
                fixed = fixed.replace('</head>', '</head>\n<body>');
                if (!fixed.includes('</body>')) {
                    fixed = fixed.replace('</html>', '</body>\n</html>');
                }
                fixesApplied.push('Added <body> tag');
            }
        }

        // Fix: Ensure proper closing
        if (!fixed.includes('</body>') && fixed.includes('<body')) {
            fixed = fixed.replace('</html>', '</body>\n</html>');
            fixesApplied.push('Added closing </body> tag');
        }

        return { fixed, fixesApplied };
    }

    /**
     * Bundle multiple files into a single HTML for easier testing
     */
    bundleToSingleFile(files: GeneratedFile[]): GeneratedCode {
        const htmlFile = files.find(f => f.language === 'html');
        const cssFiles = files.filter(f => f.language === 'css');
        const jsFiles = files.filter(f => f.language === 'javascript');

        if (!htmlFile) {
            return {
                files: [],
                validated: false,
                validationResult: {
                    valid: false,
                    errors: [{ type: 'missing_file', message: 'No HTML file found', severity: 'critical' }],
                    warnings: [],
                    suggestions: []
                },
                autoFixesApplied: 0
            };
        }

        let bundledHtml = htmlFile.content;

        // Embed CSS
        cssFiles.forEach(cssFile => {
            // Try to find and replace the link tag
            const linkRegex = new RegExp(`<link[^>]*href=["']${cssFile.path}["'][^>]*>`, 'i');
            if (linkRegex.test(bundledHtml)) {
                bundledHtml = bundledHtml.replace(linkRegex, `<style>\n${cssFile.content}\n</style>`);
            } else {
                // Add style before </head>
                bundledHtml = bundledHtml.replace('</head>', `<style>\n${cssFile.content}\n</style>\n</head>`);
            }
        });

        // Embed JS
        jsFiles.forEach(jsFile => {
            const scriptRegex = new RegExp(`<script[^>]*src=["']${jsFile.path}["'][^>]*>\\s*</script>`, 'i');
            if (scriptRegex.test(bundledHtml)) {
                bundledHtml = bundledHtml.replace(scriptRegex, `<script>\n${jsFile.content}\n</script>`);
            } else {
                // Add script before </body>
                bundledHtml = bundledHtml.replace('</body>', `<script>\n${jsFile.content}\n</script>\n</body>`);
            }
        });

        const validationResult = this.validator.validateHTML(bundledHtml);

        return {
            files: [{ path: 'index.html', content: bundledHtml, language: 'html' }],
            validated: validationResult.valid,
            validationResult,
            autoFixesApplied: cssFiles.length + jsFiles.length
        };
    }
}

export default SmartCodeGenerator;
