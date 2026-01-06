/**
 * Analytics Dashboard Generator
 * 
 * Generate analytics dashboards and charts.
 */

import { EventEmitter } from 'events';

interface ChartData {
    labels: string[];
    datasets: { label: string; data: number[] }[];
}

export class AnalyticsDashboardGenerator extends EventEmitter {
    private static instance: AnalyticsDashboardGenerator;

    private constructor() { super(); }

    static getInstance(): AnalyticsDashboardGenerator {
        if (!AnalyticsDashboardGenerator.instance) {
            AnalyticsDashboardGenerator.instance = new AnalyticsDashboardGenerator();
        }
        return AnalyticsDashboardGenerator.instance;
    }

    generateDashboardLayout(panels: { title: string; type: 'stat' | 'chart' | 'table' }[]): string {
        const panelComponents = panels.map((p, i) => {
            if (p.type === 'stat') return `<StatCard key="${i}" title="${p.title}" value={data.${this.camelCase(p.title)}} />`;
            if (p.type === 'chart') return `<ChartCard key="${i}" title="${p.title}" data={data.${this.camelCase(p.title)}} />`;
            return `<TableCard key="${i}" title="${p.title}" rows={data.${this.camelCase(p.title)}} />`;
        }).join('\n        ');

        return `import React from 'react';
import { StatCard, ChartCard, TableCard } from './components';

interface DashboardProps {
  data: any;
}

export function Dashboard({ data }: DashboardProps) {
  return (
    <div className="dashboard-grid">
      ${panelComponents}
    </div>
  );
}`;
    }

    generateStatCard(): string {
        return `interface StatCardProps {
  title: string;
  value: number | string;
  change?: number;
  icon?: React.ReactNode;
}

export function StatCard({ title, value, change, icon }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-header">
        <span className="stat-title">{title}</span>
        {icon && <span className="stat-icon">{icon}</span>}
      </div>
      <div className="stat-value">{typeof value === 'number' ? value.toLocaleString() : value}</div>
      {change !== undefined && (
        <div className={\`stat-change \${change >= 0 ? 'positive' : 'negative'}\`}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
        </div>
      )}
    </div>
  );
}`;
    }

    generateChartCard(): string {
        return `import { Line, Bar, Pie } from 'react-chartjs-2';

interface ChartCardProps {
  title: string;
  type?: 'line' | 'bar' | 'pie';
  data: { labels: string[]; datasets: any[] };
}

export function ChartCard({ title, type = 'line', data }: ChartCardProps) {
  const Chart = type === 'bar' ? Bar : type === 'pie' ? Pie : Line;
  
  return (
    <div className="chart-card">
      <h3 className="chart-title">{title}</h3>
      <div className="chart-container">
        <Chart data={data} options={{ responsive: true, maintainAspectRatio: false }} />
      </div>
    </div>
  );
}`;
    }

    generateDateRangePicker(): string {
        return `import { useState } from 'react';

type DateRange = '7d' | '30d' | '90d' | 'custom';

interface DateRangePickerProps {
  onChange: (range: { start: Date; end: Date }) => void;
}

export function DateRangePicker({ onChange }: DateRangePickerProps) {
  const [range, setRange] = useState<DateRange>('7d');

  const handleChange = (newRange: DateRange) => {
    setRange(newRange);
    const end = new Date();
    const start = new Date();
    
    switch (newRange) {
      case '7d': start.setDate(end.getDate() - 7); break;
      case '30d': start.setDate(end.getDate() - 30); break;
      case '90d': start.setDate(end.getDate() - 90); break;
    }
    
    onChange({ start, end });
  };

  return (
    <div className="date-range-picker">
      {(['7d', '30d', '90d'] as const).map(r => (
        <button key={r} className={range === r ? 'active' : ''} onClick={() => handleChange(r)}>
          {r}
        </button>
      ))}
    </div>
  );
}`;
    }

    private camelCase(str: string): string {
        return str.toLowerCase().replace(/\s(.)/g, (_, c) => c.toUpperCase()).replace(/\s/g, '');
    }
}

export const analyticsDashboardGenerator = AnalyticsDashboardGenerator.getInstance();
