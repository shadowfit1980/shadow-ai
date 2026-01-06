/**
 * Code Validator & Pre-checker
 * 
 * Validates generated code BEFORE presenting to user.
 * Catches common issues proactively.
 */

export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    suggestions: string[];
    autoFixes?: AutoFix[];
}

export interface ValidationError {
    type: 'syntax' | 'missing_file' | 'broken_link' | 'missing_import' | 'type_error';
    message: string;
    line?: number;
    file?: string;
    severity: 'critical' | 'error';
}

export interface ValidationWarning {
    type: 'best_practice' | 'performance' | 'accessibility' | 'security';
    message: string;
    line?: number;
    suggestion?: string;
}

export interface AutoFix {
    description: string;
    originalCode: string;
    fixedCode: string;
    applied: boolean;
}

export class CodePreValidator {
    private static instance: CodePreValidator;

    static getInstance(): CodePreValidator {
        if (!CodePreValidator.instance) {
            CodePreValidator.instance = new CodePreValidator();
        }
        return CodePreValidator.instance;
    }

    /**
     * Validate HTML code before presenting to user
     */
    validateHTML(html: string, options: { checkLinks?: boolean; checkScripts?: boolean } = {}): ValidationResult {
        const errors: ValidationError[] = [];
        const warnings: ValidationWarning[] = [];
        const suggestions: string[] = [];
        const autoFixes: AutoFix[] = [];

        // Check for basic HTML structure
        if (!html.includes('<!DOCTYPE html>') && !html.includes('<!doctype html>')) {
            warnings.push({
                type: 'best_practice',
                message: 'Missing DOCTYPE declaration',
                suggestion: 'Add <!DOCTYPE html> at the beginning'
            });
        }

        if (!html.includes('<html')) {
            errors.push({
                type: 'syntax',
                message: 'Missing <html> tag',
                severity: 'critical'
            });
        }

        if (!html.includes('<head>') && !html.includes('<head ')) {
            errors.push({
                type: 'syntax',
                message: 'Missing <head> tag',
                severity: 'error'
            });
        }

        if (!html.includes('<body>') && !html.includes('<body ')) {
            errors.push({
                type: 'syntax',
                message: 'Missing <body> tag - page will be blank!',
                severity: 'critical'
            });
        }

        // Check for empty body
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (bodyMatch && bodyMatch[1].trim().length === 0) {
            errors.push({
                type: 'syntax',
                message: 'Empty <body> tag - page will be blank!',
                severity: 'critical'
            });
        }

        // Check CSS links
        if (options.checkLinks) {
            const cssLinks = html.match(/href=["']([^"']+\.css)["']/g);
            if (cssLinks) {
                cssLinks.forEach(link => {
                    const path = link.match(/href=["']([^"']+)["']/)?.[1];
                    if (path && !path.startsWith('http') && !path.startsWith('//')) {
                        suggestions.push(`Verify CSS file exists: ${path}`);
                    }
                });
            }
        }

        // Check script links
        if (options.checkScripts) {
            const scriptLinks = html.match(/src=["']([^"']+\.js)["']/g);
            if (scriptLinks) {
                scriptLinks.forEach(link => {
                    const path = link.match(/src=["']([^"']+)["']/)?.[1];
                    if (path && !path.startsWith('http') && !path.startsWith('//')) {
                        suggestions.push(`Verify JS file exists: ${path}`);
                    }
                });
            }
        }

        // Check for unmatched tags
        const openTags = html.match(/<([a-zA-Z]+)[^>]*(?<!\/)\s*>/g) || [];
        const closeTags = html.match(/<\/([a-zA-Z]+)>/g) || [];

        if (Math.abs(openTags.length - closeTags.length) > 5) {
            warnings.push({
                type: 'best_practice',
                message: 'Potential unmatched HTML tags detected',
                suggestion: 'Review tag structure for missing closing tags'
            });
        }

        return {
            valid: errors.filter(e => e.severity === 'critical').length === 0,
            errors,
            warnings,
            suggestions,
            autoFixes
        };
    }

