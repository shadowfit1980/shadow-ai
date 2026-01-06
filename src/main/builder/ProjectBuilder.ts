import { ProjectConfig, BuildResult } from '../types';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Project Builder
 * Builds complete projects from scratch
 */
export class ProjectBuilder {
    private config: ProjectConfig;

    constructor(config: ProjectConfig) {
        this.config = config;
    }

    /**
     * Build the project
     */
    async build(): Promise<BuildResult> {
        try {
            console.log(`Building ${this.config.type} project: ${this.config.name}`);

            // Create project directory
            if (!fs.existsSync(this.config.path)) {
                fs.mkdirSync(this.config.path, { recursive: true });
            }

            // Build based on project type
            switch (this.config.type) {
                case 'nextjs':
                    return await this.buildNextJS();
                case 'react':
                    return await this.buildReact();
                case 'vue':
                    return await this.buildVue();
                case 'astro':
                    return await this.buildAstro();
                case 'flask':
                    return await this.buildFlask();
                case 'express':
                    return await this.buildExpress();
                default:
                    throw new Error(`Unsupported project type: ${this.config.type}`);
            }
        } catch (error: any) {
            return {
                success: false,
                output: '',
                errors: [error.message],
            };
        }
    }

    /**
     * Build Next.js project
     */
    private async buildNextJS(): Promise<BuildResult> {
        const { stdout, stderr } = await execAsync(
            `npx -y create-next-app@latest ${this.config.name} --typescript --tailwind --app --no-git`,
            { cwd: path.dirname(this.config.path) }
        );

        return {
            success: true,
            output: stdout,
            warnings: stderr ? [stderr] : undefined,
            artifacts: [this.config.path],
        };
    }

    /**
     * Build React project with Vite
     */
    private async buildReact(): Promise<BuildResult> {
        const { stdout, stderr } = await execAsync(
            `npx -y create-vite@latest ${this.config.name} --template react-ts`,
            { cwd: path.dirname(this.config.path) }
        );

        return {
            success: true,
            output: stdout,
            warnings: stderr ? [stderr] : undefined,
            artifacts: [this.config.path],
        };
    }

    /**
     * Build Vue project
     */
    private async buildVue(): Promise<BuildResult> {
        const { stdout, stderr } = await execAsync(
            `npx -y create-vue@latest ${this.config.name} --typescript --jsx --router --pinia`,
            { cwd: path.dirname(this.config.path) }
        );

        return {
            success: true,
            output: stdout,
            warnings: stderr ? [stderr] : undefined,
            artifacts: [this.config.path],
        };
    }

    /**
     * Build Astro project
     */
    private async buildAstro(): Promise<BuildResult> {
        const { stdout, stderr } = await execAsync(
            `npx -y create-astro@latest ${this.config.name} --template minimal --typescript strict`,
            { cwd: path.dirname(this.config.path) }
        );

        return {
            success: true,
            output: stdout,
            warnings: stderr ? [stderr] : undefined,
            artifacts: [this.config.path],
        };
    }

    /**
     * Build Flask project
     */
    private async buildFlask(): Promise<BuildResult> {
        const projectPath = this.config.path;

        // Create basic Flask structure
        const structure = {
            'app.py': `from flask import Flask, render_template, jsonify

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/health')
def health():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    app.run(debug=True)
`,
            'requirements.txt': `Flask==3.0.0
python-dotenv==1.0.0
`,
            'templates/index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.config.name}</title>
</head>
<body>
    <h1>Welcome to ${this.config.name}</h1>
</body>
</html>
`,
            '.env': `FLASK_APP=app.py
FLASK_ENV=development
`,
        };

        // Create files
        for (const [filePath, content] of Object.entries(structure)) {
            const fullPath = path.join(projectPath, filePath);
            const dir = path.dirname(fullPath);

            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(fullPath, content, 'utf8');
        }

        return {
            success: true,
            output: 'Flask project created successfully',
            artifacts: [projectPath],
        };
    }

    /**
     * Build Express project
     */
    private async buildExpress(): Promise<BuildResult> {
        const projectPath = this.config.path;

        // Create basic Express structure
        const structure = {
            'package.json': JSON.stringify(
                {
                    name: this.config.name,
                    version: '1.0.0',
                    type: 'module',
                    scripts: {
                        dev: 'node --watch server.js',
                        start: 'node server.js',
                    },
                    dependencies: {
                        express: '^4.18.2',
                        dotenv: '^16.4.5',
                    },
                },
                null,
                2
            ),
            'server.js': `import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to ${this.config.name}' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
`,
            '.env': `PORT=3000
NODE_ENV=development
`,
        };

        // Create files
        for (const [filePath, content] of Object.entries(structure)) {
            const fullPath = path.join(projectPath, filePath);
            fs.writeFileSync(fullPath, content, 'utf8');
        }

        return {
            success: true,
            output: 'Express project created successfully',
            artifacts: [projectPath],
        };
    }
}
