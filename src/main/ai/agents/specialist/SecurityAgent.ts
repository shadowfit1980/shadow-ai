/**
 * SecurityAgent - Security Analysis & Threat Detection Specialist
 * 
 * Performs threat modeling, SAST, secrets detection, and supply chain analysis
 * Ensures code is secure and compliant with security best practices
 */

import { SpecialistAgent, AgentTask, AgentResult, AgentCapability } from './base/SpecialistAgent';

export interface SecurityFinding {
    id: string;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    category: 'injection' | 'auth' | 'crypto' | 'secrets' | 'xss' | 'csrf' | 'dos' | 'other';
    title: string;
    description: string;
    location: string;
    cwe?: string; // Common Weakness Enumeration ID
    remediation: string;
    confidence: number;
}

export interface ThreatModel {
    assets: string[];
    threats: Array<{
        threat: string;
        asset: string;
        impact: string;
        likelihood: string;
        mitigation: string;
    }>;
    attackSurface: string[];
    recommendations: string[];
}

export class SecurityAgent extends SpecialistAgent {
    readonly agentType = 'SecurityAgent';
    readonly capabilities: AgentCapability[] = [
        {
            name: 'static_security_analysis',
            description: 'Static Application Security Testing (SAST)',
            confidenceLevel: 0.89
        },
        {
            name: 'threat_modeling',
            description: 'Identify threats and attack vectors',
            confidenceLevel: 0.84
        },
        {
            name: 'secrets_detection',
            description: 'Find exposed credentials and keys',
            confidenceLevel: 0.95
        },
        {
            name: 'supply_chain_analysis',
            description: 'Analyze dependency vulnerabilities',
            confidenceLevel: 0.82
        }
    ];

    async execute(task: AgentTask): Promise<AgentResult> {
        console.log(`🔒 SecurityAgent executing: ${task.task}`);

        const validation = await this.validateTask(task);
        if (!validation.valid) {
            return {
                success: false,
                summary: 'Validation failed',
                confidence: 0,
                explanation: validation.errors.join(', ')
            };
        }

        try {
            const findings = await this.performSecurityScan(task);
            const secrets = await this.detectSecrets(task.spec);
            const threatModel = await this.generateThreatModel(task);

            const allFindings = [...findings, ...secrets];
            const critical = allFindings.filter(f => f.severity === 'critical').length;
            const high = allFindings.filter(f => f.severity === 'high').length;

            const result: AgentResult = {
                success: true,
                summary: `Security scan complete: ${allFindings.length} findings (${critical} critical, ${high} high)`,
                artifacts: [{ findings: allFindings, threatModel }],
                confidence: 0.87,
                explanation: this.generateSecurityReport(allFindings, threatModel),
                estimatedEffort: critical * 4 + high * 2 // Hours to fix
            };

            this.recordExecution(task.task, true, result.confidence);
            return result;

        } catch (error) {
            this.recordExecution(task.task, false, 0);
            return {
                success: false,
                summary: 'Security scan failed',
                confidence: 0,
                explanation: (error as Error).message
            };
        }
    }

    private async performSecurityScan(task: AgentTask): Promise<SecurityFinding[]> {
        const prompt = `Perform comprehensive security analysis:

Code: ${task.spec}

Detect:
1. SQL Injection vulnerabilities
2. XSS (Cross-Site Scripting) risks
3. CSRF vulnerabilities
4. Authentication/Authorization issues
5. Cryptographic weaknesses
6. Insecure deserialization
7. Path traversal
8. Command injection
9. Insecure configurations

For each finding:
- Severity (critical/high/medium/low/info)
- Category
- Description
- Location
- CWE ID if applicable
- Remediation steps

JSON response:
\`\`\`json
{
  "findings": [
    {
      "id": "sec-1",
      "severity": "critical",
      "category": "injection",
      "title": "SQL Injection in login endpoint",
      "description": "User input directly concatenated into SQL query",
      "location": "auth.ts:line 42",
      "cwe": "CWE-89",
      "remediation": "Use parameterized queries or prepared statements",
      "confidence": 0.95
    }
  ]
}
\`\`\``;

        const response = await this.callModel(
            prompt,
            'You are a senior security engineer specializing in application security and penetration testing.'
        );

        const parsed = this.parseJSON(response);
        return (parsed.findings || []).map((f: any, i: number) => ({
            id: f.id || `sec-${i + 1}`,
            severity: f.severity || 'medium',
            category: f.category || 'other',
            title: f.title || 'Security issue',
            description: f.description || '',
            location: f.location || 'unknown',
            cwe: f.cwe,
            remediation: f.remediation || '',
            confidence: f.confidence || 0.7
        }));
    }

