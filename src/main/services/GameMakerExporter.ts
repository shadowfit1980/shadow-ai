/**
 * 🎮 GameMaker Exporter
 * 
 * Export to GameMaker GML:
 * - Object scripts
 * - Room definitions
 * - Sprite placeholders
 */

import { EventEmitter } from 'events';

export class GameMakerExporter extends EventEmitter {
    private static instance: GameMakerExporter;

    private constructor() { super(); }

    static getInstance(): GameMakerExporter {
        if (!GameMakerExporter.instance) {
            GameMakerExporter.instance = new GameMakerExporter();
        }
        return GameMakerExporter.instance;
    }

    exportToGameMaker(gameDef: any): { objects: any[]; rooms: any[]; scripts: any[] } {
        return {
            objects: this.generateObjects(gameDef),
            rooms: this.generateRooms(gameDef),
            scripts: this.generateScripts(gameDef)
        };
    }

    private generateObjects(gameDef: any): any[] {
        return [
            { name: 'obj_player', events: this.generatePlayerEvents() },
            { name: 'obj_enemy', events: this.generateEnemyEvents() },
            { name: 'obj_game', events: this.generateGameEvents() }
        ];
    }

    private generatePlayerEvents(): any[] {
        return [
            {
                event: 'Create',
                code: `/// @description Initialize player

// Movement
spd = 4;
jump_spd = 12;
grav = 0.5;
hspd = 0;
vspd = 0;

// State
grounded = false;
can_jump = true;
health = 100;
max_health = 100;

// Animation
image_speed = 0.5;
facing = 1;
`
            },
            {
                event: 'Step',
                code: `/// @description Player movement and physics

// Get input
var move_input = keyboard_check(vk_right) - keyboard_check(vk_left);

// Horizontal movement
hspd = move_input * spd;

// Update facing direction
if (move_input != 0) {
    facing = sign(move_input);
    image_xscale = facing;
}

// Gravity
if (!grounded) {
    vspd += grav;
}

// Check ground
grounded = place_meeting(x, y + 1, obj_solid);

// Jump
if (grounded && keyboard_check_pressed(vk_space)) {
    vspd = -jump_spd;
    grounded = false;
}

// Horizontal collision
if (place_meeting(x + hspd, y, obj_solid)) {
    while (!place_meeting(x + sign(hspd), y, obj_solid)) {
        x += sign(hspd);
    }
    hspd = 0;
}
x += hspd;

// Vertical collision
if (place_meeting(x, y + vspd, obj_solid)) {
    while (!place_meeting(x, y + sign(vspd), obj_solid)) {
        y += sign(vspd);
    }
    vspd = 0;
}
y += vspd;
`
            }
        ];
    }

    private generateEnemyEvents(): any[] {
        return [
            {
                event: 'Create',
                code: `/// @description Initialize enemy

spd = 2;
direction_facing = 1;
health = 3;
detection_range = 150;
attack_cooldown = 0;

state = "patrol";
`
            },
            {
                event: 'Step',
                code: `/// @description Enemy AI

// Cooldowns
if (attack_cooldown > 0) attack_cooldown--;

// State machine
switch (state) {
    case "patrol":
        // Move back and forth
        x += spd * direction_facing;
        
        // Turn at walls
        if (place_meeting(x + (16 * direction_facing), y, obj_solid)) {
            direction_facing *= -1;
        }
        
        // Detect player
        if (instance_exists(obj_player)) {
            var dist = point_distance(x, y, obj_player.x, obj_player.y);
            if (dist < detection_range) {
                state = "chase";
            }
        }
        break;
        
    case "chase":
        if (instance_exists(obj_player)) {
            // Move toward player
            direction_facing = sign(obj_player.x - x);
            x += spd * 1.5 * direction_facing;
            
            // Attack if close
            var dist = point_distance(x, y, obj_player.x, obj_player.y);
            if (dist < 30 && attack_cooldown <= 0) {
                state = "attack";
            }
            
            // Lose player
            if (dist > detection_range * 1.5) {
                state = "patrol";
            }
        }
        break;
        
    case "attack":
        if (attack_cooldown <= 0) {
            // Deal damage
            if (instance_exists(obj_player)) {
                obj_player.health -= 10;
            }
            attack_cooldown = 60;
            state = "chase";
        }
        break;
}

// Face direction
image_xscale = direction_facing;
`
            }
        ];
    }

    private generateGameEvents(): any[] {
        return [
            {
                event: 'Create',
                code: `/// @description Game controller initialization

global.score = 0;
global.level = 1;
global.game_over = false;

// Camera setup
camera = camera_create();
var view_w = 800;
var view_h = 600;
camera_set_view_size(camera, view_w, view_h);
view_camera[0] = camera;
`
            },
            {
                event: 'Step',
                code: `/// @description Game logic

// Camera follow player
if (instance_exists(obj_player)) {
    var cam_x = obj_player.x - camera_get_view_width(camera) / 2;
    var cam_y = obj_player.y - camera_get_view_height(camera) / 2;
    
    camera_set_view_pos(camera, cam_x, cam_y);
}

// Check game over
if (instance_exists(obj_player)) {
    if (obj_player.health <= 0) {
        global.game_over = true;
        room_goto(rm_gameover);
    }
}
`
            },
            {
                event: 'Draw GUI',
                code: `/// @description Draw HUD

draw_set_color(c_white);
draw_set_font(-1);

// Score
draw_text(10, 10, "Score: " + string(global.score));

// Health bar
if (instance_exists(obj_player)) {
    var health_pct = obj_player.health / obj_player.max_health;
    draw_set_color(c_dkgray);
    draw_rectangle(10, 40, 210, 60, false);
    draw_set_color(c_red);
    draw_rectangle(10, 40, 10 + (200 * health_pct), 60, false);
}
`
            }
        ];
    }

    private generateRooms(gameDef: any): any[] {
        return [{
            name: 'rm_game',
            width: 1600,
            height: 900,
            instances: [
                { object: 'obj_player', x: 100, y: 400 },
                { object: 'obj_game', x: 0, y: 0 },
                { object: 'obj_enemy', x: 400, y: 400 },
                { object: 'obj_enemy', x: 800, y: 400 }
            ]
        }];
    }

    private generateScripts(gameDef: any): any[] {
        return [{
            name: 'scr_utils',
            code: `/// @function approach(current, target, amount)
/// @description Move current toward target by amount
function approach(current, target, amount) {
    if (current < target) {
        return min(current + amount, target);
    } else {
        return max(current - amount, target);
    }
}

/// @function wave(from, to, duration, offset)
/// @description Sine wave oscillation
function wave(from, to, duration, offset) {
    var a4 = (to - from) * 0.5;
    return from + a4 + sin((((current_time * 0.001) + duration * offset) / duration) * (pi * 2)) * a4;
}
`
        }];
    }
}

export const gameMakerExporter = GameMakerExporter.getInstance();
