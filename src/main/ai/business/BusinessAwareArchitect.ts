/**
 * 🏢 Business-Aware Architect
 * 
 * Goes beyond code to understand BUSINESS context:
 * - Business Requirements Document (BRD) generation
 * - Non-Functional Requirements (NFR) auto-generation
 * - KPI mapping to features
 * - Feasibility validation
 * - Compliance checking
 * - Cost estimation
 * 
 * This transforms Shadow AI from a code tool to an engineering PARTNER.
 */

import { projectKnowledgeGraph } from '../knowledge/ProjectKnowledgeGraph';
import { intentAlignmentEngine, UserIntent } from '../intent/IntentAlignmentEngine';

// Business Domain Types
export type BusinessDomain =
    | 'fintech'
    | 'healthcare'
    | 'ecommerce'
    | 'saas'
    | 'social'
    | 'gaming'
    | 'education'
    | 'enterprise'
    | 'iot'
    | 'media'
    | 'logistics'
    | 'other';

export interface BusinessRequirementsDocument {
    id: string;
    projectId: string;
    createdAt: Date;
    version: number;

    // Business Context
    executiveSummary: string;
    domain: BusinessDomain;
    problemStatement: string;
    targetAudience: {
        primaryUsers: string;
        secondaryUsers?: string;
        estimatedSize: string;
        demographics?: string[];
    };

    // Goals & KPIs
    businessGoals: BusinessGoal[];
    successMetrics: KPI[];

    // Constraints
    constraints: {
        budget?: { amount: number; currency: string };
        timeline?: { deadline: Date; milestones: { name: string; date: Date }[] };
        regulatory?: ComplianceRequirement[];
        technical?: string[];
    };

    // Stakeholders
    stakeholders: Stakeholder[];

    // Feature Map
    features: FeatureRequirement[];

    // Risk Assessment
    risks: Risk[];
}

export interface BusinessGoal {
    id: string;
    goal: string;
    type: 'revenue' | 'growth' | 'efficiency' | 'brand' | 'compliance' | 'innovation';
    priority: 'critical' | 'high' | 'medium' | 'low';
    linkedKpis: string[];
    linkedFeatures: string[];
}

export interface KPI {
    id: string;
    name: string;
    description: string;
    currentValue?: number;
    targetValue: number;
    unit: string;
    measurementFrequency: 'real-time' | 'daily' | 'weekly' | 'monthly' | 'quarterly';
    owner?: string;
}

export interface ComplianceRequirement {
    standard: string; // GDPR, HIPAA, PCI-DSS, SOC2, etc.
    scope: string;
    requirements: string[];
    deadline?: Date;
    certificationNeeded: boolean;
}

export interface Stakeholder {
    name: string;
    role: string;
    interest: 'high' | 'medium' | 'low';
    influence: 'high' | 'medium' | 'low';
    expectations: string[];
}

export interface FeatureRequirement {
    id: string;
    name: string;
    description: string;
    userStory: string;
    priority: 'must-have' | 'should-have' | 'could-have' | 'wont-have';
    linkedGoals: string[];
    linkedKpis: string[];
    acceptanceCriteria: string[];

    // Technical estimates
    effort: { optimistic: number; realistic: number; pessimistic: number; unit: 'hours' | 'days' | 'weeks' };
    complexity: 'trivial' | 'simple' | 'moderate' | 'complex' | 'very-complex';
    dependencies: string[];

    // NFRs
    nfrs: {
        performance?: { latency: string; throughput: string };
        security?: { level: string; encryption: boolean; auth: boolean };
        availability?: string;
        scalability?: string;
    };
}

export interface Risk {
    id: string;
    description: string;
    category: 'technical' | 'business' | 'schedule' | 'resource' | 'external';
    probability: 'high' | 'medium' | 'low';
    impact: 'critical' | 'high' | 'medium' | 'low';
    mitigation: string;
    owner?: string;
}

export interface FeasibilityReport {
    feasible: boolean;
    confidence: number;

    technical: {
        feasible: boolean;
        challenges: string[];
        recommendations: string[];
    };

    business: {
        viable: boolean;
        marketFit: 'strong' | 'moderate' | 'weak' | 'unknown';
        competitorAnalysis?: string;
    };

