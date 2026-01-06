/**
 * Project Scaffolder
 * Generate complete project structures from descriptions
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ScaffoldConfig {
    name: string;
    description: string;
    type: 'frontend' | 'backend' | 'fullstack' | 'mobile' | 'cli' | 'library';
    language: string;
    framework?: string;
    features: string[];
    targetPath: string;
}

export interface ScaffoldResult {
    success: boolean;
    files: string[];
    commands: string[];
    nextSteps: string[];
    error?: string;
}

interface FileTemplate {
    path: string;
    content: string;
}

/**
 * ProjectScaffolder
 * AI-powered project generation
 */
export class ProjectScaffolder extends EventEmitter {
    private static instance: ProjectScaffolder;

    private constructor() {
        super();
    }

    static getInstance(): ProjectScaffolder {
        if (!ProjectScaffolder.instance) {
            ProjectScaffolder.instance = new ProjectScaffolder();
        }
        return ProjectScaffolder.instance;
    }

    /**
     * Scaffold a new project
     */
    async scaffold(config: ScaffoldConfig): Promise<ScaffoldResult> {
        this.emit('scaffoldStarted', config);

        try {
            const templates = this.getTemplatesForConfig(config);
            const createdFiles: string[] = [];

            // Create target directory
            await fs.mkdir(config.targetPath, { recursive: true });

            // Create all files
            for (const template of templates) {
                const filePath = path.join(config.targetPath, template.path);
                await fs.mkdir(path.dirname(filePath), { recursive: true });

                const content = this.processTemplate(template.content, config);
                await fs.writeFile(filePath, content);
                createdFiles.push(filePath);
            }

            const commands = this.getSetupCommands(config);
            const nextSteps = this.getNextSteps(config);

            const result: ScaffoldResult = {
                success: true,
                files: createdFiles,
                commands,
                nextSteps,
            };

            this.emit('scaffoldCompleted', result);
            return result;
        } catch (error: any) {
            const result: ScaffoldResult = {
                success: false,
                files: [],
                commands: [],
                nextSteps: [],
                error: error.message,
            };

            this.emit('scaffoldFailed', result);
            return result;
        }
    }

    /**
     * Get templates based on config
     */
    private getTemplatesForConfig(config: ScaffoldConfig): FileTemplate[] {
        const templates: FileTemplate[] = [];

        // Common files
        templates.push({
            path: 'README.md',
            content: `# {{name}}

{{description}}

## Getting Started

\`\`\`bash
{{installCommand}}
{{startCommand}}
\`\`\`

## Features

{{featuresList}}
`,
        });

        templates.push({
            path: '.gitignore',
            content: this.getGitignore(config.language),
        });

        // Language/framework specific
        switch (config.type) {
            case 'frontend':
                templates.push(...this.getFrontendTemplates(config));
                break;
            case 'backend':
                templates.push(...this.getBackendTemplates(config));
                break;
            case 'fullstack':
                templates.push(...this.getFullstackTemplates(config));
                break;
            case 'cli':
                templates.push(...this.getCLITemplates(config));
                break;
            case 'library':
                templates.push(...this.getLibraryTemplates(config));
                break;
        }

        return templates;
    }

