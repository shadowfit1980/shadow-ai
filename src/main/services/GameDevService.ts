/**
 * Game Development Service
 * 
 * Multi-language game development support:
 * - Python (pygame, arcade, pyglet)
 * - JavaScript/TypeScript (Phaser, Three.js, Babylon.js)
 * - C# (Unity)
 * - C++ (Unreal, custom engines)
 * - GDScript (Godot)
 * 
 * Provides templates, code generation, and project scaffolding.
 */

import { EventEmitter } from 'events';

export type Language = 'python' | 'javascript' | 'typescript' | 'csharp' | 'cpp' | 'gdscript' | 'java';
export type Framework = 'pygame' | 'arcade' | 'phaser' | 'threejs' | 'babylonjs' | 'unity' | 'unreal' | 'godot' | 'libgdx' | 'custom';

export interface GameTemplate {
    name: string;
    language: Language;
    framework: Framework;
    files: TemplateFile[];
    dependencies: string[];
}

export interface TemplateFile {
    path: string;
    content: string;
}

export class GameDevService extends EventEmitter {
    private static instance: GameDevService;

    private constructor() { super(); }

    static getInstance(): GameDevService {
        if (!GameDevService.instance) {
            GameDevService.instance = new GameDevService();
        }
        return GameDevService.instance;
    }

    // ========================================================================
    // PYTHON GAME TEMPLATES
    // ========================================================================

    getPygameTemplate(): GameTemplate {
        return {
            name: 'Pygame Starter',
            language: 'python',
            framework: 'pygame',
            dependencies: ['pygame', 'numpy'],
            files: [
                {
                    path: 'main.py',
                    content: `#!/usr/bin/env python3
"""
Pygame Game Template
A simple game loop with sprite handling.
"""

import pygame
import sys

# Initialize Pygame
pygame.init()

# Constants
SCREEN_WIDTH = 800
SCREEN_HEIGHT = 600
FPS = 60

# Colors
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
RED = (255, 0, 0)
GREEN = (0, 255, 0)
BLUE = (0, 0, 255)


class Player(pygame.sprite.Sprite):
    """Player sprite class."""
    
    def __init__(self, x: int, y: int):
        super().__init__()
        self.image = pygame.Surface((50, 50))
        self.image.fill(BLUE)
        self.rect = self.image.get_rect(center=(x, y))
        self.velocity = pygame.math.Vector2(0, 0)
        self.speed = 5
    
    def update(self, keys):
        """Update player position based on input."""
        self.velocity.x = 0
        self.velocity.y = 0
        
        if keys[pygame.K_LEFT] or keys[pygame.K_a]:
            self.velocity.x = -self.speed
        if keys[pygame.K_RIGHT] or keys[pygame.K_d]:
            self.velocity.x = self.speed
        if keys[pygame.K_UP] or keys[pygame.K_w]:
            self.velocity.y = -self.speed
        if keys[pygame.K_DOWN] or keys[pygame.K_s]:
            self.velocity.y = self.speed
        
        self.rect.x += self.velocity.x
        self.rect.y += self.velocity.y
        
        # Keep player on screen
        self.rect.clamp_ip(pygame.Rect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT))


class Game:
    """Main game class."""
    
    def __init__(self):
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        pygame.display.set_caption("Pygame Game")
        self.clock = pygame.time.Clock()
        self.running = True
        
        # Sprites
        self.all_sprites = pygame.sprite.Group()
        self.player = Player(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2)
        self.all_sprites.add(self.player)
    
    def handle_events(self):
        """Handle pygame events."""
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    self.running = False
    
    def update(self):
        """Update game state."""
        keys = pygame.key.get_pressed()
        self.player.update(keys)
    
    def render(self):
        """Render the game."""
        self.screen.fill(BLACK)
        self.all_sprites.draw(self.screen)
        pygame.display.flip()
    
    def run(self):
        """Main game loop."""
        while self.running:
            self.handle_events()
            self.update()
            self.render()
            self.clock.tick(FPS)
        
        pygame.quit()
        sys.exit()


if __name__ == "__main__":
    game = Game()
    game.run()
`,
                },
                {
                    path: 'requirements.txt',
                    content: `pygame>=2.0.0
numpy>=1.20.0
`,
                },
            ],
        };
    }

    // ========================================================================
    // PHASER (JavaScript) GAME TEMPLATES
    // ========================================================================

