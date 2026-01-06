/**
 * Project Template System
 * Scaffolding for common project types
 * Similar to Canva's template library but for code projects
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ProjectTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    framework?: string;
    language: string;
    tags: string[];
    files: TemplateFile[];
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    scripts?: Record<string, string>;
    variables: TemplateVariable[];
}

export interface TemplateFile {
    path: string;
    content: string;
    isTemplate: boolean; // If true, process {{variables}}
}

export interface TemplateVariable {
    name: string;
    description: string;
    default?: string;
    required: boolean;
}

/**
 * ProjectTemplates
 * Manages and generates projects from templates
 */
export class ProjectTemplates extends EventEmitter {
    private static instance: ProjectTemplates;
    private templates: Map<string, ProjectTemplate> = new Map();

    private constructor() {
        super();
        this.initializeBuiltInTemplates();
    }

    static getInstance(): ProjectTemplates {
        if (!ProjectTemplates.instance) {
            ProjectTemplates.instance = new ProjectTemplates();
        }
        return ProjectTemplates.instance;
    }

    /**
     * Get all templates
     */
    getAllTemplates(): ProjectTemplate[] {
        return Array.from(this.templates.values());
    }

    /**
     * Get template by ID
     */
    getTemplate(id: string): ProjectTemplate | null {
        return this.templates.get(id) || null;
    }

    /**
     * Get templates by category
     */
    getByCategory(category: string): ProjectTemplate[] {
        return Array.from(this.templates.values())
            .filter(t => t.category === category);
    }

    /**
     * Search templates
     */
    searchTemplates(query: string): ProjectTemplate[] {
        const queryLower = query.toLowerCase();
        return Array.from(this.templates.values()).filter(t =>
            t.name.toLowerCase().includes(queryLower) ||
            t.description.toLowerCase().includes(queryLower) ||
            t.tags.some(tag => tag.toLowerCase().includes(queryLower))
        );
    }

    /**
     * Create project from template
     */
    async createFromTemplate(
        templateId: string,
        targetPath: string,
        variables: Record<string, string>
    ): Promise<{ success: boolean; files: string[]; error?: string }> {
        const template = this.templates.get(templateId);
        if (!template) {
            return { success: false, files: [], error: 'Template not found' };
        }

        this.emit('creating', { templateId, targetPath });

        try {
            // Ensure target directory exists
            await fs.mkdir(targetPath, { recursive: true });

            const createdFiles: string[] = [];

            // Create each file
            for (const file of template.files) {
                const filePath = path.join(targetPath, this.processTemplate(file.path, variables));
                const content = file.isTemplate
                    ? this.processTemplate(file.content, variables)
                    : file.content;

                // Create directory if needed
                await fs.mkdir(path.dirname(filePath), { recursive: true });
                await fs.writeFile(filePath, content, 'utf-8');
                createdFiles.push(filePath);
            }

            // Create package.json if dependencies exist
            if (template.dependencies || template.devDependencies) {
                const packageJson = {
                    name: variables.projectName || path.basename(targetPath),
                    version: '1.0.0',
                    description: variables.description || template.description,
                    scripts: template.scripts || {},
                    dependencies: template.dependencies || {},
                    devDependencies: template.devDependencies || {},
                };

                const packagePath = path.join(targetPath, 'package.json');
                await fs.writeFile(packagePath, JSON.stringify(packageJson, null, 2), 'utf-8');
                createdFiles.push(packagePath);
            }

            this.emit('created', { templateId, targetPath, files: createdFiles });
            return { success: true, files: createdFiles };
        } catch (error: any) {
            return { success: false, files: [], error: error.message };
        }
    }

    /**
     * Add custom template
     */
    addTemplate(template: ProjectTemplate): void {
        this.templates.set(template.id, template);
        this.emit('templateAdded', template);
    }

