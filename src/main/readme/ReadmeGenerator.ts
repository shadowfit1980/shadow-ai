/**
 * Readme Generator - Generate README files
 */
import { EventEmitter } from 'events';

export interface ReadmeConfig { name: string; description: string; features?: string[]; installation?: string; usage?: string; license?: string; author?: string; }

export class ReadmeGenerator extends EventEmitter {
    private static instance: ReadmeGenerator;
    private constructor() { super(); }
    static getInstance(): ReadmeGenerator { if (!ReadmeGenerator.instance) ReadmeGenerator.instance = new ReadmeGenerator(); return ReadmeGenerator.instance; }

    generate(config: ReadmeConfig): string {
        let readme = `# ${config.name}\n\n${config.description}\n\n`;
        if (config.features?.length) readme += `## Features\n\n${config.features.map(f => `- ${f}`).join('\n')}\n\n`;
        if (config.installation) readme += `## Installation\n\n\`\`\`bash\n${config.installation}\n\`\`\`\n\n`;
        if (config.usage) readme += `## Usage\n\n\`\`\`\n${config.usage}\n\`\`\`\n\n`;
        if (config.license) readme += `## License\n\n${config.license}\n\n`;
        if (config.author) readme += `## Author\n\n${config.author}\n`;
        return readme;
    }

    generateFromPackageJson(pkg: any): string {
        return this.generate({ name: pkg.name, description: pkg.description || '', license: pkg.license, author: pkg.author });
    }
}

export function getReadmeGenerator(): ReadmeGenerator { return ReadmeGenerator.getInstance(); }
