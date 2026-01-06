// Chart Library Generator - Generate chart components
import Anthropic from '@anthropic-ai/sdk';

class ChartLibraryGenerator {
    private anthropic: Anthropic | null = null;

    generateApexCharts(): string {
        return `import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

interface ChartProps { data: number[]; categories: string[]; title?: string; }

export function LineChart({ data, categories, title }: ChartProps) {
    const options: ApexOptions = {
        chart: { type: 'line', toolbar: { show: false } },
        stroke: { curve: 'smooth', width: 3 },
        xaxis: { categories },
        title: { text: title, align: 'left' },
        colors: ['#667eea'],
    };
    return <ReactApexChart options={options} series={[{ name: 'Value', data }]} type="line" height={350} />;
}

export function BarChart({ data, categories, title }: ChartProps) {
    const options: ApexOptions = {
        chart: { type: 'bar', toolbar: { show: false } },
        plotOptions: { bar: { borderRadius: 4, horizontal: false } },
        xaxis: { categories },
        title: { text: title },
        colors: ['#667eea'],
    };
    return <ReactApexChart options={options} series={[{ name: 'Value', data }]} type="bar" height={350} />;
}

export function DonutChart({ data, labels }: { data: number[]; labels: string[] }) {
    const options: ApexOptions = {
        chart: { type: 'donut' },
        labels,
        colors: ['#667eea', '#764ba2', '#f59e0b', '#10b981', '#ef4444'],
        legend: { position: 'bottom' },
    };
    return <ReactApexChart options={options} series={data} type="donut" height={350} />;
}

export function AreaChart({ data, categories, title }: ChartProps) {
    const options: ApexOptions = {
        chart: { type: 'area', toolbar: { show: false } },
        stroke: { curve: 'smooth' },
        fill: { type: 'gradient', gradient: { opacityFrom: 0.6, opacityTo: 0.1 } },
        xaxis: { categories },
        title: { text: title },
        colors: ['#667eea'],
    };
    return <ReactApexChart options={options} series={[{ name: 'Value', data }]} type="area" height={350} />;
}
`;
    }

    generateNivo(): string {
        return `import { ResponsiveLine } from '@nivo/line';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';

interface LineData { id: string; data: Array<{ x: string | number; y: number }>; }

export function NivoLineChart({ data }: { data: LineData[] }) {
    return (
        <div style={{ height: 400 }}>
            <ResponsiveLine
                data={data}
                margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
                xScale={{ type: 'point' }}
                yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
                curve="catmullRom"
                colors={{ scheme: 'category10' }}
                pointSize={10}
                pointBorderWidth={2}
                enableGridX={false}
                legends={[{ anchor: 'bottom-right', direction: 'column', translateX: 100 }]}
            />
        </div>
    );
}

export function NivoBarChart({ data, keys }: { data: object[]; keys: string[] }) {
    return (
        <div style={{ height: 400 }}>
            <ResponsiveBar
                data={data}
                keys={keys}
                indexBy="name"
                margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
                padding={0.3}
                colors={{ scheme: 'nivo' }}
                borderRadius={4}
                legends={[{ dataFrom: 'keys', anchor: 'bottom-right', direction: 'column', translateX: 120 }]}
            />
        </div>
    );
}

export function NivoPieChart({ data }: { data: Array<{ id: string; value: number }> }) {
    return (
        <div style={{ height: 400 }}>
            <ResponsivePie
                data={data}
                margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                innerRadius={0.5}
                padAngle={0.7}
                cornerRadius={3}
                colors={{ scheme: 'category10' }}
                legends={[{ anchor: 'bottom', direction: 'row', translateY: 56 }]}
            />
        </div>
    );
}
`;
    }

    generateVictory(): string {
        return `import { VictoryChart, VictoryLine, VictoryBar, VictoryPie, VictoryAxis, VictoryTheme, VictoryArea } from 'victory';

interface DataPoint { x: string | number; y: number; }

export function VictoryLineChart({ data }: { data: DataPoint[] }) {
    return (
        <VictoryChart theme={VictoryTheme.material}>
            <VictoryLine data={data} style={{ data: { stroke: '#667eea', strokeWidth: 3 } }} />
        </VictoryChart>
    );
}

export function VictoryBarChart({ data }: { data: DataPoint[] }) {
    return (
        <VictoryChart theme={VictoryTheme.material} domainPadding={20}>
            <VictoryBar data={data} style={{ data: { fill: '#667eea' } }} />
        </VictoryChart>
    );
}

export function VictoryDonutChart({ data }: { data: Array<{ x: string; y: number }> }) {
    return (
        <VictoryPie
            data={data}
            innerRadius={80}
            colorScale={['#667eea', '#764ba2', '#f59e0b', '#10b981', '#ef4444']}
            labelRadius={100}
            style={{ labels: { fontSize: 12, fill: 'white' } }}
        />
    );
}

export function VictoryAreaChart({ data }: { data: DataPoint[] }) {
    return (
        <VictoryChart theme={VictoryTheme.material}>
            <VictoryArea data={data} style={{ data: { fill: '#667eea', fillOpacity: 0.3, stroke: '#667eea' } }} />
        </VictoryChart>
    );
}
`;
    }

    generateVisx(): string {
        return `import { Group } from '@visx/group';
import { LinePath, Bar } from '@visx/shape';
import { scaleLinear, scaleBand } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { curveMonotoneX } from '@visx/curve';

interface DataPoint { x: number; y: number; }
const width = 500, height = 300, margin = { top: 20, right: 20, bottom: 40, left: 40 };

export function VisxLineChart({ data }: { data: DataPoint[] }) {
    const xMax = width - margin.left - margin.right;
    const yMax = height - margin.top - margin.bottom;
    
    const xScale = scaleLinear({ domain: [0, Math.max(...data.map(d => d.x))], range: [0, xMax] });
    const yScale = scaleLinear({ domain: [0, Math.max(...data.map(d => d.y))], range: [yMax, 0] });

    return (
        <svg width={width} height={height}>
            <Group left={margin.left} top={margin.top}>
                <AxisBottom top={yMax} scale={xScale} />
                <AxisLeft scale={yScale} />
                <LinePath data={data} x={d => xScale(d.x)} y={d => yScale(d.y)} stroke="#667eea" strokeWidth={2} curve={curveMonotoneX} />
            </Group>
        </svg>
    );
}

export function VisxBarChart({ data }: { data: Array<{ label: string; value: number }> }) {
    const xMax = width - margin.left - margin.right;
    const yMax = height - margin.top - margin.bottom;
    
    const xScale = scaleBand({ domain: data.map(d => d.label), range: [0, xMax], padding: 0.4 });
    const yScale = scaleLinear({ domain: [0, Math.max(...data.map(d => d.value))], range: [yMax, 0] });

    return (
        <svg width={width} height={height}>
            <Group left={margin.left} top={margin.top}>
                <AxisBottom top={yMax} scale={xScale} />
                <AxisLeft scale={yScale} />
                {data.map((d, i) => (
                    <Bar key={i} x={xScale(d.label)} y={yScale(d.value)} width={xScale.bandwidth()} height={yMax - yScale(d.value)} fill="#667eea" />
                ))}
            </Group>
        </svg>
    );
}
`;
    }
}

export const chartLibraryGenerator = new ChartLibraryGenerator();