    resource: {
        estimatedCost: { min: number; max: number; currency: string };
        estimatedTimeline: { min: number; max: number; unit: string };
        teamSize: { min: number; recommended: number };
        skillsRequired: string[];
    };

    compliance: {
        compliant: boolean;
        requirements: ComplianceRequirement[];
        gaps: string[];
        recommendations: string[];
    };

    risks: Risk[];
    goNoGoRecommendation: 'go' | 'go-with-conditions' | 'no-go' | 'needs-more-info';
}

class BusinessAwareArchitect {
    private static instance: BusinessAwareArchitect;
    private brds: Map<string, BusinessRequirementsDocument> = new Map();

    private constructor() { }

    public static getInstance(): BusinessAwareArchitect {
        if (!BusinessAwareArchitect.instance) {
            BusinessAwareArchitect.instance = new BusinessAwareArchitect();
        }
        return BusinessAwareArchitect.instance;
    }

    // ==================== BRD GENERATION ====================

    /**
     * Generate a comprehensive BRD from user intent
     */
    public async generateBRD(intent: UserIntent, projectId: string): Promise<BusinessRequirementsDocument> {
        const domain = this.detectDomain(intent.rawInput);

        const brd: BusinessRequirementsDocument = {
            id: `brd-${Date.now()}`,
            projectId,
            createdAt: new Date(),
            version: 1,

            executiveSummary: this.generateExecutiveSummary(intent),
            domain,
            problemStatement: this.extractProblemStatement(intent),
            targetAudience: this.analyzeTargetAudience(intent),

            businessGoals: this.generateBusinessGoals(intent, domain),
            successMetrics: this.generateKPIs(intent, domain),

            constraints: {
                regulatory: this.detectComplianceRequirements(domain, intent),
                technical: intent.constraints
            },

            stakeholders: this.identifyStakeholders(intent),
            features: this.extractFeatures(intent, domain),
            risks: this.assessRisks(intent, domain)
        };

        // Link goals to features and KPIs
        this.linkBusinessComponents(brd);

        // Store in knowledge graph
        projectKnowledgeGraph.addRequirement(
            projectId,
            brd.executiveSummary,
            'business',
            'critical',
            brd.successMetrics.map(k => ({ name: k.name, target: `${k.targetValue} ${k.unit}` }))
        );

        this.brds.set(brd.id, brd);
        return brd;
    }

    private detectDomain(input: string): BusinessDomain {
        const domainKeywords: Record<BusinessDomain, string[]> = {
            'fintech': ['payment', 'banking', 'finance', 'money', 'transaction', 'wallet', 'crypto'],
            'healthcare': ['health', 'medical', 'patient', 'doctor', 'hospital', 'clinic', 'diagnosis'],
            'ecommerce': ['shop', 'store', 'product', 'cart', 'checkout', 'order', 'inventory'],
            'saas': ['subscription', 'platform', 'dashboard', 'analytics', 'workflow', 'enterprise'],
            'social': ['social', 'friend', 'post', 'share', 'community', 'message', 'feed'],
            'gaming': ['game', 'player', 'score', 'level', 'multiplayer', 'leaderboard'],
            'education': ['learn', 'course', 'student', 'teacher', 'quiz', 'lesson', 'training'],
            'enterprise': ['business', 'corporate', 'enterprise', 'erp', 'crm', 'workflow'],
            'iot': ['device', 'sensor', 'iot', 'smart', 'connected', 'telemetry'],
            'media': ['video', 'audio', 'media', 'stream', 'content', 'publish'],
            'logistics': ['shipping', 'delivery', 'tracking', 'fleet', 'warehouse', 'supply'],
            'other': []
        };

        const inputLower = input.toLowerCase();
        let bestMatch: BusinessDomain = 'other';
        let maxScore = 0;

        for (const [domain, keywords] of Object.entries(domainKeywords)) {
            const score = keywords.filter(k => inputLower.includes(k)).length;
            if (score > maxScore) {
                maxScore = score;
                bestMatch = domain as BusinessDomain;
            }
        }

        return bestMatch;
    }

    private generateExecutiveSummary(intent: UserIntent): string {
        return `This project aims to ${intent.action} ${intent.target}. ` +
            (intent.context ? `The primary purpose is to ${intent.context}. ` : '') +
            `Based on the requirements, this will involve ${intent.category} activities ` +
            `with a focus on delivering value to the target users.`;
    }