    getPhaserTemplate(): GameTemplate {
        return {
            name: 'Phaser 3 Starter',
            language: 'typescript',
            framework: 'phaser',
            dependencies: ['phaser'],
            files: [
                {
                    path: 'src/main.ts',
                    content: `/**
 * Phaser 3 Game Template
 */

import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { MenuScene } from './scenes/MenuScene';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300, x: 0 },
            debug: false
        }
    },
    scene: [MenuScene, GameScene]
};

export class Game extends Phaser.Game {
    constructor() {
        super(config);
    }
}

window.addEventListener('load', () => {
    new Game();
});
`,
                },
                {
                    path: 'src/scenes/GameScene.ts',
                    content: `/**
 * Main Game Scene
 */

import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
    private player!: Phaser.Physics.Arcade.Sprite;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private score = 0;
    private scoreText!: Phaser.GameObjects.Text;

    constructor() {
        super({ key: 'GameScene' });
    }

    preload(): void {
        // Create a simple colored rectangle as player sprite
        const graphics = this.make.graphics({ x: 0, y: 0 });
        graphics.fillStyle(0x4a90d9);
        graphics.fillRect(0, 0, 32, 48);
        graphics.generateTexture('player', 32, 48);
        graphics.destroy();
    }

    create(): void {
        // Create player
        this.player = this.physics.add.sprite(400, 300, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setBounce(0.2);

        // Setup input
        this.cursors = this.input.keyboard!.createCursorKeys();

        // Score text
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '32px',
            color: '#fff'
        });
    }

    update(): void {
        // Player movement
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-200);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(200);
        } else {
            this.player.setVelocityX(0);
        }

        if (this.cursors.up.isDown && this.player.body!.touching.down) {
            this.player.setVelocityY(-400);
        }
    }
}
`,
                },
                {
                    path: 'src/scenes/MenuScene.ts',
                    content: `/**
 * Menu Scene
 */

import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create(): void {
        const { width, height } = this.scale;

        // Title
        this.add.text(width / 2, height / 3, 'GAME TITLE', {
            fontSize: '64px',
            color: '#fff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Start button
        const startButton = this.add.text(width / 2, height / 2, 'START GAME', {
            fontSize: '32px',
            color: '#4a90d9',
            backgroundColor: '#fff',
            padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

        startButton.on('pointerdown', () => {
            this.scene.start('GameScene');
        });

        startButton.on('pointerover', () => {
            startButton.setStyle({ color: '#fff', backgroundColor: '#4a90d9' });
        });

        startButton.on('pointerout', () => {
            startButton.setStyle({ color: '#4a90d9', backgroundColor: '#fff' });
        });
    }
}
`,
                },
                {
                    path: 'package.json',
                    content: `{
  "name": "phaser-game",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "dependencies": {
    "phaser": "^3.70.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  }
}
`,
                },
            ],
        };
    }

    // ========================================================================
    // THREE.JS TEMPLATE
    // ========================================================================

    getThreeJsTemplate(): GameTemplate {
        return {
            name: 'Three.js 3D Game',
            language: 'typescript',
            framework: 'threejs',
            dependencies: ['three', '@types/three'],
            files: [
                {
                    path: 'src/main.ts',
                    content: `/**
 * Three.js 3D Game Template
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

class Game3D {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private controls: OrbitControls;
    private player: THREE.Mesh;

    constructor() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 5, 10);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.body.appendChild(this.renderer.domElement);

        // Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;

        // Lighting
        this.setupLighting();

        // Ground
        this.createGround();

        // Player
        this.player = this.createPlayer();
        this.scene.add(this.player);

        // Events
        window.addEventListener('resize', this.onResize.bind(this));
        window.addEventListener('keydown', this.onKeyDown.bind(this));

        // Start animation
        this.animate();
    }

    private setupLighting(): void {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
    }

    private createGround(): void {
        const geometry = new THREE.PlaneGeometry(20, 20);
        const material = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const ground = new THREE.Mesh(geometry, material);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
    }

    private createPlayer(): THREE.Mesh {
        const geometry = new THREE.BoxGeometry(1, 2, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0x4a90d9 });
        const player = new THREE.Mesh(geometry, material);
        player.position.y = 1;
        player.castShadow = true;
        return player;
    }

    private onResize(): void {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    private onKeyDown(event: KeyboardEvent): void {
        const speed = 0.5;
        switch (event.key) {
            case 'w': this.player.position.z -= speed; break;
            case 's': this.player.position.z += speed; break;
            case 'a': this.player.position.x -= speed; break;
            case 'd': this.player.position.x += speed; break;
            case ' ': this.player.position.y += speed; break;
        }
    }

    private animate(): void {
        requestAnimationFrame(this.animate.bind(this));
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

new Game3D();
`,
                },
            ],
        };
    }

