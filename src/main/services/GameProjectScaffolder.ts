/**
 * 🏗️ Game Project Scaffolder
 * 
 * Creates complete game project structures:
 * - Multiple framework support
 * - Full folder structures
 * - Configuration files
 * - Build scripts
 * - Ready-to-run templates
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

export type GameFramework = 'phaser' | 'three' | 'babylon' | 'pixi' | 'kaboom' | 'godot';
export type GameGenre = 'platformer' | 'rpg' | 'shooter' | 'puzzle' | 'racing' | 'strategy' | 'roguelike';

export interface ProjectConfig {
    name: string;
    framework: GameFramework;
    genre: GameGenre;
    features: string[];
    multiplayer: boolean;
    mobile: boolean;
    outputPath: string;
}

export interface GeneratedProject {
    path: string;
    files: string[];
    commands: { install: string; dev: string; build: string };
}

export class GameProjectScaffolder extends EventEmitter {
    private static instance: GameProjectScaffolder;

    private constructor() { super(); }

    static getInstance(): GameProjectScaffolder {
        if (!GameProjectScaffolder.instance) {
            GameProjectScaffolder.instance = new GameProjectScaffolder();
        }
        return GameProjectScaffolder.instance;
    }

    async createProject(config: ProjectConfig): Promise<GeneratedProject> {
        const projectPath = path.join(config.outputPath, config.name);
        const files: string[] = [];

        // Create directory structure
        await this.createDirectories(projectPath);

        // Generate package.json
        files.push(await this.createPackageJson(projectPath, config));

        // Generate config files
        files.push(await this.createTsConfig(projectPath));
        files.push(await this.createViteConfig(projectPath, config));

        // Generate HTML entry
        files.push(await this.createIndexHtml(projectPath, config));

        // Generate main game file
        files.push(await this.createMainGame(projectPath, config));

        // Generate game scenes
        files.push(...await this.createScenes(projectPath, config));

        // Generate player/entities
        files.push(...await this.createEntities(projectPath, config));

        // Generate utilities
        files.push(...await this.createUtilities(projectPath, config));

        // Generate README
        files.push(await this.createReadme(projectPath, config));

        this.emit('projectCreated', { path: projectPath, config });

        return {
            path: projectPath,
            files,
            commands: {
                install: 'npm install',
                dev: 'npm run dev',
                build: 'npm run build'
            }
        };
    }

    private async createDirectories(projectPath: string): Promise<void> {
        const dirs = [
            '',
            'src',
            'src/scenes',
            'src/entities',
            'src/utils',
            'src/assets',
            'src/assets/images',
            'src/assets/sounds',
            'src/assets/fonts',
            'public'
        ];

        for (const dir of dirs) {
            const fullPath = path.join(projectPath, dir);
            if (!fs.existsSync(fullPath)) {
                fs.mkdirSync(fullPath, { recursive: true });
            }
        }
    }

    private async createPackageJson(projectPath: string, config: ProjectConfig): Promise<string> {
        const deps: Record<GameFramework, Record<string, string>> = {
            phaser: { phaser: '^3.70.0' },
            three: { three: '^0.160.0', '@types/three': '^0.160.0' },
            babylon: { '@babylonjs/core': '^6.0.0' },
            pixi: { 'pixi.js': '^8.0.0' },
            kaboom: { kaboom: '^3000.1.0' },
            godot: {}
        };

        const pkg = {
            name: config.name,
            version: '1.0.0',
            type: 'module',
            scripts: {
                dev: 'vite',
                build: 'vite build',
                preview: 'vite preview'
            },
            dependencies: deps[config.framework] || {},
            devDependencies: {
                typescript: '^5.3.0',
                vite: '^5.0.0'
            }
        };

        const filePath = path.join(projectPath, 'package.json');
        fs.writeFileSync(filePath, JSON.stringify(pkg, null, 2));
        return filePath;
    }

    private async createTsConfig(projectPath: string): Promise<string> {
        const tsConfig = {
            compilerOptions: {
                target: 'ES2020',
                useDefineForClassFields: true,
                module: 'ESNext',
                lib: ['ES2020', 'DOM', 'DOM.Iterable'],
                skipLibCheck: true,
                moduleResolution: 'bundler',
                allowImportingTsExtensions: true,
                resolveJsonModule: true,
                isolatedModules: true,
                noEmit: true,
                strict: true,
                noUnusedLocals: true,
                noUnusedParameters: true,
                noFallthroughCasesInSwitch: true
            },
            include: ['src']
        };

        const filePath = path.join(projectPath, 'tsconfig.json');
        fs.writeFileSync(filePath, JSON.stringify(tsConfig, null, 2));
        return filePath;
    }

    private async createViteConfig(projectPath: string, _config: ProjectConfig): Promise<string> {
        const viteConfig = `
import { defineConfig } from 'vite';

export default defineConfig({
    base: './',
    build: {
        outDir: 'dist',
        assetsDir: 'assets'
    },
    server: {
        port: 3000,
        open: true
    }
});
`;
        const filePath = path.join(projectPath, 'vite.config.ts');
        fs.writeFileSync(filePath, viteConfig.trim());
        return filePath;
    }

    private async createIndexHtml(projectPath: string, config: ProjectConfig): Promise<string> {
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.name}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            background: #1a1a2e; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            min-height: 100vh;
            overflow: hidden;
        }
        canvas { display: block; }
    </style>
</head>
<body>
    <script type="module" src="/src/main.ts"></script>
</body>
</html>
`;
        const filePath = path.join(projectPath, 'index.html');
        fs.writeFileSync(filePath, html.trim());
        return filePath;
    }

    private async createMainGame(projectPath: string, config: ProjectConfig): Promise<string> {
        let mainCode = '';

        switch (config.framework) {
            case 'phaser':
                mainCode = this.getPhaserMain(config);
                break;
            case 'kaboom':
                mainCode = this.getKaboomMain(config);
                break;
            default:
                mainCode = this.getPhaserMain(config);
        }

        const filePath = path.join(projectPath, 'src', 'main.ts');
        fs.writeFileSync(filePath, mainCode);
        return filePath;
    }

    private getPhaserMain(config: ProjectConfig): string {
        return `
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';

const gameConfig: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game',
    backgroundColor: '#1a1a2e',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: ${config.genre === 'platformer' ? 800 : 0} },
            debug: false
        }
    },
    scene: [BootScene, MenuScene, GameScene, UIScene],
    pixelArt: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

new Phaser.Game(gameConfig);
`.trim();
    }

    private getKaboomMain(config: ProjectConfig): string {
        return `
import kaboom from 'kaboom';

const k = kaboom({
    width: 800,
    height: 600,
    background: [26, 26, 46],
    scale: 1,
    crisp: true
});

// Load assets
loadSprite('player', 'assets/images/player.png');
loadSprite('enemy', 'assets/images/enemy.png');
loadSprite('tile', 'assets/images/tile.png');

// Game state
let score = 0;
let health = 100;

scene('menu', () => {
    add([
        text('${config.name}', { size: 48 }),
        pos(width() / 2, height() / 3),
        anchor('center')
    ]);

    add([
        text('Press SPACE to Start', { size: 24 }),
        pos(width() / 2, height() / 2),
        anchor('center')
    ]);

    onKeyPress('space', () => go('game'));
});

scene('game', () => {
    const player = add([
        rect(32, 32),
        pos(100, 100),
        area(),
        body(),
        color(0, 255, 100),
        'player'
    ]);

    ${config.genre === 'platformer' ? `
    // Platformer controls
    onKeyDown('left', () => player.move(-200, 0));
    onKeyDown('right', () => player.move(200, 0));
    onKeyPress('up', () => player.jump(400));
    ` : `
    // Top-down controls
    onKeyDown('left', () => player.move(-200, 0));
    onKeyDown('right', () => player.move(200, 0));
    onKeyDown('up', () => player.move(0, -200));
    onKeyDown('down', () => player.move(0, 200));
    `}

    // UI
    const scoreText = add([
        text('Score: 0', { size: 20 }),
        pos(10, 10),
        fixed()
    ]);

    // Spawn enemies
    loop(2, () => {
        add([
            rect(24, 24),
            pos(rand(0, width()), 0),
            area(),
            body(),
            color(255, 0, 100),
            'enemy',
            { speed: rand(50, 150) }
        ]);
    });

    onCollide('player', 'enemy', (_, enemy) => {
        destroy(enemy);
        score += 10;
        scoreText.text = \`Score: \${score}\`;
    });
});

go('menu');
`.trim();
    }

    private async createScenes(projectPath: string, config: ProjectConfig): Promise<string[]> {
        const files: string[] = [];
        const scenesPath = path.join(projectPath, 'src', 'scenes');

        // Boot Scene
        const bootScene = `
import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // Show loading progress
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(240, 270, 320, 50);

        this.load.on('progress', (value: number) => {
            progressBar.clear();
            progressBar.fillStyle(0x00ff00, 1);
            progressBar.fillRect(250, 280, 300 * value, 30);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
        });

        // Load your assets here
        // this.load.image('player', 'assets/images/player.png');
    }

    create() {
        this.scene.start('MenuScene');
    }
}
`;
        fs.writeFileSync(path.join(scenesPath, 'BootScene.ts'), bootScene.trim());
        files.push(path.join(scenesPath, 'BootScene.ts'));

        // Menu Scene
        const menuScene = `
import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        const { width, height } = this.cameras.main;

        // Title
        this.add.text(width / 2, height / 3, '${config.name}', {
            fontSize: '48px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Play button
        const playBtn = this.add.text(width / 2, height / 2, 'PLAY', {
            fontSize: '32px',
            color: '#00ff00',
            fontFamily: 'Arial'
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => playBtn.setColor('#ffff00'))
        .on('pointerout', () => playBtn.setColor('#00ff00'))
        .on('pointerdown', () => this.scene.start('GameScene'));

        // Instructions
        this.add.text(width / 2, height * 0.75, 'Arrow keys to move', {
            fontSize: '18px',
            color: '#888888'
        }).setOrigin(0.5);
    }
}
`;
        fs.writeFileSync(path.join(scenesPath, 'MenuScene.ts'), menuScene.trim());
        files.push(path.join(scenesPath, 'MenuScene.ts'));

        // Game Scene
        const gameScene = this.getGameScene(config);
        fs.writeFileSync(path.join(scenesPath, 'GameScene.ts'), gameScene);
        files.push(path.join(scenesPath, 'GameScene.ts'));

        // UI Scene
        const uiScene = `
import Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
    private scoreText!: Phaser.GameObjects.Text;
    private healthText!: Phaser.GameObjects.Text;
    private score = 0;
    private health = 100;

    constructor() {
        super('UIScene');
    }

    create() {
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '24px',
            color: '#ffffff'
        });

        this.healthText = this.add.text(16, 48, 'Health: 100', {
            fontSize: '24px',
            color: '#ff0000'
        });

        // Listen for game events
        this.scene.get('GameScene').events.on('scoreUpdate', (score: number) => {
            this.score = score;
            this.scoreText.setText(\`Score: \${score}\`);
        });

        this.scene.get('GameScene').events.on('healthUpdate', (health: number) => {
            this.health = health;
            this.healthText.setText(\`Health: \${health}\`);
        });
    }
}
`;
        fs.writeFileSync(path.join(scenesPath, 'UIScene.ts'), uiScene.trim());
        files.push(path.join(scenesPath, 'UIScene.ts'));

        return files;
    }

    private getGameScene(config: ProjectConfig): string {
        if (config.genre === 'platformer') {
            return this.getPlatformerGameScene(config);
        } else if (config.genre === 'rpg') {
            return this.getRPGGameScene(config);
        } else if (config.genre === 'shooter') {
            return this.getShooterGameScene(config);
        }
        return this.getPlatformerGameScene(config);
    }

    private getPlatformerGameScene(_config: ProjectConfig): string {
        return `
import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
    private player!: Phaser.Physics.Arcade.Sprite;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private platforms!: Phaser.Physics.Arcade.StaticGroup;
    private coins!: Phaser.Physics.Arcade.Group;
    private enemies!: Phaser.Physics.Arcade.Group;
    private score = 0;
    private health = 100;

    constructor() {
        super('GameScene');
    }

    create() {
        // Start UI scene
        this.scene.launch('UIScene');

        // Create platforms
        this.platforms = this.physics.add.staticGroup();
        
        // Ground
        const ground = this.add.rectangle(400, 580, 800, 40, 0x4a4a4a);
        this.physics.add.existing(ground, true);
        this.platforms.add(ground);

        // Floating platforms
        for (let i = 0; i < 5; i++) {
            const platform = this.add.rectangle(
                Phaser.Math.Between(100, 700),
                Phaser.Math.Between(200, 500),
                Phaser.Math.Between(80, 200),
                20,
                0x6a6a6a
            );
            this.physics.add.existing(platform, true);
            this.platforms.add(platform);
        }

        // Create player
        this.player = this.physics.add.sprite(100, 450, 'player');
        this.player.setDisplaySize(32, 48);
        this.player.setCollideWorldBounds(true);
        this.player.setBounce(0.1);
        
        // Player graphics (placeholder)
        const playerGraphics = this.add.graphics();
        playerGraphics.fillStyle(0x00ff00);
        playerGraphics.fillRect(-16, -24, 32, 48);
        playerGraphics.generateTexture('player', 32, 48);
        playerGraphics.destroy();
        this.player.setTexture('player');

        // Create coins
        this.coins = this.physics.add.group();
        for (let i = 0; i < 10; i++) {
            const coin = this.add.circle(
                Phaser.Math.Between(50, 750),
                Phaser.Math.Between(100, 500),
                10,
                0xffff00
            ) as unknown as Phaser.Physics.Arcade.Sprite;
            this.physics.add.existing(coin);
            (coin.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
            this.coins.add(coin);
        }

        // Create enemies
        this.enemies = this.physics.add.group();
        for (let i = 0; i < 3; i++) {
            const enemy = this.add.rectangle(
                Phaser.Math.Between(200, 600),
                400,
                24,
                24,
                0xff0000
            ) as unknown as Phaser.Physics.Arcade.Sprite;
            this.physics.add.existing(enemy);
            (enemy as any).direction = 1;
            (enemy as any).speed = Phaser.Math.Between(50, 100);
            this.enemies.add(enemy);
        }

        // Collisions
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.enemies, this.platforms);
        
        this.physics.add.overlap(this.player, this.coins, this.collectCoin, undefined, this);
        this.physics.add.overlap(this.player, this.enemies, this.hitEnemy, undefined, this);

        // Controls
        this.cursors = this.input.keyboard!.createCursorKeys();
    }

    update() {
        // Player movement
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-200);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(200);
        } else {
            this.player.setVelocityX(0);
        }

        // Jump
        if (this.cursors.up.isDown && this.player.body!.touching.down) {
            this.player.setVelocityY(-400);
        }

        // Enemy AI
        this.enemies.getChildren().forEach((enemy: any) => {
            enemy.x += enemy.direction * enemy.speed * 0.016;
            if (enemy.x < 50 || enemy.x > 750) {
                enemy.direction *= -1;
            }
        });
    }

    private collectCoin(_player: any, coin: any) {
        coin.destroy();
        this.score += 10;
        this.events.emit('scoreUpdate', this.score);
        
        // Win condition
        if (this.coins.countActive() === 0) {
            this.add.text(400, 300, 'YOU WIN!', {
                fontSize: '64px',
                color: '#00ff00'
            }).setOrigin(0.5);
            this.physics.pause();
        }
    }

    private hitEnemy(_player: any, _enemy: any) {
        this.health -= 10;
        this.events.emit('healthUpdate', this.health);
        
        // Flash red
        this.cameras.main.flash(100, 255, 0, 0);
        
        if (this.health <= 0) {
            this.add.text(400, 300, 'GAME OVER', {
                fontSize: '64px',
                color: '#ff0000'
            }).setOrigin(0.5);
            this.physics.pause();
        }
    }
}
`.trim();
    }

    private getRPGGameScene(_config: ProjectConfig): string {
        return `
import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
    private player!: Phaser.Physics.Arcade.Sprite;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private npcs!: Phaser.Physics.Arcade.Group;
    private score = 0;
    private health = 100;

    constructor() {
        super('GameScene');
    }

    create() {
        this.scene.launch('UIScene');

        // Create tilemap floor
        for (let x = 0; x < 25; x++) {
            for (let y = 0; y < 19; y++) {
                const color = (x + y) % 2 === 0 ? 0x3a3a3a : 0x4a4a4a;
                this.add.rectangle(x * 32 + 16, y * 32 + 16, 32, 32, color);
            }
        }

        // Create player
        this.player = this.physics.add.sprite(400, 300, 'player');
        this.player.setDisplaySize(32, 32);
        this.player.setCollideWorldBounds(true);
        
        const playerGfx = this.add.graphics();
        playerGfx.fillStyle(0x00ff00);
        playerGfx.fillRect(0, 0, 32, 32);
        playerGfx.generateTexture('player', 32, 32);
        playerGfx.destroy();
        this.player.setTexture('player');

        // Create NPCs
        this.npcs = this.physics.add.group();
        const npcPositions = [
            { x: 200, y: 200, dialog: 'Hello traveler!' },
            { x: 600, y: 400, dialog: 'The dungeon is to the north.' },
            { x: 100, y: 500, dialog: 'I sell potions.' }
        ];

        npcPositions.forEach(pos => {
            const npc = this.add.rectangle(pos.x, pos.y, 32, 32, 0x0088ff) as any;
            this.physics.add.existing(npc);
            (npc.body as Phaser.Physics.Arcade.Body).setImmovable(true);
            npc.dialog = pos.dialog;
            this.npcs.add(npc);
        });

        // Controls
        this.cursors = this.input.keyboard!.createCursorKeys();

        // Interact key
        this.input.keyboard!.on('keydown-SPACE', () => {
            const nearest = this.physics.closest(this.player, this.npcs.getChildren()) as any;
            if (nearest) {
                const dist = Phaser.Math.Distance.Between(
                    this.player.x, this.player.y, nearest.x, nearest.y
                );
                if (dist < 60) {
                    this.showDialog(nearest.dialog);
                }
            }
        });
    }

    update() {
        const speed = 160;
        this.player.setVelocity(0);

        if (this.cursors.left.isDown) this.player.setVelocityX(-speed);
        else if (this.cursors.right.isDown) this.player.setVelocityX(speed);
        
        if (this.cursors.up.isDown) this.player.setVelocityY(-speed);
        else if (this.cursors.down.isDown) this.player.setVelocityY(speed);
    }

    private showDialog(text: string) {
        const dialog = this.add.container(400, 500);
        const bg = this.add.rectangle(0, 0, 600, 100, 0x000000, 0.8);
        const txt = this.add.text(0, 0, text, { fontSize: '20px' }).setOrigin(0.5);
        dialog.add([bg, txt]);
        
        this.time.delayedCall(2000, () => dialog.destroy());
    }
}
`.trim();
    }

    private getShooterGameScene(_config: ProjectConfig): string {
        return `
import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
    private player!: Phaser.Physics.Arcade.Sprite;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private bullets!: Phaser.Physics.Arcade.Group;
    private enemies!: Phaser.Physics.Arcade.Group;
    private score = 0;
    private health = 100;
    private lastFire = 0;

    constructor() {
        super('GameScene');
    }

    create() {
        this.scene.launch('UIScene');

        // Player
        this.player = this.physics.add.sprite(400, 550, 'player');
        this.player.setDisplaySize(40, 40);
        this.player.setCollideWorldBounds(true);
        
        const playerGfx = this.add.graphics();
        playerGfx.fillStyle(0x00ff00);
        playerGfx.fillTriangle(20, 0, 0, 40, 40, 40);
        playerGfx.generateTexture('player', 40, 40);
        playerGfx.destroy();
        this.player.setTexture('player');

        // Bullets
        this.bullets = this.physics.add.group();

        // Enemies
        this.enemies = this.physics.add.group();

        // Spawn enemies
        this.time.addEvent({
            delay: 1000,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });

        // Collisions
        this.physics.add.overlap(this.bullets, this.enemies, this.hitEnemy, undefined, this);
        this.physics.add.overlap(this.player, this.enemies, this.playerHit, undefined, this);

        // Controls
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.input.keyboard!.on('keydown-SPACE', () => this.fire());
    }

    update(time: number) {
        // Movement
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-300);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(300);
        } else {
            this.player.setVelocityX(0);
        }

        // Auto-fire
        if (this.cursors.space?.isDown && time > this.lastFire + 200) {
            this.fire();
            this.lastFire = time;
        }

        // Move enemies
        this.enemies.getChildren().forEach((enemy: any) => {
            enemy.y += 2;
            if (enemy.y > 650) {
                enemy.destroy();
            }
        });

        // Remove off-screen bullets
        this.bullets.getChildren().forEach((bullet: any) => {
            if (bullet.y < -10) bullet.destroy();
        });
    }

    private fire() {
        const bullet = this.add.rectangle(this.player.x, this.player.y - 30, 4, 16, 0xffff00);
        this.physics.add.existing(bullet);
        (bullet.body as Phaser.Physics.Arcade.Body).setVelocityY(-400);
        this.bullets.add(bullet);
    }

    private spawnEnemy() {
        const enemy = this.add.rectangle(
            Phaser.Math.Between(50, 750),
            -20,
            30,
            30,
            0xff0000
        );
        this.physics.add.existing(enemy);
        this.enemies.add(enemy);
    }

    private hitEnemy(bullet: any, enemy: any) {
        bullet.destroy();
        enemy.destroy();
        this.score += 10;
        this.events.emit('scoreUpdate', this.score);
    }

    private playerHit(_player: any, enemy: any) {
        enemy.destroy();
        this.health -= 20;
        this.events.emit('healthUpdate', this.health);
        this.cameras.main.shake(100, 0.01);
        
        if (this.health <= 0) {
            this.add.text(400, 300, 'GAME OVER', {
                fontSize: '64px', color: '#ff0000'
            }).setOrigin(0.5);
            this.physics.pause();
        }
    }
}
`.trim();
    }

    private async createEntities(projectPath: string, config: ProjectConfig): Promise<string[]> {
        const files: string[] = [];
        const entitiesPath = path.join(projectPath, 'src', 'entities');

        // Player entity
        const player = `
export interface PlayerState {
    x: number;
    y: number;
    health: number;
    maxHealth: number;
    speed: number;
    jumpForce: number;
    score: number;
    inventory: string[];
}

export const createDefaultPlayer = (): PlayerState => ({
    x: 100,
    y: 450,
    health: 100,
    maxHealth: 100,
    speed: 200,
    jumpForce: ${config.genre === 'platformer' ? 400 : 0},
    score: 0,
    inventory: []
});
`;
        fs.writeFileSync(path.join(entitiesPath, 'Player.ts'), player.trim());
        files.push(path.join(entitiesPath, 'Player.ts'));

        return files;
    }

    private async createUtilities(projectPath: string, _config: ProjectConfig): Promise<string[]> {
        const files: string[] = [];
        const utilsPath = path.join(projectPath, 'src', 'utils');

        // Game utilities
        const utils = `
export const clamp = (value: number, min: number, max: number): number => 
    Math.max(min, Math.min(max, value));

export const lerp = (start: number, end: number, t: number): number => 
    start + (end - start) * t;

export const randomBetween = (min: number, max: number): number => 
    min + Math.random() * (max - min);

export const randomInt = (min: number, max: number): number => 
    Math.floor(randomBetween(min, max + 1));

export const distanceBetween = (
    x1: number, y1: number, 
    x2: number, y2: number
): number => 
    Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

export const angleBetween = (
    x1: number, y1: number, 
    x2: number, y2: number
): number => 
    Math.atan2(y2 - y1, x2 - x1);
`;
        fs.writeFileSync(path.join(utilsPath, 'helpers.ts'), utils.trim());
        files.push(path.join(utilsPath, 'helpers.ts'));

        return files;
    }

    private async createReadme(projectPath: string, config: ProjectConfig): Promise<string> {
        const readme = `
# ${config.name}

A ${config.genre} game built with ${config.framework}.

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Controls

- Arrow keys: Move
- Space: ${config.genre === 'shooter' ? 'Shoot' : 'Jump/Interact'}

## Features

${config.features.map(f => `- ${f}`).join('\n')}

## Built With

- ${config.framework}
- TypeScript
- Vite
`;
        const filePath = path.join(projectPath, 'README.md');
        fs.writeFileSync(filePath, readme.trim());
        return filePath;
    }
}

export const gameProjectScaffolder = GameProjectScaffolder.getInstance();
