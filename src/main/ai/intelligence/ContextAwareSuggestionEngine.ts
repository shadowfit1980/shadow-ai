/**
 * Context-Aware Suggestion Engine
 * 
 * Provides intelligent, context-aware code suggestions based on:
 * - Current file type
 * - Project context
 * - User's coding patterns
 * - Common issues and best practices
 */

import { CodePreValidator } from '../validation/CodePreValidator';

export interface SuggestionContext {
    fileType: string;
    language: string;
    currentCode?: string;
    cursorPosition?: { line: number; column: number };
    projectType?: string;
    recentErrors?: string[];
}

export interface Suggestion {
    id: string;
    type: 'completion' | 'refactor' | 'fix' | 'optimization' | 'documentation';
    title: string;
    description: string;
    code?: string;
    priority: 'high' | 'medium' | 'low';
    confidence: number;
}

export class ContextAwareSuggestionEngine {
    private static instance: ContextAwareSuggestionEngine;
    private validator: CodePreValidator;
    private patterns: Map<string, RegExp[]> = new Map();
    private suggestionHistory: Suggestion[] = [];

    private constructor() {
        this.validator = CodePreValidator.getInstance();
        this.initializePatterns();
    }

    static getInstance(): ContextAwareSuggestionEngine {
        if (!ContextAwareSuggestionEngine.instance) {
            ContextAwareSuggestionEngine.instance = new ContextAwareSuggestionEngine();
        }
        return ContextAwareSuggestionEngine.instance;
    }