    // ========================================================================
    // GODOT/GDSCRIPT TEMPLATE
    // ========================================================================

    getGodotTemplate(): GameTemplate {
        return {
            name: 'Godot Platformer',
            language: 'gdscript',
            framework: 'godot',
            dependencies: [],
            files: [
                {
                    path: 'Player.gd',
                    content: `extends CharacterBody2D

const SPEED = 300.0
const JUMP_VELOCITY = -400.0
const GRAVITY = 980.0

func _physics_process(delta):
    # Add gravity
    if not is_on_floor():
        velocity.y += GRAVITY * delta
    
    # Handle jump
    if Input.is_action_just_pressed("jump") and is_on_floor():
        velocity.y = JUMP_VELOCITY
    
    # Handle horizontal movement
    var direction = Input.get_axis("move_left", "move_right")
    if direction:
        velocity.x = direction * SPEED
    else:
        velocity.x = move_toward(velocity.x, 0, SPEED)
    
    move_and_slide()
    
    # Flip sprite based on direction
    if velocity.x < 0:
        $Sprite2D.flip_h = true
    elif velocity.x > 0:
        $Sprite2D.flip_h = false
`,
                },
                {
                    path: 'Main.gd',
                    content: `extends Node2D

var score = 0

func _ready():
    print("Game started!")

func add_score(points: int):
    score += points
    $UI/ScoreLabel.text = "Score: " + str(score)

func _on_player_died():
    get_tree().reload_current_scene()
`,
                },
            ],
        };
    }

    // ========================================================================
    // UNITY C# TEMPLATE
    // ========================================================================

    getUnityTemplate(): GameTemplate {
        return {
            name: 'Unity Player Controller',
            language: 'csharp',
            framework: 'unity',
            dependencies: [],
            files: [
                {
                    path: 'Scripts/PlayerController.cs',
                    content: `using UnityEngine;

[RequireComponent(typeof(CharacterController))]
public class PlayerController : MonoBehaviour
{
    [Header("Movement")]
    public float moveSpeed = 5f;
    public float jumpForce = 8f;
    public float gravity = -20f;

    [Header("Ground Check")]
    public Transform groundCheck;
    public float groundDistance = 0.4f;
    public LayerMask groundMask;

    private CharacterController controller;
    private Vector3 velocity;
    private bool isGrounded;

    void Start()
    {
        controller = GetComponent<CharacterController>();
    }

    void Update()
    {
        // Ground check
        isGrounded = Physics.CheckSphere(groundCheck.position, groundDistance, groundMask);

        if (isGrounded && velocity.y < 0)
        {
            velocity.y = -2f;
        }

        // Movement input
        float horizontal = Input.GetAxis("Horizontal");
        float vertical = Input.GetAxis("Vertical");

        Vector3 move = transform.right * horizontal + transform.forward * vertical;
        controller.Move(move * moveSpeed * Time.deltaTime);

        // Jump
        if (Input.GetButtonDown("Jump") && isGrounded)
        {
            velocity.y = Mathf.Sqrt(jumpForce * -2f * gravity);
        }

        // Apply gravity
        velocity.y += gravity * Time.deltaTime;
        controller.Move(velocity * Time.deltaTime);
    }
}
`,
                },
                {
                    path: 'Scripts/GameManager.cs',
                    content: `using UnityEngine;
using UnityEngine.SceneManagement;

public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }

    public int score = 0;
    public bool isPaused = false;

    void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }
        else
        {
            Destroy(gameObject);
        }
    }

    public void AddScore(int points)
    {
        score += points;
        Debug.Log($"Score: {score}");
    }

    public void TogglePause()
    {
        isPaused = !isPaused;
        Time.timeScale = isPaused ? 0f : 1f;
    }

    public void RestartGame()
    {
        score = 0;
        Time.timeScale = 1f;
        SceneManager.LoadScene(SceneManager.GetActiveScene().buildIndex);
    }

    public void LoadLevel(string levelName)
    {
        SceneManager.LoadScene(levelName);
    }
}
`,
                },
            ],
        };
    }

