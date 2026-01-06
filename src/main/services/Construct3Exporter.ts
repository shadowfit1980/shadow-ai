/**
 * 🎮 Construct 3 Exporter
 * 
 * Export to Construct 3:
 * - JSON project format
 * - Event sheets
 * - Object definitions
 */

import { EventEmitter } from 'events';

export class Construct3Exporter extends EventEmitter {
    private static instance: Construct3Exporter;

    private constructor() { super(); }

    static getInstance(): Construct3Exporter {
        if (!Construct3Exporter.instance) {
            Construct3Exporter.instance = new Construct3Exporter();
        }
        return Construct3Exporter.instance;
    }

    exportToConstruct3(gameDef: any): { project: any; eventSheets: any[] } {
        return {
            project: this.generateProject(gameDef),
            eventSheets: this.generateEventSheets(gameDef)
        };
    }

    private generateProject(gameDef: any): any {
        const name = gameDef?.name || 'MyGame';
        return {
            projectFormatVersion: 1,
            savedWithRelease: 33100,
            name: name,
            runtime: "c3",
            useWorker: "auto",
            bundleAddons: false,
            usedAddons: [
                { type: "plugin", id: "Sprite" },
                { type: "plugin", id: "Keyboard" },
                { type: "plugin", id: "Mouse" },
                { type: "plugin", id: "Text" },
                { type: "behavior", id: "Platform" },
                { type: "behavior", id: "solid" },
                { type: "behavior", id: "Bullet" }
            ],
            uniqueId: "project_" + Date.now(),
            objectTypes: {
                items: this.generateObjectTypes(gameDef)
            },
            containers: [],
            families: {
                items: []
            },
            layouts: {
                items: [
                    {
                        name: "MainLayout",
                        width: 800,
                        height: 600,
                        layers: [
                            { name: "Background", parallaxX: 0, parallaxY: 0 },
                            { name: "Main", parallaxX: 100, parallaxY: 100 },
                            { name: "UI", parallaxX: 0, parallaxY: 0 }
                        ]
                    },
                    {
                        name: "MenuLayout",
                        width: 800,
                        height: 600,
                        layers: [
                            { name: "UI", parallaxX: 0, parallaxY: 0 }
                        ]
                    }
                ]
            },
            eventSheets: {
                items: ["MainEvents", "PlayerEvents"]
            },
            rootFileFolders: {
                script: { items: [] },
                sound: { items: [] },
                music: { items: [] },
                files: { items: [] },
                icon: { items: [] },
                general: { items: [] }
            },
            viewportWidth: 800,
            viewportHeight: 600,
            firstLayout: "MainLayout"
        };
    }

    private generateObjectTypes(gameDef: any): any[] {
        return [
            {
                name: "Player",
                plugin: "Sprite",
                behaviors: ["Platform"],
                instanceVars: [
                    { name: "health", type: "number", initial: 100 },
                    { name: "speed", type: "number", initial: 300 }
                ],
                animations: [
                    { name: "idle", frames: [0], speed: 5, loop: true },
                    { name: "run", frames: [1, 2, 3, 4], speed: 10, loop: true },
                    { name: "jump", frames: [5], speed: 5, loop: false }
                ]
            },
            {
                name: "Enemy",
                plugin: "Sprite",
                behaviors: ["Platform"],
                instanceVars: [
                    { name: "health", type: "number", initial: 30 },
                    { name: "damage", type: "number", initial: 10 }
                ]
            },
            {
                name: "Platform",
                plugin: "Sprite",
                behaviors: ["solid"]
            },
            {
                name: "Bullet",
                plugin: "Sprite",
                behaviors: ["Bullet"],
                instanceVars: [
                    { name: "damage", type: "number", initial: 10 }
                ]
            },
            {
                name: "ScoreText",
                plugin: "Text",
                instanceVars: [
                    { name: "score", type: "number", initial: 0 }
                ]
            }
        ];
    }

