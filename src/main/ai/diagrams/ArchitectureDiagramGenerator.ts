/**
 * Architecture Diagram Generator
 * 
 * Generate architecture diagrams, flow charts,
 * and system documentation from code analysis.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export interface DiagramConfig {
    type: 'architecture' | 'sequence' | 'flowchart' | 'er' | 'class' | 'component';
    title: string;
    direction?: 'TB' | 'BT' | 'LR' | 'RL';
    theme?: 'default' | 'dark' | 'forest' | 'neutral';
}

export interface ArchNode {
    id: string;
    label: string;
    type: 'service' | 'database' | 'api' | 'client' | 'queue' | 'cache' | 'storage' | 'external';
    group?: string;
    icon?: string;
}

export interface ArchEdge {
    from: string;
    to: string;
    label?: string;
    style?: 'solid' | 'dashed' | 'dotted';
    bidirectional?: boolean;
}

export interface EREntity {
    name: string;
    attributes: Array<{ name: string; type: string; pk?: boolean; fk?: string }>;
}

export interface SequenceParticipant {
    id: string;
    label: string;
    type?: 'actor' | 'participant' | 'database' | 'entity';
}

export interface SequenceMessage {
    from: string;
    to: string;
    message: string;
    type?: 'sync' | 'async' | 'reply';
}

export interface FlowNode {
    id: string;
    label: string;
    type?: 'start' | 'end' | 'process' | 'decision' | 'io' | 'subroutine';
}

export interface FlowEdge {
    from: string;
    to: string;
    label?: string;
}

// ============================================================================
// ARCHITECTURE DIAGRAM GENERATOR
// ============================================================================

export class ArchitectureDiagramGenerator extends EventEmitter {
    private static instance: ArchitectureDiagramGenerator;

    private constructor() {
        super();
    }

    static getInstance(): ArchitectureDiagramGenerator {
        if (!ArchitectureDiagramGenerator.instance) {
            ArchitectureDiagramGenerator.instance = new ArchitectureDiagramGenerator();
        }
        return ArchitectureDiagramGenerator.instance;
    }

    // ========================================================================
    // ARCHITECTURE DIAGRAMS
    // ========================================================================

    generateArchitectureDiagram(config: DiagramConfig, nodes: ArchNode[], edges: ArchEdge[]): string {
        const direction = config.direction || 'TB';
        let diagram = `graph ${direction}\n`;

        // Group nodes by group
        const grouped = new Map<string, ArchNode[]>();
        for (const node of nodes) {
            const group = node.group || '_default';
            if (!grouped.has(group)) grouped.set(group, []);
            grouped.get(group)!.push(node);
        }

        // Render groups
        for (const [group, groupNodes] of grouped) {
            if (group !== '_default') {
                diagram += `  subgraph ${this.safeId(group)}\n`;
            }
            for (const node of groupNodes) {
                diagram += `    ${this.renderNode(node)}\n`;
            }
            if (group !== '_default') {
                diagram += `  end\n`;
            }
        }

        // Render edges
        for (const edge of edges) {
            diagram += this.renderEdge(edge);
        }

        // Add styling
        diagram += this.generateStyles(nodes);

        return diagram;
    }

    private renderNode(node: ArchNode): string {
        const shapes: Record<ArchNode['type'], [string, string]> = {
            service: ['[', ']'],
            database: ['[(', ')]'],
            api: ['{{', '}}'],
            client: ['([', '])'],
            queue: ['[/', '\\]'],
            cache: ['[[', ']]'],
            storage: ['[\\', '/]'],
            external: ['>', ']'],
        };

        const [open, close] = shapes[node.type] || ['[', ']'];
        const icon = node.icon ? `${node.icon} ` : '';
        return `${this.safeId(node.id)}${open}${icon}${node.label}${close}`;
    }

    private renderEdge(edge: ArchEdge): string {
        const arrow = edge.bidirectional ? '<-->' : '-->';
        const style = edge.style === 'dashed' ? '-.->' : edge.style === 'dotted' ? '...>' : arrow;
        const label = edge.label ? `|${edge.label}|` : '';
        return `  ${this.safeId(edge.from)} ${style}${label} ${this.safeId(edge.to)}\n`;
    }

    private generateStyles(nodes: ArchNode[]): string {
        const typeColors: Record<ArchNode['type'], string> = {
            service: '#4F46E5',
            database: '#059669',
            api: '#D97706',
            client: '#7C3AED',
            queue: '#DC2626',
            cache: '#2563EB',
            storage: '#4B5563',
            external: '#9CA3AF',
        };

        let styles = '';
        for (const node of nodes) {
            const color = typeColors[node.type];
            styles += `  style ${this.safeId(node.id)} fill:${color},stroke:#333,stroke-width:2px,color:#fff\n`;
        }
        return styles;
    }

    // ========================================================================
    // ER DIAGRAMS
    // ========================================================================

    generateERDiagram(entities: EREntity[]): string {
        let diagram = 'erDiagram\n';

        for (const entity of entities) {
            diagram += `  ${entity.name} {\n`;
            for (const attr of entity.attributes) {
                const pk = attr.pk ? ' PK' : '';
                const fk = attr.fk ? ` FK "${attr.fk}"` : '';
                diagram += `    ${attr.type} ${attr.name}${pk}${fk}\n`;
            }
            diagram += `  }\n`;
        }

        // Add relationships based on FK
        for (const entity of entities) {
            for (const attr of entity.attributes) {
                if (attr.fk) {
                    diagram += `  ${attr.fk} ||--o{ ${entity.name} : has\n`;
                }
            }
        }

        return diagram;
    }

    // ========================================================================
    // SEQUENCE DIAGRAMS
    // ========================================================================

    generateSequenceDiagram(participants: SequenceParticipant[], messages: SequenceMessage[], title?: string): string {
        let diagram = 'sequenceDiagram\n';

        if (title) {
            diagram += `  title: ${title}\n`;
        }

        // Declare participants
        for (const p of participants) {
            const type = p.type || 'participant';
            diagram += `  ${type} ${p.id} as ${p.label}\n`;
        }

        diagram += '\n';

        // Add messages
        for (const msg of messages) {
            const arrow = msg.type === 'async' ? '->>' : msg.type === 'reply' ? '-->' : '->';
            diagram += `  ${msg.from}${arrow}${msg.to}: ${msg.message}\n`;
        }

        return diagram;
    }

    // ========================================================================
    // FLOWCHARTS
    // ========================================================================

    generateFlowchart(nodes: FlowNode[], edges: FlowEdge[], direction: 'TB' | 'LR' = 'TB'): string {
        let diagram = `flowchart ${direction}\n`;

        for (const node of nodes) {
            diagram += `  ${this.renderFlowNode(node)}\n`;
        }

        for (const edge of edges) {
            const label = edge.label ? `|${edge.label}|` : '';
            diagram += `  ${this.safeId(edge.from)} -->${label} ${this.safeId(edge.to)}\n`;
        }

        return diagram;
    }

    private renderFlowNode(node: FlowNode): string {
        const shapes: Record<string, [string, string]> = {
            start: ['([', '])'],
            end: ['([', '])'],
            process: ['[', ']'],
            decision: ['{', '}'],
            io: ['[/', '/]'],
            subroutine: ['[[', ']]'],
        };

        const [open, close] = shapes[node.type || 'process'];
        return `${this.safeId(node.id)}${open}${node.label}${close}`;
    }

    // ========================================================================
    // CLASS DIAGRAMS
    // ========================================================================

    generateClassDiagram(classes: Array<{
        name: string;
        properties: Array<{ name: string; type: string; visibility?: '+' | '-' | '#' }>;
        methods: Array<{ name: string; params?: string; returns?: string; visibility?: '+' | '-' | '#' }>;
    }>, relationships?: Array<{
        from: string;
        to: string;
        type: 'inheritance' | 'composition' | 'aggregation' | 'association' | 'dependency';
    }>): string {
        let diagram = 'classDiagram\n';

        for (const cls of classes) {
            diagram += `  class ${cls.name} {\n`;
            for (const prop of cls.properties) {
                const vis = prop.visibility || '+';
                diagram += `    ${vis}${prop.name}: ${prop.type}\n`;
            }
            for (const method of cls.methods) {
                const vis = method.visibility || '+';
                const params = method.params || '';
                const returns = method.returns ? ` ${method.returns}` : '';
                diagram += `    ${vis}${method.name}(${params})${returns}\n`;
            }
            diagram += `  }\n`;
        }

        if (relationships) {
            const arrows: Record<string, string> = {
                inheritance: '--|>',
                composition: '*--',
                aggregation: 'o--',
                association: '-->',
                dependency: '..>',
            };

            for (const rel of relationships) {
                diagram += `  ${rel.from} ${arrows[rel.type]} ${rel.to}\n`;
            }
        }

        return diagram;
    }

    // ========================================================================
    // PRESET TEMPLATES
    // ========================================================================

    generateMicroservicesArchitecture(services: string[], includeInfra = true): string {
        const nodes: ArchNode[] = [
            { id: 'client', label: 'Client App', type: 'client' },
            { id: 'gateway', label: 'API Gateway', type: 'api' },
        ];

        for (const service of services) {
            nodes.push({
                id: this.safeId(service),
                label: service,
                type: 'service',
                group: 'Services',
            });
        }

        if (includeInfra) {
            nodes.push(
                { id: 'db', label: 'Database', type: 'database', group: 'Infrastructure' },
                { id: 'cache', label: 'Redis Cache', type: 'cache', group: 'Infrastructure' },
                { id: 'queue', label: 'Message Queue', type: 'queue', group: 'Infrastructure' },
            );
        }

        const edges: ArchEdge[] = [
            { from: 'client', to: 'gateway', label: 'HTTPS' },
        ];

        for (const service of services) {
            edges.push({ from: 'gateway', to: this.safeId(service) });
            if (includeInfra) {
                edges.push({ from: this.safeId(service), to: 'db', style: 'dashed' });
                edges.push({ from: this.safeId(service), to: 'cache', style: 'dashed' });
            }
        }

        return this.generateArchitectureDiagram(
            { type: 'architecture', title: 'Microservices Architecture', direction: 'LR' },
            nodes,
            edges
        );
    }

    generateServerlessArchitecture(functions: string[]): string {
        const nodes: ArchNode[] = [
            { id: 'client', label: 'Client', type: 'client' },
            { id: 'apigw', label: 'API Gateway', type: 'api' },
            { id: 'auth', label: 'Auth', type: 'external', group: 'Cloud' },
            { id: 'db', label: 'DynamoDB', type: 'database', group: 'Cloud' },
            { id: 's3', label: 'S3 Storage', type: 'storage', group: 'Cloud' },
        ];

        for (const fn of functions) {
            nodes.push({
                id: this.safeId(fn),
                label: `λ ${fn}`,
                type: 'service',
                group: 'Functions',
            });
        }

        const edges: ArchEdge[] = [
            { from: 'client', to: 'apigw' },
            { from: 'apigw', to: 'auth', style: 'dashed' },
        ];

        for (const fn of functions) {
            edges.push({ from: 'apigw', to: this.safeId(fn) });
            edges.push({ from: this.safeId(fn), to: 'db', style: 'dashed' });
        }

        return this.generateArchitectureDiagram(
            { type: 'architecture', title: 'Serverless Architecture' },
            nodes,
            edges
        );
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    private safeId(id: string): string {
        return id.replace(/[^a-zA-Z0-9]/g, '_');
    }

    wrapInMermaid(diagram: string): string {
        return '```mermaid\n' + diagram + '\n```';
    }
}

export const architectureDiagramGenerator = ArchitectureDiagramGenerator.getInstance();
