/**
 * 📖 README Generator
 * 
 * Generate README files:
 * - Badges, sections, templates
 */

import { EventEmitter } from 'events';

interface ReadmeConfig {
    name: string;
    description: string;
    license?: string;
    features?: string[];
    installation?: string;
    usage?: string;
    badges?: string[];
}

export class ReadmeGenerator extends EventEmitter {
    private static instance: ReadmeGenerator;

    private constructor() { super(); }

    static getInstance(): ReadmeGenerator {
        if (!ReadmeGenerator.instance) {
            ReadmeGenerator.instance = new ReadmeGenerator();
        }
        return ReadmeGenerator.instance;
    }

    generate(config: ReadmeConfig): string {
        const slug = config.name.toLowerCase().replace(/\s+/g, '-');
        const license = config.license || 'MIT';
        const features = (config.features || ['Feature 1', 'Feature 2']).map(f => `- ${f}`).join('\n');
        const installation = config.installation || `npm install ${slug}`;
        const usage = config.usage || `import { ${config.name.replace(/\s+/g, '')} } from '${slug}';\n\n// Your code here`;

        const badges = [
            `![npm version](https://img.shields.io/npm/v/${slug})`,
            `![License](https://img.shields.io/badge/license-${license}-blue)`,
            `![Build Status](https://img.shields.io/github/actions/workflow/status/org/${slug}/ci.yml)`
        ].join(' ');

        return `# ${config.name}

${badges}

${config.description}

## ✨ Features

${features}

## 📦 Installation

\`\`\`bash
${installation}
\`\`\`

## 🚀 Quick Start

\`\`\`typescript
${usage}
\`\`\`

## 📚 Documentation

For full documentation, visit [docs](./docs/README.md).

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) first.

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ${license} License - see the [LICENSE](./LICENSE) file for details.

---

Made with [Shadow AI](https://github.com/shadow-ai)
`;
    }

    generateContributing(): string {
        return `# Contributing Guide

## Getting Started

1. Fork the repository
2. Clone your fork: \`git clone https://github.com/YOUR_USERNAME/REPO.git\`
3. Install dependencies: \`npm install\`
4. Create a branch: \`git checkout -b feature/your-feature\`

## Development

\`\`\`bash
# Start development server
npm run dev

# Run tests
npm test

# Run linter
npm run lint

# Build
npm run build
\`\`\`

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

- \`feat:\` New feature
- \`fix:\` Bug fix
- \`docs:\` Documentation
- \`style:\` Code style (formatting)
- \`refactor:\` Code refactoring
- \`test:\` Tests
- \`chore:\` Maintenance

## Pull Request Process

1. Update documentation if needed
2. Add tests for new features
3. Ensure all tests pass
4. Update CHANGELOG.md
5. Request review from maintainers

## Code of Conduct

Be respectful and inclusive. Report unacceptable behavior to maintainers.
`;
    }
}

export const readmeGenerator = ReadmeGenerator.getInstance();
