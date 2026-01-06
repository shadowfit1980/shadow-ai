/**
 * ComplianceAgent - Regulatory Compliance & Data Governance Specialist
 * 
 * Ensures code adheres to regulatory requirements (GDPR, HIPAA, SOC2, etc.)
 * Performs PII detection, data handling audits, and generates compliance reports
 */

import { SpecialistAgent, AgentTask, AgentResult, AgentCapability } from './base/SpecialistAgent';

export interface ComplianceViolation {
    id: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    regulation: 'GDPR' | 'HIPAA' | 'SOC2' | 'PCI-DSS' | 'CCPA' | 'Other';
    violation: string;
    description: string;
    location: string;
    requirement: string; // Which specific requirement is violated
    remediation: string;
    confidence: number;
}

export interface DataInventory {
    piiFields: Array<{
        field: string;
        type: 'email' | 'phone' | 'ssn' | 'address' | 'health' | 'financial' | 'other';
        location: string;
        encrypted: boolean;
        retention: string;
    }>;
    dataFlows: Array<{
        from: string;
        to: string;
        dataTypes: string[];
        encrypted: boolean;
    }>;
}

export class ComplianceAgent extends SpecialistAgent {
    readonly agentType = 'ComplianceAgent';
    readonly capabilities: AgentCapability[] = [
        {
            name: 'gdpr_compliance',
            description: 'Check GDPR compliance (EU data protection)',
            confidenceLevel: 0.87
        },
        {
            name: 'hipaa_compliance',
            description: 'Check HIPAA compliance (US healthcare)',
            confidenceLevel: 0.84
        },
        {
            name: 'pii_detection',
            description: 'Detect and classify personally identifiable information',
            confidenceLevel: 0.92
        },
        {
            name: 'audit_reporting',
            description: 'Generate compliance audit reports',
            confidenceLevel: 0.89
        }
    ];