    // ========================================================================
    // JAVA (LibGDX) TEMPLATE
    // ========================================================================

    getLibGDXTemplate(): GameTemplate {
        return {
            name: 'LibGDX Game',
            language: 'java',
            framework: 'libgdx',
            dependencies: ['libgdx', 'libgdx-box2d'],
            files: [
                {
                    path: 'core/src/com/mygame/MyGame.java',
                    content: `package com.mygame;

import com.badlogic.gdx.ApplicationAdapter;
import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.Input;
import com.badlogic.gdx.graphics.GL20;
import com.badlogic.gdx.graphics.OrthographicCamera;
import com.badlogic.gdx.graphics.glutils.ShapeRenderer;

public class MyGame extends ApplicationAdapter {
    private OrthographicCamera camera;
    private ShapeRenderer shapeRenderer;
    
    private float playerX = 400;
    private float playerY = 300;
    private float playerSpeed = 200;

    @Override
    public void create() {
        camera = new OrthographicCamera();
        camera.setToOrtho(false, 800, 600);
        shapeRenderer = new ShapeRenderer();
    }

    @Override
    public void render() {
        float delta = Gdx.graphics.getDeltaTime();
        
        // Input handling
        if (Gdx.input.isKeyPressed(Input.Keys.LEFT)) {
            playerX -= playerSpeed * delta;
        }
        if (Gdx.input.isKeyPressed(Input.Keys.RIGHT)) {
            playerX += playerSpeed * delta;
        }
        if (Gdx.input.isKeyPressed(Input.Keys.UP)) {
            playerY += playerSpeed * delta;
        }
        if (Gdx.input.isKeyPressed(Input.Keys.DOWN)) {
            playerY -= playerSpeed * delta;
        }
        
        // Rendering
        Gdx.gl.glClearColor(0.1f, 0.1f, 0.2f, 1);
        Gdx.gl.glClear(GL20.GL_COLOR_BUFFER_BIT);
        
        camera.update();
        shapeRenderer.setProjectionMatrix(camera.combined);
        
        shapeRenderer.begin(ShapeRenderer.ShapeType.Filled);
        shapeRenderer.setColor(0.3f, 0.5f, 0.9f, 1);
        shapeRenderer.rect(playerX - 25, playerY - 25, 50, 50);
        shapeRenderer.end();
    }

    @Override
    public void dispose() {
        shapeRenderer.dispose();
    }
}
`,
                },
            ],
        };
    }

    // ========================================================================
    // UTILITY METHODS
    // ========================================================================

    getAvailableFrameworks(): { language: Language; frameworks: Framework[] }[] {
        return [
            { language: 'python', frameworks: ['pygame', 'arcade'] },
            { language: 'javascript', frameworks: ['phaser', 'threejs', 'babylonjs'] },
            { language: 'typescript', frameworks: ['phaser', 'threejs', 'babylonjs'] },
            { language: 'csharp', frameworks: ['unity'] },
            { language: 'cpp', frameworks: ['unreal', 'custom'] },
            { language: 'gdscript', frameworks: ['godot'] },
            { language: 'java', frameworks: ['libgdx'] },
        ];
    }

    getTemplate(framework: Framework): GameTemplate | null {
        switch (framework) {
            case 'pygame': return this.getPygameTemplate();
            case 'phaser': return this.getPhaserTemplate();
            case 'threejs': return this.getThreeJsTemplate();
            case 'godot': return this.getGodotTemplate();
            case 'unity': return this.getUnityTemplate();
            case 'libgdx': return this.getLibGDXTemplate();
            default: return null;
        }
    }

    getInstallCommand(framework: Framework): string {
        const commands: Record<Framework, string> = {
            'pygame': 'pip install pygame numpy pillow',
            'arcade': 'pip install arcade numpy',
            'phaser': 'npm install phaser',
            'threejs': 'npm install three',
            'babylonjs': 'npm install @babylonjs/core',
            'unity': 'Download Unity Hub from unity.com',
            'unreal': 'Download from unrealengine.com',
            'godot': 'Download from godotengine.org',
            'libgdx': 'Use gdx-setup tool from libgdx.com',
            'custom': 'No specific installation required',
        };
        return commands[framework];
    }
}

export const gameDevService = GameDevService.getInstance();
