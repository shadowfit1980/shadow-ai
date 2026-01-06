// Performance Testing Generator - Generate performance and load tests
import Anthropic from '@anthropic-ai/sdk';

class PerformanceTestingGenerator {
    private anthropic: Anthropic | null = null;

    generateK6Script(baseUrl: string, endpoints: Array<{ method: string; path: string }>): string {
        return `import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

export const options = {
    stages: [
        { duration: '30s', target: 20 },  // Ramp up
        { duration: '1m', target: 50 },   // Stay at 50
        { duration: '30s', target: 100 }, // Peak
        { duration: '30s', target: 0 },   // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'],
        errors: ['rate<0.1'],
    },
};

const BASE_URL = '${baseUrl}';

export default function () {
${endpoints.map(ep => `
    const ${ep.path.replace(/[^a-zA-Z]/g, '')} = http.${ep.method.toLowerCase()}(\`\${BASE_URL}${ep.path}\`);
    check(${ep.path.replace(/[^a-zA-Z]/g, '')}, { 'status 200': (r) => r.status === 200 });
    responseTime.add(${ep.path.replace(/[^a-zA-Z]/g, '')}.timings.duration);
    errorRate.add(${ep.path.replace(/[^a-zA-Z]/g, '')}.status !== 200);
`).join('')}
    sleep(1);
}

export function handleSummary(data) {
    return {
        'summary.json': JSON.stringify(data),
        stdout: textSummary(data, { indent: ' ', enableColors: true }),
    };
}
`;
    }

    generateArtilleryConfig(baseUrl: string, endpoints: Array<{ method: string; path: string }>): string {
        return `config:
  target: "${baseUrl}"
  phases:
    - duration: 60
      arrivalRate: 5
      name: "Warm up"
    - duration: 120
      arrivalRate: 10
      rampTo: 50
      name: "Ramp up"
    - duration: 60
      arrivalRate: 50
      name: "Sustained load"
  defaults:
    headers:
      Content-Type: "application/json"
  plugins:
    expect: {}

scenarios:
  - name: "API Load Test"
    flow:
${endpoints.map(ep => `      - ${ep.method.toLowerCase()}:
          url: "${ep.path}"
          expect:
            - statusCode: 200
`).join('')}
`;
    }

    generateLighthouseCI(): string {
        return `module.exports = {
    ci: {
        collect: {
            url: ['http://localhost:3000/', 'http://localhost:3000/about'],
            numberOfRuns: 3,
            settings: {
                preset: 'desktop',
                chromeFlags: '--no-sandbox',
            },
        },
        assert: {
            assertions: {
                'categories:performance': ['error', { minScore: 0.9 }],
                'categories:accessibility': ['error', { minScore: 0.9 }],
                'categories:best-practices': ['error', { minScore: 0.9 }],
                'categories:seo': ['error', { minScore: 0.9 }],
                'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
                'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
                'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
                'total-blocking-time': ['error', { maxNumericValue: 300 }],
            },
        },
        upload: {
            target: 'temporary-public-storage',
        },
    },
};
`;
    }

    generateWebVitalsMonitoring(): string {
        return `import { getCLS, getFID, getFCP, getLCP, getTTFB, Metric } from 'web-vitals';

interface AnalyticsPayload {
    name: string;
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    delta: number;
    id: string;
}

function sendToAnalytics(metric: Metric) {
    const payload: AnalyticsPayload = {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        id: metric.id,
    };

    // Send to your analytics endpoint
    if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics/vitals', JSON.stringify(payload));
    } else {
        fetch('/api/analytics/vitals', {
            method: 'POST',
            body: JSON.stringify(payload),
            keepalive: true,
        });
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
        console.log(\`[Web Vitals] \${metric.name}: \${metric.value} (\${metric.rating})\`);
    }
}

export function initWebVitals() {
    getCLS(sendToAnalytics);
    getFID(sendToAnalytics);
    getFCP(sendToAnalytics);
    getLCP(sendToAnalytics);
    getTTFB(sendToAnalytics);
}

// React hook for Web Vitals
export function useWebVitals() {
    useEffect(() => {
        initWebVitals();
    }, []);
}
`;
    }
}

export const performanceTestingGenerator = new PerformanceTestingGenerator();
