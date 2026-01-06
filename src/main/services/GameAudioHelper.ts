/**
 * Game Audio Helper Service
 * 
 * Audio system templates and code for games:
 * - Sound manager patterns
 * - Music systems
 * - Spatial audio
 * - Audio pooling
 */

import { EventEmitter } from 'events';

export interface SoundConfig {
    volume: number;
    loop: boolean;
    pitch: number;
    spatialBlend: number;  // 0 = 2D, 1 = 3D
}

export class GameAudioHelper extends EventEmitter {
    private static instance: GameAudioHelper;

    private constructor() { super(); }

    static getInstance(): GameAudioHelper {
        if (!GameAudioHelper.instance) {
            GameAudioHelper.instance = new GameAudioHelper();
        }
        return GameAudioHelper.instance;
    }

    // ========================================================================
    // CODE GENERATION
    // ========================================================================

    generateAudioManagerCode(engine: 'web' | 'unity' | 'godot'): string {
        switch (engine) {
            case 'unity': return this.generateUnityAudio();
            case 'godot': return this.generateGodotAudio();
            default: return this.generateWebAudio();
        }
    }

    private generateWebAudio(): string {
        return `
// Web Audio API Manager
class AudioManager {
    constructor() {
        this.context = new AudioContext();
        this.sounds = new Map();
        this.music = null;
        this.masterVolume = 1.0;
        this.sfxVolume = 1.0;
        this.musicVolume = 0.7;
        
        // Master gain node
        this.masterGain = this.context.createGain();
        this.masterGain.connect(this.context.destination);
        
        // SFX and Music channels
        this.sfxGain = this.context.createGain();
        this.musicGain = this.context.createGain();
        this.sfxGain.connect(this.masterGain);
        this.musicGain.connect(this.masterGain);
    }
    
    async loadSound(name, url) {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
        this.sounds.set(name, audioBuffer);
    }
    
    play(name, options = {}) {
        const buffer = this.sounds.get(name);
        if (!buffer) return null;
        
        const source = this.context.createBufferSource();
        source.buffer = buffer;
        
        // Create gain for this sound
        const gainNode = this.context.createGain();
        gainNode.gain.value = (options.volume ?? 1.0) * this.sfxVolume;
        
        source.connect(gainNode);
        gainNode.connect(this.sfxGain);
        
        source.loop = options.loop ?? false;
        source.playbackRate.value = options.pitch ?? 1.0;
        
        source.start(0);
        return source;
    }
    
    playMusic(name, fadeIn = 1.0) {
        if (this.music) {
            this.fadeOut(this.music, 0.5);
        }
        
        const buffer = this.sounds.get(name);
        if (!buffer) return;
        
        this.music = this.context.createBufferSource();
        this.music.buffer = buffer;
        this.music.loop = true;
        
        const gainNode = this.context.createGain();
        gainNode.gain.value = 0;
        
        this.music.connect(gainNode);
        gainNode.connect(this.musicGain);
        
        this.music.start(0);
        
        // Fade in
        gainNode.gain.linearRampToValueAtTime(
            this.musicVolume,
            this.context.currentTime + fadeIn
        );
    }
    
    fadeOut(source, duration) {
        if (!source) return;
        
        const gainNode = this.context.createGain();
        gainNode.gain.linearRampToValueAtTime(0, this.context.currentTime + duration);
        
        setTimeout(() => source.stop(), duration * 1000);
    }
    
    setMasterVolume(volume) {
        this.masterVolume = volume;
        this.masterGain.gain.value = volume;
    }
    
    setSfxVolume(volume) {
        this.sfxVolume = volume;
        this.sfxGain.gain.value = volume;
    }
    
    setMusicVolume(volume) {
        this.musicVolume = volume;
        this.musicGain.gain.value = volume;
    }
}

// Sound Pool for frequently played sounds
class SoundPool {
    constructor(audioManager, soundName, poolSize = 5) {
        this.audioManager = audioManager;
        this.soundName = soundName;
        this.pool = [];
        this.currentIndex = 0;
        
        for (let i = 0; i < poolSize; i++) {
            this.pool.push(null);
        }
    }
    
    play(options = {}) {
        // Stop the oldest sound if it's still playing
        if (this.pool[this.currentIndex]) {
            try {
                this.pool[this.currentIndex].stop();
            } catch (e) {}
        }
        
        this.pool[this.currentIndex] = this.audioManager.play(this.soundName, options);
        this.currentIndex = (this.currentIndex + 1) % this.pool.length;
    }
}

// Usage
const audio = new AudioManager();

// Load sounds
await audio.loadSound('shoot', 'assets/sounds/shoot.wav');
await audio.loadSound('explosion', 'assets/sounds/explosion.wav');
await audio.loadSound('bgMusic', 'assets/music/background.mp3');

// Create pool for rapid fire sounds
const shootPool = new SoundPool(audio, 'shoot', 10);

// Play
shootPool.play({ volume: 0.5 });
audio.playMusic('bgMusic');`;
    }