    /**
     * Validate CSS code
     */
    validateCSS(css: string): ValidationResult {
        const errors: ValidationError[] = [];
        const warnings: ValidationWarning[] = [];
        const suggestions: string[] = [];

        // Check for basic CSS issues
        if (css.trim().length === 0) {
            errors.push({
                type: 'syntax',
                message: 'CSS file is empty',
                severity: 'critical'
            });
        }

        // Check for unmatched braces
        const openBraces = (css.match(/{/g) || []).length;
        const closeBraces = (css.match(/}/g) || []).length;

        if (openBraces !== closeBraces) {
            errors.push({
                type: 'syntax',
                message: `Unmatched braces: ${openBraces} open, ${closeBraces} close`,
                severity: 'error'
            });
        }

        // Check for common mistakes
        if (css.includes('color: #;') || css.includes('color:#;')) {
            errors.push({
                type: 'syntax',
                message: 'Empty color value detected',
                severity: 'error'
            });
        }

        // Check for missing semicolons (common mistake)
        const possibleMissingSemicolon = css.match(/[a-z0-9)%]\s*\n\s*[a-z-]+\s*:/gi);
        if (possibleMissingSemicolon && possibleMissingSemicolon.length > 0) {
            warnings.push({
                type: 'best_practice',
                message: 'Possible missing semicolons detected',
                suggestion: 'Check line endings for missing semicolons'
            });
        }

