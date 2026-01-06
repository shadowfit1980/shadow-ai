/**
 * Data Visualization Generator
 * 
 * Generate charts, graphs, and dashboards
 * using Chart.js, D3.js, and Recharts.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type ChartType = 'bar' | 'line' | 'pie' | 'doughnut' | 'area' | 'scatter' | 'radar' | 'heatmap';
export type ChartLibrary = 'chartjs' | 'd3' | 'recharts' | 'apexcharts';

export interface ChartData {
    labels: string[];
    datasets: Dataset[];
}

export interface Dataset {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    fill?: boolean;
}

export interface ChartConfig {
    type: ChartType;
    data: ChartData;
    options?: ChartOptions;
    title?: string;
    responsive?: boolean;
}

export interface ChartOptions {
    legend?: { position: 'top' | 'bottom' | 'left' | 'right' };
    scales?: { x?: AxisConfig; y?: AxisConfig };
    animation?: boolean;
    plugins?: Record<string, any>;
}

export interface AxisConfig {
    title?: { display: boolean; text: string };
    beginAtZero?: boolean;
    stacked?: boolean;
}

export interface DashboardConfig {
    id: string;
    name: string;
    layout: 'grid' | 'rows' | 'columns';
    charts: Array<{ id: string; config: ChartConfig; position: { x: number; y: number; w: number; h: number } }>;
    theme: 'light' | 'dark';
}

// ============================================================================
// DATA VISUALIZATION GENERATOR
// ============================================================================

export class DataVisualizationGenerator extends EventEmitter {
    private static instance: DataVisualizationGenerator;
    private colorPalette = [
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
        '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
    ];

    private constructor() {
        super();
    }

    static getInstance(): DataVisualizationGenerator {
        if (!DataVisualizationGenerator.instance) {
            DataVisualizationGenerator.instance = new DataVisualizationGenerator();
        }
        return DataVisualizationGenerator.instance;
    }

    // ========================================================================
    // CHART.JS
    // ========================================================================

    generateChartJS(config: ChartConfig): string {
        const chartConfig = JSON.stringify({
            type: config.type === 'area' ? 'line' : config.type,
            data: this.prepareData(config.data, config.type),
            options: this.prepareOptions(config),
        }, null, 2);

        return `import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

const ctx = document.getElementById('chart').getContext('2d');
new Chart(ctx, ${chartConfig});
`;
    }

    generateChartJSReact(config: ChartConfig): string {
        const chartType = config.type.charAt(0).toUpperCase() + config.type.slice(1);
        const isArea = config.type === 'area';

        return `import { ${isArea ? 'Line' : chartType} } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const data = ${JSON.stringify(this.prepareData(config.data, config.type), null, 2)};

const options = ${JSON.stringify(this.prepareOptions(config), null, 2)};

export function ${config.title?.replace(/\s/g, '') || 'Chart'}() {
  return <${isArea ? 'Line' : chartType} data={data} options={options} />;
}
`;
    }

    // ========================================================================
    // RECHARTS
    // ========================================================================

    generateRecharts(config: ChartConfig): string {
        const chartComponents = this.getRechartsComponents(config.type);
        const dataTransformed = this.transformForRecharts(config.data);

        return `import {
  ${chartComponents.join(',\n  ')}
} from 'recharts';

const data = ${JSON.stringify(dataTransformed, null, 2)};

export function ${config.title?.replace(/\s/g, '') || 'Chart'}() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      ${this.generateRechartsJSX(config)}
    </ResponsiveContainer>
  );
}
`;
    }

    private getRechartsComponents(type: ChartType): string[] {
        const base = ['ResponsiveContainer', 'Tooltip', 'Legend'];
        switch (type) {
            case 'bar':
                return [...base, 'BarChart', 'Bar', 'XAxis', 'YAxis', 'CartesianGrid'];
            case 'line':
            case 'area':
                return [...base, type === 'area' ? 'AreaChart' : 'LineChart', type === 'area' ? 'Area' : 'Line', 'XAxis', 'YAxis', 'CartesianGrid'];
            case 'pie':
            case 'doughnut':
                return [...base, 'PieChart', 'Pie', 'Cell'];
            case 'scatter':
                return [...base, 'ScatterChart', 'Scatter', 'XAxis', 'YAxis', 'CartesianGrid'];
            case 'radar':
                return [...base, 'RadarChart', 'Radar', 'PolarGrid', 'PolarAngleAxis', 'PolarRadiusAxis'];
            default:
                return base;
        }
    }

    private generateRechartsJSX(config: ChartConfig): string {
        const { type, data } = config;
        const colors = this.colorPalette;

        switch (type) {
            case 'bar':
                return `<BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        ${data.datasets.map((ds, i) => `<Bar dataKey="${ds.label}" fill="${colors[i % colors.length]}" />`).join('\n        ')}
      </BarChart>`;

            case 'line':
                return `<LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        ${data.datasets.map((ds, i) => `<Line type="monotone" dataKey="${ds.label}" stroke="${colors[i % colors.length]}" />`).join('\n        ')}
      </LineChart>`;

            case 'area':
                return `<AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        ${data.datasets.map((ds, i) => `<Area type="monotone" dataKey="${ds.label}" fill="${colors[i % colors.length]}" stroke="${colors[i % colors.length]}" />`).join('\n        ')}
      </AreaChart>`;

            case 'pie':
            case 'doughnut':
                return `<PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          ${type === 'doughnut' ? 'innerRadius={60}' : ''}
          outerRadius={100}
          label
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={${JSON.stringify(colors)}[index % ${colors.length}]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>`;

            default:
                return `<BarChart data={data}><Bar dataKey="value" /></BarChart>`;
        }
    }

    private transformForRecharts(data: ChartData): any[] {
        if (data.datasets.length === 0) return [];

        return data.labels.map((label, i) => {
            const point: Record<string, any> = { name: label };
            data.datasets.forEach(ds => {
                point[ds.label] = ds.data[i];
            });
            return point;
        });
    }

    // ========================================================================
    // APEX CHARTS
    // ========================================================================

    generateApexCharts(config: ChartConfig): string {
        const series = config.data.datasets.map(ds => ({
            name: ds.label,
            data: ds.data,
        }));

        return `import dynamic from 'next/dynamic';
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const options = {
  chart: {
    type: '${config.type}',
    toolbar: { show: true },
  },
  xaxis: {
    categories: ${JSON.stringify(config.data.labels)},
  },
  title: {
    text: '${config.title || ''}',
    align: 'center',
  },
  colors: ${JSON.stringify(this.colorPalette.slice(0, config.data.datasets.length))},
  responsive: [{
    breakpoint: 480,
    options: {
      chart: { width: '100%' },
      legend: { position: 'bottom' },
    },
  }],
};

const series = ${JSON.stringify(series, null, 2)};

export function ${config.title?.replace(/\s/g, '') || 'Chart'}() {
  return <Chart options={options} series={series} type="${config.type}" height={350} />;
}
`;
    }

    // ========================================================================
    // DASHBOARD GENERATOR
    // ========================================================================

    generateDashboard(config: DashboardConfig): string {
        return `'use client';

import { useState, useEffect } from 'react';

// Import your chart components here
${config.charts.map((c, i) => `// import Chart${i + 1} from './Chart${i + 1}';`).join('\n')}

const dashboardConfig = ${JSON.stringify(config, null, 2)};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch dashboard data
    fetchDashboardData().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen ${config.theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50'}">
      <header className="p-6 border-b ${config.theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}">
        <h1 className="text-2xl font-bold">${config.name}</h1>
      </header>
      
      <main className="p-6">
        <div className="grid grid-cols-12 gap-6">
          ${config.charts.map((chart, i) => `
          <div 
            className="col-span-${chart.position.w} row-span-${chart.position.h} 
                       ${config.theme === 'dark' ? 'bg-gray-800' : 'bg-white'} 
                       rounded-lg shadow p-4"
            style={{ gridColumn: 'span ${chart.position.w}', gridRow: 'span ${chart.position.h}' }}
          >
            <h3 className="text-lg font-semibold mb-4">${chart.config.title || `Chart ${i + 1}`}</h3>
            {/* <Chart${i + 1} /> */}
          </div>`).join('')}
        </div>
      </main>
    </div>
  );
}

async function fetchDashboardData() {
  // Replace with actual data fetching
  return { loaded: true };
}
`;
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    private prepareData(data: ChartData, type: ChartType): any {
        const prepared = { ...data };

        prepared.datasets = data.datasets.map((ds, i) => ({
            ...ds,
            backgroundColor: ds.backgroundColor || (
                type === 'pie' || type === 'doughnut'
                    ? this.colorPalette
                    : this.colorPalette[i % this.colorPalette.length]
            ),
            borderColor: ds.borderColor || this.colorPalette[i % this.colorPalette.length],
            fill: type === 'area' ? true : ds.fill,
        }));

        return prepared;
    }

    private prepareOptions(config: ChartConfig): any {
        return {
            responsive: config.responsive !== false,
            plugins: {
                legend: config.options?.legend || { position: 'top' },
                title: config.title ? { display: true, text: config.title } : undefined,
            },
            scales: config.type !== 'pie' && config.type !== 'doughnut' ? {
                y: { beginAtZero: true, ...config.options?.scales?.y },
                x: config.options?.scales?.x,
            } : undefined,
            animation: config.options?.animation !== false,
        };
    }

    generateFromData(
        rawData: Record<string, any>[],
        options: {
            xField: string;
            yField: string | string[];
            type: ChartType;
            title?: string;
            library?: ChartLibrary;
        }
    ): string {
        const yFields = Array.isArray(options.yField) ? options.yField : [options.yField];

        const chartConfig: ChartConfig = {
            type: options.type,
            title: options.title,
            data: {
                labels: rawData.map(d => String(d[options.xField])),
                datasets: yFields.map((field, i) => ({
                    label: field,
                    data: rawData.map(d => Number(d[field]) || 0),
                })),
            },
        };

        switch (options.library || 'recharts') {
            case 'chartjs':
                return this.generateChartJSReact(chartConfig);
            case 'apexcharts':
                return this.generateApexCharts(chartConfig);
            default:
                return this.generateRecharts(chartConfig);
        }
    }
}

export const dataVisualizationGenerator = DataVisualizationGenerator.getInstance();