    private generateUnityAudio(): string {
        return `
// Unity Audio Manager
using UnityEngine;
using System.Collections.Generic;

public class AudioManager : MonoBehaviour {
    public static AudioManager Instance { get; private set; }
    
    [Header("Audio Sources")]
    public AudioSource musicSource;
    public AudioSource sfxSource;
    
    [Header("Settings")]
    [Range(0, 1)] public float masterVolume = 1f;
    [Range(0, 1)] public float musicVolume = 0.7f;
    [Range(0, 1)] public float sfxVolume = 1f;
    
    [Header("Sound Library")]
    public SoundClip[] sounds;
    private Dictionary<string, AudioClip> soundDict;
    
    [System.Serializable]
    public class SoundClip {
        public string name;
        public AudioClip clip;
    }
    
    void Awake() {
        if (Instance == null) {
            Instance = this;
            DontDestroyOnLoad(gameObject);
            InitializeSounds();
        } else {
            Destroy(gameObject);
        }
    }
    
    void InitializeSounds() {
        soundDict = new Dictionary<string, AudioClip>();
        foreach (var sound in sounds) {
            soundDict[sound.name] = sound.clip;
        }
    }
    
    public void PlaySFX(string name, float volumeMultiplier = 1f) {
        if (soundDict.TryGetValue(name, out AudioClip clip)) {
            sfxSource.PlayOneShot(clip, sfxVolume * masterVolume * volumeMultiplier);
        }
    }
    
    public void PlaySFX3D(string name, Vector3 position, float volumeMultiplier = 1f) {
        if (soundDict.TryGetValue(name, out AudioClip clip)) {
            AudioSource.PlayClipAtPoint(clip, position, sfxVolume * masterVolume * volumeMultiplier);
        }
    }
    
    public void PlayMusic(string name, float fadeTime = 1f) {
        if (soundDict.TryGetValue(name, out AudioClip clip)) {
            StartCoroutine(CrossfadeMusic(clip, fadeTime));
        }
    }
    
    System.Collections.IEnumerator CrossfadeMusic(AudioClip newClip, float fadeTime) {
        float startVolume = musicSource.volume;
        
        // Fade out
        while (musicSource.volume > 0) {
            musicSource.volume -= startVolume * Time.deltaTime / fadeTime;
            yield return null;
        }
        
        musicSource.clip = newClip;
        musicSource.Play();
        
        // Fade in
        while (musicSource.volume < musicVolume * masterVolume) {
            musicSource.volume += musicVolume * Time.deltaTime / fadeTime;
            yield return null;
        }
    }
    
    public void SetMasterVolume(float volume) {
        masterVolume = volume;
        UpdateVolumes();
    }
    
    void UpdateVolumes() {
        musicSource.volume = musicVolume * masterVolume;
    }
}

// Usage:
// AudioManager.Instance.PlaySFX("shoot");
// AudioManager.Instance.PlayMusic("battleTheme");`;
    }

