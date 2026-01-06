/**
 * Custom Agent IPC Handlers
 * 
 * IPC handlers for managing custom AI agents
 */

import { ipcMain } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import { app } from 'electron';

interface CustomAgent {
    id: string;
    name: string;
    description: string;
    icon: string;
    systemPrompt: string;
    model: string;
    temperature: number;
    capabilities: string[];
    examples: { input: string; output: string }[];
    createdAt: Date;
    usageCount: number;
}

const getAgentsDir = () => path.join(app.getPath('userData'), 'custom-agents');
const getAgentsFile = () => path.join(getAgentsDir(), 'agents.json');

async function ensureAgentsDir() {
    await fs.mkdir(getAgentsDir(), { recursive: true });
}

async function loadAgents(): Promise<CustomAgent[]> {
    try {
        await ensureAgentsDir();
        const data = await fs.readFile(getAgentsFile(), 'utf-8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

async function saveAgents(agents: CustomAgent[]) {
    await ensureAgentsDir();
    await fs.writeFile(getAgentsFile(), JSON.stringify(agents, null, 2));
}

export function registerCustomAgentHandlers() {
    ipcMain.handle('agents:getCustomAgents', async () => {
        return loadAgents();
    });

    ipcMain.handle('agents:saveCustomAgent', async (_, agent: CustomAgent) => {
        const agents = await loadAgents();
        const existingIndex = agents.findIndex(a => a.id === agent.id);

        if (existingIndex >= 0) {
            agents[existingIndex] = agent;
        } else {
            agents.push(agent);
        }

        await saveAgents(agents);
        return agent;
    });

    ipcMain.handle('agents:deleteCustomAgent', async (_, id: string) => {
        const agents = await loadAgents();
        const filtered = agents.filter(a => a.id !== id);
        await saveAgents(filtered);
        return true;
    });

    ipcMain.handle('agents:getAgent', async (_, id: string) => {
        const agents = await loadAgents();
        return agents.find(a => a.id === id) || null;
    });

    ipcMain.handle('agents:incrementUsage', async (_, id: string) => {
        const agents = await loadAgents();
        const agent = agents.find(a => a.id === id);
        if (agent) {
            agent.usageCount = (agent.usageCount || 0) + 1;
            await saveAgents(agents);
        }
        return true;
    });
}