    private getFrontendTemplates(config: ScaffoldConfig): FileTemplate[] {
        const templates: FileTemplate[] = [];

        templates.push({
            path: 'package.json',
            content: JSON.stringify({
                name: config.name,
                version: '1.0.0',
                description: config.description,
                scripts: {
                    dev: 'vite',
                    build: 'vite build',
                    preview: 'vite preview',
                },
                dependencies: {
                    react: '^18.2.0',
                    'react-dom': '^18.2.0',
                },
                devDependencies: {
                    '@types/react': '^18.2.0',
                    '@vitejs/plugin-react': '^4.0.0',
                    typescript: '^5.0.0',
                    vite: '^5.0.0',
                },
            }, null, 2),
        });

        templates.push({
            path: 'src/App.tsx',
            content: `import './App.css'

export default function App() {
  return (
    <div className="app">
      <h1>{{name}}</h1>
      <p>{{description}}</p>
    </div>
  )
}
`,
        });

        templates.push({
            path: 'src/App.css',
            content: `.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}
`,
        });

        templates.push({
            path: 'src/main.tsx',
            content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`,
        });

        templates.push({
            path: 'index.html',
            content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{name}}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
        });

        return templates;
    }

    private getBackendTemplates(config: ScaffoldConfig): FileTemplate[] {
        const templates: FileTemplate[] = [];

        if (config.language === 'typescript' || config.language === 'javascript') {
            templates.push({
                path: 'package.json',
                content: JSON.stringify({
                    name: config.name,
                    version: '1.0.0',
                    description: config.description,
                    main: 'dist/index.js',
                    scripts: {
                        dev: 'tsx watch src/index.ts',
                        build: 'tsc',
                        start: 'node dist/index.js',
                    },
                    dependencies: {
                        express: '^4.18.0',
                        cors: '^2.8.5',
                    },
                    devDependencies: {
                        '@types/express': '^4.17.0',
                        '@types/cors': '^2.8.0',
                        typescript: '^5.0.0',
                        tsx: '^4.0.0',
                    },
                }, null, 2),
            });

            templates.push({
                path: 'src/index.ts',
                content: `import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to {{name}}' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
`,
            });
        }

        return templates;
    }

    private getFullstackTemplates(config: ScaffoldConfig): FileTemplate[] {
        return [
            ...this.getFrontendTemplates({ ...config, type: 'frontend' }),
            {
                path: 'server/index.ts',
                content: `import express from 'express';
const app = express();
app.use(express.json());
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.listen(3001, () => console.log('API running on 3001'));
`,
            },
        ];
    }

    private getCLITemplates(config: ScaffoldConfig): FileTemplate[] {
        if (config.language === 'python') {
            return [
                {
                    path: 'src/main.py',
                    content: `#!/usr/bin/env python3
"""{{name}} - {{description}}"""
import click

@click.group()
def cli():
    pass

@cli.command()
def hello():
    """Say hello"""
    click.echo('Hello from {{name}}!')

if __name__ == '__main__':
    cli()
`,
                },
                {
                    path: 'requirements.txt',
                    content: 'click>=8.0.0\n',
                },
            ];
        }

        return [
            {
                path: 'package.json',
                content: JSON.stringify({
                    name: config.name,
                    version: '1.0.0',
                    bin: { [config.name]: './dist/index.js' },
                    scripts: { build: 'tsc', start: 'node dist/index.js' },
                    dependencies: { commander: '^11.0.0' },
                    devDependencies: { typescript: '^5.0.0' },
                }, null, 2),
            },
            {
                path: 'src/index.ts',
                content: `#!/usr/bin/env node
import { program } from 'commander';
program.name('{{name}}').description('{{description}}').version('1.0.0');
program.command('hello').action(() => console.log('Hello!'));
program.parse();
`,
            },
        ];
    }

    private getLibraryTemplates(config: ScaffoldConfig): FileTemplate[] {
        return [
            {
                path: 'package.json',
                content: JSON.stringify({
                    name: config.name,
                    version: '1.0.0',
                    description: config.description,
                    main: 'dist/index.js',
                    types: 'dist/index.d.ts',
                    scripts: { build: 'tsc', test: 'jest' },
                    devDependencies: { typescript: '^5.0.0', jest: '^29.0.0' },
                }, null, 2),
            },
            {
                path: 'src/index.ts',
                content: `// {{name}} - {{description}}\nexport function hello(): string {\n  return 'Hello from {{name}}';\n}\n`,
            },
        ];
    }

    private getGitignore(language: string): string {
        const common = 'node_modules/\ndist/\n.env\n*.log\n.DS_Store\n';
        const byLang: Record<string, string> = {
            python: common + '__pycache__/\n*.pyc\n.venv/\n',
            typescript: common + '*.tsbuildinfo\n',
            javascript: common,
        };
        return byLang[language] || common;
    }

    private processTemplate(content: string, config: ScaffoldConfig): string {
        return content
            .replace(/\{\{name\}\}/g, config.name)
            .replace(/\{\{description\}\}/g, config.description)
            .replace(/\{\{installCommand\}\}/g, config.language === 'python' ? 'pip install -r requirements.txt' : 'npm install')
            .replace(/\{\{startCommand\}\}/g, config.language === 'python' ? 'python src/main.py' : 'npm run dev')
            .replace(/\{\{featuresList\}\}/g, config.features.map(f => `- ${f}`).join('\n'));
    }

    private getSetupCommands(config: ScaffoldConfig): string[] {
        if (config.language === 'python') {
            return ['pip install -r requirements.txt'];
        }
        return ['npm install'];
    }

    private getNextSteps(config: ScaffoldConfig): string[] {
        return [
            `cd ${config.name}`,
            config.language === 'python' ? 'pip install -r requirements.txt' : 'npm install',
            config.language === 'python' ? 'python src/main.py' : 'npm run dev',
        ];
    }
}

// Singleton getter
export function getProjectScaffolder(): ProjectScaffolder {
    return ProjectScaffolder.getInstance();
}
