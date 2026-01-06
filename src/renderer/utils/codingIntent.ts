/**
 * Shadow AI - Intent Detection & Command Parser
 * Makes Shadow AI action-oriented instead of conversational
 */

export interface CodingIntent {
    shouldCode: boolean;
    action?: 'create_project' | 'generate_code' | 'create_react' | 'create_next' | 'force_code_generation' | 'export_code' | 'build_apk' | 'build_exe' | 'docker_command' | 'flutter_command' | 'swarm_command' | 'search_command' | 'sandbox_command' | 'inspect_command';
    params?: any;
}

/**
 * Detect if user wants to CODE, not CHAT
 */
export function detectCodingIntent(userPrompt: string): CodingIntent {
    const lower = userPrompt.toLowerCase().trim();

    // SLASH COMMANDS - Direct actions
    if (lower.startsWith('/')) {
        const parts = userPrompt.trim().split(' ');
        const command = parts[0].toLowerCase();
        const args = parts.slice(1).join(' ');

        // PROJECT CREATION
        if (command === '/create' || command === '/build') {
            return { shouldCode: true, action: 'create_project', params: { description: args } };
        }
        if (command === '/code') {
            return { shouldCode: true, action: 'generate_code', params: { task: args } };
        }
        if (command === '/react') {
            return { shouldCode: true, action: 'create_react', params: { name: args } };
        }
        if (command === '/next') {
            return { shouldCode: true, action: 'create_next', params: { name: args } };
        }

        // EXPORT/BUILD COMMANDS
        if (command === '/export') {
            const format = args.toLowerCase() || 'html';
            return { shouldCode: true, action: 'export_code', params: { format } };
        }
        if (command === '/apk') {
            return { shouldCode: true, action: 'build_apk', params: { path: args || './' } };
        }
        if (command === '/exe') {
            return { shouldCode: true, action: 'build_exe', params: { path: args || './' } };
        }
        // DOCKER COMMANDS
        if (command === '/docker') {
            const subCommand = args.split(' ')[0] || 'build';
            const dockerArgs = args.split(' ').slice(1).join(' ');
            return { shouldCode: true, action: 'docker_command', params: { subCommand, args: dockerArgs } };
        }
        // FLUTTER COMMANDS
        if (command === '/flutter') {
            const subCommand = args.split(' ')[0] || 'create';
            const flutterArgs = args.split(' ').slice(1).join(' ');
            return { shouldCode: true, action: 'flutter_command', params: { subCommand, args: flutterArgs } };
        }
        // SWARM COMMANDS - Multi-agent collaboration
        if (command === '/swarm') {
            const subCommand = args.split(' ')[0] || 'agents';
            const swarmArgs = args.split(' ').slice(1).join(' ');
            return { shouldCode: true, action: 'swarm_command', params: { subCommand, args: swarmArgs } };
        }
        // SEMANTIC SEARCH COMMANDS
        if (command === '/search') {
            return { shouldCode: true, action: 'search_command', params: { query: args } };
        }
        // SANDBOX COMMANDS
        if (command === '/run' || command === '/exec') {
            return { shouldCode: true, action: 'sandbox_command', params: { command: args } };
        }
        // INSPECTOR COMMANDS
        if (command === '/inspect' || command === '/debug') {
            return { shouldCode: true, action: 'inspect_command', params: { target: args } };
        }
    }

    // Strong coding keywords - trigger autonomous action
    const codingKeywords = [
        'build', 'create', 'make', 'code', 'write', 'implement',
        'develop', 'generate', 'program', 'design a', 'construct'
    ];

    const hasCodeKeyword = codingKeywords.some(keyword => {
        const regex = new RegExp(`(^|[\\s,.!?])${keyword}(\\s|$)`, 'i');
        return regex.test(userPrompt);
    });

    if (hasCodeKeyword) {
        const projectTypes = ['app', 'website', 'component', 'page', 'dashboard', 'calculator', 'game', 'tool', 'api', 'server'];
        const hasProjectType = projectTypes.some(type => lower.includes(type));

        if (hasProjectType) {
            return { shouldCode: true, action: 'create_project', params: { description: userPrompt } };
        }
        return { shouldCode: true, action: 'force_code_generation' };
    }

    return { shouldCode: false };
}

/**
 * FAST, action-oriented system prompt (shortened for speed)
 */
export function getActionOrientedPrompt(isCodingMode: boolean): string {
    // SHORT prompt = FASTER responses
    return `You are Shadow AI v4.0, an AUTONOMOUS MULTI-AGENT SWARM.${isCodingMode ? ' CODE MODE ACTIVE!' : ''}

RULES:
1. ALWAYS output code in \`\`\`language blocks
2. Generate COMPLETE, runnable code - no pseudocode
3. NO explanations - just ACTION
4. Use diff format for surgical edits when modifying files

ADVANCED CAPABILITIES:
- Multi-Agent Swarm: 8 specialized agents bid on tasks and debate solutions
- Semantic Code Search: /search query - find similar code across projects
- Sandboxed Execution: /run command - commands run in zero-trust sandbox
- Live Debugging: /inspect - attach to running processes
- Diff Editing: Generate diffs instead of full file replacements

SLASH COMMANDS:
/swarm agents|auction|debate - Multi-agent collaboration
/search [query] - Semantic code search
/run [command] - Sandboxed execution
/inspect - Runtime introspection
/flutter create|run|build
/docker build|run|status

OUTPUT CODE NOW!`;
}
