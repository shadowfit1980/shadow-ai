/**
 * DevOpsAgent - Deployment & Infrastructure Specialist
 * 
 * Responsible for infrastructure, CI/CD, deployment, and operations
 */

import { BaseAgent } from '../BaseAgent';
import {
    AgentMetadata,
    ExecutionStep,
    AgentContext,
    ProjectContext,
    DevOpsOutput,
    InfrastructureConfig,
    CICDConfig,
    MonitoringConfig,
    DeploymentConfig
} from '../types';

export class DevOpsAgent extends BaseAgent {
    get metadata(): AgentMetadata {
        return {
            type: 'devops',
            name: 'Shadow DevOps',
            specialty: 'Infrastructure, Deployment & Operations',
            capabilities: [
                {
                    name: 'Infrastructure Design',
                    description: 'Design scalable infrastructure',
                    confidence: 0.89
                },
                {
                    name: 'CI/CD Pipeline',
                    description: 'Create automated deployment pipelines',
                    confidence: 0.92
                },
                {
                    name: 'Container Orchestration',
                    description: 'Docker and Kubernetes setup',
                    confidence: 0.87
                },
                {
                    name: 'Monitoring Setup',
                    description: 'Configure monitoring and alerting',
                    confidence: 0.85
                },
                {
                    name: 'Security Hardening',
                    description: 'Implement security best practices',
                    confidence: 0.88
                }
            ],
            preferredModel: 'gemini-pro',
            fallbackModel: 'gpt-4'
        };
    }

    protected async buildPrompt(
        step: ExecutionStep,
        context: AgentContext,
        memory: ProjectContext
    ): Promise<string> {
        const architecture = context.previousResults.find(r => r.agentType === 'architect')?.output;
        const code = context.previousResults.find(r => r.agentType === 'coder')?.output;

        return `You are ${this.metadata.name}, an expert DevOps engineer specializing in infrastructure and deployment.

## Task
${step.description}

## Requirements
${step.requirements.map((r, i) => `${i + 1}. ${r}`).join('\n')}

## System Architecture
${architecture ? JSON.stringify(architecture.techStack, null, 2) : 'No architecture provided'}

## Application Code
${code ? `${code.files?.length || 0} files, ${code.dependencies?.length || 0} dependencies` : 'No code info'}

## Your Mission
Design a complete DevOps solution covering:

### 1. Infrastructure
- Cloud platform selection (AWS/GCP/Azure)
- Compute resources (VMs, containers, serverless)
- Networking (VPC, load balancers, CDN)
- Storage (databases, object storage, cache)
- Security (IAM, secrets, encryption)

### 2. CI/CD Pipeline
- Source control integration
- Automated testing
- Build process
- Deployment automation
- Rollback procedures

### 3. Monitoring & Observability
- Application metrics
- Infrastructure metrics
- Log aggregation
- Distributed tracing
- Alerting rules

### 4. Deployment Strategy
- Environment setup (dev/staging/prod)
- Blue-green or canary deployment
- Health checks
- Auto-scaling rules
- Disaster recovery

## Output Format
Return your DevOps plan as a JSON object:

\`\`\`json
{
  "infrastructure": {
    "platform": "AWS|GCP|Azure",
    "resources": [
      {
        "type": "compute|storage|network",
        "name": "resource-name",
        "config": {}
      }
    ],
    "networking": {
      "vpc": "config",
      "loadBalancer": "config"
    },
    "security": {
      "iam": "roles and policies",
      "secrets": "secret management"
    }
  },
  "cicd": {
    "pipeline": [
      {
        "name": "Build",
        "steps": ["npm install", "npm run build"],
        "conditions": []
      }
    ],
    "triggers": ["push to main", "pull request"],
    "notifications": ["slack", "email"]
  },
  "monitoring": {
    "metrics": ["cpu", "memory", "requests"],
    "alerts": [
      {
        "name": "High CPU",
        "condition": "cpu > 80%",
        "severity": "critical",
        "action": "notify ops team"
      }
    ],
    "logging": {"provider": "CloudWatch", "retention": "30 days"}
  },
  "deployment": {
    "environment": "production",
    "strategy": "blue-green|rolling|canary",
    "rollback": true,
    "healthChecks": ["/health", "/ready"]
  }
}
\`\`\`

Be practical, scalable, and cost-effective. Your setup ensures reliable operations.`;
    }

