/**
 * 🧩 Puzzle Generator
 * 
 * Puzzle game mechanics:
 * - Match-3
 * - Sliding puzzles
 * - Logic puzzles
 * - Sudoku generation
 */

import { EventEmitter } from 'events';

export type PuzzleType = 'match3' | 'sliding' | 'jigsaw' | 'sudoku' | 'word';

export class PuzzleGenerator extends EventEmitter {
    private static instance: PuzzleGenerator;

    private constructor() { super(); }

    static getInstance(): PuzzleGenerator {
        if (!PuzzleGenerator.instance) {
            PuzzleGenerator.instance = new PuzzleGenerator();
        }
        return PuzzleGenerator.instance;
    }

    getPuzzleTypes(): PuzzleType[] {
        return ['match3', 'sliding', 'jigsaw', 'sudoku', 'word'];
    }

    generatePuzzleCode(): string {
        return `
// ========== MATCH-3 PUZZLE ==========
class Match3Game {
    constructor(cols = 8, rows = 8, types = 6) {
        this.cols = cols;
        this.rows = rows;
        this.types = types;
        this.grid = [];
        this.score = 0;
        this.selected = null;
        this.animating = false;
        
        this.init();
    }

    init() {
        // Create grid without initial matches
        do {
            this.grid = Array(this.rows).fill(null).map(() =>
                Array(this.cols).fill(null).map(() => ({
                    type: Math.floor(Math.random() * this.types),
                    falling: false,
                    matched: false
                }))
            );
        } while (this.findMatches().length > 0);
    }

    select(col, row) {
        if (this.animating) return;

        if (this.selected) {
            // Try swap
            if (this.isAdjacent(this.selected, { col, row })) {
                this.swap(this.selected.col, this.selected.row, col, row);
                
                const matches = this.findMatches();
                if (matches.length === 0) {
                    // Swap back
                    this.swap(this.selected.col, this.selected.row, col, row);
                } else {
                    this.resolveMatches(matches);
                }
            }
            this.selected = null;
        } else {
            this.selected = { col, row };
        }
    }

    isAdjacent(a, b) {
        return (Math.abs(a.col - b.col) === 1 && a.row === b.row) ||
               (Math.abs(a.row - b.row) === 1 && a.col === b.col);
    }

    swap(c1, r1, c2, r2) {
        const temp = this.grid[r1][c1];
        this.grid[r1][c1] = this.grid[r2][c2];
        this.grid[r2][c2] = temp;
    }

    findMatches() {
        const matches = [];

        // Horizontal
        for (let r = 0; r < this.rows; r++) {
            let count = 1;
            for (let c = 1; c <= this.cols; c++) {
                if (c < this.cols && this.grid[r][c].type === this.grid[r][c-1].type) {
                    count++;
                } else {
                    if (count >= 3) {
                        for (let i = c - count; i < c; i++) {
                            matches.push({ col: i, row: r });
                        }
                    }
                    count = 1;
                }
            }
        }

        // Vertical
        for (let c = 0; c < this.cols; c++) {
            let count = 1;
            for (let r = 1; r <= this.rows; r++) {
                if (r < this.rows && this.grid[r][c].type === this.grid[r-1][c].type) {
                    count++;
                } else {
                    if (count >= 3) {
                        for (let i = r - count; i < r; i++) {
                            matches.push({ col: c, row: i });
                        }
                    }
                    count = 1;
                }
            }
        }

        return matches;
    }

    resolveMatches(matches) {
        this.animating = true;

        // Mark matched
        for (const m of matches) {
            this.grid[m.row][m.col].matched = true;
        }
        this.score += matches.length * 10;

        // Fall and refill
        setTimeout(() => {
            this.applyGravity();
            this.fillEmpty();
            
            const newMatches = this.findMatches();
            if (newMatches.length > 0) {
                this.resolveMatches(newMatches);
            } else {
                this.animating = false;
            }
        }, 300);
    }

    applyGravity() {
        for (let c = 0; c < this.cols; c++) {
            let writeRow = this.rows - 1;
            for (let r = this.rows - 1; r >= 0; r--) {
                if (!this.grid[r][c].matched) {
                    this.grid[writeRow][c] = this.grid[r][c];
                    writeRow--;
                }
            }
            while (writeRow >= 0) {
                this.grid[writeRow][c] = { type: -1, matched: true };
                writeRow--;
            }
        }
    }

    fillEmpty() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.grid[r][c].matched) {
                    this.grid[r][c] = {
                        type: Math.floor(Math.random() * this.types),
                        matched: false,
                        falling: true
                    };
                }
            }
        }
    }

    render(ctx, cellSize = 50, colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff']) {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = this.grid[r][c];
                const x = c * cellSize + cellSize / 2;
                const y = r * cellSize + cellSize / 2;

                ctx.fillStyle = colors[cell.type] || '#888';
                ctx.beginPath();
                ctx.arc(x, y, cellSize * 0.4, 0, Math.PI * 2);
                ctx.fill();

                if (this.selected && this.selected.col === c && this.selected.row === r) {
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 3;
                    ctx.stroke();
                }
            }
        }
    }
}

// ========== SLIDING PUZZLE ==========
class SlidingPuzzle {
    constructor(size = 4) {
        this.size = size;
        this.tiles = [];
        this.emptyPos = { x: size - 1, y: size - 1 };
        this.moves = 0;
        this.won = false;
        
        this.init();
    }

    init() {
        // Create solved state
        for (let i = 0; i < this.size * this.size - 1; i++) {
            this.tiles.push(i + 1);
        }
        this.tiles.push(0); // Empty

        // Shuffle with valid moves
        for (let i = 0; i < 100; i++) {
            const neighbors = this.getValidMoves();
            const move = neighbors[Math.floor(Math.random() * neighbors.length)];
            this.swapWithEmpty(move.x, move.y);
        }
        this.moves = 0;
    }

    getValidMoves() {
        const moves = [];
        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        
        for (const [dx, dy] of dirs) {
            const nx = this.emptyPos.x + dx;
            const ny = this.emptyPos.y + dy;
            if (nx >= 0 && nx < this.size && ny >= 0 && ny < this.size) {
                moves.push({ x: nx, y: ny });
            }
        }
        return moves;
    }

    click(x, y) {
        if (this.won) return;

        // Check if adjacent to empty
        const dx = Math.abs(x - this.emptyPos.x);
        const dy = Math.abs(y - this.emptyPos.y);

        if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
            this.swapWithEmpty(x, y);
            this.moves++;
            this.checkWin();
        }
    }

    swapWithEmpty(x, y) {
        const emptyIdx = this.emptyPos.y * this.size + this.emptyPos.x;
        const tileIdx = y * this.size + x;
        
        [this.tiles[emptyIdx], this.tiles[tileIdx]] = [this.tiles[tileIdx], this.tiles[emptyIdx]];
        this.emptyPos = { x, y };
    }

    checkWin() {
        for (let i = 0; i < this.tiles.length - 1; i++) {
            if (this.tiles[i] !== i + 1) return;
        }
        this.won = true;
    }

    render(ctx, tileSize = 80) {
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                const tile = this.tiles[y * this.size + x];
                const px = x * tileSize;
                const py = y * tileSize;

                if (tile === 0) continue;

                ctx.fillStyle = this.won ? '#00aa00' : '#3366ff';
                ctx.fillRect(px + 2, py + 2, tileSize - 4, tileSize - 4);

                ctx.fillStyle = '#fff';
                ctx.font = 'bold 24px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(tile.toString(), px + tileSize / 2, py + tileSize / 2);
            }
        }
    }
}`;
    }
}

export const puzzleGenerator = PuzzleGenerator.getInstance();
