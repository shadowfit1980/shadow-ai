/**
 * Smart Refactoring Engine
 * 
 * AI-powered code refactoring tools for:
 * - Extract function/method
 * - Rename symbols
 * - Move to separate file
 * - Convert patterns
 */

export interface RefactorSuggestion {
    id: string;
    type: 'extract' | 'rename' | 'move' | 'convert' | 'simplify';
    description: string;
    original: string;
    refactored: string;
    line?: number;
    confidence: number; // 0-1
}

class SmartRefactoringEngine {

    /**
     * Extract function from code block
     */
    extractFunction(
        code: string,
        startLine: number,
        endLine: number,
        functionName: string
    ): { extracted: string; updated: string } {
        const lines = code.split('\n');
        const selectedLines = lines.slice(startLine - 1, endLine);
        const selectedCode = selectedLines.join('\n');

        // Detect parameters (simple heuristic)
        const paramMatches = selectedCode.match(/\b(this\.)?\w+\b/g) || [];
        const potentialParams = [...new Set(paramMatches)]
            .filter(p => !p.startsWith('this.'))
            .filter(p => !['if', 'else', 'for', 'while', 'return', 'const', 'let', 'var', 'function'].includes(p))
            .slice(0, 4); // Max 4 params

        const params = potentialParams.join(', ');
        const extracted = `
function ${functionName}(${params}) {
${selectedLines.map(l => '    ' + l).join('\n')}
}
`;

        const replacement = `    ${functionName}(${params});`;
        const updatedLines = [
            ...lines.slice(0, startLine - 1),
            replacement,
            ...lines.slice(endLine)
        ];

        return {
            extracted: extracted.trim(),
            updated: updatedLines.join('\n')
        };
    }

    /**
     * Convert callback to async/await
     */
    convertCallbackToAsync(code: string): string {
        // Simple pattern: .then().catch() -> try/await/catch
        let converted = code;

        // Pattern 1: promise.then(result => ...).catch(err => ...)
        const thenCatchPattern = /(\w+)\.then\(\(?(\w+)\)?\s*=>\s*\{([^}]+)\}\)\.catch\(\(?(\w+)\)?\s*=>\s*\{([^}]+)\}\)/g;

        converted = converted.replace(thenCatchPattern, (match, promise, resultVar, thenBody, errVar, catchBody) => {
            return `try {
    const ${resultVar} = await ${promise};
    ${thenBody.trim()}
} catch (${errVar}) {
    ${catchBody.trim()}
}`;
        });

        // Pattern 2: Simple .then()
        const simpleThenPattern = /(\w+)\.then\(\(?(\w+)\)?\s*=>\s*\{([^}]+)\}\)/g;
        converted = converted.replace(simpleThenPattern, (match, promise, resultVar, body) => {
            return `const ${resultVar} = await ${promise};
${body.trim()}`;
        });

        return converted;
    }

    /**
     * Convert class component to functional component (React)
     */
    convertClassToFunctional(classCode: string): string {
        // Extract class name
        const classNameMatch = classCode.match(/class\s+(\w+)\s+extends\s+(React\.)?Component/);
        if (!classNameMatch) return classCode;

        const className = classNameMatch[1];

        // Extract state
        const stateMatch = classCode.match(/state\s*=\s*\{([^}]+)\}/);
        const stateVars = stateMatch ? this.parseState(stateMatch[1]) : [];

        // Extract render method
        const renderMatch = classCode.match(/render\s*\(\)\s*\{([\s\S]*?)\n\s*\}/);
        const renderBody = renderMatch ? renderMatch[1] : '';

        // Generate functional component
        let functional = `function ${className}(props) {\n`;

        // Add useState hooks
        stateVars.forEach(({ name, defaultValue }) => {
            functional += `    const [${name}, set${this.capitalize(name)}] = useState(${defaultValue});\n`;
        });

        functional += '\n    return (\n';
        functional += renderBody
            .replace(/this\.state\./g, '')
            .replace(/this\.props\./g, 'props.')
            .replace(/this\.setState\(\{(\w+):\s*([^}]+)\}\)/g, 'set$1($2)');
        functional += '\n    );\n}';

        return functional;
    }

    private parseState(stateStr: string): { name: string; defaultValue: string }[] {
        const parts = stateStr.split(',').map(p => p.trim());
        return parts.map(part => {
            const [name, value] = part.split(':').map(s => s.trim());
            return { name, defaultValue: value || 'null' };
        });
    }

    private capitalize(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Suggest refactoring opportunities
     */
    suggestRefactorings(code: string, language: string): RefactorSuggestion[] {
        const suggestions: RefactorSuggestion[] = [];
        const lines = code.split('\n');

        // Detect long functions (> 30 lines)
        let functionStart = -1;
        let braceCount = 0;
        lines.forEach((line, index) => {
            if (line.match(/function\s+\w+|=>\s*\{|\w+\s*\([^)]*\)\s*\{/)) {
                functionStart = index;
                braceCount = 0;
            }
            braceCount += (line.match(/\{/g) || []).length;
            braceCount -= (line.match(/\}/g) || []).length;

            if (functionStart >= 0 && braceCount === 0 && index - functionStart > 30) {
                suggestions.push({
                    id: `ref_${Date.now()}_${index}`,
                    type: 'extract',
                    description: `Function is ${index - functionStart} lines long. Consider extracting parts.`,
                    original: lines.slice(functionStart, index + 1).join('\n').substring(0, 100) + '...',
                    refactored: '// Split into smaller functions',
                    line: functionStart + 1,
                    confidence: 0.8
                });
                functionStart = -1;
            }
        });

        // Detect deeply nested code (> 4 levels)
        let maxIndent = 0;
        let deepLine = -1;
        lines.forEach((line, index) => {
            const indent = line.search(/\S/);
            if (indent > maxIndent) {
                maxIndent = indent;
                deepLine = index;
            }
        });
        if (maxIndent > 16) { // Assuming 4 spaces per indent
            suggestions.push({
                id: `ref_deep_${Date.now()}`,
                type: 'simplify',
                description: `Deeply nested code (${Math.floor(maxIndent / 4)} levels). Consider early returns or extraction.`,
                original: lines[deepLine]?.substring(0, 80) || '',
                refactored: '// Use early returns or extract nested logic',
                line: deepLine + 1,
                confidence: 0.75
            });
        }

        // Detect duplicate code patterns
        const codeBlocks = new Map<string, number[]>();
        for (let i = 0; i < lines.length - 2; i++) {
            const block = lines.slice(i, i + 3).join('\n').trim();
            if (block.length > 20) {
                const existing = codeBlocks.get(block) || [];
                existing.push(i);
                codeBlocks.set(block, existing);
            }
        }

        codeBlocks.forEach((occurrences, block) => {
            if (occurrences.length > 1) {
                suggestions.push({
                    id: `ref_dup_${Date.now()}_${occurrences[0]}`,
                    type: 'extract',
                    description: `Duplicate code found at lines ${occurrences.map(o => o + 1).join(', ')}`,
                    original: block.substring(0, 100),
                    refactored: '// Extract to shared function',
                    line: occurrences[0] + 1,
                    confidence: 0.9
                });
            }
        });

        return suggestions;
    }
}

export const smartRefactoringEngine = new SmartRefactoringEngine();