    protected async parseResponse(response: string, step: ExecutionStep): Promise<DevOpsOutput> {
        const codeBlocks = this.extractCodeBlocks(response);

        let devopsJSON: any = null;

        for (const block of codeBlocks) {
            if (block.language === 'json' || block.language === 'javascript') {
                try {
                    devopsJSON = JSON.parse(block.code);
                    break;
                } catch {
                    continue;
                }
            }
        }

        if (!devopsJSON) {
            devopsJSON = this.extractJSON(response);
        }

        if (!devopsJSON) {
            console.warn('⚠️  Could not parse JSON DevOps output, using fallback');
            return this.fallbackParse(response);
        }

        return {
            infrastructure: this.parseInfrastructure(devopsJSON.infrastructure || {}),
            cicd: this.parseCICD(devopsJSON.cicd || {}),
            monitoring: this.parseMonitoring(devopsJSON.monitoring || {}),
            deployment: this.parseDeployment(devopsJSON.deployment || {})
        };
    }

    private parseInfrastructure(infraData: any): InfrastructureConfig {
        return {
            platform: infraData.platform || 'AWS',
            resources: Array.isArray(infraData.resources) ? infraData.resources : [],
            networking: infraData.networking || {},
            security: infraData.security || {}
        };
    }

    private parseCICD(cicdData: any): CICDConfig {
        return {
            pipeline: Array.isArray(cicdData.pipeline) ? cicdData.pipeline.map((stage: any) => ({
                name: stage.name || 'Unnamed Stage',
                steps: Array.isArray(stage.steps) ? stage.steps : [],
                conditions: stage.conditions
            })) : [],
            triggers: Array.isArray(cicdData.triggers) ? cicdData.triggers : [],
            notifications: Array.isArray(cicdData.notifications) ? cicdData.notifications : []
        };
    }

    private parseMonitoring(monitoringData: any): MonitoringConfig {
        return {
            metrics: Array.isArray(monitoringData.metrics) ? monitoringData.metrics : [],
            alerts: Array.isArray(monitoringData.alerts) ? monitoringData.alerts.map((alert: any) => ({
                name: alert.name || 'Unnamed Alert',
                condition: alert.condition || 'true',
                severity: alert.severity || 'info',
                action: alert.action || 'notify'
            })) : [],
            logging: monitoringData.logging || {}
        };
    }

    private parseDeployment(deploymentData: any): DeploymentConfig {
        return {
            environment: deploymentData.environment || 'production',
            strategy: deploymentData.strategy || 'rolling',
            rollback: deploymentData.rollback !== false,
            healthChecks: Array.isArray(deploymentData.healthChecks) ? deploymentData.healthChecks : ['/health']
        };
    }

    private fallbackParse(response: string): DevOpsOutput {
        return {
            infrastructure: {
                platform: 'AWS',
                resources: [],
                networking: {},
                security: {}
            },
            cicd: {
                pipeline: [{
                    name: 'Build and Deploy',
                    steps: ['build', 'test', 'deploy'],
                    conditions: []
                }],
                triggers: ['push to main'],
                notifications: []
            },
            monitoring: {
                metrics: ['cpu', 'memory'],
                alerts: [],
                logging: {}
            },
            deployment: {
                environment: 'production',
                strategy: 'rolling',
                rollback: true,
                healthChecks: ['/health']
            }
        };
    }

    protected async validateOutput(output: DevOpsOutput, step: ExecutionStep) {
        const issues: any[] = [];
        const warnings: any[] = [];

        if (!output.cicd.pipeline || output.cicd.pipeline.length === 0) {
            warnings.push({
                severity: 'major',
                description: 'No CI/CD pipeline defined'
            });
        }

        if (!output.monitoring.alerts || output.monitoring.alerts.length === 0) {
            warnings.push({
                severity: 'minor',
                description: 'No monitoring alerts configured'
            });
        }

        if (!output.deployment.healthChecks || output.deployment.healthChecks.length === 0) {
            warnings.push({
                severity: 'minor',
                description: 'No health checks defined'
            });
        }

        return {
            valid: issues.length === 0,
            critical: false,
            issues,
            warnings
        };
    }

    protected calculateConfidence(output: DevOpsOutput): number {
        let score = 0.5;

        if (output.infrastructure.platform) score += 0.1;
        if (output.cicd.pipeline.length > 0) score += 0.15;
        if (output.monitoring.alerts.length > 0) score += 0.1;
        if (output.deployment.healthChecks.length > 0) score += 0.1;
        if (output.infrastructure.resources.length > 0) score += 0.05;

        return Math.min(score, 1.0);
    }
}
