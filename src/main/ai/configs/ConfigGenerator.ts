/**
 * Config Generator
 * 
 * Generate configuration files for ESLint, Prettier, TypeScript, etc.
 */

import { EventEmitter } from 'events';

interface ConfigOptions {
    framework?: 'react' | 'vue' | 'node';
    typescript?: boolean;
    style?: 'airbnb' | 'standard' | 'google';
}

export class ConfigGenerator extends EventEmitter {
    private static instance: ConfigGenerator;

    private constructor() { super(); }

    static getInstance(): ConfigGenerator {
        if (!ConfigGenerator.instance) {
            ConfigGenerator.instance = new ConfigGenerator();
        }
        return ConfigGenerator.instance;
    }

    generateESLint(options: ConfigOptions = {}): string {
        const config: any = {
            env: { browser: true, es2022: true, node: true },
            extends: ['eslint:recommended'],
            parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
            rules: {
                'no-unused-vars': 'warn',
                'no-console': ['warn', { allow: ['warn', 'error'] }]
            }
        };

        if (options.typescript) {
            config.parser = '@typescript-eslint/parser';
            config.extends.push('plugin:@typescript-eslint/recommended');
            config.plugins = ['@typescript-eslint'];
        }

        if (options.framework === 'react') {
            config.extends.push('plugin:react/recommended', 'plugin:react-hooks/recommended');
            config.settings = { react: { version: 'detect' } };
        }

        return JSON.stringify(config, null, 2);
    }

    generatePrettier(): string {
        return JSON.stringify({
            semi: true,
            singleQuote: true,
            tabWidth: 2,
            trailingComma: 'es5',
            printWidth: 100,
            bracketSpacing: true,
            arrowParens: 'avoid'
        }, null, 2);
    }

    generateEditorConfig(): string {
        return `root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false
`;
    }

    generateGitignore(type: 'node' | 'python' | 'full' = 'node'): string {
        const common = ['node_modules/', 'dist/', 'build/', '.env', '.env.local', '*.log', '.DS_Store'];
        if (type === 'node') {
            return [...common, 'coverage/', '.next/', '.turbo/'].join('\n');
        }
        if (type === 'python') {
            return [...common, '__pycache__/', '*.pyc', 'venv/', '.pytest_cache/'].join('\n');
        }
        return [...common, 'coverage/', '.next/', '.turbo/', '__pycache__/', '*.pyc', 'venv/'].join('\n');
    }

    generateHuskyConfig(): string {
        return `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
`;
    }

    generateLintStaged(): string {
        return JSON.stringify({
            '*.{js,jsx,ts,tsx}': ['eslint --fix', 'prettier --write'],
            '*.{json,md,css,scss}': ['prettier --write']
        }, null, 2);
    }

    generateVSCodeSettings(): string {
        return JSON.stringify({
            'editor.formatOnSave': true,
            'editor.defaultFormatter': 'esbenp.prettier-vscode',
            'editor.codeActionsOnSave': { 'source.fixAll.eslint': true },
            'typescript.preferences.importModuleSpecifier': 'relative'
        }, null, 2);
    }
}

export const configGenerator = ConfigGenerator.getInstance();
