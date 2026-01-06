/**
 * SVG Generator
 * Programmatic vector graphics generation
 * Similar to Canva's graphic elements
 */

import { EventEmitter } from 'events';

export interface ChartData {
    labels: string[];
    datasets: Array<{
        label: string;
        data: number[];
        color?: string;
    }>;
}

export interface DiagramNode {
    id: string;
    label: string;
    type?: 'rectangle' | 'circle' | 'diamond' | 'ellipse';
    x?: number;
    y?: number;
    style?: Record<string, string>;
}

export interface DiagramEdge {
    from: string;
    to: string;
    label?: string;
    type?: 'arrow' | 'line' | 'dashed';
}

export interface SVGOptions {
    width?: number;
    height?: number;
    background?: string;
    padding?: number;
}

/**
 * SVGGenerator
 * Creates SVG graphics programmatically
 */
export class SVGGenerator extends EventEmitter {
    private static instance: SVGGenerator;
    private defaultColors = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'];

    private constructor() {
        super();
    }

    static getInstance(): SVGGenerator {
        if (!SVGGenerator.instance) {
            SVGGenerator.instance = new SVGGenerator();
        }
        return SVGGenerator.instance;
    }

    /**
     * Generate bar chart
     */
    createBarChart(data: ChartData, options?: SVGOptions & { orientation?: 'vertical' | 'horizontal' }): string {
        const width = options?.width || 600;
        const height = options?.height || 400;
        const padding = options?.padding || 60;
        const orientation = options?.orientation || 'vertical';

        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;
        const maxValue = Math.max(...data.datasets.flatMap(d => d.data));
        const barWidth = chartWidth / (data.labels.length * data.datasets.length + data.labels.length) * 0.8;
        const groupWidth = barWidth * data.datasets.length + 10;

        let bars = '';
        let labels = '';

        for (let i = 0; i < data.labels.length; i++) {
            const groupX = padding + (i * groupWidth) + (i * 10);

            // Label
            labels += `<text x="${groupX + groupWidth / 2}" y="${height - 20}" text-anchor="middle" font-size="12" fill="#666">${data.labels[i]}</text>`;

            // Bars for each dataset
            for (let j = 0; j < data.datasets.length; j++) {
                const value = data.datasets[j].data[i];
                const barHeight = (value / maxValue) * chartHeight;
                const barX = groupX + (j * barWidth);
                const barY = height - padding - barHeight;
                const color = data.datasets[j].color || this.defaultColors[j % this.defaultColors.length];

                bars += `
          <rect x="${barX}" y="${barY}" width="${barWidth - 2}" height="${barHeight}" 
                fill="${color}" rx="2" ry="2">
            <title>${data.datasets[j].label}: ${value}</title>
          </rect>
        `;
            }
        }

        // Y-axis labels
        let yLabels = '';
        for (let i = 0; i <= 5; i++) {
            const value = Math.round((maxValue / 5) * i);
            const y = height - padding - (chartHeight / 5) * i;
            yLabels += `
        <text x="${padding - 10}" y="${y + 4}" text-anchor="end" font-size="11" fill="#666">${value}</text>
        <line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="#eee" stroke-width="1"/>
      `;
        }

        return this.wrapSVG(`
      ${yLabels}
      ${bars}
      ${labels}
      <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#333" stroke-width="2"/>
      <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="#333" stroke-width="2"/>
    `, width, height, options);
    }

    /**
     * Generate line chart
     */
    createLineChart(data: ChartData, options?: SVGOptions): string {
        const width = options?.width || 600;
        const height = options?.height || 400;
        const padding = options?.padding || 60;

        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;
        const maxValue = Math.max(...data.datasets.flatMap(d => d.data));
        const stepX = chartWidth / (data.labels.length - 1);

        let lines = '';
        let dots = '';
        let labels = '';

        // X-axis labels
        for (let i = 0; i < data.labels.length; i++) {
            const x = padding + (i * stepX);
            labels += `<text x="${x}" y="${height - 20}" text-anchor="middle" font-size="12" fill="#666">${data.labels[i]}</text>`;
        }

        // Lines and dots for each dataset
        for (let j = 0; j < data.datasets.length; j++) {
            const dataset = data.datasets[j];
            const color = dataset.color || this.defaultColors[j % this.defaultColors.length];
            let pathD = '';

            for (let i = 0; i < dataset.data.length; i++) {
                const x = padding + (i * stepX);
                const y = height - padding - (dataset.data[i] / maxValue) * chartHeight;

                if (i === 0) {
                    pathD = `M ${x} ${y}`;
                } else {
                    pathD += ` L ${x} ${y}`;
                }

                dots += `<circle cx="${x}" cy="${y}" r="4" fill="${color}"><title>${dataset.label}: ${dataset.data[i]}</title></circle>`;
            }

            lines += `<path d="${pathD}" fill="none" stroke="${color}" stroke-width="2"/>`;
        }

        // Grid
        let grid = '';
        for (let i = 0; i <= 5; i++) {
            const y = padding + (chartHeight / 5) * i;
            const value = Math.round(maxValue - (maxValue / 5) * i);
            grid += `
        <line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="#eee" stroke-width="1"/>
        <text x="${padding - 10}" y="${y + 4}" text-anchor="end" font-size="11" fill="#666">${value}</text>
      `;
        }

        return this.wrapSVG(`
      ${grid}
      ${lines}
      ${dots}
      ${labels}
    `, width, height, options);
    }