    async execute(task: AgentTask): Promise<AgentResult> {
        console.log(`📋 ComplianceAgent executing: ${task.task}`);

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
            const violations = await this.checkCompliance(task);
            const dataInventory = await this.inventoryData(task.spec);

            const critical = violations.filter(v => v.severity === 'critical').length;
            const high = violations.filter(v => v.severity === 'high').length;

            const result: AgentResult = {
                success: true,
                summary: `Compliance check: ${violations.length} violations found (${critical} critical, ${high} high)`,
                artifacts: [{ violations, dataInventory }],
                confidence: 0.86,
                explanation: this.generateComplianceReport(violations, dataInventory),
                estimatedEffort: critical * 6 + high * 3
            };

            this.recordExecution(task.task, true, result.confidence);
            return result;

        } catch (error) {
            this.recordExecution(task.task, false, 0);
            return {
                success: false,
                summary: 'Compliance check failed',
                confidence: 0,
                explanation: (error as Error).message
            };
        }
    }

    private async checkCompliance(task: AgentTask): Promise<ComplianceViolation[]> {
        const regulations = task.context?.regulations || ['GDPR', 'SOC2'];
        const allViolations: ComplianceViolation[] = [];

        for (const regulation of regulations) {
            const violations = await this.checkRegulation(task.spec, regulation);
            allViolations.push(...violations);
        }

        return allViolations;
    }

    private async checkRegulation(code: string, regulation: string): Promise<ComplianceViolation[]> {
        const prompt = `Check ${regulation} compliance for this code:

Code: ${code}

${this.getRegulationRequirements(regulation)}

Detect violations:
1. Missing consent mechanisms
2. Inadequate data encryption
3. Missing audit logs
4. Improper data retention
5. Missing privacy notices
6. Insecure data transmission
7. Missing access controls
8. Non-compliant data processing

For each violation:
- Severity
- Specific requirement violated
- Description
- Location
- Remediation steps

JSON response:
\`\`\`json
{
  "violations": [
    {
      "id": "comp-1",
      "severity": "critical",
      "regulation": "${regulation}",
      "violation": "Missing user consent for data collection",
      "description": "Personal data collected without explicit consent",
      "location": "user-service.ts:line 42",
      "requirement": "Article 6 GDPR - Lawfulness of processing",
      "remediation": "Implement consent management system",
      "confidence": 0.9
    }
  ]
}
\`\`\``;

        const response = await this.callModel(
            prompt,
            `You are a compliance expert specializing in ${regulation} regulatory requirements.`
        );

        const parsed = this.parseJSON(response);
        return (parsed.violations || []).map((v: any, i: number) => ({
            id: v.id || `comp-${i + 1}`,
            severity: v.severity || 'medium',
            regulation: regulation as any,
            violation: v.violation || 'Compliance issue',
            description: v.description || '',
            location: v.location || 'unknown',
            requirement: v.requirement || '',
            remediation: v.remediation || '',
            confidence: v.confidence || 0.7
        }));
    }

    private async inventoryData(code: string): Promise<DataInventory> {
        const prompt = `Create data inventory for this code:

Code: ${code}

Identify:
1. All PII fields (email, phone, SSN, address, health data, etc.)
2. Data flows (where data moves)
3. Encryption status
4. Retention policies

JSON response:
\`\`\`json
{
  "piiFields": [
    {
      "field": "user.email",
      "type": "email",
      "location": "User model",
      "encrypted": true,
      "retention": "7 years"
    }
  ],
  "dataFlows": [
    {
      "from": "API",
      "to": "Database",
      "dataTypes": ["email", "phone"],
      "encrypted": true
    }
  ]
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseJSON(response);

        return {
            piiFields: parsed.piiFields || [],
            dataFlows: parsed.dataFlows || []
        };
    }

    async generateAuditReport(
        violations: ComplianceViolation[],
        dataInventory: DataInventory
    ): Promise<string> {
        console.log('📄 Generating compliance audit report...');

        let report = `# Compliance Audit Report\n\n`;
        report += `Generated: ${new Date().toISOString()}\n\n`;

        // Summary
        report += `## Executive Summary\n\n`;
        report += `- Total Violations: ${violations.length}\n`;
        report += `- Critical: ${violations.filter(v => v.severity === 'critical').length}\n`;
        report += `- High: ${violations.filter(v => v.severity === 'high').length}\n`;
        report += `- PII Fields Identified: ${dataInventory.piiFields.length}\n`;
        report += `- Data Flows: ${dataInventory.dataFlows.length}\n\n`;

        // Violations by regulation
        const byRegulation = violations.reduce((acc, v) => {
            acc[v.regulation] = (acc[v.regulation] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        report += `## Violations by Regulation\n\n`;
        Object.entries(byRegulation).forEach(([reg, count]) => {
            report += `- ${reg}: ${count}\n`;
        });
        report += `\n`;

        // Detailed violations
        report += `## Detailed Findings\n\n`;
        violations.forEach((v, i) => {
            report += `### ${i + 1}. ${v.violation}\n\n`;
            report += `- **Severity**: ${v.severity.toUpperCase()}\n`;
            report += `- **Regulation**: ${v.regulation}\n`;
            report += `- **Requirement**: ${v.requirement}\n`;
            report += `- **Location**: ${v.location}\n`;
            report += `- **Description**: ${v.description}\n`;
            report += `- **Remediation**: ${v.remediation}\n\n`;
        });

        // Data inventory
        report += `## Data Inventory\n\n`;
        report += `### PII Fields\n\n`;
        dataInventory.piiFields.forEach(field => {
            report += `- **${field.field}** (${field.type})\n`;
            report += `  - Location: ${field.location}\n`;
            report += `  - Encrypted: ${field.encrypted ? 'Yes' : 'No'}\n`;
            report += `  - Retention: ${field.retention}\n\n`;
        });

        return report;
    }

    async suggestDataMinimization(dataInventory: DataInventory): Promise<string[]> {
        const suggestions: string[] = [];

        // Check for unnecessary PII
        if (dataInventory.piiFields.length > 10) {
            suggestions.push('Consider if all collected PII is strictly necessary');
        }

        // Check encryption
        const unencrypted = dataInventory.piiFields.filter(f => !f.encrypted);
        if (unencrypted.length > 0) {
            suggestions.push(`Encrypt ${unencrypted.length} unencrypted PII field(s)`);
        }

        // Check data flows
        const unencryptedFlows = dataInventory.dataFlows.filter(f => !f.encrypted);
        if (unencryptedFlows.length > 0) {
            suggestions.push(`Use TLS/encryption for ${unencryptedFlows.length} data flow(s)`);
        }

        return suggestions;
    }

    private getRegulationRequirements(regulation: string): string {
        const requirements: Record<string, string> = {
            'GDPR': `GDPR Requirements:
- Lawful basis for processing (consent, contract, etc.)
- Data subject rights (access, erasure, portability)
- Privacy by design and by default
- Data breach notification (72 hours)
- Data Protection Impact Assessments
- Records of processing activities`,

            'HIPAA': `HIPAA Requirements:
- Protected Health Information (PHI) encryption
- Access controls and audit logging
- Business Associate Agreements
- Breach notification
- Minimum necessary principle
- Patient rights to access/amend records`,

            'SOC2': `SOC2 Trust Principles:
- Security: Protection against unauthorized access
- Availability: System available for operation
- Processing Integrity: Complete, valid, accurate processing
- Confidentiality: Protection of confidential information
- Privacy: Collection, use, retention, disclosure of personal info`,

            'PCI-DSS': `PCI-DSS Requirements:
- Secure network and systems
- Protect cardholder data
- Vulnerability management program
- Access control measures
- Monitor and test networks
- Information security policy`
        };

        return requirements[regulation] || 'General compliance requirements';
    }

    private generateComplianceReport(
        violations: ComplianceViolation[],
        dataInventory: DataInventory
    ): string {
        if (violations.length === 0) {
            return `✅ Compliance check passed! No violations detected.\n\nData Inventory: ${dataInventory.piiFields.length} PII fields identified and properly handled.`;
        }

        const critical = violations.filter(v => v.severity === 'critical').length;
        const high = violations.filter(v => v.severity === 'high').length;

        let report = `Compliance Analysis:\n\n`;
        report += `Found ${violations.length} compliance violations:\n`;
        report += `- Critical: ${critical}\n`;
        report += `- High: ${high}\n\n`;

        if (critical > 0) {
            report += `🚨 URGENT: ${critical} critical compliance violation(s) must be addressed immediately!\n\n`;
        }

        // Top violations
        const topViolations = violations
            .sort((a, b) => {
                const severityOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
                return severityOrder[b.severity] - severityOrder[a.severity];
            })
            .slice(0, 3);

        report += `Top Compliance Issues:\n`;
        topViolations.forEach((v, i) => {
            report += `${i + 1}. [${v.severity.toUpperCase()}] ${v.violation}\n`;
            report += `   Regulation: ${v.regulation}\n`;
            report += `   Requirement: ${v.requirement}\n`;
            report += `   Fix: ${v.remediation}\n\n`;
        });

        // Data inventory summary
        report += `Data Inventory:\n`;
        report += `- ${dataInventory.piiFields.length} PII fields identified\n`;
        report += `- ${dataInventory.dataFlows.length} data flows tracked\n`;

        const unencrypted = dataInventory.piiFields.filter(f => !f.encrypted).length;
        if (unencrypted > 0) {
            report += `- ⚠️ ${unencrypted} PII field(s) not encrypted\n`;
        }

        return report;
    }
}
