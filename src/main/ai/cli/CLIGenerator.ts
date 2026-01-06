// CLI Generator - Generate CLI applications with Commander.js
import Anthropic from '@anthropic-ai/sdk';

interface CLIConfig {
    name: string;
    version: string;
    description: string;
    commands: Array<{
        name: string;
        description: string;
        options?: Array<{
            flags: string;
            description: string;
            defaultValue?: string;
        }>;
        arguments?: Array<{
            name: string;
            description: string;
            required?: boolean;
        }>;
    }>;
}

class CLIGenerator {
    private anthropic: Anthropic | null = null;

    private getClient(): Anthropic {
        if (!this.anthropic) {
            this.anthropic = new Anthropic();
        }
        return this.anthropic;
    }

    generateCommanderCLI(config: CLIConfig): string {
        const commands = config.commands.map(cmd => {
            const options = (cmd.options || []).map(opt =>
                `    .option('${opt.flags}', '${opt.description}'${opt.defaultValue ? `, '${opt.defaultValue}'` : ''})`
            ).join('\n');

            const args = (cmd.arguments || []).map(arg =>
                `    .argument('${arg.required ? '<' : '['}${arg.name}${arg.required ? '>' : ']'}', '${arg.description}')`
            ).join('\n');

            return `
program
    .command('${cmd.name}')
    .description('${cmd.description}')
${args}
${options}
    .action(async (${cmd.arguments?.map(a => a.name).join(', ') || ''}, options) => {
        try {
            console.log(\`Executing ${cmd.name}...\`);
            // TODO: Implement ${cmd.name} logic
        } catch (error) {
            console.error(\`Error: \${error.message}\`);
            process.exit(1);
        }
    });`;
        }).join('\n');

        return `#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';

const program = new Command();

program
    .name('${config.name}')
    .version('${config.version}')
    .description('${config.description}');
${commands}

// Global error handler
program.hook('preAction', () => {
    console.log(chalk.blue('\\n🚀 ${config.name}\\n'));
});

program.hook('postAction', () => {
    console.log(chalk.green('\\n✅ Done!\\n'));
});

program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
    program.help();
}
`;
    }

    generateInteractiveCLI(name: string): string {
        return `#!/usr/bin/env node
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import gradient from 'gradient-string';
import figlet from 'figlet';

async function main() {
    // Display banner
    console.log(
        gradient.pastel.multiline(
            figlet.textSync('${name}', { horizontalLayout: 'full' })
        )
    );
    console.log('');

    // Main menu
    const { action } = await inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'What would you like to do?',
            choices: [
                { name: '🚀 Create new project', value: 'create' },
                { name: '📦 Install dependencies', value: 'install' },
                { name: '🔧 Configure settings', value: 'config' },
                { name: '🏃 Run development server', value: 'dev' },
                { name: '📤 Deploy to production', value: 'deploy' },
                new inquirer.Separator(),
                { name: '❌ Exit', value: 'exit' },
            ],
        },
    ]);

    switch (action) {
        case 'create':
            await handleCreate();
            break;
        case 'install':
            await handleInstall();
            break;
        case 'config':
            await handleConfig();
            break;
        case 'dev':
            await handleDev();
            break;
        case 'deploy':
            await handleDeploy();
            break;
        case 'exit':
            console.log(chalk.yellow('\\nGoodbye! 👋\\n'));
            process.exit(0);
    }

    // Ask if user wants to continue
    const { continueSession } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'continueSession',
            message: 'Would you like to perform another action?',
            default: true,
        },
    ]);

    if (continueSession) {
        await main();
    }
}

async function handleCreate() {
    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'projectName',
            message: 'Project name:',
            validate: (input) => input.length > 0 || 'Project name is required',
        },
        {
            type: 'list',
            name: 'template',
            message: 'Select a template:',
            choices: ['React', 'Next.js', 'Vue', 'Express', 'NestJS'],
        },
        {
            type: 'checkbox',
            name: 'features',
            message: 'Select features:',
            choices: ['TypeScript', 'ESLint', 'Prettier', 'Testing', 'Docker'],
        },
    ]);

    const spinner = ora('Creating project...').start();
    
    try {
        // Simulate project creation
        await new Promise((resolve) => setTimeout(resolve, 2000));
        spinner.succeed(chalk.green(\`Project "\${answers.projectName}" created successfully!\`));
    } catch (error) {
        spinner.fail(chalk.red('Failed to create project'));
    }
}

async function handleInstall() {
    const spinner = ora('Installing dependencies...').start();
    await new Promise((resolve) => setTimeout(resolve, 1500));
    spinner.succeed('Dependencies installed');
}

async function handleConfig() {
    const config = await inquirer.prompt([
        {
            type: 'input',
            name: 'apiUrl',
            message: 'API URL:',
            default: 'http://localhost:3000',
        },
        {
            type: 'confirm',
            name: 'enableDebug',
            message: 'Enable debug mode?',
            default: false,
        },
    ]);
    console.log(chalk.green('\\nConfiguration saved:'), config);
}

async function handleDev() {
    console.log(chalk.blue('\\nStarting development server...\\n'));
    console.log(chalk.gray('Press Ctrl+C to stop\\n'));
}

async function handleDeploy() {
    const { environment } = await inquirer.prompt([
        {
            type: 'list',
            name: 'environment',
            message: 'Select environment:',
            choices: ['staging', 'production'],
        },
    ]);
    
    const spinner = ora(\`Deploying to \${environment}...\`).start();
    await new Promise((resolve) => setTimeout(resolve, 3000));
    spinner.succeed(\`Deployed to \${environment}\`);
}

main().catch((error) => {
    console.error(chalk.red('\\nError:'), error.message);
    process.exit(1);
});
`;
    }

    generatePackageJson(config: CLIConfig): string {
        return JSON.stringify({
            name: config.name,
            version: config.version,
            description: config.description,
            type: 'module',
            bin: {
                [config.name]: './dist/cli.js'
            },
            scripts: {
                build: 'tsc',
                dev: 'ts-node src/cli.ts',
                start: 'node dist/cli.js',
                prepublishOnly: 'npm run build'
            },
            dependencies: {
                commander: '^12.0.0',
                chalk: '^5.3.0',
                ora: '^8.0.1',
                inquirer: '^9.2.0',
                'gradient-string': '^2.0.2',
                figlet: '^1.7.0'
            },
            devDependencies: {
                '@types/node': '^20.0.0',
                '@types/inquirer': '^9.0.0',
                '@types/figlet': '^1.5.0',
                typescript: '^5.0.0',
                'ts-node': '^10.9.0'
            },
            engines: {
                node: '>=18.0.0'
            },
            keywords: ['cli', 'command-line', 'tool']
        }, null, 2);
    }

    generateTsConfig(): string {
        return JSON.stringify({
            compilerOptions: {
                target: 'ES2022',
                module: 'ESNext',
                moduleResolution: 'node',
                lib: ['ES2022'],
                outDir: './dist',
                rootDir: './src',
                strict: true,
                esModuleInterop: true,
                skipLibCheck: true,
                declaration: true
            },
            include: ['src/**/*'],
            exclude: ['node_modules', 'dist']
        }, null, 2);
    }
}

export const cliGenerator = new CLIGenerator();