    /**
     * Create template from existing project
     */
    async createTemplateFromProject(
        projectPath: string,
        options: { name: string; description: string; category: string }
    ): Promise<ProjectTemplate> {
        const files: TemplateFile[] = [];
        await this.scanProjectFiles(projectPath, projectPath, files);

        const template: ProjectTemplate = {
            id: `custom_${Date.now()}`,
            name: options.name,
            description: options.description,
            category: options.category,
            language: this.detectLanguage(files),
            tags: [],
            files,
            variables: [],
        };

        this.templates.set(template.id, template);
        return template;
    }

    /**
     * Get all categories
     */
    getCategories(): string[] {
        const categories = new Set<string>();
        for (const template of this.templates.values()) {
            categories.add(template.category);
        }
        return Array.from(categories).sort();
    }

    // Private methods

    private processTemplate(content: string, variables: Record<string, string>): string {
        return content.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
            return variables[varName] !== undefined ? variables[varName] : match;
        });
    }

    private async scanProjectFiles(basePath: string, currentPath: string, files: TemplateFile[]): Promise<void> {
        const entries = await fs.readdir(currentPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(currentPath, entry.name);
            const relativePath = path.relative(basePath, fullPath);

            // Skip common non-template directories
            if (entry.isDirectory()) {
                if (['node_modules', '.git', 'dist', 'build'].includes(entry.name)) continue;
                await this.scanProjectFiles(basePath, fullPath, files);
            } else {
                const content = await fs.readFile(fullPath, 'utf-8');
                files.push({
                    path: relativePath,
                    content,
                    isTemplate: false,
                });
            }
        }
    }

    private detectLanguage(files: TemplateFile[]): string {
        const extensions = files.map(f => path.extname(f.path).toLowerCase());

        if (extensions.includes('.ts') || extensions.includes('.tsx')) return 'typescript';
        if (extensions.includes('.js') || extensions.includes('.jsx')) return 'javascript';
        if (extensions.includes('.py')) return 'python';
        if (extensions.includes('.go')) return 'go';
        if (extensions.includes('.rs')) return 'rust';
        if (extensions.includes('.java')) return 'java';

        return 'unknown';
    }

    private initializeBuiltInTemplates(): void {
        // React TypeScript Template
        this.templates.set('react-ts', {
            id: 'react-ts',
            name: 'React TypeScript',
            description: 'Modern React app with TypeScript and Vite',
            category: 'Frontend',
            framework: 'React',
            language: 'typescript',
            tags: ['react', 'typescript', 'vite', 'frontend'],
            variables: [
                { name: 'projectName', description: 'Project name', required: true },
                { name: 'description', description: 'Project description', default: 'A React app', required: false },
            ],
            files: [
                {
                    path: 'src/App.tsx',
                    isTemplate: true,
                    content: `import './App.css'

function App() {
  return (
    <div className="app">
      <h1>{{projectName}}</h1>
      <p>{{description}}</p>
    </div>
  )
}

export default App
`,
                },
                {
                    path: 'src/App.css',
                    isTemplate: false,
                    content: `.app {
  text-align: center;
  padding: 2rem;
}
`,
                },
                {
                    path: 'src/main.tsx',
                    isTemplate: false,
                    content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`,
                },
                {
                    path: 'index.html',
                    isTemplate: true,
                    content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{projectName}}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
                },
                {
                    path: 'tsconfig.json',
                    isTemplate: false,
                    content: `{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
`,
                },
            ],
            dependencies: {
                'react': '^18.2.0',
                'react-dom': '^18.2.0',
            },
            devDependencies: {
                '@types/react': '^18.2.0',
                '@types/react-dom': '^18.2.0',
                'typescript': '^5.0.0',
                'vite': '^5.0.0',
                '@vitejs/plugin-react': '^4.0.0',
            },
            scripts: {
                'dev': 'vite',
                'build': 'tsc && vite build',
                'preview': 'vite preview',
            },
        });

        // Express API Template
        this.templates.set('express-api', {
            id: 'express-api',
            name: 'Express API',
            description: 'RESTful API with Express and TypeScript',
            category: 'Backend',
            framework: 'Express',
            language: 'typescript',
            tags: ['express', 'api', 'typescript', 'backend', 'rest'],
            variables: [
                { name: 'projectName', description: 'Project name', required: true },
                { name: 'port', description: 'Server port', default: '3000', required: false },
            ],
            files: [
                {
                    path: 'src/index.ts',
                    isTemplate: true,
                    content: `import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || {{port}};

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to {{projectName}} API' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
`,
                },
                {
                    path: 'tsconfig.json',
                    isTemplate: false,
                    content: `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
`,
                },
            ],
            dependencies: {
                'express': '^4.18.0',
                'cors': '^2.8.5',
            },
            devDependencies: {
                '@types/express': '^4.17.0',
                '@types/cors': '^2.8.0',
                'typescript': '^5.0.0',
                'tsx': '^4.0.0',
            },
            scripts: {
                'dev': 'tsx watch src/index.ts',
                'build': 'tsc',
                'start': 'node dist/index.js',
            },
        });

        // Python CLI Template
        this.templates.set('python-cli', {
            id: 'python-cli',
            name: 'Python CLI',
            description: 'Command-line tool with Click',
            category: 'CLI',
            language: 'python',
            tags: ['python', 'cli', 'click'],
            variables: [
                { name: 'projectName', description: 'Project name', required: true },
                { name: 'author', description: 'Author name', default: 'Developer', required: false },
            ],
            files: [
                {
                    path: 'src/main.py',
                    isTemplate: true,
                    content: `#!/usr/bin/env python3
"""{{projectName}} - A CLI tool"""

import click

@click.group()
@click.version_option(version='1.0.0')
def cli():
    """{{projectName}} command-line tool"""
    pass

@cli.command()
@click.argument('name', default='World')
def hello(name: str):
    """Say hello to NAME"""
    click.echo(f'Hello, {name}!')

@cli.command()
def info():
    """Show application info"""
    click.echo('{{projectName}} v1.0.0')
    click.echo('Author: {{author}}')

if __name__ == '__main__':
    cli()
`,
                },
                {
                    path: 'requirements.txt',
                    isTemplate: false,
                    content: `click>=8.0.0
`,
                },
                {
                    path: 'README.md',
                    isTemplate: true,
                    content: `# {{projectName}}

A command-line tool built with Python and Click.

## Installation

\`\`\`bash
pip install -r requirements.txt
\`\`\`

## Usage

\`\`\`bash
python src/main.py hello World
python src/main.py info
\`\`\`
`,
                },
            ],
        });

        // Next.js Template
        this.templates.set('nextjs', {
            id: 'nextjs',
            name: 'Next.js App',
            description: 'Full-stack Next.js with App Router',
            category: 'Frontend',
            framework: 'Next.js',
            language: 'typescript',
            tags: ['nextjs', 'react', 'typescript', 'fullstack'],
            variables: [
                { name: 'projectName', description: 'Project name', required: true },
            ],
            files: [
                {
                    path: 'app/page.tsx',
                    isTemplate: true,
                    content: `export default function Home() {
                    return(
    <main className = "container" >
                            <h1>{{ projectName }} </h1>
                < p > Welcome to your Next.js app </p>
                </main>
  )
    }
`,
                },
                {
                    path: 'app/layout.tsx',
                    isTemplate: true,
                    content: `export const metadata = {
    title: '{{projectName}}',
    description: 'Built with Next.js',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang= "en" >
        <body>{ children } </body>
        </html>
  )
}
`,
                },
            ],
            dependencies: {
                'next': '^14.0.0',
                'react': '^18.2.0',
                'react-dom': '^18.2.0',
            },
            devDependencies: {
                '@types/node': '^20.0.0',
                '@types/react': '^18.2.0',
                'typescript': '^5.0.0',
            },
            scripts: {
                'dev': 'next dev',
                'build': 'next build',
                'start': 'next start',
            },
        });
    }
}

// Singleton getter
export function getProjectTemplates(): ProjectTemplates {
    return ProjectTemplates.getInstance();
}