    private extractProblemStatement(intent: UserIntent): string {
        if (intent.context) {
            return intent.context;
        }
        return `Users need a solution to ${intent.action} ${intent.target} efficiently.`;
    }

    private analyzeTargetAudience(intent: UserIntent): BusinessRequirementsDocument['targetAudience'] {
        const inputLower = intent.rawInput.toLowerCase();

        let primaryUsers = 'General users';
        let estimatedSize = '1K-10K';

        if (inputLower.includes('enterprise') || inputLower.includes('business')) {
            primaryUsers = 'Enterprise businesses';
            estimatedSize = '100-1K';
        } else if (inputLower.includes('developer')) {
            primaryUsers = 'Software developers';
            estimatedSize = '10K-100K';
        } else if (inputLower.includes('consumer')) {
            primaryUsers = 'General consumers';
            estimatedSize = '100K-1M';
        }

        return {
            primaryUsers,
            estimatedSize
        };
    }

    // ==================== GOAL & KPI GENERATION ====================

    private generateBusinessGoals(intent: UserIntent, domain: BusinessDomain): BusinessGoal[] {
        const goals: BusinessGoal[] = [];

        // Default goal based on intent
        goals.push({
            id: 'goal-primary',
            goal: `Successfully ${intent.action} ${intent.target}`,
            type: 'innovation',
            priority: 'critical',
            linkedKpis: ['kpi-adoption'],
            linkedFeatures: []
        });

        // Domain-specific goals
        const domainGoals: Record<BusinessDomain, Partial<BusinessGoal>[]> = {
            'fintech': [
                { goal: 'Ensure regulatory compliance', type: 'compliance', priority: 'critical' },
                { goal: 'Achieve transaction security', type: 'compliance', priority: 'critical' }
            ],
            'healthcare': [
                { goal: 'Maintain HIPAA compliance', type: 'compliance', priority: 'critical' },
                { goal: 'Improve patient outcomes', type: 'efficiency', priority: 'high' }
            ],
            'ecommerce': [
                { goal: 'Increase conversion rate', type: 'revenue', priority: 'critical' },
                { goal: 'Reduce cart abandonment', type: 'revenue', priority: 'high' }
            ],
            'saas': [
                { goal: 'Maximize monthly recurring revenue', type: 'revenue', priority: 'critical' },
                { goal: 'Reduce customer churn', type: 'growth', priority: 'high' }
            ],
            'social': [
                { goal: 'Increase daily active users', type: 'growth', priority: 'critical' },
                { goal: 'Improve engagement metrics', type: 'growth', priority: 'high' }
            ],
            'gaming': [
                { goal: 'Maximize player retention', type: 'growth', priority: 'critical' },
                { goal: 'Increase in-game purchases', type: 'revenue', priority: 'high' }
            ],
            'education': [
                { goal: 'Improve learning outcomes', type: 'efficiency', priority: 'critical' },
                { goal: 'Increase course completion rate', type: 'growth', priority: 'high' }
            ],
            'enterprise': [
                { goal: 'Improve operational efficiency', type: 'efficiency', priority: 'critical' },
                { goal: 'Reduce manual processes', type: 'efficiency', priority: 'high' }
            ],
            'iot': [
                { goal: 'Maximize device uptime', type: 'efficiency', priority: 'critical' },
                { goal: 'Reduce data collection latency', type: 'efficiency', priority: 'high' }
            ],
            'media': [
                { goal: 'Increase content consumption', type: 'growth', priority: 'critical' },
                { goal: 'Improve content discovery', type: 'growth', priority: 'high' }
            ],
            'logistics': [
                { goal: 'Optimize delivery times', type: 'efficiency', priority: 'critical' },
                { goal: 'Reduce operational costs', type: 'efficiency', priority: 'high' }
            ],
            'other': []
        };

        const specificGoals = domainGoals[domain] || [];
        specificGoals.forEach((g, i) => {
            goals.push({
                id: `goal-${domain}-${i}`,
                goal: g.goal || '',
                type: g.type || 'efficiency',
                priority: g.priority || 'medium',
                linkedKpis: [],
                linkedFeatures: []
            });
        });

        return goals;
    }

