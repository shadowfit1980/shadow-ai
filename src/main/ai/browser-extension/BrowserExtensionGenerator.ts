// Browser Extension Generator - Generate browser extension boilerplate
import Anthropic from '@anthropic-ai/sdk';

interface ExtensionConfig {
    name: string;
    description: string;
    version: string;
    permissions: string[];
    hasPopup?: boolean;
    hasBackground?: boolean;
    hasContentScript?: boolean;
    hasOptionsPage?: boolean;
}

class BrowserExtensionGenerator {
    private anthropic: Anthropic | null = null;

    private getClient(): Anthropic {
        if (!this.anthropic) {
            this.anthropic = new Anthropic();
        }
        return this.anthropic;
    }

    generateManifestV3(config: ExtensionConfig): string {
        return JSON.stringify({
            "manifest_version": 3,
            "name": config.name,
            "version": config.version,
            "description": config.description,
            "permissions": config.permissions,
            "action": config.hasPopup ? {
                "default_popup": "popup.html",
                "default_icon": {
                    "16": "icons/icon16.png",
                    "48": "icons/icon48.png",
                    "128": "icons/icon128.png"
                }
            } : undefined,
            "background": config.hasBackground ? {
                "service_worker": "background.js",
                "type": "module"
            } : undefined,
            "content_scripts": config.hasContentScript ? [{
                "matches": ["<all_urls>"],
                "js": ["content.js"],
                "css": ["content.css"]
            }] : undefined,
            "options_page": config.hasOptionsPage ? "options.html" : undefined,
            "icons": {
                "16": "icons/icon16.png",
                "48": "icons/icon48.png",
                "128": "icons/icon128.png"
            },
            "host_permissions": ["<all_urls>"]
        }, null, 2);
    }

    generatePopupHTML(config: ExtensionConfig): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.name}</title>
    <link rel="stylesheet" href="popup.css">
</head>
<body>
    <div class="container">
        <header>
            <img src="icons/icon48.png" alt="${config.name}" class="logo">
            <h1>${config.name}</h1>
        </header>
        
        <main>
            <div class="status" id="status">
                <span class="status-dot"></span>
                <span class="status-text">Active</span>
            </div>
            
            <div class="controls">
                <button id="toggleBtn" class="btn btn-primary">
                    Toggle Extension
                </button>
                <button id="settingsBtn" class="btn btn-secondary">
                    Settings
                </button>
            </div>
            
            <div class="info">
                <p>Version ${config.version}</p>
            </div>
        </main>
    </div>
    <script src="popup.js" type="module"></script>
</body>
</html>
`;
    }

    generatePopupCSS(): string {
        return `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    width: 320px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    color: #fff;
}

.container {
    padding: 1.5rem;
}

header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
}

.logo {
    width: 32px;
    height: 32px;
}

h1 {
    font-size: 1.25rem;
    font-weight: 600;
}

.status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    margin-bottom: 1rem;
}

.status-dot {
    width: 8px;
    height: 8px;
    background: #4ade80;
    border-radius: 50%;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

.controls {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

.btn {
    padding: 0.75rem 1rem;
    border: none;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
    background: rgba(255, 255, 255, 0.1);
    color: white;
}

.btn-secondary:hover {
    background: rgba(255, 255, 255, 0.2);
}

.info {
    text-align: center;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.5);
}
`;
    }

    generatePopupJS(): string {
        return `// Popup Script
document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('toggleBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');

    // Load current state
    chrome.storage.local.get(['isEnabled'], (result) => {
        updateStatus(result.isEnabled !== false);
    });

    // Toggle extension
    toggleBtn.addEventListener('click', async () => {
        const { isEnabled } = await chrome.storage.local.get(['isEnabled']);
        const newState = !isEnabled;
        
        await chrome.storage.local.set({ isEnabled: newState });
        updateStatus(newState);
        
        // Notify background script
        chrome.runtime.sendMessage({ type: 'TOGGLE', enabled: newState });
    });

    // Open settings
    settingsBtn.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });

    function updateStatus(isEnabled) {
        statusDot.style.background = isEnabled ? '#4ade80' : '#f87171';
        statusText.textContent = isEnabled ? 'Active' : 'Disabled';
        toggleBtn.textContent = isEnabled ? 'Disable' : 'Enable';
    }
});
`;
    }

    generateBackgroundScript(): string {
        return `// Background Service Worker
chrome.runtime.onInstalled.addListener((details) => {
    console.log('[Extension] Installed:', details.reason);
    
    // Set default state
    chrome.storage.local.set({
        isEnabled: true,
        settings: {
            notifications: true,
            autoStart: true
        }
    });
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[Background] Message received:', message);

    switch (message.type) {
        case 'TOGGLE':
            handleToggle(message.enabled);
            sendResponse({ success: true });
            break;
            
        case 'GET_DATA':
            getData().then(sendResponse);
            return true; // Keep channel open for async response
            
        case 'EXECUTE_ACTION':
            executeAction(message.action, sender.tab?.id)
                .then(sendResponse)
                .catch(err => sendResponse({ error: err.message }));
            return true;
            
        default:
            sendResponse({ error: 'Unknown message type' });
    }
});