    private generateGodotAudio(): string {
        return `
# Godot Audio Manager
extends Node

var music_player: AudioStreamPlayer
var sfx_players: Array = []
var sfx_pool_size: int = 8

var master_volume: float = 1.0
var music_volume: float = 0.7
var sfx_volume: float = 1.0

var sounds: Dictionary = {}

func _ready():
    # Create music player
    music_player = AudioStreamPlayer.new()
    add_child(music_player)
    
    # Create SFX pool
    for i in range(sfx_pool_size):
        var player = AudioStreamPlayer.new()
        add_child(player)
        sfx_players.append(player)

func load_sound(name: String, path: String):
    sounds[name] = load(path)

func play_sfx(name: String, volume_mult: float = 1.0):
    if not sounds.has(name):
        return
    
    # Find available player
    for player in sfx_players:
        if not player.playing:
            player.stream = sounds[name]
            player.volume_db = linear_to_db(sfx_volume * master_volume * volume_mult)
            player.play()
            return
    
    # All busy, use first one
    sfx_players[0].stream = sounds[name]
    sfx_players[0].volume_db = linear_to_db(sfx_volume * master_volume * volume_mult)
    sfx_players[0].play()

func play_sfx_3d(name: String, position: Vector3, volume_mult: float = 1.0):
    if not sounds.has(name):
        return
    
    var player = AudioStreamPlayer3D.new()
    player.stream = sounds[name]
    player.global_position = position
    player.volume_db = linear_to_db(sfx_volume * master_volume * volume_mult)
    get_tree().root.add_child(player)
    player.play()
    
    # Auto cleanup
    player.finished.connect(func(): player.queue_free())

func play_music(name: String, fade_time: float = 1.0):
    if not sounds.has(name):
        return
    
    var tween = create_tween()
    
    # Fade out current
    if music_player.playing:
        tween.tween_property(music_player, "volume_db", -80.0, fade_time / 2)
        await tween.finished
    
    # Change and fade in
    music_player.stream = sounds[name]
    music_player.volume_db = -80.0
    music_player.play()
    
    var target_db = linear_to_db(music_volume * master_volume)
    tween = create_tween()
    tween.tween_property(music_player, "volume_db", target_db, fade_time / 2)

func set_master_volume(volume: float):
    master_volume = volume
    _update_volumes()

func set_music_volume(volume: float):
    music_volume = volume
    _update_volumes()

func set_sfx_volume(volume: float):
    sfx_volume = volume

func _update_volumes():
    music_player.volume_db = linear_to_db(music_volume * master_volume)

# Usage:
# AudioManager.load_sound("shoot", "res://sounds/shoot.wav")
# AudioManager.play_sfx("shoot")
# AudioManager.play_music("battle_theme")`;
    }

    // ========================================================================
    // SPATIAL AUDIO HELPERS
    // ========================================================================

    generateSpatialAudioCode(): string {
        return `
// Spatial Audio Helper
class SpatialAudio {
    constructor(audioContext, listener) {
        this.context = audioContext;
        this.listener = listener;
        
        // Set up listener position
        if (this.context.listener.positionX) {
            this.context.listener.positionX.value = 0;
            this.context.listener.positionY.value = 0;
            this.context.listener.positionZ.value = 0;
        }
    }
    
    updateListenerPosition(x, y, z = 0) {
        if (this.context.listener.positionX) {
            this.context.listener.positionX.value = x;
            this.context.listener.positionY.value = y;
            this.context.listener.positionZ.value = z;
        }
    }
    
    createSpatialSound(buffer, x, y, z = 0) {
        const source = this.context.createBufferSource();
        source.buffer = buffer;
        
        const panner = this.context.createPanner();
        panner.panningModel = 'HRTF';
        panner.distanceModel = 'inverse';
        panner.refDistance = 1;
        panner.maxDistance = 100;
        panner.rolloffFactor = 1;
        panner.coneInnerAngle = 360;
        panner.coneOuterAngle = 0;
        panner.coneOuterGain = 0;
        
        panner.positionX.value = x;
        panner.positionY.value = y;
        panner.positionZ.value = z;
        
        source.connect(panner);
        panner.connect(this.context.destination);
        
        return { source, panner };
    }
    
    // Calculate volume falloff based on distance
    calculateVolume(listenerX, listenerY, soundX, soundY, maxDistance = 100) {
        const dx = soundX - listenerX;
        const dy = soundY - listenerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > maxDistance) return 0;
        return 1 - (distance / maxDistance);
    }
    
    // Calculate stereo pan based on position
    calculatePan(listenerX, soundX, maxPanDistance = 50) {
        const dx = soundX - listenerX;
        return Math.max(-1, Math.min(1, dx / maxPanDistance));
    }
}

// Simple 2D spatial audio for games without Web Audio API
class Simple2DAudio {
    constructor() {
        this.listenerX = 0;
        this.listenerY = 0;
    }
    
    setListenerPosition(x, y) {
        this.listenerX = x;
        this.listenerY = y;
    }
    
    playAt(audio, x, y, maxDistance = 500) {
        const volume = this.calculateVolume(x, y, maxDistance);
        const pan = this.calculatePan(x);
        
        audio.volume = volume;
        
        // Stereo panning using Web Audio
        if (audio.pan) {
            audio.pan.value = pan;
        }
        
        audio.play();
    }
    
    calculateVolume(x, y, maxDistance) {
        const dx = x - this.listenerX;
        const dy = y - this.listenerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return Math.max(0, 1 - distance / maxDistance);
    }
    
    calculatePan(x) {
        const dx = x - this.listenerX;
        return Math.max(-1, Math.min(1, dx / 200));
    }
}`;
    }
}

export const gameAudioHelper = GameAudioHelper.getInstance();