    private generateKPIs(intent: UserIntent, domain: BusinessDomain): KPI[] {
        const kpis: KPI[] = [];

        // Universal KPIs
        kpis.push({
            id: 'kpi-adoption',
            name: 'User Adoption Rate',
            description: 'Percentage of target users actively using the system',
            targetValue: 80,
            unit: '%',
            measurementFrequency: 'weekly'
        });

        kpis.push({
            id: 'kpi-satisfaction',
            name: 'User Satisfaction Score',
            description: 'Net Promoter Score (NPS) from user surveys',
            targetValue: 50,
            unit: 'NPS',
            measurementFrequency: 'monthly'
        });

        // Domain-specific KPIs
        const domainKpis: Record<BusinessDomain, Partial<KPI>[]> = {
            'fintech': [
                { name: 'Transaction Success Rate', targetValue: 99.9, unit: '%' },
                { name: 'Average Transaction Time', targetValue: 2, unit: 'seconds' }
            ],
            'healthcare': [
                { name: 'Patient Data Accuracy', targetValue: 99.99, unit: '%' },
                { name: 'System Availability', targetValue: 99.99, unit: '%' }
            ],
            'ecommerce': [
                { name: 'Conversion Rate', targetValue: 3, unit: '%' },
                { name: 'Cart Abandonment Rate', targetValue: 30, unit: '%' },
                { name: 'Average Order Value', targetValue: 100, unit: 'USD' }
            ],
            'saas': [
                { name: 'Monthly Recurring Revenue', targetValue: 100000, unit: 'USD' },
                { name: 'Customer Churn Rate', targetValue: 5, unit: '%' },
                { name: 'Customer Lifetime Value', targetValue: 5000, unit: 'USD' }
            ],
            'social': [
                { name: 'Daily Active Users', targetValue: 100000, unit: 'users' },
                { name: 'Session Duration', targetValue: 15, unit: 'minutes' },
                { name: 'Posts per User', targetValue: 3, unit: 'posts/week' }
            ],
            'gaming': [
                { name: 'Day 7 Retention', targetValue: 40, unit: '%' },
                { name: 'Average Revenue Per User', targetValue: 5, unit: 'USD' },
                { name: 'Session Length', targetValue: 20, unit: 'minutes' }
            ],
            'education': [
                { name: 'Course Completion Rate', targetValue: 70, unit: '%' },
                { name: 'Assessment Pass Rate', targetValue: 85, unit: '%' }
            ],
            'enterprise': [
                { name: 'Process Automation Rate', targetValue: 80, unit: '%' },
                { name: 'Time Saved per User', targetValue: 10, unit: 'hours/week' }
            ],
            'iot': [
                { name: 'Device Uptime', targetValue: 99.9, unit: '%' },
                { name: 'Data Latency', targetValue: 100, unit: 'ms' }
            ],
            'media': [
                { name: 'Content Engagement Rate', targetValue: 30, unit: '%' },
                { name: 'Watch Time', targetValue: 30, unit: 'minutes/user' }
            ],
            'logistics': [
                { name: 'On-Time Delivery Rate', targetValue: 95, unit: '%' },
                { name: 'Cost per Delivery', targetValue: 10, unit: 'USD' }
            ],
            'other': []
        };

        const specificKpis = domainKpis[domain] || [];
        specificKpis.forEach((k, i) => {
            kpis.push({
                id: `kpi-${domain}-${i}`,
                name: k.name || '',
                description: k.description || `Track ${k.name}`,
                targetValue: k.targetValue || 0,
                unit: k.unit || '',
                measurementFrequency: k.measurementFrequency || 'weekly'
            });
        });

        return kpis;
    }

    // ==================== COMPLIANCE & FEASIBILITY ====================

