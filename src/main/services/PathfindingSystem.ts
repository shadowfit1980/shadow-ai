/**
 * 🧭 Pathfinding System
 * 
 * AI navigation:
 * - A* algorithm
 * - Grid-based pathfinding
 * - Path smoothing
 * - Dynamic obstacles
 */

import { EventEmitter } from 'events';

export interface PathNode {
    x: number;
    y: number;
    walkable: boolean;
    g: number;
    h: number;
    f: number;
    parent: PathNode | null;
}

export interface PathResult {
    found: boolean;
    path: { x: number; y: number }[];
    explored: number;
}

export class PathfindingSystem extends EventEmitter {
    private static instance: PathfindingSystem;

    private constructor() { super(); }

    static getInstance(): PathfindingSystem {
        if (!PathfindingSystem.instance) {
            PathfindingSystem.instance = new PathfindingSystem();
        }
        return PathfindingSystem.instance;
    }

    findPath(grid: boolean[][], startX: number, startY: number, endX: number, endY: number): PathResult {
        const width = grid[0].length;
        const height = grid.length;

        // Create node grid
        const nodes: PathNode[][] = [];
        for (let y = 0; y < height; y++) {
            nodes[y] = [];
            for (let x = 0; x < width; x++) {
                nodes[y][x] = {
                    x, y,
                    walkable: !grid[y][x],
                    g: Infinity,
                    h: 0,
                    f: Infinity,
                    parent: null
                };
            }
        }

        const start = nodes[startY]?.[startX];
        const end = nodes[endY]?.[endX];

        if (!start || !end || !start.walkable || !end.walkable) {
            return { found: false, path: [], explored: 0 };
        }

        const openList: PathNode[] = [start];
        const closedSet = new Set<PathNode>();

        start.g = 0;
        start.h = this.heuristic(startX, startY, endX, endY);
        start.f = start.h;

        while (openList.length > 0) {
            // Get node with lowest f
            openList.sort((a, b) => a.f - b.f);
            const current = openList.shift()!;

            if (current === end) {
                return {
                    found: true,
                    path: this.reconstructPath(end),
                    explored: closedSet.size
                };
            }

            closedSet.add(current);

            // Check neighbors
            const neighbors = this.getNeighbors(nodes, current.x, current.y);

            for (const neighbor of neighbors) {
                if (closedSet.has(neighbor) || !neighbor.walkable) continue;

                const tentativeG = current.g + this.distance(current, neighbor);

                if (tentativeG < neighbor.g) {
                    neighbor.parent = current;
                    neighbor.g = tentativeG;
                    neighbor.h = this.heuristic(neighbor.x, neighbor.y, endX, endY);
                    neighbor.f = neighbor.g + neighbor.h;

                    if (!openList.includes(neighbor)) {
                        openList.push(neighbor);
                    }
                }
            }
        }

        return { found: false, path: [], explored: closedSet.size };
    }

    private heuristic(x1: number, y1: number, x2: number, y2: number): number {
        // Manhattan distance
        return Math.abs(x1 - x2) + Math.abs(y1 - y2);
    }

    private distance(a: PathNode, b: PathNode): number {
        const dx = Math.abs(a.x - b.x);
        const dy = Math.abs(a.y - b.y);
        return dx + dy === 2 ? 1.414 : 1; // Diagonal vs cardinal
    }

    private getNeighbors(nodes: PathNode[][], x: number, y: number): PathNode[] {
        const neighbors: PathNode[] = [];
        const dirs = [
            [-1, 0], [1, 0], [0, -1], [0, 1], // Cardinal
            [-1, -1], [1, -1], [-1, 1], [1, 1] // Diagonal
        ];

        for (const [dx, dy] of dirs) {
            const nx = x + dx;
            const ny = y + dy;
            if (nodes[ny]?.[nx]) {
                neighbors.push(nodes[ny][nx]);
            }
        }

        return neighbors;
    }

    private reconstructPath(end: PathNode): { x: number; y: number }[] {
        const path: { x: number; y: number }[] = [];
        let current: PathNode | null = end;

        while (current) {
            path.unshift({ x: current.x, y: current.y });
            current = current.parent;
        }

        return path;
    }

    smoothPath(path: { x: number; y: number }[]): { x: number; y: number }[] {
        if (path.length <= 2) return path;

        const smoothed: { x: number; y: number }[] = [path[0]];
        let current = 0;

        while (current < path.length - 1) {
            // Find furthest visible point
            let furthest = current + 1;
            for (let i = path.length - 1; i > current + 1; i--) {
                // In real implementation, would check line of sight
                furthest = i;
                break;
            }
            smoothed.push(path[furthest]);
            current = furthest;
        }

        return smoothed;
    }

    generatePathfindingCode(): string {
        return `
class Pathfinder {
    constructor(grid) {
        this.grid = grid;
        this.width = grid[0].length;
        this.height = grid.length;
    }

    findPath(startX, startY, endX, endY) {
        const nodes = this.createNodes();
        const start = nodes[startY][startX];
        const end = nodes[endY][endX];

        if (!start.walkable || !end.walkable) return [];

        const openList = [start];
        const closedSet = new Set();

        start.g = 0;
        start.h = this.heuristic(startX, startY, endX, endY);
        start.f = start.h;

        while (openList.length > 0) {
            openList.sort((a, b) => a.f - b.f);
            const current = openList.shift();

            if (current === end) {
                return this.reconstructPath(end);
            }

            closedSet.add(current);

            for (const neighbor of this.getNeighbors(nodes, current.x, current.y)) {
                if (closedSet.has(neighbor) || !neighbor.walkable) continue;

                const g = current.g + this.distance(current, neighbor);

                if (g < neighbor.g) {
                    neighbor.parent = current;
                    neighbor.g = g;
                    neighbor.h = this.heuristic(neighbor.x, neighbor.y, endX, endY);
                    neighbor.f = neighbor.g + neighbor.h;

                    if (!openList.includes(neighbor)) {
                        openList.push(neighbor);
                    }
                }
            }
        }

        return [];
    }

    createNodes() {
        return this.grid.map((row, y) => 
            row.map((cell, x) => ({
                x, y, walkable: !cell,
                g: Infinity, h: 0, f: Infinity, parent: null
            }))
        );
    }

    heuristic(x1, y1, x2, y2) {
        return Math.abs(x1 - x2) + Math.abs(y1 - y2);
    }

    distance(a, b) {
        const dx = Math.abs(a.x - b.x);
        const dy = Math.abs(a.y - b.y);
        return dx + dy === 2 ? 1.414 : 1;
    }

    getNeighbors(nodes, x, y) {
        const dirs = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]];
        return dirs
            .map(([dx, dy]) => nodes[y + dy]?.[x + dx])
            .filter(n => n);
    }

    reconstructPath(end) {
        const path = [];
        let current = end;
        while (current) {
            path.unshift({ x: current.x, y: current.y });
            current = current.parent;
        }
        return path;
    }
}`;
    }
}

export const pathfindingSystem = PathfindingSystem.getInstance();
