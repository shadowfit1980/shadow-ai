/**
 * Domain Agent Registration
 * 
 * Registers MobileAgent, GameAgent, and DesktopAgent with the Dispatcher
 * for task orchestration. Call this during app initialization.
 */

import { Dispatcher, dispatcher } from '../orchestration/Dispatcher';
import { MobileAgent } from '../agents/specialist/MobileAgent';
import { GameAgent } from '../agents/specialist/GameAgent';
import { DesktopAgent } from '../agents/specialist/DesktopAgent';

// Create agent instances
const mobileAgent = new MobileAgent();
const gameAgent = new GameAgent();
const desktopAgent = new DesktopAgent();

/**
 * Register all domain-specific agents with the dispatcher
 */
export function registerDomainAgents(): void {
    // Register MobileAgent
    dispatcher.registerAgent(
        'MobileAgent',
        mobileAgent,
        mobileAgent.capabilities.map(c => c.name)
    );

    // Register GameAgent
    dispatcher.registerAgent(
        'GameAgent',
        gameAgent,
        gameAgent.capabilities.map(c => c.name)
    );

    // Register DesktopAgent
    dispatcher.registerAgent(
        'DesktopAgent',
        desktopAgent,
        desktopAgent.capabilities.map(c => c.name)
    );

    console.log('✅ Domain agents registered with Dispatcher');
    console.log(`   - MobileAgent: ${mobileAgent.capabilities.length} capabilities`);
    console.log(`   - GameAgent: ${gameAgent.capabilities.length} capabilities`);
    console.log(`   - DesktopAgent: ${desktopAgent.capabilities.length} capabilities`);
}

/**
 * Get quick actions for a specific domain
 */
export function getDomainQuickActions(domain: 'mobile' | 'game' | 'desktop'): QuickAction[] {
    const actions: Record<string, QuickAction[]> = {
        mobile: [
            { id: 'mobile_detect', label: 'Detect Platform', icon: '🔍', agent: 'MobileAgent', action: 'detect_platform' },
            { id: 'mobile_component', label: 'Generate Component', icon: '🧩', agent: 'MobileAgent', action: 'generate_component' },
            { id: 'mobile_aso', label: 'App Store Optimize', icon: '📈', agent: 'MobileAgent', action: 'aso_optimize' },
            { id: 'mobile_perf', label: 'Analyze Performance', icon: '⚡', agent: 'MobileAgent', action: 'analyze_performance' },
        ],
        game: [
            { id: 'game_detect', label: 'Detect Engine', icon: '🎮', agent: 'GameAgent', action: 'detect_engine' },
            { id: 'game_procedural', label: 'Procedural Content', icon: '🌍', agent: 'GameAgent', action: 'procedural_generate' },
            { id: 'game_multiplayer', label: 'Multiplayer Design', icon: '👥', agent: 'GameAgent', action: 'design_multiplayer' },
            { id: 'game_balance', label: 'Balance Analysis', icon: '⚖️', agent: 'GameAgent', action: 'analyze_balance' },
        ],
        desktop: [
            { id: 'desktop_detect', label: 'Detect Framework', icon: '🖥️', agent: 'DesktopAgent', action: 'detect_framework' },
            { id: 'desktop_installer', label: 'Create Installer', icon: '📦', agent: 'DesktopAgent', action: 'create_installer' },
            { id: 'desktop_native', label: 'Native Binding', icon: '🔗', agent: 'DesktopAgent', action: 'generate_binding' },
            { id: 'desktop_crossplat', label: 'Cross-Platform', icon: '🌐', agent: 'DesktopAgent', action: 'analyze_crossplatform' },
        ]
    };

    return actions[domain] || [];
}

/**
 * Get all available quick actions
 */
export function getAllQuickActions(): QuickAction[] {
    return [
        ...getDomainQuickActions('mobile'),
        ...getDomainQuickActions('game'),
        ...getDomainQuickActions('desktop')
    ];
}

export interface QuickAction {
    id: string;
    label: string;
    icon: string;
    agent: string;
    action: string;
    description?: string;
}

// Export agent instances for direct access if needed
export { mobileAgent, gameAgent, desktopAgent };