    private detectComplianceRequirements(domain: BusinessDomain, intent: UserIntent): ComplianceRequirement[] {
        const requirements: ComplianceRequirement[] = [];
        const inputLower = intent.rawInput.toLowerCase();

        // Domain-based requirements
        if (domain === 'healthcare') {
            requirements.push({
                standard: 'HIPAA',
                scope: 'Protected Health Information handling',
                requirements: [
                    'Encrypt PHI at rest and in transit',
                    'Implement access controls and audit logging',
                    'Business Associate Agreements with vendors',
                    'Breach notification procedures'
                ],
                certificationNeeded: true
            });
        }

        if (domain === 'fintech') {
            requirements.push({
                standard: 'PCI-DSS',
                scope: 'Payment card data handling',
                requirements: [
                    'Use PCI-compliant payment processor',
                    'Never store CVV/CVC',
                    'Encrypt card data',
                    'Regular security assessments'
                ],
                certificationNeeded: true
            });
        }

        // GDPR for EU users
        if (inputLower.includes('europe') || inputLower.includes('eu') || inputLower.includes('gdpr')) {
            requirements.push({
                standard: 'GDPR',
                scope: 'EU user data protection',
                requirements: [
                    'Explicit consent for data collection',
                    'Right to deletion',
                    'Data portability',
                    'Privacy by design',
                    'Data Protection Impact Assessment'
                ],
                certificationNeeded: false
            });
        }

        // SOC2 for B2B SaaS
        if (domain === 'saas' || domain === 'enterprise') {
            requirements.push({
                standard: 'SOC 2 Type II',
                scope: 'Service organization controls',
                requirements: [
                    'Security policies and procedures',
                    'Access control mechanisms',
                    'Change management',
                    'Incident response',
                    'Vendor management'
                ],
                certificationNeeded: true
            });
        }

        return requirements;
    }

    /**
     * Validate feasibility of the project
     */
    public async validateFeasibility(brd: BusinessRequirementsDocument): Promise<FeasibilityReport> {
        const report: FeasibilityReport = {
            feasible: true,
            confidence: 0.7,
            technical: { feasible: true, challenges: [], recommendations: [] },
            business: { viable: true, marketFit: 'moderate' },
            resource: { estimatedCost: { min: 0, max: 0, currency: 'USD' }, estimatedTimeline: { min: 0, max: 0, unit: 'weeks' }, teamSize: { min: 1, recommended: 2 }, skillsRequired: [] },
            compliance: { compliant: true, requirements: brd.constraints.regulatory || [], gaps: [], recommendations: [] },
            risks: brd.risks,
            goNoGoRecommendation: 'go'
        };

        // Technical feasibility
        const complexFeatures = brd.features.filter(f => f.complexity === 'very-complex' || f.complexity === 'complex');
        if (complexFeatures.length > brd.features.length * 0.5) {
            report.technical.challenges.push('High proportion of complex features');
            report.technical.recommendations.push('Consider phased delivery approach');
            report.confidence -= 0.1;
        }

        // Resource estimation
        const totalEffort = brd.features.reduce((sum, f) => {
            const effort = f.effort.realistic * (f.effort.unit === 'weeks' ? 40 : f.effort.unit === 'days' ? 8 : 1);
            return sum + effort;
        }, 0);

        report.resource.estimatedCost = {
            min: Math.floor(totalEffort * 75), // $75/hour min
            max: Math.ceil(totalEffort * 150), // $150/hour max
            currency: 'USD'
        };

        report.resource.estimatedTimeline = {
            min: Math.floor(totalEffort / 160), // 160 hours/month per developer
            max: Math.ceil(totalEffort / 80),
            unit: 'weeks'
        };

        // Skill requirements
        const skillsNeeded = new Set<string>();
        for (const feature of brd.features) {
            if (feature.nfrs?.security?.auth) skillsNeeded.add('Authentication/Authorization');
            if (feature.nfrs?.performance) skillsNeeded.add('Performance Optimization');
            if (feature.complexity === 'very-complex') skillsNeeded.add('Senior Engineering');
        }
        report.resource.skillsRequired = Array.from(skillsNeeded);

        // Compliance gaps
        for (const req of report.compliance.requirements) {
            if (req.certificationNeeded) {
                report.compliance.gaps.push(`${req.standard} certification required`);
                report.compliance.recommendations.push(`Engage ${req.standard} compliance consultant`);
            }
        }

        if (report.compliance.gaps.length > 0) {
            report.compliance.compliant = false;
            report.goNoGoRecommendation = 'go-with-conditions';
        }

        // Risk assessment
        const criticalRisks = brd.risks.filter(r => r.impact === 'critical');
        if (criticalRisks.length > 2) {
            report.goNoGoRecommendation = 'needs-more-info';
            report.confidence -= 0.2;
        }

        report.feasible = report.confidence > 0.5;

        return report;
    }

    // ==================== HELPER METHODS ====================