    private initializePatterns(): void {
        // JavaScript/TypeScript patterns
        this.patterns.set('javascript', [
            /console\.(log|error|warn)\(/g,  // Console statements
            /var\s+/g,  // var usage (suggest let/const)
            /function\s+\w+\s*\(/g,  // Function declarations (suggest arrow functions)
            /===\s*null\s*\|\|\s*===\s*undefined/g,  // Null checks (suggest optional chaining)
            /\.then\(/g,  // Promise chains (suggest async/await)
        ]);

        // React patterns
        this.patterns.set('react', [
            /useState\s*\(/g,
            /useEffect\s*\(\s*\(\)\s*=>\s*{/g,
            /componentDidMount|componentWillUnmount/g,
            /<div\s+className=/g,
        ]);

        // HTML patterns
        this.patterns.set('html', [
            /<img(?![^>]*alt=)/g,  // Images without alt
            /<a(?![^>]*target=)/g,  // Links without target
            /<(?!meta)[^>]*charset/g,  // Charset issues
        ]);
    }

    /**
     * Generate suggestions based on context
     */
    async getSuggestions(context: SuggestionContext): Promise<Suggestion[]> {
        const suggestions: Suggestion[] = [];

        // Get language-specific suggestions
        const languageSuggestions = this.getLanguageSuggestions(context);
        suggestions.push(...languageSuggestions);

        // Get code quality suggestions
        if (context.currentCode) {
            const qualitySuggestions = await this.getCodeQualitySuggestions(context);
            suggestions.push(...qualitySuggestions);
        }

        // Get error-based suggestions
        if (context.recentErrors && context.recentErrors.length > 0) {
            const errorSuggestions = this.getErrorBasedSuggestions(context);
            suggestions.push(...errorSuggestions);
        }

        // Sort by priority and confidence
        suggestions.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            return b.confidence - a.confidence;
        });

        return suggestions.slice(0, 10); // Return top 10 suggestions
    }

    /**
     * Get language-specific suggestions
     */
    private getLanguageSuggestions(context: SuggestionContext): Suggestion[] {
        const suggestions: Suggestion[] = [];
        const code = context.currentCode || '';
        const lang = context.language.toLowerCase();

        // JavaScript/TypeScript suggestions
        if (['javascript', 'typescript', 'jsx', 'tsx'].includes(lang)) {
            // Suggest async/await over promises
            if (code.includes('.then(')) {
                suggestions.push({
                    id: 'async-await-suggest',
                    type: 'refactor',
                    title: 'Use async/await',
                    description: 'Consider using async/await instead of .then() for cleaner code',
                    code: `// Instead of:\nfetch(url).then(res => res.json()).then(data => console.log(data));\n\n// Use:\nconst response = await fetch(url);\nconst data = await response.json();\nconsole.log(data);`,
                    priority: 'medium',
                    confidence: 0.85
                });
            }

            // Suggest destructuring
            if (/const\s+\w+\s*=\s*\w+\.\w+;/.test(code)) {
                suggestions.push({
                    id: 'destructuring-suggest',
                    type: 'refactor',
                    title: 'Use destructuring',
                    description: 'Extract multiple properties at once using destructuring',
                    code: `// Instead of:\nconst name = user.name;\nconst age = user.age;\n\n// Use:\nconst { name, age } = user;`,
                    priority: 'low',
                    confidence: 0.75
                });
            }

            // Suggest optional chaining
            if (/&&\s*\w+\.\w+\s*&&/.test(code) || /\w+\s*\?\s*\w+\.\w+\s*:\s*undefined/.test(code)) {
                suggestions.push({
                    id: 'optional-chaining-suggest',
                    type: 'refactor',
                    title: 'Use optional chaining',
                    description: 'Simplify null checks with ?. operator',
                    code: `// Instead of:\nconst name = user && user.profile && user.profile.name;\n\n// Use:\nconst name = user?.profile?.name;`,
                    priority: 'medium',
                    confidence: 0.9
                });
            }

            // Suggest nullish coalescing
            if (/\|\|\s*['"]/.test(code) || /===\s*undefined\s*\?\s*/.test(code)) {
                suggestions.push({
                    id: 'nullish-coalescing-suggest',
                    type: 'refactor',
                    title: 'Use nullish coalescing',
                    description: 'Use ?? instead of || for default values (handles 0 and "" correctly)',
                    code: `// Instead of:\nconst value = input || 'default';\n\n// Use:\nconst value = input ?? 'default';`,
                    priority: 'low',
                    confidence: 0.8
                });
            }
        }

        // React suggestions
        if (['jsx', 'tsx'].includes(lang) || code.includes('React')) {
            // Suggest useCallback for function props
            if (/onClick={\(\)\s*=>/.test(code)) {
                suggestions.push({
                    id: 'useCallback-suggest',
                    type: 'optimization',
                    title: 'Memoize callback functions',
                    description: 'Use useCallback to prevent unnecessary re-renders',
                    code: `// Instead of:\n<Button onClick={() => handleClick(id)} />\n\n// Use:\nconst handleButtonClick = useCallback(() => handleClick(id), [id]);\n<Button onClick={handleButtonClick} />`,
                    priority: 'medium',
                    confidence: 0.7
                });
            }

            // Suggest useMemo
            if (/\.filter\(|\.map\(|\.reduce\(/.test(code) && !/useMemo/.test(code)) {
                suggestions.push({
                    id: 'useMemo-suggest',
                    type: 'optimization',
                    title: 'Memoize expensive computations',
                    description: 'Use useMemo for array operations that might be recalculated',
                    code: `// Instead of:\nconst filteredItems = items.filter(item => item.active);\n\n// Use:\nconst filteredItems = useMemo(\n  () => items.filter(item => item.active),\n  [items]\n);`,
                    priority: 'low',
                    confidence: 0.65
                });
            }
        }

        // CSS suggestions
        if (['css', 'scss', 'less'].includes(lang)) {
            // Suggest CSS variables
            if (/color:\s*#[a-fA-F0-9]{3,6}/.test(code) && !code.includes('var(--')) {
                suggestions.push({
                    id: 'css-variables-suggest',
                    type: 'refactor',
                    title: 'Use CSS variables',
                    description: 'Extract colors and values into CSS custom properties for easier maintenance',
                    code: `:root {\n  --primary-color: #3498db;\n  --secondary-color: #2ecc71;\n}\n\n.button {\n  background-color: var(--primary-color);\n}`,
                    priority: 'low',
                    confidence: 0.7
                });
            }

            // Suggest flexbox/grid
            if (/display:\s*(inline-block|table|table-cell)/.test(code)) {
                suggestions.push({
                    id: 'flexbox-suggest',
                    type: 'refactor',
                    title: 'Use Flexbox or Grid',
                    description: 'Modern layout with flexbox or grid is more maintainable',
                    code: `.container {\n  display: flex; /* or display: grid; */\n  gap: 1rem;\n  justify-content: center;\n  align-items: center;\n}`,
                    priority: 'medium',
                    confidence: 0.8
                });
            }
        }

        return suggestions;
    }

    /**
     * Get code quality suggestions from validation
     */
    private async getCodeQualitySuggestions(context: SuggestionContext): Promise<Suggestion[]> {
        const suggestions: Suggestion[] = [];
        const code = context.currentCode || '';
        const lang = context.language.toLowerCase();

        // Validate based on file type
        if (['html', 'htm'].includes(lang)) {
            const result = this.validator.validateHTML(code);
            result.errors.forEach(error => {
                suggestions.push({
                    id: `fix-${error.type}-${Math.random().toString(36).substr(2, 5)}`,
                    type: 'fix',
                    title: `Fix: ${error.message}`,
                    description: error.message,
                    priority: error.severity === 'critical' ? 'high' : 'medium',
                    confidence: 0.95
                });
            });
        }

        if (['css', 'scss', 'less'].includes(lang)) {
            const result = this.validator.validateCSS(code);
            result.errors.forEach(error => {
                suggestions.push({
                    id: `fix-${error.type}-${Math.random().toString(36).substr(2, 5)}`,
                    type: 'fix',
                    title: `Fix: ${error.message}`,
                    description: error.message,
                    priority: error.severity === 'critical' ? 'high' : 'medium',
                    confidence: 0.95
                });
            });
        }

        if (['javascript', 'js'].includes(lang)) {
            const result = this.validator.validateJavaScript(code);
            result.errors.forEach(error => {
                suggestions.push({
                    id: `fix-${error.type}-${Math.random().toString(36).substr(2, 5)}`,
                    type: 'fix',
                    title: `Fix: ${error.message}`,
                    description: error.message,
                    priority: error.severity === 'critical' ? 'high' : 'medium',
                    confidence: 0.95
                });
            });
        }

        if (['typescript', 'ts', 'tsx'].includes(lang)) {
            const result = this.validator.validateTypeScript(code);
            result.errors.forEach(error => {
                suggestions.push({
                    id: `fix-${error.type}-${Math.random().toString(36).substr(2, 5)}`,
                    type: 'fix',
                    title: `Fix: ${error.message}`,
                    description: error.message,
                    priority: error.severity === 'critical' ? 'high' : 'medium',
                    confidence: 0.95
                });
            });
        }

        return suggestions;
    }

    /**
     * Get suggestions based on recent errors
     */
    private getErrorBasedSuggestions(context: SuggestionContext): Suggestion[] {
        const suggestions: Suggestion[] = [];
        const errors = context.recentErrors || [];

        errors.forEach(error => {
            // Parse common error patterns
            if (error.includes('undefined is not an object') || error.includes('cannot read property')) {
                suggestions.push({
                    id: 'null-check-fix',
                    type: 'fix',
                    title: 'Add null/undefined check',
                    description: 'The error suggests trying to access a property on undefined',
                    code: `// Add optional chaining:\nobject?.property\n\n// Or explicit check:\nif (object && object.property) {\n  // use property\n}`,
                    priority: 'high',
                    confidence: 0.9
                });
            }

            if (error.includes('is not a function')) {
                suggestions.push({
                    id: 'function-check-fix',
                    type: 'fix',
                    title: 'Check if value is callable',
                    description: 'The error suggests calling a non-function value',
                    code: `// Check before calling:\nif (typeof callback === 'function') {\n  callback();\n}`,
                    priority: 'high',
                    confidence: 0.85
                });
            }

            if (error.includes('CORS') || error.includes('cross-origin')) {
                suggestions.push({
                    id: 'cors-fix',
                    type: 'fix',
                    title: 'Fix CORS issue',
                    description: 'Cross-Origin Resource Sharing (CORS) error detected',
                    code: `// Server-side fix (Express example):\napp.use(cors());\n\n// Or specify allowed origins:\napp.use(cors({\n  origin: 'https://yourdomain.com'\n}));`,
                    priority: 'high',
                    confidence: 0.8
                });
            }

            if (error.includes('SyntaxError') || error.includes('Unexpected token')) {
                suggestions.push({
                    id: 'syntax-fix',
                    type: 'fix',
                    title: 'Fix syntax error',
                    description: 'Check for missing brackets, commas, or semicolons',
                    code: `// Common issues:\n// - Missing closing bracket } or )\n// - Missing comma in object/array\n// - Extra or missing semicolon\n// - Unterminated string`,
                    priority: 'high',
                    confidence: 0.95
                });
            }
        });

        return suggestions;
    }

    /**
     * Generate documentation for code
     */
    generateDocumentation(code: string, language: string): string {
        const lang = language.toLowerCase();

        if (['javascript', 'typescript', 'js', 'ts', 'jsx', 'tsx'].includes(lang)) {
            return this.generateJSDoc(code);
        }

        if (['python', 'py'].includes(lang)) {
            return this.generatePyDoc(code);
        }

        return `// Documentation for ${language}\n${code}`;
    }

    private generateJSDoc(code: string): string {
        // Simple JSDoc generation
        const functionMatch = code.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/);
        if (functionMatch) {
            const [, name, params] = functionMatch;
            const paramList = params.split(',').map(p => p.trim()).filter(p => p);

            let doc = '/**\n';
            doc += ` * ${name} - Description here\n`;
            doc += ' *\n';
            paramList.forEach(param => {
                const paramName = param.split(':')[0].trim().split('=')[0].trim();
                doc += ` * @param {any} ${paramName} - Parameter description\n`;
            });
            doc += ' * @returns {any} - Return description\n';
            doc += ' */\n';

            return doc + code;
        }

        return code;
    }

    private generatePyDoc(code: string): string {
        const functionMatch = code.match(/def\s+(\w+)\s*\(([^)]*)\)/);
        if (functionMatch) {
            const [, name, params] = functionMatch;
            const paramList = params.split(',').map(p => p.trim()).filter(p => p);

            let doc = `def ${name}(${params}):\n`;
            doc += '    """\n';
            doc += `    ${name} - Description here\n\n`;
            paramList.forEach(param => {
                const paramName = param.split(':')[0].trim().split('=')[0].trim();
                if (paramName !== 'self') {
                    doc += `    Args:\n        ${paramName}: Parameter description\n`;
                }
            });
            doc += '\n    Returns:\n        Return description\n';
            doc += '    """\n';

            return doc;
        }

        return code;
    }
}

export default ContextAwareSuggestionEngine;
