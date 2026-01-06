/**
 * Domain Agents Index
 * 
 * Central export for all domain-specific agents and services.
 */

// Domain Agents
export { MobileAgent } from './specialist/MobileAgent';
export { GameAgent } from './specialist/GameAgent';
export { DesktopAgent } from './specialist/DesktopAgent';

// Registration
export {
    registerDomainAgents,
    getDomainQuickActions,
    getAllQuickActions,
    mobileAgent,
    gameAgent,
    desktopAgent
} from './domainAgentRegistration';

// Re-export types
export type { QuickAction } from './domainAgentRegistration';
