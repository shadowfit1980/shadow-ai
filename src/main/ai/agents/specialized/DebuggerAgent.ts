/**
 * DebuggerAgent - Testing & Debugging Specialist
 * 
 * Responsible for finding bugs, running tests, and ensuring code correctness
 */

import { BaseAgent } from '../BaseAgent';
import {
    AgentMetadata,
    ExecutionStep,
    AgentContext,
    ProjectContext,
    DebugOutput,
    Bug,
    Fix
} from '../types';

export class DebuggerAgent extends BaseAgent {
    get metadata(): AgentMetadata {
        return {
            type: 'debugger',
            name: 'Shadow Debugger',
            specialty: 'Testing, Debugging & Quality Verification',
            capabilities: [
                {
                    name: 'Bug Detection',
                    description: 'Find bugs and errors in code',
                    confidence: 0.91
                },
                {
                    name: 'Root Cause Analysis',
                    description: 'Identify root causes of issues',
                    confidence: 0.88
                },
                {
                    name: 'Test Generation',
                    description: 'Create comprehensive test suites',
                    confidence: 0.90
                },
                {
                    name: 'Bug Fixing',
                    description: 'Generate fixes for identified bugs',
                    confidence: 0.85
                },
                {
                    name: 'Edge Case Testing',
                    description: 'Test edge cases and boundary conditions',
                    confidence: 0.87
                }
            ],
            preferredModel: 'gpt-4',
            fallbackModel: 'gemini-flash'
        };
    }

    protected async buildPrompt(
        step: ExecutionStep,
        context: AgentContext,
        memory: ProjectContext
    ): Promise<string> {
        const codeToTest = context.previousResults.find(r => r.agentType === 'coder')?.output;
        const reviewFindings = context.previousResults.find(r => r.agentType === 'reviewer')?.output;

        return `You are ${this.metadata.name}, an expert software tester and debugger.

## Task
${step.description}

## Code to Test/Debug
${codeToTest ? JSON.stringify(codeToTest, null, 2) : 'No code provided'}

## Review Findings (known issues to verify)
${reviewFindings ? JSON.stringify(reviewFindings.issues || [], null, 2) : 'No review findings'}

## Your Mission
Thoroughly test and debug the code:

### 1. Test Execution
- Run all existing tests
- Verify test coverage
- Check for test failures
- Validate edge cases

### 2. Bug Detection
- Static code analysis
- Runtime error detection
- Logic error identification
- Performance issues
- Memory leaks

### 3. Root Cause Analysis
- Trace error origins
- Identify problematic patterns
- Find underlying issues
- Document reproduction steps

### 4. Bug Fixing
- Generate fixes for each bug
- Ensure fixes don't break other code
- Add tests for bug scenarios
- Verify fixes work

### 5. Edge Case Testing
- Null/undefined handling
- Boundary conditions
- Race conditions
- Error scenarios
- Invalid inputs

## Output Format
Return your debugging results as a JSON object:

\`\`\`json
{
  "testsRun": 42,
  "testsPassed": 40,
  "testsFailed": 2,
  "bugs": [
    {
      "severity": "critical|major|minor",
      "description": "Clear description of the bug",
      "location": "File and line number",
      "reproduction": "Steps to reproduce",
      "rootCause": "Why this bug occurs"
    }
  ],
  "fixes": [
    {
      "bugId": "bug-1",
      "description": "What this fix does",
      "changes": [
        {
          "path": "src/",
          "name": "file.ts",
          "content": "fixed code",
          "language": "typescript"
        }
      ],
      "verified": true
    }
  ],
  "coverage": 85.5
}
\`\`\`

Be thorough and precise. Your analysis ensures code quality and reliability.`;
    }

    protected async parseResponse(response: string, step: ExecutionStep): Promise<DebugOutput> {
        const codeBlocks = this.extractCodeBlocks(response);

        let debugJSON: any = null;

        for (const block of codeBlocks) {
            if (block.language === 'json' || block.language === 'javascript') {
                try {
                    debugJSON = JSON.parse(block.code);
                    break;
                } catch {
                    continue;
                }
            }
        }

        if (!debugJSON) {
            debugJSON = this.extractJSON(response);
        }

        if (!debugJSON) {
            console.warn('⚠️  Could not parse JSON debug output, using fallback');
            return this.fallbackParse(response);
        }

        return {
            testsRun: debugJSON.testsRun || 0,
            testsPassed: debugJSON.testsPassed || 0,
            testsFailed: debugJSON.testsFailed || 0,
            bugs: this.parseBugs(debugJSON.bugs || []),
            fixes: this.parseFixes(debugJSON.fixes || []),
            coverage: debugJSON.coverage || 0
        };
    }

    private parseBugs(bugsData: any[]): Bug[] {
        return bugsData.map(bug => ({
            severity: bug.severity || 'minor',
            description: bug.description || 'No description',
            location: bug.location || 'Unknown',
            reproduction: bug.reproduction || 'No steps provided',
            rootCause: bug.rootCause
        }));
    }

    private parseFixes(fixesData: any[]): Fix[] {
        return fixesData.map(fix => ({
            bugId: fix.bugId || 'unknown',
            description: fix.description || 'No description',
            changes: Array.isArray(fix.changes) ? fix.changes.map((c: any) => ({
                path: c.path || 'src/',
                name: c.name || 'file.ts',
                content: c.content || '',
                language: c.language || 'typescript'
            })) : [],
            verified: fix.verified !== false
        }));
    }

    private fallbackParse(response: string): DebugOutput {
        const hasBugs = response.toLowerCase().includes('bug') ||
            response.toLowerCase().includes('error') ||
            response.toLowerCase().includes('issue');

        return {
            testsRun: 0,
            testsPassed: 0,
            testsFailed: 0,
            bugs: hasBugs ? [{
                severity: 'minor',
                description: 'Could not fully parse debug results',
                location: 'Unknown',
                reproduction: 'See full response',
                rootCause: 'Parsing failure'
            }] : [],
            fixes: [],
            coverage: 0
        };
    }

    protected async validateOutput(output: DebugOutput, step: ExecutionStep) {
        const issues: any[] = [];
        const warnings: any[] = [];

        const criticalBugs = output.bugs.filter(b => b.severity === 'critical');

        if (criticalBugs.length > 0 && output.fixes.length === 0) {
            issues.push({
                severity: 'critical',
                description: `Found ${criticalBugs.length} critical bugs but no fixes provided`
            });
        }

        if (output.testsRun > 0 && output.testsFailed > output.testsRun / 2) {
            warnings.push({
                severity: 'major',
                description: 'More than 50% of tests are failing'
            });
        }

        if (output.coverage > 0 && output.coverage < 70) {
            warnings.push({
                severity: 'minor',
                description: 'Test coverage is below 70%'
            });
        }

        return {
            valid: issues.length === 0,
            critical: issues.some(i => i.severity === 'critical'),
            issues,
            warnings
        };
    }

    protected calculateConfidence(output: DebugOutput): number {
        let score = 0.5;

        if (output.testsRun > 0) score += 0.1;
        if (output.testsPassed > 0) score += 0.1;
        if (output.bugs.length > 0) score += 0.1;
        if (output.fixes.length > 0) score += 0.1;
        if (output.coverage > 0) score += 0.1;

        return Math.min(score, 1.0);
    }
}