    /**
     * Generate pie chart
     */
    createPieChart(data: { labels: string[]; values: number[]; colors?: string[] }, options?: SVGOptions): string {
        const size = options?.width || 400;
        const centerX = size / 2;
        const centerY = size / 2;
        const radius = (size / 2) - 40;

        const total = data.values.reduce((sum, v) => sum + v, 0);
        let currentAngle = -90; // Start from top

        let slices = '';
        let legend = '';

        for (let i = 0; i < data.values.length; i++) {
            const percentage = data.values[i] / total;
            const angle = percentage * 360;
            const color = data.colors?.[i] || this.defaultColors[i % this.defaultColors.length];

            // Calculate arc
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;
            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;

            const x1 = centerX + radius * Math.cos(startRad);
            const y1 = centerY + radius * Math.sin(startRad);
            const x2 = centerX + radius * Math.cos(endRad);
            const y2 = centerY + radius * Math.sin(endRad);

            const largeArc = angle > 180 ? 1 : 0;

            slices += `
        <path d="M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z"
              fill="${color}" stroke="white" stroke-width="2">
          <title>${data.labels[i]}: ${data.values[i]} (${(percentage * 100).toFixed(1)}%)</title>
        </path>
      `;

            // Legend
            legend += `
        <rect x="${size - 120}" y="${20 + i * 25}" width="15" height="15" fill="${color}"/>
        <text x="${size - 100}" y="${32 + i * 25}" font-size="12" fill="#333">${data.labels[i]}</text>
      `;

            currentAngle = endAngle;
        }

        return this.wrapSVG(`${slices}${legend}`, size, size, options);
    }

    /**
     * Generate flowchart/diagram
     */
    createDiagram(nodes: DiagramNode[], edges: DiagramEdge[], options?: SVGOptions): string {
        const width = options?.width || 800;
        const height = options?.height || 600;
        const nodeWidth = 120;
        const nodeHeight = 50;

        // Auto-layout if positions not provided
        const layoutNodes = this.autoLayout(nodes, nodeWidth, nodeHeight, width, height);

        let nodeSvg = '';
        let edgeSvg = '';
        let labelSvg = '';

        // Draw edges first (behind nodes)
        for (const edge of edges) {
            const from = layoutNodes.get(edge.from);
            const to = layoutNodes.get(edge.to);
            if (!from || !to) continue;

            const x1 = from.x! + nodeWidth / 2;
            const y1 = from.y! + nodeHeight;
            const x2 = to.x! + nodeWidth / 2;
            const y2 = to.y!;

            const strokeStyle = edge.type === 'dashed' ? 'stroke-dasharray="5,5"' : '';

            edgeSvg += `
        <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" 
              stroke="#666" stroke-width="2" ${strokeStyle}
              marker-end="${edge.type === 'line' ? '' : 'url(#arrowhead)'}"/>
      `;

            if (edge.label) {
                labelSvg += `<text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 5}" text-anchor="middle" font-size="11" fill="#666">${edge.label}</text>`;
            }
        }

        // Draw nodes
        for (const node of nodes) {
            const layout = layoutNodes.get(node.id)!;
            const x = layout.x!;
            const y = layout.y!;

            let shape = '';
            switch (node.type) {
                case 'circle':
                    shape = `<circle cx="${x + nodeWidth / 2}" cy="${y + nodeHeight / 2}" r="${nodeHeight / 2}" fill="#6366f1" stroke="#4f46e5" stroke-width="2"/>`;
                    break;
                case 'diamond':
                    const cx = x + nodeWidth / 2;
                    const cy = y + nodeHeight / 2;
                    shape = `<polygon points="${cx},${y} ${x + nodeWidth},${cy} ${cx},${y + nodeHeight} ${x},${cy}" fill="#8b5cf6" stroke="#7c3aed" stroke-width="2"/>`;
                    break;
                case 'ellipse':
                    shape = `<ellipse cx="${x + nodeWidth / 2}" cy="${y + nodeHeight / 2}" rx="${nodeWidth / 2}" ry="${nodeHeight / 2}" fill="#ec4899" stroke="#db2777" stroke-width="2"/>`;
                    break;
                default:
                    shape = `<rect x="${x}" y="${y}" width="${nodeWidth}" height="${nodeHeight}" rx="8" fill="#6366f1" stroke="#4f46e5" stroke-width="2"/>`;
            }

            nodeSvg += `
        ${shape}
        <text x="${x + nodeWidth / 2}" y="${y + nodeHeight / 2 + 5}" text-anchor="middle" fill="white" font-size="12" font-weight="bold">${node.label}</text>
      `;
        }

        const defs = `
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#666"/>
        </marker>
      </defs>
    `;

        return this.wrapSVG(`${defs}${edgeSvg}${nodeSvg}${labelSvg}`, width, height, options);
    }