    private async detectSecrets(code: string): Promise<SecurityFinding[]> {
        console.log('🔑 Scanning for exposed secrets...');

        // Pattern-based detection (simplified)
        const secretPatterns = [
            { pattern: /(?:api[_-]?key|apikey)\s*[=:]\s*['"]([^'"]+)['"]/gi, type: 'API Key' },
            { pattern: /(?:password|passwd|pwd)\s*[=:]\s*['"]([^'"]+)['"]/gi, type: 'Password' },
            { pattern: /(?:secret|token)\s*[=:]\s*['"]([^'"]+)['"]/gi, type: 'Secret Token' },
            { pattern: /(?:aws[_-]?access[_-]?key[_-]?id)\s*[=:]\s*['"]([^'"]+)['"]/gi, type: 'AWS Access Key' },
            { pattern: /(?:private[_-]?key)\s*[=:]\s*['"]([^'"]+)['"]/gi, type: 'Private Key' }
        ];

        const findings: SecurityFinding[] = [];
        let idCounter = 1;

        for (const { pattern, type } of secretPatterns) {
            let match;
            while ((match = pattern.exec(code)) !== null) {
                findings.push({
                    id: `secret-${idCounter++}`,
                    severity: 'critical',
                    category: 'secrets',
                    title: `Exposed ${type}`,
                    description: `${type} found in code - should be in environment variables`,
                    location: `character ${match.index}`,
                    remediation: `Move ${type} to environment variables, use secrets manager`,
                    confidence: 0.9
                });
            }
        }

        return findings;
    }

    private async generateThreatModel(task: AgentTask): Promise<ThreatModel> {
        const prompt = `Generate threat model for this system:

System: ${task.spec}
Context: ${JSON.stringify(task.context || {})}

Identify:
1. Assets (data, services, APIs)
2. Threats (STRIDE: Spoofing, Tampering, Repudiation, Info Disclosure, DoS, Elevation)
3. Attack surface
4. Mitigation recommendations

JSON response:
\`\`\`json
{
  "assets": ["User credentials", "Payment data", "API keys"],
  "threats": [
    {
      "threat": "Spoofing",
      "asset": "User credentials",
      "impact": "High",
      "likelihood": "Medium",
      "mitigation": "Implement MFA, strong password policy"
    }
  ],
  "attackSurface": ["Login API", "Payment endpoint", "Admin panel"],
  "recommendations": ["Add rate limiting", "Implement WAF"]
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseJSON(response);

        return {
            assets: parsed.assets || [],
            threats: parsed.threats || [],
            attackSurface: parsed.attackSurface || [],
            recommendations: parsed.recommendations || []
        };
    }

    async analyzeDependencies(dependencies: Record<string, string>): Promise<Array<{
        package: string;
        version: string;
        vulnerabilities: Array<{
            cve: string;
            severity: string;
            description: string;
        }>;
    }>> {
        console.log('📦 Analyzing supply chain vulnerabilities...');

        // Simplified - would integrate with actual vulnerability databases
        return [];
    }

    async generateSecureCodeSuggestion(insecureCode: string, finding: SecurityFinding): Promise<{
        secureCode: string;
        explanation: string;
    }> {
        const prompt = `Fix this security vulnerability:

Vulnerability: ${finding.title}
Description: ${finding.description}
Remediation: ${finding.remediation}

Insecure Code:
\`\`\`
${insecureCode}
\`\`\`

Provide secure version with explanation.`;

        const response = await this.callModel(prompt);
        const parsed = this.parseJSON(response);

        return {
            secureCode: parsed.secureCode || insecureCode,
            explanation: parsed.explanation || 'Security fix applied'
        };
    }

    private generateSecurityReport(findings: SecurityFinding[], threatModel: ThreatModel): string {
        if (findings.length === 0) {
            return 'Security scan passed! No vulnerabilities detected.';
        }

        const critical = findings.filter(f => f.severity === 'critical').length;
        const high = findings.filter(f => f.severity === 'high').length;
        const medium = findings.filter(f => f.severity === 'medium').length;

        let report = `Security Analysis Complete:\n\n`;
        report += `Findings: ${findings.length} total\n`;
        report += `- Critical: ${critical}\n`;
        report += `- High: ${high}\n`;
        report += `- Medium: ${medium}\n\n`;

        if (critical > 0 || high > 0) {
            report += `⚠️ URGENT: ${critical + high} critical/high severity issues require immediate attention!\n\n`;
        }

        // Top 3 findings
        const topFindings = findings
            .sort((a, b) => {
                const severityOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };
                return severityOrder[b.severity] - severityOrder[a.severity];
            })
            .slice(0, 3);

        report += `Top Issues:\n`;
        topFindings.forEach((f, i) => {
            report += `${i + 1}. [${f.severity.toUpperCase()}] ${f.title}\n`;
            report += `   ${f.description}\n`;
            report += `   Fix: ${f.remediation}\n\n`;
        });

        // Threat model summary
        if (threatModel.threats.length > 0) {
            report += `\nThreat Model: ${threatModel.threats.length} threats identified\n`;
            report += `Attack Surface: ${threatModel.attackSurface.join(', ')}\n`;
        }

        return report;
    }
}