// Handle tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        chrome.storage.local.get(['isEnabled'], (result) => {
            if (result.isEnabled) {
                injectContentScript(tabId);
            }
        });
    }
});

async function handleToggle(enabled) {
    console.log('[Background] Extension', enabled ? 'enabled' : 'disabled');
    
    if (enabled) {
        // Re-inject content scripts into existing tabs
        const tabs = await chrome.tabs.query({ url: '<all_urls>' });
        tabs.forEach(tab => {
            if (tab.id) injectContentScript(tab.id);
        });
    }
}

async function getData() {
    const data = await chrome.storage.local.get(null);
    return { data };
}

async function executeAction(action, tabId) {
    if (!tabId) throw new Error('No tab ID');
    
    return chrome.tabs.sendMessage(tabId, { type: 'EXECUTE', action });
}

async function injectContentScript(tabId) {
    try {
        await chrome.scripting.executeScript({
            target: { tabId },
            files: ['content.js']
        });
    } catch (err) {
        console.log('[Background] Could not inject script:', err.message);
    }
}
`;
    }

    generateContentScript(): string {
        return `// Content Script - Runs in the context of web pages
(function() {
    'use strict';

    // Prevent multiple injections
    if (window.__extensionInjected) return;
    window.__extensionInjected = true;

    console.log('[Content] Script loaded on:', window.location.href);

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log('[Content] Message received:', message);

        switch (message.type) {
            case 'EXECUTE':
                executeAction(message.action)
                    .then(sendResponse)
                    .catch(err => sendResponse({ error: err.message }));
                return true;
                
            case 'GET_PAGE_INFO':
                sendResponse({
                    title: document.title,
                    url: window.location.href,
                    text: document.body.innerText.substring(0, 1000)
                });
                break;
                
            default:
                sendResponse({ error: 'Unknown action' });
        }
    });

    async function executeAction(action) {
        switch (action) {
            case 'highlight':
                highlightElements();
                return { success: true };
                
            case 'extract':
                return extractData();
                
            case 'modify':
                modifyPage();
                return { success: true };
                
            default:
                throw new Error(\`Unknown action: \${action}\`);
        }
    }

    function highlightElements() {
        const elements = document.querySelectorAll('a, button, input');
        elements.forEach(el => {
            el.style.outline = '2px solid #667eea';
        });
    }

    function extractData() {
        return {
            links: Array.from(document.querySelectorAll('a')).map(a => ({
                text: a.textContent?.trim(),
                href: a.href
            })).slice(0, 50),
            images: Array.from(document.querySelectorAll('img')).map(img => ({
                alt: img.alt,
                src: img.src
            })).slice(0, 20)
        };
    }

    function modifyPage() {
        // Add custom styles
        const style = document.createElement('style');
        style.textContent = \`
            .extension-highlight {
                background: linear-gradient(135deg, #667eea33 0%, #764ba233 100%) !important;
            }
        \`;
        document.head.appendChild(style);
    }

    // Initialize
    console.log('[Content] Extension initialized');
})();
`;
    }

    generateOptionsPage(config: ExtensionConfig): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.name} - Settings</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 600px;
            margin: 2rem auto;
            padding: 0 1rem;
            background: #f5f5f5;
        }
        h1 { color: #1a1a2e; }
        .setting {
            background: white;
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 0.5rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .switch {
            width: 48px;
            height: 24px;
            background: #ccc;
            border-radius: 12px;
            position: relative;
            cursor: pointer;
        }
        .switch.active { background: #667eea; }
        .switch::after {
            content: '';
            position: absolute;
            width: 20px;
            height: 20px;
            background: white;
            border-radius: 50%;
            top: 2px;
            left: 2px;
            transition: transform 0.2s;
        }
        .switch.active::after { transform: translateX(24px); }
        button {
            background: #667eea;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            cursor: pointer;
            margin-top: 1rem;
        }
    </style>
</head>
<body>
    <h1>⚙️ ${config.name} Settings</h1>
    
    <div class="setting">
        <span>Enable notifications</span>
        <div class="switch" id="notificationToggle"></div>
    </div>
    
    <div class="setting">
        <span>Auto-start on browser launch</span>
        <div class="switch" id="autoStartToggle"></div>
    </div>
    
    <div class="setting">
        <span>Dark mode</span>
        <div class="switch" id="darkModeToggle"></div>
    </div>
    
    <button id="saveBtn">Save Settings</button>
    
    <script>
        const settings = {};
        
        document.querySelectorAll('.switch').forEach(sw => {
            sw.addEventListener('click', () => {
                sw.classList.toggle('active');
                settings[sw.id] = sw.classList.contains('active');
            });
        });
        
        document.getElementById('saveBtn').addEventListener('click', () => {
            chrome.storage.local.set({ settings }, () => {
                alert('Settings saved!');
            });
        });
        
        // Load settings
        chrome.storage.local.get(['settings'], (result) => {
            if (result.settings) {
                Object.entries(result.settings).forEach(([key, value]) => {
                    const sw = document.getElementById(key + 'Toggle');
                    if (sw && value) sw.classList.add('active');
                });
            }
        });
    </script>
</body>
</html>
`;
    }
}

export const browserExtensionGenerator = new BrowserExtensionGenerator();
