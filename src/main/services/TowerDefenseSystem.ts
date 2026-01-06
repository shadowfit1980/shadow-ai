/**
 * 🗼 Tower Defense System
 * 
 * Tower defense mechanics:
 * - Tower placement
 * - Wave spawning
 * - Path following
 * - Upgrades
 */

import { EventEmitter } from 'events';

export interface Tower {
    id: string;
    type: string;
    x: number;
    y: number;
    level: number;
    range: number;
    damage: number;
    fireRate: number;
}

export class TowerDefenseSystem extends EventEmitter {
    private static instance: TowerDefenseSystem;

    private constructor() { super(); }

    static getInstance(): TowerDefenseSystem {
        if (!TowerDefenseSystem.instance) {
            TowerDefenseSystem.instance = new TowerDefenseSystem();
        }
        return TowerDefenseSystem.instance;
    }

    generateTowerDefenseCode(): string {
        return `
class TowerDefense {
    constructor(config = {}) {
        this.gridWidth = config.gridWidth || 20;
        this.gridHeight = config.gridHeight || 15;
        this.cellSize = config.cellSize || 40;
        
        this.towers = [];
        this.enemies = [];
        this.projectiles = [];
        this.path = [];
        
        this.gold = 100;
        this.lives = 20;
        this.wave = 0;
        this.waveActive = false;
        
        this.towerTypes = new Map();
        this.enemyTypes = new Map();
        
        this.setupDefaultTypes();
    }

    setupDefaultTypes() {
        this.registerTower('arrow', {
            name: 'Arrow Tower',
            cost: 50,
            range: 150,
            damage: 10,
            fireRate: 1,
            projectileSpeed: 300,
            upgrades: [
                { cost: 75, damage: 15, range: 175 },
                { cost: 150, damage: 25, range: 200 }
            ]
        });

        this.registerTower('cannon', {
            name: 'Cannon Tower',
            cost: 100,
            range: 100,
            damage: 30,
            fireRate: 0.5,
            splash: 50,
            projectileSpeed: 200,
            upgrades: [
                { cost: 150, damage: 50, splash: 70 },
                { cost: 300, damage: 80, splash: 100 }
            ]
        });

        this.registerTower('slow', {
            name: 'Frost Tower',
            cost: 75,
            range: 120,
            damage: 5,
            fireRate: 2,
            slowAmount: 0.5,
            slowDuration: 2,
            projectileSpeed: 250
        });

        this.registerEnemy('basic', {
            name: 'Goblin',
            health: 50,
            speed: 60,
            reward: 10
        });

        this.registerEnemy('fast', {
            name: 'Wolf',
            health: 30,
            speed: 120,
            reward: 15
        });

        this.registerEnemy('tank', {
            name: 'Ogre',
            health: 200,
            speed: 40,
            reward: 30
        });
    }

    registerTower(id, def) {
        this.towerTypes.set(id, def);
    }

    registerEnemy(id, def) {
        this.enemyTypes.set(id, def);
    }

    setPath(waypoints) {
        this.path = waypoints;
    }

    canPlaceTower(gridX, gridY) {
        // Check bounds
        if (gridX < 0 || gridX >= this.gridWidth || gridY < 0 || gridY >= this.gridHeight) {
            return false;
        }
        
        // Check if on path
        for (const wp of this.path) {
            if (Math.floor(wp.x / this.cellSize) === gridX && 
                Math.floor(wp.y / this.cellSize) === gridY) {
                return false;
            }
        }
        
        // Check if tower exists
        return !this.towers.some(t => t.gridX === gridX && t.gridY === gridY);
    }

    placeTower(type, gridX, gridY) {
        if (!this.canPlaceTower(gridX, gridY)) return false;
        
        const def = this.towerTypes.get(type);
        if (!def || this.gold < def.cost) return false;
        
        this.gold -= def.cost;
        
        const tower = {
            id: 'tower_' + Date.now(),
            type,
            gridX, gridY,
            x: gridX * this.cellSize + this.cellSize / 2,
            y: gridY * this.cellSize + this.cellSize / 2,
            level: 0,
            cooldown: 0,
            ...def
        };
        
        this.towers.push(tower);
        this.onTowerPlaced?.(tower);
        return true;
    }

    upgradeTower(towerId) {
        const tower = this.towers.find(t => t.id === towerId);
        if (!tower) return false;
        
        const def = this.towerTypes.get(tower.type);
        if (!def.upgrades || tower.level >= def.upgrades.length) return false;
        
        const upgrade = def.upgrades[tower.level];
        if (this.gold < upgrade.cost) return false;
        
        this.gold -= upgrade.cost;
        tower.level++;
        Object.assign(tower, upgrade);
        
        this.onTowerUpgraded?.(tower);
        return true;
    }

    sellTower(towerId) {
        const idx = this.towers.findIndex(t => t.id === towerId);
        if (idx === -1) return false;
        
        const tower = this.towers[idx];
        const def = this.towerTypes.get(tower.type);
        const refund = Math.floor(def.cost * 0.7);
        
        this.gold += refund;
        this.towers.splice(idx, 1);
        
        return true;
    }

    startWave(waveConfig) {
        this.wave++;
        this.waveActive = true;
        this.spawnQueue = [...waveConfig];
        this.spawnTimer = 0;
        this.spawnInterval = 1;
        
        this.onWaveStart?.(this.wave);
    }

    spawnEnemy(type) {
        const def = this.enemyTypes.get(type);
        if (!def) return;
        
        const enemy = {
            id: 'enemy_' + Date.now() + Math.random(),
            type,
            x: this.path[0].x,
            y: this.path[0].y,
            pathIndex: 0,
            health: def.health,
            maxHealth: def.health,
            speed: def.speed,
            reward: def.reward,
            slowTimer: 0
        };
        
        this.enemies.push(enemy);
    }

    update(dt) {
        this.updateSpawning(dt);
        this.updateEnemies(dt);
        this.updateTowers(dt);
        this.updateProjectiles(dt);
        
        // Check wave complete
        if (this.waveActive && this.enemies.length === 0 && this.spawnQueue.length === 0) {
            this.waveActive = false;
            this.onWaveComplete?.(this.wave);
        }
    }

    updateSpawning(dt) {
        if (this.spawnQueue.length === 0) return;
        
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            this.spawnEnemy(this.spawnQueue.shift());
            this.spawnTimer = this.spawnInterval;
        }
    }

    updateEnemies(dt) {
        this.enemies = this.enemies.filter(enemy => {
            // Slow effect
            let speed = enemy.speed;
            if (enemy.slowTimer > 0) {
                speed *= 0.5;
                enemy.slowTimer -= dt;
            }
            
            // Move along path
            const target = this.path[enemy.pathIndex];
            if (!target) {
                this.lives--;
                this.onLifeLost?.();
                if (this.lives <= 0) this.onGameOver?.();
                return false;
            }
            
            const dx = target.x - enemy.x;
            const dy = target.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < speed * dt) {
                enemy.pathIndex++;
            } else {
                enemy.x += (dx / dist) * speed * dt;
                enemy.y += (dy / dist) * speed * dt;
            }
            
            return true;
        });
    }

    updateTowers(dt) {
        for (const tower of this.towers) {
            tower.cooldown -= dt;
            if (tower.cooldown > 0) continue;
            
            // Find target
            const target = this.findTarget(tower);
            if (!target) continue;
            
            // Fire projectile
            this.projectiles.push({
                x: tower.x,
                y: tower.y,
                targetId: target.id,
                speed: tower.projectileSpeed || 300,
                damage: tower.damage,
                splash: tower.splash,
                slowAmount: tower.slowAmount,
                slowDuration: tower.slowDuration
            });
            
            tower.cooldown = 1 / tower.fireRate;
        }
    }

    findTarget(tower) {
        let closest = null;
        let closestDist = tower.range;
        
        for (const enemy of this.enemies) {
            const dist = Math.hypot(enemy.x - tower.x, enemy.y - tower.y);
            if (dist < closestDist) {
                closestDist = dist;
                closest = enemy;
            }
        }
        
        return closest;
    }

    updateProjectiles(dt) {
        this.projectiles = this.projectiles.filter(proj => {
            const target = this.enemies.find(e => e.id === proj.targetId);
            if (!target) return false;
            
            const dx = target.x - proj.x;
            const dy = target.y - proj.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < proj.speed * dt) {
                this.hitEnemy(target, proj);
                return false;
            }
            
            proj.x += (dx / dist) * proj.speed * dt;
            proj.y += (dy / dist) * proj.speed * dt;
            return true;
        });
    }

    hitEnemy(enemy, proj) {
        const targets = proj.splash 
            ? this.enemies.filter(e => Math.hypot(e.x - enemy.x, e.y - enemy.y) < proj.splash)
            : [enemy];
        
        for (const target of targets) {
            target.health -= proj.damage;
            if (proj.slowDuration) target.slowTimer = proj.slowDuration;
            
            if (target.health <= 0) {
                this.gold += target.reward;
                this.enemies = this.enemies.filter(e => e.id !== target.id);
                this.onEnemyKilled?.(target);
            }
        }
    }

    // Callbacks
    onTowerPlaced = null;
    onTowerUpgraded = null;
    onWaveStart = null;
    onWaveComplete = null;
    onEnemyKilled = null;
    onLifeLost = null;
    onGameOver = null;
}`;
    }
}

export const towerDefenseSystem = TowerDefenseSystem.getInstance();