    private generateEventSheets(gameDef: any): any[] {
        return [
            {
                name: "MainEvents",
                events: [
                    {
                        type: "comment",
                        text: "System Events"
                    },
                    {
                        type: "event",
                        trigger: { object: "System", condition: "OnLayoutStart" },
                        actions: [
                            { object: "ScoreText", action: "SetText", params: ["Score: 0"] }
                        ]
                    },
                    {
                        type: "event",
                        trigger: { object: "Bullet", condition: "OnCollisionWith", params: ["Enemy"] },
                        actions: [
                            { object: "Enemy", action: "Subtract", params: ["health", "Bullet.damage"] },
                            { object: "Bullet", action: "Destroy" }
                        ],
                        subEvents: [
                            {
                                trigger: { object: "Enemy", condition: "Compare", params: ["health", "<=", 0] },
                                actions: [
                                    { object: "Enemy", action: "Destroy" },
                                    { object: "ScoreText", action: "Add", params: ["score", 10] }
                                ]
                            }
                        ]
                    },
                    {
                        type: "event",
                        trigger: { object: "Player", condition: "OnCollisionWith", params: ["Enemy"] },
                        actions: [
                            { object: "Player", action: "Subtract", params: ["health", "Enemy.damage"] }
                        ],
                        subEvents: [
                            {
                                trigger: { object: "Player", condition: "Compare", params: ["health", "<=", 0] },
                                actions: [
                                    { object: "System", action: "GoToLayout", params: ["MenuLayout"] }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                name: "PlayerEvents",
                events: [
                    {
                        type: "comment",
                        text: "Player Controls"
                    },
                    {
                        type: "event",
                        trigger: { object: "Keyboard", condition: "KeyIsDown", params: ["LeftArrow"] },
                        actions: [
                            { object: "Player", action: "SimulateControl", params: ["Left"] },
                            { object: "Player", action: "SetMirrored", params: [true] }
                        ]
                    },
                    {
                        type: "event",
                        trigger: { object: "Keyboard", condition: "KeyIsDown", params: ["RightArrow"] },
                        actions: [
                            { object: "Player", action: "SimulateControl", params: ["Right"] },
                            { object: "Player", action: "SetMirrored", params: [false] }
                        ]
                    },
                    {
                        type: "event",
                        trigger: { object: "Keyboard", condition: "OnKeyPressed", params: ["Space"] },
                        actions: [
                            { object: "Player", action: "SimulateControl", params: ["Jump"] }
                        ]
                    },
                    {
                        type: "event",
                        trigger: { object: "Mouse", condition: "OnClick", params: ["Left"] },
                        actions: [
                            { object: "System", action: "CreateObject", params: ["Bullet", "Main", "Player.X", "Player.Y"] },
                            { object: "Bullet", action: "SetAngleToPosition", params: ["Mouse.X", "Mouse.Y"] }
                        ]
                    }
                ]
            }
        ];
    }

    generateEventsAsCode(): string {
        return `// Construct 3 Event Sheet Reference
// These events correspond to the visual event sheet

// On Layout Start
function onLayoutStart() {
    ScoreText.text = "Score: 0";
}

// Bullet collision with Enemy
function onBulletHitEnemy(bullet, enemy) {
    enemy.health -= bullet.damage;
    bullet.destroy();
    
    if (enemy.health <= 0) {
        enemy.destroy();
        ScoreText.score += 10;
    }
}

// Player collision with Enemy
function onPlayerHitEnemy(player, enemy) {
    player.health -= enemy.damage;
    
    if (player.health <= 0) {
        goToLayout("MenuLayout");
    }
}

// Player movement
function everyTick() {
    if (keyboard.isDown("LeftArrow")) {
        player.simulateControl("Left");
        player.mirrored = true;
    }
    if (keyboard.isDown("RightArrow")) {
        player.simulateControl("Right");
        player.mirrored = false;
    }
}

// Jump
function onKeyPressed_Space() {
    player.simulateControl("Jump");
}

// Shoot
function onMouseClick_Left() {
    const bullet = createObject("Bullet", "Main", player.x, player.y);
    bullet.setAngleToPosition(mouse.x, mouse.y);
}
`;
    }
}

export const construct3Exporter = Construct3Exporter.getInstance();