        return {
            valid: errors.filter(e => e.severity === 'critical').length === 0,
            errors,
            warnings,
            suggestions
        };
    }

    /**
     * Validate JavaScript code
     */
    validateJavaScript(js: string): ValidationResult {
        const errors: ValidationError[] = [];
        const warnings: ValidationWarning[] = [];
        const suggestions: string[] = [];

        // Check for empty code
        if (js.trim().length === 0) {
            errors.push({
                type: 'syntax',
                message: 'JavaScript file is empty',
                severity: 'critical'
            });
        }

        // Check for syntax errors using simple heuristics
        const openParens = (js.match(/\(/g) || []).length;
        const closeParens = (js.match(/\)/g) || []).length;
        if (openParens !== closeParens) {
            errors.push({
                type: 'syntax',
                message: `Unmatched parentheses: ${openParens} open, ${closeParens} close`,
                severity: 'error'
            });
        }

        const openBraces = (js.match(/{/g) || []).length;
        const closeBraces = (js.match(/}/g) || []).length;
        if (openBraces !== closeBraces) {
            errors.push({
                type: 'syntax',
                message: `Unmatched braces: ${openBraces} open, ${closeBraces} close`,
                severity: 'error'
            });
        }

        const openBrackets = (js.match(/\[/g) || []).length;
        const closeBrackets = (js.match(/\]/g) || []).length;
        if (openBrackets !== closeBrackets) {
            errors.push({
                type: 'syntax',
                message: `Unmatched brackets: ${openBrackets} open, ${closeBrackets} close`,
                severity: 'error'
            });
        }

        // Check for undefined references
        const consoleRefs = js.match(/console\.[a-z]+\(/gi) || [];
        if (consoleRefs.length > 0) {
            warnings.push({
                type: 'best_practice',
                message: `${consoleRefs.length} console statements found`,
                suggestion: 'Consider removing console statements in production'
            });
        }

        // Check for potential issues
        if (js.includes('document.write')) {
            warnings.push({
                type: 'best_practice',
                message: 'document.write() is deprecated',
                suggestion: 'Use DOM manipulation methods instead'
            });
        }

        return {
            valid: errors.filter(e => e.severity === 'critical').length === 0,
            errors,
            warnings,
            suggestions
        };
    }

    /**
     * Validate TypeScript code
     */
    validateTypeScript(ts: string): ValidationResult {
        const jsValidation = this.validateJavaScript(ts);
        const errors: ValidationError[] = [...jsValidation.errors];
        const warnings: ValidationWarning[] = [...jsValidation.warnings];
        const suggestions: string[] = [...jsValidation.suggestions];

        // Check for TypeScript-specific issues
        if (ts.includes(': any') || ts.includes(':any')) {
            warnings.push({
                type: 'best_practice',
                message: 'Usage of "any" type detected',
                suggestion: 'Consider using more specific types'
            });
        }

        // Check for missing type annotations on exports
        const exportFunctions: string[] = ts.match(/export\s+(async\s+)?function\s+\w+\s*\([^)]*\)\s*{/g) || [];
        exportFunctions.forEach((func: string) => {
            if (!func.includes(':')) {
                warnings.push({
                    type: 'best_practice',
                    message: 'Exported function missing return type',
                    suggestion: 'Add explicit return type for better type safety'
                });
            }
        });

        return {
            valid: errors.filter(e => e.severity === 'critical').length === 0,
            errors,
            warnings,
            suggestions
        };
    }

    /**
     * Validate a complete web project (HTML + CSS + JS)
     */
    validateWebProject(files: { path: string; content: string }[]): ValidationResult {
        const errors: ValidationError[] = [];
        const warnings: ValidationWarning[] = [];
        const suggestions: string[] = [];

        const htmlFiles = files.filter(f => f.path.endsWith('.html'));
        const cssFiles = files.filter(f => f.path.endsWith('.css'));
        const jsFiles = files.filter(f => f.path.endsWith('.js'));

        // Validate each file type
        htmlFiles.forEach(file => {
            const result = this.validateHTML(file.content, { checkLinks: true, checkScripts: true });
            result.errors.forEach(e => errors.push({ ...e, file: file.path }));
            result.warnings.forEach(w => warnings.push({ ...w, line: undefined }));
            result.suggestions.forEach(s => suggestions.push(`[${file.path}] ${s}`));
        });

        cssFiles.forEach(file => {
            const result = this.validateCSS(file.content);
            result.errors.forEach(e => errors.push({ ...e, file: file.path }));
            result.warnings.forEach(w => warnings.push({ ...w, line: undefined }));
        });

        jsFiles.forEach(file => {
            const result = this.validateJavaScript(file.content);
            result.errors.forEach(e => errors.push({ ...e, file: file.path }));
            result.warnings.forEach(w => warnings.push({ ...w, line: undefined }));
        });

        // Check for missing files referenced in HTML
        htmlFiles.forEach(htmlFile => {
            const cssRefs: string[] = htmlFile.content.match(/href=["']([^"']+\.css)["']/g) || [];
            cssRefs.forEach((ref: string) => {
                const path = ref.match(/href=["']([^"']+)["']/)?.[1];
                if (path && !path.startsWith('http') && !path.startsWith('//')) {
                    const found = cssFiles.some(f => f.path.endsWith(path) || f.path.includes(path));
                    if (!found) {
                        errors.push({
                            type: 'missing_file',
                            message: `CSS file not found: ${path}`,
                            file: htmlFile.path,
                            severity: 'error'
                        });
                    }
                }
            });

            const jsRefs: string[] = htmlFile.content.match(/src=["']([^"']+\.js)["']/g) || [];
            jsRefs.forEach((ref: string) => {
                const path = ref.match(/src=["']([^"']+)["']/)?.[1];
                if (path && !path.startsWith('http') && !path.startsWith('//')) {
                    const found = jsFiles.some(f => f.path.endsWith(path) || f.path.includes(path));
                    if (!found) {
                        errors.push({
                            type: 'missing_file',
                            message: `JavaScript file not found: ${path}`,
                            file: htmlFile.path,
                            severity: 'error'
                        });
                    }
                }
            });
        });

        return {
            valid: errors.filter(e => e.severity === 'critical').length === 0,
            errors,
            warnings,
            suggestions
        };
    }

    /**
     * Format validation result as user-friendly message
     */
    formatResult(result: ValidationResult): string {
        if (result.valid && result.errors.length === 0 && result.warnings.length === 0) {
            return '✅ Code validated successfully - no issues found!';
        }

        let message = '';

        if (result.errors.length > 0) {
            message += '❌ **Errors Found:**\n';
            result.errors.forEach(e => {
                const location = e.file ? `[${e.file}]` : '';
                const line = e.line ? ` (line ${e.line})` : '';
                message += `- ${location}${line} ${e.message}\n`;
            });
            message += '\n';
        }

        if (result.warnings.length > 0) {
            message += '⚠️ **Warnings:**\n';
            result.warnings.forEach(w => {
                message += `- ${w.message}`;
                if (w.suggestion) message += ` → ${w.suggestion}`;
                message += '\n';
            });
            message += '\n';
        }

        if (result.suggestions.length > 0) {
            message += '💡 **Suggestions:**\n';
            result.suggestions.forEach(s => {
                message += `- ${s}\n`;
            });
        }

        return message;
    }
}

export default CodePreValidator;
