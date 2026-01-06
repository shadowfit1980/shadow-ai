
import { ipcMain, app } from 'electron';
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(app.getPath('userData'), 'shadow-data');

async function ensureDataDir() {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }
}

async function readJson(filename: string, fallback: any) {
    await ensureDataDir();
    const filePath = path.join(DATA_DIR, filename);
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch {
        return fallback;
    }
}

async function writeJson(filename: string, data: any) {
    await ensureDataDir();
    const filePath = path.join(DATA_DIR, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export function setupPersistenceHandlers() {
    // Custom Agents
    ipcMain.handle('agents:getCustom', async () => {
        return readJson('custom_agents.json', []);
    });

    ipcMain.handle('agents:saveCustom', async (_, agent) => {
        const agents = await readJson('custom_agents.json', []);
        const index = agents.findIndex((a: any) => a.id === agent.id);
        if (index >= 0) {
            agents[index] = agent;
        } else {
            agents.push(agent);
        }
        await writeJson('custom_agents.json', agents);
        return true;
    });

    ipcMain.handle('agents:deleteCustom', async (_, id) => {
        const agents = await readJson('custom_agents.json', []);
        const newAgents = agents.filter((a: any) => a.id !== id);
        await writeJson('custom_agents.json', newAgents);
        return true;
    });

    // Prompts
    ipcMain.handle('prompts:getTemplates', async () => {
        return readJson('prompt_templates.json', []);
    });

    ipcMain.handle('prompts:saveTemplate', async (_, template) => {
        const templates = await readJson('prompt_templates.json', []);
        const index = templates.findIndex((t: any) => t.id === template.id);
        if (index >= 0) {
            templates[index] = template;
        } else {
            templates.push(template);
        }
        await writeJson('prompt_templates.json', templates);
        return true;
    });

    ipcMain.handle('prompts:deleteTemplate', async (_, id) => {
        const templates = await readJson('prompt_templates.json', []);
        const newTemplates = templates.filter((t: any) => t.id !== id);
        await writeJson('prompt_templates.json', newTemplates);
        return true;
    });
}
