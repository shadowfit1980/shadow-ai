/**
 * 🌍 Multi-Engine Exporter
 * 
 * Export games to multiple engines:
 * - Phaser → Godot
 * - Phaser → Unity
 * - Generic scene export
 */

import { EventEmitter } from 'events';

export type ExportEngine = 'godot' | 'unity' | 'gamemaker' | 'construct';

export interface SceneData {
    name: string;
    width: number;
    height: number;
    entities: EntityData[];
    layers: string[];
}

export interface EntityData {
    name: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    properties: Record<string, any>;
}

export class MultiEngineExporter extends EventEmitter {
    private static instance: MultiEngineExporter;

    private constructor() { super(); }

    static getInstance(): MultiEngineExporter {
        if (!MultiEngineExporter.instance) {
            MultiEngineExporter.instance = new MultiEngineExporter();
        }
        return MultiEngineExporter.instance;
    }

    // ========================================================================
    // EXPORT TO GODOT
    // ========================================================================

    exportToGodot(scene: SceneData): string {
        const nodes: string[] = [];

        // Root node
        nodes.push(`[node name="${scene.name}" type="Node2D"]`);

        // Entities
        scene.entities.forEach((entity, index) => {
            const nodeName = entity.name.replace(/\s/g, '_');

            if (entity.type === 'sprite') {
                nodes.push(`
[node name="${nodeName}" type="Sprite2D" parent="."]
position = Vector2(${entity.x}, ${entity.y})
`);
            } else if (entity.type === 'collider') {
                nodes.push(`
[node name="${nodeName}" type="StaticBody2D" parent="."]
position = Vector2(${entity.x}, ${entity.y})

[node name="CollisionShape2D" type="CollisionShape2D" parent="${nodeName}"]
shape = RectangleShape2D.new()
`);
            } else if (entity.type === 'player') {
                nodes.push(`
[node name="${nodeName}" type="CharacterBody2D" parent="."]
position = Vector2(${entity.x}, ${entity.y})

[node name="Sprite2D" type="Sprite2D" parent="${nodeName}"]

[node name="CollisionShape2D" type="CollisionShape2D" parent="${nodeName}"]
`);
            }
        });

        return `[gd_scene format=3]

${nodes.join('\n')}
`;
    }

    exportToGodotScript(entityType: string): string {
        if (entityType === 'player') {
            return `
extends CharacterBody2D

@export var speed = 200.0
@export var jump_velocity = -400.0

var gravity = ProjectSettings.get_setting("physics/2d/default_gravity")

func _physics_process(delta):
    if not is_on_floor():
        velocity.y += gravity * delta

    if Input.is_action_just_pressed("jump") and is_on_floor():
        velocity.y = jump_velocity

    var direction = Input.get_axis("move_left", "move_right")
    if direction:
        velocity.x = direction * speed
    else:
        velocity.x = move_toward(velocity.x, 0, speed)

    move_and_slide()
`;
        }
        return '';
    }

    // ========================================================================
    // EXPORT TO UNITY
    // ========================================================================

    exportToUnity(scene: SceneData): string {
        const gameObjects: string[] = [];

        scene.entities.forEach(entity => {
            const className = entity.name.replace(/\s/g, '');

            gameObjects.push(`
    // ${entity.name}
    GameObject ${className.toLowerCase()} = new GameObject("${entity.name}");
    ${className.toLowerCase()}.transform.position = new Vector3(${entity.x / 100}f, ${-entity.y / 100}f, 0);
    ${entity.type === 'sprite' ? `${className.toLowerCase()}.AddComponent<SpriteRenderer>();` : ''}
    ${entity.type === 'collider' ? `${className.toLowerCase()}.AddComponent<BoxCollider2D>();` : ''}
`);
        });

        return `
using UnityEngine;

public class ${scene.name.replace(/\s/g, '')}SceneGenerator : MonoBehaviour
{
    void Start()
    {
${gameObjects.join('\n')}
    }
}
`;
    }

    exportToUnityPlayerScript(): string {
        return `
using UnityEngine;

public class PlayerController : MonoBehaviour
{
    public float speed = 5f;
    public float jumpForce = 10f;
    
    private Rigidbody2D rb;
    private bool isGrounded;

    void Start()
    {
        rb = GetComponent<Rigidbody2D>();
    }

    void Update()
    {
        float moveX = Input.GetAxis("Horizontal");
        rb.velocity = new Vector2(moveX * speed, rb.velocity.y);

        if (Input.GetButtonDown("Jump") && isGrounded)
        {
            rb.velocity = new Vector2(rb.velocity.x, jumpForce);
            isGrounded = false;
        }
    }

    void OnCollisionEnter2D(Collision2D collision)
    {
        if (collision.gameObject.CompareTag("Ground"))
        {
            isGrounded = true;
        }
    }
}
`;
    }

    // ========================================================================
    // EXPORT TO GAMEMAKER
    // ========================================================================

    exportToGameMaker(scene: SceneData): string {
        const instances: string[] = [];

        scene.entities.forEach((entity, i) => {
            instances.push(`{
    "name": "inst_${i}",
    "path": "rooms/${scene.name}/${scene.name}.yy",
    "x": ${entity.x},
    "y": ${entity.y},
    "objectId": {
        "name": "obj_${entity.type}",
        "path": "objects/obj_${entity.type}/obj_${entity.type}.yy"
    }
}`);
        });

        return `{
    "$GMRoom": "",
    "name": "${scene.name}",
    "roomSettings": {
        "Width": ${scene.width},
        "Height": ${scene.height}
    },
    "instances": [
        ${instances.join(',\n        ')}
    ]
}`;
    }

    // ========================================================================
    // UNIVERSAL EXPORT
    // ========================================================================

    exportToEngine(scene: SceneData, engine: ExportEngine): string {
        switch (engine) {
            case 'godot':
                return this.exportToGodot(scene);
            case 'unity':
                return this.exportToUnity(scene);
            case 'gamemaker':
                return this.exportToGameMaker(scene);
            default:
                return JSON.stringify(scene, null, 2);
        }
    }

    getSupportedEngines(): ExportEngine[] {
        return ['godot', 'unity', 'gamemaker', 'construct'];
    }
}

export const multiEngineExporter = MultiEngineExporter.getInstance();