    private identifyStakeholders(intent: UserIntent): Stakeholder[] {
        const stakeholders: Stakeholder[] = [
            {
                name: 'Product Owner',
                role: 'Decision maker',
                interest: 'high',
                influence: 'high',
                expectations: ['On-time delivery', 'Feature completeness', 'Quality']
            },
            {
                name: 'End Users',
                role: 'Primary users',
                interest: 'high',
                influence: 'medium',
                expectations: ['Ease of use', 'Performance', 'Reliability']
            },
            {
                name: 'Development Team',
                role: 'Implementers',
                interest: 'high',
                influence: 'medium',
                expectations: ['Clear requirements', 'Reasonable timeline', 'Good documentation']
            }
        ];

        return stakeholders;
    }

    private extractFeatures(intent: UserIntent, domain: BusinessDomain): FeatureRequirement[] {
        const features: FeatureRequirement[] = [];
        const inputLower = intent.rawInput.toLowerCase();

        // Extract from intent
        features.push({
            id: 'feature-core',
            name: `Core ${intent.target}`,
            description: `Main functionality to ${intent.action} ${intent.target}`,
            userStory: `As a user, I want to ${intent.action} ${intent.target} so that ${intent.context || 'I can achieve my goals'}`,
            priority: 'must-have',
            linkedGoals: ['goal-primary'],
            linkedKpis: ['kpi-adoption'],
            acceptanceCriteria: [
                `User can successfully ${intent.action}`,
                'System responds within acceptable time',
                'Error handling is present'
            ],
            effort: { optimistic: 20, realistic: 40, pessimistic: 80, unit: 'hours' },
            complexity: 'moderate',
            dependencies: [],
            nfrs: (intent.nonFunctionalRequirements || {}) as any
        });

        // Add common features based on keywords
        if (inputLower.includes('auth') || inputLower.includes('login') || inputLower.includes('user')) {
            features.push({
                id: 'feature-auth',
                name: 'User Authentication',
                description: 'Secure user registration and login',
                userStory: 'As a user, I want to create an account and log in securely',
                priority: 'must-have',
                linkedGoals: [],
                linkedKpis: [],
                acceptanceCriteria: [
                    'Users can register with email',
                    'Password meets security requirements',
                    'Session management implemented'
                ],
                effort: { optimistic: 8, realistic: 16, pessimistic: 32, unit: 'hours' },
                complexity: 'moderate',
                dependencies: [],
                nfrs: { security: { level: 'high', encryption: true, auth: true } }
            });
        }

        return features;
    }

    private assessRisks(intent: UserIntent, domain: BusinessDomain): Risk[] {
        const risks: Risk[] = [];

        // Universal risks
        risks.push({
            id: 'risk-scope',
            description: 'Scope creep leading to delays',
            category: 'schedule',
            probability: 'high',
            impact: 'medium',
            mitigation: 'Strict change control process, clear MVP definition'
        });

        risks.push({
            id: 'risk-tech',
            description: 'Technical complexity underestimated',
            category: 'technical',
            probability: 'medium',
            impact: 'high',
            mitigation: 'Spike on complex features early, regular tech reviews'
        });

        // Domain-specific risks
        if (domain === 'healthcare' || domain === 'fintech') {
            risks.push({
                id: 'risk-compliance',
                description: 'Compliance requirements not fully met',
                category: 'external',
                probability: 'medium',
                impact: 'critical',
                mitigation: 'Engage compliance experts early, regular audits'
            });
        }

        return risks;
    }

    private linkBusinessComponents(brd: BusinessRequirementsDocument): void {
        // Link features to goals
        for (const goal of brd.businessGoals) {
            for (const feature of brd.features) {
                if (feature.priority === 'must-have') {
                    goal.linkedFeatures.push(feature.id);
                    feature.linkedGoals.push(goal.id);
                }
            }
        }

        // Link KPIs to goals
        for (const kpi of brd.successMetrics) {
            for (const goal of brd.businessGoals) {
                if (!goal.linkedKpis.includes(kpi.id)) {
                    goal.linkedKpis.push(kpi.id);
                }
            }
        }
    }

    // ==================== PUBLIC API ====================

    public getBRD(id: string): BusinessRequirementsDocument | undefined {
        return this.brds.get(id);
    }

    public getAllBRDs(projectId: string): BusinessRequirementsDocument[] {
        return Array.from(this.brds.values())
            .filter(b => b.projectId === projectId);
    }
}

export const businessAwareArchitect = BusinessAwareArchitect.getInstance();
export default businessAwareArchitect;