    /**
     * Generate icon
     */
    createIcon(name: string, size = 24, color = 'currentColor'): string {
        const icons: Record<string, string> = {
            check: `<path d="M20 6L9 17l-5-5" stroke="${color}" stroke-width="2" fill="none"/>`,
            x: `<path d="M18 6L6 18M6 6l12 12" stroke="${color}" stroke-width="2" fill="none"/>`,
            plus: `<path d="M12 4v16M4 12h16" stroke="${color}" stroke-width="2" fill="none"/>`,
            minus: `<path d="M4 12h16" stroke="${color}" stroke-width="2" fill="none"/>`,
            arrow_right: `<path d="M4 12h16M12 6l6 6-6 6" stroke="${color}" stroke-width="2" fill="none"/>`,
            arrow_left: `<path d="M20 12H4M12 6l-6 6 6 6" stroke="${color}" stroke-width="2" fill="none"/>`,
            home: `<path d="M3 12l9-9 9 9M5 10v10h4v-6h6v6h4V10" stroke="${color}" stroke-width="2" fill="none"/>`,
            settings: `<circle cx="12" cy="12" r="3" stroke="${color}" stroke-width="2" fill="none"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-3.65-1.42V18a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 12a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 113.65-1.42V9a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V15a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="${color}" stroke-width="2" fill="none"/>`,
            user: `<circle cx="12" cy="8" r="4" stroke="${color}" stroke-width="2" fill="none"/><path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke="${color}" stroke-width="2" fill="none"/>`,
            search: `<circle cx="11" cy="11" r="8" stroke="${color}" stroke-width="2" fill="none"/><path d="M21 21l-4.35-4.35" stroke="${color}" stroke-width="2"/>`,
        };

        const iconPath = icons[name] || icons.check;
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">${iconPath}</svg>`;
    }

    /**
     * Generate logo placeholder
     */
    createLogoPlaceholder(text: string, options?: SVGOptions & { shape?: 'circle' | 'square' | 'rounded' }): string {
        const size = options?.width || 100;
        const shape = options?.shape || 'rounded';
        const background = options?.background || '#6366f1';
        const initials = text.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

        let shapeEl = '';
        switch (shape) {
            case 'circle':
                shapeEl = `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${background}"/>`;
                break;
            case 'square':
                shapeEl = `<rect x="0" y="0" width="${size}" height="${size}" fill="${background}"/>`;
                break;
            default:
                shapeEl = `<rect x="0" y="0" width="${size}" height="${size}" rx="12" fill="${background}"/>`;
        }

        return this.wrapSVG(`
      ${shapeEl}
      <text x="${size / 2}" y="${size / 2 + size / 6}" text-anchor="middle" font-size="${size / 3}" font-weight="bold" fill="white">${initials}</text>
    `, size, size, { ...options, background: 'transparent' });
    }

    // Private methods

    private wrapSVG(content: string, width: number, height: number, options?: SVGOptions): string {
        const bg = options?.background ? `<rect width="100%" height="100%" fill="${options.background}"/>` : '';

        return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      ${bg}
      ${content}
    </svg>`;
    }

    private autoLayout(nodes: DiagramNode[], nodeW: number, nodeH: number, width: number, height: number): Map<string, DiagramNode> {
        const result = new Map<string, DiagramNode>();
        const cols = Math.ceil(Math.sqrt(nodes.length));
        const rows = Math.ceil(nodes.length / cols);
        const hGap = (width - cols * nodeW) / (cols + 1);
        const vGap = (height - rows * nodeH) / (rows + 1);

        for (let i = 0; i < nodes.length; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = nodes[i].x ?? (hGap + col * (nodeW + hGap));
            const y = nodes[i].y ?? (vGap + row * (nodeH + vGap));

            result.set(nodes[i].id, { ...nodes[i], x, y });
        }

        return result;
    }
}

// Singleton getter
export function getSVGGenerator(): SVGGenerator {
    return SVGGenerator.getInstance();
}
